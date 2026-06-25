// eai_call.ts — helper Deno standalone para chamar a API EAÍ
// Copie para uma edge function ou para /tmp via code--copy.
//
// Variáveis de ambiente esperadas:
//   EAI_BASE_URL          default: https://api.eai.net.br
//   EAI_OAUTH_URL         default: https://api.eai.net.br/oauth2/token
//   EAI_CLIENT_ID         obrigatório
//   EAI_CLIENT_SECRET     obrigatório
//   EAI_COMPANY_TOKEN     obrigatório (vai como header X-Company-Token)

type TokenCache = { token: string; expiresAt: number } | null;
let tokenCache: TokenCache = null;

function env(name: string, fallback?: string): string {
  const v = Deno.env.get(name) ?? fallback;
  if (!v) throw new Error(`[eai] missing env var: ${name}`);
  return v;
}

async function getAccessToken(force = false): Promise<string> {
  const now = Date.now();
  if (!force && tokenCache && tokenCache.expiresAt > now + 5_000) {
    return tokenCache.token;
  }
  const clientId = env("EAI_CLIENT_ID");
  const clientSecret = env("EAI_CLIENT_SECRET");
  const oauthUrl = env("EAI_OAUTH_URL", "https://api.eai.net.br/oauth2/token");
  const basic = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(oauthUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`[eai] oauth ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json() as { access_token: string; expires_in: number };
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  return tokenCache.token;
}

export type EaiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Override company token for this single call. */
  companyToken?: string;
};

export type EaiResult<T = unknown> = {
  ok: boolean;
  status: number;
  durationMs: number;
  json: T | null;
  text: string;
};

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const base = env("EAI_BASE_URL", "https://api.eai.net.br").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(base + cleanPath);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, String(vv)));
      else if (typeof v === "object") url.searchParams.set(k, JSON.stringify(v));
      else url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/**
 * Chamada autenticada à API EAÍ.
 * - Renova token automaticamente em 401 (1x).
 * - Retry com backoff em 429/502/503/504 (até 2 tentativas).
 */
export async function eaiFetch<T = unknown>(
  path: string,
  opts: EaiFetchOptions = {},
): Promise<EaiResult<T>> {
  const method = opts.method ?? "GET";
  const url = buildUrl(path, opts.query);
  const companyToken = opts.companyToken ?? env("EAI_COMPANY_TOKEN");
  const transientCodes = new Set([429, 502, 503, 504]);

  async function attempt(token: string): Promise<Response> {
    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-Token": companyToken,
        Accept: "application/json",
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(opts.headers ?? {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    };
    return await fetch(url, init);
  }

  const started = Date.now();
  let token = await getAccessToken();
  let res = await attempt(token);

  if (res.status === 401) {
    token = await getAccessToken(true);
    res = await attempt(token);
  }

  let retries = 0;
  while (transientCodes.has(res.status) && retries < 2) {
    const backoff = 500 * Math.pow(2, retries);
    await new Promise((r) => setTimeout(r, backoff));
    res = await attempt(token);
    retries++;
  }

  const text = await res.text();
  let json: T | null = null;
  try { json = text ? JSON.parse(text) as T : null; } catch { /* ignore */ }
  return {
    ok: res.ok,
    status: res.status,
    durationMs: Date.now() - started,
    json,
    text,
  };
}

export function resetEaiTokenCache(): void {
  tokenCache = null;
}
