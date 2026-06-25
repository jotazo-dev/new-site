import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MobileDisplayControls } from "./MobileDisplayControls";

type HeaderTheme = "blue" | "white" | "blue_orange" | "white_blue_hover" | "black_chip";
type BlackChipVariant = "pure" | "accent" | "neon";
type HeaderHoverStyle = "soft" | "pill_blue" | "pill_orange" | "underline" | "glow";

const HOVER_STYLES: { key: HeaderHoverStyle; label: string; desc: string }[] = [
  { key: "soft", label: "Suave", desc: "Padrão atual" },
  { key: "pill_blue", label: "Pílula azul", desc: "Fundo azul + texto branco" },
  { key: "pill_orange", label: "Pílula laranja", desc: "Fundo laranja + texto branco" },
  { key: "underline", label: "Sublinhado", desc: "Linha laranja animada" },
  { key: "glow", label: "Glow", desc: "Brilho laranja sutil" },
];

function hoverPreviewClasses(style: HeaderHoverStyle): string {
  switch (style) {
    case "pill_blue":
      return "hover:bg-primary hover:text-primary-foreground";
    case "pill_orange":
      return "hover:bg-accent hover:text-accent-foreground";
    case "underline":
      return "relative hover:text-accent after:absolute after:left-2 after:right-2 after:bottom-0.5 after:h-0.5 after:bg-accent after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100";
    case "glow":
      return "hover:text-accent hover:bg-accent/5 hover:[text-shadow:0_0_12px_hsl(var(--accent)/0.6)]";
    case "soft":
    default:
      return "hover:bg-primary/5 hover:text-accent";
  }
}

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value || null;
}

async function upsertSetting(key: string, value: string) {
  const { data: existing } = await supabase
    .from("site_settings")
    .select("id")
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    await supabase.from("site_settings").update({ value }).eq("key", key);
  } else {
    await supabase.from("site_settings").insert({ key, value });
  }
}

