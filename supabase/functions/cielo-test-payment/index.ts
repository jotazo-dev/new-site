import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MAX_PROD_AMOUNT = 500; // R$ 5,00 em centavos

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ ok: false, message: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ ok: false, message: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roleData } = await admin.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!roleData) return json({ ok: false, message: "Forbidden" }, 403);

    const input = await req.json();
    const method = String(input.method || "").toLowerCase();
    const amount = Math.max(0, Math.floor(Number(input.amount ?? 0)));
    if (!["credit", "debit", "boleto", "pix"].includes(method)) {
      return json({ ok: false, message: "method inválido" }, 400);
    }
    if (method !== "credit" && amount <= 0) {
      return json({ ok: false, message: "amount obrigatório (centavos)" }, 400);
    }

    const { data: cfg } = await admin.from("cielo_config").select("*").maybeSingle();
    if (!cfg) return json({ ok: false, message: "Configuração Cielo não encontrada" }, 400);

    const isProd = cfg.environment === "production";
    const merchantId = isProd ? cfg.merchant_id_production : cfg.merchant_id_sandbox;
    const merchantKey = isProd ? cfg.merchant_key_production : cfg.merchant_key_sandbox;
    if (!merchantId || !merchantKey) {
      return json({ ok: false, message: `Credenciais ${isProd ? "produção" : "sandbox"} ausentes` }, 400);
    }
    if (isProd && amount > MAX_PROD_AMOUNT) {
      return json({ ok: false, message: `Em produção o valor de teste é limitado a R$ ${(MAX_PROD_AMOUNT / 100).toFixed(2)}` }, 400);
    }

    const baseUrl = isProd ? "https://api.braspag.com.br" : "https://apisandbox.braspag.com.br";
    const merchantOrderId = `test-${method}-${Date.now()}`;
    const customer = {
      Name: input.customer?.name || "Cliente Teste",
      Identity: input.customer?.identity || "12345678909",
      IdentityType: "CPF",
      Email: input.customer?.email || "teste@jotazo.com.br",
    };

    let payment: Record<string, unknown> = {};

    if (method === "credit") {
      // Sandbox SEMPRE usa "Simulado" (provider oficial de testes Cielo). Produção usa config.
      const provider = isProd ? (cfg.provider_credit || "Cielo30") : "Simulado";
      payment = {
        Type: "CreditCard",
        Amount: amount > 0 ? amount : 100,
        Installments: Math.max(1, Math.min(12, Number(input.card?.installments ?? 1))),
        Capture: input.capture ?? cfg.default_capture ?? false,
        SoftDescriptor: cfg.default_soft_descriptor || undefined,
        Provider: provider,
        CreditCard: {
          CardNumber: input.card?.number || "4024007197692931",
          Holder: input.card?.holder || "Teste Cielo",
          ExpirationDate: input.card?.expiration || "12/2030",
          SecurityCode: input.card?.cvv || "123",
          Brand: input.card?.brand || "Visa",
        },
      };
    } else if (method === "debit") {
      // Débito exige 3DS 2.2 em produção. Sandbox aceita "Simulado" sem 3DS real.
      const provider = isProd ? (cfg.provider_debit || "Cielo30") : "Simulado";
      payment = {
        Type: "DebitCard",
        Amount: amount,
        Provider: provider,
        ReturnUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/cielo-webhook?secret=${cfg.webhook_secret || ""}`,
        Authenticate: isProd, // sandbox Simulado dispensa 3DS
        DebitCard: {
          CardNumber: input.card?.number || "4024007197692931",
          Holder: input.card?.holder || "Teste Cielo",
          ExpirationDate: input.card?.expiration || "12/2030",
          SecurityCode: input.card?.cvv || "123",
          Brand: input.card?.brand || "Visa",
        },
      };
    } else if (method === "boleto") {
      // Boleto sandbox SEMPRE "Simulado". Produção usa banco configurado.
      const provider = isProd ? (cfg.provider_boleto || "Bradesco2") : "Simulado";
      const due = new Date();
      due.setDate(due.getDate() + Math.max(1, Number(input.boletoDueDays ?? 3)));
      const dueStr = due.toISOString().slice(0, 10);
      payment = {
        Type: "Boleto",
        Amount: amount,
        Provider: provider,
        Address: "Rua Teste, 100",
        BoletoNumber: String(Date.now()).slice(-8),
        Assignor: "Jotazo Telecom",
        Demonstrative: "Pagamento de teste",
        ExpirationDate: dueStr,
        Identification: customer.Identity,
        Instructions: "Pagar até o vencimento.",
      };
    } else if (method === "pix") {
      // Cielo2 (nova integração Pix oficial) NÃO tem sandbox — docs.cielo.com.br/gateway/docs/pix-cielo.
      // Em sandbox, só faz sentido testar se o admin sobrescrever para um provider legado (Cielo30/BBPix) e a conta tiver afiliação.
      const pixProvider = String(
        input.provider ||
        (isProd
          ? (cfg.provider_pix_production || cfg.provider_pix || "Cielo2")
          : (cfg.provider_pix_sandbox || "Cielo2"))
      );
      if (!isProd && pixProvider === "Cielo2") {
        return json({
          ok: false,
          environment: "sandbox",
          paymentType: "Pix",
          providerUsed: pixProvider,
          message: "Cielo2 Pix não tem sandbox.",
          diagnostic: "A nova integração Pix da Cielo (Cielo2) não possui ambiente sandbox segundo a documentação oficial. Para testar Pix, ative o ambiente Produção e use valor mínimo (R$ 0,01), ou sobrescreva o provider para um legado (Cielo30/BBPix) caso sua conta sandbox tenha afiliação Pix nesse provider.",
        }, 400);
      }
      const qrExpiration = Math.max(60, Math.min(86400, Number(input.qrCodeExpiration ?? 3600)));
      payment = {
        Type: "Pix",
        Amount: amount,
        Provider: pixProvider,
        // Cielo2 aceita expiração configurável (máx 24h)
        ...(pixProvider === "Cielo2" ? { QrCodeExpiration: qrExpiration } : {}),
      };
    }

    const body = { MerchantOrderId: merchantOrderId, Customer: customer, Payment: payment };

    const requestId = crypto.randomUUID();
    const started = Date.now();
    const res = await fetch(`${baseUrl}/v2/sales/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        MerchantId: merchantId,
        MerchantKey: merchantKey,
        RequestId: requestId,
      },
      body: JSON.stringify(body),
    });
    const duration = Date.now() - started;
    const text = await res.text();
    let resp: any = null;
    try { resp = text ? JSON.parse(text) : null; } catch { resp = text; }

    await admin.from("cielo_logs").insert({
      direction: "outbound",
      endpoint: `/v2/sales/ (test-${method})`,
      method: "POST",
      request_id: requestId,
      merchant_order_id: merchantOrderId,
      payment_id: resp?.Payment?.PaymentId ?? null,
      status_code: res.status,
      request_body: maskSensitive(body),
      response_body: resp,
      duration_ms: duration,
    });

    const p = resp?.Payment ?? {};
    const ok = res.status >= 200 && res.status < 300;
    const errArr = Array.isArray(resp) ? resp : null;
    const errorCode = errArr?.[0]?.Code;
    const errorRaw = errArr?.[0]?.Message;
    let friendly: string | undefined;
    let diagnostic: string | undefined;
    if (!ok) {
      const providerSent = (payment as any).Provider;
      if (res.status === 401) {
        friendly = "Credenciais inválidas — confira MerchantId/MerchantKey e o ambiente (sandbox vs produção).";
      } else if (errorCode === 102) {
        friendly = `Provider "${providerSent}" não configurado para este merchant. Solicite ativação à Cielo/Braspag.`;
      } else if (errorCode === 129 || (typeof errorRaw === "string" && /affiliation not found/i.test(errorRaw))) {
        friendly = `Affiliation not found — o merchant autenticou, mas não há afiliação ${method.toUpperCase()} ativa para o provider "${providerSent}" no ambiente ${isProd ? "produção" : "sandbox"}.`;
        diagnostic = method === "pix"
          ? `Confirme com a Cielo se o MerchantId ${isProd ? "de produção" : "sandbox"} tem Pix habilitado no provider "${providerSent}". Conforme docs oficiais, a nova integração Pix usa "Cielo2" em sandbox e produção. Você pode trocar o provider em Admin → Cielo → Providers padrão.`
          : `Solicite à Cielo a habilitação do provider "${providerSent}" para ${method} neste MerchantId.`;
      }
    }
    return json({
      ok,
      status: p.Status,
      paymentId: p.PaymentId,
      authorizationCode: p.AuthorizationCode,
      proofOfSale: p.ProofOfSale,
      returnMessage: p.ReturnMessage || errorRaw,
      qrCodeBase64: p.QrCodeBase64Image,
      qrCodeString: p.QrCodeString,
      boletoUrl: p.Url,
      digitableLine: p.DigitableLine,
      barCodeNumber: p.BarCodeNumber,
      authenticationUrl: p.AuthenticationUrl,
      providerUsed: (payment as any).Provider,
      errorCode,
      message: friendly,
      diagnostic,
      httpStatus: res.status,
      environment: isProd ? "production" : "sandbox",
      paymentType: payment.Type,
      raw: resp,
    });
  } catch (e) {
    return json({ ok: false, message: (e as Error).message }, 500);
  }
});

function maskSensitive(body: any) {
  const c = JSON.parse(JSON.stringify(body));
  if (c?.Payment?.CreditCard) c.Payment.CreditCard = { ...c.Payment.CreditCard, CardNumber: "[masked]", SecurityCode: "[masked]" };
  if (c?.Payment?.DebitCard) c.Payment.DebitCard = { ...c.Payment.DebitCard, CardNumber: "[masked]", SecurityCode: "[masked]" };
  return c;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
