// deno-lint-ignore-file no-explicit-any
import type { ChargeInput, NormalizedPayment, NormalizedStatus, PaymentProvider, ProviderContext } from "./types.ts";

export async function makeCielo(ctx: ProviderContext): Promise<PaymentProvider | null> {
  const { admin } = ctx;
  const { data: cfg } = await admin.from("cielo_config").select("*").maybeSingle();
  if (!cfg) return null;
  const isProd = cfg.environment === "production";
  const merchantId = isProd ? cfg.merchant_id_production : cfg.merchant_id_sandbox;
  const merchantKey = isProd ? cfg.merchant_key_production : cfg.merchant_key_sandbox;
  if (!merchantId || !merchantKey) return null;
  const baseUrl = isProd ? "https://api.braspag.com.br" : "https://apisandbox.braspag.com.br";
  const queryHost = isProd ? "https://apiquery.braspag.com.br" : "https://apiquerysandbox.braspag.com.br";

  function mapStatus(method: string, cieloStatus: number, ok: boolean): NormalizedPayment["internalStatus"] {
    if (!ok) return "failed";
    if (cieloStatus === 2) return "paid";
    if (cieloStatus === 1) return method === "credit" || method === "debit" ? "paid" : "authorized";
    if (cieloStatus === 12) return "pending";
    if (cieloStatus === 10) return "canceled";
    if (cieloStatus === 11) return "refunded";
    if (cieloStatus === 3 || cieloStatus === 13) return "failed";
    return "pending";
  }

  async function logCall(payload: any) {
    try { await admin.from("cielo_logs").insert(payload); } catch { /* ignore */ }
  }

  return {
    name: "cielo",
    supports() { return true; },

    async charge(input: ChargeInput): Promise<NormalizedPayment> {
      const c = input.customer;
      const customer = {
        Name: c.name.slice(0, 255),
        Identity: c.doc,
        IdentityType: c.identityType,
        Email: c.email.slice(0, 255),
      };
      const webhookUrl = `${input.webhookBaseUrl}/functions/v1/cielo-webhook?secret=${cfg.webhook_secret || ""}`;
      let payment: Record<string, unknown> = {};
      if (input.method === "credit") {
        const provider = isProd ? (cfg.provider_credit || "Cielo30") : "Simulado";
        if (!input.card?.number) {
          return failNorm("Dados do cartão obrigatórios", 400);
        }
        payment = {
          Type: "CreditCard",
          Amount: input.amountCents,
          Installments: Math.max(1, Math.min(12, Number(input.installments ?? 1))),
          Capture: cfg.default_capture ?? true,
          SoftDescriptor: cfg.default_soft_descriptor || undefined,
          Provider: provider,
          CreditCard: {
            CardNumber: input.card.number.replace(/\s/g, ""),
            Holder: input.card.holder || customer.Name,
            ExpirationDate: input.card.expiration,
            SecurityCode: String(input.card.cvv || ""),
            Brand: input.card.brand || "Visa",
          },
        };
      } else if (input.method === "debit") {
        const provider = isProd ? (cfg.provider_debit || "Cielo30") : "Simulado";
        if (!input.card?.number) return failNorm("Dados do cartão obrigatórios", 400);
        payment = {
          Type: "DebitCard",
          Amount: input.amountCents,
          Provider: provider,
          ReturnUrl: input.returnUrl || `${webhookUrl}&orderId=${input.orderId}`,
          Authenticate: isProd,
          DebitCard: {
            CardNumber: input.card.number.replace(/\s/g, ""),
            Holder: input.card.holder || customer.Name,
            ExpirationDate: input.card.expiration,
            SecurityCode: String(input.card.cvv || ""),
            Brand: input.card.brand || "Visa",
          },
        };
      } else if (input.method === "pix") {
        const pixProvider = isProd
          ? (cfg.provider_pix_production || cfg.provider_pix || "Cielo2")
          : (cfg.provider_pix_sandbox || "Cielo2");
        if (!isProd && pixProvider === "Cielo2") {
          return failNorm("Cielo2 Pix não tem sandbox", 400);
        }
        payment = {
          Type: "Pix",
          Amount: input.amountCents,
          Provider: pixProvider,
          ...(pixProvider === "Cielo2" ? { QrCodeExpiration: Math.max(60, Math.min(86400, Number(input.pixExpirationSeconds ?? 1800))) } : {}),
        };
      } else if (input.method === "boleto") {
        const provider = isProd ? (cfg.provider_boleto || "Bradesco2") : "Simulado";
        const days = Math.max(1, Math.min(30, Number(input.boletoDueDays ?? 3)));
        const due = new Date(); due.setDate(due.getDate() + days);
        payment = {
          Type: "Boleto",
          Amount: input.amountCents,
          Provider: provider,
          Address: `${c.address?.street || "S/E"}, ${c.address?.number || "S/N"}`,
          BoletoNumber: String(Date.now()).slice(-8),
          Assignor: cfg.default_soft_descriptor || "Jotazo Telecom",
          Demonstrative: `Pedido ${input.merchantOrderId.slice(0, 8)}`,
          ExpirationDate: due.toISOString().slice(0, 10),
          Identification: c.doc,
          Instructions: "Pagar até o vencimento.",
        };
      }

      const body = { MerchantOrderId: input.merchantOrderId, Customer: customer, Payment: payment };
      const requestId = crypto.randomUUID();
      const started = Date.now();
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/v2/sales/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", MerchantId: merchantId, MerchantKey: merchantKey, RequestId: requestId },
          body: JSON.stringify(body),
        });
      } catch (e) {
        return failNorm(`network: ${(e as Error).message}`, 0);
      }
      const duration = Date.now() - started;
      const text = await res.text();
      let resp: any = null;
      try { resp = text ? JSON.parse(text) : null; } catch { resp = text; }
      const p = resp?.Payment ?? {};
      const cieloStatus = Number(p?.Status ?? 0);
      const ok = res.status >= 200 && res.status < 300;
      const internalStatus = mapStatus(input.method, cieloStatus, ok);

      await logCall({
        direction: "outbound",
        endpoint: `/v2/sales/ (checkout-${input.method})`,
        method: "POST",
        request_id: requestId,
        merchant_order_id: input.merchantOrderId,
        payment_id: p?.PaymentId ?? null,
        status_code: res.status,
        request_body: maskSensitive(body),
        response_body: resp,
        duration_ms: duration,
      });

      return {
        provider: "cielo",
        ok: ok && internalStatus !== "failed",
        internalStatus,
        providerPaymentId: p?.PaymentId ?? null,
        providerStatus: cieloStatus,
        httpStatus: res.status,
        pix: input.method === "pix" ? { qrBase64: p?.QrCodeBase64Image, qrString: p?.QrCodeString, expiresAt: p?.ExpirationDate } : undefined,
        boleto: input.method === "boleto" ? { url: p?.Url, digitableLine: p?.DigitableLine, barCode: p?.BarCodeNumber, dueDate: p?.ExpirationDate } : undefined,
        card: (input.method === "credit" || input.method === "debit") ? {
          authorizationCode: p?.AuthorizationCode, proofOfSale: p?.ProofOfSale, authenticationUrl: p?.AuthenticationUrl,
        } : undefined,
        error: ok ? undefined : (typeof resp === "string" ? resp : resp?.[0]?.Message || resp?.Message || `HTTP ${res.status}`),
        raw: resp,
        extraOrderColumns: {
          cielo_payment_id: p?.PaymentId ?? null,
          cielo_proof_of_sale: p?.ProofOfSale ?? null,
          cielo_auth_code: p?.AuthorizationCode ?? null,
          pix_qr_code: p?.QrCodeBase64Image ?? null,
          pix_qr_string: p?.QrCodeString ?? null,
          pix_expires_at: p?.ExpirationDate ?? null,
          boleto_url: p?.Url ?? null,
          boleto_digitable_line: p?.DigitableLine ?? null,
          boleto_bar_code: p?.BarCodeNumber ?? null,
          boleto_due_date: p?.ExpirationDate ?? null,
          authentication_url: p?.AuthenticationUrl ?? null,
        },
      };
    },

    async fetchStatus(providerPaymentId: string, method): Promise<NormalizedStatus> {
      const res = await fetch(`${queryHost}/v2/sales/${providerPaymentId}`, {
        headers: { "Content-Type": "application/json", MerchantId: merchantId, MerchantKey: merchantKey },
      });
      const text = await res.text();
      let resp: any = null;
      try { resp = JSON.parse(text); } catch { resp = text; }
      const cieloStatus = Number(resp?.Payment?.Status ?? 0);
      return {
        internalStatus: mapStatus(method, cieloStatus, res.ok),
        providerStatus: cieloStatus,
        raw: resp,
      };
    },
  };
}

function maskSensitive(b: any) {
  const c = JSON.parse(JSON.stringify(b));
  if (c?.Payment?.CreditCard) c.Payment.CreditCard = { ...c.Payment.CreditCard, CardNumber: "[masked]", SecurityCode: "[masked]" };
  if (c?.Payment?.DebitCard) c.Payment.DebitCard = { ...c.Payment.DebitCard, CardNumber: "[masked]", SecurityCode: "[masked]" };
  return c;
}

function failNorm(error: string, httpStatus: number): NormalizedPayment {
  return { provider: "cielo", ok: false, internalStatus: "failed", httpStatus, error, raw: null };
}
