import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Loader2, User, Building2, Search, Check, Wifi, Smartphone, Signal,
  Package, Phone, CreditCard, Hash, MapPin, StickyNote, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { maskCpfCnpj, onlyDigits } from "@/lib/docMask";
import {
  algarCall,
  findSubscriberByDocument,
  fetchSubscriberDetails,
  listAvailableTns,
  listAvailableSimcards,
  listAvailableLocales,
  listProducts,
  activateMobileLine,
  formatMsisdn as formatMsisdnAlgar,
  type AlgarSubscriber,
  type AlgarAddress,
  type AlgarTn,
  type AlgarSim,
  type AlgarProduct,
  type AlgarLocale,
} from "@/components/admin/esim/algar/algarClient";
import { eaiCall, extractList, formatMsisdn as formatMsisdnEai } from "@/components/admin/esim/eai/eaiClient";
import chipAlgarImg from "@/assets/cartao-algar.png.asset.json";
import chipEaiImg from "@/assets/cartao-eai.png.asset.json";
import fibraImg from "@/assets/internet-fibra.webp.asset.json";
import { OrderProgressDialog, type OrderStep, type StepStatus, type OrderResultSummary } from "@/components/admin/pedido/OrderProgressDialog";
import { downloadPedidoPdf, type PedidoPdfData } from "@/lib/pedidoPdf";

type DocType = "cpf" | "cnpj";
type ProductType = "fibra" | "chip-algar" | "chip-eai";

type Address = {
  zipCode: string; street: string; number: string; complement: string;
  neighborhood: string; city: string; state: string;
};

const emptyAddress: Address = {
  zipCode: "", street: "", number: "", complement: "",
  neighborhood: "", city: "", state: "",
};

const emptyForm = {
  document: "",
  name: "",
  birthDate: "",
  email: "",
  phone: "",
  respDocument: "",
  respName: "",
  respBirthDate: "",
  address: { ...emptyAddress },
};

