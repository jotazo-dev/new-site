// Cascata de lookup de CPF/CNPJ para o fluxo /admin/mvno/nova-linha.
// Ordem: MVNO (EAI ou Algar) → RBX → API CPF/CNPJ pública.
// Para a primeira fonte que retornar dados, normaliza e devolve.

import { supabase } from "@/integrations/supabase/client";
import { eaiCall } from "@/components/admin/esim/eai/eaiClient";
import { findSubscriberByDocument, fetchSubscriberDetails } from "@/components/admin/esim/algar/algarClient";

export type LookupSource = "eai" | "algar" | "rbx" | "cpfcnpj" | "brasilapi";

export type LookupResult = {
  found: boolean;
  source?: LookupSource;
  // identidade na origem MVNO (quando aplicável)
  customerId?: string;   // EAI
  subscriberRef?: string; // Algar
  // dados normalizados
  name?: string;
  email?: string;
  phone?: string;        // só dígitos, sem DDI
  birthDate?: string;    // YYYY-MM-DD
  address?: {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  representative?: { document?: string; name?: string; birthDate?: string };
};


function pick(obj: any, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return "";
}

function onlyDigits(s: string) { return (s || "").replace(/\D+/g, ""); }

function isoDate(v: string): string {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return s;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return "";
}

async function tryEai(doc: string): Promise<LookupResult | null> {
  const chk = await eaiCall<any>(`/rest/service_eai/customers/check_already_exists/${doc}`, { method: "GET" });
  const j = chk?.json || {};
  const exists = !!(j.alreadyExists ?? j.exists ?? j.data?.alreadyExists);
  const id = String(j.id ?? j.customerId ?? j.personId ?? j.data?.id ?? j.data?.customerId ?? j.data?.personId ?? "");
  if (!exists || !id) return null;
  const det = await eaiCall<any>(`/rest/service_eai/customers/${id}`, { method: "GET" });
  const cust: any = det?.json?.customer ?? det?.json?.data ?? det?.json ?? {};
  const addr: any = (Array.isArray(cust.addresses) && cust.addresses[0]) || cust.address || {};
  const contacts: any[] = Array.isArray(cust.contacts) ? cust.contacts : [];
  const emailC = contacts.find((c) => /email/i.test(c?.kind || c?.type || ""))?.value;
  const phoneC = contacts.find((c) => /(cell|phone|celular|telefone|mobile)/i.test(c?.kind || c?.type || ""))?.value;
  return {
    found: true,
    source: "eai",
    customerId: id,
    name: pick(cust, "name", "legalName", "fullName"),
    email: pick(cust, "email") || emailC || "",
    phone: onlyDigits(pick(cust, "phone", "cellphone") || phoneC || ""),
    birthDate: isoDate(pick(cust, "birthdate", "birthDate")),
    address: {
      zipCode: onlyDigits(pick(addr, "zipCode", "zip_code", "cep", "postalCode")),
      street: pick(addr, "streetName", "street", "logradouro"),
      number: pick(addr, "streetNumber", "number", "numero"),
      complement: pick(addr, "complement", "complemento"),
      neighborhood: pick(addr, "neighborhood", "bairro"),
      city: pick(addr, "city", "cidade"),
      state: pick(addr, "state", "uf"),
    },
  };
}

async function tryAlgar(doc: string): Promise<LookupResult | null> {
  const sub: any = await findSubscriberByDocument(doc);
  if (!sub) return null;
  const addr = sub.address || sub.endereco || {};
  const phoneRaw = onlyDigits(pick(sub, "contact_number", "contactPhone", "contact_phone", "phone", "celular"));
  const phone = phoneRaw.startsWith("55") && phoneRaw.length > 11 ? phoneRaw.slice(2) : phoneRaw;
  const rep = sub.representative || null;

  // O índice Algar mapeia o mesmo subscriber por document E por representative.document.
  // Se o doc consultado corresponde ao CPF do responsável (e não ao CNPJ da empresa),
  // devolvemos os dados da PESSOA — caso contrário o nome retornado seria a razão social.
  const subDoc = onlyDigits(String(sub.document || sub.cpf || sub.cnpj || ""));
  const repDocDigits = onlyDigits(String(rep?.document || ""));
  const matchedViaRep = !!repDocDigits && repDocDigits === doc && subDoc !== doc;
  if (matchedViaRep) {
    let repBirth = isoDate(String(rep.birthdate || rep.birth_date || rep.birthDate || ""));
    // O índice de mobilelines não carrega birthdate do representante.
    // Buscar detalhes completos do subscriber da empresa para enriquecer.
    if (!repBirth && subDoc) {
      try {
        const full: any = await fetchSubscriberDetails(subDoc);
        const fullRep = full?.representative || {};
        repBirth = isoDate(String(fullRep.birthdate || fullRep.birth_date || fullRep.birthDate || ""));
      } catch { /* segue sem birth */ }
    }
    // Se ainda assim não temos data de nascimento, devolve null para que a
    // cascata continue (RBX → CPF API) e tente preencher o nascimento.
    if (!repBirth) return null;
    return {
      found: true,
      source: "algar",
      subscriberRef: pick(sub, "ref", "id"),
      name: String(rep.name || ""),
      email: "",
      phone: "",
      birthDate: repBirth,
    };
  }

  return {
    found: true,
    source: "algar",
    subscriberRef: pick(sub, "ref", "id"),
    name: pick(sub, "full_name", "fullName", "name"),
    email: pick(sub, "email"),
    phone,
    birthDate: isoDate(pick(sub, "birth_date", "birthDate", "birthdate", "data_nascimento")),
    address: {
      zipCode: onlyDigits(pick(addr, "zip_code", "zipCode", "cep")),
      street: pick(addr, "street", "street_name", "streetName", "logradouro"),
      number: pick(addr, "number", "street_number", "streetNumber", "numero"),
      complement: pick(addr, "complement", "complemento"),
      neighborhood: pick(addr, "neighborhood", "bairro"),
      city: pick(addr, "city", "cidade", "localidade"),
      state: pick(addr, "state", "uf", "estado"),
    },
    representative: rep ? {
      document: onlyDigits(String(rep.document || "")),
      name: String(rep.name || ""),
      birthDate: isoDate(String(rep.birthdate || rep.birth_date || rep.birthDate || "")),
    } : undefined,
  };
}


async function tryRbx(doc: string): Promise<LookupResult | null> {
  const { data, error } = await supabase.functions.invoke("rbx-lookup-cliente", { body: { document: doc } });
  if (error || !data?.found) return null;
  const rep = data.representative || (data.responsavel_documento || data.responsavel_nome ? {
    document: data.responsavel_documento,
    name: data.responsavel_nome,
    birthDate: data.responsavel_data_nascimento,
  } : null);
  return {
    found: true,
    source: "rbx",
    name: data.name || "",
    email: data.email || "",
    phone: onlyDigits(data.phone || ""),
    birthDate: isoDate(data.birthDate || ""),
    address: data.address || {},
    representative: rep ? {
      document: onlyDigits(String(rep.document || "")),
      name: String(rep.name || ""),
      birthDate: isoDate(String(rep.birthDate || rep.birth_date || rep.birthdate || "")),
    } : undefined,
  };
}


async function tryCpfApi(doc: string): Promise<LookupResult | null> {
  const { data } = await supabase.functions.invoke("search-cpf", { body: { cpf: doc } });
  if (!data?.found) return null;
  return {
    found: true,
    source: "cpfcnpj",
    name: data.name || "",
    birthDate: isoDate(data.birth_date || data.birthDate || ""),
    address: data.address ? {
      zipCode: onlyDigits(String(data.address.zipCode || "")),
      street: data.address.street || "",
      number: data.address.number != null ? String(data.address.number) : "",
      neighborhood: data.address.neighborhood || "",
      city: data.address.city || "",
      state: data.address.state || "",
    } : undefined,
  };
}

async function tryCnpjApi(doc: string): Promise<LookupResult | null> {
  const { data } = await supabase.functions.invoke("search-cnpj", { body: { cnpj: doc } });
  if (!data?.found) return null;
  const rep = data.representative || null;
  return {
    found: true,
    source: "brasilapi",
    name: data.name || "",
    birthDate: isoDate(data.birth_date || ""),
    address: data.address ? {
      zipCode: onlyDigits(String(data.address.zipCode || "")),
      street: data.address.street || "",
      number: data.address.number != null ? String(data.address.number) : "",
      neighborhood: data.address.neighborhood || "",
      city: data.address.city || "",
      state: data.address.state || "",
    } : undefined,
    representative: rep ? {
      document: onlyDigits(String(rep.document || "")),
      name: String(rep.name || ""),
      birthDate: isoDate(String(rep.birthDate || rep.birth_date || "")),
    } : undefined,
  };
}


export async function lookupCustomerByDoc(
  document: string,
  opts: { mvno: "eai" | "algar"; docType: "cpf" | "cnpj" },
): Promise<LookupResult> {
  const doc = onlyDigits(document);
  const expected = opts.docType === "cpf" ? 11 : 14;
  if (doc.length !== expected) return { found: false };

  try {
    // 1. MVNO de destino
    const mvnoHit = opts.mvno === "eai" ? await tryEai(doc) : await tryAlgar(doc);
    if (mvnoHit) { console.log("[lookup] hit", mvnoHit.source, doc.slice(0, 3) + "***"); return mvnoHit; }

    // 2. RBX (somente para CPF — base RBX usa pessoa física no telecom; mas testa também CNPJ se houver)
    const rbxHit = await tryRbx(doc);
    if (rbxHit) { console.log("[lookup] hit rbx"); return rbxHit; }

    // 3. API pública CPF / CNPJ
    if (opts.docType === "cpf") {
      const cpfHit = await tryCpfApi(doc);
      if (cpfHit) { console.log("[lookup] hit cpfcnpj"); return cpfHit; }
    } else {
      const cnpjHit = await tryCnpjApi(doc);
      if (cnpjHit) { console.log("[lookup] hit brasilapi"); return cnpjHit; }
    }
  } catch (e) {
    console.warn("[lookup] error:", (e as Error).message);
  }
  return { found: false };
}
