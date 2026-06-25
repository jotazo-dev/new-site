import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Loader2, Smartphone, Zap, CheckCircle2, Phone, CreditCard, Package, MapPin, Hash, ShoppingCart, Wifi, StickyNote, Search, Plus, Trash2, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BatchActivationDialog } from "@/components/admin/esim/algar/BatchActivationDialog";
import { runAlgarBatch, type BatchItem, type BatchSharedMeta, type AlgarLineDraft } from "@/components/admin/esim/algar/runAlgarActivationBatch";
import { generateAlgarBatchPdf } from "@/lib/mvnoBatchPdf";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import cartaoAlgar from "@/assets/cartao-algar.png.asset.json";
import cartaoEai from "@/assets/cartao-eai.png.asset.json";
import {
  algarCall,
  lookupCep,
  findSubscriberByDocument,
  listAvailableTns,
  listAvailableSimcards,
  listAvailableLocales,
  listProducts,
  activateMobileLine,
  formatMsisdn as formatMsisdnAlgar,
  type AlgarTn,
  type AlgarSim,
  type AlgarProduct,
  type AlgarLocale,
} from "@/components/admin/esim/algar/algarClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eaiCall, extractList, formatMsisdn as formatMsisdnEai } from "@/components/admin/esim/eai/eaiClient";
import { maskCpfCnpj } from "@/lib/docMask";
import { lookupCustomerByDoc, type LookupSource } from "@/lib/cpfLookupChain";

type MvnoOp = "algar" | "eai";
type DocType = "cpf" | "cnpj";

const emptyForm = {
  name: "", document: "", birthDate: "", email: "", phone: "",
  zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  // Responsável (PJ — usado em CNPJ Algar)
  representativeDocument: "", representativeName: "", representativeBirthDate: "",
};

const emptyAlgarLine = {
  tn: "", iccid: "", simType: "sim" as "sim" | "esim",
  productSku: "", cycle: 12, locale: "", notes: "",
};
const emptyEaiLine = { ddd: "", msisdn: "", iccid: "", planId: "" };