export function HeaderTab() {
  const qc = useQueryClient();

  const { data: theme = "blue" } = useQuery({
    queryKey: ["site_settings", "header_theme"],
    queryFn: async () => ((await getSetting("header_theme")) as HeaderTheme) || "blue",
  });

  const { data: hoverStyle = "soft" } = useQuery({
    queryKey: ["site_settings", "header_hover_style"],
    queryFn: async () => ((await getSetting("header_hover_style")) as HeaderHoverStyle) || "soft",
  });

  const { data: logoWhiteUrl = "" } = useQuery({
    queryKey: ["site_settings", "logo_header_white_url"],
    queryFn: async () => (await getSetting("logo_header_white_url")) || "",
  });

  const { data: bcVariant = "neon" } = useQuery({
    queryKey: ["site_settings", "black_chip_variant"],
    queryFn: async () => {
      const v = (await getSetting("black_chip_variant")) as BlackChipVariant | "glow" | null;
      if (!v || v === "glow") return "neon" as BlackChipVariant;
      return v;
    },
  });
  const { data: bcBadge = "true" } = useQuery({
    queryKey: ["site_settings", "black_chip_badge"],
    queryFn: async () => (await getSetting("black_chip_badge")) ?? "true",
  });
  const { data: bcGlow = "true" } = useQuery({
    queryKey: ["site_settings", "black_chip_glow_border"],
    queryFn: async () => (await getSetting("black_chip_glow_border")) ?? "true",
  });

  const { data: planColumns = "3" } = useQuery({
    queryKey: ["site_settings", "premium_plans_columns"],
    queryFn: async () => (await getSetting("premium_plans_columns")) || "3",
  });

  const { data: mobileColumns = "1" } = useQuery({
    queryKey: ["site_settings", "premium_plans_mobile_columns"],
    queryFn: async () => (await getSetting("premium_plans_mobile_columns")) || "1",
  });

  const { data: mobileMode = "slide" } = useQuery({
    queryKey: ["site_settings", "premium_plans_mobile_mode"],
    queryFn: async () => (await getSetting("premium_plans_mobile_mode")) || "slide",
  });

  const [whiteLogoInput, setWhiteLogoInput] = React.useState("");

  React.useEffect(() => {
    setWhiteLogoInput(logoWhiteUrl);
  }, [logoWhiteUrl]);

  const planColumnsMutation = useMutation({
    mutationFn: async (value: "3" | "4") => {
      await upsertSetting("premium_plans_columns", value);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Exibição dos planos atualizada!");
    },
  });

  const mobileColumnsMutation = useMutation({
    mutationFn: async (value: "1" | "2") => {
      await upsertSetting("premium_plans_mobile_columns", value);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Colunas no mobile atualizadas!");
    },
  });

  const mobileModeMutation = useMutation({
    mutationFn: async (value: "slide" | "grade") => {
      await upsertSetting("premium_plans_mobile_mode", value);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Modo mobile atualizado!");
    },
  });

  const themeMutation = useMutation({
    mutationFn: async (newTheme: HeaderTheme) => {
      await upsertSetting("header_theme", newTheme);
      try { localStorage.setItem("header_theme_cache", newTheme); } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Tema do header atualizado!");
    },
  });

  const hoverStyleMutation = useMutation({
    mutationFn: async (newStyle: HeaderHoverStyle) => {
      await upsertSetting("header_hover_style", newStyle);
      try { localStorage.setItem("header_hover_style_cache", newStyle); } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Estilo de hover atualizado!");
    },
  });

  const bcVariantMutation = useMutation({
    mutationFn: async (v: BlackChipVariant) => { await upsertSetting("black_chip_variant", v); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Variação Black Chip atualizada!");
    },
  });
  const bcBadgeMutation = useMutation({
    mutationFn: async (v: boolean) => { await upsertSetting("black_chip_badge", v ? "true" : "false"); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
    },
  });
  const bcGlowMutation = useMutation({
    mutationFn: async (v: boolean) => { await upsertSetting("black_chip_glow_border", v ? "true" : "false"); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
    },
  });

  const logoMutation = useMutation({
    mutationFn: async (url: string) => {
      await upsertSetting("logo_header_white_url", url);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Logo do tema branco salva!");
    },
  });

  const uploading = React.useRef(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading.current) return;
    uploading.current = true;
    const ext = file.name.split(".").pop();
    const path = `logos/header-white-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    uploading.current = false;
    if (error) {
      toast.error("Erro no upload");
      return;
    }
    const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
    const url = pub.publicUrl;
    setWhiteLogoInput(url);
    logoMutation.mutate(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estilo do Header</CardTitle>
          <CardDescription>Escolha a aparência do cabeçalho e menu do site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Blue option */}
            <button
              onClick={() => themeMutation.mutate("blue")}
              className={cn(
                "relative rounded-xl border-2 p-1 transition-all",
                theme === "blue" ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              <div className="rounded-lg overflow-hidden">
                <div className="h-14 bg-[linear-gradient(90deg,hsl(var(--primary))_0%,hsl(218,90%,32%)_55%,hsl(218,80%,38%)_100%)] flex items-center px-4 gap-3">
                  <div className="h-7 w-20 rounded bg-white/20" />
                  <div className="flex gap-2 ml-auto">
                    <div className="h-5 w-12 rounded-full bg-white/20" />
                    <div className="h-5 w-12 rounded-full bg-white/20" />
                  </div>
                </div>
                <div className="h-8 bg-primary flex items-center justify-center gap-3 px-4">
                  <div className="h-3 w-10 rounded bg-white/20" />
                  <div className="h-3 w-10 rounded bg-white/20" />
                  <div className="h-3 w-10 rounded bg-white/20" />
                </div>
              </div>
              <p className="text-center text-sm font-medium mt-2 pb-1">Azul (padrão)</p>
              {theme === "blue" && (
                <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
              )}
            </button>

            {/* White option */}
            <button
              onClick={() => themeMutation.mutate("white")}
              className={cn(
                "relative rounded-xl border-2 p-1 transition-all",
                theme === "white" ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              <div className="rounded-lg overflow-hidden">
                <div className="h-14 bg-white border-b flex items-center px-4 gap-3">
                  <div className="h-7 w-20 rounded bg-primary/20" />
                  <div className="flex gap-2 ml-auto">
                    <div className="h-5 w-12 rounded-full bg-primary/20" />
                    <div className="h-5 w-12 rounded-full bg-accent/40" />
                  </div>
                </div>
                <div className="h-8 bg-muted/50 border-b flex items-center justify-center gap-3 px-4">
                  <div className="h-3 w-10 rounded bg-primary/20" />
                  <div className="h-3 w-10 rounded bg-primary/20" />
                  <div className="h-3 w-10 rounded bg-primary/20" />
                </div>
              </div>
              <p className="text-center text-sm font-medium mt-2 pb-1">Branco</p>
              {theme === "white" && (
                <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
              )}
            </button>

            {/* Blue + Orange option */}
            <button
              onClick={() => themeMutation.mutate("blue_orange")}
              className={cn(
                "relative rounded-xl border-2 p-1 transition-all",
                theme === "blue_orange" ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              <div className="rounded-lg overflow-hidden">
                <div className="h-14 bg-[linear-gradient(90deg,hsl(var(--primary))_0%,hsl(218,90%,32%)_55%,hsl(218,80%,38%)_100%)] flex items-center px-4 gap-3">
                  <div className="h-7 w-20 rounded bg-white/20" />
                  <div className="flex gap-2 ml-auto">
                    <div className="h-5 w-12 rounded-full bg-white/20" />
                    <div className="h-5 w-12 rounded-full bg-white/20" />
                  </div>
                </div>
                <div className="h-8 bg-accent flex items-center justify-center gap-3 px-4">
                  <div className="h-3 w-10 rounded bg-white/30" />
                  <div className="h-3 w-10 rounded bg-white/30" />
                  <div className="h-3 w-10 rounded bg-white/30" />
                </div>
              </div>
              <p className="text-center text-sm font-medium mt-2 pb-1">Azul + Laranja</p>
              {theme === "blue_orange" && (
                <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
              )}
            </button>

            {/* White + Blue Hover option */}
            <button
              onClick={() => themeMutation.mutate("white_blue_hover")}
              className={cn(
                "relative rounded-xl border-2 p-1 transition-all",
                theme === "white_blue_hover" ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              <div className="rounded-lg overflow-hidden">
                <div className="h-14 bg-white border-b flex items-center px-4 gap-3">
                  <div className="h-7 w-20 rounded bg-primary/20" />
                  <div className="flex gap-2 ml-auto">
                    <div className="h-5 w-12 rounded-full bg-primary/20" />
                    <div className="h-5 w-12 rounded-full bg-accent/40" />
                  </div>
                </div>
                <div className="h-8 bg-white border-b flex items-center justify-center gap-3 px-4">
                  <div className="h-3 w-10 rounded bg-primary/20" />
                  <div className="h-5 w-12 rounded bg-primary flex items-center justify-center">
                    <div className="h-2 w-6 rounded bg-white/80" />
                  </div>
                  <div className="h-3 w-10 rounded bg-primary/20" />
                </div>
              </div>
              <p className="text-center text-sm font-medium mt-2 pb-1">Branco + Hover Azul</p>
              {theme === "white_blue_hover" && (
                <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
              )}
            </button>

            {/* Black Chip option */}
            <button
              onClick={() => themeMutation.mutate("black_chip")}
              className={cn(
                "relative rounded-xl border-2 p-1 transition-all",
                theme === "black_chip" ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
              )}
            >
              <div className="rounded-lg overflow-hidden">
                <div
                  className="h-14 flex items-center px-4 gap-3 relative"
                  style={{ background: "radial-gradient(120% 100% at 50% 0%, rgba(255,102,0,0.25) 0%, #000 55%)" }}
                >
                  <div className="h-7 w-20 rounded bg-white/30" />
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest text-[#ff6600] border border-[#ff6600]/70" style={{ boxShadow: "0 0 8px rgba(255,102,0,0.6)" }}>BLACK</span>
                  <div className="flex gap-2 ml-auto">
                    <div className="h-5 w-12 rounded-full bg-white/20" />
                    <div className="h-5 w-12 rounded-full bg-[#ff6600]/60" />
                  </div>
                  <div className="absolute left-0 right-0 bottom-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #ff6600, transparent)", boxShadow: "0 0 8px #ff6600" }} />
                </div>
                <div className="h-8 bg-black flex items-center justify-center gap-3 px-4">
                  <div className="h-3 w-10 rounded bg-white/30" />
                  <div className="h-3 w-10 rounded bg-white/30" />
                  <div className="h-3 w-10 rounded bg-[#ff6600]/70" />
                </div>
              </div>
              <p className="text-center text-sm font-medium mt-2 pb-1">Black Chip 🖤</p>
              {theme === "black_chip" && (
                <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
              )}
            </button>
          </div>

          {/* Black Chip sub-controls */}
          {theme === "black_chip" && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-base">Variação Black Chip</Label>
                <p className="text-xs text-muted-foreground">Quatro estéticas para o tema preto. Todas usam neon laranja como acento.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([
                  { key: "pure", label: "Black Puro", bg: "#000", desc: "Preto puro, hover laranja" },
                  { key: "accent", label: "Black + Acento", bg: "#050505", desc: "Detalhes em laranja" },
                  { key: "neon", label: "Black + Neon", bg: "linear-gradient(180deg,#000,#0a0604)", desc: "Linhas neon laranja" },
                ] as const).map(({ key, label, bg, desc }) => {
                  const selected = bcVariant === key;
                  return (
                    <button
                      key={key}
                      onClick={() => bcVariantMutation.mutate(key)}
                      className={cn(
                        "relative rounded-xl border-2 p-2 transition-all text-left",
                        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="rounded-lg h-16 flex items-center justify-center" style={{ background: bg }}>
                        <span className="text-[10px] font-bold tracking-widest text-[#ff6600]" style={{ textShadow: "0 0 8px rgba(255,102,0,0.7)" }}>
                          BLACK
                        </span>
                      </div>
                      <p className="text-center text-sm font-medium mt-2">{label}</p>
                      <p className="text-center text-[11px] text-muted-foreground leading-tight">{desc}</p>
                      {selected && (
                        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">Selo "BLACK" no header</p>
                    <p className="text-xs text-muted-foreground">Pequeno chip ao lado da logo</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={bcBadge !== "false"}
                    onChange={(e) => bcBadgeMutation.mutate(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">Borda inferior brilhante</p>
                    <p className="text-xs text-muted-foreground">Linha neon laranja separando o header</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={bcGlow !== "false"}
                    onChange={(e) => bcGlowMutation.mutate(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              </div>
            </div>
          )}



          {/* Hover style selector */}
          <div className="space-y-3 pt-4 border-t">
            <div>
              <Label className="text-base">Estilo de hover dos menus</Label>
              <p className="text-xs text-muted-foreground">Como os links do menu reagem ao passar o mouse. Passe o mouse nas opções para pré-visualizar.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {HOVER_STYLES.map(({ key, label, desc }) => {
                const selected = hoverStyle === key;
                return (
                  <button
                    key={key}
                    onClick={() => hoverStyleMutation.mutate(key)}
                    className={cn(
                      "group relative rounded-xl border-2 p-3 transition-all text-left",
                      selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="rounded-lg bg-muted/50 p-2 flex items-center justify-center min-h-[56px]">
                      <span
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors text-foreground/70",
                          hoverPreviewClasses(key)
                        )}
                      >
                        Menu
                      </span>
                    </div>
                    <p className="text-center text-sm font-medium mt-2">{label}</p>
                    <p className="text-center text-[11px] text-muted-foreground leading-tight">{desc}</p>
                    {selected && (
                      <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* White theme logo */}
          <div className="space-y-3 pt-2">
            <Label>Logo para tema branco (versão escura/colorida)</Label>
            <p className="text-xs text-muted-foreground">
              Como o header branco tem fundo claro, use uma versão da logo com cores escuras ou coloridas para manter a legibilidade.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Input
                  placeholder="URL da logo (tema branco)"
                  value={whiteLogoInput}
                  onChange={(e) => setWhiteLogoInput(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => logoMutation.mutate(whiteLogoInput)}
                disabled={logoMutation.isPending}
              >
                Salvar URL
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Label
                htmlFor="upload-white-logo"
                className="cursor-pointer text-sm text-primary hover:underline"
              >
                Ou fazer upload
              </Label>
              <input
                id="upload-white-logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              {whiteLogoInput && (
                <div className="h-10 px-3 py-1 bg-muted rounded-lg flex items-center">
                  <img src={whiteLogoInput} alt="Preview" className="h-8 w-auto object-contain" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exibição dos Planos Premium</CardTitle>
          <CardDescription>Escolha quantos planos exibir por linha na seção principal da home</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["3", "4"] as const).map((cols) => {
              const selected = planColumns === cols;
              return (
                <button
                  key={cols}
                  onClick={() => planColumnsMutation.mutate(cols)}
                  className={cn(
                    "relative rounded-xl border-2 p-4 transition-all text-left",
                    selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn("grid gap-1.5", cols === "3" ? "grid-cols-3" : "grid-cols-4")}>
                    {Array.from({ length: Number(cols) }).map((_, i) => (
                      <div key={i} className="h-16 rounded bg-muted" />
                    ))}
                  </div>
                  <p className="text-center text-sm font-medium mt-3">{cols} planos por linha</p>
                  {selected && (
                    <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Com 4 colunas, até 8 planos podem ser exibidos por categoria. Em telas menores o layout se ajusta automaticamente.
          </p>

          <div className="mt-6 pt-6 border-t space-y-6">
            <div>
              <Label className="text-base">Colunas no mobile</Label>
              <p className="text-xs text-muted-foreground mb-3">Quantos planos exibir por linha em celulares.</p>
              <div className="grid grid-cols-2 gap-3">
                {(["1", "2"] as const).map((cols) => {
                  const selected = mobileColumns === cols;
                  return (
                    <button
                      key={cols}
                      onClick={() => mobileColumnsMutation.mutate(cols)}
                      className={cn(
                        "relative rounded-xl border-2 p-3 transition-all text-left",
                        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn("grid gap-1.5 mx-auto max-w-[100px]", cols === "1" ? "grid-cols-1" : "grid-cols-2")}>
                        {Array.from({ length: Number(cols) }).map((_, i) => (
                          <div key={i} className="h-12 rounded bg-muted" />
                        ))}
                      </div>
                      <p className="text-center text-sm font-medium mt-2">{cols} {cols === "1" ? "coluna" : "colunas"}</p>
                      {selected && (
                        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-base">Modo de exibição no mobile</Label>
              <p className="text-xs text-muted-foreground mb-3">Carrossel deslizante ou grade estática.</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "slide", label: "Slide", desc: "Carrossel" },
                  { key: "grade", label: "Grade", desc: "Estático" },
                ] as const).map(({ key, label, desc }) => {
                  const selected = mobileMode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => mobileModeMutation.mutate(key)}
                      className={cn(
                        "relative rounded-xl border-2 p-3 transition-all text-left",
                        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="mx-auto max-w-[100px] h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        {key === "slide" ? "← →" : "▦"}
                      </div>
                      <p className="text-center text-sm font-medium mt-2">{label}</p>
                      <p className="text-center text-xs text-muted-foreground">{desc}</p>
                      {selected && (
                        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MobileDisplayControls
        title="Exibição mobile — Ofertas em Combo"
        description="Controle como os 3 cards (Internet, Entretenimento, Telefonia) aparecem no celular."
        columnsKey="combo_offers_mobile_columns"
        modeKey="combo_offers_mobile_mode"
      />

      <MobileDisplayControls
        title="Exibição mobile — Chip 5G / Móvel"
        description="Controle como os planos móveis aparecem no celular na seção do Chip 5G."
        columnsKey="chip5g_mobile_columns"
        modeKey="chip5g_mobile_mode"
      />

      <MobileDisplayControls
        title="Exibição mobile — Planos Corporativos"
        description="Controle como os planos empresariais aparecem no celular."
        columnsKey="business_plans_mobile_columns"
        modeKey="business_plans_mobile_mode"
      />
    </div>
  );
}
