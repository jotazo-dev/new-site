// Edge Function: minhaconta-auth
// Autenticação em 2 etapas para a página /minhaconta.
// Etapa 1: lookup por CPF/CNPJ na RBX -> retorna 2 opções (uma real + uma fake) mascaradas.
// Etapa 2: confirm da opção correta -> emite accessToken curto.

import {
  loadRbxConfig,
  fetchInvoicePayables,
  okStatus,
  errDesc,
} from "../_shared/rbx.ts";
import { requireAdmin } from "../_shared/adminGuard.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- helpers ----------
function onlyDigits(s: string): string { return (s || "").replace(/\D+/g, ""); }

function isValidDoc(s: string): boolean {
  const d = onlyDigits(s);
  return d.length === 11 || d.length === 14;
}

function maskDocument(s: string): string {
  const d = onlyDigits(s);
  if (d.length === 11) return `${d.slice(0,3)}.***.***-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0,2)}.***.***/****-${d.slice(12)}`;
  return s;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function maskPhone(s: string): string {
  const d = onlyDigits(s);
  if (d.length < 4) return "(••) •••••-••••";
  const last4 = d.slice(-4);
  return `(••) •••••-${last4}`;
}

function maskEmail(s: string): string {
  const e = (s || "").trim();
  const at = e.indexOf("@");
  if (at < 1) return "•••@•••••";
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  const first3 = local.slice(0, 3);
  // 2 letras antes do @
  const last2 = local.length >= 5 ? local.slice(-2) : "";
  const middleDots = local.length > 5 ? "•".repeat(Math.min(5, local.length - 5)) : "•••";
  // domain: mascara totalmente exceto TLD
  const dot = domain.lastIndexOf(".");
  const tld = dot >= 0 ? domain.slice(dot) : "";
  return `${first3}${middleDots}${last2}@•••••${tld}`;
}

function extractList(parsed: any): any[] {
  if (Array.isArray(parsed)) return parsed;
  for (const k of ["Clientes","clientes","Contatos","contatos","Resultado","resultado","data","dados"]) {
    if (Array.isArray(parsed?.[k])) return parsed[k];
  }
  if (parsed && typeof parsed === "object") {
    for (const k of Object.keys(parsed)) if (Array.isArray(parsed[k])) return parsed[k];
  }
  return [];
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---------- RBX calls ----------
async function rbxFetch(endpoint: string, body: string): Promise<any> {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Jotazo-MinhaConta/1.0",
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return null; }
  } catch { return null; }
}

async function findClienteByDoc(endpoint: string, authKey: string, doc: string): Promise<any | null> {
  const digits = onlyDigits(doc);
  // tenta múltiplos nomes de campo possíveis no RBX
  const filters = [
    `CNPJ_CNPF = '${digits}'`,
    `CPF_CNPJ = '${digits}'`,
    `CPF = '${digits}'`,
    `CNPJ = '${digits}'`,
  ];
  for (const f of filters) {
    const body = JSON.stringify({
      ConsultaClientes: {
        Autenticacao: { ChaveIntegracao: authKey },
        Filtro: f,
      },
    });
    const p = await rbxFetch(endpoint, body);
    const list = extractList(p?.result ?? p);
    if (list.length) {
      console.log("CLIENTE_SAMPLE:", JSON.stringify(list[0]));
      return list[0];
    }
  }
  return null;
}

async function findContatos(endpoint: string, authKey: string, codigo: string): Promise<{ email?: string; phones: string[] }> {
  const body = JSON.stringify({
    ConsultaContatos: {
      Autenticacao: { ChaveIntegracao: authKey },
      Filtro: `Cliente = ${codigo}`,
    },
  });
  const p = await rbxFetch(endpoint, body);
  const list = extractList(p?.result ?? p);
  let email: string | undefined;
  const phones: string[] = [];
  for (const c of list) {
    if (!email) {
      const e = String(c?.Email || "").trim();
      if (e) email = e;
    }
    for (const k of ["Telefone1","Telefone2","Telefone3"]) {
      const v = String(c?.[k] || "").trim();
      if (v && !phones.includes(v)) phones.push(v);
    }
  }
  return { email, phones };
}

