// Public lookup used by /conta/cadastro.
// Searches RBX (active customer base) and the public CPF/CNPJ API in parallel.
// No auth required — intentionally minimal data returned to avoid PII leakage
// and rate-limited by CPF/CNPJ DV validation.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function onlyDigits(s: string) { return String(s || "").replace(/\D+/g, ""); }

// --- CPF/CNPJ DV check (prevents brute-force flooding) -----------------
function calcCpfDv(base: string): number {
  const len = base.length;
  let sum = 0;
  for (let i = 0; i < len; i++) sum += parseInt(base[i], 10) * (len + 1 - i);
  const r = (sum * 10) % 11;
  return r === 10 ? 0 : r;
}
function isValidCpf(d: string) {
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv1 = calcCpfDv(d.slice(0, 9));
  const dv2 = calcCpfDv(d.slice(0, 9) + dv1);
  return d.endsWith(`${dv1}${dv2}`);
}
function calcCnpjDv(base: string): number {
  const weights = base.length === 12
    ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * weights[i];
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}
function isValidCnpj(d: string) {
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const dv1 = calcCnpjDv(d.slice(0, 12));
  const dv2 = calcCnpjDv(d.slice(0, 12) + dv1);
  return d.endsWith(`${dv1}${dv2}`);
}

// --- RBX direct lookup (no admin guard) --------------------------------
async function rbxFetch(endpoint: string, body: string) {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return null; }
  } catch { return null; }
}
function extractList(p: any): any[] {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  for (const k of ["result", "Result", "data", "Data", "registros", "Registros"]) {
    const v = (p as any)[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      for (const k2 of Object.keys(v)) if (Array.isArray((v as any)[k2])) return (v as any)[k2];
    }
  }
  for (const k of Object.keys(p)) if (Array.isArray((p as any)[k])) return (p as any)[k];
  return [];
}
function pick(obj: any, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return "";
}
function normalizeBirthDate(v: string): string {
  if (!v) return "";
  const s = String(v).trim();
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return "";
}

async function lookupRbx(doc: string): Promise<any | null> {
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const supaSrv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supa = createClient(supaUrl, supaSrv);
  const { data: cfg } = await supa.from("rbx_config").select("base_url, auth_key_v1").limit(1).maybeSingle();
  if (!cfg?.base_url || !cfg.auth_key_v1) return null;
  const endpoint = `${cfg.base_url.replace(/\/+$/, "")}/routerbox/ws/rbx_server_json.php`;
  const filters = [`CNPJ_CNPF = '${doc}'`, `CPF_CNPJ = '${doc}'`, `CPF = '${doc}'`, `CNPJ = '${doc}'`];
  let cliente: any = null;
  for (const f of filters) {
    const body = JSON.stringify({
      ConsultaClientes: { Autenticacao: { ChaveIntegracao: cfg.auth_key_v1 }, Filtro: f },
    });
    const p = await rbxFetch(endpoint, body);
    const list = extractList(p?.result ?? p);
    if (list.length) { cliente = list[0]; break; }
  }
  if (!cliente) return null;
  const codigo = pick(cliente, "Codigo", "CodigoCliente", "codigo", "Id");
  let email = pick(cliente, "Email");
  let phone = pick(cliente, "Telefone1", "Telefone", "Celular");
  if (codigo && (!email || !phone)) {
    const body = JSON.stringify({
      ConsultaContatos: { Autenticacao: { ChaveIntegracao: cfg.auth_key_v1 }, Filtro: `Cliente = ${codigo}` },
    });
    const p = await rbxFetch(endpoint, body);
    const list = extractList(p?.result ?? p);
    for (const c of list) {
      if (!email) email = String(c?.Email || "").trim();
      if (!phone) {
        for (const k of ["Telefone1", "Telefone2", "Telefone3"]) {
          const v = String(c?.[k] || "").trim();
          if (v) { phone = v; break; }
        }
      }
      if (email && phone) break;
    }
  }
  return {
    codigo,
    name: pick(cliente, "Nome", "RazaoSocial", "Razao_Social"),
    email,
    phone: onlyDigits(phone),
    birthDate: normalizeBirthDate(pick(cliente, "DataNascimento", "Data_Nascimento")),
    address: {
      zipCode: onlyDigits(pick(cliente, "CEP", "Cep")),
      street: pick(cliente, "Endereco", "Logradouro", "Rua"),
      number: pick(cliente, "Numero"),
      complement: pick(cliente, "Complemento"),
      neighborhood: pick(cliente, "Bairro"),
      city: pick(cliente, "Cidade", "Municipio"),
      state: pick(cliente, "UF", "Estado"),
    },
  };
}

// --- CPF/CNPJ API ------------------------------------------------------
async function lookupCpfApi(doc: string): Promise<any | null> {
  const token = Deno.env.get("CPFCNPJ_TOKEN");
  if (!token || doc.length !== 11) return null;
  try {
    const r = await fetch(`https://api.cpfcnpj.com.br/${token}/7/${doc}`, {
      signal: AbortSignal.timeout(15000),
    });
    const data = await r.json();
    if (data?.status !== 1) return null;
    let birthDate = "";
    if (data.nascimento && /^\d{2}\/\d{2}\/\d{4}$/.test(data.nascimento)) {
      const [d, m, y] = String(data.nascimento).split("/");
      birthDate = `${y}-${m}-${d}`;
    }
    return { name: String(data.nome || ""), birthDate };
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { document } = await req.json().catch(() => ({}));
    const doc = onlyDigits(String(document || ""));
    const valid = doc.length === 11 ? isValidCpf(doc) : doc.length === 14 ? isValidCnpj(doc) : false;
    if (!valid) {
      return new Response(JSON.stringify({ found: false, error: "invalid_doc" }), { status: 400, headers: corsHeaders });
    }

    const [rbx, cpfApi] = await Promise.all([lookupRbx(doc), lookupCpfApi(doc)]);

    const existsInRbx = !!rbx?.codigo;
    const merged = {
      found: !!(rbx || cpfApi),
      existsInRbx,
      rbxCodigo: rbx?.codigo || null,
      sources: [rbx ? "rbx" : null, cpfApi ? "cpfcnpj" : null].filter(Boolean),
      name: rbx?.name || cpfApi?.name || "",
      email: rbx?.email || "",
      phone: rbx?.phone || "",
      birthDate: rbx?.birthDate || cpfApi?.birthDate || "",
      address: rbx?.address || null,
    };

    return new Response(JSON.stringify(merged), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ found: false, error: "exception", message: (e as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
