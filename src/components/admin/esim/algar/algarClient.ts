import { supabase } from "@/integrations/supabase/client";

export async function algarCall<T = any>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    queryParams?: Record<string, any>;
  } = {}
): Promise<{ ok: boolean; status: number; data: T; error?: string; step?: string; raw?: string }> {
  const { data: configData } = await supabase
    .from("integrations")
    .select("config")
    .eq("provider", "algar")
    .maybeSingle();

  const config = (configData?.config as any) || {};

  const { data, error } = await supabase.functions.invoke("algar-mvno-api", {
    body: {
      clientId: config.client_id,
      clientSecret: config.client_secret,
      baseUrl: config.base_url || "https://api.onmultitelco.com",
      environment: config.environment || "production",
      method: opts.method || "GET",
      path,
      body: opts.body,
      queryParams: opts.queryParams,
      forceMock: false,
    },
  });

  if (error) {
    return { ok: false, status: 500, data: null as any, error: error.message };
  }

  return data;
}

export function formatMsisdn(v: string | number | null | undefined): string {
  if (!v) return "—";
  const d = String(v).replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return String(v);
}

// ---------- Typed helpers for the simplified activation wizard ----------

export type AlgarTn = { tn: string; portability?: boolean; status?: string; locale?: AlgarLocale };
export type AlgarSim = { iccid: string; type?: "sim" | "esim"; imsi?: string };
export type AlgarProduct = { sku: string; name: string; role?: string; group?: string | null; description?: string; price?: number };
export type AlgarLocale = { locale: string; state: string; name: string; description?: string };
export type AlgarAddress = {
  zip_code?: string;
  zipCode?: string;
  cep?: string;
  street?: string;
  street_name?: string;
  streetName?: string;
  logradouro?: string;
  number?: string | number;
  street_number?: string | number;
  streetNumber?: string | number;
  numero?: string | number;
  complement?: string;
  complemento?: string;
  neighborhood?: string;
  bairro?: string;
  city?: string;
  cidade?: string;
  localidade?: string;
  state?: string;
  uf?: string;
  estado?: string;
};

export type AlgarSubscriber = {
  id?: string;
  ref?: string;
  type?: "individual" | "company";
  document?: string;
  cpf?: string;
  cnpj?: string;
  tax_id?: string;
  taxId?: string;
  name?: string;
  full_name?: string;
  fullName?: string;
  birthdate?: string;
  birth_date?: string;
  birthDate?: string;
  data_nascimento?: string;
  email?: string;
  contact_number?: string;
  contactPhone?: string;
  contact_phone?: string;
  phone?: string;
  celular?: string;
  address?: AlgarAddress;
  endereco?: AlgarAddress;
  representative?: { document?: string; name?: string; birthdate?: string };
};

function unwrapList<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  if (Array.isArray(data?.data)) return data.data as T[];
  return [];
}

export async function listAvailableTns(product: string, locale: string): Promise<AlgarTn[]> {
  if (!product || !locale) return [];
  const out: AlgarTn[] = [];
  // Pagination: size minimum is 5 per Algar API
  let page = 1;
  let totalPages = 1;
  do {
    const res = await algarCall<any>("/v2/tns/available", {
      queryParams: { product, locale, page, size: 100 },
    });
    if (!res.ok) break;
    const payload = res.data?.data ?? res.data;
    const list: AlgarTn[] = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    out.push(...list);
    totalPages = Number(res.data?.meta?.totalPages || payload?.meta?.totalPages || 1);
    page += 1;
  } while (page <= totalPages && page <= 5);
  return out;
}

const localesCache = new Map<string, { at: number; items: AlgarLocale[] }>();
export async function listAvailableLocales(product: string): Promise<AlgarLocale[]> {
  if (!product) return [];
  const cached = localesCache.get(product);
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached.items;
  const res = await algarCall<any>("/v2/tns/available/locales", { queryParams: { product } });
  const items = unwrapList<AlgarLocale>(res.data);
  localesCache.set(product, { at: Date.now(), items });
  return items;
}