// ---------- fake generator ----------
const FAKE_DOMAINS = ["gmail.com","hotmail.com","outlook.com","yahoo.com.br","uol.com.br","bol.com.br"];
const FAKE_FIRST = ["maria","joao","carlos","ana","lucas","paula","bruno","fernanda","rafael","julia","pedro","amanda","leonardo","beatriz"];
const FAKE_LAST = ["silva","souza","oliveira","santos","pereira","costa","alves","ribeiro","gomes","martins"];

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function genFakeContact(realEmail?: string, realPhone?: string): { email: string; phone: string } {
  // gera email diferente do real
  let email = "";
  for (let i = 0; i < 5; i++) {
    const e = `${rnd(FAKE_FIRST)}${rnd(FAKE_LAST)}@${rnd(FAKE_DOMAINS)}`;
    if (e.toLowerCase() !== (realEmail || "").toLowerCase()) { email = e; break; }
  }
  if (!email) email = `${rnd(FAKE_FIRST)}.${rnd(FAKE_LAST)}@${rnd(FAKE_DOMAINS)}`;

  // gera celular BR
  const ddds = ["11","21","31","41","47","51","61","71","81","85","91","27","48"];
  let phone = "";
  for (let i = 0; i < 5; i++) {
    const ddd = rnd(ddds);
    const num = `9${Math.floor(10000000 + Math.random()*89999999)}`;
    const full = `${ddd}${num}`;
    if (onlyDigits(realPhone || "").slice(-4) !== full.slice(-4)) { phone = full; break; }
  }
  if (!phone) phone = `11${Math.floor(900000000 + Math.random()*99999999)}`;
  return { email, phone };
}

// ---------- stateless signed tokens (HMAC-SHA256) ----------
// Edge functions podem rodar em isolates diferentes a cada call, então
// não dá pra usar Map em memória entre lookup -> confirm. Usamos tokens
// assinados com HMAC.

type LookupPayload = {
  k: "s";
  doc: string;
  cc: string;
  cn: string;
  ok: string; // correctOptionId
  em: string;
  ph: string;
  si: string;
  ad: string;
  exp: number;
};

type AccessPayload = {
  k: "a";
  cc: string;
  cn: string;
  dm: string;
  em: string;
  ph: string;
  si: string;
  ad: string;
  exp: number;
};

const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_JWT_SECRET") || "fallback-dev-secret";

let _hmacKey: CryptoKey | null = null;
async function getHmacKey(): Promise<CryptoKey> {
  if (_hmacKey) return _hmacKey;
  _hmacKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return _hmacKey;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function signToken(payload: object): Promise<string> {
  const key = await getHmacKey();
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

async function verifyToken<T = any>(token: string): Promise<T | null> {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const key = await getHmacKey();
    const valid = await crypto.subtle.verify("HMAC", key, b64urlDecode(sig), new TextEncoder().encode(body));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as any;
    if (typeof payload?.exp !== "number" || payload.exp < Date.now()) return null;
    return payload as T;
  } catch { return null; }
}

// ---------- rate limit ----------
const rl = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string, max = 15): boolean {
  const now = Date.now();
  const cur = rl.get(ip);
  if (!cur || cur.reset < now) { rl.set(ip, { count: 1, reset: now + 60_000 }); return true; }
  cur.count += 1;
  return cur.count <= max;
}

