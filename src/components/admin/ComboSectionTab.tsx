import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wifi, Smartphone, Tv, Save, Loader2, Star } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DraggableTable } from "@/components/admin/DraggableTable";
import { formatBRL } from "@/data/plans";
import { cn } from "@/lib/utils";
import { MoneyInput } from "@/components/ui/money-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMBO_BADGE_COLORS as BADGE_COLORS, badgeClassesFor } from "@/lib/comboBadges";

/* ── Settings keys + defaults ── */
const SETTING_KEYS = {
  combo_section_active: "true",
  combo_section_title: "Monte seu combo personalizado",
  combo_section_subtitle: "Selecione os serviços que você precisa e monte o pacote perfeito para sua casa.",
  combo_section_badge: "Exclusivo",
  combo_tv_description: "80+ canais em HD · Filmes, séries, esportes e infantil",
  
  combo_extra_modem_cents: "3990",
  combo_max_chips: "5",
  combo_max_modems: "4",
} as const;

type SettingKey = keyof typeof SETTING_KEYS;

/* ── Hooks ── */
function useComboSettings() {
  return useQuery({
    queryKey: ["combo_settings"],
    queryFn: async () => {
      const keys = Object.keys(SETTING_KEYS);
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", keys);
      const map: Record<string, string> = {};
      for (const k of keys) map[k] = SETTING_KEYS[k as SettingKey];
      for (const row of data ?? []) if (row.value) map[row.key] = row.value;
      return map;
    },
  });
}

function useComboOptions(category: string) {
  return useQuery({
    queryKey: ["combo_options", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combo_options")
        .select("*")
        .eq("category", category)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ── Main component ── */
export function ComboSectionTab() {
  const qc = useQueryClient();
  const { data: settings, isLoading: loadingSettings } = useComboSettings();

  const [localSettings, setLocalSettings] = React.useState<Record<string, string>>({});
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (settings) { setLocalSettings(settings); setDirty(false); }
  }, [settings]);

  const updateSetting = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(localSettings)) {
        await supabase
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["combo_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Configurações salvas!");
      setDirty(false);
    },
    onError: () => toast.error("Erro ao salvar configurações"),
  });

  if (loadingSettings) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const s = localSettings;

  return (
    <div className="space-y-6">
      {/* Section settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações da Seção</CardTitle>
          <CardDescription>Textos, limites e ativação da seção "Monte seu Combo"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="font-semibold">Seção ativa</Label>
              <p className="text-xs text-muted-foreground">Exibir a seção na página inicial</p>
            </div>
            <Switch
              checked={s.combo_section_active === "true"}
              onCheckedChange={(v) => updateSetting("combo_section_active", v ? "true" : "false")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={s.combo_section_title || ""} onChange={(e) => updateSetting("combo_section_title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Badge</Label>
              <Input value={s.combo_section_badge || ""} onChange={(e) => updateSetting("combo_section_badge", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Subtítulo</Label>
            <Textarea rows={2} value={s.combo_section_subtitle || ""} onChange={(e) => updateSetting("combo_section_subtitle", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição da TV</Label>
            <Input value={s.combo_tv_description || ""} onChange={(e) => updateSetting("combo_tv_description", e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
              <p className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-xs text-muted-foreground">
                <strong>TV grátis:</strong> regra unificada — incluída automaticamente quando a fibra do combo tem velocidade ≥ 500 Mbps. Não há mais limiar por preço (alinhado ao carrinho).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Modem extra</Label>
              <MoneyInput
                valueCents={Number(s.combo_extra_modem_cents || 0)}
                onChangeCents={(c) => updateSetting("combo_extra_modem_cents", String(c))}
              />
              <p className="text-xs text-muted-foreground">Cobrança por modem adicional.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Máx. chips</Label>
              <Input type="number" value={s.combo_max_chips || ""} onChange={(e) => updateSetting("combo_max_chips", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Máx. modems extras</Label>
              <Input type="number" value={s.combo_max_modems || ""} onChange={(e) => updateSetting("combo_max_modems", e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Options tables */}
      <OptionsTable category="fibra" title="Opções de Fibra" icon={Wifi} />
      <OptionsTable category="movel" title="Opções de Móvel" icon={Smartphone} />
      <OptionsTable category="tv" title="Opção de TV" icon={Tv} />
    </div>
  );
}

