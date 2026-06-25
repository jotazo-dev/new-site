import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Plan, formatBRL } from "@/data/plans";
import { PlanIncludeIcon } from "@/components/shop/PlanIncludeIcon";
import { CheckCircle2 } from "lucide-react";

interface PlanSelectedDialogProps {
  plan: Plan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanSelectedDialog({ plan, open, onOpenChange }: PlanSelectedDialogProps) {
  const navigate = useNavigate();

  if (!plan) return null;

  const handleCustomize = () => {
    onOpenChange(false);
    navigate("/personalize-seu-combo");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-1rem)] max-w-3xl md:max-w-md rounded-2xl p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Success header */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 px-6 pt-8 pb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]/15">
            <CheckCircle2 className="h-8 w-8 text-[#25D366]" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold">Plano adicionado!</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Confira o resumo e personalize seu combo.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Plan details */}
        <div className="px-6 pb-2 pt-4 space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold">{formatBRL(plan.priceCents)}</div>
                <div className="text-[11px] text-muted-foreground">por mês</div>
              </div>
            </div>

            {plan.badges && plan.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {plan.badges.map((b) => (
                  <Badge key={b} variant="secondary" className="text-[10px]">{b}</Badge>
                ))}
              </div>
            )}

            {plan.includes.length > 0 && (
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {plan.includes.slice(0, 4).map((it, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <PlanIncludeIcon icon={it.icon} className="h-3.5 w-3.5 text-accent" />
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 space-y-2.5">
          <Button className="w-full rounded-xl text-base" size="lg" onClick={handleCustomize}>
            ✅ Concluir meu pedido
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            Continuar navegando
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
