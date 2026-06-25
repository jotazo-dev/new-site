// EAI MVNO proxy - OAuth2 client_credentials + CompanyToken header
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type EaiConfig = {
  base_url: string;
  oauth_url: string;
  client_id: string;
  client_secret: string;
  company_token: string;
  company_token_header: string | null;
  environment: string;
  active: boolean;
};

const adminDb = createClient(SUPABASE_URL, SERVICE_KEY);

async function getConfig(): Promise<EaiConfig | null> {
  const { data } = await adminDb.from("eai_config").select("*").limit(1).maybeSingle();
  return (data as EaiConfig) || null;
}

async function getCachedToken(): Promise<string | null> {
  const { data } = await adminDb.from("eai_token_cache").select("*").eq("id", 1).maybeSingle();
  if (!data) return null;
  const expiresAt = new Date(data.expires_at).getTime();
  if (expiresAt - Date.now() < 60_000) return null;
  return data.access_token;
}

function truncate(s: string, n = 2000): string {
  if (!s) return s;
  return s.length > n ? s.slice(0, n) + `… [truncated ${s.length - n}b]` : s;
}

function eaiHeaders(cfg: EaiConfig, token: string): Record<string, string> {
  const headerName = (cfg.company_token_header || "company-token").trim();
  return {
    Authorization: `Bearer ${token}`,
    [headerName]: cfg.company_token,
    Accept: "application/json",
  };
}

