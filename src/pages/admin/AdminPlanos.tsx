import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Wifi, PackagePlus, TrendingUp, Blocks, Copy, Check, Upload, X, Link2, AlertTriangle } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { IncludesEditor, type IncludeItem } from "@/components/admin/IncludesEditor";
import { AVAILABLE_ICONS, PlanIncludeIcon } from "@/components/shop/PlanIncludeIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DraggableTable } from "@/components/admin/DraggableTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoneyInput } from "@/components/ui/money-input";
import { PLAN_ACCENTS, getPlanAccent } from "@/lib/planAccent";
import { cn } from "@/lib/utils";
import { Layers, PackageOpen, Server } from "lucide-react";
import { ComboSectionTab } from "@/components/admin/ComboSectionTab";
import { RbxPlanosTab } from "@/components/admin/RbxPlanosTab";
import AdminMapeamentoPlanos from "@/pages/admin/AdminMapeamentoPlanos";

const PLAN_TYPES = [
  { value: "plano", label: "Planos", icon: Wifi, hint: "Planos avulsos exibidos no site (Fibra, Móvel, TV)" },
  { value: "combo", label: "Combos", icon: PackagePlus, hint: "Pacotes combinados de serviços com desconto" },
  { value: "upsell", label: "Upsell", icon: TrendingUp, hint: "Ofertas adicionais exibidas como order bump nos planos" },
  { value: "sva", label: "SVA's", icon: Blocks, hint: "Serviços de valor agregado (streaming, antivírus, etc.)" },
] as const;

type PlanType = typeof PLAN_TYPES[number]["value"];

type Plan = {
  id: string;
  type: string;
  category: string;
  name: string;
  price_cents: number;
  original_price_cents: number;
  description: string;
  conditions: string;
  includes: any[];
  badges: string[];
  sort_order: number;
  active: boolean;
  icon: string;
  logo_url: string;
  sva_ids: string[];
  accent_color: string;
  accent_label: string;
  combo_discount_percent: number;
  combo_price_cents: number;
  combo_highlight_text: string;
  chip_type: string;
  portability_gb: number;
  portability_label: string;
  promo_months: number;
};

const emptyPlan: Omit<Plan, "id"> = {
  type: "plano",
  category: "fibra", name: "", price_cents: 0, original_price_cents: 0, description: "", conditions: "",
  includes: [], badges: [], sort_order: 0, active: true, icon: "check", logo_url: "", sva_ids: [], accent_color: "", accent_label: "",
  combo_discount_percent: 0, combo_price_cents: 0, combo_highlight_text: "", chip_type: "5g", portability_gb: 0, portability_label: "",
  promo_months: 0,
};

const CATEGORY_FILTERS: Record<PlanType, { value: string; label: string }[]> = {
  plano: [
    { value: "all", label: "Todas" },
    { value: "fibra", label: "Fibra" },
    { value: "movel", label: "Móvel" },
    { value: "tv", label: "TV" },
    { value: "empresarial", label: "Empresarial" },
  ],
  combo: [
    { value: "all", label: "Todas" },
    { value: "combo", label: "Combo" },
    { value: "fibra", label: "Fibra" },
    { value: "movel", label: "Móvel" },
  ],
  upsell: [{ value: "all", label: "Todas" }],
  sva: [{ value: "all", label: "Todas" }],
};

