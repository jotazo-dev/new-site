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
import { Pencil, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DraggableTable } from "@/components/admin/DraggableTable";

const empty = { question: "", answer: "", sort_order: 0, active: true };

export default function AdminFAQ() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<any>(empty);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => { const { data, error } = await supabase.from("faqs").select("*").order("sort_order"); if (error) throw error; return data; },
  });

  const save = useMutation({
    mutationFn: async (item: any) => {
      if (item.id) { const { error } = await supabase.from("faqs").update(item).eq("id", item.id); if (error) throw error; }
      else { const { id, ...rest } = item; const { error } = await supabase.from("faqs").insert(rest); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-faqs"] }); toast.success("Salvo!"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("faqs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-faqs"] }); toast.success("Removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase.from("faqs").update({ sort_order: item.sort_order }).eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-faqs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="FAQ" subtitle="Gerencie as perguntas frequentes" onNew={() => { setForm(empty); setOpen(true); }} newLabel="Nova Pergunta" />

      <DraggableTable
        data={data}
        isLoading={isLoading}
        columns={["Pergunta", "Status"]}
        colSpan={2}
        onReorder={(items) => reorder.mutate(items)}
        renderRow={(f) => (
          <>
            <TableCell className="max-w-xs truncate font-medium">{f.question}</TableCell>
            <TableCell><StatusBadge active={f.active} /></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => { setForm({ ...f }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => { if(confirm("Remover?")) remove.mutate(f.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
              </div>
            </TableCell>
          </>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b"><DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{form.id ? "Editar" : "Nova"} Pergunta</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1"><Label>Pergunta</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
            <div className="space-y-1"><Label>Resposta</Label><Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} /></div>
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
