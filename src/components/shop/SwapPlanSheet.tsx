import * as React from "react";
import { ArrowLeftRight, ArrowLeft, Smartphone, Database, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/cart/CartContext";
import { formatBRL } from "@/data/plans";
import { useIsMobile } from "@/hooks/use-mobile";
import chip5gCard from "@/assets/chip-5g-card.png";

import type { Plan } from "@/data/plans";

interface SwapPlanSheetProps {
  currentPlan: Plan;
  currentQty: number;
  options: Plan[];
}

// Width of the cart drawer (matches SiteHeader: w-[min(92vw,440px)])
const CART_DRAWER_WIDTH = "min(92vw, 440px)";

export function SwapPlanSheet({ currentPlan, currentQty, options }: SwapPlanSheetProps) {
  const { remove, add, setQty } = useCart();
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const sideOffset = isMobile ? "0px" : `calc(${CART_DRAWER_WIDTH} - 1px)`;

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSelect = (opt: Plan) => {
    if (opt.id === currentPlan.id) return;
    const oldQty = currentQty;
    remove(currentPlan.id);
    add(opt);
    if (oldQty > 1) setQty(opt.id, oldQty);
    toast.success(`Plano trocado para ${opt.name}`);
    setOpen(false);
  };

  const handleAdd = (opt: Plan) => {
    add(opt);
    toast.success(`${opt.name} adicionado ao carrinho`);
    setOpen(false);
  };


  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Trocar plano de Chip 5G"
        title="Trocar plano de Chip 5G"
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </Button>

      {/* Backdrop escuro — mobile cobre tudo, desktop deixa o drawer visível */}
      {open && (
        <div
          className="fixed inset-y-0 left-0 z-30 bg-black/70 animate-in fade-in duration-200"
          style={{ right: sideOffset }}
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Painel deslizante — full screen no mobile, lateral no desktop */}
      {open && (
      <div
        className="fixed inset-y-0 left-0 z-40 animate-in slide-in-from-right-8 duration-300 sm:left-auto sm:w-[320px] sm:max-w-[90vw]"
        style={{ right: sideOffset }}
      >
        <div className="flex h-full flex-col bg-gradient-to-b from-primary to-[hsl(var(--primary)/0.85)] text-white shadow-[-12px_0_32px_-8px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 border-b border-white/15 bg-white/5 p-4 backdrop-blur">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Voltar"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white sm:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="block h-12 w-16 shrink-0 overflow-hidden rounded-md">
              <img src={chip5gCard} alt="Chip 5G Jotazo" className="h-full w-full object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white">Trocar ou adicionar</div>
              <div className="text-[11px] text-white/70">
                Troque o plano atual ou adicione outro Chip 5G.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="hidden rounded-full p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white sm:block"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {(() => {
              const filtered = options.filter((o) => o.id !== currentPlan.id);
              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-xs text-white/70">
                    Nenhuma outra opção disponível.
                  </div>
                );
              }
              return (
                <div className="space-y-2.5">
                  {filtered.map((opt) => {
                    const hasDiscount =
                      !!opt.originalPriceCents && opt.originalPriceCents > opt.priceCents;
                    const dataLabel = (opt as any).dataAmount || (opt as any).data || null;
                    return (
                      <div
                        key={opt.id}
                        className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur transition-all hover:border-white/30 hover:bg-white/15"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#25D366]/20 text-[#25D366] ring-1 ring-[#25D366]/30">
                            <Smartphone className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-white">
                              {opt.name}
                            </div>
                            {dataLabel && (
                              <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                <Database className="h-2.5 w-2.5" /> {dataLabel}
                              </div>
                            )}
                            <div className="mt-1.5 flex items-baseline gap-1">
                              {hasDiscount && (
                                <span className="text-[10px] text-white/60 line-through">
                                  {formatBRL(opt.originalPriceCents!)}
                                </span>
                              )}
                              <span className="text-lg font-extrabold text-white">
                                {formatBRL(opt.priceCents)}
                              </span>
                              <span className="text-[10px] text-white/70">/mês</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelect(opt)}
                            className="h-8 w-full rounded-lg border-white/30 bg-transparent text-xs font-semibold text-white hover:bg-white/15 hover:text-white"
                          >
                            Trocar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAdd(opt)}
                            className="h-8 w-full rounded-lg bg-white text-xs font-semibold text-primary hover:bg-white/90"
                          >
                            + Adicionar
                          </Button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
