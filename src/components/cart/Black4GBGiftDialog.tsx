import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PremiumPlanCard } from "@/components/shop/PremiumPlanCard";
import { usePlans } from "@/hooks/usePlans";
import { isMobileBlack4GB, MOBILE_BLACK_4GB_FREE_MONTHS } from "@/cart/pricing";
import { Gift, Sparkles } from "lucide-react";

export const BLACK_4GB_GIFT_EVENT = "black4gb-gift:show";

export type Black4GBGiftEventDetail = {
  fiberName?: string;
};

type ConfettiFn = (opts?: Record<string, unknown>) => void;
let confettiInstance: (ConfettiFn & { reset?: () => void }) | null = null;

async function fireConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  confettiInstance = confetti as unknown as ConfettiFn & { reset?: () => void };
  const defaults = {
    startVelocity: 38,
    spread: 360,
    ticks: 70,
    zIndex: 9999,
    colors: ["#D4AF37", "#FFD700", "#25D366", "#1e88e5", "#ffffff"],
    disableForReducedMotion: true,
  };
  const fire = (ratio: number, opts: Record<string, unknown>) =>
    confetti({ ...defaults, ...opts, particleCount: Math.floor(160 * ratio) });
  fire(0.25, { spread: 26, startVelocity: 60, origin: { y: 0.6 } });
  fire(0.2, { spread: 60, origin: { y: 0.6 } });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9, origin: { y: 0.6 } });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, origin: { y: 0.6 } });
  fire(0.1, { spread: 120, startVelocity: 50, origin: { y: 0.6 } });
}

function stopConfetti() {
  try {
    confettiInstance?.reset?.();
  } catch {
    /* noop */
  }
}

export function Black4GBGiftDialog() {
  const [open, setOpen] = React.useState(false);
  const [fiberName, setFiberName] = React.useState<string | undefined>(undefined);
  const { data: plans = [] } = usePlans();

  const black4GBPlan = React.useMemo(
    () => plans.find((p) => isMobileBlack4GB(p)) ?? null,
    [plans]
  );

  React.useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<Black4GBGiftEventDetail>).detail;
      setFiberName(detail?.fiberName);
      setOpen(true);
      // Slight delay so confetti fires after dialog mounts
      setTimeout(() => {
        fireConfetti();
      }, 200);
    }
    window.addEventListener(BLACK_4GB_GIFT_EVENT, handler as EventListener);
    return () => window.removeEventListener(BLACK_4GB_GIFT_EVENT, handler as EventListener);
  }, []);

  const handleOpenChange = React.useCallback((next: boolean) => {
    setOpen(next);
    if (!next) stopConfetti();
  }, []);

  if (!black4GBPlan) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        {/* No overlay — the underlying "Plan added" dialog already provides one */}
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Allow closing on outside click via overlay handler
            e.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-[101] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "max-h-[calc(100dvh-2rem)] flex flex-col",
            "rounded-xl border-0 bg-gradient-to-br from-black via-zinc-900 to-black text-white shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-2",
            "duration-300 ease-out overflow-hidden",
          )}
        >
          {/* Glow background */}
          <div className="pointer-events-none absolute inset-0 opacity-60 z-0">
            <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#25D366]/20 blur-3xl" />
          </div>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-50 rounded-sm text-white/80 opacity-90 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          <div className="relative z-10 flex flex-col min-h-0 max-h-full">
            <div className="overflow-y-auto overscroll-contain px-5 pt-6 pb-2 sm:px-6 space-y-4">
              <DialogHeader className="space-y-2 text-center">
                <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#b8860b] shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                  <Gift className="h-6 w-6 sm:h-7 sm:w-7 text-black" />
                </div>
                <DialogTitle
                  className="text-xl sm:text-2xl font-bold text-[#D4AF37] pr-6"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  🎁 Parabéns! Você ganhou um presente
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Na contratação do {fiberName ? <strong className="text-white">{fiberName}</strong> : "seu plano de Internet"}, você ganhou{" "}
                  <strong className="text-[#D4AF37]">{MOBILE_BLACK_4GB_FREE_MONTHS} meses grátis</strong> do{" "}
                  <strong className="text-white">Plano 5G Black 4GB</strong>!
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-2xl bg-black/40 p-2 ring-1 ring-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
                <PremiumPlanCard
                  plan={black4GBPlan}
                  allPlans={plans}
                  isSelected
                  isBlackCard
                  freeOverride
                  compact
                  topRightBadge={{
                    label: "GRÁTIS",
                    icon: <Sparkles className="h-3 w-3" />,
                  }}
                />
              </div>

              <p className="text-center text-xs text-zinc-400">
                O plano já foi adicionado automaticamente ao seu carrinho.
              </p>
            </div>

            <div className="shrink-0 px-5 pb-5 pt-3 sm:px-6 sm:pb-6 bg-gradient-to-t from-black via-black/95 to-transparent">
              <Button
                onClick={() => handleOpenChange(false)}
                className="w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b8860b] text-black font-semibold hover:opacity-95"
                size="lg"
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
