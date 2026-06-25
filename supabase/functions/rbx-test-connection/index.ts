import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Attempt = {
  endpoint: string;
  version: "v1" | "v2";
  method_name: string;
  header_variant: string;
  status?: number;
  ok: boolean;
  body_preview?: string;
  error?: string;
  latency_ms: number;
};

type VersionResult = {
  ok: boolean;
  version: "v1" | "v2";
  latency_ms?: number;
  method_name?: string;
  header_variant?: string;
  status?: number;
  body_preview?: string;
  error?: string;
  attempts_count: number;
  skipped?: boolean;
};

// Serviços v2 oficiais (RBXSoft) — usados como healthcheck.
// Na v2, o nome do serviço é a CHAVE RAIZ do JSON, com um objeto vazio (ou parâmetros) como valor.
// Doc: https://www.developers.rbxsoft.com/v2/
// "get_tickets_mode" não exige parâmetros e retorna a lista de modos de atendimento — ideal p/ ping.
const V2_METHODS = ["get_tickets_mode", "consult_appointments_modes"];
// Header oficial: authentication_key (lowercase). Mantemos variantes só como fallback defensivo.
const V2_HEADER_KEYS = ["authentication_key", "Authentication-Key", "Authentication_Key"];

// V1 (legado) — endpoint e payload diferentes
const V1_METHODS = ["ListarPlanos", "ConsultaPlanos", "ListarCidades"];

async function tryV2(
  baseUrl: string,
  authKey: string,
  methodName: string,
  headerKey: string,
): Promise<Attempt> {
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/routerbox/ws_json/ws_json.php`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Jotazo-Integration/1.0",
    [headerKey]: authKey,
  };
  // Formato oficial RBX v2: o nome do serviço é a chave raiz do JSON.
  const body = JSON.stringify({ [methodName]: {} });

  const start = performance.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    });
    const latency_ms = Math.round(performance.now() - start);
    const text = await response.text();
    const preview = text.slice(0, 500);

    console.log(`[RBX v2] ${methodName} (${headerKey}) → ${response.status} (${latency_ms}ms): ${preview.slice(0, 200)}`);

    if (!response.ok) {
      return { endpoint, version: "v2", method_name: methodName, header_variant: headerKey, status: response.status, ok: false, body_preview: preview, error: `HTTP ${response.status}`, latency_ms };
    }

    // Resposta com HTTP 200 — interpretar pelo "status" do JSON.
    try {
      const parsed = JSON.parse(text);
      // RBX v2: status 1 ou true = sucesso; status 0 = erro de negócio.
      const isSuccess = parsed?.status === 1 || parsed?.status === true || parsed?.status === "1";
      if (isSuccess) {
        return { endpoint, version: "v2", method_name: methodName, header_variant: headerKey, status: response.status, ok: true, body_preview: preview, latency_ms };
      }
      const errMsg = parsed?.error_description || parsed?.result || parsed?.error || parsed?.erro || "Erro reportado pela API";
      return { endpoint, version: "v2", method_name: methodName, header_variant: headerKey, status: response.status, ok: false, body_preview: preview, error: String(errMsg), latency_ms };
    } catch {
      return { endpoint, version: "v2", method_name: methodName, header_variant: headerKey, status: response.status, ok: false, body_preview: preview, error: "Resposta não é JSON válido", latency_ms };
    }
  } catch (err) {
    const latency_ms = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : "Erro de rede";
    return { endpoint, version: "v2", method_name: methodName, header_variant: headerKey, ok: false, error: message, latency_ms };
  }
}

async function tryV1(baseUrl: string, authKey: string, methodName: string): Promise<Attempt> {
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/routerbox/ws/rbx_server_json.php`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Jotazo-Integration/1.0",
  };
  const body = JSON.stringify({ ChaveIntegracao: authKey, Servico: methodName });

  const start = performance.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    });
    const latency_ms = Math.round(performance.now() - start);
    const text = await response.text();
    const preview = text.slice(0, 500);

    console.log(`[RBX v1] ${methodName} → ${response.status} (${latency_ms}ms): ${preview.slice(0, 200)}`);

    if (!response.ok) {
      return { endpoint, version: "v1", method_name: methodName, header_variant: "—", status: response.status, ok: false, body_preview: preview, error: `HTTP ${response.status}`, latency_ms };
    }

    const trimmed = text.trim();
    if (trimmed === "null" || trimmed === "") {
      return { endpoint, version: "v1", method_name: methodName, header_variant: "—", status: response.status, ok: true, body_preview: preview, latency_ms };
    }

    try {
      const parsed = JSON.parse(text);
      const errMsg =
        parsed?.status === "erro" || parsed?.error || parsed?.erro
          ? parsed?.mensagem || parsed?.error || parsed?.erro || "Erro reportado pela API"
          : null;
      if (errMsg) {
        return { endpoint, version: "v1", method_name: methodName, header_variant: "—", status: response.status, ok: false, body_preview: preview, error: String(errMsg), latency_ms };
      }
      return { endpoint, version: "v1", method_name: methodName, header_variant: "—", status: response.status, ok: true, body_preview: preview, latency_ms };
    } catch {
      return { endpoint, version: "v1", method_name: methodName, header_variant: "—", status: response.status, ok: false, body_preview: preview, error: "Resposta não é JSON válido", latency_ms };
    }
  } catch (err) {
    const latency_ms = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : "Erro de rede";
    return { endpoint, version: "v1", method_name: methodName, header_variant: "—", ok: false, error: message, latency_ms };
  }
}