export async function listAvailableSimcards(product?: string): Promise<AlgarSim[]> {
  // The Algar endpoint REQUIRES a product SKU; without it the API returns 500.
  if (!product) return [];
  const first = await algarCall<any>("/v2/simcards/available", {
    queryParams: { product, page: 1, size: 100 },
  });
  if (!first.ok) return [];
  const firstPayload = first.data?.data ?? first.data;
  const firstList: AlgarSim[] = Array.isArray(firstPayload)
    ? firstPayload
    : Array.isArray(firstPayload?.data) ? firstPayload.data : [];
  const out: AlgarSim[] = [...firstList];
  const totalPages = Math.min(
    Number(first.data?.meta?.totalPages || firstPayload?.meta?.totalPages || 1),
    50
  );
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        algarCall<any>("/v2/simcards/available", {
          queryParams: { product, page: i + 2, size: 100 },
        })
      )
    );
    for (const res of rest) {
      if (!res.ok) continue;
      const p = res.data?.data ?? res.data;
      const l: AlgarSim[] = Array.isArray(p) ? p : Array.isArray(p?.data) ? p.data : [];
      out.push(...l);
    }
  }
  return out;
}

let productsCache: { at: number; items: AlgarProduct[] } | null = null;
export async function listProducts(force = false): Promise<AlgarProduct[]> {
  if (!force && productsCache && Date.now() - productsCache.at < 5 * 60_000) {
    return productsCache.items;
  }
  const first = await algarCall<any>("/v2/products/available", {
    queryParams: { service_type: "mobile_line", page: 1, size: 100 },
  });
  const items = unwrapList<AlgarProduct>(first.data);
  const meta = first.data?.meta || {};
  const totalPages = Math.min(Number(meta.totalPages || 1), 20);

  if (totalPages > 1) {
    const pages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        algarCall<any>("/v2/products/available", {
          queryParams: { service_type: "mobile_line", page: i + 2, size: 100 },
        })
      )
    );
    items.push(...pages.flatMap((res) => unwrapList<AlgarProduct>(res.data)));
  }

  productsCache = { at: Date.now(), items };
  return items;
}

// In-memory cache: a single full snapshot of /v2/mobilelines indexed by document.
// Built once, valid for 5 minutes, shared across all searches in the session.
type DocIndex = Map<string, AlgarSubscriber>;
let mobilelinesIndexCache: { at: number; index: DocIndex } | null = null;
let mobilelinesIndexPromise: Promise<DocIndex> | null = null;
const MOBILELINES_TTL_MS = 5 * 60_000;
const MOBILELINES_PAGE_SIZE = 100;
const MOBILELINES_PARALLEL_BATCH = 8; // pages fetched concurrently

function indexLineByDoc(index: DocIndex, ml: any) {
  const s = ml?.service?.subscriber || {};
  const r = ml?.service?.representative || {};
  const p = (ml?.portabilities || [])[0]?.subscriber || {};
  const a = ml?.service?.address || {};
  const representative = (r && (r.document || r.name))
    ? {
        document: String(r.document || ""),
        name: String(r.name || ""),
        birthdate: String(r.birthdate || r.birth_date || ""),
      }
    : undefined;
  const subscriber: AlgarSubscriber = {
    ...s,
    address: { ...a },
    contact_number: s.contact_number || s.contactPhone || s.contact_phone || s.phone || s.celular,
    birthdate: s.birthdate || s.birth_date,
    representative,
  } as AlgarSubscriber;
  const docs = [s.document, s.cpf, s.cnpj, r.document, p.document]
    .map((d) => String(d || "").replace(/\D/g, ""))
    .filter((d) => d.length === 11 || d.length === 14);
  for (const d of docs) {
    if (!index.has(d)) index.set(d, subscriber);
  }
}