// ---------- handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!rateLimit(ip)) {
    console.warn(`Rate limit hit for IP: ${ip}`);
    return json({ ok: false, error: "Muitas tentativas. Aguarde 1 minuto." }, 429);
  }

  let bodyData: any;
  try { bodyData = await req.json(); } catch { return json({ ok:false, error: "Body inválido" }, 400); }

  console.log(`Action: ${bodyData?.action}, IP: ${ip}`);
  const action = String(bodyData?.action || "");

  // ----- LOOKUP -----
  if (action === "lookup") {
    const document = String(bodyData?.document || "");
    if (!isValidDoc(document)) return json({ ok:false, error: "CPF/CNPJ inválido" }, 400);

    const cfg = await loadRbxConfig();
    if (!cfg) return json({ ok:false, error: "Configuração RBX ausente" }, 500);

    const cliente = await findClienteByDoc(cfg.endpoint, cfg.authKey, document);
    if (!cliente) return json({ ok:false, error: "Não encontramos um cadastro com este documento." }, 404);

    const customerCode = String(cliente?.Codigo || cliente?.CodigoCliente || cliente?.codigo || "");
    if (!customerCode) return json({ ok:false, error: "Cadastro encontrado sem código válido." }, 500);

    const customerName = String(cliente?.Nome || cliente?.RazaoSocial || cliente?.Razao_Social || "Cliente");

    const contatos = await findContatos(cfg.endpoint, cfg.authKey, customerCode);
    const fallbackEmail = String(cliente?.Email || "").trim();
    const fallbackPhone = String(cliente?.TelCelular || cliente?.TelComercial || cliente?.TelResidencial || "").trim();

    const realEmail = contatos.email || fallbackEmail;
    const realPhone = contatos.phones[0] || fallbackPhone;

    if (!realEmail || !realPhone) {
      return json({ ok:false, error: "Não encontramos email/telefone cadastrados para confirmar sua identidade. Entre em contato com a Jotazo." }, 422);
    }

    const fake = genFakeContact(realEmail, realPhone);
    const realId = crypto.randomUUID();
    const fakeId = crypto.randomUUID();
    const options = [
      { id: realId, email: maskEmail(realEmail), phone: maskPhone(realPhone) },
      { id: fakeId, email: maskEmail(fake.email),  phone: maskPhone(fake.phone)  },
    ];
    if (Math.random() < 0.5) options.reverse();

    const situacao = String(
      pick(cliente, ["Situacao","SituacaoCliente","Status","StatusCliente"]) || ""
    ).trim() || "Ativo";

    const enderecoParts: string[] = [];
    const logradouro = String(pick(cliente, ["Endereco","Logradouro","Rua"]) || "").trim();
    const numero = String(pick(cliente, ["Numero","NumeroEndereco","Num"]) || "").trim();
    const complemento = String(pick(cliente, ["Complemento"]) || "").trim();
    const bairro = String(pick(cliente, ["Bairro"]) || "").trim();
    const cidade = String(pick(cliente, ["Cidade","Municipio"]) || "").trim();
    const uf = String(pick(cliente, ["UF","Estado","Uf"]) || "").trim();
    const cep = String(pick(cliente, ["CEP","Cep"]) || "").trim();
    if (logradouro) enderecoParts.push(numero ? `${logradouro}, ${numero}` : logradouro);
    if (complemento) enderecoParts.push(complemento);
    if (bairro) enderecoParts.push(bairro);
    if (cidade || uf) enderecoParts.push([cidade, uf].filter(Boolean).join("/"));
    if (cep) enderecoParts.push(`CEP ${cep}`);
    const endereco = enderecoParts.join(" — ") || "Endereço não cadastrado";

    const sessionId = await signToken({
      k: "s",
      doc: onlyDigits(document),
      cc: customerCode,
      cn: customerName,
      ok: realId,
      em: realEmail,
      ph: realPhone,
      si: situacao,
      ad: endereco,
      exp: Date.now() + 5 * 60_000,
    } satisfies LookupPayload);

    return json({ ok: true, sessionId, options });
  }

  // ----- CONFIRM -----
  if (action === "confirm") {
    const sessionId = String(bodyData?.sessionId || "");
    const selectedOptionId = String(bodyData?.selectedOptionId || "");
    const s = await verifyToken<LookupPayload>(sessionId);
    if (!s || s.k !== "s") return json({ ok:false, error: "Sessão expirada. Recomece." }, 401);
    if (!timingSafeEqual(selectedOptionId, s.ok)) {
      return json({ ok:false, error: "Combinação incorreta. Recomece." }, 403);
    }
    const documentMasked = maskDocument(s.doc);
    const accessToken = await signToken({
      k: "a",
      cc: s.cc,
      cn: s.cn,
      dm: documentMasked,
      em: s.em,
      ph: s.ph,
      si: s.si,
      ad: s.ad,
      exp: Date.now() + 30 * 60_000,
    } satisfies AccessPayload);
    return json({
      ok: true,
      accessToken,
      customer: {
        name: s.cn,
        documentMasked,
        code: s.cc,
        email: s.em,
        phone: s.ph,
        situacao: s.si,
        endereco: s.ad,
      },
    });
  }

  // ----- ME (validar token) -----
  if (action === "me") {
    const t = await verifyToken<AccessPayload>(String(bodyData?.accessToken || ""));
    if (!t || t.k !== "a") return json({ ok:false, error: "Sessão expirada" }, 401);
    return json({ ok: true, customer: {
      name: t.cn, documentMasked: t.dm, code: t.cc,
      email: t.em, phone: t.ph, situacao: t.si, endereco: t.ad,
    } });
  }

  // ----- INVOICES / SECOND-COPY -----
  if (action === "invoices" || action === "second-copy") {
    const t = await verifyToken<AccessPayload>(String(bodyData?.accessToken || ""));
    if (!t || t.k !== "a") return json({ ok:false, error: "Sessão expirada" }, 401);

    const cfg = await loadRbxConfig();
    if (!cfg) return json({ ok:false, error: "Configuração RBX ausente" }, 500);

    const today = startOfDay(new Date());
    const openRaw = await findDocumentosEmAberto(cfg.endpoint, cfg.authKey, t.cc);
    const openNorm = openRaw
      .map((r) => normalizeTitulo(r, today))
      .filter((x) => x.dueDate && x.status !== "paid");

    if (action === "second-copy") {
      const list = [...openNorm].sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
      const overdue = list.filter(x => x.status === "overdue");
      const open = list.filter(x => x.status === "open");
      const latest = open[0] || overdue[overdue.length - 1] || null;
      const expired = overdue.filter(x => !latest || x.id !== latest.id);
      return json({ ok: true, latest, expired });
    }

    // invoices: combina abertas + pagas (últimos 12 meses)
    const paidRaw = await findDocumentosBaixados(cfg.endpoint, cfg.authKey, t.cc);
    const paidNorm = paidRaw
      .map((r) => normalizeTitulo(r, today))
      .filter((x) => x.dueDate && x.status === "paid");

    // dedup por id (caso um título apareça nos dois)
    const seen = new Set<string>();
    const merged: ReturnType<typeof normalizeTitulo>[] = [];
    for (const it of [...openNorm, ...paidNorm]) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      merged.push(it);
    }
    merged.sort((a, b) => (a.dueDate! < b.dueDate! ? 1 : -1)); // mais recentes primeiro
    
    // Log para ver se o plano está chegando na lista
    console.log(`invoices-list count=${merged.length} samples=${JSON.stringify(merged.slice(0, 1).map(x => ({ id: x.id, plano: x.plano })))}`);
    
    return json({ ok: true, list: merged });
  }

  // ----- INVOICE-DETAILS (2ª via: PDF + linha digitável + PIX) -----
  if (action === "invoice-details") {
    const t = await verifyToken<AccessPayload>(String(bodyData?.accessToken || ""));
    if (!t || t.k !== "a") return json({ ok:false, error: "Sessão expirada" }, 401);

    const invoiceId = String(bodyData?.invoiceId || "").trim();
    if (!invoiceId) return json({ ok:false, error: "invoiceId obrigatório" }, 400);

    const cfg = await loadRbxConfig();
    if (!cfg) return json({ ok:false, error: "Configuração RBX ausente" }, 500);
    if (!cfg.authKeyV2) return json({ ok:false, error: "API v2 da RBX não configurada. Preencha a chave em Admin → Integrações." }, 500);

    // 1) Localiza a fatura nas abertas do cliente OU nas pagas (últimos 12m).
    const today = startOfDay(new Date());
    const openRaw = await findDocumentosEmAberto(cfg.endpoint, cfg.authKey, t.cc);
    let invoice = openRaw.map((r) => normalizeTitulo(r, today)).find((x) => x.id === invoiceId) || null;
    if (!invoice) {
      const paidRaw = await findDocumentosBaixados(cfg.endpoint, cfg.authKey, t.cc);
      invoice = paidRaw.map((r) => normalizeTitulo(r, today)).find((x) => x.id === invoiceId) || null;
    }
    if (!invoice) return json({ ok:false, error: "Fatura não encontrada para este cliente." }, 404);

    // Faturas pagas não têm 2ª via — devolve só o resumo
    if (invoice.status === "paid") {
      return json({ ok: true, invoice, boleto: null, pix: null, paid: true });
    }

    const docId = Number(invoiceId);
    if (!Number.isFinite(docId)) {
      return json({ ok: true, invoice, boleto: null, pix: null, error: "ID inválido para emissão." });
    }

    // 2) Chama os 4 serviços v2 (PDF, linha digitável, PIX copia-cola, QR) via helper compartilhado.
    //    Os mesmos endpoints/payloads são usados pelo painel admin (rbx-test-invoice-extraction).
    const payables = await fetchInvoicePayables(
      { endpointV2: cfg.endpointV2, authKeyV2: cfg.authKeyV2! },
      { docId, dueDate: invoice.dueDate },
    );

    const { raw, boleto: billetResult, barcode: barcodeStr, pixCopia: pixCopiaStr, pixQrBase64: pixQrB64 } = payables;

    // 3) Fallback usando dados que o v1 (ConsultaDocumentosAbertos) já trouxe
    const fallbackBarcode = !barcodeStr && invoice.barcode ? invoice.barcode : "";
    const fallbackPixCopia = !pixCopiaStr && invoice.pixCode ? invoice.pixCode : "";
    const fallbackPdfUrl = !billetResult && invoice.downloadUrl ? invoice.downloadUrl : "";

    const finalBarcode = barcodeStr || fallbackBarcode;
    const finalPixCopia = pixCopiaStr || fallbackPixCopia;

    // Log estruturado (sem expor a chave) — facilita diagnóstico
    console.log("invoice-details", JSON.stringify({
      docId,
      billet: { status: raw.billet?.status, ec: raw.billet?.error_code, ed: raw.billet?.error_description },
      barcode: { status: raw.barcode?.status, ec: raw.barcode?.error_code, ed: raw.barcode?.error_description, len: barcodeStr.length },
      pixCopia: { status: raw.pixCopia?.status, ec: raw.pixCopia?.error_code, ed: raw.pixCopia?.error_description, len: pixCopiaStr.length },
      pixQrcode: { status: raw.pixQrcode?.status, ec: raw.pixQrcode?.error_code, ed: raw.pixQrcode?.error_description, len: pixQrB64.length },
      fallback: { barcode: !!fallbackBarcode, pix: !!fallbackPixCopia, pdf: !!fallbackPdfUrl },
    }));

    return json({
      ok: true,
      invoice,
      boleto: billetResult
        ? billetResult
        : (fallbackPdfUrl ? { pdfUrl: fallbackPdfUrl, pdfBase64: null, available: null } : null),
      barcode: finalBarcode || null,
      pix: (finalPixCopia || pixQrB64)
        ? { copiaCola: finalPixCopia || null, qrCodeBase64: pixQrB64 || null }
        : null,
      errors: {
        boleto: !okStatus(raw.billet) && !fallbackPdfUrl ? errDesc(raw.billet) : null,
        barcode: !okStatus(raw.barcode) && !fallbackBarcode ? errDesc(raw.barcode) : null,
        pix: !okStatus(raw.pixCopia) && !okStatus(raw.pixQrcode) && !fallbackPixCopia
          ? (errDesc(raw.pixCopia) || errDesc(raw.pixQrcode))
          : null,
      },
    });
  }

  // ----- EQUIPMENT PROBE (admin-only diagnostic) -----
  if (action === "equipment-probe") {
    const guard = await requireAdmin(req);
    if (guard) return guard;
    const document = String(bodyData?.cpf || bodyData?.document || "");
    if (!isValidDoc(document)) return json({ ok: false, error: "CPF/CNPJ inválido" }, 400);

    const cfg = await loadRbxConfig();
    if (!cfg) return json({ ok: false, error: "Configuração RBX ausente" }, 500);

    const cliente = await findClienteByDoc(cfg.endpoint, cfg.authKey, document);
    const clienteCodigo = String(cliente?.Codigo || cliente?.CodigoCliente || cliente?.codigo || "");
    if (!clienteCodigo) return json({ ok: false, error: "Cliente não encontrado na RBX" }, 404);

    const variants: Array<{ name: string; filtro?: string }> = [
      { name: "no-filter" },
      { name: "Cliente_Codigo='cc'", filtro: `Cliente_Codigo = '${clienteCodigo}'` },
      { name: "Cliente_Codigo=cc", filtro: `Cliente_Codigo = ${clienteCodigo}` },
    ];
    const results = await Promise.all(variants.map(async (v) => {
      const payload: any = { Autenticacao: { ChaveIntegracao: cfg.authKey } };
      if (v.filtro) payload.Filtro = v.filtro;
      const body = JSON.stringify({ ConsultaEquipamentosOnline: payload });
      const p = await rbxFetch(cfg.endpoint, body);
      const list = extractList(p?.result ?? p);
      return {
        variant: v.name,
        filtro: v.filtro || null,
        status: p?.status ?? null,
        erro_code: p?.erro_code ?? p?.error_code ?? null,
        erro_desc: p?.erro_desc ?? p?.error_description ?? null,
        count: list.length,
      };
    }));

    return json({ ok: true, clienteCodigo, clienteNome: cliente?.Nome || null, results });
  }

  // ----- EQUIPMENT (Conexão) -----
  if (action === "equipment") {
    const t = await verifyToken<AccessPayload>(String(bodyData?.accessToken || ""));
    if (!t || t.k !== "a") return json({ ok:false, error: "Sessão expirada" }, 401);

    const cfg = await loadRbxConfig();
    if (!cfg) return json({ ok:false, error: "Configuração RBX ausente" }, 500);

    const bodyEq = JSON.stringify({
      ConsultaEquipamentosOnline: {
        Autenticacao: { ChaveIntegracao: cfg.authKey },
        Filtro: `Cliente_Codigo = '${t.cc}'`,
      },
    });
    const bodyAuth = JSON.stringify({
      ConsultaAutenticacao: {
        Autenticacao: { ChaveIntegracao: cfg.authKey },
        Filtro: `Cliente = '${t.cc}'`,
      },
    });
    const [p, pAuth] = await Promise.all([
      rbxFetch(cfg.endpoint, bodyEq),
      rbxFetch(cfg.endpoint, bodyAuth),
    ]);
    try {
      console.log("EQUIPMENT_RAW:", JSON.stringify(p).slice(0, 1500));
      console.log("AUTH_RAW:", JSON.stringify(pAuth).slice(0, 800));
    } catch { /* ignore */ }

    // Detectar erros explícitos da RBX
    const rbxStatus = p?.status ?? p?.result?.status;
    const rbxErrCode = p?.error_code ?? p?.result?.error_code ?? p?.erro_code ?? p?.result?.erro_code;
    const rbxErrDesc = p?.error_description ?? p?.result?.error_description ?? p?.erro_descricao ?? p?.result?.erro_descricao;

    // 97 = chave inválida / serviço não autorizado
    if (rbxErrCode === 97 || rbxErrCode === "97") {
      return json({ ok: false, error: "Serviço ConsultaEquipamentosOnline não está habilitado na chave RBX. Solicite liberação à RBX." }, 500);
    }
    // status diferente de 1 e não é o "sem resultados" (code 1)
    if (rbxStatus != null && Number(rbxStatus) !== 1 && rbxErrCode !== 1 && rbxErrCode !== "1") {
      return json({ ok: false, error: `RBX retornou erro: ${rbxErrDesc || rbxErrCode || "desconhecido"}` }, 502);
    }

    const list = extractList(p?.result ?? p);
    if (list.length === 0) {
      console.log(`EQUIPMENT_EMPTY: Cliente_Codigo=${t.cc} erro_code=${rbxErrCode ?? "-"}`);
    }

    const equipments = list.map((r: any) => ({
      clienteNome: String(r?.Cliente_Nome || ""),
      contratoNumero: String(r?.Contrato_Numero || ""),
      contratoDescricao: String(r?.Contrato_Descricao || ""),
      ultimaColeta: String(r?.DataHora_UltimaColeta || ""),
      nasIp: String(r?.NAS_IP || ""),
      nasSigla: String(r?.NAS_Sigla || ""),
      nasDescricao: String(r?.NAS_Descricao || ""),
      nasSlot: String(r?.NAS_Slot || ""),
      nasPorta: String(r?.NAS_Porta || ""),
      equipamentoId: String(r?.Equipamento_Id || ""),
      equipamentoDescricao: String(r?.Equipamento_Descricao || ""),
      equipamentoSerial: String(r?.Equipamento_Serial || ""),
      sinal: r?.Equipamento_Sinal != null && r?.Equipamento_Sinal !== "" ? Number(r.Equipamento_Sinal) : null,
      ccq: r?.Equipamento_Txccq != null && r?.Equipamento_Txccq !== "" ? Number(r.Equipamento_Txccq) : null,
      maxCpe: r?.Equipamento_MaxCpe != null && r?.Equipamento_MaxCpe !== "" ? Number(r.Equipamento_MaxCpe) : null,
      temperatura: r?.Equipamento_Temperatura != null && r?.Equipamento_Temperatura !== "" ? Number(r.Equipamento_Temperatura) : null,
      tempoConectadoMinutos: r?.Equipamento_TempoConectadoMinutos != null && r?.Equipamento_TempoConectadoMinutos !== "" ? Number(r.Equipamento_TempoConectadoMinutos) : null,
    }));

    // Autenticações (mostradas como fallback quando online === false, e como detalhe quando online === true)
    const authList = extractList(pAuth?.result ?? pAuth);
    const authentications = authList.map((r: any) => ({
      id: String(r?.Id || ""),
      contrato: String(r?.Contrato || ""),
      nas: String(r?.NAS || ""),
      porta: String(r?.Porta || ""),
      usuario: String(r?.Usuario || ""),
      mac: String(r?.MAC || ""),
      observacao: String(r?.Observacao || ""),
    }));

    return json({ ok: true, online: equipments.length > 0, equipments, authentications });
  }


  return json({ ok:false, error: "Ação desconhecida" }, 400);
});

