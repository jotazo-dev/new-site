import { useState, useRef } from "react";
import { Image, Upload, Loader2, Check, Monitor, PanelLeft, SquareAsterisk, RotateCcw, Minus, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const FIT_OPTIONS = [
  { value: "contain", label: "Contain (padrão)" },
  { value: "cover", label: "Cover" },
  { value: "fill", label: "Fill (esticar)" },
  { value: "scale-down", label: "Scale Down" },
] as const;

type ObjectFit = typeof FIT_OPTIONS[number]["value"];

interface LogoItem {
  icon: typeof Image;
  title: string;
  description: string;
  settingKey: string;
  fitSettingKey: string;
  sizeSettingKey: string;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  fallbackLabel: string;
  storagePath: string;
}

const items: LogoItem[] = [
  {
    icon: Monitor,
    title: "Logo do Header",
    description: "Logo principal exibida no cabeçalho do site. Recomendado: PNG ou WEBP com fundo transparente.",
    settingKey: "logo_header_url",
    fitSettingKey: "logo_header_fit",
    sizeSettingKey: "logo_header_size",
    defaultSize: 48,
    minSize: 24,
    maxSize: 80,
    fallbackLabel: "Logo padrão (logo-jotazo-tv.webp)",
    storagePath: "branding/logo-header",
  },
  {
    icon: Image,
    title: "Logo do Rodapé",
    description: "Logo exibida no rodapé (footer) do site. Recomendado: PNG com fundo transparente.",
    settingKey: "logo_footer_url",
    fitSettingKey: "logo_footer_fit",
    sizeSettingKey: "logo_footer_size",
    defaultSize: 64,
    minSize: 32,
    maxSize: 120,
    fallbackLabel: "Logo padrão (logo-jotazo.png)",
    storagePath: "branding/logo-footer",
  },
  {
    icon: SquareAsterisk,
    title: "Ícone do Painel Admin",
    description: "Ícone quadrado exibido na sidebar do painel (visível quando recolhida). Recomendado: ícone quadrado, PNG ou SVG.",
    settingKey: "logo_admin_url",
    fitSettingKey: "logo_admin_fit",
    sizeSettingKey: "logo_admin_size",
    defaultSize: 36,
    minSize: 20,
    maxSize: 48,
    fallbackLabel: "Ícone padrão (Wifi)",
    storagePath: "branding/logo-admin",
  },
  {
    icon: PanelLeft,
    title: "Logo do Painel Admin",
    description: "Logo exibida ao lado do ícone na sidebar expandida (substitui o texto). Recomendado: horizontal, PNG ou WEBP com fundo transparente.",
    settingKey: "logo_admin_wide_url",
    fitSettingKey: "logo_admin_wide_fit",
    sizeSettingKey: "logo_admin_wide_size",
    defaultSize: 36,
    minSize: 20,
    maxSize: 64,
    fallbackLabel: "Texto padrão (Jotazo Telecom)",
    storagePath: "branding/logo-admin-wide",
  },
  {
    icon: Image,
    title: "Logo do Menu Mobile",
    description: "Logo exibida no topo do menu lateral mobile (drawer hambúrguer). Fundo azul — recomendado: PNG com fundo transparente.",
    settingKey: "logo_mobile_menu_url",
    fitSettingKey: "logo_mobile_menu_fit",
    sizeSettingKey: "logo_mobile_menu_size",
    defaultSize: 44,
    minSize: 28,
    maxSize: 80,
    fallbackLabel: "Usa a logo do header",
    storagePath: "branding/logo-mobile-menu",
  },
];

async function upsertSetting(key: string, value: string) {
  const { data: existing } = await supabase
    .from("site_settings")
    .select("id")
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("site_settings").insert({ key, value });
    if (error) throw error;
  }
}

