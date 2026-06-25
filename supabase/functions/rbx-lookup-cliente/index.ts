// Lookup de cliente na RBX por CPF/CNPJ. Admin-only.
// Retorna formato normalizado para consumo pela cascata EAI → RBX → CPF API.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/adminGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function onlyDigits(s: string) { return (s || "").replace(/\D+/g, ""); }

async function rbxFetch(endpoint: string, body: string) {
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body,
      signal: AbortSignal.timeout(20000),
    });
    const t = await r.text();
    try { return JSON.parse(t); } catch { return null; }
  } catch (e) {
    console.error("[rbx-lookup] fetch error:", (e as Error).message);
    return null;
  }
}

function extractList(p: any): any[] {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  for (const k of ["result", "Result", "data", "Data", "registros", "Registros", "lista", "Lista"]) {
    const v = (p as any)[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      for (const k2 of Object.keys(v)) if (Array.isArray((v as any)[k2])) return (v as any)[k2];
    }
  }
  for (const k of Object.keys(p)) if (Array.isArray((p as any)[k])) return (p as any)[k];
  return [];
}

async function findClienteByDoc(endpoint: string, authKey: string, doc: string): Promise<any | null> {
  const filters = [
    `CNPJ_CNPF = '${doc}'`,
    `CPF_CNPJ = '${doc}'`,
    `CPF = '${doc}'`,
    `CNPJ = '${doc}'`,
  ];
  for (const f of filters) {
    const body = JSON.stringify({
      ConsultaClientes: { Autenticacao: { ChaveIntegracao: authKey }, Filtro: f },
    });
    const p = await rbxFetch(endpoint, body);
    const list = extractList(p?.result ?? p);
    if (list.length) return list[0];
  }
  return null;
}

async function findContatos(endpoint: string, authKey: string, codigo: string) {
  const body = JSON.stringify({
    ConsultaContatos: { Autenticacao: { ChaveIntegracao: authKey }, Filtro: `Cliente = ${codigo}` },
  });
  const p = await rbxFetch(endpoint, body);
  const list = extractList(p?.result ?? p);
  let email = "";
  const phones: string[] = [];
  for (const c of list) {
    if (!email) email = String(c?.Email || "").trim();
    for (const k of ["Telefone1", "Telefone2", "Telefone3"]) {
      const v = String(c?.[k] || "").trim();
      if (v && !phones.includes(v)) phones.push(v);
    }
  }
  return { email, phone: phones[0] || "" };
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const guard = await requireAdmin(req);
  if (guard) return guard;
  try {
    const { document } = await req.json().catch(() => ({}));
    const doc = onlyDigits(String(document || ""));
    if (doc.length !== 11 && doc.length !== 14) {
      return new Response(JSON.stringify({ found: false, error: "invalid_doc" }), { headers: corsHeaders });
    }

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaSrv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(supaUrl, supaSrv);
    const { data: cfg } = await supa.from("rbx_config").select("base_url, auth_key_v1").limit(1).maybeSingle();
    if (!cfg?.base_url || !cfg.auth_key_v1) {
      return new Response(JSON.stringify({ found: false, error: "rbx_not_configured" }), { headers: corsHeaders });
    }
    const endpoint = `${cfg.base_url.replace(/\/+$/, "")}/routerbox/ws/rbx_server_json.php`;

    const cliente = await findClienteByDoc(endpoint, cfg.auth_key_v1, doc);
    if (!cliente) {
      return new Response(JSON.stringify({ found: false }), { headers: corsHeaders });
    }
    const codigo = pick(cliente, "Codigo", "CodigoCliente", "codigo", "Id");
    let email = pick(cliente, "Email");
    let phone = pick(cliente, "Telefone1", "Telefone", "Celular");
    if (codigo && (!email || !phone)) {
      const ct = await findContatos(endpoint, cfg.auth_key_v1, codigo);
      if (!email) email = ct.email;
      if (!phone) phone = ct.phone;
    }

    const birthDate = normalizeBirthDate(pick(cliente, "DataNascimento", "Data_Nascimento", "Nascimento"));

    const clientDoc = onlyDigits(pick(cliente, "CNPJ_CNPF", "CPF_CNPJ", "CNPJ", "CPF"));
    const razao = pick(cliente, "RazaoSocial", "Razao_Social", "Nome_Razao_Social");
    const fantasy = pick(cliente, "NomeFantasia", "Nome_Fantasia");
    const tipoPessoa = String(pick(cliente, "TipoPessoa", "Tipo_Pessoa", "Tipo", "PessoaTipo") || "").toUpperCase();
    const looksCompany =
      clientDoc.length === 14 ||
      !!razao ||
      !!fantasy ||
      tipoPessoa.startsWith("J") || tipoPessoa.includes("JUR") ||
      (clientDoc.length === 11 && doc !== clientDoc);
    const docType: "cpf" | "cnpj" =
      looksCompany ? "cnpj"
      : clientDoc.length === 11 ? "cpf"
      : (doc.length === 14 ? "cnpj" : "cpf");

    // Prefer Razão Social for company records — RBX may store contact name in "Nome".
    const name = docType === "cnpj"
      ? (razao || pick(cliente, "Nome_Razao_Social", "Nome"))
      : pick(cliente, "Nome", "RazaoSocial", "Razao_Social", "Nome_Razao_Social");

    const repDoc = onlyDigits(pick(cliente, "CPF_Responsavel", "Cpf_Responsavel", "CPF_Contato", "Cpf_Contato"));
    const repName = pick(cliente, "Nome_Responsavel", "Responsavel", "Contato", "Nome_Contato");
    const repBirth = normalizeBirthDate(pick(cliente, "DataNascimento_Responsavel", "Data_Nascimento_Responsavel", "Nascimento_Responsavel"));
    const representative = (repDoc || repName)
      ? { document: repDoc, name: repName, birthDate: repBirth }
      : null;

    const payload = {
      found: true,
      source: "rbx" as const,
      codigo,
      docType,
      name,
      email,
      phone: onlyDigits(phone),
      birthDate: birthDate || null,
      representative,
      address: {
        zipCode: onlyDigits(pick(cliente, "CEP", "Cep")),
        street: pick(cliente, "Endereco", "Logradouro", "Rua"),
        number: pick(cliente, "Numero", "Endereco_Numero"),
        complement: pick(cliente, "Complemento", "Endereco_Complemento"),
        neighborhood: pick(cliente, "Bairro"),
        city: pick(cliente, "Cidade", "Municipio"),
        state: pick(cliente, "UF", "Estado"),
      },
      raw: cliente,
    };
    return new Response(JSON.stringify(payload), { headers: corsHeaders });
  } catch (e) {
    console.error("[rbx-lookup] exception:", (e as Error).message);
    return new Response(JSON.stringify({ found: false, error: "exception", message: (e as Error).message }), { headers: corsHeaders });
  }
});