async function fetchMobilelinesPage(page: number) {
  const res = await algarCall<any>("/v2/mobilelines", {
    queryParams: { page, size: MOBILELINES_PAGE_SIZE },
  });
  if (!res.ok) return { lines: [] as any[], totalPages: 1 };
  const payload = res.data;
  const lines: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
    ? payload.items
    : [];
  const meta = Array.isArray(payload) ? {} : payload?.meta || {};
  const totalItems = Number(meta.totalItems ?? meta.total ?? meta.count ?? 0);
  const totalPages = Number(
    meta.totalPages || (totalItems ? Math.ceil(totalItems / MOBILELINES_PAGE_SIZE) : 1)
  );
  return { lines, totalPages };
}

async function buildMobilelinesIndex(): Promise<DocIndex> {
  const index: DocIndex = new Map();
  const first = await fetchMobilelinesPage(1);
  first.lines.forEach((ml) => indexLineByDoc(index, ml));
  const totalPages = Math.min(first.totalPages, 100);

  for (let start = 2; start <= totalPages; start += MOBILELINES_PARALLEL_BATCH) {
    const batch: Promise<{ lines: any[]; totalPages: number }>[] = [];
    for (let p = start; p < start + MOBILELINES_PARALLEL_BATCH && p <= totalPages; p += 1) {
      batch.push(fetchMobilelinesPage(p));
    }
    const results = await Promise.all(batch);
    for (const r of results) r.lines.forEach((ml) => indexLineByDoc(index, ml));
  }
  return index;
}

async function getMobilelinesIndex(): Promise<DocIndex> {
  if (mobilelinesIndexCache && Date.now() - mobilelinesIndexCache.at < MOBILELINES_TTL_MS) {
    return mobilelinesIndexCache.index;
  }
  if (mobilelinesIndexPromise) return mobilelinesIndexPromise;
  mobilelinesIndexPromise = buildMobilelinesIndex()
    .then((index) => {
      mobilelinesIndexCache = { at: Date.now(), index };
      return index;
    })
    .finally(() => {
      mobilelinesIndexPromise = null;
    });
  return mobilelinesIndexPromise;
}

export function invalidateMobilelinesCache() {
  mobilelinesIndexCache = null;
}

export async function findSubscriberByDocument(
  document: string
): Promise<AlgarSubscriber | null> {
  const doc = (document || "").replace(/\D/g, "");
  if (!doc) return null;

  // Fast path: in-memory index built from /v2/mobilelines (Jotazo base).
  const index = await getMobilelinesIndex();
  const hit = index.get(doc);
  if (hit) return hit;

  return null;
}

// Fetch full subscriber from Algar by document — includes birthdate, contact_number,
// and full representative (with birthdate) which the /v2/mobilelines index does not carry.
export async function fetchSubscriberDetails(document: string): Promise<AlgarSubscriber | null> {
  const clean = (document || "").replace(/\D/g, "");
  if (!clean) return null;
  try {
    const r = await algarCall<any>(`/v2/subscribers/document/${clean}`);
    if (!r?.ok || !r.data) return null;
    const d: any = r.data;
    const s = d?.subscriber || d?.data || d;
    if (s && (s.document || s.cpf || s.cnpj || s.name || s.full_name)) return s as AlgarSubscriber;
    return null;
  } catch { return null; }
}

export type ActivateMobileLinePayload = {
  tn: string;
  card?: { type: "sim" | "esim"; iccid: string };
  service: {
    subscriber: {
      ref?: string;
      type: "individual" | "company";
      document: string;
      name?: string;
      birthdate?: string;
      email?: string;
      contact_number?: string;
    };
    address: {
      zipCode: string;
      streetName: string;
      streetNumber: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    products: string[];
    cycle?: number;
    ref?: string;
    description?: string;
  };
};

export async function activateMobileLine(payload: ActivateMobileLinePayload) {
  return algarCall<any>("/v2/mobilelines", { method: "POST", body: payload });
}

export async function lookupCep(cep: string) {
  const c = (cep || "").replace(/\D/g, "");
  if (c.length !== 8) return null;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(`https://viacep.com.br/ws/${c}/json/`, { signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) return null;
    const j = await r.json();
    if (j.erro) return null;
    return {
      zipCode: c,
      streetName: j.logradouro || "",
      neighborhood: j.bairro || "",
      city: j.localidade || "",
      state: j.uf || "",
    };
  } catch {
    return null;
  }
}
