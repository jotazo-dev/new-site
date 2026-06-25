// Cria contrato na RBX (v2 contract_insert). Admin-only.
import { requireAdmin } from "../_shared/adminGuard.ts";
import { loadRbxConfig, rbxFetchV2, okStatus } from "../_shared/rbx.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function extractContratoCodigo(resp: any): string {
  if (!resp) return "";
  const r = resp?.result ?? resp;
  const candidates = [
    r?.id, r?.contract_id, r?.contrato_id, r?.codigo, r?.Codigo,
    r?.contract?.id, r?.contract?.codigo,
  ];
  for (const c of candidates) if (c !== undefined && c !== null && String(c).trim() !== "") return String(c);
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const guard = await requireAdmin(req);
  if (guard) return guard;
  try {
    const { clienteCodigo, planoCodigo, vendedor, observacao } = await req.json().catch(() => ({}));
    if (!clienteCodigo || !planoCodigo) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_input" }), { status: 400, headers: corsHeaders });
    }
    const cfg = await loadRbxConfig();
    if (!cfg?.authKeyV2) {
      return new Response(JSON.stringify({ ok: false, error: "rbx_v2_not_configured" }), { status: 500, headers: corsHeaders });
    }

    const payload: any = {
      client_id: Number(clienteCodigo) || clienteCodigo,
      plan_id: Number(planoCodigo) || planoCodigo,
      ...(vendedor ? { seller_id: Number(vendedor) || vendedor } : {}),
      ...(observacao ? { notes: observacao } : {}),
    };

    const resp = await rbxFetchV2(cfg.endpointV2, cfg.authKeyV2, "contract_insert", payload);
    const ok = okStatus(resp);
    const codigo = extractContratoCodigo(resp);
    if (!ok || !codigo) {
      return new Response(JSON.stringify({
        ok: false, error: "contract_insert_failed",
        message: resp?.error_description || "Falha ao criar contrato",
        raw: resp,
      }), { status: 502, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ ok: true, codigo, raw: resp }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "exception", message: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
