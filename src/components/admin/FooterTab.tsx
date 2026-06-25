import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FooterTheme = "white" | "blue" | "blue_orange" | "white_blue_hover" | "black_chip";

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return data?.value || null;
}

async function upsertSetting(key: string, value: string) {
  const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
  if (existing) {
    await supabase.from("site_settings").update({ value }).eq("key", key);
  } else {
    await supabase.from("site_settings").insert({ key, value });
  }
}

function FooterPreview({ variant }: { variant: FooterTheme }) {
  const isBlue = variant === "blue";
  const isBlueOrange = variant === "blue_orange";
  const isWhiteHover = variant === "white_blue_hover";
  const isBlackChip = variant === "black_chip";
  const isDark = isBlue || isBlueOrange || isBlackChip;

  if (isBlackChip) {
    return (
      <div className="rounded-lg overflow-hidden border border-white/10">
        <div
          className="p-3 space-y-2"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 0%, rgba(255,102,0,0.18) 0%, #000 55%)",
          }}
        >
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-8 rounded bg-[#ff6600]/60" />
                <div className="h-2 w-12 rounded bg-white/30" />
                <div className="h-2 w-10 rounded bg-white/30" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-5 flex items-center justify-center gap-2 px-3 bg-black">
          <div className="h-2 w-2 rounded-full bg-[#ff6600]" />
          <div className="h-2 w-12 rounded bg-white/40" />
        </div>
      </div>
    );
  }

  const bg = isDark ? "bg-primary" : "bg-card";
  const linkColor = isDark ? "bg-white/30" : "bg-foreground/20";
  const titleColor = isDark ? "bg-white/60" : "bg-foreground/40";
  const bottomBg = isBlueOrange ? "bg-accent" : isDark ? "bg-primary" : "bg-muted/50";

  return (
    <div className="rounded-lg overflow-hidden border">
      <div className={cn("p-3 space-y-2", bg)}>
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-1">
            <div className={cn("h-3 w-8 rounded", titleColor)} />
            <div className={cn("h-2 w-12 rounded", linkColor)} />
            <div className={cn("h-2 w-10 rounded", linkColor)} />
          </div>
          <div className="space-y-1">
            <div className={cn("h-2 w-10 rounded", titleColor)} />
            <div className={cn("h-2 w-8 rounded", linkColor)} />
            <div className={cn("h-2 w-10 rounded", linkColor)} />
          </div>
          <div className="space-y-1">
            <div className={cn("h-2 w-10 rounded", titleColor)} />
            {isWhiteHover ? (
              <div className="h-2 w-10 rounded bg-primary" />
            ) : (
              <div className={cn("h-2 w-10 rounded", linkColor)} />
            )}
            <div className={cn("h-2 w-8 rounded", linkColor)} />
          </div>
          <div className="space-y-1">
            <div className={cn("h-2 w-10 rounded", titleColor)} />
            <div className={cn("h-2 w-8 rounded", linkColor)} />
            <div className={cn("h-2 w-10 rounded", linkColor)} />
          </div>
        </div>
      </div>
      <div className={cn("h-5 flex items-center justify-center gap-2 px-3", bottomBg)}>
        <div className={cn("h-2 w-2 rounded-full", isBlueOrange || isDark ? "bg-white/50" : "bg-foreground/20")} />
        <div className={cn("h-2 w-12 rounded", isBlueOrange || isDark ? "bg-white/40" : "bg-foreground/20")} />
      </div>
    </div>
  );
}

export function FooterTab() {
  const qc = useQueryClient();

  const { data: theme = "white" } = useQuery({
    queryKey: ["site_settings", "footer_theme"],
    queryFn: async () => ((await getSetting("footer_theme")) as FooterTheme) || "white",
  });

  const themeMutation = useMutation({
    mutationFn: async (newTheme: FooterTheme) => {
      await upsertSetting("footer_theme", newTheme);
      try { localStorage.setItem("footer_theme_cache", newTheme); } catch {}
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Tema do footer atualizado!");
    },
  });

  const options: { key: FooterTheme; label: string }[] = [
    { key: "blue", label: "Azul" },
    { key: "white", label: "Branco (padrão)" },
    { key: "blue_orange", label: "Azul + Laranja" },
    { key: "white_blue_hover", label: "Branco + Hover Azul" },
    { key: "black_chip", label: "Black Chip 🖤" },
  ];

  // Cores customizadas dos links do menu do footer
  const { data: linkColor = "" } = useQuery({
    queryKey: ["site_settings", "footer_link_color"],
    queryFn: async () => (await getSetting("footer_link_color")) || "",
  });
  const { data: linkHoverColor = "" } = useQuery({
    queryKey: ["site_settings", "footer_link_hover_color"],
    queryFn: async () => (await getSetting("footer_link_hover_color")) || "",
  });

  const [linkColorDraft, setLinkColorDraft] = React.useState("");
  const [linkHoverDraft, setLinkHoverDraft] = React.useState("");

  React.useEffect(() => { setLinkColorDraft(linkColor || "#64748b"); }, [linkColor]);
  React.useEffect(() => { setLinkHoverDraft(linkHoverColor || "#00358f"); }, [linkHoverColor]);

  const colorMutation = useMutation({
    mutationFn: async () => {
      await upsertSetting("footer_link_color", linkColorDraft);
      await upsertSetting("footer_link_hover_color", linkHoverDraft);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Cores dos links do footer atualizadas!");
    },
  });

  const resetColors = useMutation({
    mutationFn: async () => {
      await upsertSetting("footer_link_color", "");
      await upsertSetting("footer_link_hover_color", "");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      setLinkColorDraft("#64748b");
      setLinkHoverDraft("#00358f");
      toast.success("Cores resetadas para o padrão do tema");
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estilo do Footer</CardTitle>
          <CardDescription>Escolha a aparência do rodapé do site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {options.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => themeMutation.mutate(key)}
                className={cn(
                  "relative rounded-xl border-2 p-1 transition-all",
                  theme === key ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                )}
              >
                <FooterPreview variant={key} />
                <p className="text-center text-sm font-medium mt-2 pb-1">{label}</p>
                {theme === key && (
                  <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cores dos Links do Menu</CardTitle>
          <CardDescription>Personalize a cor dos links do rodapé e a cor ao passar o mouse (hover)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor dos links</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={linkColorDraft}
                  onChange={(e) => setLinkColorDraft(e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input value={linkColorDraft} onChange={(e) => setLinkColorDraft(e.target.value)} placeholder="#64748b" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor ao passar o mouse (hover)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={linkHoverDraft}
                  onChange={(e) => setLinkHoverDraft(e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input value={linkHoverDraft} onChange={(e) => setLinkHoverDraft(e.target.value)} placeholder="#00358f" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
            <div className="flex flex-wrap gap-4">
              {["Planos Fibra", "TV por Assinatura", "Cobertura", "Atendimento"].map((l) => (
                <a
                  key={l}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm transition-colors"
                  style={{ color: linkColorDraft }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = linkHoverDraft)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = linkColorDraft)}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => colorMutation.mutate()} disabled={colorMutation.isPending}>
              Salvar cores
            </Button>
            <Button variant="outline" onClick={() => resetColors.mutate()} disabled={resetColors.isPending}>
              Resetar para padrão do tema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