// ---------- titulos helpers ----------
type Titulo = {
  id: string;
  reference: string;
  dueDate: string | null;
  amountCents: number;
  status: "paid" | "open" | "overdue" | "future";
  statusLabel: string;
  barcode?: string;
  pixCode?: string;
  downloadUrl?: string;
  plano?: string;
};

function startOfDay(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function isoDate(d: Date): string {
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,"0"); const dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}
function addMonths(d: Date, n: number): Date { return new Date(d.getFullYear(), d.getMonth()+n, d.getDate()); }

function parseDateBR(raw: any): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // dd/mm/yyyy
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // yyyy-mm-dd
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

function parseAmountCents(raw: any): number {
  if (raw === null || raw === undefined || raw === "") return 0;
  const s = String(raw).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(s);
  return isFinite(n) ? Math.round(n * 100) : 0;
}

function pick(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== "object") return undefined;
  const lc = new Map<string, string>();
  for (const k of Object.keys(obj)) lc.set(k.toLowerCase(), k);
  for (const k of keys) {
    const real = lc.get(k.toLowerCase());
    if (real) {
      const v = obj[real];
      if (v !== undefined && v !== null && v !== "") return v;
    }
  }
  return undefined;
}

function normalizeTitulo(r: any, today: Date) {
  const id = String(pick(r, ["Sequencia","NossoNumero","Documento","Codigo","CodigoTitulo","Id","CodTitulo"]) || crypto.randomUUID());
  const dueDate = parseDateBR(pick(r, ["Vencimento","DataVencimento","DtVencimento","Vcto"]));
  const paidDate = parseDateBR(pick(r, ["DataBaixa","DataPagamento","DataLiquidacao","DtPagamento","DtLiquidacao"]));
  const amountCents = parseAmountCents(pick(r, ["Valor","ValorTitulo","ValorTotal","ValorOriginal","ValorBaixado"]));
  const situacaoRaw = String(pick(r, ["Situacao","Status","SituacaoTitulo","Motivo"]) || "").toLowerCase().trim();
  const barcode = String(pick(r, ["LinhaDigitavel","CodigoBarras","Barcode"]) || "") || undefined;
  const pixCode = String(pick(r, ["CodigoPix","Pix","PixCopiaCola","QrCodePix"]) || "") || undefined;
  const downloadUrl = String(pick(r, ["LinkBoleto","UrlBoleto","Link","Boleto","UrlPdf"]) || "") || undefined;
  const referenceRaw = pick(r, ["Referencia","CompetenciaReferencia","Competencia","MesReferencia","Complemento"]);
  const reference = referenceRaw ? String(referenceRaw) : (dueDate ? dueDate.slice(0, 7) : "");
  const plano = String(pick(r, ["Plano", "NomePlano", "DescricaoPlano", "Descricao", "PlanoNome", "Nome_Plano"]) || "") || undefined;

  let status: Titulo["status"] = "open";
  let statusLabel = "Em aberto";
  const isPaid = !!paidDate || ["p","pago","pagto","liquidado","quitado","baixado","l"].some(t => situacaoRaw === t || situacaoRaw.includes(t));
  if (isPaid) { status = "paid"; statusLabel = "Paga"; }
  else if (dueDate && dueDate < isoDate(today)) { status = "overdue"; statusLabel = "Vencida"; }
  else if (dueDate && dueDate > isoDate(new Date(today.getFullYear(), today.getMonth()+1, 0))) { status = "future"; statusLabel = "Em dia"; }

  return { id, reference, dueDate, amountCents, status, statusLabel, barcode, pixCode, downloadUrl, plano };
}

