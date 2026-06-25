// Edge Function: rbx-agenda-public
// Versão pública (protegida por senha) do rbx-list-atendimentos.
// Reutiliza a mesma lógica de consulta à RBX, sem exigir login admin.
// Auth: header X-Agenda-Pass deve bater com AGENDA_ACCESS_PASSWORD.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-agenda-pass",
};

type Status = "aberto" | "em_andamento" | "concluido" | "cancelado";

type Atendimento = {
  id: string;
  protocol: string;
  customerCode?: string;
  customerName: string;
  customerPhone?: string;
  customerPhone2?: string;
  customerEmail?: string;
  customerDocument?: string;
  address?: string;
  city?: string;
  type: string;
  reason?: string;
  description?: string;
  technician?: string;
  status: Status;
  statusLabel: string;
  scheduledAt: string | null;
  openedAt: string | null;
};

function pick(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
    const found = Object.keys(obj).find((kk) => kk.toLowerCase() === k.toLowerCase());
    if (found) {
      const vv = obj[found];
      if (vv !== undefined && vv !== null && vv !== "") return vv;
    }
  }
  return undefined;
}

function normalizeStatus(raw: any): { status: Status; label: string } {
  const s = String(raw || "").toLowerCase().trim();
  const label = String(raw || "—");
  if (!s) return { status: "aberto", label: "—" };
  if (s === "c") return { status: "concluido", label: "Concluído" };
  if (s === "b") return { status: "cancelado", label: "Abortado" };
  if (["f", "a", "e", "p"].includes(s)) return { status: "em_andamento", label };
  if (s.includes("conclu") || s.includes("finaliz") || s.includes("encerr") || s.includes("fechad")) {
    return { status: "concluido", label };
  }
  if (s.includes("cancel")) return { status: "cancelado", label };
  if (s.includes("andamento") || s.includes("execu") || s.includes("desloc") || s.includes("iniciad") || s.includes("agendad")) {
    return { status: "em_andamento", label };
  }
  return { status: "aberto", label };
}

function toISODateBR(d: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  return fmt.format(d);
}

const BR_TZ = "-03:00";
function parseDate(raw: any): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const [, y, mo, d, h = "00", mi = "00", se = "00"] = m;
    const dt = new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}${BR_TZ}`);
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const [, d, mo, y, h = "00", mi = "00", se = "00"] = m;
    const dt = new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}${BR_TZ}`);
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback.toISOString();
}

function buildAddressAndCity(item: any): { address?: string; city?: string } {
  const cliente = item?.Cliente || item?.cliente || {};
  const ender = item?.Endereco || item?.endereco || cliente?.Endereco || cliente?.endereco || {};
  const street = pick(ender, ["Logradouro", "Rua", "logradouro", "rua"]) || pick(item, ["Endereco", "endereco"]);
  const number = pick(ender, ["Numero", "numero"]);
  const bairro = pick(ender, ["Bairro", "bairro"]);
  const cidade = pick(ender, ["Cidade", "cidade"]);
  const uf = pick(ender, ["UF", "uf", "Estado", "estado"]);
  const parts = [
    [street, number].filter(Boolean).join(", "),
    bairro,
    [cidade, uf].filter(Boolean).join(" - "),
  ].filter((p) => p && String(p).trim());
  return {
    address: parts.join(" · ").trim() || undefined,
    city: cidade ? String(cidade).trim() : undefined,
  };
}

