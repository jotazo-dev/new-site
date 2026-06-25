// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { getProvider } from "../_shared/payment-providers/index.ts";
import type { ProviderName } from "../_shared/payment-providers/types.ts";

/** Consulta o status de um pedido no provider que processou-o e atualiza checkout_orders. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return json({ error: "orderId obrigatório" }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: order } = await admin.from("checkout_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return json({ error: "Pedido não encontrado" }, 404);

  // Resolve which provider processed this order (back-compat: assume cielo)
  const providerName: ProviderName = (order.provider as ProviderName) || "cielo";
  const paymentId = order.provider_payment_id || order.cielo_payment_id;
  if (!paymentId) return json({ status: order.status, provider: providerName });

  const provider = await getProvider({ admin }, providerName);
  if (!provider) return json({ error: `Provider ${providerName} indisponível` }, 500);

  const method = order.payment_method;
  let internalStatus = order.status as string;
  let providerStatus: any = null;
  let raw: any = null;
  try {
    const r = await provider.fetchStatus(paymentId, method);
    internalStatus = r.internalStatus;
    providerStatus = r.providerStatus;
    raw = r.raw;
  } catch (e) {
    return json({ status: order.status, error: (e as Error).message }, 200);
  }

  const cieloLegacyStatus = providerName === "cielo" && typeof providerStatus === "number" ? providerStatus : null;

  await admin.from("checkout_orders").update({
    status: internalStatus,
    raw_response: raw,
    ...(providerName === "cielo" ? {
      cielo_proof_of_sale: raw?.Payment?.ProofOfSale ?? order.cielo_proof_of_sale,
      cielo_auth_code: raw?.Payment?.AuthorizationCode ?? order.cielo_auth_code,
    } : {}),
  }).eq("id", orderId);

  await admin.from("checkout_events").insert({
    order_id: orderId,
    source: "poll",
    cielo_status: cieloLegacyStatus,
    payload: { provider: providerName, providerStatus, raw },
    message: `Poll (${providerName}): status ${providerStatus}`,
  });

  if (internalStatus === "paid" && order.status !== "paid") {
    try {
      await admin.rpc("mark_order_paid", {
        _order_id: orderId,
        _cielo_status: cieloLegacyStatus,
        _payload: raw,
      });
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/checkout-provisioning-runner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ orderId }),
      }).catch(() => {});
    } catch (e) { console.error("[poll] mark_order_paid", e); }
  }

  return json({
    status: internalStatus,
    provider: providerName,
    providerStatus,
    cieloStatus: cieloLegacyStatus,
    paymentId,
  });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
