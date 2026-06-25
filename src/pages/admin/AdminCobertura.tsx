import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DraggableTable } from "@/components/admin/DraggableTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TableCell } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

/* ───── Cidades ───── */

type City = {
  id: string;
  name: string;
  state: string;
  active: boolean;
  sort_order: number;
};

function CitiesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<City | null>(null);
  const [form, setForm] = React.useState({ name: "", state: "CE" });

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["coverage_cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coverage_cities")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as City[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("coverage_cities").update({ name: form.name, state: form.state }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coverage_cities").insert({ name: form.name, state: form.state, sort_order: cities.length });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coverage_cities"] }); setOpen(false); toast({ title: "Salvo!" }); },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("coverage_cities").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coverage_cities"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coverage_cities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coverage_cities"] }); toast({ title: "Removida!" }); },
  });

  const reorder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        await supabase.from("coverage_cities").update({ sort_order: item.sort_order }).eq("id", item.id);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coverage_cities"] }),
  });

  const openNew = () => { setEditing(null); setForm({ name: "", state: "CE" }); setOpen(true); };
  const openEdit = (c: City) => { setEditing(c); setForm({ name: c.name, state: c.state }); setOpen(true); };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Cidade</Button>
      </div>

      <DraggableTable
        data={cities}
        isLoading={isLoading}
        columns={["Cidade", "UF", "Status"]}
        colSpan={3}
        onReorder={(items) => reorder.mutate(items)}
        renderRow={(city: City) => (
          <>
            <TableCell className="font-medium">{city.name}</TableCell>
            <TableCell>{city.state}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch checked={city.active} onCheckedChange={(v) => toggle.mutate({ id: city.id, active: v })} />
                <StatusBadge active={city.active} />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEdit(city)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => remove.mutate(city.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
              </div>
            </TableCell>
          </>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Cidade" : "Nova Cidade"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Fortaleza" /></div>
            <div><Label>UF</Label><Input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="CE" maxLength={2} /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => upsert.mutate()} disabled={!form.name.trim() || upsert.isPending}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ───── CEPs ───── */

type CepRange = {
  id: string;
  cep_start: string;
  cep_end: string;
  city_id: string;
  neighborhood: string;
  active: boolean;
};

function formatCepInput(v: string) {
  return v.replace(/\D/g, "").slice(0, 8);
}

function CepsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CepRange | null>(null);
  const [form, setForm] = React.useState({ cep_start: "", cep_end: "", city_id: "", neighborhood: "" });

  const { data: cities = [] } = useQuery({
    queryKey: ["coverage_cities"],
    queryFn: async () => {
      const { data } = await supabase.from("coverage_cities").select("*").order("sort_order");
      return (data || []) as City[];
    },
  });

  const { data: ceps = [], isLoading } = useQuery({
    queryKey: ["coverage_ceps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coverage_ceps").select("*").order("cep_start");
      if (error) throw error;
      return data as CepRange[];
    },
  });

  const cityMap = React.useMemo(() => Object.fromEntries(cities.map((c) => [c.id, c.name])), [cities]);

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        cep_start: form.cep_start,
        cep_end: form.cep_end || form.cep_start,
        city_id: form.city_id,
        neighborhood: form.neighborhood,
      };
      if (editing) {
        const { error } = await supabase.from("coverage_ceps").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coverage_ceps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coverage_ceps"] }); setOpen(false); toast({ title: "Salvo!" }); },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("coverage_ceps").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coverage_ceps"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coverage_ceps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coverage_ceps"] }); toast({ title: "Removido!" }); },
  });

  const openNew = () => { setEditing(null); setForm({ cep_start: "", cep_end: "", city_id: cities[0]?.id || "", neighborhood: "" }); setOpen(true); };
  const openEdit = (c: CepRange) => { setEditing(c); setForm({ cep_start: c.cep_start, cep_end: c.cep_end, city_id: c.city_id, neighborhood: c.neighborhood }); setOpen(true); };

  const fmtCep = (v: string) => v.length === 8 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Faixa de CEP</Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold">CEP Início</th>
              <th className="px-4 py-3 text-left font-semibold">CEP Fim</th>
              <th className="px-4 py-3 text-left font-semibold">Cidade</th>
              <th className="px-4 py-3 text-left font-semibold">Bairro</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Carregando…</td></tr>
            ) : ceps.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma faixa de CEP cadastrada.</td></tr>
            ) : ceps.map((cep) => (
              <tr key={cep.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono">{fmtCep(cep.cep_start)}</td>
                <td className="px-4 py-3 font-mono">{fmtCep(cep.cep_end)}</td>
                <td className="px-4 py-3">{cityMap[cep.city_id] || "—"}</td>
                <td className="px-4 py-3">{cep.neighborhood || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={cep.active} onCheckedChange={(v) => toggle.mutate({ id: cep.id, active: v })} />
                    <StatusBadge active={cep.active} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openEdit(cep)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => remove.mutate(cep.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TooltipTrigger><TooltipContent>Excluir</TooltipContent></Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Faixa de CEP" : "Nova Faixa de CEP"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CEP Início</Label>
                <Input value={form.cep_start} onChange={(e) => setForm((p) => ({ ...p, cep_start: formatCepInput(e.target.value) }))} placeholder="60000000" inputMode="numeric" maxLength={8} className="font-mono" />
              </div>
              <div>
                <Label>CEP Fim</Label>
                <Input value={form.cep_end} onChange={(e) => setForm((p) => ({ ...p, cep_end: formatCepInput(e.target.value) }))} placeholder="Igual ao início se único" inputMode="numeric" maxLength={8} className="font-mono" />
              </div>
            </div>
            <div>
              <Label>Cidade</Label>
              <Select value={form.city_id} onValueChange={(v) => setForm((p) => ({ ...p, city_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} - {c.state}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bairro (opcional)</Label>
              <Input value={form.neighborhood} onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))} placeholder="Ex: Centro" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => upsert.mutate()} disabled={!form.cep_start || !form.city_id || upsert.isPending}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ───── Página ───── */

export default function AdminCobertura() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Cobertura" subtitle="Gerencie as cidades e faixas de CEP atendidas." />
      <Tabs defaultValue="cidades">
        <TabsList>
          <TabsTrigger value="cidades">Cidades</TabsTrigger>
          <TabsTrigger value="ceps">CEPs</TabsTrigger>
        </TabsList>
        <TabsContent value="cidades" className="mt-4"><CitiesTab /></TabsContent>
        <TabsContent value="ceps" className="mt-4"><CepsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
