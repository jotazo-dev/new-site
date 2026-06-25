import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { algarCall, listProducts, type AlgarProduct } from "@/components/admin/esim/algar/algarClient";
import { eaiCall, extractList as extractEaiList } from "@/components/admin/esim/eai/eaiClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Server, ShoppingBag, Filter } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";

type Provider = "algar" | "eai";
type SimKind = "esim" | "physical";

type SitePlan = { id: string; name: string; category: string; rbx_plan_codigo: string | null };

type Binding = {
  id?: string;
  provider: Provider;
  rbx_plan_codigo: string;
  sim_kind: SimKind;
  product_sku: string | null;
  eai_plan_id: string | null;
  eai_plan_name: string | null;
  rbx_plan_label: string | null;
  active: boolean;
};

type AlgarCacheRow = { sku: string; name: string; fetched_at: string };
type EaiCacheRow = { eai_plan_id: string; name: string; price_cents: number | null; fetched_at: string };
type RbxKind = "fibra" | "movel" | null;
type RbxCacheRow = { codigo: string; descricao: string; valor_cents: number | null; fetched_at: string; kind: RbxKind };

const db = supabase as any;

export default function AdminMapeamentoPlanos() {
  const [loading, setLoading] = useState(true);
  const [sitePlans, setSitePlans] = useState<SitePlan[]>([]);
  // bindings indexed by `${rbxCodigo}::${simKind}`
  const [bindings, setBindings] = useState<Map<string, Binding>>(new Map());
  const [algarCache, setAlgarCache] = useState<AlgarCacheRow[]>([]);
  const [eaiCache, setEaiCache] = useState<EaiCacheRow[]>([]);
  const [rbxCache, setRbxCache] = useState<RbxCacheRow[]>([]);
  const [syncing, setSyncing] = useState<null | "algar" | "eai" | "rbx" | "all">(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "fibra" | "movel">("all");

  function matchesCategory(text: string): boolean {
    const t = text.toLowerCase();
    if (categoryFilter === "fibra") return /(fibra|fiber|gpon|internet\s*fixa|banda\s*larga)/i.test(t);
    if (categoryFilter === "movel") return /(m[óo]vel|mobile|chip|5g|4g|gb|giga|linha)/i.test(t);
    return true;
  }

  const bindKey = (codigo: string, sim: SimKind) => `${codigo}::${sim}`;

  async function load() {
    setLoading(true);
    const [planRes, mapRes, algarRes, eaiRes, rbxRes] = await Promise.all([
      db.from("plans").select("id, name, category, rbx_plan_codigo").eq("active", true).order("sort_order"),
      db.from("mvno_rbx_plan_map").select("*"),
      db.from("algar_products_cache").select("sku, name, fetched_at").order("name"),
      db.from("eai_plans_cache").select("eai_plan_id, name, price_cents, fetched_at").order("name"),
      db.from("rbx_plans_cache").select("codigo, descricao, valor_cents, fetched_at, kind").order("descricao"),
    ]);

    setSitePlans((planRes.data as SitePlan[]) || []);

    const m = new Map<string, Binding>();
    for (const row of (mapRes.data || []) as Binding[]) {
      if (!row.rbx_plan_codigo) continue;
      m.set(bindKey(row.rbx_plan_codigo, row.sim_kind || "esim"), row);
    }
    setBindings(m);

    setAlgarCache((algarRes.data as AlgarCacheRow[]) || []);
    setEaiCache((eaiRes.data as EaiCacheRow[]) || []);
    setRbxCache((rbxRes.data as RbxCacheRow[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // -------- Sync --------

  async function syncAlgar() {
    setSyncing("algar");
    try {
      const list = await listProducts(true);
      if (!list.length) { toast.warning("Algar retornou catálogo vazio"); return; }
      const rows = list.filter((p) => p.sku).map((p) => ({
        sku: String(p.sku),
        name: p.name || p.description || p.sku,
        raw: p as any,
        fetched_at: new Date().toISOString(),
      }));
      const { error } = await db.from("algar_products_cache").upsert(rows, { onConflict: "sku" });
      if (error) throw error;
      toast.success(`Algar: ${rows.length} produtos sincronizados`);
    } catch (e: any) { toast.error(`Algar: ${e.message}`); }
    finally { setSyncing(null); load(); }
  }

  async function syncEai() {
    setSyncing("eai");
    try {
      const res = await eaiCall<any>("/rest/service_eai/mvno_plans");
      if (!res.ok) throw new Error(res.error || `EAÍ status ${res.status}`);
      const list = extractEaiList(res);
      if (!list.length) { toast.warning("EAÍ retornou catálogo vazio"); return; }
      const rows = list.map((p: any) => {
        const id = String(p.id ?? p.plan_id ?? p.uuid ?? p.code ?? "").trim();
        if (!id) return null;
        const priceRaw = p.price_cents ?? p.price ?? p.value ?? null;
        return {
          eai_plan_id: id,
          name: String(p.name ?? p.description ?? id),
          price_cents: priceRaw == null ? null
            : typeof priceRaw === "number" && priceRaw < 10000 ? Math.round(priceRaw * 100)
              : Math.round(Number(priceRaw)),
          raw: p,
          fetched_at: new Date().toISOString(),
        };
      }).filter(Boolean);
      const { error } = await db.from("eai_plans_cache").upsert(rows, { onConflict: "eai_plan_id" });
      if (error) throw error;
      toast.success(`EAÍ: ${rows.length} planos sincronizados`);
    } catch (e: any) { toast.error(`EAÍ: ${e.message}`); }
    finally { setSyncing(null); load(); }
  }

  async function syncRbx() {
    setSyncing("rbx");
    try {
      const { data, error } = await supabase.functions.invoke("rbx-list-planos", { body: {} });
      if (error) throw error;
      const payload = data as any;
      if (!payload?.ok) throw new Error(payload?.message || "Falha RBX");
      const list: any[] = payload.planos || [];
      if (!list.length) { toast.warning("RBX retornou catálogo vazio"); return; }
      const rows = list.map((p) => {
        const codigo = String(p.codigo ?? p.Codigo ?? p.id ?? "").trim();
        if (!codigo) return null;
        const desc = String(p.descricao ?? p.Descricao ?? p.nome ?? p.Nome ?? codigo);
        const valorRaw = p.valor ?? p.Valor ?? p.preco ?? null;
        return {
          codigo,
          descricao: desc,
          valor_cents: valorRaw == null ? null : Math.round(Number(String(valorRaw).replace(",", ".")) * 100),
          raw: p,
          fetched_at: new Date().toISOString(),
        };
      }).filter(Boolean);
      const { error: upErr } = await db.from("rbx_plans_cache").upsert(rows, { onConflict: "codigo" });
      if (upErr) throw upErr;
      toast.success(`RBX: ${rows.length} planos sincronizados`);
    } catch (e: any) { toast.error(`RBX: ${e.message}`); }
    finally { setSyncing(null); load(); }
  }

  async function syncAll() {
    setSyncing("all");
    await syncAlgar(); await syncEai(); await syncRbx();
    setSyncing(null);
  }

  // -------- Mutations --------

  async function saveBinding(rbxCodigo: string, sim: SimKind, patch: Partial<Binding>) {
    const key = bindKey(rbxCodigo, sim);
    const existing = bindings.get(key);
    const next: Binding = {
      id: existing?.id,
      provider: patch.provider ?? existing?.provider ?? "algar",
      rbx_plan_codigo: rbxCodigo,
      sim_kind: sim,
      product_sku: patch.product_sku ?? existing?.product_sku ?? null,
      eai_plan_id: patch.eai_plan_id ?? existing?.eai_plan_id ?? null,
      eai_plan_name: patch.eai_plan_name ?? existing?.eai_plan_name ?? null,
      rbx_plan_label: rbxCache.find((r) => r.codigo === rbxCodigo)?.descricao ?? existing?.rbx_plan_label ?? null,
      active: patch.active ?? existing?.active ?? true,
    };

    const newMap = new Map(bindings);
    newMap.set(key, next);
    setBindings(newMap);

    const payload = { ...next, last_synced_at: new Date().toISOString() };
    const { data, error } = existing?.id
      ? await db.from("mvno_rbx_plan_map").update(payload).eq("id", existing.id).select().maybeSingle()
      : await db.from("mvno_rbx_plan_map").insert(payload).select().maybeSingle();

    if (error) { toast.error(`Erro: ${error.message}`); load(); return; }
    if (data) {
      newMap.set(key, data as Binding);
      setBindings(new Map(newMap));
      toast.success("Vínculo salvo");
    }
  }

  async function clearBinding(rbxCodigo: string, sim: SimKind) {
    const key = bindKey(rbxCodigo, sim);
    const existing = bindings.get(key);
    if (!existing?.id) return;
    const { error } = await db.from("mvno_rbx_plan_map").delete().eq("id", existing.id);
    if (error) { toast.error(error.message); return; }
    const m = new Map(bindings); m.delete(key); setBindings(m);
    toast.success("Vínculo removido");
  }

  async function setSitePlanRbx(planId: string, codigo: string | null) {
    // Optimistic
    setSitePlans((sp) => sp.map((p) => p.id === planId ? { ...p, rbx_plan_codigo: codigo } : p));
    const { error } = await db.from("plans").update({ rbx_plan_codigo: codigo }).eq("id", planId);
    if (error) { toast.error(error.message); load(); return; }
    toast.success("Plano do site atualizado");
  }

  // -------- Helpers --------

  function bindingStatus(rbxCodigo: string, sim: SimKind) {
    const b = bindings.get(bindKey(rbxCodigo, sim));
    if (!b) return "missing" as const;
    const hasProduct = (b.provider === "algar" && !!b.product_sku) || (b.provider === "eai" && !!b.eai_plan_id);
    return hasProduct && b.active ? ("complete" as const) : ("partial" as const);
  }

  function isFiberCategory(category: string) {
    const c = (category || "").toLowerCase();
    return /(fibra|fiber|internet|fixa|tv|combo)/.test(c) && !/(m[óo]vel|mobile|chip|5g|4g)/.test(c);
  }

  function siteStatus(plan: SitePlan): "complete" | "partial" | "missing" {
    if (!plan.rbx_plan_codigo) return "missing";
    // Fibra: vinculo com RBX já é suficiente (provisionada pela Jotazo, sem MVNO)
    if (isFiberCategory(plan.category)) return "complete";
    const isMobile = plan.category === "movel" || plan.category === "mobile";
    const sims: SimKind[] = isMobile ? ["esim", "physical"] : ["esim"];
    const stats = sims.map((s) => bindingStatus(plan.rbx_plan_codigo!, s));
    if (stats.every((s) => s === "complete")) return "complete";
    if (stats.every((s) => s === "missing")) return "partial";
    return "partial";
  }

  function statusBadge(status: "complete" | "partial" | "missing", labels?: Partial<Record<"complete"|"partial"|"missing", string>>) {
    if (status === "complete") return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/>{labels?.complete ?? "Completo"}</Badge>;
    if (status === "partial") return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 hover:bg-amber-500/20"><AlertTriangle className="w-3 h-3 mr-1"/>{labels?.partial ?? "Parcial"}</Badge>;
    return <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20"><XCircle className="w-3 h-3 mr-1"/>{labels?.missing ?? "Faltando"}</Badge>;
  }

  function formatWhen(iso?: string) { return iso ? new Date(iso).toLocaleString("pt-BR") : "nunca"; }

  const lastAlgar = algarCache[0]?.fetched_at;
  const lastEai = eaiCache[0]?.fetched_at;
  const lastRbx = rbxCache[0]?.fetched_at;

  // Detectar se um plano RBX é de fibra:
  // 1) override manual em rbx_plans_cache.kind tem prioridade absoluta
  // 2) descrição com palavras-chave de fibra
  // 3) vinculado a plano do site com categoria fibra/internet/tv/combo
  const isFiberRbx = (codigo: string, descricao: string, kind: RbxKind) => {
    if (kind === "fibra") return true;
    if (kind === "movel") return false;
    if (/(fibra|fiber|gpon|internet\s*fixa|banda\s*larga)/i.test(descricao)) return true;
    const linkedSite = sitePlans.find((p) => p.rbx_plan_codigo === codigo);
    if (linkedSite) {
      const c = (linkedSite.category || "").toLowerCase();
      if (/(fibra|fiber|internet|fixa|tv|combo)/.test(c)) return true;
    }
    return false;
  };

  async function setRbxKind(codigo: string, kind: RbxKind) {
    // Optimistic
    setRbxCache((rc) => rc.map((r) => r.codigo === codigo ? { ...r, kind } : r));
    // Se virou fibra, limpa bindings MVNO (eSIM/Físico) atrelados a esse RBX
    if (kind === "fibra") {
      const toDelete = Array.from(bindings.values()).filter((b) => b.rbx_plan_codigo === codigo && b.id);
      if (toDelete.length) {
        await db.from("mvno_rbx_plan_map").delete().in("id", toDelete.map((b) => b.id));
        const m = new Map(bindings);
        for (const b of toDelete) m.delete(bindKey(codigo, b.sim_kind));
        setBindings(m);
      }
    }
    const { error } = await db.from("rbx_plans_cache").update({ kind }).eq("codigo", codigo);
    if (error) { toast.error(error.message); load(); return; }
    toast.success(kind === "fibra" ? "Marcado como Fibra" : kind === "movel" ? "Marcado como Móvel" : "Tipo limpo");
  }

  // Rows da Seção 1: planos móveis geram linhas eSIM + Físico; planos fibra geram 1 linha sem SIM
  const rbxRows = useMemo(() => {
    const out: Array<{ rbx: RbxCacheRow; sim: SimKind | null; isFiber: boolean }> = [];
    const filtered = rbxCache.filter((r) => matchesCategory(`${r.descricao} ${r.codigo}`));
    for (const r of filtered) {
      const fiber = isFiberRbx(r.codigo, r.descricao, r.kind);
      if (categoryFilter === "fibra" && !fiber) continue;
      if (categoryFilter === "movel" && fiber) continue;
      if (fiber) {
        out.push({ rbx: r, sim: null, isFiber: true });
      } else {
        out.push({ rbx: r, sim: "esim", isFiber: false });
        out.push({ rbx: r, sim: "physical", isFiber: false });
      }
    }
    return out;
  }, [rbxCache, categoryFilter, sitePlans]);

  const filteredSitePlans = useMemo(() => {
    if (categoryFilter === "all") return sitePlans;
    return sitePlans.filter((p) => {
      const c = (p.category || "").toLowerCase();
      if (categoryFilter === "fibra") return /(fibra|fiber|internet|fixa)/.test(c);
      if (categoryFilter === "movel") return c === "movel" || c === "mobile" || /(chip|5g|4g|m[óo]vel)/.test(c);
      return true;
    });
  }, [sitePlans, categoryFilter]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Mapeamento de Planos"
        subtitle="Modelo: Plano do site → Plano RBX ← (Algar OU EAÍ). O RBX é o pivô."
      />

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={syncAll} disabled={!!syncing} variant="default">
            {syncing === "all" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sincronizar tudo
          </Button>
          <Button onClick={syncAlgar} disabled={!!syncing} variant="outline" size="sm">
            {syncing === "algar" ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-2" />}
            Algar ({algarCache.length})
          </Button>
          <Button onClick={syncEai} disabled={!!syncing} variant="outline" size="sm">
            {syncing === "eai" ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-2" />}
            EAÍ ({eaiCache.length})
          </Button>
          <Button onClick={syncRbx} disabled={!!syncing} variant="outline" size="sm">
            {syncing === "rbx" ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-2" />}
            RBX ({rbxCache.length})
          </Button>
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
          <span>Algar: {formatWhen(lastAlgar)}</span>
          <span>EAÍ: {formatWhen(lastEai)}</span>
          <span>RBX: {formatWhen(lastRbx)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">Filtrar por categoria:</span>
          <ToggleGroup
            type="single"
            value={categoryFilter}
            onValueChange={(v) => v && setCategoryFilter(v as typeof categoryFilter)}
            size="sm"
          >
            <ToggleGroupItem value="all">Todos</ToggleGroupItem>
            <ToggleGroupItem value="fibra">Fibra</ToggleGroupItem>
            <ToggleGroupItem value="movel">Móvel</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Card>

      <Tabs defaultValue="rbx-mvno">
        <TabsList>
          <TabsTrigger value="rbx-mvno" className="gap-2"><Server className="w-4 h-4"/>RBX × Operadora</TabsTrigger>
          <TabsTrigger value="site-rbx" className="gap-2"><ShoppingBag className="w-4 h-4"/>Site × RBX</TabsTrigger>
        </TabsList>

        {/* ========== Seção 1: cada plano RBX → produto Algar/EAÍ ========== */}
        <TabsContent value="rbx-mvno">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Para cada plano do RBX, defina qual produto da operadora será usado para ativar a linha — separado por tipo de SIM (eSIM ou físico).
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Carregando...
              </div>
            ) : rbxRows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum plano RBX no cache. Clique em <strong>Sincronizar RBX</strong> acima.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano RBX</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Tipo SIM</TableHead>
                      <TableHead>Provedor</TableHead>
                      <TableHead>Produto da operadora</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rbxRows.map(({ rbx, sim, isFiber }) => {
                      const kindSelect = (
                        <Select
                          value={rbx.kind ?? "auto"}
                          onValueChange={(v) => setRbxKind(rbx.codigo, v === "auto" ? null : (v as RbxKind))}
                        >
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="fibra">Fibra</SelectItem>
                            <SelectItem value="movel">Móvel</SelectItem>
                          </SelectContent>
                        </Select>
                      );
                      if (isFiber) {
                        return (
                          <TableRow key={`${rbx.codigo}-fibra`}>
                            <TableCell>
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1"/>Jotazo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{rbx.descricao}</div>
                              <div className="text-xs text-muted-foreground font-mono">{rbx.codigo}</div>
                            </TableCell>
                            <TableCell>{kindSelect}</TableCell>
                            <TableCell><Badge variant="outline">Fibra</Badge></TableCell>
                            <TableCell colSpan={2}>
                              <div className="text-sm text-muted-foreground">
                                Fibra é provisionada pela própria Jotazo (RBX). Não requer operadora MVNO.
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        );
                      }
                      const simKind = sim as SimKind;
                      const b = bindings.get(bindKey(rbx.codigo, simKind));
                      const status = bindingStatus(rbx.codigo, simKind);
                      return (
                        <TableRow key={`${rbx.codigo}-${simKind}`}>
                          <TableCell>{statusBadge(status, { missing: "Sem binding" })}</TableCell>
                          <TableCell>
                            <div className="font-medium">{rbx.descricao}</div>
                            <div className="text-xs text-muted-foreground font-mono">{rbx.codigo}</div>
                          </TableCell>
                          <TableCell>{kindSelect}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{simKind === "esim" ? "eSIM" : "Físico"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={b?.provider || "algar"}
                              onValueChange={(v) => saveBinding(rbx.codigo, simKind, {
                                provider: v as Provider,
                                product_sku: null, eai_plan_id: null, eai_plan_name: null,
                              })}
                            >
                              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="algar">Algar</SelectItem>
                                <SelectItem value="eai">EAÍ</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {(b?.provider || "algar") === "algar" ? (
                              <SearchableSelect
                                value={b?.product_sku || null}
                                onChange={(v) => v && saveBinding(rbx.codigo, simKind, { provider: "algar", product_sku: v, eai_plan_id: null, eai_plan_name: null })}
                                options={algarCache.map((p) => ({ value: p.sku, label: p.name, hint: p.sku, searchText: `${p.sku} ${p.name}` }))}
                                placeholder={algarCache.length ? "Selecione SKU Algar" : "Sincronize Algar"}
                                searchPlaceholder="Buscar SKU ou nome..."
                                emptyText="Nenhum SKU encontrado"
                              />
                            ) : (
                              <SearchableSelect
                                value={b?.eai_plan_id || null}
                                onChange={(v) => {
                                  if (!v) return;
                                  const sel = eaiCache.find((p) => p.eai_plan_id === v);
                                  saveBinding(rbx.codigo, simKind, { provider: "eai", eai_plan_id: v, eai_plan_name: sel?.name || null, product_sku: null });
                                }}
                                options={eaiCache.map((p) => ({ value: p.eai_plan_id, label: p.name, searchText: `${p.eai_plan_id} ${p.name}` }))}
                                placeholder={eaiCache.length ? "Selecione plano EAÍ" : "Sincronize EAÍ"}
                                searchPlaceholder="Buscar plano EAÍ..."
                                emptyText="Nenhum plano encontrado"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {b?.id && (
                              <Button variant="ghost" size="sm" onClick={() => clearBinding(rbx.codigo, simKind)}>Limpar</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ========== Seção 2: plano do site → plano RBX ========== */}
        <TabsContent value="site-rbx">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Para cada plano vendido no site, escolha qual plano do RBX ele representa. O provisionamento do checkout vai seguir o vínculo configurado na aba <strong>RBX × Operadora</strong>.
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Carregando...
              </div>
            ) : filteredSitePlans.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum plano. <Link to="/admin/planos" className="underline">Cadastre planos</Link>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano do site</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Plano RBX vinculado</TableHead>
                      <TableHead>Operadora (auto)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSitePlans.map((plan) => {
                      const status = siteStatus(plan);
                      const isMobile = plan.category === "movel" || plan.category === "mobile";
                      const esim = plan.rbx_plan_codigo ? bindings.get(bindKey(plan.rbx_plan_codigo, "esim")) : undefined;
                      const phys = plan.rbx_plan_codigo ? bindings.get(bindKey(plan.rbx_plan_codigo, "physical")) : undefined;
                      const describe = (b?: Binding) => {
                        if (!b) return "—";
                        return b.provider === "algar"
                          ? `Algar · ${b.product_sku || "?"}`
                          : `EAÍ · ${b.eai_plan_name || b.eai_plan_id || "?"}`;
                      };
                      return (
                        <TableRow key={plan.id}>
                          <TableCell>{statusBadge(status, { missing: "Sem RBX", partial: plan.rbx_plan_codigo ? "Sem operadora" : "Parcial" })}</TableCell>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell><Badge variant="outline">{plan.category}</Badge></TableCell>
                          <TableCell>
                            <SearchableSelect
                              value={plan.rbx_plan_codigo || null}
                              onChange={(v) => setSitePlanRbx(plan.id, v)}
                              options={rbxCache.map((p) => ({ value: p.codigo, label: p.descricao, hint: p.codigo, searchText: `${p.codigo} ${p.descricao}` }))}
                              placeholder={rbxCache.length ? "Selecione plano RBX" : "Sincronize RBX"}
                              searchPlaceholder="Buscar código ou descrição..."
                              emptyText="Nenhum plano RBX encontrado"
                              allowClear
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            {isFiberCategory(plan.category) ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1"/>Jotazo (Fibra)
                              </Badge>
                            ) : isMobile ? (
                              <div className="space-y-1">
                                <div><span className="text-muted-foreground">eSIM:</span> {describe(esim)}</div>
                                <div><span className="text-muted-foreground">Físico:</span> {describe(phys)}</div>
                              </div>
                            ) : (
                              describe(esim)
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