// Busca documentos baixados (pagos) do cliente via ConsultaDocumentosBaixados.
// Doc: https://www.developers.rbxsoft.com/#consulta-documentos-baixados
// Filtro usa prefixo "Movimento." e Tipo='C' (Cliente / a receber).
async function findDocumentosBaixados(endpoint: string, authKey: string, codigo: string): Promise<any[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const y = cutoff.getFullYear();
  const m = String(cutoff.getMonth() + 1).padStart(2, "0");
  const d = String(cutoff.getDate()).padStart(2, "0");
  const cutoffISO = `${y}-${m}-${d}`;

  // tenta com janela de 12 meses e cai pra filtro simples se a versão do RBX não aceitar DataBaixa no Filtro
  const filters = [
    `Movimento.Tipo = 'C' AND Movimento.Cliente = ${codigo} AND Movimento.DataBaixa >= '${cutoffISO}'`,
    `Movimento.Tipo = 'C' AND Movimento.Cliente = ${codigo}`,
  ];
  for (const f of filters) {
    const body = JSON.stringify({
      ConsultaDocumentosBaixados: {
        Autenticacao: { ChaveIntegracao: authKey },
        Filtro: f,
      },
    });
    const p = await rbxFetch(endpoint, body);
    const list = extractList(p?.result ?? p);
    if (list.length) return list;
  }
  return [];
}

async function findDocumentosEmAberto(endpoint: string, authKey: string, codigo: string): Promise<any[]> {
  const body = JSON.stringify({
    ConsultaDocumentosAbertos: {
      Autenticacao: { ChaveIntegracao: authKey },
      Filtro: `Cliente = ${codigo}`,
    },
  });
  const p = await rbxFetch(endpoint, body);
  const list = extractList(p?.result ?? p);
  
  // LOG CRÍTICO PARA IDENTIFICAR O CAMPO DO PLANO
  if (list.length > 0) {
    console.log("RBX_LIST_DEBUG:", JSON.stringify(list.slice(0, 2)));
  }
  
  return list;
}


// function json removida daqui e movida para o topo para evitar erros de referência temporal
// loadRbxConfig / rbxFetchV2 são importados de ../_shared/rbx.ts

