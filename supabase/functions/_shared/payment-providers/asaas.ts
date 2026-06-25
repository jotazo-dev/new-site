// deno-lint-ignore-file no-explicit-any
import type { ChargeInput, NormalizedPayment, NormalizedStatus, PaymentProvider, ProviderContext } from "./types.ts";

/**
 * Asaas — POST /payments. Suporta PIX, BOLETO, CREDIT_CARD.
 * Para cartão exige tokenização (input.card.token) ou os 4 campos (em modo PCI completo).
 */
export async function makeAsaas(ctx: ProviderContext): Promise<PaymentProvider | null> {
  const { admin } = ctx;
  const { data: cfg } = await admin.from("asaas_config").select("*").maybeSingle();
  if (!cfg || cfg.active === false) return null;
  const isProd = cfg.environment === "production";
  const apiKey = isProd ? cfg.production_api_key : cfg.sandbox_api_key;
  if (!apiKey) return null;
  const baseUrl = isProd ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";

  function mapStatus(s: string): NormalizedPayment["internalStatus"] {
    switch (s) {
      case "CONFIRMED":
      case "RECEIVED":
      case "RECEIVED_IN_CASH": return "paid";
      case "PENDING":
      case "AWAITING_RISK_ANALYSIS": return "pending";
      case "REFUNDED":
      case "CHARGEBACK_REQUESTED":
      case "CHARGEBACK_DISPUTE":
      case "AWAITING_CHARGEBACK_REVERSAL": return "refunded";
      case "OVERDUE": return "pending";
      case "DELETED": return "canceled";
      default: return "pending";
    }
  }

  async function logCall(payload: any) {
    try { await admin.from("asaas_logs").insert(payload); } catch { /* ignore */ }
  }

  async function api(path: string, init: RequestInit) {
    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          ...(init.headers || {}),
          access_token: apiKey,
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      return { ok: false, status: 0, json: null, duration: 0, error: (e as Error).message };
    }
    const duration = Date.now() - started;
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    return { ok: res.ok, status: res.status, json, duration, error: null as string | null };
  }

  async function ensureCustomer(c: ChargeInput["customer"]) {
    // Find existing customer by cpfCnpj
    const search = await api(`/customers?cpfCnpj=${encodeURIComponent(c.doc)}`, { method: "GET" });
    const existing = search.json?.data?.[0];
    if (existing?.id) return existing.id as string;
    const created = await api("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: c.name,
        email: c.email,
        cpfCnpj: c.doc,
        mobilePhone: c.phone || undefined,
        postalCode: c.address?.cep?.replace(/\D/g, ""),
        address: c.address?.street,
        addressNumber: c.address?.number,
        complement: c.address?.complement,
        province: c.address?.district,
        notificationDisabled: cfg.notification_disabled ?? true,
      }),
    });
    return created.json?.id || null;
  }

  return {
    name: "asaas",
    supports(method) { return method === "pix" || method === "boleto" || method === "credit"; },

    async charge(input: ChargeInput): Promise<NormalizedPayment> {
      if (!["pix", "boleto", "credit"].includes(input.method)) {
        return failNorm("Método não suportado pelo Asaas", 400);
      }
      const c = input.customer;
      let customerId: string | null = null;
      if (cfg.auto_create_customer !== false) {
        customerId = await ensureCustomer(c);
        if (!customerId) return failNorm("Falha ao criar customer Asaas", 500);
      }

      const billingType = input.method === "pix" ? "PIX" : input.method === "boleto" ? "BOLETO" : "CREDIT_CARD";
      const due = new Date();
      due.setDate(due.getDate() + Math.max(1, Math.min(30, Number(input.boletoDueDays ?? cfg.default_due_days ?? 3))));
      const body: any = {
        customer: customerId,
        billingType,
        value: +(input.amountCents / 100).toFixed(2),
        dueDate: due.toISOString().slice(0, 10),
        description: `Pedido ${input.merchantOrderId.slice(0, 8)}`,
        externalReference: input.orderId,
      };

      if (input.method === "credit") {
        const tok = (input.card as any)?.token;
        if (tok) {
          body.creditCardToken = tok;
        } else if (input.card?.number) {
          body.creditCard = {
            holderName: input.card.holder,
            number: input.card.number.replace(/\s/g, ""),
            expiryMonth: input.card.expiration.split("/")[0],
            expiryYear: input.card.expiration.split("/")[1]?.padStart(4, "20"),
            ccv: input.card.cvv,
          };
          body.creditCardHolderInfo = {
            name: c.name, email: c.email, cpfCnpj: c.doc,
            postalCode: c.address?.cep?.replace(/\D/g, "") || "00000000",
            addressNumber: c.address?.number || "S/N",
            phone: c.phone || undefined,
          };
        } else {
          return failNorm("Cartão obrigatório", 400);
        }
        body.installmentCount = Math.max(1, Math.min(12, Number(input.installments ?? 1)));
        if (body.installmentCount > 1) {
          body.totalValue = body.value;
          delete body.value;
        }
      }

      const r = await api("/payments", { method: "POST", body: JSON.stringify(body) });
      await logCall({
        direction: "outbound",
        endpoint: `/payments (checkout-${input.method})`,
        method: "POST",
        external_reference: input.orderId,
        payment_id: r.json?.id ?? null,
        status_code: r.status,
        request_body: maskAsaas(body),
        response_body: r.json,
        duration_ms: r.duration,
      });

      if (!r.ok || !r.json?.id) {
        return failNorm(r.json?.errors?.[0]?.description || r.error || `HTTP ${r.status}`, r.status, r.json);
      }
      const j = r.json;
      const internalStatus = mapStatus(j.status);

      // Pix QR
      let pix: NormalizedPayment["pix"];
      if (input.method === "pix") {
        const qr = await api(`/payments/${j.id}/pixQrCode`, { method: "GET" });
        pix = {
          qrBase64: qr.json?.encodedImage,
          qrString: qr.json?.payload,
          expiresAt: qr.json?.expirationDate,
        };
      }

      // Boleto identification
      let boleto: NormalizedPayment["boleto"];
      if (input.method === "boleto") {
        const id = await api(`/payments/${j.id}/identificationField`, { method: "GET" });
        boleto = {
          url: j.bankSlipUrl,
          digitableLine: id.json?.identificationField,
          barCode: id.json?.barCode,
          dueDate: j.dueDate,
        };
      }

      return {
        provider: "asaas",
        ok: internalStatus !== "failed",
        internalStatus,
        providerPaymentId: j.id,
        providerStatus: j.status,
        httpStatus: r.status,
        pix, boleto,
        card: input.method === "credit" ? { authorizationCode: j.creditCard?.creditCardToken, proofOfSale: j.id } : undefined,
        raw: j,
        extraOrderColumns: {
          pix_qr_code: pix?.qrBase64 ?? null,
          pix_qr_string: pix?.qrString ?? null,
          pix_expires_at: pix?.expiresAt ?? null,
          boleto_url: boleto?.url ?? null,
          boleto_digitable_line: boleto?.digitableLine ?? null,
          boleto_bar_code: boleto?.barCode ?? null,
          boleto_due_date: boleto?.dueDate ?? null,
        },
      };
    },

    async fetchStatus(providerPaymentId: string): Promise<NormalizedStatus> {
      const r = await api(`/payments/${providerPaymentId}`, { method: "GET" });
      return {
        internalStatus: mapStatus(r.json?.status ?? ""),
        providerStatus: r.json?.status ?? null,
        raw: r.json,
      };
    },
  };
}

function maskAsaas(b: any) {
  const c = JSON.parse(JSON.stringify(b));
  if (c.creditCard) c.creditCard = { ...c.creditCard, number: "[masked]", ccv: "[masked]" };
  if (c.creditCardToken) c.creditCardToken = "[masked]";
  return c;
}

function failNorm(error: string, httpStatus: number, raw: any = null): NormalizedPayment {
  return { provider: "asaas", ok: false, internalStatus: "failed", httpStatus, error, raw };
}
