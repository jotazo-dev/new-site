import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Wifi, Smartphone, Tv, Phone, CreditCard, QrCode, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL, type Plan } from "@/data/plans";
import { PremiumPlanCard } from "@/components/shop/PremiumPlanCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ICONS = {
  fibra: Wifi,
  movel: Smartphone,
  tv: Tv,
  combo: Phone,
} as const;

interface CategoryAccordionProps {
  title: string;
  category: "fibra" | "movel" | "tv" | "combo";
  plans: Plan[];
  selectedId?: string;
  open: boolean;
  onToggleOpen: () => void;
  /** kept for API compat — selection is handled inside PremiumPlanCard via cart */
  onSelect?: (plan: Plan) => void;
  onRemove?: (planId: string) => void;
  /** called when the inner card selects a plan id (or null when deselecting) */
  onCardSelect?: (planId: string | null, plan: Plan) => void;
  freeNote?: string;
  /** all plans, needed by PremiumPlanCard for bumps */
  allPlans: Plan[];
  /** if set, renders a "Grátis" ribbon over the card with this id */
  freeOverlayPlanId?: string;
  /** if set, renders a promo badge below the card with this id */
  promoBadgePlanId?: string;
  promoBadgeText?: string;
  /** Móvel only: chip type filter (5g vs black) */
  chipTypeFilter?: "5g" | "black";
  onChipTypeChange?: (next: "5g" | "black") => void;
  /** Móvel only: chip card images & labels */
  chipImages?: { key: "5g" | "black"; name: string; description: string; image: string; bestseller?: boolean }[];
  /** Móvel only: SIM format selector — shown after a plan is selected */
  simFormat?: "fisico" | "esim";
  onSimFormatChange?: (next: "fisico" | "esim") => void;
}

