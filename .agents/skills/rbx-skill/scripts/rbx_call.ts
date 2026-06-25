// Helper Deno standalone para chamar a API RBX (v1 e v2).
// NÃO substitui supabase/functions/_shared/rbx.ts — é um utilitário paralelo,
// útil em scripts isolados ou edge functions que não querem importar o shared.
//
// Uso típico (edge function):
//   import { rbxV1, rbxV2 } from "../<func>/rbx_call.ts";
//   const r = await rbxV2(endpointV2, key, "get_banking_billet", { document_id: 1 });
//   if (r.ok && r.json?.status === 1) { ... }

export type RbxResult = {
  ok: boolean;          // HTTP 2xx + JSON parseado
  status: number;       // HTTP status
  json: any | null;     // body parseado (null se não for JSON)
  raw: string;          // body cru (limitado a 8KB)
  durationMs: number;
};

const DEFAULT_TIMEOUT_MS = 20_000;

async function doPost(url: string, body: unknown, headers: Record<string, string>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<RbxResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const raw = (await res.text()).slice(0, 8192);
    let json: any = null;
    try { json = JSON.parse(raw); } catch { /* não-JSON */ }
    return { ok: res.ok && json !== null, status: res.status, json, raw, durationMs: Date.now() - started };
  } catch (e) {
    return { ok: false, status: 0, json: null, raw: (e as Error).message, durationMs: Date.now() - started };
  }
}

/**
 * Chama um serviço RBX v1.
 * @param endpoint URL completa (ex.: https://.../routerbox/ws/rbx_server_json.php)
 * @param chaveIntegracao auth_key_v1
 * @param service nome do serviço (ex.: "ConsultaAtendimentos")
 * @param payload campos do body além de Autenticacao (ex.: { Filtro: "..." } ou { DadosAtendimento: {...} })
 */
export function rbxV1(
  endpoint: string,
  chaveIntegracao: string,
  service: string,
  payload: Record<string, unknown> = {},
  opts?: { timeoutMs?: number },
): Promise<RbxResult> {
  return doPost(endpoint, {
    [service]: {
      Autenticacao: { ChaveIntegracao: chaveIntegracao },
      ...payload,
    },
  }, {}, opts?.timeoutMs);
}

/**
 * Chama um serviço RBX v2.
 * Inclui authentication_key NO HEADER e NO BODY (a API exige os dois).
 * @param endpointV2 URL completa (ex.: https://.../routerbox/ws_json/ws_json.php)
 * @param authKeyV2 auth_key_v2
 * @param service nome do serviço (ex.: "get_banking_billet")
 * @param payload campos do body
 */
export function rbxV2(
  endpointV2: string,
  authKeyV2: string,
  service: string,
  payload: Record<string, unknown> = {},
  opts?: { timeoutMs?: number },
): Promise<RbxResult> {
  return doPost(endpointV2, {
    [service]: { ...payload, authentication_key: authKeyV2 },
  }, {
    "authentication_key": authKeyV2,
    "User-Agent": "Jotazo-RBX/1.0",
  }, opts?.timeoutMs);
}

/** Helpers de leitura de status RBX (status=1 → ok). */
export const isOk = (r: RbxResult) => r.ok && r.json && (r.json.status === 1 || r.json.status === "1");
export const errorDesc = (r: RbxResult) =>
  r.json?.erro_desc || r.json?.error_description || (r.ok ? "indisponível" : r.raw || "falha de rede");
