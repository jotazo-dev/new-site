import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Ticket, ShoppingCart, LogOut, Megaphone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DraggableTable } from "@/components/admin/DraggableTable";

type Coupon = {
  id?: string;
  code: string;
  label: string;
  description: string;
  discount_type: "fixed" | "percent";
  discount_value: number;
  active: boolean;
  show_in_checkout: boolean;
  show_in_exit_popup: boolean;
  show_in_banner: boolean;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number;
  uses_count?: number;
  sort_order: number;
};

const empty: Coupon = {
  code: "",
  label: "",
  description: "",
  discount_type: "fixed",
  discount_value: 0,
  active: true,
  show_in_checkout: true,
  show_in_exit_popup: false,
  show_in_banner: false,
  starts_at: null,
  expires_at: null,
  max_uses: 0,
  sort_order: 0,
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CouponsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Coupon>(empty);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("sort_order");
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const save = useMutation({
    mutationFn: async (item: Coupon) => {
      const payload = { ...item, code: item.code.trim().toUpperCase() };
      if (item.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { id, uses_count, ...rest } = payload as any;
        const { error } = await supabase.from("coupons").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-coupons"] }); toast.success("Cupom salvo!"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("coupons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-coupons"] }); toast.success("Cupom removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const it of items) {
        const { error } = await supabase.from("coupons").update({ sort_order: it.sort_order }).eq("id", it.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Cupons"
        subtitle="Crie cupons promocionais e escolha onde aparecem"
        onNew={() => { setForm(empty); setOpen(true); }}
        newLabel="Novo cupom"
      />

      <DraggableTable
        data={data}
        isLoading={isLoading}
        columns={["Código", "Desconto", "Aparece em", "Usos", "Status"]}
        colSpan={5}
        onReorder={(items) => reorder.mutate(items)}
        renderRow={(c: Coupon) => (
          <>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-bold tracking-wider text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.code}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{c.label}</span>
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {c.discount_type === "percent" ? `${c.discount_value}%` : formatBRL(c.discount_value)}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {c.show_in_checkout && <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"><ShoppingCart className="h-3 w-3" />Checkout</span>}
                {c.show_in_exit_popup && <span className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent-foreground"><LogOut className="h-3 w-3" />Exit popup</span>}
                {c.show_in_banner && <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium"><Megaphone className="h-3 w-3" />Banner</span>}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {c.uses_count ?? 0}{c.max_uses > 0 ? `/${c.max_uses}` : ""}
            </TableCell>
            <TableCell><StatusBadge active={c.active} /></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => { setForm({ ...c }); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => { if(confirm("Remover cupom?")) remove.mutate(c.id!); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
              </div>
            </TableCell>
          </>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {form.id ? "Editar cupom" : "Novo cupom"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Código *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="EX: PRIMEIRA30"
                  maxLength={30}
                />
              </div>
              <div className="space-y-1">
                <Label>Ordem</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Rótulo (mostrado ao cliente)</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="R$30 OFF na 1ª mensalidade"
              />
            </div>

            <div className="space-y-1">
              <Label>Descrição interna</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo de desconto</Label>
                <Select value={form.discount_type} onValueChange={(v: any) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{form.discount_type === "percent" ? "Percentual (1-100)" : "Valor em centavos (3000 = R$30)"}</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Onde o cupom aparece</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /><Label className="cursor-pointer">Checkout (campo "Tem cupom?")</Label></div>
                <Switch checked={form.show_in_checkout} onCheckedChange={(v) => setForm({ ...form, show_in_checkout: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><LogOut className="h-4 w-4 text-accent" /><Label className="cursor-pointer">Popup de saída (Home)</Label></div>
                <Switch checked={form.show_in_exit_popup} onCheckedChange={(v) => setForm({ ...form, show_in_exit_popup: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Megaphone className="h-4 w-4" /><Label className="cursor-pointer">Banner promocional</Label></div>
                <Switch checked={form.show_in_banner} onCheckedChange={(v) => setForm({ ...form, show_in_banner: v })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Início (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at ? form.starts_at.slice(0, 16) : ""}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>
              <div className="space-y-1">
                <Label>Expira em (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at ? form.expires_at.slice(0, 16) : ""}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Limite de usos (0 = ilimitado)</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Ativo</Label>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white"
              onClick={() => {
                if (!form.code.trim()) return toast.error("Código obrigatório");
                if (form.discount_value <= 0) return toast.error("Valor de desconto deve ser maior que zero");
                save.mutate(form);
              }}
              disabled={save.isPending}
            >
              {save.isPending ? "Salvando..." : "Salvar cupom"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminMarketing() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="coupons" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-1">
          <TabsTrigger value="coupons" className="gap-2"><Ticket className="h-4 w-4" />Cupons</TabsTrigger>
        </TabsList>
        <TabsContent value="coupons" className="mt-6">
          <CouponsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
