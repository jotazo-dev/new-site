// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { resolveRoute } from "../_shared/payment-providers/index.ts";
import type { ChargeInput, ProviderName } from "../_shared/payment-providers/types.ts";

/**
 * checkout-create-payment
 * Orquestra a criação do pedido + cobrança através de uma cadeia de providers
 * (Cielo → Mercado Pago → Asaas) definida em `payment_routing`.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Optional auth
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const userClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
        userId = data?.claims?.sub ?? null;
      } catch { /* guest */ }
    }

    const input = await req.json().catch(() => ({}));
    const method = String(input?.method || "").toLowerCase() as ChargeInput["method"];
    if (!["credit", "debit", "pix", "boleto"].includes(method)) {
      return json({ error: "method inválido" }, 400);
    }
    const requestedProvider = (typeof input?.provider === "string" ? input.provider.toLowerCase() : undefined) as ProviderName | undefined;

    // ---- validar itens e recalcular total ----
    const items = Array.isArray(input?.items) ? input.items : [];
    if (items.length === 0) return json({ error: "Carrinho vazio" }, 400);
    let computedTotal = 0;
    for (const it of items) {
      const qty = Math.max(1, Math.floor(Number(it?.qty ?? 1)));
      const unit = Math.max(0, Math.floor(Number(it?.unit_cents ?? 0)));
      computedTotal += qty * unit;
    }
    if (computedTotal <= 0) return json({ error: "Total inválido" }, 400);

    // Customer básico
    const c = input?.customer ?? {};
    const docDigits = String(c?.doc || "").replace(/\D/g, "");
    if (!c?.name || !c?.email || !docDigits) {
      return json({ error: "Dados do cliente incompletos (nome, e-mail, CPF/CNPJ)" }, 400);
    }
    const identityType: "CPF" | "CNPJ" = docDigits.length === 14 ? "CNPJ" : "CPF";

    // Mobile line metadata
    const merchantOrderId = crypto.randomUUID();
    const hasMobile = items.some((it: any) => it?.category === "movel" || it?.type === "movel");
    const simKind = (input?.sim_kind === "physical" || input?.sim_kind === "esim") ? input.sim_kind : null;
    const portabilityIn = input?.portability && input.portability.enabled ? {
      enabled: true,
      current_msisdn: String(input.portability.current_msisdn || "").replace(/\D/g, ""),
      current_operator: String(input.portability.current_operator || ""),
      current_doc: input.portability.current_doc ? String(input.portability.current_doc).replace(/\D/g, "") : null,
      window_id: input.portability.window_id || null,
    } : null;
    const birthdate = input?.customer_birthdate && /^\d{4}-\d{2}-\d{2}$/.test(input.customer_birthdate)
      ? input.customer_birthdate : null;
    const shippingAddr = (input?.shipping_address && typeof input.shipping_address === "object") ? input.shipping_address : null;
    const desiredPrefix = input?.desired_msisdn_prefix ? String(input.desired_msisdn_prefix).replace(/\D/g, "").slice(0, 2) : null;

    if (hasMobile && !simKind) {
      return json({ error: "Selecione o tipo de chip (eSIM ou físico) para planos móveis" }, 400);
    }

    const { data: order, error: insErr } = await admin
      .from("checkout_orders")
      .insert({
        merchant_order_id: merchantOrderId,
        user_id: userId,
        customer: c,
        customer_email: c.email,
        customer_doc: docDigits,
        customer_birthdate: birthdate,
        items,
        subtotal_cents: computedTotal,
        total_cents: computedTotal,
        payment_method: method,
        installments: Math.max(1, Math.min(12, Number(input?.installments ?? 1))),
        status: "pending",
        card_brand: input?.card?.brand ?? null,
        card_last4: input?.card?.number ? String(input.card.number).replace(/\D/g, "").slice(-4) : null,
        return_url: input?.returnUrl ?? null,
        sim_kind: simKind,
        desired_msisdn_prefix: desiredPrefix,
        portability: portabilityIn,
        shipping_address: shippingAddr,
      })
      .select()
      .single();
    if (insErr || !order) {
      return json({ error: "Falha ao criar pedido", detail: insErr?.message }, 500);
    }

    // ---------------- Resolve provider chain ----------------
    const providers = await resolveRoute({ admin }, method, requestedProvider);
    if (providers.length === 0) {
      await admin.from("checkout_orders").update({ status: "failed", last_error: { reason: "no-provider" } }).eq("id", order.id);
      return json({ error: "Nenhum gateway de pagamento configurado para este método" }, 500);
    }

    const chargeInput: ChargeInput = {
      orderId: order.id,
      merchantOrderId,
      method,
      amountCents: computedTotal,
      installments: Number(input?.installments ?? 1),
      customer: {
        name: c.name, email: c.email, doc: docDigits, identityType,
        phone: c.phone, birthdate,
        address: c.address,
      },
      card: input?.card,
      boletoDueDays: input?.boletoDueDays,
      pixExpirationSeconds: input?.qrCodeExpiration,
      returnUrl: input?.returnUrl,
      webhookBaseUrl: Deno.env.get("SUPABASE_URL")!,
    };

    const attempts: any[] = [];
    let success: any = null;

    for (const provider of providers) {
      let result;
      try {
        result = await provider.charge(chargeInput);
      } catch (e) {
        result = {
          provider: provider.name, ok: false, internalStatus: "failed" as const,
          httpStatus: 0, error: (e as Error).message, raw: null,
        };
      }
      attempts.push({
        provider: provider.name,
        ok: result.ok,
        http: result.httpStatus,
        status: result.internalStatus,
        error: result.error ?? null,
        ts: new Date().toISOString(),
      });
      if (result.ok) { success = result; break; }
    }

    // Persist attempts even if all failed
    await admin.from("checkout_orders").update({ provider_attempts: attempts }).eq("id", order.id);

    if (!success) {
      const last = attempts[attempts.length - 1];
      await admin.from("checkout_orders").update({
        status: "failed",
        last_error: { reason: "all-providers-failed", attempts },
      }).eq("id", order.id);
      await admin.from("checkout_events").insert({
        order_id: order.id, source: "create",
        message: `Falha em todos os providers (${attempts.map(a => a.provider).join(", ")})`,
        payload: attempts,
      });
      return json({ error: "Falha no pagamento", detail: last, attempts, orderId: order.id }, 400);
    }

    // ---------------- Persist success ----------------
    const update: Record<string, unknown> = {
      status: success.internalStatus,
      provider: success.provider,
      provider_payment_id: success.providerPaymentId ?? null,
      raw_response: success.raw,
      last_error: null,
      ...(success.extraOrderColumns || {}),
    };
    await admin.from("checkout_orders").update(update).eq("id", order.id);

    await admin.from("checkout_events").insert({
      order_id: order.id,
      source: "create",
      cielo_status: success.provider === "cielo" ? (typeof success.providerStatus === "number" ? success.providerStatus : null) : null,
      payload: { provider: success.provider, providerStatus: success.providerStatus, raw: success.raw },
      message: `Pagamento criado via ${success.provider} (${method})`,
    });

    if (success.internalStatus === "paid") {
      try {
        await admin.rpc("mark_order_paid", {
          _order_id: order.id,
          _cielo_status: success.provider === "cielo" && typeof success.providerStatus === "number" ? success.providerStatus : null,
          _payload: success.raw,
        });
        triggerWorker(order.id).catch(() => {});
      } catch (e) { console.error("[create-payment] mark_order_paid", e); }
    }

    try {
      await sendConfirmationEmail(admin, order.id, c.email, c.name, success.internalStatus, method, computedTotal, update);
    } catch { /* não bloqueia */ }

    return json({
      ok: true,
      orderId: order.id,
      status: success.internalStatus,
      provider: success.provider,
      providerStatus: success.providerStatus,
      paymentId: success.providerPaymentId,
      // legacy alias for backward compat
      cieloStatus: success.provider === "cielo" && typeof success.providerStatus === "number" ? success.providerStatus : undefined,
      method,
      attempts,
      pix: success.pix,
      boleto: success.boleto,
      card: success.card,
    });
  } catch (e) {
    console.error("[checkout-create-payment]", e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function triggerWorker(orderId: string) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/checkout-provisioning-runner`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ orderId }),
  });
}

async function sendConfirmationEmail(
  admin: any, orderId: string, email: string, name: string, status: string,
  method: string, totalCents: number, payload: any,
) {
  const RESEND = Deno.env.get("RESEND_API_KEY");
  const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND || !LOVABLE) return;
  const total = (totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const labelMethod = ({ credit: "Cartão de crédito", debit: "Cartão de débito", pix: "Pix", boleto: "Boleto" } as any)[method] || method;
  const labelStatus = status === "paid" ? "Pagamento confirmado ✅"
    : status === "authorized" ? "Pagamento autorizado"
    : status === "pending" ? (method === "pix" ? "Aguardando Pix" : method === "boleto" ? "Boleto gerado — aguardando pagamento" : "Aguardando confirmação")
    : "Em processamento";
  let extra = "";
  if (method === "pix" && payload.pix_qr_string) {
    extra = `<p><strong>Pix copia-e-cola:</strong></p><pre style="background:#f5f5f5;padding:10px;border-radius:8px;word-break:break-all;font-size:12px">${payload.pix_qr_string}</pre>`;
  }
  if (method === "boleto" && payload.boleto_url) {
    extra = `<p><a href="${payload.boleto_url}" style="display:inline-block;background:#1e88e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Abrir boleto (PDF)</a></p>${payload.boleto_digitable_line ? `<p style="font-family:monospace;font-size:13px">${payload.boleto_digitable_line}</p>` : ""}`;
  }
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
      <h2 style="margin:0 0 8px">Olá, ${name.split(" ")[0]}!</h2>
      <p style="margin:0 0 16px">${labelStatus}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#666">Pedido</td><td style="text-align:right;font-family:monospace">${orderId.slice(0, 8)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Método</td><td style="text-align:right">${labelMethod}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Total</td><td style="text-align:right;font-weight:700">${total}</td></tr>
      </table>
      ${extra}
      <p style="margin-top:24px;font-size:13px;color:#666">Jotazo Telecom — qualquer dúvida, fale com a gente pelo WhatsApp.</p>
    </div>`;
  const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE}`,
      "X-Connection-Api-Key": RESEND,
    },
    body: JSON.stringify({
      from: "Jotazo Telecom <onboarding@resend.dev>",
      to: [email], subject: `Jotazo — ${labelStatus}`, html,
    }),
  });
  if (r.ok) {
    await admin.from("checkout_orders").update({ notification_sent_at: new Date().toISOString() }).eq("id", orderId);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
