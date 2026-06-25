import { useState, useEffect, useCallback } from "react";
import { HolographicCard } from "@/components/ui/holographic-card";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/cart/CartContext";
import { Link } from "react-router-dom";
import { Check, CreditCard, QrCode, Info } from "lucide-react";

import { formatBRL, type Plan } from "@/data/plans";
import { buildWhatsAppChip5gUrl } from "@/lib/whatsapp";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePlans } from "@/hooks/usePlans";
import { parseChipBadges, getChipBadgeIcon } from "@/lib/chipBadgeIcons";
import { PremiumPlanCard } from "@/components/shop/PremiumPlanCard";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import chipCardImageFallback from "@/assets/jotazo-telecom-cartao-chip-jotazo.png";

type ChipKey = "5g" | "black";

function pickDataAllowance(plan: Plan) {
  return plan.includes.find((i) => /\b\d+\s*GB\b/i.test(i.text));
}

function pickTopFeatures(plan: Plan) {
  const allowance = pickDataAllowance(plan);
  return plan.includes
    .filter((i) => i !== allowance)
    .filter((i) => i.text.trim().length > 0)
    .slice(0, 3);
}

interface Chip5GLaunchSectionProps {
  showAllChips?: boolean;
  hideLaunchBadges?: boolean;
  titleOverride?: string;
  stackedLayout?: boolean;
  onlyChip?: ChipKey;
}

