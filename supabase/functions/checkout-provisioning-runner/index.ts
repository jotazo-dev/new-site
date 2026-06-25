// checkout-provisioning-runner
// Runner do checkout pago → ativação Algar (reaproveita algar-mvno-api, mvno_activations e send-mvno-activation-email).
// Acionado por: (a) cielo-webhook quando pedido vira "paid", (b) checkout-poll-status, (c) cron pg_cron a cada minuto.
//
// Princípios:
// - Não duplica credenciais (lê de `integrations` provider='algar' via algar-mvno-api).
// - Não duplica orquestração (chama algar-mvno-api como o painel admin).
// - Registra no MESMO mvno_activations do painel admin, com source='checkout'.
// - Manda e-mail pelo MESMO send-mvno-activation-email.
// - Idempotente: usa provisioning_jobs + mvno_activations (UNIQUE checkout_order_id WHERE source='checkout').

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const BACKOFF_MIN = [1, 5, 15, 60, 240];
const MAX_ATTEMPTS = BACKOFF_MIN.length;

type Item = { id: string; name?: string; qty?: number; unit_cents?: number; category?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let targetOrderId: string | null = null;
  let forceMock = false;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      targetOrderId = body?.orderId || null;
      forceMock = body?.forceMock === true;
    }

    const processed: string[] = [];

    if (targetOrderId) {
      const r = await processOrder(targetOrderId, forceMock);
      processed.push(`${targetOrderId}:${r}`);
    } else {
      // cron mode: pega até 5 jobs prontos
      for (let i = 0; i < 5; i++) {
        const orderId = await pickPendingJob();
        if (!orderId) break;
        const r = await processOrder(orderId, false);
        processed.push(`${orderId}:${r}`);
      }
    }

    return json({ ok: true, processed });
  } catch (e: any) {
    console.error("[runner] fatal", e?.message || e);
    return json({ ok: false, error: e?.message || String(e) });
  }
});

