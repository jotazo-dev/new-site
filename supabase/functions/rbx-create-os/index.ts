// Abre OS de atendimento na RBX (v1 AtendimentoCadastro). Admin-only.
import { requireAdmin } from "../_shared/adminGuard.ts";
import { loadRbxConfig } from "../_shared/rbx.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

async function rbxPost(endpoint: string, body: any): Promise<any> {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { _raw: t, _status: r.status }; }
  } catch (e) { return { _error: (e as Error).message }; }
}

function extractOsCodigo(resp: any): string {
  if (!resp) return "";
  const r = resp?.result ?? resp;
  const candidates = [
    r?.Codigo, r?.codigo, r?.Atendimento?.Codigo, r?.atendimento?.codigo,
    r?.id, r?.numero, r?.Numero,
  ];
  for (const c of candidates) if (c !== undefined && c !== null && String(c).trim() !== "") return String(c);
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const guard = await requireAdmin(req);
  if (guard) return guard;
  try {
    const { clienteCodigo, contratoCodigo, assunto, descricao } = await req.json().catch(() => ({}));
    if (!clienteCodigo) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_input" }), { status: 400, headers: corsHeaders });
    }
    const cfg = await loadRbxConfig();
    if (!cfg) return new Response(JSON.stringify({ ok: false, error: "rbx_not_configured" }), { status: 500, headers: corsHeaders });

    const payload: any = {
      AtendimentoCadastro: {
        Autenticacao: { ChaveIntegracao: cfg.authKey },
        Atendimento: {
          Cliente: String(clienteCodigo),
          ...(contratoCodigo ? { Contrato: String(contratoCodigo) } : {}),
          Assunto: assunto || "Ativação MVNO",
          Descricao: descricao || "Pedido gerado via /admin/pedido",
          Origem: "Sistema",
          Tipo: "Ativação",
          Situacao: "Aberto",
        },
      },
    };

    const resp = await rbxPost(cfg.endpoint, payload);
    const codigo = extractOsCodigo(resp);
    if (!codigo) {
      return new Response(JSON.stringify({
        ok: false, error: "no_os_codigo",
        message: resp?.result?.error_description || resp?.error_description || resp?._error || "Resposta sem código de OS",
        raw: resp,
      }), { status: 502, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ ok: true, codigo, raw: resp }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "exception", message: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
