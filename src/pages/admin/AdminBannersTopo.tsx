import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, X, Monitor, Smartphone } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Slider } from "@/components/ui/slider";

type Banner = {
  id: string;
  path: string;
  image_url: string;
  image_mobile_url: string;
  alt: string;
  link_url: string;
  active: boolean;
  sort_order: number;
  height_px: number;
  overlay_enabled: boolean;
  overlay_color: string;
  overlay_opacity: number;
  overlay_text: string;
  overlay_text_color: string;
  overlay_align_h: string;
  overlay_align_v: string;
  overlay_subtitle: string;
  overlay_cta_text: string;
  overlay_cta_url: string;
  overlay_cta_bg: string;
  overlay_cta_color: string;
  overlay_type: string;
  overlay_color2: string;
  overlay_gradient_dir: string;
  overlay_cta_variant: string;
  overlay_cta_size: string;
};

function ImageUpload({
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
      const path = `${storagePath}-${Date.now()}.${ext}`;
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
      <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 overflow-hidden aspect-[1920/500] flex items-center justify-center">
        {currentUrl ? (
          <>
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-destructive/20" onClick={() => onUploaded("")}>
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
      <Button type="button" variant="outline" size="sm" className="w-full text-xs" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <Upload className="h-3 w-3 mr-1" /> {uploading ? "Enviando..." : "Upload"}
      </Button>
    </div>
  );
}

const emptyForm: Partial<Banner> = {
  path: "*",
  image_url: "",
  image_mobile_url: "",
  alt: "",
  link_url: "",
  active: true,
  sort_order: 0,
  height_px: 300,
  overlay_enabled: false,
  overlay_color: "#000000",
  overlay_opacity: 40,
  overlay_text: "",
  overlay_text_color: "#FFFFFF",
  overlay_align_h: "center",
  overlay_align_v: "center",
  overlay_subtitle: "",
  overlay_cta_text: "",
  overlay_cta_url: "",
  overlay_cta_bg: "#FFFFFF",
  overlay_cta_color: "#000000",
  overlay_type: "solid",
  overlay_color2: "#000000",
  overlay_gradient_dir: "to bottom",
  overlay_cta_variant: "solid",
  overlay_cta_size: "md",
};

export default function AdminBannersTopo() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<Banner>>(emptyForm);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-page-top-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("page_top_banners").select("*").order("sort_order");
      if (error) throw error;
      return data as Banner[];
    },
  });

  const save = useMutation({
    mutationFn: async (item: Partial<Banner>) => {
      if (item.id) {
        const { error } = await supabase.from("page_top_banners").update(item as any).eq("id", item.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = item as any;
        const { error } = await supabase.from("page_top_banners").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-page-top-banners"] });
      qc.invalidateQueries({ queryKey: ["page_top_banners"] });
      toast.success("Salvo!");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("page_top_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-page-top-banners"] });
      qc.invalidateQueries({ queryKey: ["page_top_banners"] });
      toast.success("Removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => { setForm(emptyForm); setOpen(true); };
  const openEdit = (b: Banner) => { setForm(b); setOpen(true); };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Banners do topo"
        subtitle="Banner 1920x500 exibido no topo de cada página (use * para todas)"
        onNew={openNew}
        newLabel="Novo banner"
      />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Rota</TableHead>
              <TableHead>Alt</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7}><TableSkeleton rows={3} columns={7} /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum banner cadastrado</TableCell></TableRow>
            ) : data.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.alt} className="w-32 h-auto rounded border aspect-[1920/500] object-cover" />
                  ) : (
                    <div className="w-32 aspect-[1920/500] bg-muted rounded" />
                  )}
                </TableCell>
                <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{b.path}</code></TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">{b.alt}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{b.link_url || "—"}</TableCell>
                <TableCell>{b.sort_order}</TableCell>
                <TableCell><StatusBadge active={b.active} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (confirm("Excluir banner?")) remove.mutate(b.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar banner" : "Novo banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rota</Label>
                <Input
                  placeholder="* ou /planos"
                  value={form.path || ""}
                  onChange={(e) => setForm({ ...form, path: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">Use <code>*</code> para exibir em todas as páginas, ou um caminho específico (ex: <code>/monte-seu-combo</code>).</p>
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="flex gap-4">
              <ImageUpload
                label="Imagem desktop (1920x500)"
                icon={Monitor}
                hint="Recomendado 1920x500px"
                currentUrl={form.image_url || ""}
                storagePath={`page-top-banner-desktop`}
                onUploaded={(url) => setForm({ ...form, image_url: url })}
              />
              <ImageUpload
                label="Imagem mobile (opcional)"
                icon={Smartphone}
                hint="Para telas até 768px"
                currentUrl={form.image_mobile_url || ""}
                storagePath={`page-top-banner-mobile`}
                onUploaded={(url) => setForm({ ...form, image_mobile_url: url })}
              />
            </div>

            <div className="space-y-2">
              <Label>Texto alternativo (alt)</Label>
              <Input value={form.alt || ""} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder="Descreva a imagem" />
            </div>

            <div className="space-y-2">
              <Label>Link (opcional)</Label>
              <Input value={form.link_url || ""} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/planos ou https://..." />
            </div>

            <div className="space-y-2">
              <Label>Altura (px)</Label>
              <Input
                type="number"
                list="height-suggestions"
                min={100}
                max={1000}
                value={form.height_px ?? 300}
                onChange={(e) => setForm({ ...form, height_px: parseInt(e.target.value) || 300 })}
              />
              <datalist id="height-suggestions">
                <option value="200" />
                <option value="300" />
                <option value="500" />
              </datalist>
              <p className="text-[10px] text-muted-foreground">Sugestões: 200, 300 ou 500px.</p>
            </div>

            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.overlay_enabled ?? false}
                  onCheckedChange={(v) => setForm({ ...form, overlay_enabled: v })}
                />
                <Label>Overlay sobre a imagem</Label>
              </div>

              {form.overlay_enabled && (
                <div className="space-y-4 pl-2">
                  <div className="space-y-2">
                    <Label>Tipo de overlay</Label>
                    <div className="flex gap-1">
                      {[
                        { v: "solid", l: "Cor sólida" },
                        { v: "gradient", l: "Gradiente" },
                      ].map((o) => (
                        <Button
                          key={o.v}
                          type="button"
                          size="sm"
                          variant={(form.overlay_type || "solid") === o.v ? "default" : "outline"}
                          className="flex-1 text-xs"
                          onClick={() => setForm({ ...form, overlay_type: o.v })}
                        >
                          {o.l}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{form.overlay_type === "gradient" ? "Cor inicial" : "Cor do overlay"}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          className="w-14 h-9 p-1 cursor-pointer"
                          value={form.overlay_color || "#000000"}
                          onChange={(e) => setForm({ ...form, overlay_color: e.target.value })}
                        />
                        <Input
                          value={form.overlay_color || "#000000"}
                          onChange={(e) => setForm({ ...form, overlay_color: e.target.value })}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Opacidade ({form.overlay_opacity ?? 40}%)</Label>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[form.overlay_opacity ?? 40]}
                        onValueChange={([v]) => setForm({ ...form, overlay_opacity: v })}
                      />
                    </div>
                  </div>

                  {form.overlay_type === "gradient" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cor final</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="w-14 h-9 p-1 cursor-pointer"
                            value={form.overlay_color2 || "#000000"}
                            onChange={(e) => setForm({ ...form, overlay_color2: e.target.value })}
                          />
                          <Input
                            value={form.overlay_color2 || "#000000"}
                            onChange={(e) => setForm({ ...form, overlay_color2: e.target.value })}
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Direção</Label>
                        <select
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={form.overlay_gradient_dir || "to bottom"}
                          onChange={(e) => setForm({ ...form, overlay_gradient_dir: e.target.value })}
                        >
                          <option value="to right">→ Esquerda → Direita</option>
                          <option value="to left">← Direita → Esquerda</option>
                          <option value="to bottom">↓ Topo → Base</option>
                          <option value="to top">↑ Base → Topo</option>
                          <option value="to bottom right">↘ Diagonal ↘</option>
                          <option value="to bottom left">↙ Diagonal ↙</option>
                          <option value="to top right">↗ Diagonal ↗</option>
                          <option value="to top left">↖ Diagonal ↖</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Texto sobre o banner (opcional)</Label>
                    <Input
                      value={form.overlay_text || ""}
                      onChange={(e) => setForm({ ...form, overlay_text: e.target.value })}
                      placeholder="Ex: Black Friday Jotazo"
                    />
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <Label>Cor do texto</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-14 h-9 p-1 cursor-pointer"
                        value={form.overlay_text_color || "#FFFFFF"}
                        onChange={(e) => setForm({ ...form, overlay_text_color: e.target.value })}
                      />
                      <Input
                        value={form.overlay_text_color || "#FFFFFF"}
                        onChange={(e) => setForm({ ...form, overlay_text_color: e.target.value })}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alinhamento horizontal</Label>
                      <div className="flex gap-1">
                        {[
                          { v: "left", l: "Esquerda" },
                          { v: "center", l: "Centro" },
                          { v: "right", l: "Direita" },
                        ].map((o) => (
                          <Button
                            key={o.v}
                            type="button"
                            size="sm"
                            variant={(form.overlay_align_h || "center") === o.v ? "default" : "outline"}
                            className="flex-1 text-xs"
                            onClick={() => setForm({ ...form, overlay_align_h: o.v })}
                          >
                            {o.l}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Posição vertical</Label>
                      <div className="flex gap-1">
                        {[
                          { v: "top", l: "Topo" },
                          { v: "center", l: "Meio" },
                          { v: "bottom", l: "Base" },
                        ].map((o) => (
                          <Button
                            key={o.v}
                            type="button"
                            size="sm"
                            variant={(form.overlay_align_v || "center") === o.v ? "default" : "outline"}
                            className="flex-1 text-xs"
                            onClick={() => setForm({ ...form, overlay_align_v: o.v })}
                          >
                            {o.l}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Subtítulo (opcional)</Label>
                    <Input
                      value={form.overlay_subtitle || ""}
                      onChange={(e) => setForm({ ...form, overlay_subtitle: e.target.value })}
                      placeholder="Ex: Aproveite descontos exclusivos"
                    />
                  </div>

                  <div className="rounded-md border border-dashed p-3 space-y-3 bg-background/50">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Botão CTA (opcional)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={form.overlay_cta_text || ""}
                        onChange={(e) => setForm({ ...form, overlay_cta_text: e.target.value })}
                        placeholder="Texto do botão"
                      />
                      <Input
                        value={form.overlay_cta_url || ""}
                        onChange={(e) => setForm({ ...form, overlay_cta_url: e.target.value })}
                        placeholder="/planos ou https://..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Cor de fundo</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="w-12 h-9 p-1 cursor-pointer"
                            value={form.overlay_cta_bg || "#FFFFFF"}
                            onChange={(e) => setForm({ ...form, overlay_cta_bg: e.target.value })}
                          />
                          <Input
                            value={form.overlay_cta_bg || "#FFFFFF"}
                            onChange={(e) => setForm({ ...form, overlay_cta_bg: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cor do texto</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="w-12 h-9 p-1 cursor-pointer"
                            value={form.overlay_cta_color || "#000000"}
                            onChange={(e) => setForm({ ...form, overlay_cta_color: e.target.value })}
                          />
                          <Input
                            value={form.overlay_cta_color || "#000000"}
                            onChange={(e) => setForm({ ...form, overlay_cta_color: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Variante</Label>
                        <div className="flex gap-1">
                          {[
                            { v: "solid", l: "Sólido" },
                            { v: "outline", l: "Contornado" },
                            { v: "ghost", l: "Fantasma" },
                          ].map((o) => (
                            <Button
                              key={o.v}
                              type="button"
                              size="sm"
                              variant={(form.overlay_cta_variant || "solid") === o.v ? "default" : "outline"}
                              className="flex-1 text-[11px] px-2"
                              onClick={() => setForm({ ...form, overlay_cta_variant: o.v })}
                            >
                              {o.l}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tamanho</Label>
                        <div className="flex gap-1">
                          {[
                            { v: "sm", l: "P" },
                            { v: "md", l: "M" },
                            { v: "lg", l: "G" },
                          ].map((o) => (
                            <Button
                              key={o.v}
                              type="button"
                              size="sm"
                              variant={(form.overlay_cta_size || "md") === o.v ? "default" : "outline"}
                              className="flex-1 text-xs"
                              onClick={() => setForm({ ...form, overlay_cta_size: o.v })}
                            >
                              {o.l}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Ativo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => save.mutate(form)} disabled={save.isPending}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
