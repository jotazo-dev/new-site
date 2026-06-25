// Edge Function: rbx-test-service
// Testa individualmente um serviço de Atendimento da RBX (v1 ou v2),
// usando endpoint e payload mínimo conforme a documentação oficial.
//
// Estratégia: DRY-RUN. Para serviços de escrita enviamos um payload mínimo
// (apenas autenticação) — a RBX responde "campo X obrigatório", o que
// confirma que a chave foi aceita e o serviço está habilitado SEM criar
// nenhum registro real.
//
// Doc v1: https://www.developers.rbxsoft.com
// Doc v2: https://www.developers.rbxsoft.com/v2/

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Version = "v1" | "v2";

// Serviços v1 que exigem filtro obrigatório (a API retorna 500 sem ele).
const V1_REQUIRES_FILTER: Record<string, string> = {
  ConsultaOcorrenciasAtendimentos: "Atendimento = 0",
};

// Mensagem padrão quando o teste passou via "validação" (chave aceita,
// serviço respondeu, mas o payload completo seria necessário no uso real).
const NOTE_DRY_RUN = "Chave aceita · serviço requer payload completo no uso real";

async function testV1(baseUrl: string, authKey: string, slug: string) {
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/routerbox/ws/rbx_server_json.php`;
  const payload: Record<string, unknown> = {
    Autenticacao: { ChaveIntegracao: authKey },
  };
  if (V1_REQUIRES_FILTER[slug]) {
    payload.Filtro = V1_REQUIRES_FILTER[slug];
  }
  const body = JSON.stringify({ [slug]: payload });
  const start = performance.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Jotazo-Integration/1.0",
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const latency_ms = Math.round(performance.now() - start);
    const text = await response.text();
    const preview = text.slice(0, 500);
    const trimmed = text.trim();

    let parsed: any = null;
    if (trimmed && trimmed !== "null") {
      try { parsed = JSON.parse(text); } catch { /* ignore */ }
    }

    if (parsed) {
      const status = parsed?.status;
      if (status === 1 || status === "1" || status === true) {
        return { ok: true, status: response.status, latency_ms, body_preview: preview };
      }
      const errCode = Number(parsed?.erro_code);
      const errDesc = String(parsed?.erro_desc || parsed?.mensagem || "").toLowerCase();

      // Códigos/descrições que indicam autenticação OK + serviço habilitado:
      // - erro_code 1 = "consulta nao retornou resultados"
      // - erro_code 2/6 = validação de payload (campo obrigatório, etc.)
      // - descrições contendo "obrigat", "informad", "nao retornou", "vazio"
      const isValidationPass =
        errCode === 1 || errCode === 2 || errCode === 6 ||
        errDesc.includes("nao retornou") || errDesc.includes("não retornou") ||
        errDesc.includes("obrigat") ||
        errDesc.includes("informad") ||
        errDesc.includes("vazio") ||
        errDesc.includes("preenchid");

      if (isValidationPass) {
        return {
          ok: true,
          status: response.status,
          latency_ms,
          body_preview: preview,
          note: errCode === 1 ? undefined : (parsed?.erro_desc || NOTE_DRY_RUN),
        };
      }

      // erro_code 97 = chave inválida; outros = erro real.
      const errMsg = parsed?.erro_desc || parsed?.mensagem || parsed?.error || `HTTP ${response.status}`;
      return { ok: false, status: response.status, latency_ms, body_preview: preview, error: String(errMsg) };
    }

    if (!response.ok) {
      const hint = response.status === 500
        ? "Servidor RBX retornou 500 sem corpo. Serviço pode estar indisponível na sua chave."
        : `HTTP ${response.status}`;
      return { ok: false, status: response.status, latency_ms, body_preview: preview, error: hint };
    }

    if (trimmed === "" || trimmed === "null") {
      return { ok: true, status: response.status, latency_ms, body_preview: preview };
    }
    return { ok: false, status: response.status, latency_ms, body_preview: preview, error: "Resposta não é JSON válido" };
  } catch (err) {
    const latency_ms = Math.round(performance.now() - start);
    return { ok: false, latency_ms, error: err instanceof Error ? err.message : "Erro de rede" };
  }
}

async function testV2(baseUrl: string, authKey: string, slug: string) {
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/routerbox/ws_json/ws_json.php`;
  const body = JSON.stringify({ [slug]: {} });
  const start = performance.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Jotazo-Integration/1.0",
        "authentication_key": authKey,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const latency_ms = Math.round(performance.now() - start);
    const text = await response.text();
    const preview = text.slice(0, 500);
    const trimmed = text.trim();

    let parsed: any = null;
    if (trimmed && trimmed !== "null") {
      try { parsed = JSON.parse(text); } catch { /* ignore */ }
    }

    if (parsed) {
      const status = parsed?.status;
      if (status === 1 || status === true || status === "1") {
        return { ok: true, status: response.status, latency_ms, body_preview: preview };
      }
      const errCode = Number(parsed?.error_code);
      const errDesc = String(parsed?.error_description || parsed?.result || "").toLowerCase();

      // Detecta "serviço não habilitado" — esse é falha REAL, não dry-run.
      const isInvalidService =
        errDesc.includes("invalid service") ||
        errDesc.includes("serviço inválido") ||
        errDesc.includes("servico invalido") ||
        errDesc.includes("não habilitad") ||
        errDesc.includes("nao habilitad");

      // Chave inválida = falha REAL.
      const isInvalidKey =
        errCode === 97 ||
        errDesc.includes("chave inválid") ||
        errDesc.includes("chave invalid") ||
        errDesc.includes("authentication") ||
        errDesc.includes("não autorizado") ||
        errDesc.includes("nao autorizado");

      if (isInvalidService || isInvalidKey) {
        const errMsg = parsed?.error_description || parsed?.result || parsed?.error || `HTTP ${response.status}`;
        return { ok: false, status: response.status, latency_ms, body_preview: preview, error: String(errMsg) };
      }

      // Validação de payload = chave OK + serviço habilitado.
      const isValidationPass =
        errCode === 6 || errCode === 1 || errCode === 2 ||
        errDesc.includes("não foi informado") ||
        errDesc.includes("nao foi informado") ||
        errDesc.includes("não retornou") ||
        errDesc.includes("nao retornou") ||
        errDesc.includes("obrigat") ||
        errDesc.includes("informad") ||
        errDesc.includes("vazio") ||
        errDesc.includes("preenchid") ||
        errDesc.includes("campo");

      if (isValidationPass) {
        return {
          ok: true,
          status: response.status,
          latency_ms,
          body_preview: preview,
          note: parsed?.error_description || NOTE_DRY_RUN,
        };
      }

      const errMsg = parsed?.error_description || parsed?.result || parsed?.error || parsed?.erro || `HTTP ${response.status}`;
      return { ok: false, status: response.status, latency_ms, body_preview: preview, error: String(errMsg) };
    }

    if (!response.ok) {
      return { ok: false, status: response.status, latency_ms, body_preview: preview, error: `HTTP ${response.status}` };
    }
    return { ok: false, status: response.status, latency_ms, body_preview: preview, error: "Resposta não é JSON válido" };
  } catch (err) {
    const latency_ms = Math.round(performance.now() - start);
    return { ok: false, latency_ms, error: err instanceof Error ? err.message : "Erro de rede" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supaUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supaUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supa = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleRow } = await supa
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ ok: false, error: "Acesso restrito a administradores" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { version, service_slug } = await req.json() as { version: Version; service_slug: string };
    if (!version || !service_slug || (version !== "v1" && version !== "v2")) {
      return new Response(JSON.stringify({ ok: false, error: "Parâmetros inválidos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: cfg, error: cfgErr } = await supa
      .from("rbx_config")
      .select("base_url, auth_key_v1, auth_key_v2")
      .limit(1)
      .maybeSingle();
    if (cfgErr || !cfg?.base_url) {
      return new Response(JSON.stringify({ ok: false, error: "Configuração RBX não encontrada" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authKey = version === "v1" ? cfg.auth_key_v1 : cfg.auth_key_v2;
    if (!authKey) {
      return new Response(JSON.stringify({ ok: false, error: `Chave ${version} não configurada` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = version === "v1"
      ? await testV1(cfg.base_url, authKey, service_slug)
      : await testV2(cfg.base_url, authKey, service_slug);

    await supa
      .from("rbx_service_permissions")
      .update({
        last_test_at: new Date().toISOString(),
        last_test_status: result.ok ? "ok" : "error",
        last_test_error: result.ok ? null : (result.error || null),
        last_test_latency_ms: result.latency_ms ?? null,
      })
      .eq("version", version)
      .eq("service_slug", service_slug);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