// Helpers data: estado interno em YYYY-MM-DD; UI exibe DD/MM/AAAA.
function isoToBr(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
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
  const [, d, mo, y] = m;
  const dt = new Date(`${y}-${mo}-${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return "";
  return `${y}-${mo}-${d}`;
}
function phoneMask(v: string): string {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function NovaLinhaMVNO() {
  const nav = useNavigate();
  const [mvno, setMvno] = useState<MvnoOp | "">("");
  const [docType, setDocType] = useState<DocType | "">("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [docChecking, setDocChecking] = useState(false);
  const [docFound, setDocFound] = useState(false);
  const [lookupSource, setLookupSource] = useState<LookupSource | "">("");
  const [existingCustomerRef, setExistingCustomerRef] = useState<string>("");
  const [existingCustomerId, setExistingCustomerId] = useState<string>("");


  // Line activation state
  const [algarLine, setAlgarLine] = useState(emptyAlgarLine);
  const [eaiLine, setEaiLine] = useState(emptyEaiLine);

  // Multi-line (Algar)
  const [multi, setMulti] = useState(false);
  const [extraSlots, setExtraSlots] = useState<Array<{ tn: string; iccid: string; simType: "sim" | "esim"; note?: string }>>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const batchMetaRef = useRef<BatchSharedMeta | null>(null);

  // Algar resources
  const [tns, setTns] = useState<AlgarTn[]>([]);
  const [sims, setSims] = useState<AlgarSim[]>([]);
  const [products, setProducts] = useState<AlgarProduct[]>([]);
  const [locales, setLocales] = useState<AlgarLocale[]>([]);
  const [tnFilter, setTnFilter] = useState("");
  const [simFilter, setSimFilter] = useState("");
  const [loadingAlgarRes, setLoadingAlgarRes] = useState(false);
  const [loadingLocales, setLoadingLocales] = useState(false);
  const [loadingTns, setLoadingTns] = useState(false);

  // EAI resources
  const [ddds, setDdds] = useState<string[]>([]);
  const [eaiPlans, setEaiPlans] = useState<any[]>([]);
  const [loadingEaiRes, setLoadingEaiRes] = useState(false);
  const [reservingMsisdn, setReservingMsisdn] = useState(false);

  const setField = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function resetAll(keepMvno?: MvnoOp | "", keepDoc?: DocType | "") {
    setForm(emptyForm);
    setDocFound(false);
    setExistingCustomerRef("");
    setExistingCustomerId("");
    setAlgarLine(emptyAlgarLine);
    setEaiLine(emptyEaiLine);
    setMulti(false);
    setExtraSlots([]);
    if (keepMvno !== undefined) setMvno(keepMvno);
    if (keepDoc !== undefined) setDocType(keepDoc);
  }

  // Auto-lookup — cascata EAI/Algar → RBX → CPF.CNPJ/BrasilAPI
  const lookupSeq = useRef(0);
  useEffect(() => {
    if (!mvno || !docType) return;
    const d = form.document.replace(/\D/g, "");
    const expected = docType === "cpf" ? 11 : 14;
    if (d.length !== expected) { setDocChecking(false); setDocFound(false); setLookupSource(""); return; }
    const mySeq = ++lookupSeq.current;
    setDocChecking(true); setDocFound(false); setLookupSource("");
    const timer = setTimeout(async () => {
      try {
        const r = await lookupCustomerByDoc(d, { mvno, docType });
        if (mySeq !== lookupSeq.current) return;
        if (!r.found) return;
        const addr = r.address || {};
        const rep = r.representative;
        setForm((f) => ({
          ...f,
          name: r.name || f.name,
          email: r.email || f.email,
          phone: r.phone || f.phone,
          birthDate: r.birthDate ? (isoToBr(r.birthDate) || f.birthDate) : f.birthDate,
          zipCode: addr.zipCode || f.zipCode,
          street: addr.street || f.street,
          number: addr.number || f.number,
          complement: addr.complement || f.complement,
          neighborhood: addr.neighborhood || f.neighborhood,
          city: addr.city || f.city,
          state: addr.state || f.state,
          representativeDocument: docType === "cnpj" ? (rep?.document || f.representativeDocument) : f.representativeDocument,
          representativeName: docType === "cnpj" ? (rep?.name || f.representativeName) : f.representativeName,
          representativeBirthDate: docType === "cnpj" && rep?.birthDate
            ? (isoToBr(rep.birthDate) || f.representativeBirthDate)
            : f.representativeBirthDate,
        }));
        if (r.source) setLookupSource(r.source);
        if (r.source === "eai") {
          setDocFound(true);
          setExistingCustomerId(r.customerId || "");
          toast.info("Cliente já cadastrado na EAI — dados preenchidos.");
        } else if (r.source === "algar") {
          setDocFound(true);
          setExistingCustomerRef(r.subscriberRef || "");
          toast.info("Cliente já cadastrado na Algar — dados preenchidos.");
        } else if (r.source === "rbx") {
          toast.success("Dados encontrados na base RBX.");
        } else if (r.source === "cpfcnpj") {
          toast.success("Dados do CPF preenchidos via CPF.CNPJ.");
        } else if (r.source === "brasilapi") {
          toast.success("Dados do CNPJ preenchidos via Brasil API.");
        }
      } catch (e) {
        console.warn("[NovaLinha] lookup error", e);
      } finally {
        if (mySeq === lookupSeq.current) setDocChecking(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [form.document, docType, mvno]);


  async function onCepBlur() {
    const c = form.zipCode.replace(/\D/g, "");
    if (c.length !== 8) return;
    setCepLoading(true);
    const r = await lookupCep(c);
    setCepLoading(false);
    if (r) {
      setForm((f) => ({
        ...f,
        street: r.streetName || f.street,
        neighborhood: r.neighborhood || f.neighborhood,
        city: r.city || f.city,
        state: r.state || f.state,
      }));
    }
  }

  // Customer-ready computation: when required client fields are filled, show line section
  const customerReady = useMemo(() => {
    const expected = docType === "cpf" ? 11 : 14;
    const baseOk = !!mvno && !!docType
      && form.document.replace(/\D/g, "").length === expected
      && form.name.trim().length > 2;
    if (!baseOk) return false;
    if (mvno === "algar") {
      // NOTE: email is NOT required here, even for eSIM, so that toggling SIM/eSIM
      // doesn't hide the line-selection sections. Email-required-for-eSIM is enforced
      // in `lineReady` (submit gate) instead.
      const base = (docType === "cnpj" || !!brToIso(form.birthDate))
        && form.zipCode.replace(/\D/g, "").length === 8
        && !!form.street && !!form.number && !!form.neighborhood
        && !!form.city && form.state.length === 2;
      if (!base) return false;
      if (docType === "cnpj") {
        return form.representativeDocument.replace(/\D/g, "").length === 11
          && form.representativeName.trim().length > 2
          && !!brToIso(form.representativeBirthDate);
      }
      return true;
    }

    // EAI
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    return emailOk
      && form.phone.replace(/\D/g, "").length >= 10
      && form.zipCode.replace(/\D/g, "").length === 8
      && !!form.street && !!form.number && !!form.neighborhood
      && !!form.city && form.state.length === 2
      && (docType === "cnpj" || !!brToIso(form.birthDate));
  }, [mvno, docType, form, algarLine.simType, multi, extraSlots]);

  // Load Algar products when customer ready
  useEffect(() => {
    if (!customerReady || mvno !== "algar") return;
    if (products.length) return;
    setLoadingAlgarRes(true);
    listProducts(true)
      .then((p) => setProducts(p))
      .catch(() => toast.error("Falha ao carregar produtos Algar"))
      .finally(() => setLoadingAlgarRes(false));
  }, [customerReady, mvno]);

  // Load Algar SIM cards when a product is chosen (endpoint requires `product`)
  useEffect(() => {
    if (mvno !== "algar" || !algarLine.productSku) { setSims([]); return; }
    setSims([]);
    setAlgarLine((l) => ({ ...l, iccid: "" }));
    listAvailableSimcards(algarLine.productSku)
      .then((s) => setSims(s))
      .catch(() => toast.error("Falha ao carregar SIM cards"));
  }, [algarLine.productSku, mvno]);

  // Load Algar locales when product chosen
  useEffect(() => {
    if (mvno !== "algar" || !algarLine.productSku) { setLocales([]); return; }
    setLoadingLocales(true);
    setLocales([]);
    setAlgarLine((l) => ({ ...l, locale: "", tn: "" }));
    listAvailableLocales(algarLine.productSku)
      .then((ls) => setLocales(ls))
      .catch(() => toast.error("Falha ao carregar localidades"))
      .finally(() => setLoadingLocales(false));
  }, [algarLine.productSku, mvno]);

  // Load TNs when locale chosen
  useEffect(() => {
    if (mvno !== "algar" || !algarLine.productSku || !algarLine.locale) { setTns([]); return; }
    setLoadingTns(true);
    setTns([]);
    setAlgarLine((l) => ({ ...l, tn: "" }));
    listAvailableTns(algarLine.productSku, algarLine.locale)
      .then((t) => setTns(t))
      .catch(() => toast.error("Falha ao carregar números"))
      .finally(() => setLoadingTns(false));
  }, [algarLine.locale, algarLine.productSku, mvno]);

  // Load EAI resources
  useEffect(() => {
    if (!customerReady || mvno !== "eai") return;
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
  }, [customerReady, mvno]);

  // Lookup CPF do Responsável (CNPJ Algar) — cascata RBX → CPF.CNPJ
  const repSeq = useRef(0);
  useEffect(() => {
    if (mvno !== "algar" || docType !== "cnpj") return;
    const d = form.representativeDocument.replace(/\D/g, "");
    if (d.length !== 11) return;
    const mySeq = ++repSeq.current;
    const timer = setTimeout(async () => {
      try {
        const r = await lookupCustomerByDoc(d, { mvno: "algar", docType: "cpf" });
        if (mySeq !== repSeq.current) return;
        if (!r.found) return;
        setForm((f) => ({
          ...f,
          representativeName: r.name || f.representativeName,
          representativeBirthDate: r.birthDate ? (isoToBr(r.birthDate) || f.representativeBirthDate) : f.representativeBirthDate,
        }));
        toast.success(`Responsável encontrado (${r.source}).`);
      } catch {}
    }, 450);
    return () => clearTimeout(timer);
  }, [form.representativeDocument, mvno, docType]);

  async function reserveEaiMsisdn() {
    if (!eaiLine.ddd) return toast.error("Selecione um DDD");
    setReservingMsisdn(true);
    const r = await eaiCall<any>("/rest/service_eai/reserve_msisdns", {
      method: "POST",
      body: { DDD: eaiLine.ddd, types: ["mtNormalNumber"] },
    });
    setReservingMsisdn(false);
    if (!r.ok) return toast.error(`Erro ao reservar (${r.status})`);
    const j: any = r.json || {};
    const list: any[] = Array.isArray(j) ? j
      : j.msisdns || j.reservations || j.data?.msisdns || j.data?.reservations || j.data || [];
    const first = list[0];
    const num = typeof first === "string" ? first : (first?.msisdn ?? first?.number ?? "");
    if (num) { setEaiLine((l) => ({ ...l, msisdn: String(num) })); toast.success("MSISDN reservado"); }
    else toast.error("Sem MSISDN retornado");
  }

  const lineReady = useMemo(() => {
    if (mvno === "algar") {
      const baseOk = !!algarLine.productSku && algarLine.cycle >= 1 && algarLine.cycle <= 28
        && !!algarLine.locale && !!algarLine.tn && (algarLine.simType === "esim" || !!algarLine.iccid);
      if (!baseOk) return false;
      // Email is required if any line is eSIM (enforced here, not in customerReady,
      // so flipping SIM↔eSIM doesn't collapse the line section).
      const anyEsim = algarLine.simType === "esim" || (multi && extraSlots.some((s) => s.simType === "esim"));
      if (anyEsim) {
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
        if (!emailOk) return false;
      }
      if (!multi) return true;
      // Validate extra slots
      const seenTns = new Set<string>([algarLine.tn]);
      const seenIccids = new Set<string>([algarLine.iccid].filter(Boolean));
      for (const s of extraSlots) {
        if (!s.tn) return false;
        if (seenTns.has(s.tn)) return false;
        seenTns.add(s.tn);
        if (s.simType === "sim") {
          if (!s.iccid) return false;
          if (seenIccids.has(s.iccid)) return false;
          seenIccids.add(s.iccid);
        }
      }
      return true;
    }
    if (mvno === "eai") return !!eaiLine.msisdn && !!eaiLine.iccid && !!eaiLine.planId;
    return false;
  }, [mvno, algarLine, eaiLine, multi, extraSlots, form.email]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!customerReady || !lineReady) return;
    setSaving(true);
    try {
      if (mvno === "algar") {
        const maskDoc = (d: string) => d.replace(/\D/g, "").replace(/^(\d{3})\d+(\d{2})$/, "$1***$2");

        // Algar exige birthdate no root, mesmo para CNPJ — usar a data do representante quando CNPJ
        const rootBirthdate = docType === "cpf"
          ? brToIso(form.birthDate)
          : (brToIso(form.representativeBirthDate) || brToIso(form.birthDate));
        if (!rootBirthdate) {
          toast.error(docType === "cpf"
            ? "Informe a data de nascimento (dd/mm/aaaa) antes de ativar."
            : "Informe a data de nascimento do representante legal antes de ativar.");
          return;
        }

        // 1) Cria subscriber (uma vez) se necessário
        let subscriberRef = existingCustomerRef;
        if (!docFound) {
          let phone = form.phone.replace(/\D/g, "");
          if (phone.length === 10 || phone.length === 11) phone = "55" + phone;
          const subBody: any = {
            name: form.name,
            document: form.document.replace(/\D/g, ""),
            type: docType === "cpf" ? "individual" : "company",
            birthdate: rootBirthdate,
            email: form.email.trim(),
            contact_number: phone,
            address: {
              zipCode: form.zipCode.replace(/\D/g, ""),
              streetName: form.street,
              streetNumber: String(form.number),
              complement: form.complement || undefined,
              neighborhood: form.neighborhood,
              city: form.city,
              state: form.state,
            },
          };
          if (docType === "cnpj") {
            subBody.representative = {
              document: form.representativeDocument.replace(/\D/g, ""),
              name: form.representativeName,
              birthdate: brToIso(form.representativeBirthDate) || rootBirthdate,
            };
          }
          console.log("[ALGAR-UI] POST /v2/subscribers", { ...subBody, document: maskDoc(subBody.document) });
          const created = await algarCall<any>("/v2/subscribers", { method: "POST", body: subBody });
          if (!created?.ok) {
            toast.error(`Falha em /v2/subscribers (${created?.status ?? "?"}): ${String(created?.error || JSON.stringify(created?.data) || created?.raw || "").slice(0, 160)}`);
            return;
          }
          subscriberRef = created.data?.ref || created.data?.id || `USR_${form.document.replace(/\D/g, "")}`;
        }

        // 2) Monta lista de linhas
        const lines: AlgarLineDraft[] = multi
          ? [
              { tn: algarLine.tn, iccid: algarLine.iccid, simType: algarLine.simType, note: algarLine.notes },
              ...extraSlots.map((s) => ({ tn: s.tn, iccid: s.iccid, simType: s.simType, note: s.note })),
            ]
          : [{ tn: algarLine.tn, iccid: algarLine.iccid, simType: algarLine.simType, note: algarLine.notes }];

        const meta: BatchSharedMeta = {
          docType: docType as "cpf" | "cnpj",
          form: {
            name: form.name,
            document: form.document,
            email: form.email,
            phone: form.phone,
            birthDate: brToIso(form.birthDate),
            zipCode: form.zipCode,
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
            representativeDocument: form.representativeDocument,
            representativeName: form.representativeName,
            representativeBirthDate: brToIso(form.representativeBirthDate),
          },
          productSku: algarLine.productSku,
          productName: products.find((p) => p.sku === algarLine.productSku)?.name || null,
          cycle: algarLine.cycle,
          locale: algarLine.locale,
          notes: algarLine.notes,
          subscriberRef: subscriberRef || `USR_${form.document.replace(/\D/g, "")}`,
        };
        batchMetaRef.current = meta;

        const initialItems: BatchItem[] = lines.map((line, i) => ({
          index: i,
          line,
          status: "pending",
        }));
        setBatchItems(initialItems);
        setBatchOpen(true);
        setBatchRunning(true);
        setSaving(false);

        // Runner usa ref mutável para atualizações in-place
        const itemsRef: BatchItem[] = initialItems.map((it) => ({ ...it }));
        const update = (idx: number, patch: Partial<BatchItem>) => {
          const i = itemsRef.findIndex((x) => x.index === idx);
          if (i >= 0) itemsRef[i] = { ...itemsRef[i], ...patch };
          setBatchItems(itemsRef.map((x) => ({ ...x })));
        };
        await runAlgarBatch(itemsRef, meta, update);
        setBatchRunning(false);
        const okCount = itemsRef.filter((i) => i.status === "done").length;
        const failCount = itemsRef.filter((i) => i.status === "failed").length;
        if (failCount === 0) toast.success(`${okCount} linha(s) ativada(s) com sucesso!`);
        else toast.error(`${okCount} sucesso, ${failCount} falha(s).`);
        return;

      } else {
        // ===== EAI activation flow (Zion ERP v1) =====
        let customerId = existingCustomerId;
        const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");
        const phoneDigits = onlyDigits(form.phone);

        // 1) Create customer if needed
        if (!docFound || !customerId) {
          toast.message("Criando cliente na EAI...");
          const isCpf = docType === "cpf";
          const birthIso = brToIso(form.birthDate);
          const custBody: any = {
            name: form.name,
            cpfCnpj: onlyDigits(form.document),
            email: form.email.trim() || undefined,
            phone: phoneDigits || undefined,
            type: isCpf ? "Individual" : "Entity",
            typeTelecom: "ptlResidencial",
            status: "Active",
            addresses: [{
              zipCode: onlyDigits(form.zipCode) || undefined,
              streetName: form.street || undefined,
              streetNumber: form.number ? String(form.number) : undefined,
              complement: form.complement || undefined,
              neighborhood: form.neighborhood || undefined,
              city: form.city || undefined,
              state: form.state || undefined,
              country: "BR",
              isMain: true,
            }],
            contacts: [
              ...(form.email.trim() ? [{ kind: "email", value: form.email.trim() }] : []),
              ...(phoneDigits ? [{ kind: "cellphone", value: phoneDigits }] : []),
            ],
          };
          if (isCpf && birthIso) custBody.birthdate = `${birthIso}T00:00:00Z`;

          const c = await eaiCall<any>("/rest/service_eai/customers", { method: "POST", body: custBody });
          if (!c?.ok) {
            toast.error(`Falha ao criar cliente EAI (${c?.status}) — ${c?.snippet?.slice(0, 140) || ""}`);
            return;
          }
          const created: any = c.json?.customer ?? c.json?.data ?? c.json ?? {};
          customerId = String(created.id ?? created.customerId ?? created.personId ?? created.uuid ?? "");
          if (!customerId) {
            toast.error("Cliente criado, mas API EAI não retornou o ID.");
            return;
          }
        }

        // 2) Create activation cart (pending)
        toast.message("Criando cart de ativação...");
        const cartBody: any = {
          cartType: "mctActivation",
          origin: "mcoAdmin",
          billingType: "btInternalPayment",
          personId: customerId,
          planId: eaiLine.planId,
          activation: {
            ddd: eaiLine.ddd,
            iccid: eaiLine.iccid,
            msisdn: eaiLine.msisdn,
          },
        };
        const cart = await eaiCall<any>("/rest/service_eai/mvno_carts", { method: "POST", body: cartBody });
        if (!cart?.ok) {
          toast.error(`Falha ao criar cart EAI (${cart?.status}) — ${cart?.snippet?.slice(0, 140) || ""}`);
          return;
        }
        const cartData: any = cart.json?.cart ?? cart.json?.data ?? cart.json ?? {};
        const cartId = String(cartData.id ?? cartData.cartId ?? cartData.uuid ?? "");
        if (!cartId) {
          toast.error("Cart criado, mas API EAI não retornou o ID.");
          return;
        }

        // 3) Process cart (activates the line)
        toast.message("Processando ativação...");
        const proc = await eaiCall<any>(`/rest/service_eai/mvno_carts/${cartId}`, { method: "PATCH", body: {} });
        if (!proc?.ok) {
          toast.error(`Cart ${cartId} criado, mas falhou o process (${proc?.status}). Você pode cancelar via /admin/mvno.`);
          // Persist as failed so operator can retry / cancel
          await supabase.from("mvno_activations").insert({
            provider: "eai",
            tn: eaiLine.msisdn,
            iccid: eaiLine.iccid,
            sim_type: "sim",
            product_sku: eaiLine.planId,
            product_name: eaiPlans.find((p: any) => String(p.id ?? p.uuid) === eaiLine.planId)?.name || null,
            subscriber_doc: onlyDigits(form.document),
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
        const planObj: any = eaiPlans.find((p: any) => String(p.id ?? p.uuid) === eaiLine.planId) || {};
        const { data: rec, error: recErr } = await supabase
          .from("mvno_activations")
          .insert({
            provider: "eai",
            tn: eaiLine.msisdn,
            iccid: eaiLine.iccid,
            sim_type: "sim",
            product_sku: eaiLine.planId,
            product_name: planObj.name || planObj.title || null,
            subscriber_doc: onlyDigits(form.document),
            subscriber_name: form.name,
            subscriber_email: form.email || null,
            subscriber_phone: form.phone || null,
            raw_response: { cart: cartData, process: procData, cartId, customerId },
            status: "confirmed",
            email_status: form.email ? "not_sent" : "skipped",
          })
          .select("id")
          .single();
        if (recErr) console.error("mvno_activations insert (eai)", recErr);

        toast.success("Linha EAI ativada com sucesso!");

        // 5) Send e-mail (SIM físico — sem QR; eSIM virá futuramente)
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
            },
          });
          if (mailErr) toast.error(`Linha ativada, mas falhou o e-mail: ${mailErr.message}`);
          else if ((mailData as any)?.ok === false) toast.error((mailData as any).userMessage || "Linha ativada, mas falhou o e-mail");
          else toast.success(`E-mail enviado para ${form.email}`);
        }

        nav("/admin/mvno");
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao ativar linha");
    } finally {
      setSaving(false);
    }
  }

  const filteredTns = tns.filter((t) => t.tn?.includes(tnFilter.replace(/\D/g, "")));
  const filteredSims = sims.filter((s) => (s.iccid || "").includes(simFilter.replace(/\D/g, "")));

  return (
    <div className="space-y-5">
      <Helmet><title>Nova linha móvel MVNO · Jotazo</title></Helmet>

      <div>
        <h1 className="text-2xl font-bold">Nova linha móvel MVNO</h1>
        <p className="text-sm text-muted-foreground">Cadastre uma nova linha móvel — Algar ou EAI. Após preencher os dados do titular, os campos de ativação aparecem abaixo.</p>
      </div>

      <form onSubmit={handleActivate} className="space-y-5">
        {/* Step 1: MVNO */}
        <Card className="p-5 rounded-2xl">
          <Label className="text-sm font-semibold mb-3 block">1. Operadora MVNO</Label>
          <RadioGroup
            value={mvno}
            onValueChange={(v) => resetAll(v as MvnoOp, "")}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${mvno === "algar" ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40"}`}>
              <RadioGroupItem value="algar" id="mvno-algar" />
              <img src={cartaoAlgar.url} alt="Chip Algar" className="w-32 h-auto rounded-md shadow-sm shrink-0" />
              <div>
                <div className="font-semibold text-sm flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" />Algar</div>
                <div className="text-xs text-muted-foreground">Linha móvel Algar MVNO</div>
              </div>
            </label>
            <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${mvno === "eai" ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40"}`}>
              <RadioGroupItem value="eai" id="mvno-eai" />
              <img src={cartaoEai.url} alt="Chip EAI" className="w-32 h-auto rounded-md shadow-sm shrink-0" />
              <div>
                <div className="font-semibold text-sm flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-primary" />EAI</div>
                <div className="text-xs text-muted-foreground">Linha móvel EAI MVNO</div>
              </div>
            </label>
          </RadioGroup>
        </Card>

        {/* Step 2: doc type */}
        {mvno && (
          <Card className="p-5 rounded-2xl">
            <Label className="text-sm font-semibold mb-3 block">2. Tipo de titular</Label>
            <RadioGroup
              value={docType}
              onValueChange={(v) => { setDocType(v as DocType); setForm(emptyForm); setDocFound(false); }}
              className="grid grid-cols-2 gap-3"
            >
              <label className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer text-sm ${docType === "cpf" ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                <RadioGroupItem value="cpf" id="t-cpf" />
                <span className="font-medium">CPF (Pessoa Física)</span>
              </label>
              <label className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer text-sm ${docType === "cnpj" ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                <RadioGroupItem value="cnpj" id="t-cnpj" />
                <span className="font-medium">CNPJ (Pessoa Jurídica)</span>
              </label>
            </RadioGroup>
          </Card>
        )}

        {/* Step 3: customer fields */}
        {mvno && docType && (
          <Card className="p-5 rounded-2xl">
            <h3 className="text-sm font-semibold mb-4">3. Dados do titular</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{docType === "cpf" ? "CPF *" : "CNPJ *"}</Label>
                  <div className="relative">
                    <Input
                      value={maskCpfCnpj(form.document)}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, "").slice(0, docType === "cpf" ? 11 : 14);
                        const expected = docType === "cpf" ? 11 : 14;
                        if (next.length < expected) {
                          setForm({ ...emptyForm, document: next });
                          setDocFound(false);
                          setExistingCustomerRef("");
                          setExistingCustomerId("");
                        } else {
                          setField("document", next);
                        }
                      }}
                      placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                      inputMode="numeric"
                      maxLength={docType === "cpf" ? 14 : 18}
                      required
                    />
                    {docChecking && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                    {!docChecking && lookupSource && (
                      <Badge className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 font-semibold pointer-events-none border-0",
                        lookupSource === "algar"     && "bg-orange-500 text-white hover:bg-orange-500",
                        lookupSource === "rbx"       && "bg-blue-600 text-white hover:bg-blue-600",
                        lookupSource === "brasilapi" && "bg-emerald-600 text-white hover:bg-emerald-600",
                        lookupSource === "eai"       && "bg-purple-600 text-white hover:bg-purple-600",
                        lookupSource === "cpfcnpj"   && "bg-slate-600 text-white hover:bg-slate-600",
                      )}>
                        {lookupSource === "algar" ? "ALGAR"
                          : lookupSource === "rbx" ? "RBX"
                          : lookupSource === "brasilapi" ? "BrasilAPI"
                          : lookupSource === "eai" ? "EAI" : "CPF API"}
                      </Badge>
                    )}

                  </div>
                  {docFound && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Titular já cadastrado — dados preenchidos.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{docType === "cpf" ? "Nome completo *" : "Razão social *"}</Label>
                  <Input value={form.name} onChange={(e) => setField("name", e.target.value)} required />
                </div>
                {mvno === "algar" && (
                  <div className="space-y-2">
                    <Label>
                      {docType === "cpf"
                        ? "Data de nascimento *"
                        : (<>Data de abertura <span className="text-muted-foreground font-normal text-xs">(opcional)</span></>)}
                    </Label>
                    <Input
                      inputMode="numeric"
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      value={form.birthDate}
                      onChange={(e) => setField("birthDate", brMaskInput(e.target.value))}
                      required={docType === "cpf"}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Celular (DDD)</Label>
                  <Input
                    value={phoneMask(form.phone)}
                    onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="(11) 99999-9999"
                    inputMode="tel"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>
                    E-mail{" "}
                    {mvno === "algar" && algarLine.simType !== "esim"
                      ? <span className="text-muted-foreground font-normal text-xs">(opcional — obrigatório só para eSIM)</span>
                      : <span>*</span>}
                  </Label>
                  <Input
                    type="email"
                    required={mvno !== "algar" || algarLine.simType === "esim"}
                    aria-required={mvno !== "algar" || algarLine.simType === "esim"}
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </div>

              </div>

              {mvno === "algar" && docType === "cnpj" && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3">Responsável (CPF)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>CPF do responsável *</Label>
                      <Input
                        value={maskCpfCnpj(form.representativeDocument)}
                        onChange={(e) => setField("representativeDocument", e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        maxLength={14}
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">Nome é buscado automaticamente no cadastro. caso não encontre os dados preencher manualmente.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do responsável *</Label>
                      <Input value={form.representativeName} onChange={(e) => setField("representativeName", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de nascimento *</Label>
                      <Input
                        inputMode="numeric"
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        value={form.representativeBirthDate}
                        onChange={(e) => setField("representativeBirthDate", brMaskInput(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Endereço</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CEP {mvno === "algar" ? "*" : ""}</Label>
                    <div className="relative">
                      <Input
                        value={form.zipCode}
                        onChange={(e) => setField("zipCode", e.target.value.replace(/\D/g, "").slice(0, 8))}
                        onBlur={onCepBlur}
                        placeholder="00000000"
                        required={mvno === "algar"}
                      />
                      {cepLoading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Logradouro {mvno === "algar" ? "*" : ""}</Label>
                    <Input value={form.street} onChange={(e) => setField("street", e.target.value)} required={mvno === "algar"} />
                  </div>
                  <div className="space-y-2">
                    <Label>Número {mvno === "algar" ? "*" : ""}</Label>
                    <Input value={form.number} onChange={(e) => setField("number", e.target.value)} required={mvno === "algar"} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Complemento</Label>
                    <Input value={form.complement} onChange={(e) => setField("complement", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro {mvno === "algar" ? "*" : ""}</Label>
                    <Input value={form.neighborhood} onChange={(e) => setField("neighborhood", e.target.value)} required={mvno === "algar"} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade *</Label>
                    <Input value={form.city} onChange={(e) => setField("city", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>UF *</Label>
                    <Input value={form.state} maxLength={2} onChange={(e) => setField("state", e.target.value.toUpperCase())} required />
                  </div>
                </div>
              </div>
            </div>
          </Card>

        )}

        {/* Step 4: Algar — Plano */}
        {customerReady && mvno === "algar" && (
          <Card className="p-5 rounded-2xl border-primary/30 bg-primary/[0.02]">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> 4. Plano
              </h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Múltiplas linhas
                  <Switch
                    checked={multi}
                    onCheckedChange={(v) => {
                      setMulti(v);
                      if (!v) setExtraSlots([]);
                    }}
                  />
                </label>
                {loadingAlgarRes && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
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
                          <SelectItem key={p.sku} value={p.sku} className="py-3 pr-3 pl-9 focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
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
        )}

        {/* Step 5: Algar — Numeração */}
        {customerReady && mvno === "algar" && !!algarLine.productSku && (
          <Card className="p-5 rounded-2xl border-primary/30 bg-primary/[0.02]">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-primary" /> 5. Numeração
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

        {/* Step 6: Algar — Chip */}
        {customerReady && mvno === "algar" && !!algarLine.tn && (
          <Card className="p-5 rounded-2xl border-primary/30 bg-primary/[0.02]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> 6. Chip (SIM / eSIM)
              </h3>
              <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
                <Wifi className="w-3 h-3" /> Perfil: <span className="font-semibold">Jotazo Brasil</span>
              </Badge>
            </div>

            {/* Tipo de chip */}
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
                  </button>
                );
              })}
            </div>

            {/* Lista de SIM Cards físicos (eSIM não requer ICCID prévio) */}
            {algarLine.simType === "sim" && (
            <div className="rounded-xl border-2 border-dashed border-primary/20 bg-background/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">
                    SIM Cards disponíveis *
                  </Label>
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
                if (loadingAlgarRes) {
                  return (
                    <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Carregando ICCIDs...
                    </div>
                  );
                }
                if (list.length === 0) {
                  return (
                    <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                      {!algarLine.productSku
                        ? "Selecione um plano antes para listar os ICCIDs disponíveis"
                        : simFilter
                        ? "Nenhum ICCID corresponde à busca"
                        : "Nenhum SIM Card disponível no estoque para este plano"}
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

            {/* Notas */}
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

        {/* Step 7: Algar — Linhas adicionais (somente em modo múltiplas) */}
        {customerReady && mvno === "algar" && multi && !!algarLine.tn && (
          <Card className="p-5 rounded-2xl border-primary/30 bg-primary/[0.02]">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> 7. Linhas adicionais
                <Badge variant="secondary" className="text-[10px]">{extraSlots.length}</Badge>
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setExtraSlots((s) => [...s, { tn: "", iccid: "", simType: "sim" }])}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar linha
              </Button>
            </div>

            {extraSlots.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed py-8 text-center text-xs text-muted-foreground">
                Use "Adicionar linha" para ativar várias linhas com os mesmos dados do cliente.
                <div className="mt-1">O primeiro número/chip selecionado acima é a linha #1.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {extraSlots.map((slot, idx) => {
                  const usedTns = new Set<string>([algarLine.tn, ...extraSlots.filter((_, j) => j !== idx).map((s) => s.tn).filter(Boolean)]);
                  const usedIccids = new Set<string>([algarLine.iccid, ...extraSlots.filter((_, j) => j !== idx).map((s) => s.iccid).filter(Boolean)]);
                  const availTns = tns.filter((t) => !usedTns.has(t.tn));
                  const availSims = sims.filter((s) => (!s.type || s.type === slot.simType) && !usedIccids.has(s.iccid));
                  const updateSlot = (patch: Partial<typeof slot>) =>
                    setExtraSlots((arr) => arr.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
                  return (
                    <div key={idx} className="rounded-xl border bg-card p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-muted-foreground">Linha #{idx + 2}</div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setExtraSlots((arr) => arr.filter((_, i) => i !== idx))}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
                        {/* TN picker */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="justify-start h-11 font-mono">
                              <Phone className="w-3.5 h-3.5 mr-2 text-primary" />
                              {slot.tn ? formatMsisdnAlgar(slot.tn) : "Escolher número"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2" align="start">
                            <div className="text-xs font-semibold px-2 py-1">Números disponíveis ({availTns.length})</div>
                            <div className="max-h-64 overflow-auto grid grid-cols-2 gap-1.5 p-1">
                              {availTns.length === 0 && (
                                <div className="col-span-2 text-center text-xs text-muted-foreground py-6">Sem números</div>
                              )}
                              {availTns.map((t) => (
                                <button
                                  key={t.tn}
                                  type="button"
                                  onClick={() => updateSlot({ tn: t.tn })}
                                  className={cn(
                                    "rounded border-2 px-2 py-1.5 text-xs font-mono text-left",
                                    slot.tn === t.tn ? "border-emerald-500 bg-emerald-500/10" : "border-input hover:border-primary/50"
                                  )}
                                >
                                  {formatMsisdnAlgar(t.tn)}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Chip type */}
                        <div className="flex gap-1 items-center justify-center">
                          {(["sim", "esim"] as const).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => updateSlot({ simType: v, iccid: "" })}
                              className={cn(
                                "rounded-md border px-2 py-1.5 text-[11px] font-medium uppercase",
                                slot.simType === v ? "border-primary bg-primary/10 text-primary" : "border-input"
                              )}
                            >
                              {v}
                            </button>
                          ))}
                        </div>

                        {/* ICCID picker */}
                        {slot.simType === "sim" ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" className="justify-start h-11 font-mono text-xs">
                                <CreditCard className="w-3.5 h-3.5 mr-2 text-primary shrink-0" />
                                <span className="truncate">{slot.iccid || "Escolher ICCID"}</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-2" align="start">
                              <SlotIccidSearch
                                items={availSims}
                                selected={slot.iccid}
                                onSelect={(iccid) => updateSlot({ iccid })}
                              />
                            </PopoverContent>
                          </Popover>

                        ) : (
                          <div className="flex items-center justify-center text-[11px] text-muted-foreground">
                            <Smartphone className="w-3.5 h-3.5 mr-1" /> eSIM
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                          <StickyNote className="w-3 h-3" />
                          Nota da linha #{idx + 2} <span className="font-normal">(opcional)</span>
                        </label>
                        <Textarea
                          value={slot.note || ""}
                          onChange={(e) => updateSlot({ note: e.target.value })}
                          placeholder="Observações específicas desta linha"
                          rows={2}
                          maxLength={500}
                          className="text-xs resize-none"
                        />
                        <div className="text-[10px] text-muted-foreground text-right">{(slot.note || "").length}/500</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}



        {customerReady && mvno === "eai" && (
          <Card className="p-5 rounded-2xl border-primary/30 bg-primary/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" /> 4. Ativação da linha EAI
              </h3>
              {loadingEaiRes && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /><Label className="text-sm font-medium">DDD *</Label></div>
                {ddds.length === 0 ? (
                  <div className="text-xs text-muted-foreground">{loadingEaiRes ? "Carregando DDDs..." : "Nenhum DDD disponível"}</div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {ddds.map((d) => (
                      <button key={d} type="button"
                        onClick={() => setEaiLine((l) => ({ ...l, ddd: d, msisdn: "" }))}
                        className={`rounded-lg border-2 px-3 py-2 text-sm font-bold transition ${
                          eaiLine.ddd === d ? "border-primary bg-primary/10 text-primary" : "border-input hover:border-primary/50"
                        }`}>{d}</button>
                    ))}
                  </div>
                )}
              </div>

              {eaiLine.ddd && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /><Label className="text-sm font-medium">MSISDN *</Label></div>
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
                  <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /><Label className="text-sm font-medium">ICCID *</Label></div>
                  <Input value={eaiLine.iccid} onChange={(e) => setEaiLine((l) => ({ ...l, iccid: e.target.value.trim() }))} placeholder="89550..." className="font-mono" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><Package className="w-4 h-4 text-primary" /><Label className="text-sm font-medium">Plano *</Label></div>
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
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => nav("/admin/mvno")} disabled={saving || batchRunning}>Cancelar</Button>
          <Button type="submit" disabled={saving || batchRunning || !customerReady || !lineReady} className="bg-emerald-600 hover:bg-emerald-700">
            {(saving || batchRunning) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
            {multi && mvno === "algar" ? `Ativar ${1 + extraSlots.length} linha(s)` : "Ativar linha"}
          </Button>
        </div>
      </form>

      <BatchActivationDialog
        open={batchOpen}
        items={batchItems}
        running={batchRunning}
        onRetry={async () => {
          const meta = batchMetaRef.current;
          if (!meta) return;
          const failedIdx = batchItems.filter((i) => i.status === "failed").map((i) => i.index);
          if (failedIdx.length === 0) return;
          setBatchRunning(true);
          const itemsRef: BatchItem[] = batchItems.map((it) => ({ ...it }));
          // Reset failed ones to pending
          for (const i of itemsRef) if (failedIdx.includes(i.index)) { i.status = "pending"; i.error = undefined; }
          setBatchItems(itemsRef.map((x) => ({ ...x })));
          const update = (idx: number, patch: Partial<BatchItem>) => {
            const i = itemsRef.findIndex((x) => x.index === idx);
            if (i >= 0) itemsRef[i] = { ...itemsRef[i], ...patch };
            setBatchItems(itemsRef.map((x) => ({ ...x })));
          };
          await runAlgarBatch(itemsRef, meta, update, failedIdx);
          setBatchRunning(false);
        }}
        onDownloadPdf={() => {
          const meta = batchMetaRef.current;
          if (!meta) return;
          const successItems = batchItems.filter((i) => i.status === "done");
          if (successItems.length === 0) return;
          const blob = generateAlgarBatchPdf({
            customer: { name: meta.form.name, document: meta.form.document, email: meta.form.email, phone: meta.form.phone },
            product: { name: meta.productName, sku: meta.productSku, cycle: meta.cycle, locale: meta.locale },
            lines: successItems.map((it) => ({
              tn: it.line.tn,
              iccid: it.line.iccid,
              simType: it.line.simType,
              activationCode: it.activationCode,
              emailStatus: it.emailStatus,
            })),
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `jotazo-linhas-${Date.now()}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
        onNew={() => {
          setBatchOpen(false);
          resetAll("algar", docType || "");
        }}
        onClose={() => {
          setBatchOpen(false);
          const anySuccess = batchItems.some((i) => i.status === "done");
          if (anySuccess) nav("/admin/mvno");
        }}
      />
    </div>
  );
}

function SlotIccidSearch({
  items,
  selected,
  onSelect,
}: {
  items: AlgarSim[];
  selected: string;
  onSelect: (iccid: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = items.filter((s) => (s.iccid || "").includes(q.replace(/\D/g, "")));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold">ICCIDs disponíveis ({filtered.length})</div>
      </div>
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ICCID..."
          className="h-8 pl-7 text-xs font-mono"
        />
      </div>
      <div className="max-h-64 overflow-auto space-y-1 p-1">
        {filtered.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-6">Sem ICCIDs</div>
        )}
        {filtered.map((s) => (
          <button
            key={s.iccid}
            type="button"
            onClick={() => onSelect(s.iccid)}
            className={cn(
              "w-full rounded border-2 px-2 py-1.5 text-xs font-mono text-left",
              selected === s.iccid ? "border-emerald-500 bg-emerald-500/10" : "border-input hover:border-primary/50"
            )}
          >
            {s.iccid}
          </button>
        ))}
      </div>
    </div>
  );
}