async function testV2(baseUrl: string, authKey: string): Promise<VersionResult> {
  const attempts: Attempt[] = [];
  outer: for (const headerKey of V2_HEADER_KEYS) {
    for (const method of V2_METHODS) {
      const a = await tryV2(baseUrl, authKey, method, headerKey);
      attempts.push(a);
      if (a.ok) break outer;
      // Se autenticação clara falhou, troca o header e tenta de novo.
      if (a.status === 401 || a.status === 403) break;
    }
  }
  const success = attempts.find((a) => a.ok);
  if (success) {
    return { ok: true, version: "v2", latency_ms: success.latency_ms, method_name: success.method_name, header_variant: success.header_variant, status: success.status, attempts_count: attempts.length };
  }
  const last = attempts.find((a) => a.status && a.body_preview) || attempts[attempts.length - 1];
  return { ok: false, version: "v2", latency_ms: last?.latency_ms, method_name: last?.method_name, header_variant: last?.header_variant, status: last?.status, body_preview: last?.body_preview, error: last?.error || "Falha", attempts_count: attempts.length };
}

async function testV1(baseUrl: string, authKey: string): Promise<VersionResult> {
  const attempts: Attempt[] = [];
  for (const method of V1_METHODS) {
    const a = await tryV1(baseUrl, authKey, method);
    attempts.push(a);
    if (a.ok) break;
  }
  const success = attempts.find((a) => a.ok);
  if (success) {
    return { ok: true, version: "v1", latency_ms: success.latency_ms, method_name: success.method_name, header_variant: "—", status: success.status, attempts_count: attempts.length };
  }
  const last = attempts.find((a) => a.status && a.body_preview) || attempts[attempts.length - 1];
  return { ok: false, version: "v1", latency_ms: last?.latency_ms, method_name: last?.method_name, header_variant: "—", status: last?.status, body_preview: last?.body_preview, error: last?.error || "Falha", attempts_count: attempts.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const { base_url, auth_key_v2, auth_key_v1 } = await req.json();

    if (!base_url) {
      return new Response(
        JSON.stringify({ ok: false, error: "URL base é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const [v1Result, v2Result] = await Promise.all([
      auth_key_v1
        ? testV1(base_url, auth_key_v1)
        : Promise.resolve<VersionResult>({ ok: false, version: "v1", attempts_count: 0, skipped: true, error: "Chave v1 não informada" }),
      auth_key_v2
        ? testV2(base_url, auth_key_v2)
        : Promise.resolve<VersionResult>({ ok: false, version: "v2", attempts_count: 0, skipped: true, error: "Chave v2 não informada" }),
    ]);

    const provided = [auth_key_v1 ? v1Result : null, auth_key_v2 ? v2Result : null].filter(Boolean) as VersionResult[];
    const allOk = provided.length > 0 && provided.every((r) => r.ok);

    return new Response(
      JSON.stringify({ ok: allOk, v1: v1Result, v2: v2Result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