/* ── Options CRUD table ── */
function OptionsTable({ category, title, icon: Icon }: { category: string; title: string; icon: React.ComponentType<{ className?: string }> }) {
  const qc = useQueryClient();
  const { data: options = [], isLoading } = useComboOptions(category);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);
  const [form, setForm] = React.useState({ label: "", description: "", price_cents: 0, active: true, recommended: false, badge_label: "", badge_color: "accent" });

  const openNew = () => { setEditing(null); setForm({ label: "", description: "", price_cents: 0, active: true, recommended: false, badge_label: "", badge_color: "accent" }); setDialogOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ label: item.label, description: item.description || "", price_cents: item.price_cents, active: item.active, recommended: !!item.recommended, badge_label: item.badge_label || "", badge_color: item.badge_color || "accent" }); setDialogOpen(true); };

  const saveMut = useMutation({
    mutationFn: async () => {
      const price = Math.round(Number(form.price_cents) || 0);
      const payload = { label: form.label, description: form.description, price_cents: price, active: form.active, recommended: form.recommended, badge_label: form.badge_label, badge_color: form.badge_color };
      if (editing) {
        const { error } = await supabase.from("combo_options").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const maxSort = options.length > 0 ? Math.max(...options.map((o: any) => o.sort_order)) + 1 : 0;
        const { error } = await supabase.from("combo_options").insert({ category, ...payload, sort_order: maxSort });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["combo_options", category] }); setDialogOpen(false); toast.success(editing ? "Atualizado!" : "Criado!"); },
    onError: (e: any) => toast.error(e?.message || "Erro ao salvar"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("combo_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["combo_options", category] }); toast.success("Removido!"); },
    onError: () => toast.error("Erro ao remover"),
  });

  const reorderMut = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase.from("combo_options").update({ sort_order: u.sort_order }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["combo_options", category] }); toast.success("Ordem atualizada!"); },
    onError: (e: any) => toast.error(e?.message || "Erro ao reordenar"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Adicionar</Button>
      </CardHeader>
      <CardContent>
        <DraggableTable
          data={options}
          isLoading={isLoading}
          columns={["Label", "Preço", "Badge", "Recomendado", "Status"]}
          colSpan={5}
          emptyMessage="Nenhuma opção cadastrada."
          emptyIcon={Icon}
          onReorder={(updates) => reorderMut.mutate(updates)}
          renderRow={(item) => (
            <>
              <TableCell className="font-medium">
                <div>{item.label}</div>
                {item.description && <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>}
              </TableCell>
              <TableCell>{formatBRL(item.price_cents)}</TableCell>
              <TableCell>
                {item.badge_label ? (
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", badgeClassesFor(item.badge_color))}>
                    {item.badge_label}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {item.recommended ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                    <Star className="h-3 w-3 fill-current" /> Sim
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell><StatusBadge active={item.active} /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover esta opção?")) deleteMut.mutate(item.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </>
          )}
        />
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar opção" : "Nova opção"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Ex: 300 Mega" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ex: Ideal para 3 pessoas" />
              <p className="text-xs text-muted-foreground">Texto auxiliar exibido abaixo do label no card.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Badge customizado (opcional)</Label>
                <Input value={form.badge_label} onChange={(e) => setForm((f) => ({ ...f, badge_label: e.target.value }))} placeholder="Ex: Mais vendido, Promo, Novo" maxLength={20} />
                <p className="text-xs text-muted-foreground">Deixe em branco para não exibir.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Cor do badge</Label>
                <Select value={form.badge_color} onValueChange={(v) => setForm((f) => ({ ...f, badge_color: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BADGE_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="inline-flex items-center gap-2">
                          <span className={cn("inline-block h-3 w-3 rounded-full", c.classes)} />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.badge_label && (
                  <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", badgeClassesFor(form.badge_color))}>
                    {form.badge_label}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Preço</Label>
              <MoneyInput
                valueCents={form.price_cents}
                onChangeCents={(c) => setForm((f) => ({ ...f, price_cents: c }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              <Label>Ativo</Label>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
              <Switch checked={form.recommended} onCheckedChange={(v) => setForm((f) => ({ ...f, recommended: v }))} />
              <div className="space-y-0.5">
                <Label className="font-semibold">Recomendado (destaque)</Label>
                <p className="text-xs text-muted-foreground">Opções marcadas exibem badge "Recomendado" no site. Você pode marcar várias por categoria — a primeira (pela ordem de exibição) será pré-selecionada.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMut.mutate()} disabled={!form.label || saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