function normalize(item: any): Atendimento {
  const cliente = item?.Cliente || item?.cliente || {};
  const id = String(pick(item, ["Numero", "CodAtendimento", "Codigo", "Id", "ID", "id", "codigo"]) ?? "");
  const protocol = String(pick(item, ["Protocolo", "protocolo", "NumeroProtocolo"]) ?? id);
  const customerName = String(
    pick(item, ["NomeCliente", "Cliente", "nomecliente"]) ||
      pick(cliente, ["Nome", "RazaoSocial", "nome"]) ||
      (pick(item, ["CodigoCliente"]) ? `Cliente #${pick(item, ["CodigoCliente"])}` : null) ||
      "—",
  );
  const customerPhone = String(
    pick(item, ["TelefoneCliente", "Telefone", "Celular"]) ||
      pick(cliente, ["Telefone", "Celular", "telefone"]) || "",
  ) || undefined;

  const type = String(pick(item, ["TipoAtendimento", "Tipo", "tipo", "Servico", "servico"]) || "Atendimento");
  const reason = String(pick(item, ["Topico", "Motivo", "motivo", "Assunto"]) || "") || undefined;
  const description = String(pick(item, ["Assunto", "Solucao", "Descricao", "descricao", "Observacoes", "Obs"]) || "") || undefined;
  const technician = String(pick(item, ["Designacao_Usuario", "Designacao_Grupo_Nome", "Tecnico", "tecnico", "NomeTecnico", "Responsavel"]) || "") || undefined;

  const statusRaw = pick(item, ["Situacao_OS", "Situacao_Agendamento", "Status", "Situacao", "situacao", "status"]);
  const { status, label } = normalizeStatus(statusRaw);

  const scheduledAt =
    parseDate([pick(item, ["Data_Agendamento"]), pick(item, ["Hora_Agendamento"])].filter(Boolean).join(" ")) ||
    parseDate(pick(item, ["DataAgendamento", "DataHoraAgendamento", "DataAgendado", "Agendamento"])) ||
    parseDate(pick(item, ["Abertura_DataHora", "DataAbertura", "DataHoraAbertura", "Data"]));
  const openedAt = parseDate(pick(item, ["Abertura_DataHora", "DataAbertura", "DataHoraAbertura", "Data"]));

  const customerCode = pick(item, ["CodigoCliente", "Cliente_Codigo", "ClienteCodigo", "Codigo_Cliente"]);
  const { address, city } = buildAddressAndCity(item);

  return {
    id: id || crypto.randomUUID(),
    protocol,
    customerCode: customerCode ? String(customerCode) : undefined,
    customerName,
    customerPhone,
    address,
    city,
    type,
    reason,
    description,
    technician,
    status,
    statusLabel: label,
    scheduledAt,
    openedAt,
  };
}

function extractList(parsed: any): any[] {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.Atendimentos)) return parsed.Atendimentos;
  if (Array.isArray(parsed?.atendimentos)) return parsed.atendimentos;
  if (Array.isArray(parsed?.dados)) return parsed.dados;
  if (Array.isArray(parsed?.data)) return parsed.data;
  if (Array.isArray(parsed?.Resultado)) return parsed.Resultado;
  if (Array.isArray(parsed?.resultado)) return parsed.resultado;
  if (parsed && typeof parsed === "object") {
    for (const k of Object.keys(parsed)) {
      if (Array.isArray((parsed as any)[k])) return (parsed as any)[k];
    }
  }
  return [];
}

type ClienteData = {
  name?: string;
  phone?: string;
  phone2?: string;
  document?: string;
  address?: string;
  city?: string;
};

function normalizeClienteRecord(item: any): ClienteData {
  const get = (k: string): string => {
    const v = item?.[k];
    return v == null ? "" : String(v).trim();
  };
  const street = get("Endereco") || get("Cobr_Endereco");
  const number = get("Numero");
  const complement = get("Complemento") || get("Cobr_Complemento");
  const bairro = get("Bairro") || get("Cobr_Bairro");
  const cidade = get("Cidade") || get("Cobr_Cidade");
  const uf = get("UF") || get("Cobr_UF");
  const cep = get("CEP") || get("Cobr_CEP");
  const addrParts = [
    [street, number].filter(Boolean).join(", "),
    complement,
    bairro,
    [cidade, uf].filter(Boolean).join(" - "),
    cep ? `CEP ${cep}` : "",
  ].filter((p) => p && p.trim());
  const address = addrParts.join(" · ").trim() || undefined;
  const cel = get("TelCelular");
  const com = get("TelComercial");
  const res = get("TelResidencial");
  const phones = [cel, com, res].filter(Boolean);
  const document = get("CNPJ_CNPF") || get("CPF") || get("CNPJ") || get("CPF_CNPJ");

  return {
    name: get("Nome") || get("RazaoSocial") || get("Razao_Social") || undefined,
    phone: phones[0] || undefined,
    phone2: phones[1] || undefined,
    document: document || undefined,
    address,
    city: cidade || undefined,
  };
}