// ---------- date / mask helpers ----------
function isoToBr(iso: string): string {
  const m = (iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}
function brMaskInput(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
function brToIso(br: string): string {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}
function phoneMask(v: string): string {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function cepMask(v: string): string {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

// ---------- lookup ----------
type LookupHit = {
  found: boolean;
  source?: "rbx" | "algar" | "eai" | "cpfcnpj" | "brasilapi";
  name?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  address?: Partial<Address>;
  subscriberRef?: string;
  docType?: "cpf" | "cnpj";
  representative?: { document?: string; name?: string; birthDate?: string };
};

function isoDate(v: any): string {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return br ? `${br[3]}-${br[2]}-${br[1]}` : "";
}

async function tryRbx(doc: string): Promise<LookupHit | null> {
  try {
    const { data, error } = await supabase.functions.invoke("rbx-lookup-cliente", { body: { document: doc } });
    if (error || !data?.found) return null;
    const looksCompanyName = /\b(LTDA|S\.?\s?A\.?|ME|EPP|EIRELI|MEI|S\/A|SOCIEDADE|ASSOCIACAO|ASSOCIAÇÃO|COOPERATIVA|COMERCIO|COMÉRCIO|INDUSTRIA|INDÚSTRIA|SERVICOS|SERVIÇOS)\b/i.test(String(data.name || ""));
    const docType: "cpf" | "cnpj" =
      data.docType ||
      (data.representative ? "cnpj" :
       looksCompanyName ? "cnpj" :
       (doc.length === 14 ? "cnpj" : "cpf"));
    return {
      found: true, source: "rbx",
      name: data.name || "",
      birthDate: isoDate(data.birthDate),
      email: data.email || "",
      phone: onlyDigits(data.phone || ""),
      address: data.address || {},
      docType,
      representative: data.representative ? {
        document: onlyDigits(String(data.representative.document || "")),
        name: data.representative.name || "",
        birthDate: isoDate(data.representative.birthDate),
      } : undefined,
    };
  } catch { return null; }
}

function pick<T = any>(o: any, ...keys: string[]): T | undefined {
  if (!o) return undefined;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
}

function normalizeAlgarAddress(a?: AlgarAddress): Partial<Address> {
  if (!a) return {};
  return {
    zipCode: onlyDigits(String(pick<string>(a, "zip_code", "zipCode", "cep") || "")),
    street: String(pick<string>(a, "street", "street_name", "streetName", "logradouro") || ""),
    number: String(pick<string | number>(a, "number", "street_number", "streetNumber", "numero") ?? ""),
    complement: String(pick<string>(a, "complement", "complemento") || ""),
    neighborhood: String(pick<string>(a, "neighborhood", "bairro") || ""),
    city: String(pick<string>(a, "city", "cidade", "localidade") || ""),
    state: String(pick<string>(a, "state", "uf", "estado") || "").toUpperCase().slice(0, 2),
  };
}

async function tryAlgar(doc: string): Promise<LookupHit | null> {
  try {
    const cached = await findSubscriberByDocument(doc);
    const detailed = await fetchSubscriberDetails(doc);
    if (!cached && !detailed) return null;
    const s: any = { ...(cached || {}), ...(detailed || {}) };
    // Merge addresses (detailed wins per-field)
    const mergedAddr: any = { ...(cached as any)?.address, ...(detailed as any)?.address };
    if (Object.keys(mergedAddr).length) s.address = mergedAddr;
    // Merge representative (detailed wins per-field)
    const repCached: any = (cached as any)?.representative || {};
    const repDetailed: any = (detailed as any)?.representative || {};
    const rep: any = { ...repCached, ...repDetailed };
    const hasRep = !!(rep.document || rep.name || rep.birthdate || rep.birth_date);

    const name = pick<string>(s, "name", "full_name", "fullName", "company_name", "legal_name") || "";
    // For company subscribers, Algar may expose "birthdate" as data de abertura; PF returns birth date.
    const birth = pick<string>(s, "birthdate", "birth_date", "birthDate", "data_nascimento", "opening_date", "openingDate", "start_date", "founded_at") || "";
    const phone = pick<string>(s, "contact_number", "contactPhone", "contact_phone", "mobile", "mobile_number", "phone", "celular") || "";
    if (!name && !birth && !phone && !s.email && !s.address) return null;
    const sDoc = onlyDigits(String(s.document || s.cnpj || s.cpf || ""));
    const sType = s.type as ("individual" | "company" | undefined);
    const docType: "cpf" | "cnpj" =
      sType === "company" ? "cnpj" : sType === "individual" ? "cpf" :
      sDoc.length === 14 ? "cnpj" : sDoc.length === 11 ? "cpf" :
      doc.length === 14 ? "cnpj" : "cpf";

    return {
      found: true, source: "algar",
      name,
      birthDate: isoDate(birth),
      email: s.email || "",
      phone: onlyDigits(String(phone)),
      address: normalizeAlgarAddress(s.address || s.endereco),
      subscriberRef: String(s.ref || s.id || ""),
      docType,
      representative: hasRep ? {
        document: onlyDigits(String(rep.document || "")),
        name: rep.name || "",
        birthDate: isoDate(rep.birthdate || rep.birth_date || ""),
      } : undefined,
    };
  } catch { return null; }
}

// Algar lookup restricted to individual (PF) subscribers — used for the responsável CPF lookup.
async function tryAlgarIndividual(cpf: string): Promise<LookupHit | null> {
  try {
    const s = await fetchSubscriberDetails(cpf);
    if (!s) return null;
    const sType = (s as any).type;
    const sDoc = onlyDigits(String((s as any).document || (s as any).cpf || ""));
    if (sType === "company" || sDoc.length === 14) return null;
    const name = pick<string>(s, "name", "full_name", "fullName") || "";
    const birth = pick<string>(s, "birthdate", "birth_date", "birthDate") || "";
    const phone = pick<string>(s, "contact_number", "contactPhone", "contact_phone", "mobile", "phone", "celular") || "";
    if (!name && !birth && !phone && !s.email) return null;
    return {
      found: true, source: "algar",
      name, birthDate: isoDate(birth),
      email: s.email || "",
      phone: onlyDigits(String(phone)),
      address: normalizeAlgarAddress((s as any).address),
      docType: "cpf",
    };
  } catch { return null; }
}

async function tryEai(doc: string): Promise<LookupHit | null> {
  try {
    // 1) check_already_exists (Zion EAÍ official endpoint)
    const exists = await eaiCall<any>("/rest/service_eai/customers/check_already_exists", {
      method: "POST",
      body: { cpfCnpj: doc },
    });
    if (!exists?.ok) return null;
    const ej: any = exists.json || {};
    const found = ej.exists ?? ej.data?.exists ?? ej.alreadyExists ?? ej.data?.alreadyExists;
    if (!found) return null;

    // 2) Fetch full record
    const list = await eaiCall<any>("/rest/service_eai/customers", {
      query: {
        filter: JSON.stringify([{ field: "cpfCnpj", operator: "eq", value: doc }]),
        "pagination.page": 1,
        "pagination.limit": 1,
      },
    });
    const items = extractList(list);
    const s: any = items[0];
    if (!s) {
      // We still know the customer exists — return a stub with no id (will create new).
      return { found: true, source: "eai", name: "", birthDate: "", email: "", phone: "", address: { ...emptyAddress } };
    }

    const contacts: any[] = Array.isArray(s.contacts) ? s.contacts : [];
    const phoneContact = contacts.find((c) => c?.kind === "cellphone" || c?.kind === "phone");
    const emailContact = contacts.find((c) => c?.kind === "email");
    const addrs: any[] = Array.isArray(s.addresses) ? s.addresses : [];
    const mainAddr = addrs.find((a) => a?.isMain) || addrs[0] || {};

    return {
      found: true,
      source: "eai",
      name: s.name || s.legalName || "",
      birthDate: isoDate(s.birthdate || s.birthDate || ""),
      email: emailContact?.value || s.email || "",
      phone: onlyDigits(String(phoneContact?.value || s.phone || "")),
      address: normalizeAlgarAddress(mainAddr),
      subscriberRef: String(s.id ?? s.customerId ?? s.uuid ?? ""),
    };
  } catch { return null; }
}

async function tryCpf(doc: string): Promise<LookupHit | null> {
  try {
    const { data } = await supabase.functions.invoke("search-cpf", { body: { cpf: doc } });
    if (!data?.found) return null;
    return { found: true, source: "cpfcnpj", name: data.name || "", birthDate: isoDate(data.birth_date || data.birthDate) };
  } catch { return null; }
}
async function tryCnpj(doc: string): Promise<LookupHit | null> {
  try {
    const { data } = await supabase.functions.invoke("search-cnpj", { body: { cnpj: doc } });
    if (!data?.found) return null;
    const a = data.address || {};
    const rep = data.representative;
    return {
      found: true, source: "brasilapi",
      name: data.name || "", birthDate: isoDate(data.birth_date),
      email: data.email || "", phone: onlyDigits(data.phone || ""),
      docType: "cnpj",
      representative: rep && (rep.document || rep.name) ? {
        document: onlyDigits(String(rep.document || "")),
        name: rep.name || "",
      } : undefined,
      address: {
        zipCode: onlyDigits(String(a.zipCode || "")),
        street: a.street || "",
        number: a.number != null ? String(a.number) : "",
        neighborhood: a.neighborhood || "",
        city: a.city || "",
        state: a.state || "",
      },
    };
  } catch { return null; }
}
// ---------- EAI helpers ----------
function toE164BR(msisdn: string, ddd?: string): string {
  const d = (msisdn || "").replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("55")) return d;
  if (d.length === 11) return "55" + d;
  if (d.length === 10) return "55" + d.slice(0, 2) + "9" + d.slice(2);
  const dd = (ddd || "").replace(/\D/g, "");
  if (d.length === 9 && dd) return "55" + dd + d;
  if (d.length === 8 && dd) return "55" + dd + "9" + d;
  return d;
}
function eaiErrMsg(r: any): string {
  const j: any = r?.json || {};
  return (
    j?.error?.message ||
    j?.message ||
    j?.error_description ||
    (Array.isArray(j?.details) ? j.details.map((d: any) => d?.message || JSON.stringify(d)).join("; ") : "") ||
    (r?.snippet ? String(r.snippet).slice(0, 200) : "")
  );
}

async function lookupViaCep(cep: string): Promise<Partial<Address> | null> {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    const j = await r.json();
    if (j?.erro) return null;
    return { street: j.logradouro || "", neighborhood: j.bairro || "", city: j.localidade || "", state: j.uf || "" };
  } catch { return null; }
}

// ---------- steps ----------
const STEPS = [
  { key: "cliente", label: "Cliente" },
  { key: "produto", label: "Produto" },
  { key: "revisao", label: "Revisão" },
] as const;
type StepKey = typeof STEPS[number]["key"];

const PRODUCTS: Array<{ id: ProductType; title: string; subtitle: string; icon: any; accent: string; image?: string }> = [
  { id: "fibra", title: "Internet Fibra", subtitle: "Plano residencial / empresarial via fibra óptica.", icon: Wifi, accent: "from-primary/15 to-primary/0", image: fibraImg.url },
  { id: "chip-algar", title: "Chip 5G Algar", subtitle: "Linha móvel pré/pós com cobertura Algar.", icon: Smartphone, accent: "from-orange-500/15 to-orange-500/0", image: chipAlgarImg.url },
  { id: "chip-eai", title: "Chip 5G EAI", subtitle: "Linha móvel MVNO EAI Telecom.", icon: Signal, accent: "from-emerald-500/15 to-emerald-500/0", image: chipEaiImg.url },
];

export default function AdminNovoCliente() {
  const [step, setStep] = useState<StepKey>("cliente");
  const [docType, setDocType] = useState<DocType>("cpf");
  const [form, setForm] = useState({ ...emptyForm });
  const [looking, setLooking] = useState(false);
  const [lookingResp, setLookingResp] = useState(false);
  const [source, setSource] = useState<LookupHit["source"] | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [product, setProduct] = useState<ProductType | null>(null);
  const nav = useNavigate();

  // ---------- Algar activation state ----------
  const [algarLine, setAlgarLine] = useState({
    tn: "", iccid: "", simType: "sim" as "sim" | "esim",
    productSku: "", cycle: 12, locale: "", notes: "",
  });
  const [products, setProducts] = useState<AlgarProduct[]>([]);
  const [locales, setLocales] = useState<AlgarLocale[]>([]);
  const [tns, setTns] = useState<AlgarTn[]>([]);
  const [sims, setSims] = useState<AlgarSim[]>([]);
  const [tnFilter, setTnFilter] = useState("");
  const [simFilter, setSimFilter] = useState("");
  const [loadingAlgarRes, setLoadingAlgarRes] = useState(false);
  const [loadingLocales, setLoadingLocales] = useState(false);
  const [loadingTns, setLoadingTns] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activationResult, setActivationResult] = useState<any>(null);
  const [existingSubscriberRef, setExistingSubscriberRef] = useState<string>("");
  const [existingEaiCustomerId, setExistingEaiCustomerId] = useState<string>("");

  // ---------- EAI activation state ----------
  const [eaiLine, setEaiLine] = useState({ ddd: "", msisdn: "", iccid: "", planId: "", notes: "" });
  const [ddds, setDdds] = useState<string[]>([]);
  const [eaiPlans, setEaiPlans] = useState<any[]>([]);
  const [loadingEaiRes, setLoadingEaiRes] = useState(false);
  const [reservingMsisdn, setReservingMsisdn] = useState(false);

  // ---------- Order flow (RBX cascade + dialog) ----------
  const ORDER_STEP_DEFS: Array<{ id: string; label: string }> = [
    { id: "rbx_lookup", label: "Verificar cliente na RBX" },
    { id: "rbx_create", label: "Criar cliente na RBX" },
    { id: "mvno_activate", label: "Ativar linha MVNO" },
    { id: "rbx_contrato", label: "Vincular contrato + plano na RBX" },
    { id: "rbx_os", label: "Abrir OS de ativação" },
    { id: "finalize", label: "Finalizar pedido" },
  ];
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSteps, setOrderSteps] = useState<OrderStep[]>(
    ORDER_STEP_DEFS.map((s) => ({ ...s, status: "pending" as StepStatus }))
  );
  const [orderFinished, setOrderFinished] = useState(false);
  const [orderHasFailure, setOrderHasFailure] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderResultSummary | null>(null);
  const [pedidoPdfData, setPedidoPdfData] = useState<PedidoPdfData | null>(null);

  function patchStep(id: string, status: StepStatus, detail?: string) {
    setOrderSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status, detail } : s)));
  }
  function resetOrderFlow() {
    setOrderSteps(ORDER_STEP_DEFS.map((s) => ({ ...s, status: "pending" })));
    setOrderFinished(false);
    setOrderHasFailure(false);
    setOrderSummary(null);
    setPedidoPdfData(null);
  }



  // Load Algar products when chip-algar selected on step 2
  useEffect(() => {
    if (step !== "produto" || product !== "chip-algar") return;
    if (products.length) return;
    setLoadingAlgarRes(true);
    listProducts(true)
      .then((p) => setProducts(p))
      .catch(() => toast.error("Falha ao carregar planos Algar"))
      .finally(() => setLoadingAlgarRes(false));
  }, [step, product, products.length]);

  // Load Algar SIM cards when a product is chosen
  useEffect(() => {
    if (product !== "chip-algar" || !algarLine.productSku) { setSims([]); return; }
    setSims([]);
    setAlgarLine((l) => ({ ...l, iccid: "" }));
    listAvailableSimcards(algarLine.productSku)
      .then((s) => setSims(s))
      .catch(() => toast.error("Falha ao carregar SIM cards"));
  }, [algarLine.productSku, product]);

  // Load Algar locales when product chosen
  useEffect(() => {
    if (product !== "chip-algar" || !algarLine.productSku) { setLocales([]); return; }
    setLoadingLocales(true);
    setLocales([]);
    setAlgarLine((l) => ({ ...l, locale: "", tn: "" }));
    listAvailableLocales(algarLine.productSku)
      .then((ls) => setLocales(ls))
      .catch(() => toast.error("Falha ao carregar localidades"))
      .finally(() => setLoadingLocales(false));
  }, [algarLine.productSku, product]);

  // Load TNs when locale chosen
  useEffect(() => {
    if (product !== "chip-algar" || !algarLine.productSku || !algarLine.locale) { setTns([]); return; }
    setLoadingTns(true);
    setTns([]);
    setAlgarLine((l) => ({ ...l, tn: "" }));
    listAvailableTns(algarLine.productSku, algarLine.locale)
      .then((t) => setTns(t))
      .catch(() => toast.error("Falha ao carregar números"))
      .finally(() => setLoadingTns(false));
  }, [algarLine.locale, algarLine.productSku, product]);

  const filteredTns = tns.filter((t) => t.tn?.includes(tnFilter.replace(/\D/g, "")));
  const filteredSims = sims.filter((s) => (s.iccid || "").includes(simFilter.replace(/\D/g, "")));

  const algarEmailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((form.email || "").trim());
  const algarLineReady =
    !!algarLine.productSku &&
    algarLine.cycle >= 1 && algarLine.cycle <= 28 &&
    !!algarLine.locale && !!algarLine.tn &&
    (algarLine.simType === "esim" || !!algarLine.iccid) &&
    (algarLine.simType === "esim" ? algarEmailOk : true);

  // Load EAI resources when chip-eai selected on step 2
  useEffect(() => {
    if (step !== "produto" || product !== "chip-eai") return;
    if (ddds.length || eaiPlans.length) return;
    setLoadingEaiRes(true);
    Promise.all([
      eaiCall<any>("/rest/service_eai/mvno_carts/available_ddds"),
      eaiCall<any>("/rest/service_eai/mvno_plans/possible_activation_plans", {
        method: "POST",
        body: { listOnlyActive: true, listOnlyVisibleInCustomer: false },
      }),
    ]).then(([dRes, pRes]) => {
      const dList = Array.isArray(dRes.json) ? dRes.json
        : Array.isArray(dRes.json?.data) ? dRes.json.data
        : Array.isArray(dRes.json?.ddds) ? dRes.json.ddds
        : extractList(dRes);
      setDdds(dList.map((d: any) => String(d.ddd ?? d)));
      setEaiPlans(extractList(pRes));
    }).catch(() => toast.error("Falha ao carregar recursos EAI"))
      .finally(() => setLoadingEaiRes(false));
  }, [step, product, ddds.length, eaiPlans.length]);

  async function reserveEaiMsisdn() {
    if (!eaiLine.ddd) return toast.error("Selecione um DDD");
    setReservingMsisdn(true);
    const r = await eaiCall<any>("/rest/service_eai/reserve_msisdns", {
      method: "POST",
      body: { ddd: eaiLine.ddd, quantity: 1 },
    });
    setReservingMsisdn(false);
    if (!r.ok) return toast.error(`Erro ao reservar (${r.status}) — ${eaiErrMsg(r)}`);
    const j: any = r.json || {};
    const list: any[] = Array.isArray(j) ? j
      : j.msisdns || j.reservations || j.data?.msisdns || j.data?.reservations || j.data || [];
    const first = list[0];
    const num = typeof first === "string" ? first : (first?.msisdn ?? first?.number ?? "");
    if (num) { setEaiLine((l) => ({ ...l, msisdn: String(num) })); toast.success("MSISDN reservado"); }
    else toast.error("Sem MSISDN retornado");
  }

  const eaiLineReady = !!eaiLine.ddd && !!eaiLine.msisdn && !!eaiLine.iccid && !!eaiLine.planId;

  async function activateEai(): Promise<any> {
    if (!eaiLineReady || saving) return null;
    setSaving(true);
    try {
      const docDigits = onlyDigits(form.document);
      const phoneDigits = onlyDigits(form.phone);
      const a = form.address;
      let customerId = existingEaiCustomerId;

      // 1) Create customer if needed
      if (!customerId) {
        toast.message("Criando cliente na EAI...");
        const isCpf = docType === "cpf";
        const custBody: any = {
          name: form.name,
          cpfCnpj: docDigits,
          email: form.email.trim() || undefined,
          phone: phoneDigits || undefined,
          type: isCpf ? "Individual" : "Entity",
          typeTelecom: isCpf ? "ptlResidencial" : "ptlEmpresarial",
          status: "Active",
          addresses: [{
            zipCode: onlyDigits(a.zipCode) || undefined,
            streetName: a.street || undefined,
            streetNumber: a.number ? String(a.number) : undefined,
            complement: a.complement || undefined,
            neighborhood: a.neighborhood || undefined,
            city: a.city || undefined,
            state: a.state || undefined,
            country: "BR",
            isMain: true,
          }],
          contacts: [
            ...(form.email.trim() ? [{ kind: "email", value: form.email.trim() }] : []),
            ...(phoneDigits ? [{ kind: "cellphone", value: phoneDigits }] : []),
          ],
        };
        if (isCpf && form.birthDate) custBody.birthdate = `${form.birthDate}T00:00:00Z`;

        const c = await eaiCall<any>("/rest/service_eai/customers", { method: "POST", body: custBody });
        if (!c?.ok) {
          toast.error(`Falha ao criar cliente EAI (${c?.status}) — ${eaiErrMsg(c)}`);
          return;
        }
        const created: any = c.json?.data ?? c.json?.customer ?? c.json ?? {};
        customerId = String(
          created.id ?? created.data?.id ?? created.customer?.id ??
          created.customerId ?? created.personId ?? created.uuid ?? ""
        );
        if (!customerId) { toast.error("Cliente criado, mas API EAI não retornou o ID."); return; }
        setExistingEaiCustomerId(customerId);
      }

      // 2) Create activation cart — Zion schema: { msisdn, iccid, mvno_plan_id, customer_id }
      toast.message("Criando cart de ativação...");
      const cartBody: any = {
        msisdn: toE164BR(eaiLine.msisdn, eaiLine.ddd),
        iccid: onlyDigits(eaiLine.iccid),
        mvno_plan_id: eaiLine.planId,
        customer_id: customerId,
      };
      const cart = await eaiCall<any>("/rest/service_eai/mvno_carts", { method: "POST", body: cartBody });
      if (!cart?.ok) {
        toast.error(`Falha ao criar cart EAI (${cart?.status}) — ${eaiErrMsg(cart)}`);
        return;
      }
      const cartData: any = cart.json?.data ?? cart.json?.cart ?? cart.json ?? {};
      const cartId = String(cartData.id ?? cartData.cart_id ?? cartData.cartId ?? cartData.uuid ?? "");
      if (!cartId) { toast.error("Cart criado, mas API EAI não retornou o ID."); return; }

      // 3) Process cart
      toast.message("Processando ativação...");
      const proc = await eaiCall<any>(`/rest/service_eai/mvno_carts/${cartId}`, { method: "PATCH", body: {} });
      const planObj: any = eaiPlans.find((p: any) => String(p.id ?? p.uuid) === eaiLine.planId) || {};

      if (!proc?.ok) {
        toast.error(`Cart ${cartId} criado, mas falhou o process (${proc?.status}).`);
        await supabase.from("mvno_activations").insert({
          provider: "eai",
          tn: eaiLine.msisdn,
          iccid: eaiLine.iccid,
          sim_type: "sim",
          product_sku: eaiLine.planId,
          product_name: planObj.name || planObj.title || null,
          subscriber_doc: docDigits,
          subscriber_name: form.name,
          subscriber_email: form.email || null,
          subscriber_phone: form.phone || null,
          raw_response: { cart: cartData, processError: proc?.json ?? proc?.snippet, cartId },
          status: "failed",
          email_status: "skipped",
        });
        return;
      }
      const procData: any = proc.json?.data ?? proc.json ?? {};

      // 4) Persist locally
      const { data: rec, error: recErr } = await supabase
        .from("mvno_activations")
        .insert({
          provider: "eai",
          tn: eaiLine.msisdn,
          iccid: eaiLine.iccid,
          sim_type: "sim",
          product_sku: eaiLine.planId,
          product_name: planObj.name || planObj.title || null,
          subscriber_doc: docDigits,
          subscriber_name: form.name,
          subscriber_email: form.email || null,
          subscriber_phone: form.phone || null,
          raw_response: { cart: cartData, process: procData, cartId, customerId },
          status: "confirmed",
          email_status: form.email ? "not_sent" : "skipped",
          notes: eaiLine.notes || null,
        })
        .select("id")
        .single();
      if (recErr) console.error("mvno_activations insert (eai)", recErr);

      toast.success("Linha EAI ativada com sucesso!");
      const eaiResult = {
        provider: "eai" as const,
        tn: eaiLine.msisdn,
        iccid: eaiLine.iccid,
        simType: "sim" as const,
        productName: planObj.name || planObj.title || null,
        productSku: eaiLine.planId,
        recordId: rec?.id,
      };
      setActivationResult(eaiResult);
      setStep("revisao");

      // 5) Send e-mail
      if (form.email && rec?.id) {
        toast.message("Enviando e-mail de contratação...");
        const { data: mailData, error: mailErr } = await supabase.functions.invoke("send-mvno-activation-email", {
          body: {
            activationId: rec.id,
            provider: "eai",
            tn: eaiLine.msisdn,
            iccid: eaiLine.iccid,
            simType: "sim",
            productName: planObj.name || planObj.title || null,
            productSku: eaiLine.planId,
            subscriberName: form.name,
            subscriberDoc: form.document,
            subscriberEmail: form.email,
            subscriberPhone: form.phone,
            notes: eaiLine.notes,
          },
        });
        if (mailErr) toast.error(`Linha ativada, mas falhou o e-mail: ${mailErr.message}`);
        else if ((mailData as any)?.ok === false) toast.error((mailData as any).userMessage || "Linha ativada, mas falhou o e-mail");
        else toast.success(`E-mail enviado para ${form.email}`);
      }
      return eaiResult;
    } catch (err: any) {
      toast.error(err?.message || "Erro ao ativar linha EAI");
      return null;
    } finally {
      setSaving(false);
    }
  }


  async function activateAlgar(): Promise<any> {
    if (!algarLineReady || saving) return null;
    if (algarLine.simType === "esim") {
      const e = (form.email || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        toast.error("E-mail válido é obrigatório para eSIM (envio do QR Code).");
        return null;
      }
    }
    setSaving(true);
    try {
      const maskDoc = (d: string) => d.replace(/\D/g, "").replace(/^(\d{3})\d+(\d{2})$/, "$1***$2");
      const docDigits = onlyDigits(form.document);
      const a = form.address;
      const rootBirthdate = docType === "cpf"
        ? form.birthDate
        : (form.respBirthDate || form.birthDate);

      if (docType === "cpf" && !rootBirthdate) {
        toast.error("Informe a data de nascimento antes de ativar.");
        return;
      }
      if (docType === "cnpj" && !form.respBirthDate) {
        toast.error("Informe a data de nascimento do responsável antes de ativar.");
        return;
      }

      const persistFailure = async (step: string, status: number | undefined, requestBody: any, response: any) => {
        try {
          await supabase.from("mvno_activations").insert({
            provider: "algar",
            tn: algarLine.tn || "",
            iccid: algarLine.iccid || null,
            sim_type: algarLine.simType || null,
            product_sku: algarLine.productSku || null,
            product_name: products.find((p) => p.sku === algarLine.productSku)?.name || null,
            cycle: algarLine.cycle || null,
            locale: algarLine.locale || null,
            subscriber_doc: docDigits,
            subscriber_name: form.name,
            subscriber_email: form.email || null,
            subscriber_phone: form.phone || null,
            notes: `[FAILED ${step} ${status ?? "?"}] ${algarLine.notes || ""}`.slice(0, 500),
            raw_response: { step, status, requestBody, response } as any,
            status: "failed",
            email_status: "skipped",
          });
        } catch (e) { console.error("[ALGAR-UI] persist failure error", e); }
      };

      // Subscriber: create if not already in Algar
      let subscriberRef = existingSubscriberRef;
      if (!subscriberRef) {
        let phone = onlyDigits(form.phone);
        if (phone.length === 10 || phone.length === 11) phone = "55" + phone;
        const emailTrim = (form.email || "").trim();
        const subBody: any = {
          name: form.name,
          document: docDigits,
          type: docType === "cpf" ? "individual" : "company",
          birthdate: rootBirthdate,
          ...(emailTrim ? { email: emailTrim } : {}),
          ...(phone ? { contact_number: phone } : {}),
          address: {
            zipCode: onlyDigits(a.zipCode),
            streetName: a.street,
            streetNumber: String(a.number),
            complement: a.complement || undefined,
            neighborhood: a.neighborhood,
            city: a.city,
            state: a.state,
          },
        };
        if (docType === "cnpj") {
          subBody.representative = {
            document: onlyDigits(form.respDocument),
            name: form.respName,
            birthdate: form.respBirthDate,
          };
        }
        console.log("[ALGAR-UI] POST /v2/subscribers", { ...subBody, document: maskDoc(subBody.document) });
        const created = await algarCall<any>("/v2/subscribers", { method: "POST", body: subBody });
        console.log("[ALGAR-UI] /v2/subscribers response", { ok: created?.ok, status: created?.status, error: created?.error });
        if (!created?.ok) {
          await persistFailure("/v2/subscribers", created?.status, subBody, { error: created?.error, data: created?.data, raw: created?.raw });
          toast.error(`Falha em /v2/subscribers (${created?.status ?? "?"}): ${String(created?.error || JSON.stringify(created?.data) || created?.raw || "").slice(0, 160)}`);
          return;
        }
        subscriberRef = created.data?.ref || created.data?.id || `USR_${docDigits}`;
      }

      let phoneFull = onlyDigits(form.phone);
      if (phoneFull.length === 10 || phoneFull.length === 11) phoneFull = "55" + phoneFull;
      const emailTrimSvc = (form.email || "").trim();

      const serviceBody: any = {
        subscriber: {
          ref: subscriberRef || `USR_${docDigits}`,
          type: docType === "cpf" ? "individual" : "company",
          document: docDigits,
          name: form.name,
          birthdate: rootBirthdate,
          ...(emailTrimSvc ? { email: emailTrimSvc } : {}),
          ...(phoneFull ? { contact_number: phoneFull } : {}),
        },
        address: {
          zipCode: onlyDigits(a.zipCode),
          streetName: a.street,
          streetNumber: String(a.number),
          complement: a.complement || undefined,
          neighborhood: a.neighborhood,
          city: a.city,
          state: a.state,
        },
        products: [algarLine.productSku],
        cycle: algarLine.cycle,
        ref: `APP_${Date.now()}`,
        description: algarLine.notes?.trim() || "Ativação via /admin/pedido",
      };
      if (docType === "cnpj") {
        serviceBody.representative = {
          document: onlyDigits(form.respDocument),
          name: form.respName,
          birthdate: form.respBirthDate,
        };
      }
      const activatePayload = {
        tn: algarLine.tn,
        card: { type: algarLine.simType, iccid: algarLine.iccid },
        service: serviceBody,
      };
      console.log("[ALGAR-UI] POST /v2/mobilelines", { tn: activatePayload.tn });
      const act = await activateMobileLine(activatePayload as any);
      console.log("[ALGAR-UI] /v2/mobilelines response", { ok: act?.ok, status: act?.status });
      if (!act?.ok) {
        await persistFailure("/v2/mobilelines", act?.status, activatePayload, { error: act?.error, data: act?.data, raw: act?.raw });
        toast.error(`Falha em /v2/mobilelines (${act?.status ?? "?"}): ${String(act?.error || JSON.stringify(act?.data) || act?.raw || "").slice(0, 160)}`);
        return;
      }

      const ad: any = act.data?.data ?? act.data ?? {};
      const card: any = ad.card || ad.sim || ad.mobileline?.card || {};
      const lineRef = ad.ref || ad.id || ad.mobileline?.ref || ad.mobileline?.id || ad.service?.id || "";
      const activationCode =
        card.activationData || ad.activation_code || ad.activationCode || ad.lpa ||
        ad.mobileline?.activation_code || "";
      const qrPayload = ad.qr_code || ad.qrCode || card.activationData || activationCode || "";

      const { data: rec, error: recErr } = await supabase
        .from("mvno_activations")
        .insert({
          provider: "algar",
          tn: algarLine.tn,
          iccid: algarLine.iccid || null,
          sim_type: algarLine.simType,
          product_sku: algarLine.productSku,
          product_name: products.find((p) => p.sku === algarLine.productSku)?.name || null,
          cycle: algarLine.cycle,
          locale: algarLine.locale,
          subscriber_doc: docDigits,
          subscriber_name: form.name,
          subscriber_email: form.email || null,
          subscriber_phone: form.phone || null,
          notes: algarLine.notes || null,
          raw_response: ad,
          activation_code: activationCode || null,
          qr_payload: qrPayload || null,
          status: "pending",
          email_status: form.email ? "not_sent" : "skipped",
        })
        .select("id")
        .single();
      if (recErr) console.error("mvno_activations insert", recErr);

      if (lineRef) {
        try {
          const confirm = await algarCall<any>(`/v2/mobilelines/${lineRef}`);
          if (confirm?.ok && rec?.id) {
            await supabase.from("mvno_activations").update({ status: "confirmed", raw_response: confirm.data ?? ad }).eq("id", rec.id);
          }
        } catch (e) { console.warn("confirm activation failed", e); }
      }

      toast.success("Linha Algar ativada com sucesso!");
      const algarResult = {
        provider: "algar" as const,
        tn: algarLine.tn,
        iccid: algarLine.iccid,
        simType: algarLine.simType,
        productName: products.find((p) => p.sku === algarLine.productSku)?.name,
        productSku: algarLine.productSku,
        cycle: algarLine.cycle,
        locale: algarLine.locale,
        activationCode,
        qrPayload,
        recordId: rec?.id,
      };
      setActivationResult(algarResult);
      setStep("revisao");

      if (form.email && rec?.id) {
        toast.message("Enviando e-mail de contratação...");
        const { data: mailData, error: mailErr } = await supabase.functions.invoke("send-mvno-activation-email", {
          body: {
            activationId: rec.id,
            provider: "algar",
            tn: algarLine.tn,
            iccid: algarLine.iccid,
            simType: algarLine.simType,
            productName: products.find((p) => p.sku === algarLine.productSku)?.name,
            productSku: algarLine.productSku,
            cycle: algarLine.cycle,
            locale: algarLine.locale,
            subscriberName: form.name,
            subscriberDoc: form.document,
            subscriberEmail: form.email,
            subscriberPhone: form.phone,
            notes: algarLine.notes,
            activationCode,
            qrPayload,
          },
        });
        if (mailErr) toast.error(`Linha ativada, mas falhou o e-mail: ${mailErr.message}`);
        else if ((mailData as any)?.ok === false) toast.error((mailData as any).userMessage || "Linha ativada, mas falhou o e-mail");
        else toast.success(`E-mail enviado para ${form.email}`);
      }
      return algarResult;
    } catch (err: any) {
      toast.error(err?.message || "Erro ao ativar linha");
      return null;
    } finally {
      setSaving(false);
    }
  }

  // ============ Orchestrator: popup + cascata RBX ============
  async function runOrderFlow(provider: "algar" | "eai") {
    resetOrderFlow();
    setOrderOpen(true);
    const docDigits = onlyDigits(form.document);
    let rbxClienteCodigo = "";
    let rbxContratoCodigo = "";
    let rbxOsCodigo = "";
    let failureFlag = false;

    // Step 1 — RBX lookup
    patchStep("rbx_lookup", "running");
    try {
      const { data: lookup } = await supabase.functions.invoke("rbx-lookup-cliente", { body: { document: docDigits } });
      if (lookup?.found && lookup.codigo) {
        rbxClienteCodigo = String(lookup.codigo);
        patchStep("rbx_lookup", "done", `Cliente já existe (cód. ${rbxClienteCodigo})`);
        patchStep("rbx_create", "skipped", "Cadastro já existente na RBX");
      } else {
        patchStep("rbx_lookup", "done", "Cliente não encontrado — será criado");
        // Step 2 — Create
        patchStep("rbx_create", "running");
        const { data: created, error: cErr } = await supabase.functions.invoke("rbx-create-cliente", {
          body: {
            name: form.name, document: docDigits, type: docType,
            email: form.email, phone: form.phone, birthDate: form.birthDate,
            address: form.address,
          },
        });
        if (cErr || !(created as any)?.ok) {
          patchStep("rbx_create", "failed", (created as any)?.message || cErr?.message || "Falha ao criar cliente");
          failureFlag = true;
        } else {
          rbxClienteCodigo = String((created as any).codigo);
          patchStep("rbx_create", "done", `Cliente criado (cód. ${rbxClienteCodigo})`);
        }
      }
    } catch (e: any) {
      patchStep("rbx_lookup", "failed", e?.message || "Erro de rede");
      failureFlag = true;
    }

    // Step 3 — MVNO activation
    patchStep("mvno_activate", "running");
    const result = provider === "algar" ? await activateAlgar() : await activateEai();
    if (!result) {
      patchStep("mvno_activate", "failed", "Falha na ativação — veja toast");
      setOrderHasFailure(true);
      setOrderFinished(true);
      return;
    }
    patchStep("mvno_activate", "done", `Linha ${result.tn} ativada`);

    const productSku = (result as any).productSku || (provider === "algar" ? algarLine.productSku : eaiLine.planId);
    const productName = result.productName || null;

    // Step 4 — Contract (needs SKU→plan map + cliente codigo)
    if (rbxClienteCodigo) {
      patchStep("rbx_contrato", "running");
      try {
        const lookupCol = provider === "eai" ? "eai_plan_id" : "product_sku";
        const { data: mapRow } = await supabase
          .from("mvno_rbx_plan_map")
          .select("rbx_plan_codigo, rbx_plan_label, active")
          .eq("provider", provider)
          .eq(lookupCol, productSku)
          .maybeSingle();
        if (!mapRow?.rbx_plan_codigo || mapRow.active === false) {
          patchStep("rbx_contrato", "failed", "SKU sem plano RBX mapeado");
          failureFlag = true;
        } else {
          const { data: contractRes, error: kErr } = await supabase.functions.invoke("rbx-create-contrato", {
            body: {
              clienteCodigo: rbxClienteCodigo,
              planoCodigo: mapRow.rbx_plan_codigo,
              observacao: `MVNO ${provider.toUpperCase()} · linha ${result.tn} · ICCID ${result.iccid || "-"}`,
            },
          });
          if (kErr || !(contractRes as any)?.ok) {
            patchStep("rbx_contrato", "failed", (contractRes as any)?.message || kErr?.message || "Falha ao criar contrato");
            failureFlag = true;
          } else {
            rbxContratoCodigo = String((contractRes as any).codigo);
            patchStep("rbx_contrato", "done", `Contrato ${rbxContratoCodigo} (${mapRow.rbx_plan_label || mapRow.rbx_plan_codigo})`);
          }
        }
      } catch (e: any) {
        patchStep("rbx_contrato", "failed", e?.message);
        failureFlag = true;
      }

      // Step 5 — OS
      patchStep("rbx_os", "running");
      try {
        const descricaoBase = `Ativação MVNO ${provider.toUpperCase()}\nLinha: ${result.tn}\nICCID: ${result.iccid || "-"}\nPlano: ${productName || productSku}`;
        const descricao = failureFlag ? `${descricaoBase}\n\n[ATENÇÃO] Houve falha em alguma etapa anterior — revisar.` : descricaoBase;
        const { data: osRes, error: oErr } = await supabase.functions.invoke("rbx-create-os", {
          body: { clienteCodigo: rbxClienteCodigo, contratoCodigo: rbxContratoCodigo, assunto: `Ativação MVNO ${provider.toUpperCase()}`, descricao },
        });
        if (oErr || !(osRes as any)?.ok) {
          patchStep("rbx_os", "failed", (osRes as any)?.message || oErr?.message || "Falha ao abrir OS");
          failureFlag = true;
        } else {
          rbxOsCodigo = String((osRes as any).codigo);
          patchStep("rbx_os", "done", `OS ${rbxOsCodigo} aberta`);
        }
      } catch (e: any) {
        patchStep("rbx_os", "failed", e?.message);
        failureFlag = true;
      }
    } else {
      patchStep("rbx_contrato", "skipped", "Sem cliente RBX");
      patchStep("rbx_os", "skipped", "Sem cliente RBX");
    }

    // Step 6 — Finalize: persist RBX codes to mvno_activations
    patchStep("finalize", "running");
    if (result.recordId) {
      try {
        await supabase.from("mvno_activations").update({
          rbx_cliente_codigo: rbxClienteCodigo || null,
          rbx_contrato_codigo: rbxContratoCodigo || null,
          rbx_os_codigo: rbxOsCodigo || null,
          rbx_status: failureFlag ? "partial" : (rbxClienteCodigo ? "ok" : "failed"),
        }).eq("id", result.recordId);
      } catch (e) { console.warn("update rbx fields failed", e); }
    }

    const addrStr = [form.address.street, form.address.number, form.address.neighborhood, form.address.city, form.address.state, form.address.zipCode].filter(Boolean).join(", ");
    const pdfData: PedidoPdfData = {
      numero: result.recordId ? String(result.recordId).slice(0, 8).toUpperCase() : Date.now().toString().slice(-8),
      date: new Date(),
      customer: { name: form.name, document: maskCpfCnpj(form.document), email: form.email, phone: form.phone, address: addrStr },
      plan: { name: productName, sku: productSku, cycle: provider === "algar" ? algarLine.cycle : null },
      line: { provider, tn: result.tn, iccid: result.iccid, simType: result.simType, activationCode: (result as any).activationCode || null },
      rbx: { clienteCodigo: rbxClienteCodigo, contratoCodigo: rbxContratoCodigo, osCodigo: rbxOsCodigo },
    };
    setPedidoPdfData(pdfData);
    setOrderSummary({
      customerName: form.name,
      document: maskCpfCnpj(form.document),
      productName,
      tn: result.tn ? formatMsisdnAlgar(result.tn) : undefined,
      iccid: result.iccid,
      simType: result.simType,
      rbxClienteCodigo,
      rbxContratoCodigo,
      rbxOsCodigo,
      activationCode: (result as any).activationCode || null,
    });

    patchStep("finalize", "done", "Pedido registrado");
    setOrderHasFailure(failureFlag);
    setOrderFinished(true);
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;



  const setField = <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setAddr = (patch: Partial<Address>) =>
    setForm((f) => ({ ...f, address: { ...f.address, ...patch } }));

  function resetForType(newType: DocType) {
    setDocType(newType);
    setForm({ ...emptyForm });
    setSource(null);
    setExistingSubscriberRef("");
    setExistingEaiCustomerId("");
    setEaiLine({ ddd: "", msisdn: "", iccid: "", planId: "", notes: "" });
  }

  async function runLookup(doc: string) {
    const d = onlyDigits(doc);
    const expected = docType === "cpf" ? 11 : 14;
    if (d.length !== expected) return;
    setLooking(true); setSource(null);
    try {
      const algarFlow = product === "chip-algar";
      let hit: LookupHit | null = null;
      if (algarFlow && docType === "cnpj") {
        // Algar CNPJ: Algar → RBX → BrasilAPI (sem EAI)
        hit = await tryAlgar(d);
        if (!hit) hit = await tryRbx(d);
        if (!hit) hit = await tryCnpj(d);
      } else if (algarFlow) {
        hit = await tryAlgar(d);
        if (!hit) hit = await tryRbx(d);
        if (!hit) hit = await tryEai(d);
        if (!hit) hit = await tryCpf(d);
      } else {
        hit = await tryRbx(d);
        if (!hit) hit = await tryAlgar(d);
        if (!hit) hit = await tryEai(d);
        if (!hit) hit = docType === "cpf" ? await tryCpf(d) : await tryCnpj(d);
      }
      if (!hit) { toast.info("Documento não encontrado nas bases. Preencha manualmente."); return; }
      setSource(hit.source || null);
      setExistingSubscriberRef(hit.source === "algar" ? (hit.subscriberRef || "") : "");
      setExistingEaiCustomerId(hit.source === "eai" ? (hit.subscriberRef || "") : "");
      setForm((f) => ({
        ...f,
        name: hit!.name || f.name,
        birthDate: hit!.birthDate || f.birthDate,
        email: hit!.email || f.email,
        phone: hit!.phone || f.phone,
        address: { ...f.address, ...(hit!.address || {}) } as Address,
        ...(docType === "cnpj" && hit!.representative ? {
          respDocument: hit!.representative.document || f.respDocument,
          respName: hit!.representative.name || f.respName,
          respBirthDate: hit!.representative.birthDate || f.respBirthDate,
        } : {}),
      }));
      const labels: Record<string, string> = { rbx: "RBX", algar: "Algar", eai: "EAI", cpfcnpj: "API pública", brasilapi: "BrasilAPI" };
      const repNote = docType === "cnpj" && hit.representative?.name ? " (responsável incluído)" : "";
      toast.success(`Cliente encontrado em ${labels[hit.source || ""] || "base pública"} — dados preenchidos${repNote}.`);
    } finally { setLooking(false); }
  }

  async function runRespLookup(doc: string) {
    const d = onlyDigits(doc);
    if (d.length !== 11) return;
    setLookingResp(true);
    try {
      const isCompanyHit = (h: LookupHit | null) => !!h && (h.docType === "cnpj" || !!h.representative);
      // 1) Algar API (PF only) — sempre primeiro no fluxo Algar
      let hit: LookupHit | null = await tryAlgarIndividual(d);
      if (!hit) { const r = await tryRbx(d);   hit = isCompanyHit(r) ? null : r; }
      if (!hit) { const a = await tryAlgar(d); hit = isCompanyHit(a) ? null : a; }
      if (!hit) { const e = await tryEai(d);   hit = isCompanyHit(e) ? null : e; }
      if (!hit) hit = await tryCpf(d);
      if (!hit) { toast.info("CPF do responsável não encontrado."); return; }
      setForm((f) => ({ ...f, respName: hit!.name || f.respName, respBirthDate: hit!.birthDate || f.respBirthDate }));
      toast.success("Responsável encontrado.");
    } finally { setLookingResp(false); }
  }

  async function onCepBlur() {
    const d = onlyDigits(form.address.zipCode);
    if (d.length !== 8) return;
    setCepLoading(true);
    const res = await lookupViaCep(d);
    setCepLoading(false);
    if (res) setAddr(res);
  }

  function canAdvanceCliente() {
    return !!form.document && !!form.name && !!form.address.zipCode;
  }

  const docLabel = docType === "cpf" ? "CPF" : "CNPJ";
  const nameLabel = docType === "cpf" ? "Nome completo" : "Razão social";
  const dateOptional = docType === "cnpj" && product === "chip-algar";
  const dateLabel: React.ReactNode = docType === "cpf"
    ? "Data de nascimento"
    : (<>Data de abertura {dateOptional && <span className="text-muted-foreground font-normal text-xs">(opcional)</span>}</>);

  return (
    <div className="space-y-6">
      <Helmet><title>Novo Pedido | Admin</title></Helmet>

      <OrderProgressDialog
        open={orderOpen}
        steps={orderSteps}
        finished={orderFinished}
        hasFailure={orderHasFailure}
        summary={orderSummary}
        onClose={() => setOrderOpen(false)}
        onDownloadPdf={() => { if (pedidoPdfData) downloadPedidoPdf(pedidoPdfData); }}
        onNewOrder={() => { setOrderOpen(false); resetOrderFlow(); setStep("cliente"); }}
      />

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Pedido</h1>
          <p className="text-sm text-muted-foreground">Etapa {stepIndex + 1} de {STEPS.length} — {STEPS[stepIndex].label}.</p>
        </div>
      </div>

      {/* Progresso */}
      <Card className="p-5 space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => { if (i <= stepIndex) setStep(s.key); }}
                className={cn(
                  "flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  current && "bg-primary/10 text-primary font-medium",
                  done && "text-foreground hover:bg-muted",
                  !current && !done && "text-muted-foreground",
                )}
              >
                <span className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs border",
                  done && "bg-primary text-primary-foreground border-primary",
                  current && "border-primary text-primary",
                  !done && !current && "border-muted-foreground/30",
                )}>
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Etapa 1 — Cliente */}
      <Card className={cn("p-6 space-y-6", step !== "cliente" && "opacity-60")}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">1. Dados do cliente</h2>
            <p className="text-xs text-muted-foreground">Identificação e endereço.</p>
          </div>
          {step !== "cliente" && (
            <Button variant="ghost" size="sm" onClick={() => setStep("cliente")}>Editar</Button>
          )}
        </div>

        {step === "cliente" && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Tipo de cliente</Label>
              <Tabs value={docType} onValueChange={(v) => resetForType(v as DocType)}>
                <TabsList className="grid grid-cols-2 w-full max-w-sm">
                  <TabsTrigger value="cpf" className="gap-2"><User className="h-4 w-4" /> Pessoa Física</TabsTrigger>
                  <TabsTrigger value="cnpj" className="gap-2"><Building2 className="h-4 w-4" /> Pessoa Jurídica</TabsTrigger>
                </TabsList>

                <TabsContent value="cpf" className="mt-6 space-y-6">
                  <ClientFields docType="cpf" docLabel={docLabel} nameLabel={nameLabel} dateLabel={dateLabel}
                    form={form} setField={setField} onDocComplete={runLookup} looking={looking} source={source} />
                  <AddressFields form={form} setAddr={setAddr} onCepBlur={onCepBlur} cepLoading={cepLoading} />
                </TabsContent>

                <TabsContent value="cnpj" className="mt-6 space-y-6">
                  <ClientFields docType="cnpj" docLabel={docLabel} nameLabel={nameLabel} dateLabel={dateLabel}
                    form={form} setField={setField} onDocComplete={runLookup} looking={looking} source={source} />

                  <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold">Responsável (CPF)</Label>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>CPF do responsável</Label>
                        <div className="relative">
                          <Input
                            value={maskCpfCnpj(form.respDocument)}
                            onChange={(e) => {
                              const v = onlyDigits(e.target.value).slice(0, 11);
                              setField("respDocument", v);
                              if (v.length === 11) runRespLookup(v);
                            }}
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                          />
                          {lookingResp && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Nome do responsável</Label>
                        <Input value={form.respName} onChange={(e) => setField("respName", e.target.value)} placeholder="Nome completo" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Data de nascimento</Label>
                        <Input
                          value={isoToBr(form.respBirthDate)}
                          onChange={(e) => setField("respBirthDate", brToIso(brMaskInput(e.target.value)))}
                          placeholder="DD/MM/AAAA"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </div>

                  <AddressFields form={form} setAddr={setAddr} onCepBlur={onCepBlur} cepLoading={cepLoading} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => resetForType(docType)}>Limpar</Button>
              <Button disabled={!canAdvanceCliente()} onClick={() => setStep("produto")}>Continuar</Button>
            </div>
          </>
        )}

        {step !== "cliente" && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{form.name || "—"}</span> · {maskCpfCnpj(form.document) || "—"}
          </div>
        )}
      </Card>

      {/* Etapa 2 — Produto */}
      {stepIndex >= 1 && (
        <Card className={cn("p-6 space-y-6", step !== "produto" && "opacity-60")}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">2. Tipo de produto</h2>
              <p className="text-xs text-muted-foreground">Escolha o produto que será contratado.</p>
            </div>
            {step !== "produto" && (
              <Button variant="ghost" size="sm" onClick={() => setStep("produto")}>Editar</Button>
            )}
          </div>

          {step === "produto" && (
            <>
              <div className="grid md:grid-cols-3 gap-3">
                {PRODUCTS.map((p) => {
                  const Icon = p.icon;
                  const active = product === p.id;
                  const comingSoon = p.id === "fibra";
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { if (!comingSoon) setProduct(p.id); }}
                      disabled={comingSoon}
                      aria-disabled={comingSoon}
                      className={cn(
                        "group relative text-left rounded-2xl border p-5 transition-all overflow-hidden",
                        comingSoon
                          ? "cursor-not-allowed opacity-60 border-border"
                          : "hover:border-primary/40 hover:shadow-md",
                        active ? "border-primary ring-2 ring-primary/20" : "border-border",
                      )}
                    >
                      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", p.accent)} />
                      {comingSoon && (
                        <span className="absolute top-3 right-3 z-10 rounded-full bg-orange-500 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 shadow-md">
                          Em Breve
                        </span>
                      )}
                      <div className="relative space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="h-10 w-10 rounded-xl bg-background border flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          {active && !comingSoon && (
                            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        {p.image && (
                          <div className="rounded-xl overflow-hidden border bg-black/5">
                            <img
                              src={p.image}
                              alt={p.title}
                              loading="lazy"
                              className={cn("w-full aspect-[1.6/1] object-cover", comingSoon && "grayscale")}
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{p.title}</div>
                          <p className="text-xs text-muted-foreground mt-1">{p.subtitle}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ===== Sub-fluxo Algar — Plano / Numeração / Chip ===== */}
              {product === "chip-algar" && (
                <div className="space-y-5">
                  {/* Plano */}
                  <Card className="p-5 rounded-2xl border-primary/30 bg-primary/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" /> Plano
                      </h3>
                      {loadingAlgarRes && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[180px_1fr] items-start">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Ciclo de faturamento *</Label>
                        <Input
                          type="number"
                          min={1}
                          max={28}
                          value={algarLine.cycle}
                          onChange={(e) => {
                            const n = Math.max(1, Math.min(28, Number(e.target.value) || 1));
                            setAlgarLine((l) => ({ ...l, cycle: n }));
                          }}
                        />
                        <p className="text-[11px] text-muted-foreground">Dia do mês (1 a 28). Padrão: 12.</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Plano *</Label>
                        <Select
                          value={algarLine.productSku}
                          onValueChange={(v) => setAlgarLine((l) => ({ ...l, productSku: v }))}
                          disabled={loadingAlgarRes || products.length === 0}
                        >
                          <SelectTrigger className="h-14">
                            <SelectValue placeholder={loadingAlgarRes ? "Carregando planos..." : "Selecione um plano"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-96">
                            {products
                              .filter((p) => !/cota\s*adicional/i.test(p.name || "") && !/cota\s*adicional/i.test(p.description || ""))
                              .map((p) => {
                                const selected = algarLine.productSku === p.sku;
                                return (
                                  <SelectItem key={p.sku} value={p.sku} className="py-3 pr-3 pl-9">
                                    <div className="flex items-center gap-3 w-full">
                                      <span className={cn(
                                        "flex h-4 w-4 items-center justify-center rounded-full border-2 shrink-0",
                                        selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                                      )}>
                                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{p.name}</div>
                                        {p.description && (
                                          <div className="text-[11px] text-muted-foreground truncate">{p.description}</div>
                                        )}
                                      </div>
                                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{p.sku}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        {algarLine.productSku && (
                          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Plano selecionado: <span className="font-mono">{algarLine.productSku}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Numeração */}
                  {algarLine.productSku && (
                    <Card className="p-5 rounded-2xl border-primary/30 bg-primary/[0.02]">
                      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                        <Phone className="w-4 h-4 text-primary" /> Numeração
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Localidade (DDD) *</Label>
                          <Select
                            value={algarLine.locale}
                            onValueChange={(v) => setAlgarLine((l) => ({ ...l, locale: v, tn: "" }))}
                            disabled={loadingLocales || locales.length === 0}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder={loadingLocales ? "Carregando localidades..." : (locales.length === 0 ? "Nenhuma localidade disponível" : "Selecione a localidade")} />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {locales.map((loc) => (
                                <SelectItem key={loc.locale} value={loc.locale}>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] font-mono">{loc.name}</Badge>
                                    <span className="font-medium">{loc.state}</span>
                                    {loc.description && (
                                      <span className="text-xs text-muted-foreground truncate max-w-[420px]">— {loc.description}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {algarLine.locale && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <Label className="text-sm font-medium">Número disponível *</Label>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px]">
                                  {loadingTns ? "..." : `${filteredTns.length} ${filteredTns.length === 1 ? "número" : "números"}`}
                                </Badge>
                                <div className="relative">
                                  <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                  <Input
                                    placeholder="Filtrar dígitos..."
                                    value={tnFilter}
                                    onChange={(e) => setTnFilter(e.target.value)}
                                    className="h-9 pl-7 w-44"
                                  />
                                </div>
                              </div>
                            </div>

                            {loadingTns ? (
                              <div className="rounded-xl border-2 border-dashed py-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Buscando números disponíveis...
                              </div>
                            ) : filteredTns.length === 0 ? (
                              <div className="rounded-xl border-2 border-dashed py-10 text-center text-xs text-muted-foreground">
                                Nenhum número disponível nesta localidade
                              </div>
                            ) : (
                              <div className="max-h-80 overflow-auto pr-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {filteredTns.map((t) => {
                                    const sel = algarLine.tn === t.tn;
                                    return (
                                      <button
                                        key={t.tn}
                                        type="button"
                                        onClick={() => setAlgarLine((l) => ({ ...l, tn: t.tn }))}
                                        className={cn(
                                          "group relative rounded-xl border-2 px-3 py-3 text-left transition-all hover:-translate-y-0.5",
                                          sel
                                            ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                                            : "border-input hover:border-primary/50 bg-card"
                                        )}
                                      >
                                        {sel && (
                                          <CheckCircle2 className="absolute top-1.5 right-1.5 w-4 h-4 text-emerald-600 fill-emerald-100" />
                                        )}
                                        <div className="font-mono text-sm font-bold tracking-tight">{formatMsisdnAlgar(t.tn)}</div>
                                        <div className="mt-1 flex gap-1 flex-wrap">
                                          {t.portability && <Badge variant="outline" className="text-[9px] py-0">Portabilidade</Badge>}
                                          {t.status && <Badge variant="secondary" className="text-[9px] py-0">{String(t.status).toLowerCase() === "available" ? "Disponível" : t.status}</Badge>}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Chip */}
                  {algarLine.tn && (
                    <Card className="p-5 rounded-2xl border-primary/30 bg-primary/[0.02]">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" /> Chip (SIM / eSIM)
                        </h3>
                        <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
                          <Wifi className="w-3 h-3" /> Perfil: <span className="font-semibold">Jotazo Brasil</span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        {([
                          { value: "sim", title: "SIM Card", subtitle: "Chip físico", icon: CreditCard },
                          { value: "esim", title: "eSIM", subtitle: "Chip digital", icon: Smartphone },
                        ] as const).map((opt) => {
                          const sel = algarLine.simType === opt.value;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setAlgarLine((l) => ({ ...l, simType: opt.value, iccid: "" }))}
                              className={cn(
                                "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition",
                                sel ? "border-primary bg-primary/5 shadow-sm" : "border-input hover:border-primary/50"
                              )}
                            >
                              <span className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0",
                                sel ? "border-primary bg-primary" : "border-muted-foreground/40"
                              )}>
                                {sel && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
                              </span>
                              <Icon className={cn("w-6 h-6", sel ? "text-primary" : "text-muted-foreground")} />
                              <div className="flex-1">
                                <div className="font-semibold text-sm">{opt.title}</div>
                                <div className="text-xs text-muted-foreground">{opt.subtitle}</div>
                      </div>

                      {algarLine.simType === "esim" && !algarEmailOk && (
                        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          eSIM requer e-mail válido do cliente (Step 1) para envio do QR Code de ativação.
                        </div>
                      )}
                            </button>
                          );
                        })}
                      </div>

                      {algarLine.simType === "sim" && (
                        <div className="rounded-xl border-2 border-dashed border-primary/20 bg-background/60 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-semibold">SIM Cards disponíveis *</Label>
                              <Badge variant="secondary" className="text-[10px]">
                                {(() => {
                                  const list = filteredSims.filter((s) => !s.type || s.type === algarLine.simType);
                                  return `${list.length} ${list.length === 1 ? "item" : "itens"}`;
                                })()}
                              </Badge>
                            </div>
                            <div className="relative w-full sm:w-72">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar ICCID..."
                                value={simFilter}
                                onChange={(e) => setSimFilter(e.target.value)}
                                className="h-9 pl-8 font-mono"
                              />
                            </div>
                          </div>

                          {(() => {
                            const list = filteredSims.filter((s) => !s.type || s.type === algarLine.simType);
                            if (list.length === 0) {
                              return (
                                <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                                  {simFilter ? "Nenhum ICCID corresponde à busca" : "Nenhum SIM Card disponível no estoque para este plano"}
                                </div>
                              );
                            }
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-auto pr-1">
                                {list.map((s) => {
                                  const sel = algarLine.iccid === s.iccid;
                                  return (
                                    <button
                                      key={s.iccid}
                                      type="button"
                                      onClick={() => setAlgarLine((l) => ({ ...l, iccid: s.iccid }))}
                                      className={cn(
                                        "group relative rounded-lg border-2 px-3 py-2.5 text-left transition-all hover:-translate-y-0.5",
                                        sel
                                          ? "border-emerald-500 bg-emerald-50 shadow-sm"
                                          : "border-input hover:border-primary/50 bg-card"
                                      )}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono text-xs font-semibold truncate">{s.iccid}</span>
                                        {sel && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                      </div>
                                      {s.type && (
                                        <Badge variant="outline" className="text-[9px] uppercase mt-1 h-4">
                                          {s.type}
                                        </Badge>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {(algarLine.iccid || algarLine.simType === "esim") && (
                        <div className="space-y-2 mt-5 pt-5 border-t">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <StickyNote className="w-4 h-4 text-muted-foreground" />
                            Notas <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                          </Label>
                          <Textarea
                            value={algarLine.notes}
                            onChange={(e) => setAlgarLine((l) => ({ ...l, notes: e.target.value }))}
                            placeholder="Adicione observações internas sobre esta ativação..."
                            rows={3}
                          />
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              )}

              {/* ===== Sub-fluxo EAI — DDD / MSISDN / ICCID / Plano ===== */}
              {product === "chip-eai" && (
                <div className="space-y-4 mt-4">
                  <Card className="p-5 rounded-2xl border-emerald-500/30 bg-emerald-500/[0.03]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-600" /> Ativação da linha EAI
                      </h3>
                      {loadingEaiRes && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" /><Label className="text-sm font-medium">DDD *</Label></div>
                        {ddds.length === 0 ? (
                          <div className="text-xs text-muted-foreground">{loadingEaiRes ? "Carregando DDDs..." : "Nenhum DDD disponível"}</div>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            {ddds.map((d) => (
                              <button key={d} type="button"
                                onClick={() => setEaiLine((l) => ({ ...l, ddd: d, msisdn: "" }))}
                                className={`rounded-lg border-2 px-3 py-2 text-sm font-bold transition ${
                                  eaiLine.ddd === d ? "border-emerald-500 bg-emerald-500/10 text-emerald-700" : "border-input hover:border-emerald-500/50"
                                }`}>{d}</button>
                            ))}
                          </div>
                        )}
                      </div>

                      {eaiLine.ddd && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-emerald-600" /><Label className="text-sm font-medium">MSISDN *</Label></div>
                          {eaiLine.msisdn ? (
                            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-3 flex items-center justify-between">
                              <div className="font-mono text-lg font-bold">{formatMsisdnEai(eaiLine.msisdn)}</div>
                              <Button type="button" size="sm" variant="ghost" onClick={() => setEaiLine((l) => ({ ...l, msisdn: "" }))}>Reservar outro</Button>
                            </div>
                          ) : (
                            <Button type="button" variant="outline" onClick={reserveEaiMsisdn} disabled={reservingMsisdn}>
                              {reservingMsisdn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Hash className="mr-2 h-4 w-4" />}
                              Reservar número no DDD {eaiLine.ddd}
                            </Button>
                          )}
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-600" /><Label className="text-sm font-medium">ICCID *</Label></div>
                          <Input value={eaiLine.iccid} onChange={(e) => setEaiLine((l) => ({ ...l, iccid: e.target.value.trim() }))} placeholder="89550..." className="font-mono" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2"><Package className="w-4 h-4 text-emerald-600" /><Label className="text-sm font-medium">Plano *</Label></div>
                          <select
                            value={eaiLine.planId}
                            onChange={(e) => setEaiLine((l) => ({ ...l, planId: e.target.value }))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione um plano...</option>
                            {eaiPlans.map((p: any) => {
                              const id = String(p.id ?? p.uuid);
                              const label = p.name || p.title || `Plano ${id}`;
                              const cents = Number(p.monthlyPrice ?? p.priceCents ?? 0);
                              const reais = cents > 0 ? cents / 100 : Number(p.price ?? 0);
                              const priceStr = reais > 0 ? ` — R$ ${reais.toFixed(2).replace(".", ",")}` : "";
                              return <option key={id} value={id}>{label}{priceStr}</option>;
                            })}
                          </select>
                        </div>
                      </div>

                      {(eaiLine.msisdn || eaiLine.iccid) && (
                        <div className="space-y-2 pt-4 border-t">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <StickyNote className="w-4 h-4 text-muted-foreground" />
                            Notas <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                          </Label>
                          <Textarea
                            value={eaiLine.notes}
                            onChange={(e) => setEaiLine((l) => ({ ...l, notes: e.target.value }))}
                            placeholder="Adicione observações internas sobre esta ativação..."
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setStep("cliente")}>Voltar</Button>
                {product === "chip-algar" ? (
                  <Button
                    disabled={!algarLineReady || saving}
                    onClick={() => runOrderFlow("algar")}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                    Ativar linha Algar
                  </Button>
                ) : product === "chip-eai" ? (
                  <Button
                    disabled={!eaiLineReady || saving}
                    onClick={() => runOrderFlow("eai")}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                    Ativar linha EAI
                  </Button>
                ) : (
                  <Button disabled={!product} onClick={() => setStep("revisao")}>Continuar</Button>
                )}
              </div>
            </>
          )}

          {step !== "produto" && product && (
            <div className="text-sm text-muted-foreground">
              Produto selecionado: <span className="font-medium text-foreground">{PRODUCTS.find((p) => p.id === product)?.title}</span>
            </div>
          )}
        </Card>
      )}

      {/* Etapa 3 — Revisão */}
      {stepIndex >= 2 && (
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">3. Revisão</h2>
            <p className="text-xs text-muted-foreground">
              {activationResult ? "Ativação concluída com sucesso." : "Confira os dados antes de finalizar."}
            </p>
          </div>

          {activationResult ? (
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-50/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-5 h-5" /> {activationResult.provider === "eai" ? "Linha EAI ativada" : "Linha Algar ativada"}
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Número:</span> <span className="font-mono font-semibold">{formatMsisdnAlgar(activationResult.tn)}</span></div>
                  <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{activationResult.simType === "esim" ? "eSIM" : "SIM físico"}</span></div>
                  {activationResult.iccid && (
                    <div className="sm:col-span-2"><span className="text-muted-foreground">ICCID:</span> <span className="font-mono">{activationResult.iccid}</span></div>
                  )}
                  {activationResult.productName && (
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Plano:</span> <span className="font-medium">{activationResult.productName}</span></div>
                  )}
                  {activationResult.activationCode && (
                    <div className="sm:col-span-2 break-all">
                      <span className="text-muted-foreground">Código de ativação:</span>{" "}
                      <span className="font-mono text-xs">{activationResult.activationCode}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => nav("/admin/mvno")}>Ir para MVNO</Button>
                <Button onClick={() => nav("/admin/clientes")}>Concluir</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">Em construção — próxima etapa do fluxo.</div>
              <div className="flex justify-between gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setStep("produto")}>Voltar</Button>
                <Button onClick={() => toast.info("Finalização em breve.")}>Finalizar pedido</Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

// ---------- subcomponents ----------
function ClientFields(props: {
  docType: DocType;
  docLabel: string;
  nameLabel: string;
  dateLabel: React.ReactNode;
  form: typeof emptyForm;
  setField: <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) => void;
  onDocComplete: (doc: string) => void;
  looking: boolean;
  source: LookupHit["source"] | null;
}) {
  const { docType, docLabel, nameLabel, dateLabel, form, setField, onDocComplete, looking, source } = props;
  const maxLen = docType === "cpf" ? 11 : 14;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1.5 md:col-span-2">
        <Label>{docLabel}</Label>
        <div className="relative">
          <Input
            value={maskCpfCnpj(form.document)}
            onChange={(e) => {
              const v = onlyDigits(e.target.value).slice(0, maxLen);
              setField("document", v);
              if (v.length === maxLen) onDocComplete(v);
            }}
            placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
            inputMode="numeric"
            className="pr-24"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {source && !looking && (
              <Badge
                className={cn(
                  "gap-1 text-[10px] font-semibold border-transparent",
                  source === "algar"     && "bg-orange-500 text-white hover:bg-orange-500",
                  source === "rbx"       && "bg-blue-600 text-white hover:bg-blue-600",
                  source === "brasilapi" && "bg-emerald-600 text-white hover:bg-emerald-600",
                  source === "eai"       && "bg-purple-600 text-white hover:bg-purple-600",
                  source === "cpfcnpj"   && "bg-slate-600 text-white hover:bg-slate-600",
                )}
              >
                <Search className="h-3 w-3" />
                {source === "rbx" ? "RBX" : source === "algar" ? "ALGAR" : source === "eai" ? "EAI" : source === "cpfcnpj" ? "CPF API" : "BrasilAPI"}
              </Badge>
            )}
            {looking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Consultamos Algar → RBX → BrasilAPI (CNPJ Algar) ou RBX → Algar → EAI → base pública.</p>
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <Label>{nameLabel}</Label>
        <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder={nameLabel} />
      </div>

      <div className="space-y-1.5">
        <Label>{dateLabel}</Label>
        <Input
          value={isoToBr(form.birthDate)}
          onChange={(e) => setField("birthDate", brToIso(brMaskInput(e.target.value)))}
          placeholder="DD/MM/AAAA"
          inputMode="numeric"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Telefone</Label>
        <Input
          value={phoneMask(form.phone)}
          onChange={(e) => setField("phone", onlyDigits(e.target.value))}
          placeholder="(00) 00000-0000"
          inputMode="tel"
        />
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <Label>E-mail <span className="text-muted-foreground font-normal text-xs">(opcional — obrigatório só para eSIM)</span></Label>
        <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="email@exemplo.com" />
      </div>
    </div>
  );
}

function AddressFields(props: {
  form: typeof emptyForm;
  setAddr: (p: Partial<Address>) => void;
  onCepBlur: () => void;
  cepLoading: boolean;
}) {
  const { form, setAddr, onCepBlur, cepLoading } = props;
  const a = form.address;
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Endereço</Label>
      <div className="grid md:grid-cols-6 gap-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label>CEP</Label>
          <div className="relative">
            <Input
              value={cepMask(a.zipCode)}
              onChange={(e) => setAddr({ zipCode: onlyDigits(e.target.value).slice(0, 8) })}
              onBlur={onCepBlur}
              placeholder="00000-000"
              inputMode="numeric"
            />
            {cepLoading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
        <div className="space-y-1.5 md:col-span-4">
          <Label>Logradouro</Label>
          <Input value={a.street} onChange={(e) => setAddr({ street: e.target.value })} placeholder="Rua / Avenida" />
        </div>
        <div className="space-y-1.5 md:col-span-1">
          <Label>Número</Label>
          <Input value={a.number} onChange={(e) => setAddr({ number: e.target.value })} placeholder="123" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Complemento</Label>
          <Input value={a.complement} onChange={(e) => setAddr({ complement: e.target.value })} placeholder="Apto, bloco..." />
        </div>
        <div className="space-y-1.5 md:col-span-3">
          <Label>Bairro</Label>
          <Input value={a.neighborhood} onChange={(e) => setAddr({ neighborhood: e.target.value })} placeholder="Bairro" />
        </div>
        <div className="space-y-1.5 md:col-span-4">
          <Label>Cidade</Label>
          <Input value={a.city} onChange={(e) => setAddr({ city: e.target.value })} placeholder="Cidade" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>UF</Label>
          <Input value={a.state} onChange={(e) => setAddr({ state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="SP" />
        </div>
      </div>
    </div>
  );
}