async function pickPendingJob(): Promise<string | null> {
  // Lock 1 job via update returning (SKIP LOCKED equivalente em RPC seria ideal; aqui usamos compare-and-set).
  const { data, error } = await admin
    .from("provisioning_jobs")
    .select("id, order_id, attempts, status, next_run_at, locked_at")
    .in("status", ["pending"])
    .lte("next_run_at", new Date().toISOString())
    .or("locked_at.is.null,locked_at.lt." + new Date(Date.now() - 5 * 60_000).toISOString())
    .order("next_run_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  // Tenta travar
  const lockToken = crypto.randomUUID();
  const { data: locked } = await admin
    .from("provisioning_jobs")
    .update({ locked_at: new Date().toISOString(), locked_by: lockToken, status: "running" })
    .eq("id", (data as any).id)
    .is("locked_at", null)
    .select("order_id")
    .maybeSingle();
  return (locked as any)?.order_id || null;
}

async function processOrder(orderId: string, forceMock = false): Promise<string> {
  // Carrega pedido
  const { data: order } = await admin.from("checkout_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return "order_missing";
  if ((order as any).status !== "paid") return "not_paid";
  if ((order as any).provisioning_status === "provisioned") return "already_done";

  // Já existe ativação concluída para este pedido?
  const { data: existing } = await admin
    .from("mvno_activations")
    .select("id, status")
    .eq("checkout_order_id", orderId)
    .eq("source", "checkout")
    .maybeSingle();
  if (existing && ["confirmed", "pending"].includes((existing as any).status)) {
    await admin.from("checkout_orders").update({ provisioning_status: "provisioned", provisioned_at: new Date().toISOString() }).eq("id", orderId);
    return "already_done";
  }

  await markRunning(orderId);

  const items: Item[] = Array.isArray((order as any).items) ? (order as any).items : [];
  const mobile = items.find((it) => (it.category || "").toLowerCase() === "movel" || (it.category || "").toLowerCase() === "mobile");
  if (!mobile) {
    // Nada para provisionar (pedido sem item móvel). Marca como provisionado vazio.
    await admin.from("checkout_orders").update({ provisioning_status: "provisioned", provisioned_at: new Date().toISOString() }).eq("id", orderId);
    await closeJob(orderId, "done");
    return "no_mobile_item";
  }

  const simKind: "esim" | "physical" = (order as any).sim_kind || "esim";

  // Resolve binding MVNO. Novo modelo: plans.rbx_plan_codigo → mvno_rbx_plan_map(rbx_plan_codigo, sim_kind)
  // Fallback: modelo antigo por plan_id.
  let mapRow: any = null;

  const { data: planRow } = await admin
    .from("plans")
    .select("rbx_plan_codigo")
    .eq("id", mobile.id)
    .maybeSingle();
  const rbxCodigo = (planRow as any)?.rbx_plan_codigo as string | null;

  if (rbxCodigo) {
    const { data: byRbx } = await admin
      .from("mvno_rbx_plan_map")
      .select("provider, product_sku, eai_plan_id, eai_plan_name, active")
      .eq("rbx_plan_codigo", rbxCodigo)
      .eq("sim_kind", simKind);
    const all = ((byRbx as any[]) || []).filter((r) => r.active !== false);
    mapRow = all.find((r) => r.provider === "algar") || all.find((r) => r.provider === "eai") || all[0];
  }

  if (!mapRow) {
    // Fallback: modelo antigo (mvno_rbx_plan_map.plan_id)
    const { data: byPlan } = await admin
      .from("mvno_rbx_plan_map")
      .select("provider, product_sku, eai_plan_id, eai_plan_name, active")
      .eq("plan_id", mobile.id)
      .eq("sim_kind", simKind);
    const all = ((byPlan as any[]) || []).filter((r) => r.active !== false);
    mapRow = all.find((r) => r.provider === "algar") || all.find((r) => r.provider === "eai") || all[0];
  }

  if (!mapRow) {
    return await failJob(orderId, `Plano ${mobile.id} (${simKind}) não tem mapeamento RBX→Operadora`, true);
  }
  const providerKey: "algar" | "eai" = (mapRow.provider === "eai" ? "eai" : "algar");

  if (providerKey === "eai") {
    return await processEaiActivation(order, mobile, simKind, mapRow, forceMock);
  }


  const productSku = mapRow.product_sku;
  if (!productSku) {
    return await failJob(orderId, `Plano RBX ${rbxCodigo || mobile.id} (${simKind}) provedor=algar sem product_sku`, true);
  }

  // Para SIM físico ainda sem ICCID atribuído → fica aguardando envio
  if (simKind === "physical" && !(order as any).iccid) {
    await admin.from("checkout_orders").update({ provisioning_status: "awaiting_shipment" }).eq("id", orderId);
    await closeJob(orderId, "pending", "Aguardando ICCID/envio do chip pelo admin", 60 * 24);
    return "awaiting_shipment";
  }

  // Obtem TN (caso ainda não tenha msisdn)
  let tn: string | undefined = (order as any).msisdn || undefined;
  if (!tn) {
    const tnRes = await algarProxy("/v2/tns/available", "GET", undefined, { limit: 5 }, forceMock);
    if (!tnRes?.ok) {
      return await failJob(orderId, `Falha buscar TN: ${tnRes?.error || tnRes?.status}`, false);
    }
    const list = (tnRes.data?.items || tnRes.data || []) as any[];
    const first = list[0];
    tn = first?.terminal || first?.tn;
    if (!tn) return await failJob(orderId, "Sem TN disponível na Algar", false);
  }

  // Monta body de ativação (mesma forma que /admin/mvno/nova-linha usa)
  const customer = ((order as any).customer || {}) as any;
  const ship = ((order as any).shipping_address || {}) as any;
  const port = ((order as any).portability || {}) as any;
  const doc = onlyDigits((order as any).customer_doc || customer.doc || customer.cpf || "");
  const birth = (order as any).customer_birthdate || customer.birthdate || customer.birthDate || "1990-01-01";
  const email = (order as any).customer_email || customer.email || "";
  const phoneRaw = onlyDigits(customer.phone || customer.celular || "");
  const phone = phoneRaw.length === 10 || phoneRaw.length === 11 ? "55" + phoneRaw : phoneRaw;
  const name = customer.name || customer.full_name || "";

  const subscriberRef = `CHK_${doc || orderId.slice(0, 8)}`;

  const serviceBody: any = {
    subscriber: {
      ref: subscriberRef,
      type: doc.length === 14 ? "company" : "individual",
      document: doc,
      name,
      birthdate: birth,
      email,
      contact_number: phone,
    },
    address: {
      zipCode: onlyDigits(ship.zipCode || ship.cep || ship.zip || ""),
      streetName: ship.street || ship.streetName || "",
      streetNumber: String(ship.number || ship.streetNumber || ""),
      complement: ship.complement || undefined,
      neighborhood: ship.neighborhood || "",
      city: ship.city || "",
      state: ship.state || "",
    },
    products: [productSku],
    cycle: 1,
    ref: `CHK_${orderId.slice(0, 8)}`,
    description: `Pedido ${(order as any).merchant_order_id || orderId}`,
  };

  const activatePayload: any = {
    tn,
    card: { type: simKind, iccid: (order as any).iccid || "" },
    service: serviceBody,
  };

  // Se for portabilidade, anexa
  if (port?.enabled) {
    activatePayload.portability = {
      current_msisdn: onlyDigits(port.current_msisdn || ""),
      current_operator: port.current_operator || port.operator_id || "",
      document: onlyDigits(port.current_doc || doc),
      window_id: port.window_id || undefined,
    };
  }

  const act = await algarProxy("/v2/mobilelines", "POST", activatePayload, undefined, forceMock);
  if (!act?.ok) {
    const msg = act?.error || JSON.stringify(act?.data || {}).slice(0, 240);
    return await failJob(orderId, `Algar /v2/mobilelines: (${act?.status}) ${msg}`, act?.status === 422);
  }

  const ad: any = act.data?.data ?? act.data ?? {};
  const card: any = ad.card || ad.sim || ad.mobileline?.card || {};
  const lineRef = ad.ref || ad.id || ad.mobileline?.id || ad.service?.id || "";
  const activationCode =
    card.activationData || ad.activation_code || ad.activationCode || ad.lpa || ad.mobileline?.activation_code || "";
  const qrPayload = ad.qr_code || ad.qrCode || card.activationData || activationCode || "";
  const iccidOut = card.iccid || ad.iccid || (order as any).iccid || "";

  // Insere/atualiza mvno_activations (UNIQUE por checkout_order_id quando source='checkout')
  const recordPayload: any = {
    provider: "algar",
    tn,
    iccid: iccidOut || null,
    sim_type: simKind === "physical" ? "sim" : "esim",
    product_sku: productSku,
    product_name: mobile.name || null,
    cycle: 1,
    locale: null,
    subscriber_doc: doc,
    subscriber_name: name,
    subscriber_email: email || null,
    subscriber_phone: phone || null,
    notes: `Pedido ${(order as any).merchant_order_id || orderId}`,
    raw_response: ad,
    activation_code: activationCode || null,
    qr_payload: qrPayload || null,
    status: "pending",
    email_status: email ? "not_sent" : "skipped",
    source: "checkout",
    checkout_order_id: orderId,
  };

  let activationId: string | undefined;
  if (existing) {
    const { data: upd } = await admin
      .from("mvno_activations")
      .update(recordPayload)
      .eq("id", (existing as any).id)
      .select("id")
      .maybeSingle();
    activationId = (upd as any)?.id;
  } else {
    const { data: ins, error: insErr } = await admin
      .from("mvno_activations")
      .insert(recordPayload)
      .select("id")
      .single();
    if (insErr) {
      // pode ter colidido com unique — tenta atualizar pelo lookup
      const { data: r2 } = await admin
        .from("mvno_activations")
        .select("id")
        .eq("checkout_order_id", orderId)
        .eq("source", "checkout")
        .maybeSingle();
      if ((r2 as any)?.id) {
        await admin.from("mvno_activations").update(recordPayload).eq("id", (r2 as any).id);
        activationId = (r2 as any).id;
      }
    } else {
      activationId = (ins as any).id;
    }
  }

  // Confirma na Algar (best-effort)
  if (lineRef) {
    try {
      const cf = await algarProxy(`/v2/mobilelines/${lineRef}`, "GET", undefined, undefined, forceMock);
      if (cf?.ok && activationId) {
        await admin
          .from("mvno_activations")
          .update({ status: "confirmed", raw_response: cf.data ?? ad })
          .eq("id", activationId);
      }
    } catch (_) {/* best-effort */}
  }

  // Atualiza pedido
  await admin.from("checkout_orders").update({
    provisioning_status: "provisioned",
    provisioned_at: new Date().toISOString(),
    msisdn: tn,
    iccid: iccidOut || (order as any).iccid,
    esim_activation_code: activationCode || null,
    esim_qr_url: qrPayload || null,
    algar_mobileline_id: lineRef || null,
  }).eq("id", orderId);

  // E-mail (mesma função usada pelo admin)
  if (email && activationId) {
    try {
      await admin.functions.invoke("send-mvno-activation-email", {
        body: {
          activationId,
          provider: "algar",
          tn,
          iccid: iccidOut,
          simType: simKind === "physical" ? "sim" : "esim",
          productName: mobile.name,
          productSku,
          cycle: 1,
          locale: null,
          subscriberName: name,
          subscriberDoc: doc,
          subscriberEmail: email,
          subscriberPhone: phone,
          notes: `Pedido ${(order as any).merchant_order_id || orderId}`,
          activationCode,
          qrPayload,
        },
      });
    } catch (e) {
      console.warn("[runner] email failed", (e as any)?.message);
    }
  }

  await closeJob(orderId, "done");
  return "provisioned";
}

async function algarProxy(path: string, method: string, body?: any, queryParams?: any, forceMock = false) {
  // Reaproveita o mesmo proxy do admin (algar-mvno-api): credenciais lidas server-side via integrations table.
  const url = `${SUPABASE_URL}/functions/v1/algar-mvno-api`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
    },
    body: JSON.stringify({ method, path, body, queryParams, forceMock }),
  });
  try {
    return await res.json();
  } catch {
    return { ok: false, status: res.status, error: await res.text() };
  }
}

