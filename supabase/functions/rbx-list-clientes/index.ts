// Lista clientes do RBX via serviço v1 ConsultaClientes.
// Admin-only. POST { filtro?: string } → { ok, count, clientes, raw, latency_ms }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function sanitizeFiltro(input: unknown): string {
  if (typeof input !== "string") return "";
  let s = input.trim();
  if (!s) return "";
  s = s.replace(/;/g, " ").replace(/--/g, " ").replace(/\/\*/g, " ").replace(/\*\//g, " ");
  if (s.length > 500) s = s.slice(0, 500);
  return s.trim();
}

function extractList(p: any): any[] {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  for (const k of ["result", "Result", "data", "Data", "registros", "Registros", "lista", "Lista"]) {
    const v = (p as any)[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      for (const k2 of Object.keys(v)) if (Array.isArray((v as any)[k2])) return (v as any)[k2];
    }
  }
  for (const k of Object.keys(p)) if (Array.isArray((p as any)[k])) return (p as any)[k];
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const guard = await requireAdmin(req);
  if (guard) return guard;

  try {
    const body = await req.json().catch(() => ({}));
    const filtro = sanitizeFiltro((body as any)?.filtro);

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaSrv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(supaUrl, supaSrv);

    const { data: cfg } = await supa
      .from("rbx_config")
      .select("base_url, auth_key_v1")
      .limit(1)
      .maybeSingle();

    if (!cfg?.base_url || !cfg.auth_key_v1) {
      return new Response(
        JSON.stringify({ ok: false, error: "rbx_not_configured", message: "RBX não configurado." }),
        { headers: corsHeaders, status: 200 },
      );
    }

    const endpoint = `${cfg.base_url.replace(/\/+$/, "")}/routerbox/ws/rbx_server_json.php`;
    const reqBody: Record<string, unknown> = {
      ConsultaClientes: {
        Autenticacao: { ChaveIntegracao: cfg.auth_key_v1 },
        Filtro: filtro || "",
      },
    };

    const start = performance.now();
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(45000),
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ ok: false, error: "network", message: (e as Error).message }),
        { headers: corsHeaders, status: 200 },
      );
    }
    const latency_ms = Math.round(performance.now() - start);
    const text = await response.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }

    if (!parsed) {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_response", message: "Resposta inválida da RBX.", latency_ms, body_preview: text.slice(0, 300) }),
        { headers: corsHeaders, status: 200 },
      );
    }

    const status = parsed?.status;
    const ok = status === 1 || status === "1" || status === true;
    if (!ok) {
      const code = Number(parsed?.erro_code);
      const desc = String(parsed?.erro_desc || "");
      if (code === 1) {
        return new Response(
          JSON.stringify({ ok: true, count: 0, clientes: [], filtro, latency_ms, message: "Nenhum cliente retornado." }),
          { headers: corsHeaders, status: 200 },
        );
      }
      const isAuthErr = code === 97 || /chave/i.test(desc);
      return new Response(
        JSON.stringify({
          ok: false,
          error: isAuthErr ? "auth" : "rbx_error",
          code,
          message: desc || "Falha ao consultar clientes no RBX.",
          latency_ms,
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    const clientes = extractList(parsed?.result ?? parsed);
    return new Response(
      JSON.stringify({ ok: true, count: clientes.length, clientes, filtro, latency_ms }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (e) {
    console.error("[rbx-list-clientes] exception:", (e as Error).message);
    return new Response(
      JSON.stringify({ ok: false, error: "exception", message: (e as Error).message }),
      { headers: corsHeaders, status: 200 },
    );
  }
});
