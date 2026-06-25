import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Save, Phone, Globe, FileText, Link2, ExternalLink, Palette, Check,
  CalendarClock, Plus, Trash2, Eye, Activity, EyeOff, Code, Plug, Server, Webhook,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { THEMES, type ThemeDefinition } from "@/config/themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { IntegrationsTab } from "@/components/admin/IntegrationsTab";
import { RbxConfigTab } from "@/components/admin/RbxConfigTab";
import { EaiMvnoTab } from "@/components/admin/EaiMvnoTab";
import { AutomationTab } from "@/components/admin/automation/AutomationTab";
import { Signal } from "lucide-react";
import { WHATSAPP } from "@/config/site";

const GENERAL_SETTINGS_FALLBACKS: Record<string, string> = {
  whatsapp_number: WHATSAPP.number,
  phone: "0800 721 0179",
  email: "contato@jotazo.com",
  address: "Fortaleza, Ceará",
  cnpj: "00.000.000/0001-00",
  hours: JSON.stringify(["Seg–Sex: 8h às 18h", "Sáb: 8h às 12h"]),
  privacy_policy_url: "/privacidade",
  terms_url: "/termos",
  base_url: "https://jotazo.com.br",
};

const sections = [
  {
    title: "Contato",
    icon: Phone,
    fields: [
      { key: "whatsapp_number", label: "WhatsApp (número internacional)", placeholder: "5585999999999" },
      { key: "phone", label: "Telefone", placeholder: "(85) 3333-3333" },
      { key: "email", label: "Email", placeholder: "contato@jotazo.com.br" },
      { key: "address", label: "Endereço", placeholder: "Rua X, 123 - Fortaleza/CE" },
      { key: "cnpj", label: "CNPJ", placeholder: "00.000.000/0001-00" },
      { key: "hours", label: "Horário de funcionamento", placeholder: "Seg-Sex 08h-18h" },
    ],
  },
  {
    title: "Redes Sociais",
    icon: Globe,
    fields: [
      { key: "facebook_url", label: "Facebook", placeholder: "https://facebook.com/jotazo" },
      { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/jotazo" },
      { key: "youtube_url", label: "YouTube", placeholder: "https://youtube.com/@jotazo" },
      { key: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/company/jotazo" },
    ],
  },
  {
    title: "Legal",
    icon: FileText,
    fields: [
      { key: "privacy_policy_url", label: "Política de Privacidade URL", placeholder: "/privacidade" },
      { key: "terms_url", label: "Termos de Uso URL", placeholder: "/termos" },
    ],
  },
];

type Schedule = {
  id: string;
  theme_id: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
};

export default function AdminConfiguracoes() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [values, setValues] = React.useState<Record<string, string>>({});

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const [{ data, error }, { data: bioData, error: bioError }] = await Promise.all([
        supabase.from("site_settings").select("*"),
        supabase.from("bio_settings").select("facebook_url, instagram_url, youtube_url").maybeSingle(),
      ]);
      if (error) throw error;
      if (bioError) throw bioError;

      const map: Record<string, string> = {};
      (data ?? []).forEach(({ key, value }) => { map[key] = value ?? ""; });

      const fallbacks: Record<string, string> = {
        ...GENERAL_SETTINGS_FALLBACKS,
        facebook_url: bioData?.facebook_url || "",
        instagram_url: bioData?.instagram_url || "",
        youtube_url: bioData?.youtube_url || "",
      };

      Object.entries(fallbacks).forEach(([key, fallback]) => {
        if (!String(map[key] ?? "").trim() && fallback) map[key] = fallback;
      });

      return map;
    },
  });

  // Sincroniza estado local quando os dados chegam do banco/cache.
  React.useEffect(() => {
    if (settingsData) setValues(settingsData);
  }, [settingsData]);

  const allFields = [
    ...sections.flatMap((s) => s.fields),
    { key: "base_url", label: "", placeholder: "" },
    { key: "site_theme", label: "", placeholder: "" },
    { key: "custom_theme_overrides", label: "", placeholder: "" },
    { key: "meta_pixel_id", label: "", placeholder: "" },
    { key: "ga4_measurement_id", label: "", placeholder: "" },
    { key: "gtm_container_id", label: "", placeholder: "" },
    { key: "meta_pixel_active", label: "", placeholder: "" },
    { key: "meta_capi_token", label: "", placeholder: "" },
    { key: "ga4_active", label: "", placeholder: "" },
    { key: "gtm_active", label: "", placeholder: "" },
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows = allFields.map((f) => ({
        key: f.key,
        value: values[f.key] ?? "",
      }));
      const { error } = await supabase
        .from("site_settings")
        .upsert(rows as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const themeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "site_theme", value: themeId } as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Tema atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const selectTheme = (themeId: string) => {
    setValues((prev) => ({ ...prev, site_theme: themeId }));
    themeMutation.mutate(themeId);
  };

  const activeTheme = values["site_theme"] || "default";
  const [previewThemeId, setPreviewThemeId] = React.useState<string | null>(null);

  // Saved custom themes (created by admin)
  const { data: savedThemes = [] } = useQuery({
    queryKey: ["custom_themes"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_themes")
        .select("id, name, overrides, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteSavedTheme = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_themes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom_themes"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Tema removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <AdminPageHeader title="Configurações" subtitle="Informações gerais do site Jotazo" />

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="geral" className="gap-1.5 text-xs sm:text-sm">
            <Phone className="h-3.5 w-3.5" /> Geral
          </TabsTrigger>
          <TabsTrigger value="dominio" className="gap-1.5 text-xs sm:text-sm">
            <Link2 className="h-3.5 w-3.5" /> Domínio
          </TabsTrigger>
          <TabsTrigger value="temas" className="gap-1.5 text-xs sm:text-sm">
            <Palette className="h-3.5 w-3.5" /> Temas
          </TabsTrigger>
          <TabsTrigger value="pixel" className="gap-1.5 text-xs sm:text-sm">
            <Activity className="h-3.5 w-3.5" /> Script's
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-1.5 text-xs sm:text-sm">
            <Webhook className="h-3.5 w-3.5" /> Automação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6 mt-6">
          {sections.map((section) => (
            <Card key={section.title} className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
                    <section.icon className="h-4 w-4 text-white" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((f) => {
                  if (f.key === "hours") {
                    return (
                      <HoursListEditor
                        key={f.key}
                        value={values[f.key] ?? ""}
                        onChange={(next) => setValues({ ...values, [f.key]: next })}
                      />
                    );
                  }
                  return (
                    <div key={f.key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{f.label}</Label>
                      <Input
                        value={values[f.key] ?? ""}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="dominio" className="space-y-6 mt-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
                  <Globe className="h-4 w-4 text-white" />
                </div>
                URL Base do Site
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Defina a URL base do site. Esta URL é usada para gerar links absolutos, sitemaps, meta tags OG e referências internas.
              </p>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">URL Base (sem barra final)</Label>
                <Input
                  value={values["base_url"] ?? ""}
                  onChange={(e) => setValues({ ...values, base_url: e.target.value })}
                  placeholder="https://jotazo.com.br"
                />
              </div>
              {values["base_url"] && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>URL atual: <strong className="text-foreground">{values["base_url"]}</strong></span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temas" className="space-y-6 mt-6">
          {/* Theme selector */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
                  <Palette className="h-4 w-4 text-white" />
                </div>
                Tema do Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione um tema para alterar as cores do site público. Temas agendados têm prioridade sobre o tema manual.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {THEMES.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isActive={activeTheme === theme.id}
                    isPreviewing={previewThemeId === theme.id}
                    onSelect={() => selectTheme(theme.id)}
                    onPreview={() => setPreviewThemeId(previewThemeId === theme.id ? null : theme.id)}
                    isLoading={themeMutation.isPending}
                  />
                ))}
                {savedThemes.map((st: any) => {
                  const overrides = (st.overrides ?? {}) as Record<string, string>;
                  const swatch = (k: string, fallback: string) =>
                    overrides[k] ? `hsl(${overrides[k]})` : fallback;
                  const dynamicTheme: ThemeDefinition = {
                    id: st.id,
                    name: st.name,
                    description: "Tema personalizado salvo",
                    emoji: "🎨",
                    colors: [
                      { label: "Primary", value: swatch("--primary", "hsl(218,80%,45%)") },
                      { label: "Accent", value: swatch("--accent", "hsl(25,95%,53%)") },
                      { label: "Background", value: swatch("--background", "hsl(0,0%,100%)") },
                    ],
                    overrides,
                  };
                  return (
                    <ThemeCard
                      key={st.id}
                      theme={dynamicTheme}
                      isActive={activeTheme === st.id}
                      isPreviewing={previewThemeId === st.id}
                      onSelect={() => selectTheme(st.id)}
                      onPreview={() => setPreviewThemeId(previewThemeId === st.id ? null : st.id)}
                      isLoading={themeMutation.isPending}
                      onDelete={() => {
                        if (confirm(`Excluir o tema "${st.name}"?`)) deleteSavedTheme.mutate(st.id);
                      }}
                    />
                  );
                })}
              </div>

              {/* Live preview */}
              {previewThemeId && (
                (() => {
                  const dyn = savedThemes.find((s: any) => s.id === previewThemeId);
                  const themeForPreview: ThemeDefinition | undefined = dyn
                    ? {
                        id: dyn.id,
                        name: dyn.name,
                        description: "Tema personalizado salvo",
                        emoji: "🎨",
                        colors: [],
                        overrides: (dyn.overrides ?? {}) as Record<string, string>,
                      }
                    : THEMES.find((t) => t.id === previewThemeId);
                  if (!themeForPreview) return null;
                  return (
                    <ThemePreview
                      theme={themeForPreview}
                      onClose={() => setPreviewThemeId(null)}
                      onApply={() => {
                        selectTheme(themeForPreview.id);
                        setPreviewThemeId(null);
                      }}
                    />
                  );
                })()
              )}
            </CardContent>
          </Card>

          {previewThemeId === "personalizado" && (
            <CustomThemeEditor qc={qc} onSaved={(id) => { setPreviewThemeId(null); selectTheme(id); }} />
          )}

          {/* Theme scheduling */}
          <ThemeScheduler />
        </TabsContent>

        <TabsContent value="pixel" className="space-y-6 mt-6">
          <PixelTab values={values} setValues={setValues} />
          <CustomScriptsManager />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6 mt-6">
          <AutomationTab />
        </TabsContent>

      </Tabs>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white shadow-lg shadow-primary/25"
      >
        <Save className="h-4 w-4 mr-1" />
        {saveMutation.isPending ? "Salvando..." : "Salvar tudo"}
      </Button>
    </div>
  );
}

/* ── Theme Card ── */
function ThemeCard({
  theme, isActive, isPreviewing, onSelect, onPreview, isLoading, onDelete,
}: {
  theme: ThemeDefinition; isActive: boolean; isPreviewing: boolean; onSelect: () => void; onPreview: () => void; isLoading: boolean; onDelete?: () => void;
}) {
  return (
    <div
      className={`relative text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
        isActive
          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
          : isPreviewing
            ? "border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/20"
            : "border-border hover:border-primary/40"
      }`}
    >
      {isActive && (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}
      <span className="text-2xl">{theme.emoji}</span>
      <h3 className="mt-2 font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {theme.name}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5">{theme.description}</p>
      <div className="flex gap-2 mt-3 flex-wrap">
        {theme.colors.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div
              className="h-5 w-5 rounded-full border border-border/50 shadow-sm"
              style={{ backgroundColor: c.value }}
            />
            <span className="text-[10px] text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={onPreview}
        >
          <Eye className="h-3 w-3" />
          {isPreviewing ? "Fechar" : "Preview"}
        </Button>
        {!isActive && (
          <Button
            size="sm"
            className="h-7 text-xs bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white"
            onClick={onSelect}
            disabled={isLoading}
          >
            Aplicar
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Theme Preview ── */
function ThemePreview({ theme, onClose, onApply }: { theme: ThemeDefinition; onClose: () => void; onApply: () => void }) {
  if (!theme) return null;

  const v = (key: string, fallback: string) => theme.overrides[key] || fallback;
  const bg = v("--background", "0 0% 100%");
  const fg = v("--foreground", "218 30% 10%");
  const primary = v("--primary", "218 80% 45%");
  const primaryFg = v("--primary-foreground", "0 0% 100%");
  const card = v("--card", "0 0% 100%");
  const cardFg = v("--card-foreground", "218 30% 10%");
  const muted = v("--muted", "218 15% 93%");
  const mutedFg = v("--muted-foreground", "218 10% 45%");
  const accent = v("--accent", "25 95% 53%");
  const accentFg = v("--accent-foreground", "0 0% 100%");
  const border = v("--border", "218 15% 88%");

  return (
    <div className="mt-6 rounded-xl border-2 border-amber-400 overflow-hidden">
      <div className="flex items-center justify-between bg-amber-50 px-4 py-2 border-b border-amber-200">
        <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview: {theme.emoji} {theme.name}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onClose}>
            Fechar
          </Button>
          <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white" onClick={onApply}>
            <Check className="h-3 w-3 mr-1" /> Aplicar tema
          </Button>
        </div>
      </div>

      {/* Mini site mockup */}
      <div style={{ backgroundColor: `hsl(${bg})`, color: `hsl(${fg})` }} className="p-0">
        {/* Header */}
        <div
          className="px-6 py-3 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${primary} / 0.85))` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-white/20" />
            <span className="text-sm font-bold" style={{ color: `hsl(${primaryFg})` }}>Jotazo</span>
          </div>
          <div className="flex gap-4">
            {["Planos", "Cobertura", "Sobre"].map((l) => (
              <span key={l} className="text-xs opacity-80" style={{ color: `hsl(${primaryFg})` }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div
          className="px-6 py-8"
          style={{ background: `linear-gradient(135deg, hsl(${primary}), hsl(${primary} / 0.7))` }}
        >
          <div className="max-w-md">
            <span className="text-[10px] uppercase tracking-widest opacity-70" style={{ color: `hsl(${primaryFg})` }}>Internet de verdade</span>
            <h2 className="text-lg font-bold mt-1" style={{ color: `hsl(${primaryFg})` }}>
              Velocidade e estabilidade para toda sua casa
            </h2>
            <div className="flex gap-2 mt-3">
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: `hsl(${accent})`, color: `hsl(${accentFg})` }}
              >
                Ver planos
              </div>
              <div
                className="px-3 py-1.5 rounded-lg text-xs border"
                style={{ borderColor: `hsl(${primaryFg} / 0.3)`, color: `hsl(${primaryFg})` }}
              >
                Cobertura
              </div>
            </div>
          </div>
        </div>

        {/* Cards section */}
        <div className="px-6 py-6" style={{ backgroundColor: `hsl(${bg})` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: `hsl(${fg})` }}>Nossos planos</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "100 Mega", price: "R$ 69,90" },
              { name: "300 Mega", price: "R$ 99,90" },
              { name: "500 Mega", price: "R$ 129,90" },
            ].map((plan) => (
              <div
                key={plan.name}
                className="rounded-xl p-3 border"
                style={{
                  backgroundColor: `hsl(${card})`,
                  borderColor: `hsl(${border})`,
                  color: `hsl(${cardFg})`,
                }}
              >
                <p className="text-[10px] font-medium" style={{ color: `hsl(${mutedFg})` }}>{plan.name}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: `hsl(${primary})` }}>{plan.price}</p>
                <div
                  className="mt-2 text-[10px] text-center py-1 rounded-md font-medium"
                  style={{ backgroundColor: `hsl(${primary})`, color: `hsl(${primaryFg})` }}
                >
                  Contratar
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-[10px]"
          style={{ backgroundColor: `hsl(${muted})`, color: `hsl(${mutedFg})` }}
        >
          © 2026 Jotazo Telecom — Preview do tema "{theme.name}"
        </div>
      </div>
    </div>
  );
}

/* ── Custom Theme Editor ── */
const CUSTOM_COLOR_FIELDS = [
  { key: "--primary", label: "Cor principal" },
  { key: "--accent", label: "Cor de destaque" },
  { key: "--background", label: "Fundo" },
] as const;


/* ── Helpers HSL <-> HEX ── */
function hslStringToHex(hsl: string): string {
  const m = hsl.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return "#000000";
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHslString(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "0 0% 0%";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function CustomThemeEditor({
  qc,
  onSaved,
}: {
  qc: ReturnType<typeof useQueryClient>;
  onSaved: (id: string) => void;
}) {
  const defaultTheme = THEMES.find((t) => t.id === "personalizado")!;

  const [overrides, setOverrides] = React.useState<Record<string, string>>(() => ({
    ...defaultTheme.overrides,
  }));
  const [name, setName] = React.useState("");
  const firstColorInputRef = React.useRef<HTMLInputElement | null>(null);

  const createTheme = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Dê um nome ao tema");
      const { data, error } = await supabase
        .from("custom_themes")
        .insert({ name: trimmed, overrides } as any)
        .select("id")
        .single();
      if (error) throw error;
      return data?.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["custom_themes"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success(`Tema "${name}" salvo!`);
      setName("");
      setOverrides({ ...defaultTheme.overrides });
      if (id) onSaved(id);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetToDefaults = () => {
    setOverrides({ ...defaultTheme.overrides });
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          ✨ Criar novo tema personalizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Defina as 3 cores principais e dê um nome. Ao salvar, o tema fica disponível como card para aplicar.
        </p>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Nome do tema</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Black Friday, Natal, Verão..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          {CUSTOM_COLOR_FIELDS.map((f) => {
            const hslValue = overrides[f.key] ?? "";
            const hexValue = hslValue ? hslStringToHex(hslValue) : "#000000";
            return (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{f.label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hexValue}
                    onChange={(e) =>
                      setOverrides((prev) => ({ ...prev, [f.key]: hexToHslString(e.target.value) }))
                    }
                    ref={f.key === "--primary" ? firstColorInputRef : undefined}
                    className="h-10 w-10 shrink-0 cursor-pointer rounded-full border border-border bg-background p-1"
                    aria-label={`Selecionar ${f.label}`}
                  />
                  <Input
                    value={hslValue}
                    onChange={(e) => setOverrides((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="H S% L%"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => createTheme.mutate()}
            disabled={createTheme.isPending || !name.trim()}
            size="sm"
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {createTheme.isPending ? "Salvando..." : "Salvar tema"}
          </Button>
          <Button onClick={resetToDefaults} variant="outline" size="sm" type="button">
            Restaurar cores padrão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Theme Scheduler ── */
function ThemeScheduler() {
  const qc = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["theme_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theme_schedules")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as Schedule[];
    },
  });

  const [newSchedule, setNewSchedule] = React.useState({
    theme_id: "black_friday",
    starts_at: "",
    ends_at: "",
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newSchedule.starts_at || !newSchedule.ends_at) throw new Error("Preencha as datas");
      const { error } = await supabase
        .from("theme_schedules")
        .insert({
          theme_id: newSchedule.theme_id,
          starts_at: new Date(newSchedule.starts_at).toISOString(),
          ends_at: new Date(newSchedule.ends_at).toISOString(),
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["theme_schedules"] });
      qc.invalidateQueries({ queryKey: ["active_theme_schedule"] });
      setNewSchedule({ theme_id: "black_friday", starts_at: "", ends_at: "" });
      toast.success("Agendamento criado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("theme_schedules")
        .update({ active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["theme_schedules"] });
      qc.invalidateQueries({ queryKey: ["active_theme_schedule"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("theme_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["theme_schedules"] });
      qc.invalidateQueries({ queryKey: ["active_theme_schedule"] });
      toast.success("Agendamento removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const themeOptions = THEMES.filter((t) => t.id !== "default");

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const isActiveNow = (s: Schedule) => {
    if (!s.active) return false;
    const now = new Date();
    return new Date(s.starts_at) <= now && new Date(s.ends_at) >= now;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
            <CalendarClock className="h-4 w-4 text-white" />
          </div>
          Agendamento de Temas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Agende temas para períodos específicos. Temas agendados ativos têm prioridade sobre o tema manual.
        </p>

        {/* New schedule form */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <h4 className="text-sm font-medium">Novo agendamento</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tema</Label>
              <Select
                value={newSchedule.theme_id}
                onValueChange={(v) => setNewSchedule({ ...newSchedule, theme_id: v })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.emoji} {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Início</Label>
              <Input
                type="datetime-local"
                value={newSchedule.starts_at}
                onChange={(e) => setNewSchedule({ ...newSchedule, starts_at: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fim</Label>
              <Input
                type="datetime-local"
                value={newSchedule.ends_at}
                onChange={(e) => setNewSchedule({ ...newSchedule, ends_at: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending}
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {addMutation.isPending ? "Criando..." : "Agendar"}
          </Button>
        </div>

        {/* Existing schedules */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento criado.</p>
        ) : (
          <div className="space-y-2">
            {schedules.map((s) => {
              const theme = THEMES.find((t) => t.id === s.theme_id);
              const active = isActiveNow(s);
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                    active ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <span className="text-lg">{theme?.emoji ?? "🎨"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs">
                      {theme?.name ?? s.theme_id}
                      {active && (
                        <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                          ATIVO AGORA
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(s.starts_at)} → {formatDate(s.ends_at)}
                    </p>
                  </div>
                  <Switch
                    checked={s.active}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: s.id, active: v })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Pixel Tab ── */
const pixelServices = [
  {
    key: "meta_pixel",
    settingKey: "meta_pixel_id",
    activeKey: "meta_pixel_active",
    title: "Meta Pixel (Facebook)",
    description: "Rastreie conversões, crie públicos e otimize anúncios no Facebook e Instagram.",
    placeholder: "123456789012345",
    icon: "📘",
    helpUrl: "https://business.facebook.com/events_manager",
  },
  {
    key: "ga4",
    settingKey: "ga4_measurement_id",
    activeKey: "ga4_active",
    title: "Google Analytics (GA4)",
    description: "Acompanhe visitas, comportamento de usuários e conversões no Google Analytics.",
    placeholder: "G-XXXXXXXXXX",
    icon: "📊",
    helpUrl: "https://analytics.google.com",
  },
  {
    key: "gtm",
    settingKey: "gtm_container_id",
    activeKey: "gtm_active",
    title: "Google Tag Manager",
    description: "Gerencie todas as tags de rastreamento em um só lugar com o GTM.",
    placeholder: "GTM-XXXXXXX",
    icon: "🏷️",
    helpUrl: "https://tagmanager.google.com",
  },
];

function PixelTab({
  values,
  setValues,
}: {
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [showCapiToken, setShowCapiToken] = React.useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure os pixels e tags de rastreamento. Ative cada serviço e insira o ID correspondente. Os scripts serão injetados automaticamente no site público.
      </p>
      {pixelServices.map((svc) => {
        const isActive = values[svc.activeKey] === "true";
        const idValue = values[svc.settingKey] ?? "";
        const isMetaPixel = svc.key === "meta_pixel";
        const capiToken = values["meta_capi_token"] ?? "";

        return (
          <Card key={svc.key} className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <span className="text-xl">{svc.icon}</span>
                  {svc.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{isActive ? "Ativo" : "Inativo"}</span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      setValues((prev) => ({ ...prev, [svc.activeKey]: checked ? "true" : "false" }))
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{svc.description}</p>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ID</Label>
                <Input
                  value={idValue}
                  onChange={(e) => setValues((prev) => ({ ...prev, [svc.settingKey]: e.target.value }))}
                  placeholder={svc.placeholder}
                  disabled={!isActive}
                  className={!isActive ? "opacity-50" : ""}
                />
              </div>

              {/* Meta CAPI Token — only for Meta Pixel */}
              {isMetaPixel && isActive && (
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <Label className="text-xs text-muted-foreground">Token da API de Conversões (CAPI)</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Token para envio de eventos server-side via Conversions API. Melhora a precisão das conversões.
                  </p>
                  <div className="relative">
                    <Input
                      type={showCapiToken ? "text" : "password"}
                      value={capiToken}
                      onChange={(e) => setValues((prev) => ({ ...prev, meta_capi_token: e.target.value }))}
                      placeholder="EAAxxxxxxxxx..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCapiToken(!showCapiToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCapiToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {capiToken && (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg p-2">
                      <Check className="h-3.5 w-3.5" />
                      <span>Token CAPI configurado</span>
                    </div>
                  )}
                </div>
              )}

              {idValue && isActive && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg p-2">
                  <Check className="h-3.5 w-3.5" />
                  <span>ID configurado: <code className="font-mono">{idValue}</code></span>
                </div>
              )}
              <a
                href={svc.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir painel do serviço
              </a>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Custom Scripts Manager ── */
function CustomScriptsManager() {
  const qc = useQueryClient();

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ["custom_scripts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_scripts")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [editing, setEditing] = React.useState<{
    id?: string;
    name: string;
    position: string;
    content: string;
    active: boolean;
  } | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const payload = {
        name: editing.name,
        position: editing.position,
        content: editing.content,
        active: editing.active,
      };
      if (editing.id) {
        const { error } = await supabase
          .from("custom_scripts")
          .update(payload as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("custom_scripts")
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom_scripts"] });
      setEditing(null);
      toast.success("Script salvo!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_scripts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom_scripts"] });
      toast.success("Script removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("custom_scripts")
        .update({ active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom_scripts"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <Code className="h-4 w-4 text-white" />
            </div>
            Scripts Personalizados
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setEditing({ name: "", position: "head", content: "", active: true })}
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Novo Script
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Adicione scripts customizados (chatbots, pixels extras, widgets) que serão injetados no site público.
        </p>

        {/* Editor */}
        {editing && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-medium">{editing.id ? "Editar Script" : "Novo Script"}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ex: Chatbot, Hotjar, TikTok Pixel"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Posição</Label>
                <Select
                  value={editing.position}
                  onValueChange={(v) => setEditing({ ...editing, position: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head">Head (carrega antes)</SelectItem>
                    <SelectItem value="body">Body (carrega depois)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Código (HTML / JS)</Label>
              <Textarea
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                placeholder={'<script src="https://..."></script>'}
                rows={5}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !editing.name || !editing.content}
                className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : scripts.length === 0 && !editing ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum script personalizado adicionado.</p>
        ) : (
          <div className="space-y-2">
            {scripts.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <Code className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{s.name || "Sem nome"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.position === "head" ? "📄 Head" : "📦 Body"} · {s.content.length} caracteres
                  </p>
                </div>
                <Switch
                  checked={s.active}
                  onCheckedChange={(v) => toggleMutation.mutate({ id: s.id, active: v })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setEditing({
                      id: s.id,
                      name: s.name,
                      position: s.position,
                      content: s.content,
                      active: s.active,
                    })
                  }
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HoursListEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  // Parse current value: try JSON array, otherwise treat as single string
  const items = React.useMemo(() => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const arr = parsed.filter((s) => typeof s === "string");
        return arr.length > 0 ? arr : [""];
      }
    } catch {}
    return [value || ""];
  }, [value]);

  const update = (next: string[]) => {
    const cleaned = next.length === 0 ? [""] : next;
    onChange(JSON.stringify(cleaned));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Horários de funcionamento</Label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                update(next);
              }}
              placeholder="Ex.: Seg–Sex: 8h às 18h"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const next = items.filter((_, idx) => idx !== i);
                update(next);
              }}
              disabled={items.length === 1}
              aria-label="Remover horário"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => update([...items, ""])}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar horário
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Cada linha aparecerá como um horário separado no rodapé do site.
      </p>
    </div>
  );
}