function LogoCard({ item }: { item: LogoItem }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [localFit, setLocalFit] = useState<ObjectFit | null>(null);
  const [localSize, setLocalSize] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: customUrl } = useQuery({
    queryKey: ["site_settings", item.settingKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", item.settingKey)
        .maybeSingle();
      return data?.value || null;
    },
  });

  const { data: fitValue } = useQuery({
    queryKey: ["site_settings", item.fitSettingKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", item.fitSettingKey)
        .maybeSingle();
      return (data?.value as ObjectFit) || "contain";
    },
  });

  const { data: sizeValue } = useQuery({
    queryKey: ["site_settings", item.sizeSettingKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", item.sizeSettingKey)
        .maybeSingle();
      return data?.value ? parseInt(data.value) : item.defaultSize;
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["site_settings", item.settingKey] });
    queryClient.invalidateQueries({ queryKey: ["site_settings", item.fitSettingKey] });
    queryClient.invalidateQueries({ queryKey: ["site_settings", item.sizeSettingKey] });
    queryClient.invalidateQueries({ queryKey: ["site_settings"] });
    queryClient.invalidateQueries({ queryKey: ["site_settings_public"] });
    queryClient.invalidateQueries({ queryKey: ["admin_branding"] });
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const ext = file.name.split(".").pop() || "png";
      const storagePath = `${item.storagePath}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(storagePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("site-assets").getPublicUrl(storagePath);
      const publicUrl = data.publicUrl + `?t=${Date.now()}`;

      await upsertSetting(item.settingKey, publicUrl);
      return publicUrl;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(`${item.title} atualizada com sucesso!`);
      setUploading(false);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao enviar: ${err.message}`);
      setUploading(false);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      setResetting(true);
      // Delete settings to revert to fallback
      await supabase.from("site_settings").delete().eq("key", item.settingKey);
      await supabase.from("site_settings").delete().eq("key", item.fitSettingKey);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(`${item.title} restaurada ao padrão.`);
      setResetting(false);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao resetar: ${err.message}`);
      setResetting(false);
    },
  });

  const handleFitChange = async (value: string) => {
    setLocalFit(value as ObjectFit);
    try {
      await upsertSetting(item.fitSettingKey, value);
      invalidateAll();
      toast.success("Preenchimento atualizado.");
    } catch {
      toast.error("Erro ao salvar preenchimento.");
    }
  };

  const sizeDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSizeChange = (value: number[]) => {
    const size = value[0];
    setLocalSize(size);
    clearTimeout(sizeDebounceRef.current);
    sizeDebounceRef.current = setTimeout(async () => {
      try {
        await upsertSetting(item.sizeSettingKey, String(size));
        invalidateAll();
      } catch {
        toast.error("Erro ao salvar tamanho.");
      }
    }, 500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 5 MB.");
      return;
    }
    uploadMutation.mutate(file);
    e.target.value = "";
  };

  const currentFit = localFit || fitValue || "contain";
  const currentSize = localSize ?? sizeValue ?? item.defaultSize;

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
            <item.icon className="h-4 w-4 text-white" />
          </div>
          {item.title}
          {customUrl && (
            <span className="ml-auto flex items-center gap-1 text-xs font-normal text-green-600">
              <Check className="h-3.5 w-3.5" /> Personalizado
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="flex items-center gap-4">
          <div className="rounded-lg border bg-muted/30 p-2 flex items-center justify-center transition-all" style={{ width: 140, height: 120 }}>
            {customUrl ? (
              <img
                src={customUrl}
                alt={item.title}
                className="transition-all duration-300"
                style={{
                  height: currentSize,
                  width: "auto",
                  objectFit: currentFit as React.CSSProperties["objectFit"],
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span className="text-xs text-muted-foreground text-center px-1">{item.fallbackLabel}</span>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="text-xs text-muted-foreground">
              <p>Formatos aceitos: PNG, WEBP, SVG</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /> Enviar nova logo</>
                )}
              </Button>
              {customUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={resetting}
                  onClick={() => resetMutation.mutate()}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {resetting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Resetando...</>
                  ) : (
                    <><RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão</>
                  )}
                </Button>
              )}
            </div>

            {/* Fit selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Preenchimento:</span>
              <Select value={currentFit} onValueChange={handleFitChange}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Tamanho:</span>
              <Minus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Slider
                value={[currentSize]}
                onValueChange={handleSizeChange}
                min={item.minSize}
                max={item.maxSize}
                step={2}
                className="w-36"
              />
              <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground w-10 text-right">{currentSize}px</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LogosTab() {
  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-muted-foreground">
        Personalize as logos exibidas no site e no painel admin. As alterações são aplicadas automaticamente.
      </p>
      {items.map((item) => (
        <LogoCard key={item.settingKey} item={item} />
      ))}
    </div>
  );
}