function AdminPlanosContent() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<PlanType>("plano");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Plan | null>(null);
  const [form, setForm] = React.useState(emptyPlan);
  const [includesItems, setIncludesItems] = React.useState<IncludeItem[]>([]);
  const [badgesText, setBadgesText] = React.useState("");
  const [selectedSvaIds, setSelectedSvaIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setCategoryFilter("all");
  }, [activeTab]);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("sort_order");
      if (error) throw error;
      return data as Plan[];
    },
  });

  const availableSvas = React.useMemo(() => plans.filter((p) => (p as any).type === "sva" && p.active), [plans]);

  // Bindings RBX×Operadora — usados para indicar status nos planos móveis
  const { data: bindings = [] } = useQuery({
    queryKey: ["admin-rbx-bindings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mvno_rbx_plan_map")
        .select("rbx_plan_codigo, plan_id, sim_kind, provider, product_sku, eai_plan_id, active");
      if (error) throw error;
      return (data || []) as Array<{
        rbx_plan_codigo: string | null; plan_id: string | null; sim_kind: string;
        provider: string; product_sku: string | null; eai_plan_id: string | null; active: boolean;
      }>;
    },
  });

  function getPlanMappingStatus(plan: Plan): "complete" | "partial" | "missing" | "n/a" {
    if (plan.category !== "movel" && plan.category !== "mobile") return "n/a";
    const rbxCodigo = (plan as any).rbx_plan_codigo as string | null | undefined;
    const candidate = bindings.filter((b) => b.active !== false && (
      (rbxCodigo && b.rbx_plan_codigo === rbxCodigo) || (!rbxCodigo && b.plan_id === plan.id)
    ));
    const check = (sim: string) => {
      const b = candidate.find((r) => r.sim_kind === sim);
      if (!b) return "missing";
      const hasProd = (b.provider === "algar" && !!b.product_sku) || (b.provider === "eai" && !!b.eai_plan_id);
      return hasProd ? "complete" : "partial";
    };
    const e = check("esim");
    const p = check("physical");
    if (!rbxCodigo && e === "missing" && p === "missing") return "missing";
    if (e === "complete" && p === "complete") return "complete";
    if (e === "missing" && p === "missing") return "partial"; // tem RBX mas sem operadora
    return "partial";
  }

  const saveMutation = useMutation({
    mutationFn: async (plan: Omit<Plan, "id"> & { id?: string }) => {
      const payload = { ...plan, includes: plan.includes, badges: plan.badges };
      if (plan.id) {
        const { error } = await supabase.from("plans").update(payload as any).eq("id", plan.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = payload as any;
        const { error } = await supabase.from("plans").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans"] }); toast.success("Plano salvo!"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("plans").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans"] }); toast.success("Plano removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase.from("plans").update({ sort_order: u.sort_order }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans"] }); toast.success("Ordem atualizada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null); setForm({ ...emptyPlan, type: activeTab }); setIncludesItems([]); setBadgesText("");
    setSelectedSvaIds([]); setOpen(true);
  };

  const duplicatePlan = (p: Plan) => {
    setEditing(null);
    setForm({ type: p.type, category: p.category, name: `${p.name} (cópia)`, price_cents: p.price_cents, original_price_cents: p.original_price_cents ?? 0, description: p.description, conditions: (p as any).conditions || "", includes: p.includes, badges: p.badges, sort_order: p.sort_order + 1, active: false, icon: (p as any).icon || "check", logo_url: (p as any).logo_url || "", sva_ids: (p as any).sva_ids || [], accent_color: (p as any).accent_color || "", accent_label: (p as any).accent_label || "", combo_discount_percent: Number((p as any).combo_discount_percent) || 0, combo_price_cents: Number((p as any).combo_price_cents) || 0, combo_highlight_text: (p as any).combo_highlight_text || "", chip_type: (p as any).chip_type || "5g", portability_gb: Number((p as any).portability_gb) || 0, portability_label: (p as any).portability_label || "", promo_months: Number((p as any).promo_months) || 0 });
    const rawIncludes = (p.includes as any[]) || [];
    setIncludesItems(rawIncludes.map((item: any) =>
      typeof item === "string" ? { icon: "check", text: item } : { icon: item.icon || "check", text: item.text || "" }
    ));
    setBadgesText((p.badges || []).join(", "));
    setSelectedSvaIds((p as any).sva_ids || []);
    setOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({ type: p.type, category: p.category, name: p.name, price_cents: p.price_cents, original_price_cents: p.original_price_cents ?? 0, description: p.description, conditions: (p as any).conditions || "", includes: p.includes, badges: p.badges, sort_order: p.sort_order, active: p.active, icon: (p as any).icon || "check", logo_url: (p as any).logo_url || "", sva_ids: (p as any).sva_ids || [], accent_color: (p as any).accent_color || "", accent_label: (p as any).accent_label || "", combo_discount_percent: Number((p as any).combo_discount_percent) || 0, combo_price_cents: Number((p as any).combo_price_cents) || 0, combo_highlight_text: (p as any).combo_highlight_text || "", chip_type: (p as any).chip_type || "5g", portability_gb: Number((p as any).portability_gb) || 0, portability_label: (p as any).portability_label || "", promo_months: Number((p as any).promo_months) || 0 });
    const rawIncludes = (p.includes as any[]) || [];
    setIncludesItems(rawIncludes.map((item: any) =>
      typeof item === "string" ? { icon: "check", text: item } : { icon: item.icon || "check", text: item.text || "" }
    ));
    setBadgesText((p.badges || []).join(", "));
    setSelectedSvaIds((p as any).sva_ids || []);
    setOpen(true);
  };

  const [uploading, setUploading] = React.useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `plan-logos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      setForm((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success("Logo enviado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    const includes = includesItems.filter((i) => i.text.trim());
    const badges = badgesText.split(",").map((s) => s.trim()).filter(Boolean);
    const sva_ids = form.type !== "sva" ? selectedSvaIds : [];

    // Aviso: salvar plano móvel ativo sem mapeamento completo impede provisionamento automático
    const isMobile = (form.category === "movel" || form.category === "mobile") && form.type === "plano";
    if (isMobile && form.active && editing?.id) {
      const status = getPlanMappingStatus(editing as Plan);
      if (status !== "complete") {
        const msg =
          status === "missing"
            ? "Este plano móvel ainda NÃO está mapeado para nenhuma operadora.\n\nPedidos do checkout não serão provisionados automaticamente até você configurar o mapeamento em /admin/planos-mapeamento.\n\nDeseja salvar mesmo assim?"
            : "O mapeamento deste plano móvel está incompleto (faltam vínculos para eSIM, físico ou RBX).\n\nAlguns pedidos podem falhar no provisionamento. Configure em /admin/planos-mapeamento.\n\nDeseja salvar mesmo assim?";
        if (!confirm(msg)) return;
      }
    }

    saveMutation.mutate({ ...form, includes, badges, sva_ids, ...(editing ? { id: editing.id } : {}) });
  };


  const formatBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Planos & Produtos"
        subtitle="Gerencie planos, combos, upsells e SVA's"
        onNew={openNew}
        newLabel={`Novo ${PLAN_TYPES.find((t) => t.value === activeTab)?.label.replace(/s$/, "") ?? "Item"}`}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PlanType)}>
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          {PLAN_TYPES.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs sm:text-sm"><t.icon className="h-3.5 w-3.5" /> {t.label}</TabsTrigger>
          ))}
        </TabsList>

        {PLAN_TYPES.map((t) => {
          const baseFiltered = plans.filter((p) => (p as any).type === t.value);
          const filters = CATEGORY_FILTERS[t.value];
          const showFilters = filters.length > 1 && t.value === activeTab;
          const filtered = (showFilters && categoryFilter !== "all")
            ? baseFiltered.filter((p) => p.category === categoryFilter)
            : baseFiltered;
          return (
            <TabsContent key={t.value} value={t.value} className="space-y-4">
              {showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground mr-1">Filtrar por categoria:</span>
                  {filters.map((f) => {
                    const count = f.value === "all"
                      ? baseFiltered.length
                      : baseFiltered.filter((p) => p.category === f.value).length;
                    const selected = categoryFilter === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setCategoryFilter(f.value)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 text-foreground hover:bg-muted border-border"
                        )}
                      >
                        {f.label} <span className="opacity-70">({count})</span>
                      </button>
                    );
                  })}
                  {categoryFilter !== "all" && (
                    <span className="text-xs text-muted-foreground italic ml-1">
                      Arraste para reordenar dentro desta categoria
                    </span>
                  )}
                </div>
              )}
              <DraggableTable
                data={filtered}
                isLoading={isLoading}
                columns={["Nome", "Categoria", "Tipo", "Valor Original", "Valor Promocional", "Status"]}
                colSpan={6}
                onReorder={(updates) => reorderMutation.mutate(updates)}
                emptyIcon={t.icon}
                emptyMessage={`Nenhum ${t.label.replace(/s$/, "").toLowerCase()} cadastrado nesta categoria.`}
                renderRow={(p) => {
                  const mapStatus = getPlanMappingStatus(p);
                  return (
                  <>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        {mapStatus === "complete" && (
                          <Tooltip><TooltipTrigger asChild>
                            <RouterLink to="/admin/planos-mapeamento" className="inline-flex"><Link2 className="h-3.5 w-3.5 text-emerald-600" /></RouterLink>
                          </TooltipTrigger><TooltipContent>Mapeado (MVNO + RBX)</TooltipContent></Tooltip>
                        )}
                        {mapStatus === "partial" && (
                          <Tooltip><TooltipTrigger asChild>
                            <RouterLink to="/admin/planos-mapeamento" className="inline-flex"><AlertTriangle className="h-3.5 w-3.5 text-amber-600" /></RouterLink>
                          </TooltipTrigger><TooltipContent>Mapeamento parcial — clique para configurar</TooltipContent></Tooltip>
                        )}
                        {mapStatus === "missing" && (
                          <Tooltip><TooltipTrigger asChild>
                            <RouterLink to="/admin/planos-mapeamento" className="inline-flex"><AlertTriangle className="h-3.5 w-3.5 text-destructive" /></RouterLink>
                          </TooltipTrigger><TooltipContent>Sem mapeamento — clique para configurar</TooltipContent></Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {p.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      {p.chip_type ? (
                        <span className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide border",
                          p.chip_type === "black"
                            ? "bg-gray-900 text-yellow-400 border-yellow-500/30"
                            : "bg-muted/60 text-foreground border-border"
                        )}>
                          {p.chip_type}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {(p.original_price_cents ?? 0) > 0 ? (
                        <span className="line-through text-muted-foreground">{formatBRL(p.original_price_cents)}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold">{formatBRL(p.price_cents)}</TableCell>
                    <TableCell><StatusBadge active={p.active} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => duplicatePlan(p)}><Copy className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Duplicar</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => { if (confirm("Remover item?")) deleteMutation.mutate(p.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                      </div>
                    </TableCell>
                  </>
                  );
                }}
              />
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {editing ? "Editar" : "Novo"} {PLAN_TYPES.find((t) => t.value === activeTab)?.label.replace(/s$/, "")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            {form.type === "sva" && (
              <>
                <div className="space-y-2">
                  <Label>Ícone do SVA</Label>
                  <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                    <SelectTrigger className="w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <PlanIncludeIcon icon={form.icon} className="h-3.5 w-3.5" />
                        <span className="truncate text-xs">{form.icon}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {AVAILABLE_ICONS.map((ic) => (
                        <SelectItem key={ic} value={ic}>
                          <div className="flex items-center gap-2">
                            <PlanIncludeIcon icon={ic} className="h-3.5 w-3.5" />
                            <span className="text-xs">{ic}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Ícone fallback quando não há logo.</p>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Logo / Imagem (opcional)</Label>
              {form.logo_url ? (
                <div className="flex items-center gap-3">
                  <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded-md object-contain border bg-white p-0.5" />
                  <Button type="button" variant="ghost" size="sm" className="gap-1 text-destructive hover:bg-destructive/10" onClick={() => setForm({ ...form, logo_url: "" })}>
                    <X className="h-3.5 w-3.5" /> Remover
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando..." : "Upload de imagem"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                </label>
              )}
              <p className="text-xs text-muted-foreground">Imagem opcional do plano (logo do canal, capa do pacote etc).</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLAN_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-1.5"><t.icon className="h-3.5 w-3.5" /> {t.label.replace(/s$/, "")}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{PLAN_TYPES.find((t) => t.value === form.type)?.hint}</p>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fibra">Fibra</SelectItem>
                    <SelectItem value="movel">Móvel</SelectItem>
                    <SelectItem value="tv">TV</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
                {form.category === "movel" && (
                  <div className="space-y-1 pt-2">
                    <Label className="text-xs text-muted-foreground">Tipo de chip (seção "Lançamento Chip")</Label>
                    <Select value={form.chip_type || "5g"} onValueChange={(v) => setForm({ ...form, chip_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5g">Chip 5G</SelectItem>
                        <SelectItem value="black">5G Black</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {form.category === "movel" && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Gigas extras na portabilidade</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.portability_gb}
                        onChange={(e) => setForm({ ...form, portability_gb: Number(e.target.value) || 0 })}
                        placeholder="Ex: 100"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Texto exibido (opcional)</Label>
                      <Input
                        value={form.portability_label}
                        onChange={(e) => setForm({ ...form, portability_label: e.target.value })}
                        placeholder={form.portability_gb > 0 ? `+${form.portability_gb}GB na portabilidade` : "+100GB na portabilidade"}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2"><Label>Ordem</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Original</Label>
                <MoneyInput valueCents={form.original_price_cents} onChangeCents={(c) => setForm({ ...form, original_price_cents: c })} />
                <p className="text-xs text-muted-foreground">Preço cheio ("de"). Deixe vazio se não houver.</p>
              </div>
              <div className="space-y-2">
                <Label>Valor Promocional</Label>
                <MoneyInput valueCents={form.price_cents} onChangeCents={(c) => setForm({ ...form, price_cents: c })} />
                <p className="text-xs text-muted-foreground">Preço atual cobrado ("por").</p>
              </div>
            </div>
            <div className="rounded-lg border border-dashed bg-muted/30 p-3 space-y-2">
              <Label className="text-sm">Regra do valor promocional</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  className="w-24"
                  value={form.promo_months}
                  onChange={(e) => setForm({ ...form, promo_months: Math.max(0, Number(e.target.value) || 0) })}
                />
                <span className="text-sm text-muted-foreground">meses no valor promocional. Após esse período, volta ao Valor Original.</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Use <strong>0</strong> para promocional permanente (sem regra de meses).
                {form.promo_months > 0 && form.original_price_cents > 0 && (
                  <> Exibido: <strong>{formatBRL(form.price_cents)}/mês</strong> nos primeiros {form.promo_months} meses, depois <strong>{formatBRL(form.original_price_cents)}/mês</strong>.</>
                )}
              </p>
            </div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Ex: Ideal para 3 pessoas, streaming e games" /><p className="text-xs text-muted-foreground">Texto auxiliar exibido abaixo do nome do plano nos cards (opcional).</p></div>
            <div className="space-y-2"><Label>Condições</Label><Textarea value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} rows={2} placeholder="Ex: Fidelidade de 12 meses. Multa proporcional em caso de cancelamento." /><p className="text-xs text-muted-foreground">Texto de condições exibido abaixo do plano (opcional).</p></div>
            <div className="space-y-2"><Label>Itens inclusos</Label><IncludesEditor value={includesItems} onChange={setIncludesItems} /></div>
            {form.type !== "sva" && availableSvas.length > 0 && (
              <div className="space-y-2">
                <Label>SVA's inclusos (opcional)</Label>
                <div className="rounded-lg border p-3 space-y-2">
                  {availableSvas.map((sva) => {
                    const checked = selectedSvaIds.includes(sva.id);
                    return (
                      <button
                        key={sva.id}
                        type="button"
                        onClick={() => setSelectedSvaIds((prev) => checked ? prev.filter((id) => id !== sva.id) : [...prev, sva.id])}
                        className={`flex w-full items-center gap-3 rounded-md border p-2.5 text-left text-sm transition-colors ${checked ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"}`}
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                          {checked && <Check className="h-3 w-3" />}
                        </div>
                        {(sva as any).logo_url ? (
                          <img src={(sva as any).logo_url} alt={sva.name} className="h-4 w-4 shrink-0 rounded-sm object-contain" />
                        ) : (
                          <PlanIncludeIcon icon={(sva as any).icon || "blocks"} className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="flex-1 truncate font-medium">{sva.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatBRL(sva.price_cents)}/mês</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">SVA's selecionados serão exibidos como itens inclusos no card do plano.</p>
              </div>
            )}
            <div className="space-y-2"><Label>Badges (separados por vírgula)</Label><Input value={badgesText} onChange={(e) => setBadgesText(e.target.value)} placeholder="Mais vendido, Oferta" /></div>
            <div className="space-y-2">
              <Label>Cor de destaque do card</Label>
              <Select value={form.accent_color || "__default__"} onValueChange={(v) => setForm({ ...form, accent_color: v === "__default__" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue>
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("inline-block h-3 w-3 rounded-full border", getPlanAccent(form.accent_color).swatch)} />
                      {getPlanAccent(form.accent_color).label}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLAN_ACCENTS.map((a) => (
                    <SelectItem key={a.value || "__default__"} value={a.value || "__default__"}>
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("inline-block h-3 w-3 rounded-full border", a.swatch)} />
                        {a.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Aplica borda, badge "MELHOR OFERTA" e brilho do canto na cor escolhida. "Padrão" usa o estilo automático baseado nos badges.</p>
            </div>
            <div className="space-y-2">
              <Label>Texto do destaque</Label>
              <Input
                value={form.accent_label}
                onChange={(e) => setForm({ ...form, accent_label: e.target.value })}
                placeholder="MELHOR OFERTA"
              />
              <p className="text-xs text-muted-foreground">Texto exibido no badge superior do card quando há cor de destaque. Deixe vazio para usar "MELHOR OFERTA".</p>
            </div>
            <div className="grid gap-4 rounded-lg border border-dashed border-border p-4 sm:grid-cols-2">
              <div className="sm:col-span-2 -mb-2">
                <Label className="text-sm font-semibold">Incentivo de combo (Monte seu Combo)</Label>
                <p className="text-xs text-muted-foreground">Aparece quando o cliente escolhe Fibra + este plano (ideal para planos móveis).</p>
              </div>
              <div className="space-y-2">
                <Label>% desconto no combo</Label>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  value={form.combo_discount_percent}
                  onChange={(e) => setForm({ ...form, combo_discount_percent: Math.max(0, Math.min(90, Number(e.target.value) || 0)) })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Ex: 30 = 30% off no preço quando comprado em combo com Fibra.</p>
              </div>
              <div className="space-y-2">
                <Label>Texto destaque no combo</Label>
                <Input
                  value={form.combo_highlight_text}
                  onChange={(e) => setForm({ ...form, combo_highlight_text: e.target.value })}
                  placeholder="Mais vendido em combo"
                />
                <p className="text-xs text-muted-foreground">Frase curta opcional exibida no card do combo.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Valor fixo no combo</Label>
                <MoneyInput
                  valueCents={form.combo_price_cents}
                  onChangeCents={(c) => setForm({ ...form, combo_price_cents: c })}
                  placeholder="R$ 0,00"
                />
                <p className="text-xs text-muted-foreground">Se preenchido, este valor será usado no lugar do preço original quando o plano for adicionado a um combo. Tem prioridade sobre o % de desconto.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Ativo</Label>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white shadow-lg shadow-primary/25"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPlanos() {
  return (
    <Tabs defaultValue="planos" className="w-full space-y-6">
      <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="planos" className="gap-1.5 text-xs sm:text-sm">
          <PackageOpen className="h-3.5 w-3.5" /> Planos & Produtos
        </TabsTrigger>
        <TabsTrigger value="combo" className="gap-1.5 text-xs sm:text-sm">
          <Layers className="h-3.5 w-3.5" /> Monte seu Combo
        </TabsTrigger>
        <TabsTrigger value="rbx" className="gap-1.5 text-xs sm:text-sm">
          <Server className="h-3.5 w-3.5" /> Planos RBX
        </TabsTrigger>
        <TabsTrigger value="mapeamento" className="gap-1.5 text-xs sm:text-sm">
          <Link2 className="h-3.5 w-3.5" /> Mapeamento
        </TabsTrigger>
      </TabsList>
      <TabsContent value="planos" className="mt-0">
        <AdminPlanosContent />
      </TabsContent>
      <TabsContent value="combo" className="mt-0">
        <AdminPageHeader title="Monte seu Combo" subtitle="Configurações da seção de combo personalizado" />
        <div className="mt-6">
          <ComboSectionTab />
        </div>
      </TabsContent>
      <TabsContent value="rbx" className="mt-0">
        <RbxPlanosTab />
      </TabsContent>
      <TabsContent value="mapeamento" className="mt-0">
        <AdminMapeamentoPlanos />
      </TabsContent>
    </Tabs>
  );
}