async function markRunning(orderId: string) {
  await admin.from("checkout_orders").update({ provisioning_status: "running" }).eq("id", orderId);
}

async function closeJob(orderId: string, status: "done" | "pending", lastError?: string, delayMin?: number) {
  const patch: any = { status, locked_at: null, locked_by: null };
  if (status === "pending") {
    patch.next_run_at = new Date(Date.now() + (delayMin ?? 5) * 60_000).toISOString();
    if (lastError) patch.last_error = lastError;
  } else {
    patch.last_error = null;
  }
  await admin.from("provisioning_jobs").update(patch).eq("order_id", orderId);
}

async function failJob(orderId: string, error: string, permanent: boolean): Promise<string> {
  const { data: job } = await admin
    .from("provisioning_jobs")
    .select("attempts")
    .eq("order_id", orderId)
    .maybeSingle();
  const attempts = ((job as any)?.attempts || 0) + 1;
  const shouldGiveUp = permanent || attempts >= MAX_ATTEMPTS;
  const delay = BACKOFF_MIN[Math.min(attempts - 1, BACKOFF_MIN.length - 1)];

  await admin.from("provisioning_jobs").update({
    attempts,
    status: shouldGiveUp ? "failed" : "pending",
    next_run_at: new Date(Date.now() + delay * 60_000).toISOString(),
    last_error: error.slice(0, 500),
    locked_at: null,
    locked_by: null,
  }).eq("order_id", orderId);

  await admin.from("checkout_orders").update({
    provisioning_status: shouldGiveUp ? "manual_review" : "failed",
    provisioning_attempts: attempts,
    provisioning_last_error: error.slice(0, 500),
  }).eq("id", orderId);

  console.error(`[runner] order=${orderId} attempt=${attempts} err=${error}`);
  return shouldGiveUp ? "failed_permanent" : "retry_scheduled";
}

