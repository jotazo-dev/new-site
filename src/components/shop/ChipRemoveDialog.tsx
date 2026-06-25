import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Smartphone, Sparkles } from "lucide-react";
import type { Plan } from "@/data/plans";
import { formatBRL } from "@/data/plans";

interface ChipRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  chipName?: string;
  /** Plano de chip 5G atualmente no carrinho — usado para extrair os benefícios reais. */
  chipPlan?: Plan;
}

const TITLE_VARIATIONS: Array<{ title: string; intro: string }> = [
  { title: "Tem certeza que quer ficar sem o seu Chip 5G? 📶", intro: "Antes de remover, dá uma olhada no que vem com este plano:" },
  { title: "Espera! Olha o que você leva com o Chip 5G 🚀", intro: "Esses benefícios continuam com você se mantiver o chip:" },
  { title: "Não desconecte ainda 💚", intro: "Veja o que faz parte do seu plano Chip 5G:" },
];

export function ChipRemoveDialog({ open, onOpenChange, onConfirm, chipName, chipPlan }: ChipRemoveDialogProps) {
  const [variation, setVariation] = React.useState(() =>
    TITLE_VARIATIONS[Math.floor(Math.random() * TITLE_VARIATIONS.length)],
  );

  React.useEffect(() => {
    if (open) {
      setVariation(TITLE_VARIATIONS[Math.floor(Math.random() * TITLE_VARIATIONS.length)]);
    }
  }, [open]);

  const benefits = React.useMemo(() => {
    if (!chipPlan) return [] as string[];
    const fromIncludes = (chipPlan.includes || [])
      .map((i) => (typeof i === "string" ? i : i?.text))
      .filter((t): t is string => !!t && t.trim().length > 0);
    return fromIncludes;
  }, [chipPlan]);

  const displayName = chipName || chipPlan?.name || "Chip 5G";
  const priceLabel = chipPlan ? formatBRL(chipPlan.priceCents) : "";
  const originalLabel =
    chipPlan?.originalPriceCents && chipPlan.originalPriceCents > chipPlan.priceCents
      ? formatBRL(chipPlan.originalPriceCents)
      : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl p-7 sm:p-8">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
            <Smartphone className="h-8 w-8" />
          </div>
          <AlertDialogTitle className="text-2xl leading-tight">{variation.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-base">
              <p className="text-base leading-relaxed">{variation.intro}</p>

              <div className="space-y-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 text-left text-foreground">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#25D366]">
                    <Sparkles className="h-4 w-4" />
                    {displayName}
                  </div>
                  {priceLabel && (
                    <div className="text-right text-sm">
                      {originalLabel && (
                        <span className="mr-1 text-muted-foreground line-through">{originalLabel}</span>
                      )}
                      <span className="font-bold text-[#25D366]">{priceLabel}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  )}
                </div>

                {benefits.length > 0 ? (
                  <ul className="space-y-2.5 text-base">
                    {benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 leading-snug">
                        <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-[#25D366]" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Você perderá os benefícios deste plano ao remover.
                  </p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-3 flex-col gap-2.5 sm:flex-col sm:space-x-0">
          <AlertDialogCancel className="m-0 h-12 w-full border-[#25D366] bg-[#25D366] text-base font-semibold text-white shadow-md hover:bg-[#25D366]/90 hover:text-white">
            ✅ Manter meu Chip 5G
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="m-0 h-10 w-full border-none bg-transparent text-sm font-normal text-muted-foreground underline-offset-2 shadow-none hover:bg-transparent hover:text-destructive hover:underline"
          >
            Remover chip e limpar pedido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
