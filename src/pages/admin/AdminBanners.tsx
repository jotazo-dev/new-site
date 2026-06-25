import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, X, Monitor, Smartphone, Cpu, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DraggableTable } from "@/components/admin/DraggableTable";
import { CHIP_BADGE_ICON_NAMES, DEFAULT_CHIP_BADGES, getChipBadgeIcon, parseChipBadges, type ChipBadge } from "@/lib/chipBadgeIcons";
import { cn } from "@/lib/utils";

function useCrud<T extends { id: string }>(table: string, queryKey: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select("*").order("sort_order");
      if (error) throw error;
      return (data as unknown) as T[];
    },
  });
  const save = useMutation({
    mutationFn: async (item: any) => {
      if (item.id) { const { error } = await supabase.from(table as any).update(item).eq("id", item.id); if (error) throw error; }
      else { const { id, ...rest } = item; const { error } = await supabase.from(table as any).insert(rest); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); toast.success("Salvo!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from(table as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); toast.success("Removido!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const reorder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase.from(table as any).update({ sort_order: item.sort_order }).eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return { ...query, save, remove, reorder };
}

function BannerImageUpload({
  label,
  icon: Icon,
  hint,
  currentUrl,
  storagePath,
  onUploaded,
}: {
  label: string;
  icon: React.ElementType;
  hint: string;
  currentUrl: string;
  storagePath: string;
  onUploaded: (url: string) => void;
}) {
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
      toast.success(`${label} enviada!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 space-y-2">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </Label>
      <p className="text-[10px] text-muted-foreground/70">{hint}</p>
      <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 overflow-hidden aspect-video flex items-center justify-center">
        {currentUrl ? (
          <>
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-destructive/20"
              onClick={() => onUploaded("")}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <div className="text-center p-2">
            <Icon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-1" />
            <p className="text-xs text-muted-foreground/60">Sem imagem</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".png,.webp,.jpg,.jpeg" className="hidden" onChange={handleUpload} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3 w-3 mr-1" /> {uploading ? "Enviando..." : "Upload"}
      </Button>
    </div>
  );
}

export default function AdminBanners() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Banners" subtitle="Gerencie os banners do hero e promoções" />
      <Tabs defaultValue="hero">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="mid">Intermediário</TabsTrigger>
          <TabsTrigger value="promo">Promo</TabsTrigger>
          <TabsTrigger value="chip5g" className="gap-1.5"><Cpu className="h-3.5 w-3.5" /> Chip 5G</TabsTrigger>
        </TabsList>
        <TabsContent value="hero" className="mt-4"><HeroBannersTab /></TabsContent>
        <TabsContent value="mid" className="mt-4"><MidBannersTab /></TabsContent>
        <TabsContent value="promo" className="mt-4"><PromoBannersTab /></TabsContent>
        <TabsContent value="chip5g" className="mt-4"><Chip5GTab /></TabsContent>
      </Tabs>
    </div>
  );
}


function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
    </div>
  );
}

function HeroLivePreview({ banners, sizingMode }: { banners: any[]; sizingMode: "auto" | "fixed" }) {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const active = (banners || []).filter((b) => b?.active);
  const slide = active[0] || banners?.[0];
  const isFixed = sizingMode === "fixed";
  const isMobile = device === "mobile";

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Prévia ao vivo</p>
          <p className="text-xs text-muted-foreground">
            Reflete exatamente como o banner aparece na home com o modo {sizingMode === "auto" ? "Auto" : "Fixo"}.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-background p-0.5">
          <button
            type="button"
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${device === "desktop" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button
            type="button"
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${device === "mobile" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
        </div>
      </div>

      <div className={`mx-auto overflow-hidden rounded-md border bg-card ${isMobile ? "max-w-[390px]" : "max-w-full"}`}>
        {!slide ? (
          <div className={isFixed ? "mx-auto flex h-[800px] w-full items-center justify-center text-xs text-muted-foreground" : "flex h-40 w-full items-center justify-center text-xs text-muted-foreground"}>
            Nenhum banner cadastrado
          </div>
        ) : (
          <div className={`relative ${isFixed ? "mx-auto h-[800px] w-full max-w-[1920px]" : "flex w-full justify-center bg-muted"}`}>
            <picture className={isFixed ? "block h-full w-full" : "inline-block"}>
              {isMobile && slide.image_mobile_url && (
                <source media="(max-width: 767px)" srcSet={slide.image_mobile_url} />
              )}
              <img
                src={(isMobile && slide.image_mobile_url) || slide.image_url || slide.image_mobile_url}
                alt={slide.alt || "Prévia"}
                className={isFixed ? "absolute inset-0 h-full w-full object-cover object-center" : "block h-auto w-auto max-w-none shrink-0"}
                style={isFixed ? undefined : { aspectRatio: "auto", height: "auto" }}
              />
            </picture>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroBannersTab() {
  const { data = [], isLoading, save, remove, reorder } = useCrud<any>("hero_banners", "admin-hero-banners");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>({});
  const qc = useQueryClient();

  // Hero sizing setting
  const { data: sizingSetting } = useQuery({
    queryKey: ["site_settings_hero_sizing"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "hero_banner_sizing").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [sizingMode, setSizingMode] = React.useState<"auto" | "fixed">("fixed");
  React.useEffect(() => {
    if (sizingSetting?.value) setSizingMode(sizingSetting.value as "auto" | "fixed");
  }, [sizingSetting]);

  const saveSizing = useMutation({
    mutationFn: async (mode: "auto" | "fixed") => {
      if (sizingSetting?.id) {
        const { error } = await supabase.from("site_settings").update({ value: mode }).eq("id", sizingSetting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key: "hero_banner_sizing", value: mode });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings_hero_sizing"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Modo de exibição salvo!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Hero autoplay interval setting
  const { data: intervalSetting } = useQuery({
    queryKey: ["site_settings_hero_interval"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "hero_banner_interval").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [intervalSec, setIntervalSec] = React.useState<number>(8);
  React.useEffect(() => {
    const v = Number(intervalSetting?.value);
    if (!Number.isNaN(v) && v > 0) setIntervalSec(v);
  }, [intervalSetting]);

  const saveInterval = useMutation({
    mutationFn: async (sec: number) => {
      const value = String(sec);
      if (intervalSetting?.id) {
        const { error } = await supabase.from("site_settings").update({ value }).eq("id", intervalSetting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key: "hero_banner_interval", value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings_hero_interval"] });
      toast.success("Intervalo do slide salvo!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Hero arrows settings (enabled, style, color)
  const { data: arrowsSettings } = useQuery({
    queryKey: ["site_settings_hero_arrows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["hero_arrows_enabled", "hero_arrows_style", "hero_arrows_color", "hero_arrows_color_hover", "hero_arrows_bg", "hero_arrows_bg_hover", "hero_arrows_size"]);
      if (error) throw error;
      return data || [];
    },
  });
  const [arrowsEnabled, setArrowsEnabled] = React.useState(true);
  const [arrowsStyle, setArrowsStyle] = React.useState<"glass" | "solid" | "outline">("glass");
  const [arrowsColor, setArrowsColor] = React.useState("#ffffff");
  const [arrowsColorHover, setArrowsColorHover] = React.useState("#ffffff");
  const [arrowsBg, setArrowsBg] = React.useState("rgba(255,255,255,0.7)");
  const [arrowsBgHover, setArrowsBgHover] = React.useState("rgba(255,255,255,1)");
  const [arrowsSize, setArrowsSize] = React.useState<"sm" | "md" | "lg">("md");
  React.useEffect(() => {
    if (!arrowsSettings) return;
    const en = arrowsSettings.find((s: any) => s.key === "hero_arrows_enabled");
    const st = arrowsSettings.find((s: any) => s.key === "hero_arrows_style");
    const co = arrowsSettings.find((s: any) => s.key === "hero_arrows_color");
    const coh = arrowsSettings.find((s: any) => s.key === "hero_arrows_color_hover");
    const bg = arrowsSettings.find((s: any) => s.key === "hero_arrows_bg");
    const bgh = arrowsSettings.find((s: any) => s.key === "hero_arrows_bg_hover");
    const sz = arrowsSettings.find((s: any) => s.key === "hero_arrows_size");
    if (en) setArrowsEnabled(en.value !== "false");
    if (st?.value) setArrowsStyle(st.value as any);
    if (co?.value) setArrowsColor(co.value);
    if (coh?.value) setArrowsColorHover(coh.value);
    if (bg?.value) setArrowsBg(bg.value);
    if (bgh?.value) setArrowsBgHover(bgh.value);
    if (sz?.value === "sm" || sz?.value === "md" || sz?.value === "lg") setArrowsSize(sz.value);
  }, [arrowsSettings]);

  const saveArrows = useMutation({
    mutationFn: async () => {
      const upsert = async (key: string, value: string) => {
        const existing = (arrowsSettings || []).find((s: any) => s.key === key);
        if (existing?.id) {
          const { error } = await supabase.from("site_settings").update({ value }).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("site_settings").insert({ key, value });
          if (error) throw error;
        }
      };
      await upsert("hero_arrows_enabled", arrowsEnabled ? "true" : "false");
      await upsert("hero_arrows_style", arrowsStyle);
      await upsert("hero_arrows_color", arrowsColor);
      await upsert("hero_arrows_color_hover", arrowsColorHover);
      await upsert("hero_arrows_bg", arrowsBg);
      await upsert("hero_arrows_bg_hover", arrowsBgHover);
      await upsert("hero_arrows_size", arrowsSize);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings_hero_arrows"] });
      toast.success("Estilo das setas salvo!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => { setForm({ image_url: "", image_mobile_url: "", alt: "", kicker: "", title_top: "", title_bottom: "", cta_primary: "", to_primary: "", cta_secondary: "", to_secondary: "", link_url: "", link_target: "_self", sort_order: 0, active: true }); setOpen(true); };

  return (
    <div className="space-y-4">
      {/* Sizing mode toggle */}
      <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
        <div className="flex-1">
          <p className="text-sm font-medium">Modo de exibição</p>
          <p className="text-xs text-muted-foreground">
            {sizingMode === "auto" ? "Tamanho real — a imagem é exibida no tamanho original" : "Proporção fixa — mantém o padrão 1920x800 do banner"}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-background p-0.5">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sizingMode === "auto" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setSizingMode("auto"); saveSizing.mutate("auto"); }}
          >
            Auto
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sizingMode === "fixed" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setSizingMode("fixed"); saveSizing.mutate("fixed"); }}
          >
            Fixo
          </button>
        </div>
      </div>

      {/* Autoplay interval */}
      <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
        <div className="flex-1">
          <p className="text-sm font-medium">Intervalo do slide (segundos)</p>
          <p className="text-xs text-muted-foreground">
            Tempo entre as trocas automáticas dos banners. Mínimo 2s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={2}
            max={60}
            value={intervalSec}
            onChange={(e) => setIntervalSec(Math.max(2, Math.min(60, Number(e.target.value) || 2)))}
            className="w-24"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => saveInterval.mutate(intervalSec)}
            disabled={saveInterval.isPending}
          >
            Salvar
          </Button>
        </div>
      </div>

      {/* Hero arrows customization */}
      <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Setas do banner (desktop)</p>
            <p className="text-xs text-muted-foreground">Mostrar setas de navegação nas laterais. No mobile permanecem ocultas.</p>
          </div>
          <Switch checked={arrowsEnabled} onCheckedChange={setArrowsEnabled} />
        </div>
        {arrowsEnabled && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Estilo</Label>
              <div className="flex gap-1 rounded-lg border bg-background p-0.5 max-w-md">
                {(["glass", "solid", "outline"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors ${arrowsStyle === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setArrowsStyle(s)}
                  >
                    {s === "glass" ? "Vidro" : s === "solid" ? "Sólido" : "Contorno"}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/70">No estilo Contorno, a cor de fundo é ignorada e a borda usa a cor do ícone.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tamanho</Label>
              <div className="flex gap-1 rounded-lg border bg-background p-0.5 max-w-md">
                {(["sm", "md", "lg"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${arrowsSize === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setArrowsSize(s)}
                  >
                    {s === "sm" ? "Pequeno" : s === "md" ? "Médio" : "Grande"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cor do ícone / borda</Label>
                <div className="flex gap-2">
                  <Input type="color" value={arrowsColor} onChange={(e) => setArrowsColor(e.target.value)} className="h-9 w-16 p-1" />
                  <Input value={arrowsColor} onChange={(e) => setArrowsColor(e.target.value)} placeholder="#ffffff" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cor do ícone (hover)</Label>
                <div className="flex gap-2">
                  <Input type="color" value={arrowsColorHover} onChange={(e) => setArrowsColorHover(e.target.value)} className="h-9 w-16 p-1" />
                  <Input value={arrowsColorHover} onChange={(e) => setArrowsColorHover(e.target.value)} placeholder="#ffffff" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cor de fundo</Label>
                <div className="flex gap-2">
                  <Input type="color" value={arrowsBg.startsWith("#") ? arrowsBg : "#ffffff"} onChange={(e) => setArrowsBg(e.target.value)} className="h-9 w-16 p-1" />
                  <Input value={arrowsBg} onChange={(e) => setArrowsBg(e.target.value)} placeholder="rgba(255,255,255,0.7)" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cor de fundo (hover)</Label>
                <div className="flex gap-2">
                  <Input type="color" value={arrowsBgHover.startsWith("#") ? arrowsBgHover : "#ffffff"} onChange={(e) => setArrowsBgHover(e.target.value)} className="h-9 w-16 p-1" />
                  <Input value={arrowsBgHover} onChange={(e) => setArrowsBgHover(e.target.value)} placeholder="rgba(255,255,255,1)" />
                </div>
              </div>
            </div>
            <Button type="button" size="sm" onClick={() => saveArrows.mutate()} disabled={saveArrows.isPending}>
              Salvar setas
            </Button>
          </div>
        )}
        {!arrowsEnabled && (
          <Button type="button" size="sm" variant="outline" onClick={() => saveArrows.mutate()} disabled={saveArrows.isPending}>
            Salvar
          </Button>
        )}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Arraste para reordenar</p>
        <Button onClick={openNew} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white shadow-lg shadow-primary/25">
          + Novo Banner Hero
        </Button>
      </div>
      <DraggableTable
        data={data}
        isLoading={isLoading}
        columns={["Imagem", "Título", "Status", "Ordem"]}
        colSpan={5}
        onReorder={(items) => reorder.mutate(items)}
        renderRow={(b) => (
          <>
            <TableCell className="w-20">
              {b.image_url ? <img src={b.image_url} alt="" className="h-10 w-16 rounded object-cover" /> : <span className="text-xs text-muted-foreground">—</span>}
            </TableCell>
            <TableCell className="font-medium">{b.title_top} {b.title_bottom}</TableCell>
            <TableCell><StatusBadge active={b.active} /></TableCell>
            <TableCell className="text-muted-foreground">{b.sort_order}</TableCell>
            <TableCell><ActionButtons onEdit={() => { setForm({ ...b }); setOpen(true); }} onDelete={() => { if(confirm("Remover?")) remove.mutate(b.id); }} /></TableCell>
          </>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b"><DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{form.id ? "Editar" : "Novo"} Banner Hero</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <BannerImageUpload label="Desktop" icon={Monitor} hint="1920×800 recomendado" currentUrl={form.image_url || ""} storagePath={`banners/hero/${form.id || "new"}-desktop`} onUploaded={(url) => setForm({ ...form, image_url: url })} />
              <BannerImageUpload label="Mobile" icon={Smartphone} hint="768×600 recomendado" currentUrl={form.image_mobile_url || ""} storagePath={`banners/hero/${form.id || "new"}-mobile`} onUploaded={(url) => setForm({ ...form, image_mobile_url: url })} />
            </div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Texto alternativo (acessibilidade)</Label><Input value={form.alt || ""} onChange={(e) => setForm({ ...form, alt: e.target.value })} /></div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Link da imagem (opcional)</Label>
              <Input
                value={form.link_url || ""}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="/planos ou https://..."
              />
              <p className="text-[10px] text-muted-foreground/70">Quando preenchido, clicar na imagem do banner leva para esse endereço.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Comportamento do link</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, link_target: "_self" })}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${form.link_target !== "_blank" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                >
                  Mesma guia
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, link_target: "_blank" })}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${form.link_target === "_blank" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                >
                  Nova guia
                </button>
              </div>
            </div>
            <fieldset className="space-y-3 rounded-lg border border-border/50 p-3">
              <legend className="px-2 text-xs font-semibold text-muted-foreground">Textos</legend>
              {([["kicker", "Subtítulo superior (ex: FIBRA ÓPTICA)"], ["title_top", "Título linha 1"], ["title_bottom", "Título linha 2"]] as const).map(([f, label]) => (
                <div key={f} className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label><Input value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} /></div>
              ))}
            </fieldset>
            <fieldset className="space-y-3 rounded-lg border border-border/50 p-3">
              <legend className="px-2 text-xs font-semibold text-muted-foreground">Botão Principal</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Texto</Label><Input value={form.cta_primary || ""} onChange={(e) => setForm({ ...form, cta_primary: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Link</Label><Input value={form.to_primary || ""} onChange={(e) => setForm({ ...form, to_primary: e.target.value })} /></div>
              </div>
            </fieldset>
            <fieldset className="space-y-3 rounded-lg border border-border/50 p-3">
              <legend className="px-2 text-xs font-semibold text-muted-foreground">Botão Secundário</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Texto</Label><Input value={form.cta_secondary || ""} onChange={(e) => setForm({ ...form, cta_secondary: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Link</Label><Input value={form.to_secondary || ""} onChange={(e) => setForm({ ...form, to_secondary: e.target.value })} /></div>
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Ordem</Label><Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Ativo</Label></div>
            </div>
            <Button className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white" onClick={() => { save.mutate(form); setOpen(false); }} disabled={save.isPending}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MidBannersTab() {
  const { data = [], isLoading, save, remove, reorder } = useCrud<any>("mid_banners", "admin-mid-banners");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>({});

  const openNew = () => { setForm({ image_url: "", image_mobile_url: "", alt: "", link_url: "", link_target: "_self", sort_order: 0, active: true }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Arraste para reordenar</p>
        <Button onClick={openNew} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white shadow-lg shadow-primary/25">
          + Novo Banner Intermediário
        </Button>
      </div>
      <DraggableTable
        data={data}
        isLoading={isLoading}
        columns={["Imagem", "Alt", "Status", "Ordem"]}
        colSpan={5}
        onReorder={(items) => reorder.mutate(items)}
        renderRow={(b) => (
          <>
            <TableCell className="w-20">
              {b.image_url ? <img src={b.image_url} alt="" className="h-10 w-16 rounded object-cover" /> : <span className="text-xs text-muted-foreground">—</span>}
            </TableCell>
            <TableCell className="font-medium">{b.alt || "—"}</TableCell>
            <TableCell><StatusBadge active={b.active} /></TableCell>
            <TableCell className="text-muted-foreground">{b.sort_order}</TableCell>
            <TableCell><ActionButtons onEdit={() => { setForm({ ...b }); setOpen(true); }} onDelete={() => { if(confirm("Remover?")) remove.mutate(b.id); }} /></TableCell>
          </>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b"><DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{form.id ? "Editar" : "Novo"} Banner Intermediário</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <BannerImageUpload label="Desktop" icon={Monitor} hint="1920×400 recomendado" currentUrl={form.image_url || ""} storagePath={`banners/mid/${form.id || "new"}-desktop`} onUploaded={(url) => setForm({ ...form, image_url: url })} />
              <BannerImageUpload label="Mobile" icon={Smartphone} hint="768×400 recomendado" currentUrl={form.image_mobile_url || ""} storagePath={`banners/mid/${form.id || "new"}-mobile`} onUploaded={(url) => setForm({ ...form, image_mobile_url: url })} />
            </div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Texto alternativo (acessibilidade)</Label><Input value={form.alt || ""} onChange={(e) => setForm({ ...form, alt: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Link de destino (URL)</Label><Input placeholder="https://..." value={form.link_url || ""} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Comportamento do link</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, link_target: "_self" })}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${form.link_target !== "_blank" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                >
                  Mesma guia
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, link_target: "_blank" })}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${form.link_target === "_blank" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                >
                  Nova guia
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Ordem</Label><Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Ativo</Label></div>
            </div>
            <Button className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white" onClick={() => { save.mutate(form); setOpen(false); }} disabled={save.isPending}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChipBadgesEditor({ badges, onUpdate, onReset }: {
  badges: ChipBadge[];
  onUpdate: (badges: ChipBadge[]) => void;
  onReset: () => void;
}) {
  const update = (idx: number, patch: Partial<ChipBadge>) =>
    onUpdate(badges.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  const removeBadge = (idx: number) => onUpdate(badges.filter((_, i) => i !== idx));
  const add = () => onUpdate([...badges, { icon: "Check", text: "" }]);

  return (
    <div className="space-y-2 rounded-lg border border-border/50 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-muted-foreground">Badges de benefícios</Label>
        <button type="button" onClick={onReset} className="text-[10px] text-muted-foreground hover:text-primary underline-offset-2 hover:underline">
          Restaurar padrão
        </button>
      </div>
      <div className="space-y-2">
        {badges.map((b, idx) => {
          const Icon = getChipBadgeIcon(b.icon);
          return (
            <div key={idx} className="flex items-center gap-2">
              <Select value={b.icon} onValueChange={(v) => update(idx, { icon: v })}>
                <SelectTrigger className="w-[130px] shrink-0 h-9">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate text-xs">{b.icon}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {CHIP_BADGE_ICON_NAMES.map((name) => {
                    const I = getChipBadgeIcon(name);
                    return (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <I className="h-3.5 w-3.5" />
                          <span className="text-xs">{name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Input
                className="h-9 flex-1"
                value={b.text}
                onChange={(e) => update(idx, { text: e.target.value })}
                placeholder="Ex: Rede 5G de alta velocidade"
              />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-destructive/10" onClick={() => removeBadge(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> Adicionar badge
      </Button>
    </div>
  );
}

function ChipForm({ prefix, defaultName, get, set, badges, onBadgesUpdate, onBadgesReset }: {
  prefix: "chip5g" | "chip2";
  defaultName: string;
  get: (k: string) => string;
  set: (k: string, v: string) => void;
  badges: ChipBadge[];
  onBadgesUpdate: (badges: ChipBadge[]) => void;
  onBadgesReset: () => void;
}) {
  const activeKey = `${prefix}_active`;
  const isActive = get(activeKey) !== "false";

  return (
    <div className={cn("space-y-3 rounded-xl border p-4 transition-opacity", !isActive && "opacity-50")}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{prefix === "chip5g" ? "Chip 1 (5G)" : "Chip 2"}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{isActive ? "Ativo" : "Inativo"}</span>
          <Switch checked={isActive} onCheckedChange={(v) => set(activeKey, v ? "true" : "false")} />
        </div>
      </div>
      <BannerImageUpload
        label="Imagem do chip"
        icon={Cpu}
        hint="Recomendado: 600×400, fundo transparente (PNG)"
        currentUrl={get(`${prefix}_image_url`)}
        storagePath={`banners/${prefix}/card`}
        onUploaded={(url) => set(`${prefix}_image_url`, url)}
      />
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Nome do chip</Label>
        <Input value={get(`${prefix}_name`)} onChange={(e) => set(`${prefix}_name`, e.target.value)} placeholder={defaultName} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Descrição curta</Label>
        <Input value={get(`${prefix}_description`)} onChange={(e) => set(`${prefix}_description`, e.target.value)} placeholder="Ex: Planos com franquia generosa" />
      </div>
      <ChipBadgesEditor badges={badges} onUpdate={onBadgesUpdate} onReset={onBadgesReset} />
    </div>
  );
}

function Chip5GTab() {
  const qc = useQueryClient();
  const KEYS = [
    "chip5g_image_url",
    "chip5g_name",
    "chip5g_description",
    "chip5g_badges",
    "chip5g_active",
    "chip2_image_url",
    "chip2_name",
    "chip2_description",
    "chip2_badges",
    "chip2_active",
    "chip_bestseller",
  ] as const;

  const { data: rows } = useQuery({
    queryKey: ["site_settings_chip_launch"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").in("key", KEYS as unknown as string[]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [vals, setVals] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    if (!rows) return;
    const map: Record<string, string> = {};
    rows.forEach((r: any) => { map[r.key] = r.value || ""; });
    setVals((prev) => ({ ...map, ...prev }));
  }, [rows]);

  const get = (k: string) => vals[k] ?? "";
  const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const key of KEYS) {
        const existing = rows?.find((r: any) => r.key === key);
        const value = get(key);
        if (existing?.id) {
          const { error } = await supabase.from("site_settings").update({ value }).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("site_settings").insert({ key, value });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings_chip_launch"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Configurações dos chips salvas!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getBadges = (prefix: "chip5g" | "chip2"): ChipBadge[] => {
    const raw = vals[`${prefix}_badges`];
    if (raw === undefined) return parseChipBadges(undefined);
    if (raw === "") return [];
    return parseChipBadges(raw);
  };
  const setBadges = (prefix: "chip5g" | "chip2", badges: ChipBadge[]) => {
    set(`${prefix}_badges`, JSON.stringify(badges));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure os dois chips exibidos lado a lado na seção "Lançamento Chip" da home.
        Os planos exibidos abaixo de cada chip são definidos no cadastro do plano (campo "Tipo de chip").
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <ChipForm prefix="chip5g" defaultName="Chip 5G Jotazo" get={get} set={set} badges={getBadges("chip5g")} onBadgesUpdate={(b) => setBadges("chip5g", b)} onBadgesReset={() => setBadges("chip5g", DEFAULT_CHIP_BADGES)} />
        <ChipForm prefix="chip2" defaultName="Black Chip 5G Jotazo" get={get} set={set} badges={getBadges("chip2")} onBadgesUpdate={(b) => setBadges("chip2", b)} onBadgesReset={() => setBadges("chip2", DEFAULT_CHIP_BADGES)} />
      </div>

      <div className="space-y-2 rounded-xl border p-4">
        <Label className="text-sm font-semibold">Badge "⭐ Mais vendido"</Label>
        <p className="text-xs text-muted-foreground">Escolha qual chip recebe o destaque (ou nenhum).</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { value: "5g", label: "Chip 1 (5G)" },
            { value: "black", label: "Chip 2" },
            { value: "none", label: "Nenhum" },
          ].map((opt) => {
            const active = (get("chip_bestseller") || "5g") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("chip_bestseller", opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        Salvar configurações
      </Button>
    </div>
  );
}

function PromoBannersTab() {
  const { data = [], isLoading, save, remove, reorder } = useCrud<any>("promo_banners", "admin-promo-banners");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>({});

  const openNew = () => { setForm({ image_url: "", image_mobile_url: "", alt: "", title: "", subtitle: "", highlight: "", bg_gradient: "", link_url: "", link_target: "_self", sort_order: 0, active: true }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Arraste para reordenar</p>
        <Button onClick={openNew} className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white shadow-lg shadow-primary/25">
          + Novo Banner Promo
        </Button>
      </div>
      <DraggableTable
        data={data}
        isLoading={isLoading}
        columns={["Imagem", "Título", "Status", "Ordem"]}
        colSpan={5}
        onReorder={(items) => reorder.mutate(items)}
        renderRow={(b) => (
          <>
            <TableCell className="w-20">
              {b.image_url ? <img src={b.image_url} alt="" className="h-10 w-16 rounded object-cover" /> : <span className="text-xs text-muted-foreground">—</span>}
            </TableCell>
            <TableCell className="font-medium">{b.title}</TableCell>
            <TableCell><StatusBadge active={b.active} /></TableCell>
            <TableCell className="text-muted-foreground">{b.sort_order}</TableCell>
            <TableCell><ActionButtons onEdit={() => { setForm({ ...b }); setOpen(true); }} onDelete={() => { if(confirm("Remover?")) remove.mutate(b.id); }} /></TableCell>
          </>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b"><DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{form.id ? "Editar" : "Novo"} Banner Promo</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <BannerImageUpload label="Desktop" icon={Monitor} hint="1920×600 recomendado" currentUrl={form.image_url || ""} storagePath={`banners/promo/${form.id || "new"}-desktop`} onUploaded={(url) => setForm({ ...form, image_url: url })} />
              <BannerImageUpload label="Mobile" icon={Smartphone} hint="768×600 recomendado" currentUrl={form.image_mobile_url || ""} storagePath={`banners/promo/${form.id || "new"}-mobile`} onUploaded={(url) => setForm({ ...form, image_mobile_url: url })} />
            </div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Texto alternativo (acessibilidade)</Label><Input value={form.alt || ""} onChange={(e) => setForm({ ...form, alt: e.target.value })} /></div>
            <fieldset className="space-y-3 rounded-lg border border-border/50 p-3">
              <legend className="px-2 text-xs font-semibold text-muted-foreground">Conteúdo</legend>
              {([["title", "Título"], ["subtitle", "Subtítulo"], ["highlight", "Destaque"], ["link_url", "Link da imagem (opcional)"]] as const).map(([f, label]) => (
                <div key={f} className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label><Input value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} /></div>
              ))}
              <div className="space-y-1 pt-2">
                <Label className="text-xs text-muted-foreground">Comportamento do link</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, link_target: "_self" })}
                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${form.link_target !== "_blank" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                  >
                    Mesma guia
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, link_target: "_blank" })}
                    className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${form.link_target === "_blank" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                  >
                    Nova guia
                  </button>
                </div>
              </div>
            </fieldset>
            <fieldset className="space-y-3 rounded-lg border border-border/50 p-3">
              <legend className="px-2 text-xs font-semibold text-muted-foreground">Aparência</legend>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Gradiente de fundo (CSS)</Label><Input value={form.bg_gradient || ""} onChange={(e) => setForm({ ...form, bg_gradient: e.target.value })} /></div>
            </fieldset>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Ordem</Label><Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Ativo</Label></div>
            </div>
            <Button className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white" onClick={() => { save.mutate(form); setOpen(false); }} disabled={save.isPending}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
