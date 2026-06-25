import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Smartphone, AlertTriangle, ArrowLeftRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/data/plans";
import { formatBRL } from "@/data/plans";

interface ChipComboBreakDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chipPlan?: Plan;
  fiberPlan?: Plan;
  /** Manter chip e combo (apenas fechar) */
  onKeep: () => void;
  /** Trocar de plano de chip (remove o atual e abre seção móvel) */
  onSwap: () => void;
  /** Remover o chip e aceitar volta aos preços sem combo */
  onConfirmRemove: () => void;
}

export function ChipComboBreakDialog({
  open,
  onOpenChange,
  chipPlan,
  fiberPlan,
  onKeep,
  onSwap,
  onConfirmRemove,
}: ChipComboBreakDialogProps) {
  // Preço atual da fibra dentro do combo
  const fiberComboPrice = fiberPlan?.priceCents ?? 0;
  // Preço da fibra sem combo (volta para o valor cheio quando há originalPriceCents)
  const fiberStandalonePrice =
    fiberPlan?.originalPriceCents && fiberPlan.originalPriceCents > fiberPlan.priceCents
      ? fiberPlan.originalPriceCents
      : fiberPlan?.priceCents ?? 0;
  const fiberDiff = Math.max(0, fiberStandalonePrice - fiberComboPrice);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl p-7 sm:p-8">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <AlertDialogTitle className="text-2xl leading-tight">
            Sem o Chip 5G, você perde o desconto do combo
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-base">
              <p className="text-base leading-relaxed">
                O preço promocional da Fibra só vale quando vem junto com o Chip 5G. Se remover o chip, sua Fibra volta ao valor sem combo.
              </p>

              {fiberPlan && (
                <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left text-foreground">
                  <div className="text-sm font-bold uppercase tracking-wide text-amber-700">
                    O que muda no seu pedido
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{fiberPlan.name} — agora (combo)</span>
                    <span className="font-bold text-[hsl(142,70%,30%)]">
                      {formatBRL(fiberComboPrice)}/mês
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{fiberPlan.name} — sem o chip</span>
                    <span className="font-bold text-destructive">
                      {formatBRL(fiberStandalonePrice)}/mês
                    </span>
                  </div>

                  {chipPlan && (
                    <div className="flex items-center justify-between gap-3 border-t border-amber-500/30 pt-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        {chipPlan.name} será removido
                      </span>
                    </div>
                  )}

                  {fiberDiff > 0 && (
                    <div className="mt-1 rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm font-semibold text-destructive">
                      Aumento de {formatBRL(fiberDiff)}/mês na Fibra
                    </div>
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-3 flex-col gap-2.5 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            onClick={onKeep}
            className="h-12 w-full bg-[#25D366] text-base font-semibold text-white shadow-md hover:bg-[#25D366]/90"
          >
            ✅ Manter meu Chip 5G
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSwap}
            className="h-11 w-full text-sm font-semibold"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Trocar por outro plano de chip
          </Button>
          <button
            type="button"
            onClick={onConfirmRemove}
            className="m-0 inline-flex h-10 w-full items-center justify-center gap-2 bg-transparent text-sm font-normal text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
          >
            <Trash2 className="h-4 w-4" />
            Remover chip e voltar aos preços sem combo
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
