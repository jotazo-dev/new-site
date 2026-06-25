import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Star, Upload, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DraggableTable } from "@/components/admin/DraggableTable";

const empty = { name: "", rating: 5, text: "", date_label: "", photo_url: "", sort_order: 0, active: true };

export default function AdminDepoimentos() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>(empty);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('testimonials').upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('testimonials').getPublicUrl(path);
      setForm((f: any) => ({ ...f, photo_url: data.publicUrl }));
      toast.success("Foto enviada!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => { const { data, error } = await supabase.from("testimonials").select("*").order("sort_order"); if (error) throw error; return data; },
  });

  const save = useMutation({
    mutationFn: async (item: any) => {
      if (item.id) { const { error } = await supabase.from("testimonials").update(item).eq("id", item.id); if (error) throw error; }
      else { const { id, ...rest } = item; const { error } = await supabase.from("testimonials").insert(rest); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); toast.success("Salvo!"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("testimonials").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); toast.success("Removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase.from("testimonials").update({ sort_order: item.sort_order }).eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Depoimentos" subtitle="Gerencie os depoimentos exibidos na página inicial" onNew={() => { setForm(empty); setOpen(true); }} newLabel="Novo Depoimento" />

      <DraggableTable
        data={data}
        isLoading={isLoading}
        columns={["Nome", "Nota", "Status"]}
        colSpan={3}
        onReorder={(items) => reorder.mutate(items)}
        renderRow={(t) => (
          <>
            <TableCell className="font-medium">{t.name}</TableCell>
            <TableCell>
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </TableCell>
            <TableCell><StatusBadge active={t.active} /></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => { setForm({ ...t }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => { if(confirm("Remover?")) remove.mutate(t.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
              </div>
            </TableCell>
          </>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b"><DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{form.id ? "Editar" : "Novo"} Depoimento</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Nota (1-5)</Label><Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Texto</Label><Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3} /></div>
            <div className="space-y-1"><Label>Data (label)</Label><Input value={form.date_label} onChange={(e) => setForm({ ...form, date_label: e.target.value })} placeholder="2 semanas atrás" /></div>
            <div className="space-y-2">
              <Label>Foto</Label>
              <div className="flex items-center gap-3">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="Preview" className="h-16 w-16 rounded-full object-cover border" />
                ) : (
                  <div className="h-16 w-16 rounded-full border border-dashed flex items-center justify-center text-muted-foreground text-xs">Sem foto</div>
                )}
                <div className="flex-1 space-y-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value=''; }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                    {uploading ? "Enviando..." : "Enviar imagem"}
                  </Button>
                  <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="ou cole uma URL" className="text-xs" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Ordem</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Ativo</Label></div>
            </div>
            <Button className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white" onClick={() => save.mutate(form)} disabled={save.isPending}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
