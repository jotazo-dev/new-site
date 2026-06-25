import * as React from "react";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Pencil, Trash2, Megaphone, MessageSquare, Upload, X, Image, CalendarIcon, Eye, MousePointerClick, Copy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const ANN_TYPES = [
  { value: "bar", label: "Barra de Anúncios", icon: Megaphone },
  { value: "popup", label: "Popup", icon: MessageSquare },
] as const;

type AnnType = typeof ANN_TYPES[number]["value"];

const POPUP_STYLES = [
  { value: "centered", label: "Centralizado" },
  { value: "bottom_bar", label: "Barra Inferior" },
  { value: "slide_in", label: "Slide-in (canto)" },
  { value: "exit_intent", label: "Exit Intent" },
];

const FREQUENCIES = [
  { value: "always", label: "Sempre" },
  { value: "once_per_session", label: "1x por sessão" },
  { value: "once_per_day", label: "1x por dia" },
  { value: "once_ever", label: "Apenas uma vez" },
];

const PAGE_OPTIONS = [
  { value: "all", label: "Todas as páginas" },
  { value: "/", label: "Home" },
  { value: "/planos", label: "Planos" },
  { value: "/para-voce", label: "Para Você" },
  { value: "/para-empresas", label: "Para Empresas" },
  { value: "/cobertura", label: "Cobertura" },
  { value: "/sobre", label: "Sobre" },
  { value: "/atendimento", label: "Atendimento" },
];

const emptyBar = { text: "", sort_order: 0, active: true, type: "bar" as AnnType, title: "", image_url: "", cta_text: "", cta_url: "", popup_style: "centered", display_pages: ["all"], frequency: "once_per_session", delay_seconds: 3, expires_at: null as string | null, starts_at: null as string | null };
const emptyPopup = { text: "", sort_order: 0, active: true, type: "popup" as AnnType, title: "", image_url: "", cta_text: "", cta_url: "", popup_style: "centered", display_pages: ["all"], frequency: "once_per_session", delay_seconds: 3, expires_at: null as string | null, starts_at: null as string | null };