function onlyDigits(s: string) { return (s || "").replace(/\D/g, ""); }

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ============================================================
 * EAÍ MVNO activation (end-to-end via gateway/proxy direto)
 * - Reaproveita eai_config + eai_token_cache (mesmos da aba admin)
 * - Cria/recupera customer → cria cart de ativação → processa cart
 * - Persiste em mvno_activations (source=checkout) e dispara e-mail
 * ============================================================ */

type EaiCfg = {
  base_url: string;
  oauth_url: string;
  client_id: string;
  client_secret: string;
  company_token: string;
  company_token_header: string | null;
  environment: string;
  active: boolean;
};

async function eaiGetConfig(): Promise<EaiCfg | null> {
  const { data } = await admin.from("eai_config").select("*").limit(1).maybeSingle();
  return (data as EaiCfg) || null;
}

async function eaiGetCachedToken(): Promise<string | null> {
  const { data } = await admin.from("eai_token_cache").select("*").eq("id", 1).maybeSingle();
  if (!data) return null;
  const expiresAt = new Date((data as any).expires_at).getTime();
  if (expiresAt - Date.now() < 60_000) return null;
  return (data as any).access_token;
}

async function eaiFetchToken(cfg: EaiCfg): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.client_id,
    client_secret: cfg.client_secret,
  });
  const res = await fetch(cfg.oauth_url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OAuth ${res.status}: ${text.slice(0, 200)}`);
  const j = JSON.parse(text);
  const token = j.access_token as string | undefined;
  if (!token) throw new Error(`OAuth sem access_token`);
  const expiresIn = Number(j.expires_in ?? 3600);
  await admin.from("eai_token_cache").upsert({
    id: 1,
    access_token: token,
    token_type: j.token_type || "Bearer",
    expires_at: new Date(Date.now() + Math.max(60, expiresIn - 60) * 1000).toISOString(),
    scope: j.scope ?? null,
    obtained_at: new Date().toISOString(),
  });
  return token;
}

async function eaiToken(cfg: EaiCfg): Promise<string> {
  const c = await eaiGetCachedToken();
  if (c) return c;
  return await eaiFetchToken(cfg);
}

async function eaiCall(
  cfg: EaiCfg,
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: any,
): Promise<{ ok: boolean; status: number; data: any; text: string }> {
  const token = await eaiToken(cfg);
  const headerName = (cfg.company_token_header || "company-token").trim();
  const url = `${cfg.base_url.replace(/\/$/, "")}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    [headerName]: cfg.company_token,
    Accept: "application/json",
  };
  const init: RequestInit = { method, headers, signal: AbortSignal.timeout(30_000) };
  if (body !== undefined && method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = "application/json";
    (init as any).body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const started = Date.now();
  let status = 0, text = "", parsed: any = null;
  try {
    const res = await fetch(url, init);
    status = res.status;
    text = await res.text();
    try { parsed = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  } catch (e) {
    text = `fetch error: ${(e as Error).message}`;
  }
  // Loga em eai_logs para auditoria (mesma tabela do painel admin)
  try {
    await admin.from("eai_logs").insert({
      action: "runner:" + path,
      method,
      path,
      status: status || null,
      duration_ms: Date.now() - started,
      request_body: body ? (typeof body === "string" ? body : JSON.stringify(body)).slice(0, 2000) : null,
      response_body: (text || "").slice(0, 2000),
      error: (status >= 200 && status < 300) ? null : text.slice(0, 500),
      actor_id: null,
    });
  } catch (_) {/* best-effort */}
  return { ok: status >= 200 && status < 300, status, data: parsed, text };
}

async function processEaiActivation(
  order: any,
  mobile: Item,
  simKind: "esim" | "physical",
  mapRow: any,
  forceMock: boolean,
): Promise<string> {
  const orderId: string = order.id;

  // Mock mode: marca como provisioned simulado e retorna
  if (forceMock) {
    await admin.from("mvno_activations").insert({
      provider: "eai",
      tn: "5511900000000",
      iccid: order.iccid || null,
      sim_type: simKind === "physical" ? "sim" : "esim",
      product_sku: mapRow.eai_plan_id ? String(mapRow.eai_plan_id) : null,
      product_name: mapRow.eai_plan_name || mobile.name || null,
      cycle: 1,
      subscriber_doc: onlyDigits(order.customer_doc || ""),
      subscriber_name: order.customer?.name || "",
      subscriber_email: order.customer_email || null,
      notes: `[MOCK] Pedido ${order.merchant_order_id || orderId}`,
      raw_response: { mock: true },
      status: "confirmed",
      email_status: "skipped",
      source: "checkout",
      checkout_order_id: orderId,
    });
    await admin.from("checkout_orders").update({
      provisioning_status: "provisioned",
      provisioned_at: new Date().toISOString(),
      msisdn: "5511900000000",
    }).eq("id", orderId);
    await closeJob(orderId, "done");
    return "provisioned_mock";
  }

  const cfg = await eaiGetConfig();
  if (!cfg || !cfg.active) {
    return await failJob(orderId, "EAÍ não configurado/ativo em eai_config", true);
  }
  const eaiPlanId = mapRow.eai_plan_id ? String(mapRow.eai_plan_id) : "";
  if (!eaiPlanId) {
    return await failJob(orderId, `Plano RBX ${mobile.id} (${simKind}) provedor=eai sem eai_plan_id`, true);
  }
  if (simKind === "physical" && !order.iccid) {
    await admin.from("checkout_orders").update({ provisioning_status: "awaiting_shipment" }).eq("id", orderId);
    await closeJob(orderId, "pending", "Aguardando ICCID/envio do chip pelo admin", 60 * 24);
    return "awaiting_shipment";
  }

  const customer = order.customer || {};
  // Endereço: prioriza shipping (SIM físico) → fallback para o address do cliente (faturamento).
  const ship = order.shipping_address || customer.address || customer.billing_address || {};
  const port = order.portability || {};
  const doc = onlyDigits(order.customer_doc || customer.doc || customer.cpf || "");
  const email = order.customer_email || customer.email || "";
  const phoneRaw = onlyDigits(customer.phone || customer.celular || "");
  const phone = phoneRaw.length === 10 || phoneRaw.length === 11 ? "55" + phoneRaw : phoneRaw;
  const name = customer.name || customer.full_name || "";
  const birth = order.customer_birthdate || customer.birthdate || customer.birthDate || "1990-01-01";

  if (!doc) return await failJob(orderId, "EAÍ: CPF/CNPJ ausente no pedido", true);

  // 1. Resolve/cria customer
  let personId = "";
  try {
    const chk = await eaiCall(cfg, `/rest/service_eai/customers/check_already_exists/${doc}`, "GET");
    if (chk.ok) {
      const existsId = chk.data?.customerId || chk.data?.id || chk.data?.personId
        || chk.data?.data?.customerId || chk.data?.data?.id;
      const s = existsId !== undefined && existsId !== null ? String(existsId) : "";
      // EAÍ retorna {"id":"0"} quando o documento ainda não existe — tratar como inexistente.
      if (s && s !== "0") personId = s;
    }
  } catch (_) {/* segue para criação */}

  if (!personId) {
    const isCNPJ = doc.length === 14;
    // Resolve IBGE via ViaCEP + cidade EAÍ via /service_shared/cities/{ibge} → cityId
    const cep = onlyDigits(ship.zipCode || ship.cep || ship.zip || "");
    let cityId: string | null = null;
    let cityIbge: string | null = null;
    let stateAcr: string = ship.state || "";
    let cityName: string = ship.city || "";
    let neighborhood: string = ship.neighborhood || "";
    let streetName: string = ship.street || ship.streetName || "";
    if (cep && cep.length === 8) {
      try {
        const vc = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then((r) => r.json());
        if (vc && !vc.erro) {
          if (vc.ibge) {
            cityIbge = String(vc.ibge);
            const cityRes = await eaiCall(cfg, `/rest/service_shared/cities/${vc.ibge}`, "GET");
            const c = cityRes.data?.city || cityRes.data?.data || cityRes.data || {};
            cityId = c?.id ? String(c.id) : null;
          }
          if (!stateAcr) stateAcr = vc.uf || "";
          if (!cityName) cityName = vc.localidade || "";
          if (!neighborhood) neighborhood = vc.bairro || "";
          if (!streetName) streetName = vc.logradouro || "";
        }
      } catch (_) {/* segue */}
    }
    const addressObj: any = {
      zipCode: cep,
      streetName,
      streetNumber: String(ship.number || ship.streetNumber || "S/N"),
      complement: ship.complement || "",
      neighborhood: neighborhood || "Centro",
      cityName,
      stateAcronym: stateAcr,
      countryName: "Brasil",
    };
    if (cityId) addressObj.cityId = cityId;
    if (cityIbge) {
      addressObj.cityIbge = cityIbge;
      addressObj.ibge = cityIbge;
    }
    const createBody: any = {
      name: name || doc,
      legalName: isCNPJ ? (name || doc) : undefined,
      cpfCnpj: doc,
      birthdate: new Date(`${birth}T00:00:00Z`).toISOString(),
      email,
      phone,
      status: "Active",
      type: isCNPJ ? "Entity" : "Individual",
      typeTelecom: isCNPJ ? "ptlComercial" : "ptlResidencial",
      addresses: cep ? [addressObj] : undefined,
      contacts: email || phone ? [{
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      }] : undefined,
    };
    const cr = await eaiCall(cfg, `/rest/service_eai/customers`, "POST", createBody);
    if (!cr.ok) {
      return await failJob(orderId, `EAÍ create customer (${cr.status}): ${cr.text.slice(0, 240)}`, cr.status === 400);
    }
    const newId = cr.data?.customerId || cr.data?.id || cr.data?.personId
      || cr.data?.data?.customerId || cr.data?.data?.id;
    const s = newId !== undefined && newId !== null ? String(newId) : "";
    if (!s || s === "0") return await failJob(orderId, `EAÍ create customer sem id válido: ${cr.text.slice(0, 240)}`, true);
    personId = s;
  }

  // 2. Cria cart de ativação
  const activation: any = { randomESim: simKind === "esim" };
  if (simKind === "physical" && order.iccid) activation.iccid = order.iccid;

  const cartBody: any = {
    cartType: "mctActivation",
    billingType: "btExternalPayment",
    origin: "mcoApi",
    personId,
    planId: eaiPlanId,
    activation,
  };
  if (port?.enabled && port?.current_msisdn) {
    cartBody.portability = {
      msisdn: onlyDigits(port.current_msisdn),
      ...(simKind === "physical" && order.iccid ? { iccid: order.iccid } : {}),
      randomESim: simKind === "esim",
    };
  }

  const cc = await eaiCall(cfg, `/rest/service_eai/mvno_carts`, "POST", cartBody);
  if (!cc.ok) {
    return await failJob(orderId, `EAÍ create cart (${cc.status}): ${cc.text.slice(0, 240)}`, cc.status === 400);
  }
  const cart = cc.data?.cart || cc.data?.data || cc.data;
  const cartId = String(cart?.id || cart?.cartId || cart?.cart_id || "");
  if (!cartId) return await failJob(orderId, `EAÍ cart sem id: ${cc.text.slice(0, 240)}`, true);

  // 3. Processa cart (PATCH)
  const proc = await eaiCall(cfg, `/rest/service_eai/mvno_carts/${cartId}`, "PATCH", {
    billingType: "btExternalPayment",
  });
  if (!proc.ok) {
    return await failJob(orderId, `EAÍ process cart ${cartId} (${proc.status}): ${proc.text.slice(0, 240)}`, false);
  }
  const procData = proc.data?.cart || proc.data?.data || proc.data || {};
  const line = procData.line || procData.mvnoLine || procData.mvno_line || {};
  const msisdn = String(line.msisdn || procData.msisdn || cart?.activation?.msisdn || "");
  const iccidOut = String(line.iccid || cart?.activation?.iccid || order.iccid || "");
  const activationCode = String(line.activationCode || line.activation_code || line.lpa || procData.activationCode || "");
  const qrPayload = String(line.qrCode || line.qr_code || activationCode || "");

  // 4. Persiste em mvno_activations
  const recordPayload: any = {
    provider: "eai",
    tn: msisdn || null,
    iccid: iccidOut || null,
    sim_type: simKind === "physical" ? "sim" : "esim",
    product_sku: eaiPlanId,
    product_name: mapRow.eai_plan_name || mobile.name || null,
    cycle: 1,
    subscriber_doc: doc,
    subscriber_name: name,
    subscriber_email: email || null,
    subscriber_phone: phone || null,
    notes: `Pedido ${order.merchant_order_id || orderId} • EAÍ cart ${cartId}`,
    raw_response: { create: cc.data, process: proc.data },
    activation_code: activationCode || null,
    qr_payload: qrPayload || null,
    status: msisdn ? "confirmed" : "pending",
    email_status: email ? "not_sent" : "skipped",
    source: "checkout",
    checkout_order_id: orderId,
  };
  let activationId: string | undefined;
  const { data: ins, error: insErr } = await admin
    .from("mvno_activations")
    .insert(recordPayload)
    .select("id")
    .single();
  if (insErr) {
    const { data: r2 } = await admin
      .from("mvno_activations").select("id")
      .eq("checkout_order_id", orderId).eq("source", "checkout").maybeSingle();
    if ((r2 as any)?.id) {
      await admin.from("mvno_activations").update(recordPayload).eq("id", (r2 as any).id);
      activationId = (r2 as any).id;
    }
  } else {
    activationId = (ins as any).id;
  }

  // 5. Atualiza pedido
  await admin.from("checkout_orders").update({
    provisioning_status: "provisioned",
    provisioned_at: new Date().toISOString(),
    msisdn: msisdn || null,
    iccid: iccidOut || order.iccid,
    esim_activation_code: activationCode || null,
    esim_qr_url: qrPayload || null,
  }).eq("id", orderId);

  // 6. E-mail (mesma função do admin)
  if (email && activationId) {
    try {
      await admin.functions.invoke("send-mvno-activation-email", {
        body: {
          activationId,
          provider: "eai",
          tn: msisdn,
          iccid: iccidOut,
          simType: simKind === "physical" ? "sim" : "esim",
          productName: mapRow.eai_plan_name || mobile.name,
          productSku: eaiPlanId,
          cycle: 1,
          subscriberName: name,
          subscriberDoc: doc,
          subscriberEmail: email,
          subscriberPhone: phone,
          notes: `Pedido ${order.merchant_order_id || orderId}`,
          activationCode,
          qrPayload,
        },
      });
    } catch (e) {
      console.warn("[runner-eai] email failed", (e as any)?.message);
    }
  }

  await closeJob(orderId, "done");
  return "provisioned_eai";
}