export function CategoryAccordion({
  title,
  category,
  plans,
  selectedId,
  open,
  onToggleOpen,
  freeNote,
  allPlans,
  onCardSelect,
  freeOverlayPlanId,
  promoBadgePlanId,
  promoBadgeText,
  chipTypeFilter,
  onChipTypeChange,
  chipImages,
  simFormat,
  onSimFormatChange,
}: CategoryAccordionProps) {
  const Icon = ICONS[category];
  const selected = plans.find((p) => p.id === selectedId);
  const isFree = freeOverlayPlanId != null && freeOverlayPlanId === selectedId;
  const showMobileExtras = category === "movel";

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    skipSnaps: false,
    duration: 20,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [snapCount, setSnapCount] = useState(0);
  const [selectedSnap, setSelectedSnap] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  const updateState = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
    setSelectedSnap(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateState();
    emblaApi.on("select", updateState);
    emblaApi.on("reInit", updateState);
    // NOTE: removed "scroll" listener — was causing setState per frame and stutter on mobile
  }, [emblaApi, updateState]);

  // Re-init on first open and when plans list changes
  useEffect(() => {
    if (open && emblaApi) {
      emblaApi.reInit();
      setHasInitialized(true);
    }
  }, [open, emblaApi, plans.length]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Quando o accordion abre, garantir que o topo dele fique visível
  // IMPORTANTE: pular o disparo inicial no mount para não rolar a página ao entrar
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!open) return;
    // Aguarda o conteúdo expandir antes de calcular posição
    const t = window.setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Header sticky do site costuma cobrir o topo — usar offset
      const headerOffset = 96;
      if (rect.top < headerOffset || rect.top > window.innerHeight * 0.4) {
        const top = window.scrollY + rect.top - headerOffset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [open]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();
  const scrollTo = (idx: number) => emblaApi?.scrollTo(idx);

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
            selected ? "bg-[hsl(142,70%,40%)]/10 text-[hsl(142,70%,40%)]" : "bg-accent/10 text-accent"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-foreground">
              {title}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {selected ? (
                <span className="text-[hsl(142,70%,40%)] truncate">
                  ✓ {selected.name} — {isFree ? (
                    <>
                      <span className="line-through opacity-60">{formatBRL(selected.priceCents)}/mês</span>{" "}
                      <span className="font-bold">Grátis</span>
                    </>
                  ) : (
                    <>{formatBRL(selected.priceCents)}/mês</>
                  )}
                </span>
              ) : (
                "Escolha uma opção"
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected && <CheckCircle2 className="h-8 w-8 fill-[hsl(142,70%,40%)] text-white" />}
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-muted/20 p-3 sm:p-5 min-w-0 overflow-hidden">
          {freeNote && (
            <div className="mb-3 rounded-lg bg-[hsl(142,70%,40%)]/10 px-3 py-2 text-sm text-[hsl(142,70%,30%)]">
              🎁 {freeNote}
            </div>
          )}
          {showMobileExtras && onChipTypeChange && (
            <div className={cn("mb-4 grid gap-3", (chipImages?.length ?? 2) > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {(chipImages ?? [
                { key: "5g" as const, name: "Chip 5G", description: "Velocidade máxima", image: "" },
                { key: "black" as const, name: "Black Chip 5G", description: "Franquia controlada", image: "" },
              ]).map((chip) => {
                const active = chipTypeFilter === chip.key;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => onChipTypeChange(chip.key)}
                    aria-pressed={active}
                    aria-label={`Selecionar ${chip.name}`}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border bg-card p-3 text-left transition-all duration-300",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active
                        ? "border-accent ring-2 ring-accent shadow-lg bg-gradient-to-br from-primary/5 via-card to-accent/5"
                        : "border-border hover:border-primary/40 hover:shadow-md opacity-80 hover:opacity-100",
                    )}
                  >
                    {chip.bestseller && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-gradient-to-r from-accent to-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-foreground shadow-md">
                        ⭐ Mais vendido
                      </span>
                    )}

                    {active && (
                      <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}

                    {active && (
                      <>
                        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-3xl" aria-hidden />
                        <div className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-accent/10 blur-3xl" aria-hidden />
                      </>
                    )}

                    <div className="relative flex items-center gap-3">
                      {chip.image && (
                        <div className="w-20 shrink-0 overflow-hidden rounded-sm">
                          <img
                            src={chip.image}
                            alt={`Cartão do ${chip.name}`}
                            className="block h-auto w-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-primary">
                          Chip Jotazo
                        </div>
                        <div className="mt-0.5 text-sm font-bold tracking-tight">{chip.name}</div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{chip.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {plans.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma opção disponível.</div>
          ) : (
            <div className="relative">
              <div
                className="overflow-hidden px-1 py-3 min-w-0"
                ref={emblaRef}
                style={{ touchAction: "pan-y" }}
              >
                <div className="flex gap-3 sm:gap-4 min-w-0 py-1">
                  {plans.map((plan) => {
                    const isSelected = plan.id === selectedId;
                    const showFreeRibbon = freeOverlayPlanId === plan.id;
                    const showPromoBadge = promoBadgePlanId === plan.id && !!promoBadgeText;
                    return (
                      <div
                        key={plan.id}
                        className="relative flex-[0_0_85%] min-w-0 xs:flex-[0_0_75%] sm:flex-[0_0_260px]"
                      >
                        <PremiumPlanCard
                          plan={plan}
                          allPlans={allPlans}
                          isSelected={isSelected}
                          onSelect={(id) => onCardSelect?.(id, plan)}
                          freeOverride={showFreeRibbon}
                          compact={false}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile dots indicator */}
              {snapCount > 1 && (
                <div className="mt-2 flex items-center justify-center gap-1.5 sm:hidden">
                  {Array.from({ length: snapCount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Ir para slide ${i + 1}`}
                      onClick={() => scrollTo(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === selectedSnap
                          ? "w-6 bg-primary"
                          : "w-1.5 bg-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                aria-label={`Ver opção anterior de ${title}`}
                onClick={scrollPrev}
                disabled={!canPrev}
                className={cn(
                  "absolute left-0 top-1/2 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition md:flex",
                  canPrev ? "opacity-100 hover:bg-muted" : "pointer-events-none opacity-0",
                )}
              >
                <ChevronLeft className="h-5 w-5 text-foreground" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Ver próxima opção de ${title}`}
                onClick={scrollNext}
                disabled={!canNext}
                className={cn(
                  "absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition md:flex",
                  canNext ? "opacity-100 hover:bg-muted" : "pointer-events-none opacity-0",
                )}
              >
                <ChevronRight className="h-5 w-5 text-foreground" aria-hidden="true" />
              </button>
            </div>
          )}
          {showMobileExtras && selectedId && onSimFormatChange && (
            <TooltipProvider delayDuration={200}>
              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Formato do chip
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: "fisico" as const, name: "Cartão SIM", description: "Chip físico entregue", icon: CreditCard, showTooltip: false },
                    { key: "esim" as const, name: "eSIM Digital", description: "Ative na hora pelo QR", icon: QrCode, showTooltip: true },
                  ]).map((opt) => {
                    const active = simFormat === opt.key;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => onSimFormatChange(opt.key)}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border bg-card p-3 text-left transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          active
                            ? "border-accent ring-2 ring-accent shadow-md bg-gradient-to-br from-primary/5 via-card to-accent/5"
                            : "border-border hover:border-primary/40 opacity-80 hover:opacity-100",
                        )}
                      >
                        <div className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          active ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary",
                        )}>
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold">{opt.name}</span>
                            {opt.showTooltip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center justify-center rounded-full bg-muted p-0.5 cursor-help hover:bg-primary/10 transition-colors"
                                  >
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs p-3">
                                  <div className="space-y-2">
                                    <p className="font-semibold text-sm">O que é eSIM?</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      É um chip digital embutido no celular. Você ativa em minutos escaneando um QR Code — sem precisar de chip físico.
                                    </p>
                                    <p className="font-semibold text-xs pt-1">Aparelhos compatíveis:</p>
                                    <ul className="text-xs text-muted-foreground space-y-0.5">
                                      <li>• iPhone XS, XR e modelos mais recentes</li>
                                      <li>• Samsung Galaxy S20, Z Flip, Z Fold e mais recentes</li>
                                      <li>• Google Pixel 3 e modelos mais recentes</li>
                                      <li>• Outros celulares com eSIM habilitado</li>
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{opt.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
}
