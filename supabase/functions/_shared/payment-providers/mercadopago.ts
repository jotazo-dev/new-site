// deno-lint-ignore-file no-explicit-any
import type { ChargeInput, NormalizedPayment, NormalizedStatus, PaymentProvider, ProviderContext } from "./types.ts";

/**
 * Mercado Pago — Checkout Transparente via /v1/payments.
 * Suporta Pix e Boleto out-of-the-box. Cartão requer token gerado no front
 * (MP.js v2 / Bricks). Para cartão, esperamos input.card.token; se ausente, falha.
 */
export async function makeMercadoPago(ctx: ProviderContext): Promise<PaymentProvider | null> {
  const { admin } = ctx;
  const { data: cfg } = await admin.from("mp_config").select("*").maybeSingle();
  if (!cfg) return null;
  const isProd = cfg.environment === "production";
  const token = isProd ? cfg.access_token_production : cfg.access_token_sandbox;
  if (!token) return null;
  const baseUrl = "https://api.mercadopago.com";

  function mapStatus(s: string | undefined, detail?: string): NormalizedPayment["internalStatus"] {
    switch (s) {
      case "approved": return "paid";
      case "authorized": return "authorized";
      case "in_process":
      case "pending": return "pending";
      case "rejected": return "failed";
      case "cancelled": return "canceled";
      case "refunded":
      case "charged_back": return "refunded";
      default: return "pending";
    }
  }

  async function logCall(payload: any) {
    try { await admin.from("mp_logs").insert(payload); } catch { /* ignore */ }
  }

  async function post(path: string, body: any, idempotencyKey: string) {
    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return { ok: false, status: 0, json: null, error: (e as Error).message, duration: 0 };
    }
    const duration = Date.now() - started;
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    return { ok: res.ok, status: res.status, json, duration, error: null as string | null };
  }

  return {
    name: "mercadopago",
    supports(method) { return method === "pix" || method === "boleto" || method === "credit" || method === "debit"; },

    async charge(input: ChargeInput): Promise<NormalizedPayment> {
      const c = input.customer;
      const amount = +(input.amountCents / 100).toFixed(2);
      const idem = crypto.randomUUID();
      const common: any = {
        transaction_amount: amount,
        description: `Pedido ${input.merchantOrderId.slice(0, 8)}`,
        external_reference: input.orderId,
        statement_descriptor: cfg.default_statement_descriptor || "JOTAZO",
        notification_url: `${input.webhookBaseUrl}/functions/v1/mercadopago-webhook`,
        payer: {
          email: c.email,
          first_name: c.name.split(" ")[0],
          last_name: c.name.split(" ").slice(1).join(" ") || c.name.split(" ")[0],
          identification: { type: c.identityType, number: c.doc },
        },
      };

      let body: any;
      if (input.method === "pix") {
        const minutes = Math.max(5, Math.min(1440, Number(cfg.pix_expiration_minutes || 30)));
        const exp = new Date(Date.now() + minutes * 60_000);
        body = {
          ...common,
          payment_method_id: "pix",
          date_of_expiration: isoWithOffset(exp),
        };
      } else if (input.method === "boleto") {
        const days = Math.max(1, Math.min(30, Number(input.boletoDueDays ?? cfg.boleto_due_days ?? 3)));
        const due = new Date(); due.setDate(due.getDate() + days);
        body = {
          ...common,
          payment_method_id: "bolbradesco",
          date_of_expiration: isoWithOffset(due),
          payer: {
            ...common.payer,
            address: c.address ? {
              zip_code: c.address.cep?.replace(/\D/g, ""),
              street_name: c.address.street,
              street_number: c.address.number,
              neighborhood: c.address.district,
              city: c.address.city,
              federal_unit: c.address.state,
            } : undefined,
          },
        };
      } else if (input.method === "credit" || input.method === "debit") {
        const cardToken = (input.card as any)?.token;
        if (!cardToken) {
          return failNorm("Mercado Pago cartão exige token (MP.js) — não suportado neste front", 400);
        }
        body = {
          ...common,
          token: cardToken,
          installments: input.method === "credit" ? Math.max(1, Math.min(cfg.max_installments || 12, Number(input.installments ?? 1))) : 1,
          payment_method_id: input.card?.brand?.toLowerCase() || undefined,
          binary_mode: cfg.binary_mode ?? false,
          capture: cfg.default_capture ?? true,
        };
      } else {
        return failNorm("Método não suportado", 400);
      }

      const r = await post("/v1/payments", body, idem);
      await logCall({
        direction: "outbound",
        endpoint: `/v1/payments (checkout-${input.method})`,
        method: "POST",
        idempotency_key: idem,
        external_reference: input.orderId,
        payment_id: r.json?.id ?? null,
        status_code: r.status,
        request_body: body,
        response_body: r.json,
        duration_ms: r.duration,
      });

      if (!r.ok || !r.json?.id) {
        return failNorm(r.json?.message || r.error || `HTTP ${r.status}`, r.status, r.json);
      }
      const j = r.json;
      const internalStatus = mapStatus(j.status, j.status_detail);
      const poi = j.point_of_interaction?.transaction_data || {};
      const tdetails = j.transaction_details || {};
      return {
        provider: "mercadopago",
        ok: internalStatus !== "failed",
        internalStatus,
        providerPaymentId: String(j.id),
        providerStatus: j.status,
        httpStatus: r.status,
        pix: input.method === "pix" ? {
          qrBase64: poi.qr_code_base64,
          qrString: poi.qr_code,
          expiresAt: j.date_of_expiration,
        } : undefined,
        boleto: input.method === "boleto" ? {
          url: tdetails.external_resource_url,
          digitableLine: j.barcode?.content,
          barCode: j.barcode?.content,
          dueDate: j.date_of_expiration,
        } : undefined,
        card: (input.method === "credit" || input.method === "debit") ? {
          authorizationCode: j.authorization_code,
          proofOfSale: String(j.id),
        } : undefined,
        raw: j,
        extraOrderColumns: {
          pix_qr_code: poi.qr_code_base64 ?? null,
          pix_qr_string: poi.qr_code ?? null,
          pix_expires_at: j.date_of_expiration ?? null,
          boleto_url: tdetails.external_resource_url ?? null,
          boleto_digitable_line: j.barcode?.content ?? null,
          boleto_bar_code: j.barcode?.content ?? null,
          boleto_due_date: j.date_of_expiration ?? null,
        },
      };
    },

    async fetchStatus(providerPaymentId: string): Promise<NormalizedStatus> {
      const res = await fetch(`${baseUrl}/v1/payments/${providerPaymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let j: any = null;
      try { j = JSON.parse(text); } catch { j = text; }
      return {
        internalStatus: mapStatus(j?.status, j?.status_detail),
        providerStatus: j?.status ?? null,
        raw: j,
      };
    },
  };
}

function isoWithOffset(d: Date) {
  // MP expects "YYYY-MM-DDTHH:mm:ss.SSS-03:00" style
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  const tz = -d.getTimezoneOffset();
  const sign = tz >= 0 ? "+" : "-";
  const offH = pad(Math.floor(Math.abs(tz) / 60));
  const offM = pad(Math.abs(tz) % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000${sign}${offH}:${offM}`;
}

function failNorm(error: string, httpStatus: number, raw: any = null): NormalizedPayment {
  return { provider: "mercadopago", ok: false, internalStatus: "failed", httpStatus, error, raw };
}
