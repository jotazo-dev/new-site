// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * checkout-order-status
 * GET ?orderId=...
 * Returns a sanitized view of payment + provisioning status for the success page.
 * Public read by orderId (UUID is the secret).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return json({ error: "orderId obrigatório" }, 400);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: o } = await admin
    .from("checkout_orders")
    .select(
      "id, status, payment_method, total_cents, customer_email, paid_at, " +
      "provisioning_status, provisioning_attempts, provisioning_last_error, provisioned_at, " +
      "sim_kind, msisdn, iccid, esim_qr_url, esim_activation_code, tracking_code, " +
      "pix_qr_string, boleto_url, boleto_digitable_line"
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!o) return json({ error: "Pedido não encontrado" }, 404);

  return json({
    ok: true,
    orderId: o.id,
    paymentStatus: o.status,
    paymentMethod: o.payment_method,
    totalCents: o.total_cents,
    paidAt: o.paid_at,
    provisioningStatus: o.provisioning_status,
    provisioningAttempts: o.provisioning_attempts,
    provisioningError: o.provisioning_last_error,
    provisionedAt: o.provisioned_at,
    line: {
      simKind: o.sim_kind,
      msisdn: o.msisdn,
      iccid: o.iccid,
      esimQrUrl: o.esim_qr_url,
      esimActivationCode: o.esim_activation_code,
      trackingCode: o.tracking_code,
    },
    pixQrString: o.pix_qr_string,
    boletoUrl: o.boleto_url,
    boletoDigitableLine: o.boleto_digitable_line,
  });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