function PopupImageUpload({ currentUrl, storagePath, onUploaded }: { currentUrl: string; storagePath: string; onUploaded: (url: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return; }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["png", "webp", "jpg", "jpeg"].includes(ext || "")) { toast.error("Use PNG, WEBP ou JPG"); return; }

    setUploading(true);
    try {
      const path = `${storagePath}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      onUploaded(`${pub.publicUrl}?t=${Date.now()}`);
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Image className="h-3.5 w-3.5" /> Imagem do Popup
      </Label>
      <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 overflow-hidden aspect-video flex items-center justify-center">
        {currentUrl ? (
          <>
            <img src={currentUrl} alt="Popup" className="w-full h-full object-cover" />
            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-destructive/20" onClick={() => onUploaded("")}>
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <div className="text-center p-2">
            <Image className="h-8 w-8 mx-auto text-muted-foreground/40 mb-1" />
            <p className="text-xs text-muted-foreground/60">Sem imagem</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".png,.webp,.jpg,.jpeg" className="hidden" onChange={handleUpload} />
      <Button type="button" variant="outline" size="sm" className="w-full text-xs" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <Upload className="h-3 w-3 mr-1" /> {uploading ? "Enviando..." : "Upload"}
      </Button>
    </div>
  );
}

function AnnouncementBarColors() {
  const qc = useQueryClient();
  const { data: bg = "" } = useQuery({
    queryKey: ["site_settings", "announcement_bg_color"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "announcement_bg_color").maybeSingle();
      return data?.value || "";
    },
  });
  const { data: fg = "" } = useQuery({
    queryKey: ["site_settings", "announcement_text_color"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "announcement_text_color").maybeSingle();
      return data?.value || "";
    },
  });

  const [bgDraft, setBgDraft] = React.useState("#ff6600");
  const [fgDraft, setFgDraft] = React.useState("#ffffff");
  React.useEffect(() => { setBgDraft(bg || "#ff6600"); }, [bg]);
  React.useEffect(() => { setFgDraft(fg || "#ffffff"); }, [fg]);

  const save = useMutation({
    mutationFn: async () => {
      await supabase.from("site_settings").upsert(
        [
          { key: "announcement_bg_color", value: bgDraft },
          { key: "announcement_text_color", value: fgDraft },
        ] as any,
        { onConflict: "key" }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Cores da barra atualizadas!");
    },
  });

  const reset = useMutation({
    mutationFn: async () => {
      await supabase.from("site_settings").upsert(
        [
          { key: "announcement_bg_color", value: "" },
          { key: "announcement_text_color", value: "" },
        ] as any,
        { onConflict: "key" }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      setBgDraft("#ff6600");
      setFgDraft("#ffffff");
      toast.success("Cores resetadas para o padrão (laranja)");
    },
  });

  return (
    <div className="rounded-lg border bg-card p-4 mb-4 shadow-sm space-y-3">
      <div>
        <p className="text-sm font-medium">Cores da barra (independente do header)</p>
        <p className="text-xs text-muted-foreground">Defina cor de fundo e texto da barra de anúncios.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Cor de fundo</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={bgDraft} onChange={(e) => setBgDraft(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
            <Input value={bgDraft} onChange={(e) => setBgDraft(e.target.value)} placeholder="#ff6600" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cor do texto</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={fgDraft} onChange={(e) => setFgDraft(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
            <Input value={fgDraft} onChange={(e) => setFgDraft(e.target.value)} placeholder="#ffffff" />
          </div>
        </div>
      </div>
      <div className="rounded-md overflow-hidden" style={{ background: bgDraft, color: fgDraft }}>
        <div className="px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide">
          🔥 Pré-visualização da barra de anúncios • Internet Fibra a partir de R$ 69,90
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Salvar cores</Button>
        <Button size="sm" variant="outline" onClick={() => reset.mutate()} disabled={reset.isPending}>Resetar (laranja padrão)</Button>
      </div>
    </div>
  );
}



export default function AdminAnuncios() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>(emptyBar);
  const [activeTab, setActiveTab] = React.useState<AnnType>("bar");

  const { data: barEnabled, isLoading: barEnabledLoading } = useQuery({
    queryKey: ["announcement_bar_enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "announcement_bar_enabled")
        .maybeSingle();
      if (error) throw error;
      return data?.value !== "false"; // default true
    },
  });

  const toggleBarEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "announcement_bar_enabled", value: enabled ? "true" : "false" } as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcement_bar_enabled"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success(barEnabled ? "Barra desativada no site" : "Barra ativada no site");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch popup stats aggregated
  const { data: statsMap = {} } = useQuery({
    queryKey: ["popup-stats-agg"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popup_stats" as any)
        .select("popup_id, event_type");
      if (error) throw error;
      const map: Record<string, { views: number; clicks: number }> = {};
      (data as any[])?.forEach((row: any) => {
        if (!map[row.popup_id]) map[row.popup_id] = { views: 0, clicks: 0 };
        if (row.event_type === "view") map[row.popup_id].views++;
        else if (row.event_type === "click") map[row.popup_id].clicks++;
      });
      return map;
    },
    staleTime: 30000,
  });

  const filtered = data.filter((a: any) => a.type === activeTab);

  const save = useMutation({
    mutationFn: async (item: any) => {
      const payload = { ...item, display_pages: item.display_pages || ["all"] };
      if (payload.id) {
        const { error } = await supabase.from("announcements").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("announcements").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); toast.success("Salvo!"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); toast.success("Removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleNew = () => {
    setForm(activeTab === "popup" ? { ...emptyPopup } : { ...emptyBar });
    setOpen(true);
  };

  const handleEdit = (a: any) => {
    const dp = Array.isArray(a.display_pages) ? a.display_pages : ["all"];
    setForm({ ...a, display_pages: dp });
    setOpen(true);
  };

  const handleDuplicate = (a: any) => {
    const dp = Array.isArray(a.display_pages) ? a.display_pages : ["all"];
    const { id, created_at, updated_at, ...rest } = a;
    setForm({ ...rest, display_pages: dp, title: `${a.title || a.text} (cópia)` });
    setOpen(true);
  };

  const togglePage = (page: string) => {
    const pages: string[] = form.display_pages || ["all"];
    if (page === "all") {
      setForm({ ...form, display_pages: ["all"] });
      return;
    }
    let next = pages.filter((p: string) => p !== "all");
    if (next.includes(page)) {
      next = next.filter((p: string) => p !== page);
    } else {
      next.push(page);
    }
    setForm({ ...form, display_pages: next.length === 0 ? ["all"] : next });
  };

  const isPopup = form.type === "popup";
  const freqLabel = (v: string) => FREQUENCIES.find(f => f.value === v)?.label || v;
  const styleLabel = (v: string) => POPUP_STYLES.find(s => s.value === v)?.label || v;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Anúncios" subtitle="Gerencie os textos da barra superior e popups do site" onNew={handleNew} newLabel={activeTab === "popup" ? "Novo Popup" : "Novo Anúncio"} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnnType)}>
        <TabsList className="bg-muted/50 p-1 gap-1">
          {ANN_TYPES.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs sm:text-sm">
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Bar tab */}
        <TabsContent value="bar">
          <div className="flex items-center justify-between rounded-lg border bg-card p-4 mb-4 shadow-sm">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Barra de anúncios no site</p>
              <p className="text-xs text-muted-foreground">Ative ou desative a barra superior em todas as páginas públicas</p>
            </div>
            <Switch
              checked={barEnabled ?? true}
              onCheckedChange={(val) => toggleBarEnabled.mutate(val)}
              disabled={barEnabledLoading || toggleBarEnabled.isPending}
            />
          </div>

          <AnnouncementBarColors />

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Texto</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Ordem</TableHead>
                  <TableHead className="w-24 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableSkeleton columns={4} /> : filtered.map((a: any) => (
                  <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="max-w-xs truncate font-medium">{a.text}</TableCell>
                    <TableCell><StatusBadge active={a.active} /></TableCell>
                    <TableCell className="text-muted-foreground">{a.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => handleEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleDuplicate(a)}><Copy className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Duplicar</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => { if (confirm("Remover?")) remove.mutate(a.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Popup tab */}
        <TabsContent value="popup">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Título</TableHead>
                  <TableHead className="font-semibold">Estilo</TableHead>
                  <TableHead className="font-semibold">Frequência</TableHead>
                  <TableHead className="font-semibold">Início</TableHead>
                  <TableHead className="font-semibold">Expira</TableHead>
                  <TableHead className="font-semibold">
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Views</span>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <span className="flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" /> Cliques</span>
                  </TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-24 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableSkeleton columns={9} /> : filtered.map((a: any) => {
                  const st = (statsMap as any)[a.id] || { views: 0, clicks: 0 };
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="max-w-xs truncate font-medium">{a.title || a.text}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{styleLabel(a.popup_style)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{freqLabel(a.frequency)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{a.starts_at ? format(new Date(a.starts_at), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{a.expires_at ? format(new Date(a.expires_at), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-medium">{st.views}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-medium">{st.clicks}</TableCell>
                      <TableCell><StatusBadge active={a.active} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => handleEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleDuplicate(a)}><Copy className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Duplicar</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => { if (confirm("Remover?")) remove.mutate(a.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={isPopup ? "max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col" : "max-w-md"}>
          <DialogHeader className="pb-4 border-b shrink-0">
            <DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {form.id ? "Editar" : "Novo"} {isPopup ? "Popup" : "Anúncio"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 overflow-y-auto flex-1 min-h-0 px-1">
            {isPopup ? (
              <div className="grid grid-cols-[1fr,1fr] gap-8">
                {/* Left column — form */}
                <div className="space-y-5 overflow-y-auto max-h-[65vh] pr-3 pb-2 pl-1 pt-1 -ml-1 -mt-1">
                  <div className="space-y-1.5">
                    <Label>Título</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do popup" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Texto / Descrição</Label>
                    <Input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Descrição do popup..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Texto do CTA</Label>
                      <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Saiba mais" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>URL do CTA</Label>
                      <Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} placeholder="/planos" />
                    </div>
                  </div>

                  <PopupImageUpload
                    currentUrl={form.image_url}
                    storagePath={`popups/${form.id || "new-" + Date.now()}`}
                    onUploaded={(url) => setForm({ ...form, image_url: url })}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Estilo do Popup</Label>
                      <Select value={form.popup_style} onValueChange={(v) => setForm({ ...form, popup_style: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {POPUP_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Frequência</Label>
                      <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {form.popup_style !== "exit_intent" && (
                    <div className="space-y-1.5">
                      <Label>Delay (segundos)</Label>
                      <Input type="number" min={0} value={form.delay_seconds} onChange={(e) => setForm({ ...form, delay_seconds: Number(e.target.value) })} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Páginas onde aparece</Label>
                    <div className="flex flex-wrap gap-2.5">
                      {PAGE_OPTIONS.map(p => {
                        const pages: string[] = form.display_pages || ["all"];
                        const checked = p.value === "all" ? pages.includes("all") : pages.includes(p.value) && !pages.includes("all");
                        return (
                          <label key={p.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <Checkbox checked={checked} onCheckedChange={() => togglePage(p.value)} />
                            {p.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Inicia em</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !form.starts_at && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">{form.starts_at ? format(new Date(form.starts_at), "dd/MM/yyyy") : "Imediato"}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.starts_at ? new Date(form.starts_at) : undefined}
                            onSelect={(d) => setForm({ ...form, starts_at: d ? d.toISOString() : null })}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      {form.starts_at && (
                        <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setForm({ ...form, starts_at: null })}>
                          Limpar data
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Expira em</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !form.expires_at && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">{form.expires_at ? format(new Date(form.expires_at), "dd/MM/yyyy") : "Sem expiração"}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.expires_at ? new Date(form.expires_at) : undefined}
                            onSelect={(d) => setForm({ ...form, expires_at: d ? d.toISOString() : null })}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      {form.expires_at && (
                        <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setForm({ ...form, expires_at: null })}>
                          Limpar data
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Ordem</Label>
                      <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                    </div>
                    <div className="flex items-center gap-2 pt-7">
                      <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                      <Label>Ativo</Label>
                    </div>
                  </div>
                </div>

                {/* Right column — preview */}
                <div className="sticky top-0 self-start space-y-3">
                  <Label className="text-xs text-muted-foreground">Preview</Label>
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 bg-muted/20 min-h-[300px] flex items-center justify-center">
                    {form.popup_style === "bottom_bar" ? (
                      <div className="w-full bg-card border rounded-lg shadow-sm px-4 py-3 flex items-center gap-3 self-end">
                        {form.image_url && <img src={form.image_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          {form.title && <p className="font-semibold text-xs truncate">{form.title}</p>}
                          {form.text && <p className="text-[10px] text-muted-foreground truncate">{form.text}</p>}
                        </div>
                        {form.cta_text && <Button size="sm" className="shrink-0 text-xs h-7 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white">{form.cta_text}</Button>}
                        <X className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    ) : form.popup_style === "slide_in" ? (
                      <div className="w-56 bg-card border rounded-xl shadow-lg overflow-hidden self-end ml-auto">
                        {form.image_url && <img src={form.image_url} alt="" className="w-full aspect-video object-cover" />}
                        <div className="p-3 space-y-1.5">
                          {form.title && <p className="font-semibold text-xs">{form.title}</p>}
                          {form.text && <p className="text-[10px] text-muted-foreground">{form.text}</p>}
                          {form.cta_text && <Button size="sm" className="w-full text-xs h-7 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white">{form.cta_text}</Button>}
                        </div>
                      </div>
                    ) : (
                      <div className="w-72 bg-card border rounded-xl shadow-lg overflow-hidden">
                        {form.image_url && <img src={form.image_url} alt="" className="w-full aspect-video object-cover" />}
                        <div className="p-4 space-y-2">
                          {form.title && <p className="font-bold text-sm">{form.title}</p>}
                          {form.text && <p className="text-xs text-muted-foreground">{form.text}</p>}
                          {form.cta_text && <Button size="sm" className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white">{form.cta_text}</Button>}
                        </div>
                      </div>
                    )}
                  </div>
                  {form.popup_style === "exit_intent" && (
                    <p className="text-[10px] text-muted-foreground text-center">Aparece quando o cursor sai da página</p>
                  )}

                  {/* Stats when editing */}
                  {form.id && (statsMap as any)[form.id] && (
                    <div className="border rounded-lg p-3 bg-muted/30 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Estatísticas</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{(statsMap as any)[form.id]?.views || 0}</span>
                          <span className="text-muted-foreground text-xs">views</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{(statsMap as any)[form.id]?.clicks || 0}</span>
                          <span className="text-muted-foreground text-xs">cliques</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Texto</Label>
                  <Input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="🔥 Promoção especial..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Ordem</Label>
                    <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-center gap-2 pt-7">
                    <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                    <Label>Ativo</Label>
                  </div>
                </div>
              </>
            )}
            <Button className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white" onClick={() => save.mutate(form)} disabled={save.isPending}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
