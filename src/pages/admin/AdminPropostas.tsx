import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlans } from "@/hooks/usePlans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FileSignature, Download, Pencil, Copy, FileText, ListPlus, X } from "lucide-react";
import { buildPropostaPdf, type PropostaPdfData, type PropostaItem } from "@/lib/propostaPdf";

// ─────────── helpers ───────────
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a}`, a && a.length === 2 ? ") " : "", b, c && `-${c}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
}
function maskDoc(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) return d.replace(/(\d{3})(\d{3})?(\d{3})?(\d{0,2})?/, (_, a, b, c, dd) => [a, b && `.${b}`, c && `.${c}`, dd && `-${dd}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
}
function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d{0,3})/, (_, a, b) => (b ? `${a}-${b}` : a));
}
function parseCents(v: string): number {
  const clean = v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : Math.round(n * 100);
}
function centsToInput(c: number): string {
  return (c / 100).toFixed(2).replace(".", ",");
}

const FIDELITY_OPTS = [
  { v: "12_meses", label: "12 meses" },
  { v: "24_meses", label: "24 meses" },
  { v: "sem_fidelidade", label: "Sem fidelidade" },
];
const PAYMENT_OPTS = [
  { v: "boleto", label: "Boleto bancário" },
  { v: "debito_automatico", label: "Débito automático" },
  { v: "pix", label: "PIX" },
  { v: "cartao", label: "Cartão de crédito" },
];
const STATUS_OPTS = [
  { v: "rascunho", label: "Rascunho", color: "bg-muted text-muted-foreground" },
  { v: "enviada", label: "Enviada", color: "bg-blue-500/15 text-blue-700" },
  { v: "aceita", label: "Aceita", color: "bg-green-500/15 text-green-700" },
  { v: "recusada", label: "Recusada", color: "bg-red-500/15 text-red-700" },
  { v: "expirada", label: "Expirada", color: "bg-yellow-500/15 text-yellow-700" },
];

// ─────────── tipos ───────────
type FormItem = {
  _key: string;
  source: "catalog" | "custom";
  plan_id?: string;
  name: string;
  description: string;
  priceCents: number;
  includes: string[];
};

type FormState = {
  customer_name: string;
  customer_doc: string;
  customer_email: string;
  customer_phone: string;
  customer_cep: string;
  customer_street: string;
  customer_number: string;
  customer_complement: string;
  customer_neighborhood: string;
  customer_city: string;
  customer_uf: string;
  items: FormItem[];
  discount_cents: number;
  fidelity: string;
  installation_fee_cents: number;
  installation_waived: boolean;
  payment_method: string;
  valid_until: string; // yyyy-mm-dd
  notes: string;
  seller_name: string;
  seller_phone: string;
  seller_email: string;
};

const emptyForm = (): FormState => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return {
    customer_name: "", customer_doc: "", customer_email: "", customer_phone: "",
    customer_cep: "", customer_street: "", customer_number: "", customer_complement: "",
    customer_neighborhood: "", customer_city: "", customer_uf: "",
    items: [], discount_cents: 0,
    fidelity: "12_meses", installation_fee_cents: 0, installation_waived: true,
    payment_method: "boleto",
    valid_until: d.toISOString().slice(0, 10),
    notes: "",
    seller_name: "", seller_phone: "", seller_email: "",
  };
};

type Proposal = {
  id: string;
  number: number;
  status: string;
  customer_name: string;
  total_cents: number;
  valid_until: string | null;
  pdf_url: string | null;
  seller_name: string;
  created_at: string;
  updated_at: string;
  customer_doc: string;
  customer_email: string;
  customer_phone: string;
  customer_cep: string;
  customer_street: string;
  customer_number: string;
  customer_complement: string;
  customer_neighborhood: string;
  customer_city: string;
  customer_uf: string;
  items: any;
  subtotal_cents: number;
  discount_cents: number;
  fidelity: string;
  installation_fee_cents: number;
  installation_waived: boolean;
  payment_method: string;
  notes: string;
  seller_phone: string;
  seller_email: string;
};

// ─────────── PDF builder a partir do form ───────────
function fidelityLabel(v: string) { return FIDELITY_OPTS.find((o) => o.v === v)?.label || v; }
function paymentLabel(v: string) { return PAYMENT_OPTS.find((o) => o.v === v)?.label || v; }
function statusInfo(v: string) { return STATUS_OPTS.find((o) => o.v === v) || STATUS_OPTS[0]; }

function buildPdfDataFromForm(f: FormState, number: number): PropostaPdfData {
  const subtotal = f.items.reduce((s, i) => s + i.priceCents, 0);
  const total = Math.max(0, subtotal - f.discount_cents);
  const addrParts = [
    [f.customer_street, f.customer_number].filter(Boolean).join(", "),
    f.customer_complement,
    f.customer_neighborhood,
    [f.customer_city, f.customer_uf].filter(Boolean).join(" - "),
    f.customer_cep ? `CEP ${f.customer_cep}` : "",
  ].filter(Boolean);
  const items: PropostaItem[] = f.items.map((it) => ({
    name: it.name,
    description: it.description,
    priceCents: it.priceCents,
    includes: it.includes.filter(Boolean),
  }));
  const installationLabel = f.installation_waived
    ? "Isenta"
    : f.installation_fee_cents > 0 ? `${brl(f.installation_fee_cents)} (taxa única)` : "A combinar";
  const validUntilLabel = f.valid_until ? new Date(f.valid_until + "T00:00:00").toLocaleDateString("pt-BR") : undefined;
  return {
    number,
    date: new Date(),
    customer: {
      name: f.customer_name,
      doc: f.customer_doc,
      email: f.customer_email,
      phone: f.customer_phone,
      address: addrParts.join(" • "),
    },
    items,
    subtotalCents: subtotal,
    discountCents: f.discount_cents,
    totalCents: total,
    conditions: {
      fidelityLabel: fidelityLabel(f.fidelity),
      installationLabel,
      paymentLabel: paymentLabel(f.payment_method),
      validUntilLabel,
    },
    notes: f.notes,
    seller: {
      name: f.seller_name,
      phone: f.seller_phone,
      email: f.seller_email,
    },
  };
}

// ─────────── seletor de plano do catálogo ───────────
function PlanPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (it: FormItem) => void }) {
  const { data: plans, isLoading } = usePlans();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const list = plans || [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [plans, search]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar plano do catálogo</DialogTitle>
        </DialogHeader>
        <Input placeholder="Buscar plano..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {isLoading && <div className="text-sm text-muted-foreground py-6 text-center">Carregando...</div>}
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onPick({
                  _key: crypto.randomUUID(),
                  source: "catalog",
                  plan_id: p.id,
                  name: p.name,
                  description: p.description || "",
                  priceCents: p.priceCents,
                  includes: (p.includes || []).map((i) => i.text).filter(Boolean),
                });
                onClose();
              }}
              className="w-full text-left p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground uppercase">{p.category}</div>
              </div>
              <div className="text-primary font-bold whitespace-nowrap">{brl(p.priceCents)}</div>
            </button>
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhum plano encontrado.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────── editor de item customizado ───────────
function CustomItemDialog({
  open, initial, onClose, onSave,
}: { open: boolean; initial?: FormItem | null; onClose: () => void; onSave: (it: FormItem) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceInput, setPriceInput] = useState("0,00");
  const [includesText, setIncludesText] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setDescription(initial?.description || "");
      setPriceInput(centsToInput(initial?.priceCents || 0));
      setIncludesText((initial?.includes || []).join("\n"));
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar item" : "Adicionar item customizado"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome do plano/serviço *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} />
          </div>
          <div>
            <Label>Valor mensal (R$) *</Label>
            <Input value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <Label>Itens inclusos (um por linha)</Label>
            <Textarea value={includesText} onChange={(e) => setIncludesText(e.target.value)} rows={4} placeholder="Wi-Fi 6 grátis&#10;Globoplay incluso" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!name.trim()) { toast.error("Informe o nome"); return; }
              const cents = parseCents(priceInput);
              onSave({
                _key: initial?._key || crypto.randomUUID(),
                source: "custom",
                name: name.trim(),
                description: description.trim(),
                priceCents: cents,
                includes: includesText.split("\n").map((s) => s.trim()).filter(Boolean),
              });
              onClose();
            }}
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────── formulário principal ───────────
function PropostaForm({
  editing, onSaved, onCancel,
}: { editing: Proposal | null; onSaved: () => void; onCancel: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customInitial, setCustomInitial] = useState<FormItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [discountInput, setDiscountInput] = useState("0,00");
  const [installInput, setInstallInput] = useState("0,00");

  // Carrega dados do user logado como vendedor (apenas no novo)
  useEffect(() => {
    if (editing) {
      setForm({
        customer_name: editing.customer_name,
        customer_doc: editing.customer_doc,
        customer_email: editing.customer_email,
        customer_phone: editing.customer_phone,
        customer_cep: editing.customer_cep,
        customer_street: editing.customer_street,
        customer_number: editing.customer_number,
        customer_complement: editing.customer_complement,
        customer_neighborhood: editing.customer_neighborhood,
        customer_city: editing.customer_city,
        customer_uf: editing.customer_uf,
        items: ((editing.items as any[]) || []).map((i, idx) => ({
          _key: crypto.randomUUID(),
          source: i.source || "custom",
          plan_id: i.plan_id,
          name: i.name || "",
          description: i.description || "",
          priceCents: i.priceCents || 0,
          includes: Array.isArray(i.includes) ? i.includes : [],
        })),
        discount_cents: editing.discount_cents,
        fidelity: editing.fidelity,
        installation_fee_cents: editing.installation_fee_cents,
        installation_waived: editing.installation_waived,
        payment_method: editing.payment_method,
        valid_until: editing.valid_until || emptyForm().valid_until,
        notes: editing.notes,
        seller_name: editing.seller_name,
        seller_phone: editing.seller_phone,
        seller_email: editing.seller_email,
      });
      setDiscountInput(centsToInput(editing.discount_cents));
      setInstallInput(centsToInput(editing.installation_fee_cents));
    } else if (user?.email) {
      setForm((f) => ({ ...f, seller_email: user.email || "" }));
    }
  }, [editing, user]);

  const subtotal = form.items.reduce((s, i) => s + i.priceCents, 0);
  const total = Math.max(0, subtotal - form.discount_cents);

  const updateField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const removeItem = (key: string) => setForm((f) => ({ ...f, items: f.items.filter((i) => i._key !== key) }));

  const duplicateItem = (key: string) => {
    setForm((f) => {
      const idx = f.items.findIndex((i) => i._key === key);
      if (idx === -1) return f;
      const original = f.items[idx];
      const copy: FormItem = {
        ...original,
        _key: crypto.randomUUID(),
      };
      const newItems = [...f.items];
      newItems.splice(idx + 1, 0, copy);
      return { ...f, items: newItems };
    });
  };

  // ViaCEP
  async function lookupCep(raw: string) {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await r.json();
      if (data.erro) return;
      setForm((f) => ({
        ...f,
        customer_street: data.logradouro || f.customer_street,
        customer_neighborhood: data.bairro || f.customer_neighborhood,
        customer_city: data.localidade || f.customer_city,
        customer_uf: data.uf || f.customer_uf,
      }));
    } catch {}
  }

  async function handleSubmit() {
    if (!form.customer_name.trim()) { toast.error("Informe o nome do cliente"); return; }
    if (form.items.length === 0) { toast.error("Adicione ao menos um plano"); return; }
    if (!form.seller_name.trim()) { toast.error("Informe o nome do vendedor"); return; }

    setSubmitting(true);
    try {
      const itemsForDb = form.items.map((i) => ({
        source: i.source,
        plan_id: i.plan_id,
        name: i.name,
        description: i.description,
        priceCents: i.priceCents,
        includes: i.includes,
      }));

      const baseRow = {
        customer_name: form.customer_name.trim(),
        customer_doc: form.customer_doc,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        customer_cep: form.customer_cep,
        customer_street: form.customer_street,
        customer_number: form.customer_number,
        customer_complement: form.customer_complement,
        customer_neighborhood: form.customer_neighborhood,
        customer_city: form.customer_city,
        customer_uf: form.customer_uf,
        items: itemsForDb as any,
        subtotal_cents: subtotal,
        discount_cents: form.discount_cents,
        total_cents: total,
        fidelity: form.fidelity,
        installation_fee_cents: form.installation_fee_cents,
        installation_waived: form.installation_waived,
        payment_method: form.payment_method,
        valid_until: form.valid_until || null,
        notes: form.notes,
        seller_id: user?.id || null,
        seller_name: form.seller_name,
        seller_phone: form.seller_phone,
        seller_email: form.seller_email,
      };

      // 1. salva (insert ou update)
      let row: any;
      if (editing) {
        const { data, error } = await supabase
          .from("commercial_proposals")
          .update(baseRow)
          .eq("id", editing.id)
          .select()
          .single();
        if (error) throw error;
        row = data;
      } else {
        const { data, error } = await supabase
          .from("commercial_proposals")
          .insert(baseRow)
          .select()
          .single();
        if (error) throw error;
        row = data;
      }

      // 2. gera PDF
      const pdfBytes = await buildPropostaPdf(buildPdfDataFromForm(form, row.number));
      const fileName = `Proposta-${String(row.number).padStart(4, "0")}-${form.customer_name.replace(/[^\w]+/g, "-").slice(0, 40)}.pdf`;
      const path = `propostas/${row.id}/${fileName}`;
      const { error: upErr } = await supabase.storage
        .from("site-assets")
        .upload(path, new Blob([pdfBytes as BlobPart], { type: "application/pdf" }), { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      const pdf_url = `${pub.publicUrl}?v=${Date.now()}`;

      await supabase.from("commercial_proposals").update({ pdf_url }).eq("id", row.id);

      toast.success(editing ? "Proposta atualizada" : "Proposta criada");
      onSaved();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar proposta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cliente */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">Dados do cliente</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Nome / Razão Social *</Label>
            <Input value={form.customer_name} onChange={(e) => updateField("customer_name", e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>CPF / CNPJ</Label>
            <Input value={form.customer_doc} onChange={(e) => updateField("customer_doc", maskDoc(e.target.value))} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.customer_email} onChange={(e) => updateField("customer_email", e.target.value)} maxLength={255} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.customer_phone} onChange={(e) => updateField("customer_phone", maskPhone(e.target.value))} />
          </div>
          <div>
            <Label>CEP</Label>
            <Input
              value={form.customer_cep}
              onChange={(e) => { const v = maskCep(e.target.value); updateField("customer_cep", v); if (v.length === 9) lookupCep(v); }}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Rua / Logradouro</Label>
            <Input value={form.customer_street} onChange={(e) => updateField("customer_street", e.target.value)} />
          </div>
          <div>
            <Label>Número</Label>
            <Input value={form.customer_number} onChange={(e) => updateField("customer_number", e.target.value)} />
          </div>
          <div>
            <Label>Complemento</Label>
            <Input value={form.customer_complement} onChange={(e) => updateField("customer_complement", e.target.value)} />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input value={form.customer_neighborhood} onChange={(e) => updateField("customer_neighborhood", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Cidade</Label>
              <Input value={form.customer_city} onChange={(e) => updateField("customer_city", e.target.value)} />
            </div>
            <div>
              <Label>UF</Label>
              <Input value={form.customer_uf} onChange={(e) => updateField("customer_uf", e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
            </div>
          </div>
        </div>
      </Card>

      {/* Itens */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Planos da proposta</h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <ListPlus className="h-4 w-4 mr-1" /> Do catálogo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setCustomInitial(null); setCustomOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Customizado
            </Button>
          </div>
        </div>

        {form.items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
            Nenhum plano adicionado.
          </div>
        ) : (
          <div className="space-y-2">
            {form.items.map((it) => (
              <div key={it._key} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{it.name}</span>
                    <Badge variant="outline" className="text-[10px]">{it.source === "catalog" ? "Catálogo" : "Custom"}</Badge>
                  </div>
                  {it.description && <div className="text-xs text-muted-foreground truncate">{it.description}</div>}
                  {it.includes.length > 0 && <div className="text-xs text-muted-foreground">{it.includes.length} item(ns) inclusos</div>}
                </div>
                <div className="font-bold text-primary whitespace-nowrap">{brl(it.priceCents)}</div>
                <Button type="button" variant="ghost" size="icon" onClick={() => { setCustomInitial(it); setCustomOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => duplicateItem(it._key)} title="Duplicar item">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(it._key)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{brl(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Desconto adicional (R$)</span>
            <Input
              className="w-32 text-right"
              value={discountInput}
              onChange={(e) => { setDiscountInput(e.target.value); updateField("discount_cents", parseCents(e.target.value)); }}
            />
          </div>
          <div className="flex justify-between text-lg font-bold text-primary">
            <span>Total mensal</span>
            <span>{brl(total)}</span>
          </div>
        </div>
      </Card>

      {/* Condições */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">Condições comerciais</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Fidelidade</Label>
            <Select value={form.fidelity} onValueChange={(v) => updateField("fidelity", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIDELITY_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Forma de pagamento</Label>
            <Select value={form.payment_method} onValueChange={(v) => updateField("payment_method", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Taxa de instalação (R$)</Label>
            <Input
              disabled={form.installation_waived}
              value={installInput}
              onChange={(e) => { setInstallInput(e.target.value); updateField("installation_fee_cents", parseCents(e.target.value)); }}
            />
            <label className="flex items-center gap-2 mt-2 text-sm">
              <Checkbox checked={form.installation_waived} onCheckedChange={(v) => updateField("installation_waived", !!v)} />
              Isenta
            </label>
          </div>
          <div>
            <Label>Validade da proposta</Label>
            <Input type="date" value={form.valid_until} onChange={(e) => updateField("valid_until", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => updateField("notes", e.target.value)} maxLength={2000} />
          </div>
        </div>
      </Card>

      {/* Vendedor */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4">Vendedor</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Nome *</Label>
            <Input value={form.seller_name} onChange={(e) => updateField("seller_name", e.target.value)} maxLength={120} />
          </div>
          <div>
            <Label>WhatsApp / Telefone</Label>
            <Input value={form.seller_phone} onChange={(e) => updateField("seller_phone", maskPhone(e.target.value))} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.seller_email} onChange={(e) => updateField("seller_email", e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-background/90 backdrop-blur py-3 -mx-2 px-2 border-t">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : <><FileSignature className="h-4 w-4 mr-2" />{editing ? "Atualizar e gerar PDF" : "Gerar proposta"}</>}
        </Button>
      </div>

      <PlanPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(it) => setForm((f) => ({ ...f, items: [...f.items, it] }))}
      />
      <CustomItemDialog
        open={customOpen}
        initial={customInitial}
        onClose={() => setCustomOpen(false)}
        onSave={(it) => setForm((f) => {
          const exists = f.items.some((x) => x._key === it._key);
          return { ...f, items: exists ? f.items.map((x) => x._key === it._key ? it : x) : [...f.items, it] };
        })}
      />
    </div>
  );
}

// ─────────── lista de propostas ───────────
function PropostaList({ onEdit, onNew }: { onEdit: (p: Proposal) => void; onNew: () => void }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["commercial_proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commercial_proposals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Proposal[];
    },
  });

  const filtered = useMemo(() => {
    let list = data || [];
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.customer_name.toLowerCase().includes(q) || String(p.number).includes(q));
    }
    return list;
  }, [data, statusFilter, search]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta proposta?")) return;
    const { error } = await supabase.from("commercial_proposals").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Proposta excluída");
    qc.invalidateQueries({ queryKey: ["commercial_proposals"] });
  }

  async function handleStatus(id: string, status: string) {
    const { error } = await supabase.from("commercial_proposals").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["commercial_proposals"] });
  }

  async function handleDuplicate(p: Proposal) {
    const { id, number, created_at, updated_at, pdf_url, ...rest } = p as any;
    const { data, error } = await supabase
      .from("commercial_proposals")
      .insert({ ...rest, status: "rascunho" })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success(`Proposta duplicada (Nº ${data.number})`);
    qc.invalidateQueries({ queryKey: ["commercial_proposals"] });
    onEdit(data as Proposal);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Buscar por cliente ou nº..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTS.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onNew}><Plus className="h-4 w-4 mr-1" /> Nova proposta</Button>
      </div>

      {isLoading ? (
        <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Nenhuma proposta encontrada.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const st = statusInfo(p.status);
            const expired = p.valid_until && new Date(p.valid_until) < new Date() && p.status !== "aceita";
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">Nº {String(p.number).padStart(4, "0")}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-medium">{p.customer_name}</span>
                      <Badge className={`${st.color} border-0`}>{st.label}</Badge>
                      {expired && <Badge variant="destructive" className="text-[10px]">VENCIDA</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")} • Vendedor: {p.seller_name || "—"}
                      {p.valid_until && ` • Válida até ${new Date(p.valid_until).toLocaleDateString("pt-BR")}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{brl(p.total_cents)}</div>
                    <div className="text-[10px] text-muted-foreground">/mês</div>
                  </div>
                  <Select value={p.status} onValueChange={(v) => handleStatus(p.id, v)}>
                    <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTS.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    {p.pdf_url && (
                      <Button size="icon" variant="outline" asChild title="Baixar PDF">
                        <a href={p.pdf_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button size="icon" variant="outline" onClick={() => onEdit(p)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" onClick={() => handleDuplicate(p)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" onClick={() => handleDelete(p.id)} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────── página ───────────
export default function AdminPropostas() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"nova" | "lista">("lista");
  const [editing, setEditing] = useState<Proposal | null>(null);

  const startNew = () => { setEditing(null); setTab("nova"); };
  const startEdit = (p: Proposal) => { setEditing(p); setTab("nova"); };
  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ["commercial_proposals"] });
    setEditing(null);
    setTab("lista");
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSignature className="h-6 w-6 text-primary" /> Propostas comerciais
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Monte propostas profissionais e exporte em PDF.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="lista">Propostas geradas</TabsTrigger>
          <TabsTrigger value="nova">{editing ? `Editando Nº ${String(editing.number).padStart(4, "0")}` : "Nova proposta"}</TabsTrigger>
        </TabsList>
        <TabsContent value="lista" className="mt-6">
          <PropostaList onEdit={startEdit} onNew={startNew} />
        </TabsContent>
        <TabsContent value="nova" className="mt-6">
          <PropostaForm editing={editing} onSaved={handleSaved} onCancel={() => { setEditing(null); setTab("lista"); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