async function fetchCliente(endpoint: string, authKey: string, codigo: string): Promise<ClienteData | null> {
  const body = JSON.stringify({
    ConsultaClientes: {
      Autenticacao: { ChaveIntegracao: authKey },
      Filtro: `Codigo = '${codigo}'`,
    },
  });
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Jotazo-Integration/1.0",
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
    const t = await r.text();
    let p: any = null;
    try { p = JSON.parse(t); } catch { return null; }
    if (!p) return null;
    const list = extractList(p?.result ?? p);
    if (!list.length) return null;
    return normalizeClienteRecord(list[0]);
  } catch {
    return null;
  }
}

async function fetchContatos(endpoint: string, authKey: string, codigo: string): Promise<{ email?: string; phones: string[] }> {
  const body = JSON.stringify({
    ConsultaContatos: {
      Autenticacao: { ChaveIntegracao: authKey },
      Filtro: `Cliente = ${codigo}`,
    },
  });
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Jotazo-Integration/1.0",
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
    const t = await r.text();
    let p: any = null;
    try { p = JSON.parse(t); } catch { return { phones: [] }; }
    const list = extractList(p?.result ?? p);
    let email: string | undefined;
    const phones: string[] = [];
    for (const c of list) {
      if (!email) {
        const e = String(c?.Email || "").trim();
        if (e) email = e;
      }
      for (const k of ["Telefone1", "Telefone2", "Telefone3"]) {
        const v = String(c?.[k] || "").trim();
        if (v && !phones.includes(v)) phones.push(v);
      }
    }
    return { email, phones };
  } catch {
    return { phones: [] };
  }
}

