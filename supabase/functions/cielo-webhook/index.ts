import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let payload: any = {};
  try { payload = await req.json(); } catch { /* aceita vazio */ }

  // Valida secret via header X-Webhook-Secret ou query ?secret=
  const url = new URL(req.url);
  const providedSecret = req.headers.get("x-webhook-secret") ?? url.searchParams.get("secret");

  const { data: cfg } = await admin.from("cielo_config").select("webhook_secret").maybeSingle();
  const expected = cfg?.webhook_secret;

  // Secret é obrigatório. Sem segredo configurado ou diferente do esperado → rejeita.
  if (!expected || !providedSecret || providedSecret !== expected) {
    await admin.from("cielo_webhooks").insert({
      payload,
      processed: false,
      error: !expected ? "Webhook secret not configured" : "Invalid webhook secret",
    });
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const paymentId = payload?.PaymentId ?? null;
  const changeType = typeof payload?.ChangeType === "number" ? payload.ChangeType : null;
  const recurrentPaymentId = payload?.RecurrentPaymentId ?? null;

  const { data: inserted } = await admin
    .from("cielo_webhooks")
    .insert({
      payment_id: paymentId,
      change_type: changeType,
      recurrent_payment_id: recurrentPaymentId,
      payload,
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .select()
    .single();

  // Se houver um checkout_order com esse PaymentId, consultar Cielo e atualizar status
  if (paymentId) {
    try {
      const { data: order } = await admin
        .from("checkout_orders")
        .select("id, payment_method, status")
        .eq("cielo_payment_id", paymentId)
        .maybeSingle();
      if (order) {
        const { data: cfg } = await admin.from("cielo_config").select("*").maybeSingle();
        if (cfg) {
          const isProd = cfg.environment === "production";
          const qHost = isProd ? "https://apiquery.braspag.com.br" : "https://apiquerysandbox.braspag.com.br";
          const mId = isProd ? cfg.merchant_id_production : cfg.merchant_id_sandbox;
          const mKey = isProd ? cfg.merchant_key_production : cfg.merchant_key_sandbox;
          const qRes = await fetch(`${qHost}/v2/sales/${paymentId}`, {
            headers: { "Content-Type": "application/json", MerchantId: mId, MerchantKey: mKey },
          });
          const qText = await qRes.text();
          let qResp: any = null; try { qResp = JSON.parse(qText); } catch { qResp = qText; }
          const cieloStatus = Number(qResp?.Payment?.Status ?? 0);
          const method = order.payment_method;
          let internalStatus = order.status as string;
          if (cieloStatus === 2) internalStatus = "paid";
          else if (cieloStatus === 1) internalStatus = (method === "credit" || method === "debit") ? "paid" : "authorized";
          else if (cieloStatus === 10) internalStatus = "canceled";
          else if (cieloStatus === 11) internalStatus = "refunded";
          else if (cieloStatus === 12) internalStatus = "pending";
          else if (cieloStatus === 3 || cieloStatus === 13) internalStatus = "failed";

          await admin.from("checkout_orders").update({
            status: internalStatus,
            cielo_proof_of_sale: qResp?.Payment?.ProofOfSale ?? null,
            cielo_auth_code: qResp?.Payment?.AuthorizationCode ?? null,
            raw_response: qResp,
          }).eq("id", order.id);

          await admin.from("checkout_events").insert({
            order_id: order.id,
            source: "webhook",
            cielo_status: cieloStatus || null,
            cielo_change_type: changeType,
            payload: qResp,
            message: `Webhook ChangeType=${changeType}`,
          });

          // Enfileira provisionamento na transição para 'paid'.
          if (internalStatus === "paid") {
            try {
              await admin.rpc("mark_order_paid", {
                _order_id: order.id,
                _cielo_status: cieloStatus,
                _payload: qResp,
              });
              // Dispara o worker imediatamente (best-effort).
              fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/checkout-provisioning-runner`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({ orderId: order.id }),
              }).catch(() => {});
            } catch (e) { console.error("[cielo-webhook] mark_order_paid", e); }
          }
        }
      }
    } catch (e) { console.error("[cielo-webhook] order update", e); }
  }

  await admin.from("cielo_logs").insert({
    direction: "webhook",
    endpoint: "/cielo-webhook",
    method: "POST",
    payment_id: paymentId,
    status_code: 200,
    request_body: payload,
    response_body: { received: true, id: inserted?.id },
  });

  return new Response("OK", { status: 200, headers: corsHeaders });
});