export function Chip5GLaunchSection({ showAllChips = false, hideLaunchBadges = false, titleOverride, stackedLayout = false, onlyChip }: Chip5GLaunchSectionProps) {
  const settings = useSiteSettings();
  const { data: plans = [], isLoading } = usePlans();
  const { add, remove, items } = useCart();
  const navigate = useNavigate();

  // Pick default chip: prefer "5g" if active AND has data plans, otherwise "black"
  const defaultChip = (() => {
    if (settings.chip5g_active === "false") return "black";
    const has5gPlans = plans.some((p) => p.category === "movel" && (p.chipType || "5g") === "5g");
    return has5gPlans ? "5g" : "black";
  })();

  const [selectedChip, setSelectedChipState] = useState<ChipKey>(() => {
    const saved = localStorage.getItem("chip5g_selectedChip");
    return saved === "5g" || saved === "black" ? saved : defaultChip;
  });
  const [simFormat, setSimFormatState] = useState<"fisico" | "esim">(() => {
    const saved = localStorage.getItem("chip5g_simFormat");
    return saved === "fisico" || saved === "esim" ? saved : "fisico";
  });

  const setSelectedChip = useCallback((v: ChipKey) => {
    setSelectedChipState(v);
    localStorage.setItem("chip5g_selectedChip", v);
  }, []);

  const setSimFormat = useCallback((v: "fisico" | "esim") => {
    setSimFormatState(v);
    localStorage.setItem("chip5g_simFormat", v);
  }, []);

  // Force selection when onlyChip prop is provided
  useEffect(() => {
    if (onlyChip && selectedChip !== onlyChip) {
      setSelectedChipState(onlyChip);
    }
  }, [onlyChip, selectedChip]);

  // Fallback: if saved chip has no plans after loading, reset to default
  useEffect(() => {
    if (onlyChip) return;
    if (!isLoading && plans.length > 0) {
      const hasPlansForSaved = plans.some(
        (p) => p.category === "movel" && (p.chipType || "5g") === selectedChip
      );
      if (!hasPlansForSaved) {
        setSelectedChip(defaultChip);
      }
    }
  }, [isLoading, plans, selectedChip, defaultChip, setSelectedChip, onlyChip]);

  const bestsellerKey = (settings.chip_bestseller as ChipKey | "none") || "5g";

  const allChips: { key: ChipKey; name: string; description: string; image: string; bestseller?: boolean }[] = [
    {
      key: "5g",
      name: settings.chip5g_name || "Chip 5G Jotazo",
      description: settings.chip5g_description || "Rede 5G de alta velocidade",
      image: settings.chip5g_image_url || chipCardImageFallback,
      bestseller: bestsellerKey === "5g",
    },
    {
      key: "black",
      name: settings.chip2_name || "Black Chip 5G Jotazo",
      description: settings.chip2_description || "Franquia controlada, sem surpresas",
      image: settings.chip2_image_url || chipCardImageFallback,
      bestseller: bestsellerKey === "black",
    },
  ];

  const chips = onlyChip
    ? allChips.filter((c) => c.key === onlyChip)
    : showAllChips
    ? allChips
    : allChips.filter((c) =>
        c.key === "5g" ? settings.chip5g_active !== "false" : settings.chip2_active !== "false"
      );

  if (chips.length === 0) return null;

  const activeChip = chips.find((c) => c.key === selectedChip) ?? chips[0];

  const activeKey = activeChip.key;

  const activeBadges = parseChipBadges(
    activeKey === "5g" ? settings.chip5g_badges : settings.chip2_badges,
  );

  const mobilePlans = plans
    .filter((p) => p.category === "movel")
    .filter((p) => (p.chipType || "5g") === activeKey)
    .sort((a, b) => a.priceCents - b.priceCents);

  const mobileColumns = settings["chip5g_mobile_columns"] === "2" ? 2 : 1;
  const mobileMode = settings["chip5g_mobile_mode"] === "grade" ? "grade" : "slide";

  if (isLoading) {
    return (
      <section className="space-y-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </section>
    );
  }

  const handleSelectPlan = (p: Plan) => {
    const isSelected = items.some((i) => i.plan.id === p.id);
    if (isSelected) {
      remove(p.id);
      return;
    }
    // Replace any existing mobile plan in cart
    items
      .filter((i) => i.plan.category === "movel" && i.plan.id !== p.id)
      .forEach((i) => remove(i.plan.id));
    add(p);
  };

  const renderPlanCard = (p: typeof mobilePlans[number]) => {
    const isSelected = items.some((i) => i.plan.id === p.id);
    const FormatIcon = simFormat === "esim" ? QrCode : CreditCard;
    const isBlack =
      p.name.toLowerCase().includes("black") ||
      (p.description || "").toLowerCase().includes("black") ||
      (p.chipType || "").toLowerCase().includes("black");
    return (
      <PremiumPlanCard
        key={p.id}
        plan={p}
        allPlans={plans}
        isSelected={isSelected}
        onSelect={() => handleSelectPlan(p)}
        isBlackCard={isBlack}
        topRightBadge={{
          label: simFormat === "esim" ? "eSIM" : "SIM",
          icon: <FormatIcon className="h-3 w-3" />,
        }}
      />
    );
  };

  return (
    <section aria-labelledby="chip5g-title" className="space-y-8">
      <header className="space-y-4 text-center">
        {!hideLaunchBadges && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge className="bg-black text-[#D4AF37] border-0 px-4 py-1 text-xs font-bold uppercase tracking-wider">
              🚀 Lançamento
            </Badge>
          </div>
        )}

        <h2 id="chip5g-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
          {titleOverride || "O 5G mais estável do Brasil na palma da sua mão"}
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base leading-relaxed">
          Tecnologia inteligente que mantém você conectado mesmo quando outras falham
        </p>
      </header>

      {stackedLayout ? (
        /* ── Stacked layout: each chip as its own full section ── */
        <div className="space-y-16">
          {/* Order: 5g first, then black */}
          {(["5g", "black"] as ChipKey[])
            .map((key) => chips.find((c) => c.key === key))
            .filter(Boolean)
            .map((chip) => {
              const chipPlans = plans
                .filter((p) => p.category === "movel")
                .filter((p) => (p.chipType || "5g") === chip!.key)
                .sort((a, b) => a.priceCents - b.priceCents);

              const chipBadges = parseChipBadges(
                chip!.key === "5g" ? settings.chip5g_badges : settings.chip2_badges,
              );

              return (
                <div key={chip!.key} className="space-y-6">
                  {/* Chip card + name */}
                  <div className="flex flex-col items-center gap-3">
                    <HolographicCard className="group w-full max-w-[360px] sm:max-w-[400px] overflow-hidden rounded-xl">
                      <img
                        src={chip!.image}
                        alt={`Cartão do ${chip!.name}`}
                        className="block h-auto w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </HolographicCard>
                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Chip Jotazo
                      </div>
                      <h3 className="mt-0.5 text-lg font-bold tracking-tight">{chip!.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-sm">{chip!.description}</p>
                    </div>
                  </div>

                  {/* SIM format selector */}
                  <TooltipProvider delayDuration={200}>
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                        Formato do chip
                      </h3>
                      <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                        {([
                          { key: "fisico" as const, name: "Cartão SIM", description: "Chip físico", icon: CreditCard, badge: null, showTooltip: false },
                          { key: "esim" as const, name: "eSIM", description: "Chip Digital", icon: QrCode, badge: null, showTooltip: true },
                        ]).map((opt) => {
                          const isActive = simFormat === opt.key;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setSimFormat(opt.key)}
                              aria-pressed={isActive}
                              className={cn(
                                "group relative flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-left transition-all duration-200",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                isActive
                                  ? "border-accent ring-1 ring-accent shadow-sm bg-gradient-to-br from-primary/5 via-card to-accent/5"
                                  : "border-border hover:border-primary/30 opacity-70 hover:opacity-100",
                              )}
                            >
                              <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                                isActive ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary",
                              )}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold tracking-tight">{opt.name}</span>
                                  {opt.badge && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                      {opt.badge}
                                    </span>
                                  )}
                                  {opt.showTooltip && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center justify-center rounded-full bg-muted p-0.5 cursor-help hover:bg-primary/10 transition-colors">
                                          <Info className="h-2.5 w-2.5 text-muted-foreground hover:text-primary" />
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
                                <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                              </div>
                              {isActive && (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </TooltipProvider>

                  {/* Badges */}
                  {chipBadges.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:flex-nowrap sm:justify-center items-stretch sm:items-center gap-2 w-full px-2">
                      {chipBadges.map((h, idx) => {
                        const Icon = getChipBadgeIcon(h.icon);
                        return (
                          <div
                            key={`${h.text}-${idx}`}
                            className="group flex sm:min-w-0 items-center justify-center gap-1.5 rounded-full border bg-card/60 px-2.5 py-2 backdrop-blur-sm transition-colors duration-200 hover:bg-primary hover:border-primary hover:text-primary-foreground cursor-default"
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0 text-primary transition-colors group-hover:text-primary-foreground" />
                            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground sm:whitespace-nowrap transition-colors group-hover:text-primary-foreground">{h.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Plans grid */}
                  {chipPlans.length === 0 ? (
                    <Card className="rounded-2xl border-dashed">
                      <CardContent className="p-8 text-center text-sm text-muted-foreground">
                        Em breve novos planos para o <strong className="text-foreground">{chip!.name}</strong>. Fale com a gente no WhatsApp!
                        <div className="mt-4">
                          <Button asChild className="rounded-xl">
                            <a href={buildWhatsAppChip5gUrl({ chipName: chip!.name, simFormat })} target="_blank" rel="noreferrer">
                              Quero meu {chip!.name}
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="animate-in fade-in duration-300">
                      <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-1">
                        {chipPlans.map(renderPlanCard)}
                      </div>
                      <div className="sm:hidden">
                        {mobileMode === "slide" ? (
                          <Carousel opts={{ align: "start", loop: false }} className="w-full">
                            <CarouselContent>
                              {chipPlans.map((p) => (
                                <CarouselItem
                                  key={p.id}
                                  className={cn(mobileColumns === 2 ? "basis-1/2" : "basis-[86%]")}
                                >
                                  <div className="h-full p-1">{renderPlanCard(p)}</div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious variant="outline" className="-left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
                            <CarouselNext variant="outline" className="-right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
                          </Carousel>
                        ) : (
                          <div className={cn("grid gap-4 p-1", mobileColumns === 2 ? "grid-cols-2" : "grid-cols-1")}>
                            {chipPlans.map(renderPlanCard)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        /* ── Original toggle layout ── */
        <>
          {chips.length === 1 ? (
            /* Layout centralizado: chip grande em cima, formato + badges embaixo */
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex flex-col items-center gap-3">
                <HolographicCard className="group w-full max-w-[400px] sm:max-w-[440px] overflow-hidden rounded-xl">
                  <img
                    src={activeChip.image}
                    alt={`Cartão do ${activeChip.name}`}
                    className="block h-auto w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </HolographicCard>
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Chip Jotazo
                  </div>
                  <h3 className="mt-0.5 text-lg font-bold tracking-tight">{activeChip.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-sm">{activeChip.description}</p>
                </div>
              </div>

              <div className="w-full max-w-sm sm:max-w-3xl space-y-4">
                <TooltipProvider delayDuration={200}>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                      Formato do chip
                    </h3>
                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                      {([
                        { key: "fisico" as const, name: "Cartão SIM", description: "Chip físico", icon: CreditCard, badge: null, showTooltip: false },
                        { key: "esim" as const, name: "eSIM", description: "Chip Digital", icon: QrCode, badge: null, showTooltip: true },
                      ]).map((opt) => {
                        const isActive = simFormat === opt.key;
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setSimFormat(opt.key)}
                            aria-pressed={isActive}
                            className={cn(
                              "group relative flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-left transition-all duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              isActive
                                ? "border-accent ring-1 ring-accent shadow-sm bg-gradient-to-br from-primary/5 via-card to-accent/5"
                                : "border-border hover:border-primary/30 opacity-70 hover:opacity-100",
                            )}
                          >
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                              isActive ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary",
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold tracking-tight">{opt.name}</span>
                                {opt.badge && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                    {opt.badge}
                                  </span>
                                )}
                                {opt.showTooltip && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center justify-center rounded-full bg-muted p-0.5 cursor-help hover:bg-primary/10 transition-colors">
                                        <Info className="h-2.5 w-2.5 text-muted-foreground hover:text-primary" />
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
                              <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                            </div>
                            {isActive && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </TooltipProvider>

                {activeBadges.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:flex-nowrap sm:justify-center items-stretch sm:items-center gap-2 w-full px-2">
                    {activeBadges.map((h, idx) => {
                      const Icon = getChipBadgeIcon(h.icon);
                      return (
                        <div
                          key={`${h.text}-${idx}`}
                          className="group flex sm:min-w-0 items-center justify-center gap-1.5 rounded-full border bg-card/60 px-2.5 py-2 sm:py-2.5 backdrop-blur-sm transition-colors duration-200 hover:bg-primary hover:border-primary hover:text-primary-foreground cursor-default"
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-primary transition-colors group-hover:text-primary-foreground" />
                          <span className="text-[11px] sm:text-xs font-medium text-muted-foreground sm:whitespace-nowrap transition-colors group-hover:text-primary-foreground">{h.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-10 grid-cols-2 max-w-2xl mx-auto">
                {chips.map((chip) => {
                  const isActive = selectedChip === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setSelectedChip(chip.key)}
                      aria-pressed={isActive}
                      aria-label={`Selecionar ${chip.name}`}
                      className={cn(
                        "group relative flex flex-col items-center gap-2 text-center p-1 transition-all duration-300",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl",
                        isActive ? "opacity-100" : "opacity-60 hover:opacity-90",
                      )}
                    >
                      {chip.bestseller && (
                        <span className="absolute left-1 top-1 z-10 rounded-full bg-gradient-to-r from-accent to-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-lg">
                          ⭐ Mais vendido
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <HolographicCard className="group w-full max-w-[320px] sm:max-w-[380px] overflow-hidden rounded-xl">
                        <img
                          src={chip.image}
                          alt={`Cartão do ${chip.name}`}
                          className="block h-auto w-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      </HolographicCard>
                      <div className="w-full">
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary">
                          Chip Jotazo
                        </div>
                        <h3 className="mt-1 text-base sm:text-lg font-bold tracking-tight">{chip.name}</h3>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2">{chip.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <TooltipProvider delayDuration={200}>
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Escolha o formato do seu chip
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto p-1">
                    {([
                      { key: "fisico" as const, name: "Cartão SIM", description: "Chip físico entregue na sua casa", icon: CreditCard, badge: null, showTooltip: false },
                      { key: "esim" as const, name: "eSIM", description: "Chip Digital", icon: QrCode, badge: null, showTooltip: true },
                    ]).map((opt) => {
                      const isActive = simFormat === opt.key;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setSimFormat(opt.key)}
                          aria-pressed={isActive}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-all duration-300",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            isActive
                              ? "border-accent ring-2 ring-accent shadow-lg bg-gradient-to-br from-primary/5 via-card to-accent/5"
                              : "border-border hover:border-primary/40 hover:shadow-md opacity-80 hover:opacity-100",
                          )}
                        >
                          <div className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                            isActive ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary",
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold tracking-tight">{opt.name}</span>
                              {opt.badge && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                  {opt.badge}
                                </span>
                              )}
                              {opt.showTooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center justify-center rounded-full bg-muted p-1 cursor-help hover:bg-primary/10 transition-colors">
                                      <Info className="h-3 w-3 text-muted-foreground hover:text-primary" />
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
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{opt.description}</p>
                          </div>
                          {isActive && (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </TooltipProvider>

              <div className="space-y-6">
                {activeBadges.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:flex-nowrap sm:justify-center items-stretch sm:items-center gap-2 w-full">
                    {activeBadges.map((h, idx) => {
                      const Icon = getChipBadgeIcon(h.icon);
                      return (
                        <div
                          key={`${h.text}-${idx}`}
                          className="group flex sm:min-w-0 items-center justify-center gap-1.5 rounded-xl border bg-card/60 px-2.5 py-2.5 sm:py-3 backdrop-blur-sm transition-colors duration-200 hover:bg-primary hover:border-primary hover:text-primary-foreground cursor-default"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-primary transition-colors group-hover:text-primary-foreground" />
                          <span className="text-[11px] sm:text-xs font-medium text-foreground sm:whitespace-nowrap transition-colors group-hover:text-primary-foreground">{h.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-6">
            {mobilePlans.length === 0 ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Em breve novos planos para o <strong className="text-foreground">{activeChip.name}</strong>. Fale com a gente no WhatsApp!
                  <div className="mt-4">
                    <Button asChild className="rounded-xl">
                      <a href={buildWhatsAppChip5gUrl({ chipName: activeChip.name, simFormat })} target="_blank" rel="noreferrer">
                        Quero meu {activeChip.name}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div key={selectedChip} className="animate-in fade-in duration-300">
                <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-1">
                  {mobilePlans.map(renderPlanCard)}
                </div>
                <div className="sm:hidden">
                  {mobileMode === "slide" ? (
                    <Carousel opts={{ align: "start", loop: false }} className="w-full">
                      <CarouselContent>
                        {mobilePlans.map((p) => (
                          <CarouselItem
                            key={p.id}
                            className={cn(mobileColumns === 2 ? "basis-1/2" : "basis-[86%]")}
                          >
                            <div className="h-full p-1">{renderPlanCard(p)}</div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious variant="outline" className="-left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
                      <CarouselNext variant="outline" className="-right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
                    </Carousel>
                  ) : (
                    <div className={cn("grid gap-4 p-1", mobileColumns === 2 ? "grid-cols-2" : "grid-cols-1")}>
                      {mobilePlans.map(renderPlanCard)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
