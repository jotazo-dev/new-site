import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export type FunnelStep = { label: string; path: string; icon: string };

export const ICON_OPTIONS = [
  "Home", "ListChecks", "MapPin", "MessageCircle", "FileText",
  "Eye", "Globe", "Users", "Calendar", "ShoppingCart", "Phone", "Star",
];

export const DEFAULT_FUNNEL_STEPS: FunnelStep[] = [
  { label: "Home", path: "/", icon: "Home" },
  { label: "Planos", path: "/planos", icon: "ListChecks" },
  { label: "Cobertura", path: "/cobertura", icon: "MapPin" },
  { label: "Atendimento", path: "/atendimento", icon: "MessageCircle" },
];

export function FunnelStepsDialog({
  open,
  onOpenChange,
  initialSteps,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialSteps: FunnelStep[];
}) {
  const [steps, setSteps] = React.useState<FunnelStep[]>(initialSteps);
  const [saving, setSaving] = React.useState(false);
  const qc = useQueryClient();

  React.useEffect(() => {
    if (open) setSteps(initialSteps.length ? initialSteps : DEFAULT_FUNNEL_STEPS);
  }, [open, initialSteps]);

  const update = (i: number, patch: Partial<FunnelStep>) =>
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));

  const move = (i: number, dir: -1 | 1) => {
    setSteps((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const remove = (i: number) => {
    if (steps.length <= 2) {
      toast({ title: "Mínimo de 2 etapas", variant: "destructive" });
      return;
    }
    setSteps((s) => s.filter((_, idx) => idx !== i));
  };

  const add = () => {
    if (steps.length >= 6) {
      toast({ title: "Máximo de 6 etapas", variant: "destructive" });
      return;
    }
    setSteps((s) => [...s, { label: "Nova etapa", path: "/", icon: "Eye" }]);
  };

  const restore = () => setSteps(DEFAULT_FUNNEL_STEPS);

  const save = async () => {
    for (const s of steps) {
      if (!s.label.trim() || !s.path.trim()) {
        toast({ title: "Preencha label e path em todas as etapas", variant: "destructive" });
        return;
      }
      if (!s.path.startsWith("/")) {
        toast({ title: `Path "${s.path}" deve começar com /`, variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "funnel_steps", value: JSON.stringify(steps) }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Etapas do funil atualizadas" });
    qc.invalidateQueries({ queryKey: ["funnel-steps-setting"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar etapas do funil</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {steps.map((step, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Etapa #{i + 1}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === steps.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input value={step.label} onChange={(e) => update(i, { label: e.target.value })} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Caminho (path)</Label>
                  <Input value={step.path} onChange={(e) => update(i, { path: e.target.value })} className="h-8" placeholder="/planos" />
                </div>
                <div>
                  <Label className="text-xs">Ícone</Label>
                  <Select value={step.icon} onValueChange={(v) => update(i, { icon: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={add} disabled={steps.length >= 6}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar etapa
          </Button>
          <Button variant="outline" size="sm" onClick={restore}>
            <RotateCcw className="mr-1 h-4 w-4" /> Restaurar padrão
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
