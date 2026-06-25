import { useState, useRef } from "react";
import { Globe, Image, FileImage, Upload, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AssetItem {
  icon: typeof Globe;
  title: string;
  description: string;
  settingKey: string;
  fallbackFile: string;
  dimensions: string;
  accept: string;
  bucket: string;
  storagePath: string;
}

const items: AssetItem[] = [
  {
    icon: Globe,
    title: "Imagem Open Graph (OG)",
    description: "Imagem exibida ao compartilhar links do site em redes sociais (Facebook, LinkedIn, WhatsApp).",
    settingKey: "og_image_url",
    fallbackFile: "/og-image.jpg",
    dimensions: "1200 × 630 px",
    accept: "image/jpeg,image/png,image/webp",
    bucket: "site-assets",
    storagePath: "branding/og-image",
  },
  {
    icon: FileImage,
    title: "Favicon",
    description: "Ícone que aparece na aba do navegador. Formatos: SVG, ICO, PNG.",
    settingKey: "favicon_url",
    fallbackFile: "/favicon.svg",
    dimensions: "SVG / ICO / 96×96 PNG",
    accept: "image/svg+xml,image/x-icon,image/png",
    bucket: "site-assets",
    storagePath: "branding/favicon",
  },
  {
    icon: Image,
    title: "Apple Touch Icon",
    description: "Ícone para atalho em dispositivos iOS. Recomendado: 180×180 px.",
    settingKey: "apple_touch_icon_url",
    fallbackFile: "/apple-touch-icon.png",
    dimensions: "180 × 180 px",
    accept: "image/png",
    bucket: "site-assets",
    storagePath: "branding/apple-touch-icon",
  },
];

function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function AssetCard({ item }: { item: AssetItem }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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

  const displayUrl = customUrl || item.fallbackFile;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);

      const ext = file.name.split(".").pop() || "png";
      const storagePath = `${item.storagePath}.${ext}`;

      // Upload to storage (upsert)
      const { error: uploadError } = await supabase.storage
        .from(item.bucket)
        .upload(storagePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const publicUrl = getPublicUrl(item.bucket, storagePath) + `?t=${Date.now()}`;

      // Upsert setting
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", item.settingKey)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: publicUrl })
          .eq("key", item.settingKey);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key: item.settingKey, value: publicUrl });
        if (error) throw error;
      }

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_settings", item.settingKey] });
      toast.success(`${item.title} atualizado com sucesso!`);
      setUploading(false);
    },
    onError: (err: Error) => {
      toast.error(`Erro ao enviar: ${err.message}`);
      setUploading(false);
    },
  });

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
          <div className="rounded-lg border bg-muted/30 p-2 flex items-center justify-center" style={{ minWidth: 80, minHeight: 80 }}>
            <img
              src={displayUrl}
              alt={item.title}
              className="max-h-20 max-w-[200px] object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-xs text-muted-foreground">
              <p>Dimensões recomendadas: {item.dimensions}</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={item.accept}
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
              ) : (
                <><Upload className="h-3.5 w-3.5" /> Enviar nova imagem</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OgFaviconTab() {
  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-muted-foreground">
        Envie novas imagens para substituir os ícones e imagens de identidade visual do site.
        As alterações serão aplicadas automaticamente.
      </p>

      {items.map((item) => (
        <AssetCard key={item.settingKey} item={item} />
      ))}

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <Image className="h-4 w-4 text-white" />
            </div>
            PWA (Web App Manifest)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Ícones usados quando o site é instalado como app (PWA). Configurados em <code className="text-xs bg-muted px-1.5 py-0.5 rounded">site.webmanifest</code>.
          </p>
          <div className="flex gap-4">
            {[
              { src: "/web-app-manifest-192x192.png", label: "192×192" },
              { src: "/web-app-manifest-512x512.png", label: "512×512" },
            ].map((icon) => (
              <div key={icon.label} className="text-center space-y-1">
                <div className="rounded-lg border bg-muted/30 p-2 inline-flex items-center justify-center" style={{ width: 64, height: 64 }}>
                  <img src={icon.src} alt={icon.label} className="max-h-12 max-w-12 object-contain" />
                </div>
                <p className="text-xs text-muted-foreground">{icon.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