async function enrichWithClientes(atendimentos: Atendimento[], endpoint: string, authKey: string): Promise<void> {
  const codes = Array.from(new Set(atendimentos.map((a) => a.customerCode).filter((c): c is string => !!c)));
  if (!codes.length) return;
  const MAX_CODES = 60;
  const limited = codes.slice(0, MAX_CODES);
  type Combined = { cliente: ClienteData | null; contatos: { email?: string; phones: string[] } };
  const cache = new Map<string, Combined>();
  const concurrency = 4;
  let idx = 0;
  async function worker() {
    while (idx < limited.length) {
      const i = idx++;
      const code = limited[i];
      const cliente = await fetchCliente(endpoint, authKey, code);
      const contatos = cliente ? await fetchContatos(endpoint, authKey, code) : { phones: [] as string[] };
      cache.set(code, { cliente, contatos });
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, limited.length) }, worker));
  for (const a of atendimentos) {
    if (!a.customerCode) continue;
    const entry = cache.get(a.customerCode);
    if (!entry) continue;
    const { cliente: c, contatos } = entry;
    if (c?.name && (a.customerName === "—" || /^Cliente #/.test(a.customerName))) a.customerName = c.name;
    if (c?.document) a.customerDocument = c.document;
    if (c?.address && !a.address) a.address = c.address;
    if (c?.city && !a.city) a.city = c.city;
    const allPhones: string[] = [];
    const push = (v?: string) => { if (v && !allPhones.includes(v)) allPhones.push(v); };
    push(a.customerPhone);
    push(c?.phone);
    push(c?.phone2);
    contatos.phones.forEach(push);
    if (allPhones[0]) a.customerPhone = allPhones[0];
    if (allPhones[1]) a.customerPhone2 = allPhones[1];
    if (contatos.email) a.customerEmail = contatos.email;
  }
}

// Cache simples em memória (chave: from|to). Reduz pressão na API RBX
// quando vários acessos coincidem. TTL curto pois auto-refresh do front é 90s.
const memCache = new Map<string, { at: number; data: Atendimento[] }>();
const CACHE_TTL_MS = 30_000;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // compara mesmo assim para evitar leak de tamanho
    let r = 1;
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) r |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return false;
  }
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Rate-limit em memória por IP (10 tentativas/min)
const rl = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const cur = rl.get(ip);
  if (!cur || cur.reset < now) {
    rl.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  cur.count += 1;
  return cur.count <= 10;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (!rateLimit(ip)) {
      return new Response(JSON.stringify({ ok: false, error: "Muitas tentativas. Aguarde 1 minuto." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expected = Deno.env.get("AGENDA_ACCESS_PASSWORD") || "";
    const provided = req.headers.get("x-agenda-pass") || "";
    if (!expected || !timingSafeEqual(expected, provided)) {
      return new Response(JSON.stringify({ ok: false, error: "Senha inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { from, to } = (await req.json()) as { from: string; to: string };
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return new Response(JSON.stringify({ ok: false, error: "Parâmetros from/to inválidos (YYYY-MM-DD)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache hit
    const cacheKey = `${from}|${to}`;
    const cached = memCache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ ok: true, atendimentos: cached.data, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(supabaseUrl, supabaseServiceKey);
    const { data: cfg, error: cfgErr } = await supa
      .from("rbx_config")
      .select("base_url, auth_key_v1")
      .limit(1)
      .maybeSingle();
    if (cfgErr || !cfg?.base_url || !cfg.auth_key_v1) {
      return new Response(JSON.stringify({ ok: false, error: "Configuração RBX ausente" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const endpoint = `${cfg.base_url.replace(/\/+$/, "")}/routerbox/ws/rbx_server_json.php`;
    const fromExpanded = (() => {
      const d = new Date(`${from}T00:00:00${BR_TZ}`);
      d.setDate(d.getDate() - 90);
      return toISODateBR(d);
    })();
    const body = JSON.stringify({
      ConsultaAtendimentos: {
        Autenticacao: { ChaveIntegracao: cfg.auth_key_v1 },
        Filtro: `Atendimentos.Data_AB >= '${fromExpanded} 00:00:00' AND Atendimentos.Data_AB <= '${to} 23:59:59'`,
      },
    });

    const start = performance.now();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Jotazo-Integration/1.0",
      },
      body,
      signal: AbortSignal.timeout(20000),
    });
    const latency_ms = Math.round(performance.now() - start);
    const text = await response.text();

    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }

    const isEmptyResult = (p: any): boolean => {
      if (!p) return false;
      const errCodeV2 = Number(p?.error_code);
      const errCodeV1 = Number(p?.erro_code);
      const errDesc = String(p?.error_description || p?.erro_desc || "").toLowerCase();
      return errCodeV2 === 1 || errCodeV1 === 1
        || errDesc.includes("nao retornou") || errDesc.includes("não retornou")
        || errDesc.includes("sem resultado") || errDesc.includes("nenhum resultado");
    };

    if (parsed && isEmptyResult(parsed)) {
      memCache.set(cacheKey, { at: Date.now(), data: [] });
      return new Response(JSON.stringify({ ok: true, atendimentos: [], latency_ms }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok || !parsed) {
      return new Response(JSON.stringify({
        ok: false, error: `RBX retornou HTTP ${response.status}`, latency_ms,
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiStatus = parsed?.status;
    if (apiStatus !== 1 && apiStatus !== "1" && apiStatus !== true) {
      const msg = parsed?.error_description || parsed?.erro_desc || parsed?.result || "Erro na consulta RBX";
      return new Response(JSON.stringify({ ok: false, error: String(msg), latency_ms }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const list = extractList(parsed?.result ?? parsed);
    const all: Atendimento[] = list.map(normalize);
    const atendimentos = all.filter((a) => {
      const ref = a.scheduledAt || a.openedAt;
      if (!ref) return false;
      const day = toISODateBR(new Date(ref));
      return day >= from && day <= to;
    });

    await enrichWithClientes(atendimentos, endpoint, cfg.auth_key_v1);
    memCache.set(cacheKey, { at: Date.now(), data: atendimentos });

    return new Response(JSON.stringify({ ok: true, atendimentos, latency_ms }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false, error: err instanceof Error ? err.message : "Erro desconhecido",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