async function fetchNewToken(cfg: EaiConfig): Promise<string> {
  if (!cfg.oauth_url) throw new Error("oauth_url ausente");
  if (!cfg.client_id || !cfg.client_secret) throw new Error("client_id/client_secret ausentes");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.client_id,
    client_secret: cfg.client_secret,
  });

  const res = await fetch(cfg.oauth_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(20_000),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OAuth ${res.status}: ${text.slice(0, 300)}`);
  }
  let json: any;
  try { json = JSON.parse(text); } catch {
    throw new Error(`OAuth resposta não-JSON: ${text.slice(0, 300)}`);
  }
  const token: string | undefined = json.access_token;
  if (!token) throw new Error(`OAuth sem access_token: ${text.slice(0, 300)}`);
  const expiresIn = Number(json.expires_in ?? 3600);
  const expiresAt = new Date(Date.now() + Math.max(60, expiresIn - 60) * 1000).toISOString();

  await adminDb.from("eai_token_cache").upsert({
    id: 1,
    access_token: token,
    token_type: json.token_type || "Bearer",
    expires_at: expiresAt,
    scope: json.scope ?? null,
    obtained_at: new Date().toISOString(),
  });

  return token;
}

async function getToken(cfg: EaiConfig): Promise<string> {
  const cached = await getCachedToken();
  if (cached) return cached;
  return await fetchNewToken(cfg);
}

async function pingCatalog(cfg: EaiConfig, userId: string) {
  let token: string;
  try {
    token = await getToken(cfg);
  } catch (e) {
    return { ok: false, error: `Falha na autenticação: ${(e as Error).message}` };
  }

  const base = cfg.base_url.replace(/\/$/, "");
  const url = `${base}/rest/service_eai/mvno_main_products`;
  const started = Date.now();
  let status = 0;
  let bodyTxt = "";
  let snippet = "";
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: eaiHeaders(cfg, token),
      signal: AbortSignal.timeout(20_000),
    });
    status = res.status;
    bodyTxt = await res.text();
    snippet = bodyTxt.slice(0, 400);
    if (status >= 400 && bodyTxt.length < 5) {
      const diag: Record<string, string> = {};
      for (const h of ["www-authenticate", "content-type", "server", "x-error", "x-error-message", "x-request-id"]) {
        const v = res.headers.get(h);
        if (v) diag[h] = v;
      }
      snippet = `[empty body] headers=${JSON.stringify(diag)}`;
    }
  } catch (e) {
    snippet = `fetch error: ${(e as Error).message}`;
  }
  const durationMs = Date.now() - started;
  const ok = status >= 200 && status < 300;

  await adminDb.from("eai_logs").insert({
    action: "ping:catalog",
    method: "GET",
    path: "/rest/service_eai/mvno_main_products",
    status: status || null,
    duration_ms: durationMs,
    request_body: null,
    response_body: truncate(bodyTxt || snippet),
    error: ok ? null : snippet,
    actor_id: userId,
  });

  return {
    ok,
    method: "GET",
    path: "/rest/service_eai/mvno_main_products",
    url,
    status,
    durationMs,
    snippet,
  };
}

async function tryFetchToken(
  cfg: EaiConfig,
  variant: "body" | "basic" | "scope" | "audience",
): Promise<{ ok: boolean; token?: string; status?: number; snippet?: string }> {
  const params: Record<string, string> = { grant_type: "client_credentials" };
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  if (variant === "basic") {
    headers.Authorization = "Basic " + btoa(`${cfg.client_id}:${cfg.client_secret}`);
  } else {
    params.client_id = cfg.client_id;
    params.client_secret = cfg.client_secret;
  }
  if (variant === "scope") params.scope = "mvno";
  if (variant === "audience") params.audience = (cfg.base_url || "").replace(/\/$/, "");

  try {
    const res = await fetch(cfg.oauth_url, {
      method: "POST",
      headers,
      body: new URLSearchParams(params).toString(),
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status, snippet: text.slice(0, 200) };
    const json = JSON.parse(text);
    return { ok: !!json.access_token, token: json.access_token, status: res.status, snippet: text.slice(0, 200) };
  } catch (e) {
    return { ok: false, snippet: `error: ${(e as Error).message}` };
  }
}

async function tryCatalog(cfg: EaiConfig, token: string, headerName: string) {
  const url = `${cfg.base_url.replace(/\/$/, "")}/rest/service_eai/mvno_main_products`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        [headerName]: cfg.company_token,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    let snippet = text.slice(0, 300);
    if (res.status >= 400 && text.length < 5) {
      const diag: Record<string, string> = {};
      for (const h of ["www-authenticate", "content-type", "server", "x-error", "x-error-message"]) {
        const v = res.headers.get(h);
        if (v) diag[h] = v;
      }
      snippet = `[empty] ${JSON.stringify(diag)}`;
    }
    return { apiStatus: res.status, snippet };
  } catch (e) {
    return { apiStatus: 0, snippet: `error: ${(e as Error).message}` };
  }
}

async function diagnose(cfg: EaiConfig, userId: string) {
  const oauthVariants: Array<"body" | "basic" | "scope" | "audience"> = ["body", "basic", "scope", "audience"];
  const headerNames = ["CompanyToken", "Company-Token", "X-Company-Token", "companytoken", "company_token"];

  const oauthResults = await Promise.all(
    oauthVariants.map(async (v) => {
      const r = await tryFetchToken(cfg, v);
      let api: { apiStatus: number; snippet: string } | null = null;
      if (r.token) api = await tryCatalog(cfg, r.token, cfg.company_token_header || "CompanyToken");
      return { variant: v, tokenOk: r.ok, tokenStatus: r.status, tokenSnippet: r.snippet, apiStatus: api?.apiStatus ?? null, apiSnippet: api?.snippet ?? null };
    }),
  );

  // Use the first successful token to test header name variants
  const firstWithToken = oauthResults.find((r) => r.tokenOk);
  let headerResults: Array<{ name: string; apiStatus: number; snippet: string }> = [];
  if (firstWithToken) {
    const tokRes = await tryFetchToken(cfg, firstWithToken.variant);
    if (tokRes.token) {
      headerResults = await Promise.all(
        headerNames.map(async (n) => {
          const r = await tryCatalog(cfg, tokRes.token!, n);
          return { name: n, apiStatus: r.apiStatus, snippet: r.snippet };
        }),
      );
    }
  }

  await adminDb.from("eai_logs").insert({
    action: "diagnose",
    method: "GET",
    path: "/rest/service_eai/mvno_main_products",
    status: null,
    duration_ms: null,
    response_body: truncate(JSON.stringify({ oauth: oauthResults, headers: headerResults })),
    actor_id: userId,
  });

  return { ok: true, oauth: oauthResults, headers: headerResults };
}

async function assertAdmin(authHeader: string | null): Promise<{ userId: string }> {
  if (!authHeader) throw new Error("Não autenticado");
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error } = await userClient.auth.getUser();
  if (error || !userData?.user) throw new Error("Sessão inválida");
  const { data: roleRow } = await adminDb
    .from("user_roles")
    .select("role, role_slug")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  const slug = (roleRow as any)?.role_slug || (roleRow as any)?.role;
  if (!slug) throw new Error("Permissão negada");
  return { userId: userData.user.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { userId } = await assertAdmin(req.headers.get("Authorization"));
    const body = await req.json().catch(() => ({}));
    const action: string = body.action;

    if (action === "status") {
      const cfg = await getConfig();
      const { data: tok } = await adminDb.from("eai_token_cache").select("expires_at, obtained_at").eq("id", 1).maybeSingle();
      return new Response(JSON.stringify({
        ok: true,
        configured: !!(cfg?.base_url && cfg?.oauth_url && cfg?.client_id && cfg?.client_secret && cfg?.company_token),
        environment: cfg?.environment ?? "sandbox",
        active: cfg?.active ?? false,
        token: tok ?? null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "cache.clear") {
      await adminDb.from("eai_token_cache").delete().eq("id", 1);
      return new Response(JSON.stringify({ ok: true, cleared: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfg = await getConfig();
    if (!cfg) throw new Error("Configuração EAI ausente");
    if (!cfg.base_url) throw new Error("base_url não configurado");

    if (action === "ping") {
      const result = await pingCatalog(cfg, userId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "diagnose") {
      const result = await diagnose(cfg, userId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "tryEndpoint") {
      const path: string = body.payload?.path || "";
      const method: string = (body.payload?.method || "GET").toUpperCase();
      const reqBody: unknown = body.payload?.body;
      const query: Record<string, unknown> | undefined = body.payload?.query;
      if (!path.startsWith("/")) throw new Error("path deve começar com /");
      let token: string;
      try { token = await getToken(cfg); }
      catch (e) { return new Response(JSON.stringify({ ok: false, error: `auth: ${(e as Error).message}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
      let urlStr = `${cfg.base_url.replace(/\/$/, "")}${path}`;
      if (query && Object.keys(query).length) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) {
          if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
        }
        const s = qs.toString();
        if (s) urlStr += (urlStr.includes("?") ? "&" : "?") + s;
      }
      const started = Date.now();
      let status = 0, bodyTxt = "", snippet = "";
      const headers: Record<string, string> = eaiHeaders(cfg, token);
      const init: RequestInit = { method, headers, signal: AbortSignal.timeout(20_000) };
      if (reqBody !== undefined && method !== "GET" && method !== "DELETE") {
        headers["Content-Type"] = "application/json";
        init.body = typeof reqBody === "string" ? reqBody : JSON.stringify(reqBody);
      }
      try {
        const res = await fetch(urlStr, init);
        status = res.status;
        bodyTxt = await res.text();
        snippet = bodyTxt.slice(0, 600);
        if (status >= 400 && bodyTxt.length < 5) {
          const diag: Record<string, string> = {};
          for (const h of ["www-authenticate", "content-type", "server", "x-error", "x-error-message", "x-request-id"]) {
            const v = res.headers.get(h); if (v) diag[h] = v;
          }
          snippet = `[empty body] headers=${JSON.stringify(diag)}`;
        }
      } catch (e) { snippet = `fetch error: ${(e as Error).message}`; }
      const durationMs = Date.now() - started;
      await adminDb.from("eai_logs").insert({
        action: "try:endpoint", method, path, status: status || null, duration_ms: durationMs,
        request_body: reqBody ? truncate(typeof reqBody === "string" ? reqBody : JSON.stringify(reqBody)) : null,
        response_body: truncate(bodyTxt || snippet),
        error: (status >= 200 && status < 300) ? null : snippet, actor_id: userId,
      });
      let json: unknown = null;
      try { json = bodyTxt ? JSON.parse(bodyTxt) : null; } catch { /* keep null */ }
      return new Response(JSON.stringify({ ok: status >= 200 && status < 300, method, path, url: urlStr, status, durationMs, snippet, json }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message || "Erro" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
