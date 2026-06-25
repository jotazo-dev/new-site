import * as React from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PremiumPlanCard } from "@/components/shop/PremiumPlanCard";
import { HolographicCard } from "@/components/ui/holographic-card";
import { usePlans } from "@/hooks/usePlans";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { isMobileBlack4GB, MOBILE_BLACK_4GB_FREE_MONTHS } from "@/cart/pricing";
import { playComboSound, preloadGiftAudio } from "@/lib/sounds";
import chipCardImageFallback from "@/assets/jotazo-telecom-cartao-chip-jotazo.png";

export const BLACK_4GB_GIFT_V2_EVENT = "black4gb-gift-v2:show";

export type Black4GBGiftV2EventDetail = {
  fiberName?: string;
  chipName?: string;
  tvName?: string;
  chipImageUrl?: string;
  title?: string;
  description?: string;
  hidePlanCard?: boolean;
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

export function Black4GBGiftDialogV2() {
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Black4GBGiftV2EventDetail | undefined>(undefined);
  const { data: plans = [] } = usePlans();
  const settings = useSiteSettings();
  const navigate = useNavigate();

  const black4GBPlan = React.useMemo(
    () => plans.find((p) => isMobileBlack4GB(p)) ?? null,
    [plans]
  );

  const fiberName = detail?.fiberName;
  const tvName = detail?.tvName;
  const chipImage = detail?.chipImageUrl || settings.chip2_image_url || chipCardImageFallback;
  const chipName = detail?.chipName || settings.chip2_name || "Black Chip 5G Jotazo";
  const tvSummaryName = tvName || (detail?.hidePlanCard && fiberName ? "Plano de TV com + de 100 canais grátis" : undefined);
  const showPlanCard = !detail?.hidePlanCard && !!black4GBPlan;
  const showComboSummary = !showPlanCard && !!(fiberName || chipName || tvSummaryName);
  const useTwoColumns = showPlanCard || showComboSummary;

  React.useEffect(() => {
    preloadGiftAudio();
  }, []);

  React.useEffect(() => {
    function handler(e: Event) {
      // Dedupe: se já mostramos nos últimos 30s (ex: ao adicionar pelo banner
      // e depois navegar para /personalize-seu-combo), ignora o segundo dispatch.
      try {
        const last = Number(sessionStorage.getItem("black4gb-gift-v2:shown-at") || "0");
        if (last && Date.now() - last < 30_000) return;
        sessionStorage.setItem("black4gb-gift-v2:shown-at", String(Date.now()));
      } catch {
        /* noop */
      }
      const d = (e as CustomEvent<Black4GBGiftV2EventDetail>).detail;
      setDetail(d);
      setOpen(true);
      setTimeout(() => {
        playComboSound();
        fireConfetti();
      }, 200);
    }
    window.addEventListener(BLACK_4GB_GIFT_V2_EVENT, handler as EventListener);
    return () => window.removeEventListener(BLACK_4GB_GIFT_V2_EVENT, handler as EventListener);
  }, []);

  const handleOpenChange = React.useCallback((next: boolean) => {
    setOpen(next);
    if (!next) stopConfetti();
  }, []);

  const handleContinue = React.useCallback(() => {
    handleOpenChange(false);
    navigate("/personalize-seu-combo");
  }, [handleOpenChange, navigate]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        {/* Own overlay (sits above the underlying "Plano adicionado" overlay).
            Captures clicks so they don't reach the dialog beneath — keeps both popups open. */}
        <div
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            handleOpenChange(false);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]",
            "transition-opacity duration-300 ease-out",
            open ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className={cn(
            "fixed left-1/2 top-1/2 z-[101] w-[calc(100%-1rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2",
            "max-h-[calc(80dvh+20px)] sm:max-h-[calc(100dvh-2rem)] flex flex-col",
            "rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl",
            "data-[state=open]:animate-gift-pop-in data-[state=closed]:animate-gift-pop-out",
            "overflow-hidden",
          )}
        >
          {/* Soft decorative background */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#25D366]/10 blur-3xl" />
          </div>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-50 rounded-full bg-white/80 p-1.5 text-zinc-600 shadow-sm ring-1 ring-zinc-200 hover:text-zinc-900 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          <div
            className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 md:p-8 pt-10 sm:pt-6 pb-3 md:pb-8">
              {/* HEADER — full width across both columns */}
              <header className="w-full flex flex-col items-center text-center space-y-3 md:space-y-4 mb-6 md:mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#9a7a1a]">
                  <Gift className="h-3.5 w-3.5" />
                  Presente exclusivo
                </div>

                <DialogTitle
                  className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-zinc-900"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {detail?.title ?? "🎁 Parabéns! Você ganhou um presente"}
                </DialogTitle>

              </header>


              <div className={cn(
                "grid grid-cols-1 gap-4 md:gap-8 items-start",
                useTwoColumns ? "md:grid-cols-2" : "md:grid-cols-1",
              )}>

                {/* LEFT — subtitle + chip image + desktop CTA */}
                <div className={cn(
                  "flex flex-col",
                  useTwoColumns ? "items-center md:items-end" : "items-center",
                )}>
                  <DialogDescription className={cn(
                    "text-sm md:text-base text-zinc-600 leading-relaxed w-full max-w-[380px] mb-3 md:mb-4",
                    useTwoColumns ? "text-center md:text-right" : "text-center",
                  )}>
                    {detail?.description ? (
                      detail.description
                    ) : (
                      <>
                        Na contratação do{" "}
                        {fiberName ? (
                          <strong className="text-zinc-900">{fiberName}</strong>
                        ) : (
                          "seu plano de Internet"
                        )}
                        , você ganhou{" "}
                        <strong className="text-[#9a7a1a]">
                          {MOBILE_BLACK_4GB_FREE_MONTHS} meses grátis
                        </strong>{" "}
                        do <strong className="text-zinc-900">Plano 5G Black 4GB</strong>!
                      </>
                    )}
                  </DialogDescription>

                  <HolographicCard className="group w-full max-w-[320px] sm:max-w-[340px] md:max-w-[380px] overflow-hidden rounded-xl">
                    <img
                      src={chipImage}
                      alt={`Cartão do ${chipName}`}
                      className="block h-auto w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </HolographicCard>

                  <div className="hidden md:block w-full max-w-[380px] pt-3">
                    <Button
                      onClick={handleContinue}
                      className="w-full rounded-xl bg-[linear-gradient(110deg,#b8860b_0%,#D4AF37_25%,#FFE066_50%,#D4AF37_75%,#b8860b_100%)] bg-[length:200%_100%] text-black font-semibold ring-1 ring-[#D4AF37]/60 shadow-[0_8px_24px_-6px_rgba(212,175,55,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-500 hover:bg-[position:100%_0] hover:shadow-[0_10px_28px_-4px_rgba(212,175,55,0.7),inset_0_1px_0_rgba(255,255,255,0.6)]"
                      size="lg"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>


              {/* RIGHT — plan card */}
              {showPlanCard && black4GBPlan && (
                <div className="flex flex-col items-center md:items-stretch">
                  <div className="w-full max-w-[320px] sm:max-w-[340px] md:max-w-none rounded-2xl">
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

                  <p className="mt-2 md:mt-3 text-center text-xs text-zinc-500">
                    O plano já foi adicionado automaticamente ao seu carrinho.
                  </p>
                </div>
              )}

              {showComboSummary && (
                <div className="flex flex-col justify-center">
                  <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-lg">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Resumo do combo
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-xl bg-muted/60 p-5 md:p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Internet fibra</p>
                        <p className="mt-1 text-3xl md:text-4xl font-bold text-foreground leading-tight">{fiberName || "Plano de Internet"}</p>
                      </div>

                      <div className="rounded-xl bg-muted/60 p-5 md:p-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chip 5G</p>
                        <p className="mt-1 text-3xl md:text-4xl font-bold text-foreground leading-tight">{chipName}</p>
                      </div>

                      {tvSummaryName && (
                        <div className="rounded-xl bg-muted/60 p-5 md:p-6">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TV + 100 canais grátis</p>
                          <p className="mt-1 text-3xl md:text-4xl font-bold text-foreground leading-tight">{tvSummaryName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Grátis no combo</p>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      O combo já foi aplicado automaticamente no seu carrinho.
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Sticky footer with CTA — mobile only, outside scroll area */}
          <div className="md:hidden shrink-0 border-t border-zinc-200 bg-white/95 backdrop-blur px-4 py-3 z-20">
            <Button
              onClick={handleContinue}
              className="w-full rounded-xl bg-[linear-gradient(110deg,#b8860b_0%,#D4AF37_25%,#FFE066_50%,#D4AF37_75%,#b8860b_100%)] bg-[length:200%_100%] text-black font-semibold ring-1 ring-[#D4AF37]/60 shadow-[0_8px_24px_-6px_rgba(212,175,55,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-500 hover:bg-[position:100%_0] hover:shadow-[0_10px_28px_-4px_rgba(212,175,55,0.7),inset_0_1px_0_rgba(255,255,255,0.6)]"
              size="lg"
            >
              Continuar
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
