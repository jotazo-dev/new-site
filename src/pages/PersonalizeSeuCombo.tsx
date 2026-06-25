import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, ShoppingCart, Zap } from "lucide-react";
import { PremiumPlanCard } from "@/components/shop/PremiumPlanCard";

import { SvaRemoveDialog } from "@/components/shop/SvaRemoveDialog";
import { FiberRemoveDialog } from "@/components/shop/FiberRemoveDialog";
import { ChipComboBreakDialog } from "@/components/combo/ChipComboBreakDialog";
import { markSvaManuallyRemoved } from "@/cart/svaManualRemoval";
import { markChipBannerGift } from "@/cart/mobileChipBannerGift";
import { markFiberFromBanner } from "@/cart/fiberFromBanner";
import { computeCartTotals, isQualifyingFiberForFreeTv } from "@/cart/pricing";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { CategoryAccordion } from "@/components/combo/CategoryAccordion";
import { OrderSummaryPanel, type SummaryItem } from "@/components/combo/OrderSummaryPanel";
import { CustomerDetailsStep, type CustomerDetails } from "@/components/combo/CustomerDetailsStep";
import { CompletionStep } from "@/components/combo/CompletionStep";
import { FiberTvUpgradeBanner } from "@/components/combo/FiberTvUpgradeBanner";
import { FiberMobileUpgradeBanner } from "@/components/combo/FiberMobileUpgradeBanner";
import { usePlans } from "@/hooks/usePlans";
import { useCart, COMBO_COUPON_CODE } from "@/cart/CartContext";
import { parseShareItems, resolveShareItems, SHARE_PARAM } from "@/cart/shareLink";
import { buildWhatsAppCheckoutUrl } from "@/lib/whatsapp";
import { createLead } from "@/lib/crmLeads";
import { formatBRL, type Plan } from "@/data/plans";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import chipCardImageFallback from "@/assets/jotazo-telecom-cartao-chip-jotazo.png";
import { BLACK_4GB_GIFT_V2_EVENT } from "@/components/cart/Black4GBGiftDialogV2";

const STEPS = ["Pedido", "Seus dados", "Conclusão"] as const;

export default function PersonalizeSeuCombo() {
  const { data: plans = [], isLoading } = usePlans();

  // Fetch SVA plans separately (filtered out of usePlans)
  const { data: svaPlans = [] } = useQuery<Plan[]>({
    queryKey: ["sva-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id,category,name,price_cents,original_price_cents,description,conditions,includes,badges,type,icon,logo_url,sva_ids,accent_color,accent_label,combo_discount_percent,combo_price_cents,combo_highlight_text,chip_type,portability_gb,portability_label,sort_order")
        .eq("active", true)
        .eq("type", "sva");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        category: row.category as Plan["category"],
        name: row.name,
        priceCents: row.price_cents,
        originalPriceCents: row.original_price_cents || undefined,
        description: row.description,
        conditions: (row as any).conditions || "",
        includes: Array.isArray(row.includes) ? (row.includes as any[]).map((inc: any) => ({ icon: inc.icon || "check", text: inc.text || "" })) : [],
        badges: Array.isArray(row.badges) ? (row.badges as string[]) as Plan["badges"] : [] as Plan["badges"],
        type: row.type,
        icon: row.icon || undefined,
        logoUrl: row.logo_url || undefined,
        accentColor: row.accent_color || undefined,
        accentLabel: row.accent_label || undefined,
        svaIds: [],
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Voice plans are fetched and auto-managed globally by useVozAutoAdd hook (SiteLayout).
  // We just need the query cache here for display purposes.
  const { data: vozPlans = [] } = useQuery<Plan[]>({
    queryKey: ["voz-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id,category,name,price_cents,description,type,sort_order")
        .eq("active", true)
        .eq("type", "voz");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        category: row.category as Plan["category"],
        name: row.name,
        priceCents: row.price_cents,
        description: row.description,
        conditions: "",
        includes: [],
        type: row.type,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
  const { items: cartItems, add, remove, clear, setQty, count } = useCart();
  const settings = useSiteSettings();

  const bestsellerKey = (settings.chip_bestseller as "5g" | "black" | "none") || "5g";
  const allChipImages = [
    {
      key: "black" as const,
      name: settings.chip2_name || "Black Chip 5G Jotazo",
      description: settings.chip2_description || "Franquia controlada, sem surpresas",
      image: settings.chip2_image_url || chipCardImageFallback,
      bestseller: bestsellerKey === "black",
    },
    {
      key: "5g" as const,
      name: settings.chip5g_name || "Chip 5G Jotazo",
      description: settings.chip5g_description || "Rede 5G de alta velocidade",
      image: settings.chip5g_image_url || chipCardImageFallback,
      bestseller: bestsellerKey === "5g",
    },
  ];
  const chipImages = allChipImages
    .filter((c) => c.key !== "5g")
    .filter((c) => settings.chip2_active !== "false");
  
  const location = useLocation();
  const initialFocus = (location.state as { focusCategory?: "fibra" | "movel" | "tv" } | null)?.focusCategory ?? "fibra";
  const [openCategory, setOpenCategory] = useState<"fibra" | "movel" | "tv" | "sva" | null>(initialFocus);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [mobileChipType, setMobileChipType] = useState<"5g" | "black">("black");
  const [mobileSimFormat, setMobileSimFormat] = useState<"fisico" | "esim">("fisico");
  const [promoCoupon, setPromoCoupon] = useState<{ code: string; discountCents: number } | null>(null);
  const fibraRef = useRef<HTMLDivElement>(null);
  const movelRef = useRef<HTMLDivElement>(null);
  const tvRef = useRef<HTMLDivElement>(null);

  // Apenas abre a categoria foco quando navegado da home — sem scroll automático
  // (o scroll fica no topo, garantido pelo ScrollToTop global)
  useEffect(() => {
    const focus = (location.state as { focusCategory?: "fibra" | "movel" | "tv" } | null)?.focusCategory;
    if (!focus) return;
    setOpenCategory(focus);
  }, [location.state]);

  // Pré-seleção de planos via query string: ?fibra=550&movel=2gb&tv=1
  // CEP é preservado para pré-preencher na etapa de dados
  const appliedFromQueryRef = useRef(false);
  useEffect(() => {
    if (isLoading || plans.length === 0 || appliedFromQueryRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("fibra") && !params.has("movel") && !params.has("tv")) return;

    const digitsOf = (s: string) => (s.match(/\d+/g)?.join("") ?? "");
    const findByValue = (category: "fibra" | "movel" | "tv", value: string): Plan | undefined => {
      const list = plans.filter((p) => p.category === category);
      if (!list.length) return undefined;
      const v = value.trim().toLowerCase();
      const vDigits = digitsOf(v);
      // tv=1 → mais barato
      if (category === "tv" && (v === "1" || v === "true" || v === "")) {
        return [...list].sort((a, b) => a.priceCents - b.priceCents)[0];
      }
      // match por id exato
      const byId = list.find((p) => p.id === value);
      if (byId) return byId;
      // match por nome contendo o texto
      const byName = list.find((p) => p.name.toLowerCase().includes(v));
      if (byName) return byName;
      // match por dígitos no nome
      if (vDigits) {
        const byDigits = list.find((p) => digitsOf(p.name) === vDigits);
        if (byDigits) return byDigits;
      }
      return undefined;
    };

    const order: Array<"fibra" | "movel" | "tv"> = ["fibra", "movel", "tv"];
    let firstFilled: "fibra" | "movel" | "tv" | null = null;
    for (const cat of order) {
      const raw = params.get(cat);
      if (raw == null) continue;
      const plan = findByValue(cat, raw);
      if (!plan) continue;
      const already = cartItems.some((i) => i.plan.category === cat);
      if (!already) add(plan);
      if (!firstFilled) firstFilled = cat;
    }

    if (firstFilled) setOpenCategory(firstFilled);
    appliedFromQueryRef.current = true;
    // Preservar CEP na URL - limpar apenas fibra, movel, tv
    const cepParam = params.get("cep");
    if (cepParam) {
      window.history.replaceState({}, "", `${window.location.pathname}?cep=${cepParam}`);
    } else {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, plans]);

  const fiberPlans = useMemo(() => plans.filter((p) => p.category === "fibra" && (p as any).type !== "upsell"), [plans]);
  const upsellPlans = useMemo(() => plans.filter((p) => (p as any).type === "upsell"), [plans]);
  const allMobilePlans = useMemo(() => plans.filter((p) => p.category === "movel"), [plans]);
  const mobilePlans = useMemo(
    () => allMobilePlans.filter((p) => (p.chipType || "5g") === mobileChipType),
    [allMobilePlans, mobileChipType],
  );
  const tvPlans = useMemo(() => plans.filter((p) => p.category === "tv"), [plans]);
  // Plano de TV mais barato (ex.: "Life Line HD") — usado como base do desconto combo de TV
  const cheapestTvPlan = useMemo(() => {
    const nonSva = tvPlans.filter((p) => p.type !== "sva");
    if (nonSva.length === 0) return null;
    return [...nonSva].sort((a, b) => a.priceCents - b.priceCents)[0];
  }, [tvPlans]);
  // Planos de TV exibidos no accordion: quando avulso (sem fibra), exibir preço original
  // (exceto o Life Line HD, que mantém o promocional). Quando combo (com fibra), preço promocional.
  const displayedTvPlans = useMemo(() => {
    const fiberInCart = cartItems.some((i) => i.plan.category === "fibra");
    return tvPlans.map((p) => {
      if (p.type === "sva") return p;
      const isCheapest = cheapestTvPlan?.id === p.id;
      if (!fiberInCart && !isCheapest && p.originalPriceCents && p.originalPriceCents > p.priceCents) {
        return { ...p, priceCents: p.originalPriceCents, originalPriceCents: undefined };
      }
      return p;
    });
  }, [tvPlans, cheapestTvPlan, cartItems]);
  const tvSelectedNonSva = useMemo(
    () => cartItems.find((i) => i.plan.category === "tv" && (i.plan as any).type !== "sva")?.plan,
    [cartItems],
  );
  const hboAllowedByTv = useMemo(() => {
    if (!tvSelectedNonSva) return false;
    const allowed = ["start hd", "top hd", "premium hd"];
    return allowed.includes(tvSelectedNonSva.name.trim().toLowerCase());
  }, [tvSelectedNonSva]);
  const hboMaxSva = useMemo(() => {
    if (!hboAllowedByTv) return undefined;
    return svaPlans.find((s) => s.category === "tv" as any);
  }, [svaPlans, hboAllowedByTv]);
  const hboInCart = cartItems.some((i) => hboMaxSva && i.plan.id === hboMaxSva.id);

  const selectedByCategory = useMemo(() => {
    const map: Record<string, Plan | undefined> = {};
    for (const it of cartItems) {
      if (!map[it.plan.category]) map[it.plan.category] = it.plan;
    }
    return map;
  }, [cartItems]);

  const selectedFiber = selectedByCategory.fibra;
  const tvFreeByFiber = !!selectedFiber && isQualifyingFiberForFreeTv(selectedFiber);
  const selectedTv = selectedByCategory.tv;
  const selectedMobile = selectedByCategory.movel;

  // Auto-add SVA / TV grátis / auto-remove são gerenciados globalmente por useCartAutoSync (SiteLayout).
  // Aqui mantemos apenas refs de UX local (toasts contextuais).
  const svaManuallyRemovedRef = useRef(false);
  const autoAddedSvaIdRef = useRef<string | null>(null);

  // Cheapest mobile per chip type — so 4 GIGA qualifies for both 5G and Black/Controle
  const cheapestMobileByChip = useMemo(() => {
    const map = new Map<string, Plan>();
    for (const p of allMobilePlans) {
      const chip = p.chipType || "5g";
      const cur = map.get(chip);
      if (!cur || p.priceCents < cur.priceCents) map.set(chip, p);
    }
    return map;
  }, [allMobilePlans]);
  const cheapestMobileIds = useMemo(
    () => new Set(Array.from(cheapestMobileByChip.values()).map((p) => p.id)),
    [cheapestMobileByChip],
  );
  const isCheapestMobile = (p?: Plan) => !!p && cheapestMobileIds.has(p.id);
  // Toast do bônus do móvel removido a pedido — o benefício já é comunicado visualmente no card/resumo.

  const hasFiberInCart = cartItems.some((i) => i.plan.category === "fibra");

  // ── Voz auto-add/remove is handled globally by useVozAutoAdd (SiteLayout) ──
  const vozInCart = useMemo(() => cartItems.find((i) => i.plan.type === "voz"), [cartItems]);

  const hasVozInCart = !!vozInCart;

  const handleSelect = (plan: Plan) => {
    // Móvel pode empilhar múltiplos chips diferentes; clicar no mesmo plano incrementa a qty.
    if (plan.category === "movel") {
      const existing = cartItems.find((i) => i.plan.id === plan.id);
      if (existing) {
        setQty(plan.id, (existing.qty ?? 1) + 1);
      } else {
        add(plan);
      }
      return;
    }
    // Fibra e TV permanecem single-select. Use add(), que já substitui a
    // categoria sem disparar a remoção de combo inteiro da fibra.
    const existing = cartItems.find((i) => i.plan.category === plan.category);
    if (!existing || existing.plan.id !== plan.id) add(plan);
  };

  const handleCardSelect = (planId: string | null, plan: Plan) => {
    if (!planId) return;
    // Apenas Fibra e TV mantêm exclusividade — móvel permite múltiplos chips.
    if (plan.category === "movel") return;
    cartItems.forEach((it) => {
      if (it.plan.category === plan.category && it.plan.id !== planId) {
        remove(it.plan.id);
      }
    });
  };

  const [svaRemoveConfirmId, setSvaRemoveConfirmId] = useState<string | null>(null);
  const [vozRemoveConfirmId, setVozRemoveConfirmId] = useState<string | null>(null);
  const [fiberRemoveConfirmOpen, setFiberRemoveConfirmOpen] = useState(false);
  const [chipBreakConfirmId, setChipBreakConfirmId] = useState<string | null>(null);

  const handleRemoveChipFromCombo = useCallback((planId: string) => {
    setChipBreakConfirmId(planId);
  }, []);
  const confirmChipBreakRemove = useCallback(() => {
    if (!chipBreakConfirmId) return;
    remove(chipBreakConfirmId);
    setChipBreakConfirmId(null);
  }, [chipBreakConfirmId, remove]);
  const swapChipFromCombo = useCallback(() => {
    if (!chipBreakConfirmId) return;
    remove(chipBreakConfirmId);
    setChipBreakConfirmId(null);
    setOpenCategory("movel");
    setTimeout(() => {
      movelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [chipBreakConfirmId, remove]);

  const handleRemoveFiber = useCallback(() => {
    setFiberRemoveConfirmOpen(true);
  }, []);
  const confirmFiberRemove = useCallback(() => {
    clear();
    setFiberRemoveConfirmOpen(false);
  }, [clear]);

  const handleRemove = (planId: string) => {
    const item = cartItems.find((i) => i.plan.id === planId);
    if (item?.plan.type === "sva") {
      setSvaRemoveConfirmId(planId);
      return;
    }
    if (item?.plan.type === "voz") {
      // Serviço de Roaming é vinculado ao chip 5G/Black e não pode ser removido individualmente
      return;
    }
    remove(planId);
  };

  const confirmSvaRemove = useCallback(() => {
    if (!svaRemoveConfirmId) return;
    svaManuallyRemovedRef.current = true;
    autoAddedSvaIdRef.current = null;
    markSvaManuallyRemoved(selectedFiber?.id ?? null);
    remove(svaRemoveConfirmId);
    setSvaRemoveConfirmId(null);
  }, [svaRemoveConfirmId, remove, selectedFiber?.id]);

  const confirmVozRemove = useCallback(() => {
    if (!vozRemoveConfirmId) return;
    remove(vozRemoveConfirmId);
    setVozRemoveConfirmId(null);
  }, [vozRemoveConfirmId, remove]);

  const hasSvaInCart = cartItems.some((i) => i.plan.type === "sva");

  // (ordem/threading dos itens do resumo é feita por computeCartTotals)


  // Hidratação a partir de link compartilhado: ?items=id1,id2*2,id3
  // Aceita IDs de planos (fibra, móvel, TV, SVA). 'voz' é auto-adicionado por outro hook.
  const appliedShareRef = useRef(false);
  useEffect(() => {
    if (appliedShareRef.current) return;
    if (isLoading || plans.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has(SHARE_PARAM)) {
      appliedShareRef.current = true;
      return;
    }

    const tokens = parseShareItems(window.location.search);
    if (!tokens.length) {
      appliedShareRef.current = true;
      return;
    }

    const catalog: Plan[] = [...plans, ...svaPlans, ...vozPlans];
    const resolved = resolveShareItems(tokens, catalog);

    // Share link sempre representa um combo completo e fechado — limpa o
    // carrinho antes para garantir que flags (promoFreeMonths, etc.) e a
    // composição exata vinda da URL prevaleçam sobre qualquer estado prévio.
    if (resolved.length > 0) {
      clear();
    }

    let firstFilled: "fibra" | "movel" | "tv" | "sva" | null = null;
    for (const { plan, qty, promoFreeMonths } of resolved) {
      // Banner flow: chips móveis vindos via URL ganham promo de 3 meses grátis
      if (plan.category === "movel" && (plan as any).type === "plano") {
        markChipBannerGift(plan.id);
      }
      // Banner flow: marca a fibra como "vinda do banner" para liberar
      // o popup de Parabéns + auto-add do chip Black 4GB no useCartAutoSync.
      if (plan.category === "fibra" && (plan as any).type !== "sva") {
        markFiberFromBanner(plan.id);
      }
      add(plan, { silent: true, ...(promoFreeMonths ? { promoFreeMonths } : {}) });
      if (qty > 1) setQty(plan.id, qty);
      const cat = (plan as any).type === "sva" ? "sva" : (plan.category as any);
      if (!firstFilled && (cat === "fibra" || cat === "movel" || cat === "tv" || cat === "sva")) {
        firstFilled = cat;
      }
    }

    // Combo via link: dispara o popup grande "Parabéns" (com imagem do chip+logo)
    // sempre que o link traz fibra + chip 5G juntos.
    const fiberInLink = resolved.find(
      (r) => r.plan.category === "fibra" && (r.plan as any).type !== "sva",
    );
    const mobileChipInLink = resolved.find(
      (r) => r.plan.category === "movel" && (r.plan as any).type === "plano",
    );
    const tvInLink = resolved.find((r) => r.plan.category === "tv");
    // Popup "Presente exclusivo" só aparece quando o usuário chegou via
    // banner 0 ou 1 (hero), que adicionam ?gift=1 ao link. Acesso direto à
    // página com combo em ?items=... não dispara o popup.
    const giftFlag = params.get("gift") === "1";
    if (giftFlag && fiberInLink && mobileChipInLink) {
      const chipPlan = mobileChipInLink.plan;
      const fiberPlan = fiberInLink.plan;
      const tvPlan = tvInLink?.plan;
      const parts = [fiberPlan.name, chipPlan.name];
      if (tvPlan) parts.push(`${tvPlan.name} (TV + 100 canais grátis)`);
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent(BLACK_4GB_GIFT_V2_EVENT, {
            detail: {
              fiberName: fiberPlan.name,
              chipName: chipPlan.name,
              tvName: tvPlan?.name,
              hidePlanCard: true,
              title: "🎉 Parabéns! Você ganhou 3 meses de Internet 5G",
              description: `Você adicionou ${fiberPlan.name} e ganhou plano de TV com + de 100 canais e + 3 meses de internet 5G por nossa conta.`,
            },
          }),
        );
      });
    }


    if (firstFilled) setOpenCategory(firstFilled);
    appliedShareRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, plans, svaPlans, vozPlans]);

  // Sincroniza ?items=... com o carrinho em tempo real (para permitir copiar URL pronta)
  useEffect(() => {
    if (!appliedShareRef.current) return; // aguarda hidratação inicial
    const params = new URLSearchParams(window.location.search);
    if (cartItems.length === 0) {
      params.delete(SHARE_PARAM);
    } else {
      const encoded = cartItems
        .map((it) => {
          let token = it.plan.id;
          if (it.qty && it.qty > 1) token += `*${it.qty}`;
          if ((it as any).promoFreeMonths && (it as any).promoFreeMonths > 0) {
            token += `:promofree${(it as any).promoFreeMonths}`;
          }
          return token;
        })
        .join(",");
      params.set(SHARE_PARAM, encoded);
    }
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState({}, "", next);
    }
  }, [cartItems]);

  // ============================================================
  // SINGLE SOURCE OF TRUTH: usa computeCartTotals (mesmo cálculo
  // do carrinho lateral) para evitar qualquer divergência entre
  // o Carrinho e o Resumo do Pedido.
  // Toda regra de preço/promoção (Roaming, gift Black 4GB, TV grátis,
  // valor do 4º mês, desconto combo, etc.) vive em src/cart/pricing.ts.
  // ============================================================
  const totals = useMemo(
    () => computeCartTotals(cartItems, plans),
    [cartItems, plans],
  );
  const summaryItems = totals.summaryItems as unknown as SummaryItem[];
  const subtotalCents = totals.subtotalCents;
  const comboDiscountCents = totals.comboDiscountCents;
  const totalCents = totals.totalCents;
  const afterPromoTotal = totals.afterPromoTotalCents;
  const hasPromo = totals.hasPromo;
  const promoMonths = totals.promoMonths;
  const afterPromoMonth = totals.afterPromoMonth;

  const handleGoToDetails = () => {
    if (cartItems.length === 0) {
      toast.error("Selecione ao menos um plano", { description: "Adicione um item ao pedido para continuar." });
      return;
    }
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildWhatsAppUrl = (details: CustomerDetails) => {
    const fullName = `${details.firstName} ${details.lastName}`.trim();
    const address = [
      details.street,
      details.number && `nº ${details.number}`,
      details.complement,
      details.neighborhood,
      details.city && `${details.city} - ${details.uf}`,
    ]
      .filter(Boolean)
      .join(", ");
    const freeIds = summaryItems.filter((it) => it.freeOverride).map((it) => it.plan.id);
    const discountedItemPrices: Record<string, number> = {};
    if (!hasFiberInCart && cheapestTvPlan) {
      // TV avulsa: cobrar preço cheio (exceto Life Line HD)
      for (const it of cartItems) {
        if (
          it.plan.category === "tv" &&
          it.plan.type !== "sva" &&
          it.plan.id !== cheapestTvPlan.id &&
          it.plan.originalPriceCents &&
          it.plan.originalPriceCents > it.plan.priceCents
        ) {
          discountedItemPrices[it.plan.id] = it.plan.originalPriceCents;
        }
      }
    }
    const couponDiscountCents = promoCoupon?.discountCents ?? 0;
    const finalTotalCents = Math.max(0, totalCents - couponDiscountCents);
    const effectiveCouponCode = promoCoupon?.code ?? (comboDiscountCents > 0 ? COMBO_COUPON_CODE : undefined);
    const effectiveDiscountCents = comboDiscountCents + couponDiscountCents;
    return buildWhatsAppCheckoutUrl({
      items: cartItems,
      totalCents: finalTotalCents,
      customerName: fullName,
      customerPhone: details.phone,
      cep: details.cep,
      address,
      couponCode: effectiveCouponCode,
      comboDiscountCents: effectiveDiscountCents,
      mobileChipType,
      mobileSimFormat,
      promoTotalCents: hasPromo ? finalTotalCents : undefined,
      afterPromoTotalCents: hasPromo ? Math.max(0, afterPromoTotal - couponDiscountCents) : undefined,
      promoMonths,
      afterPromoMonth,
      freeItemIds: freeIds,
      discountedItemPrices,
    });
  };

  const handleSubmitDetails = (details: CustomerDetails) => {
    setCustomerDetails(details);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const persistLead = async (source: "website" | "whatsapp") => {
    if (!customerDetails) return;
    try {
      const couponDiscountCents = promoCoupon?.discountCents ?? 0;
      const effectiveDiscountCents = comboDiscountCents + couponDiscountCents;
      const effectiveCouponCode = promoCoupon?.code ?? (comboDiscountCents > 0 ? COMBO_COUPON_CODE : undefined);
      await createLead({
        details: customerDetails,
        items: cartItems,
        freeTvOverride: totals.tvFreeByFiber,
        subtotalCents,
        comboDiscountCents: effectiveDiscountCents,
        totalCents: Math.max(0, totalCents - couponDiscountCents),
        couponCode: effectiveCouponCode,
        source,
        mobileChipType,
        mobileSimFormat,
      });
    } catch (err) {
      console.error("[crm_leads] insert failed", err);
      toast.error("Não conseguimos registrar seu pedido", {
        description: "Tente novamente em instantes.",
      });
      throw err;
    }
  };

  const handleFinishWebsite = async () => {
    try {
      await persistLead("website");
    } catch {
      return;
    }
    toast.success("✅ Pedido recebido!", {
      description: "Nossa equipe entrará em contato em breve para confirmar a instalação.",
    });
    clear();
    try {
      localStorage.removeItem("jotazo_customer_details_v1");
    } catch {
      // ignore
    }
    setStep(0);
    setCustomerDetails(null);
  };

  const handleFinishWhatsApp = async () => {
    if (!customerDetails) return;
    try {
      await persistLead("whatsapp");
    } catch {
      // continue to WA anyway so user is not blocked
    }
    const url = buildWhatsAppUrl(customerDetails);
    window.open(url, "_blank");
  };

  return (
    <>
      <SEOHead
        title="Personalize seu Combo"
        description="Monte seu combo de internet, móvel e TV em duas etapas: escolha os planos e preencha seus dados."
        path="/personalize-seu-combo"
        noindex
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", href: "/" },
          { name: "Personalize seu Combo", href: "/personalize-seu-combo" },
        ]}
      />

      <main className="bg-muted/20 pb-24 md:pb-14 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 min-w-0">
          {/* Header + stepper */}
          <header className="mb-6 mt-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl">
                {step === 0 ? "Personalize seu pedido" : step === 1 ? "Confirme seus dados" : "Conclusão do pedido"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                {step === 0
                  ? "Escolha os serviços e veja o resumo em tempo real ao lado."
                  : step === 1
                    ? "Informe seu CEP e preencha seus dados para finalizar."
                    : "Revise seu pedido e escolha como prefere finalizar."}
              </p>
            </div>
            {/* Mobile: stepper compacto */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {step + 1}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Etapa {step + 1} de {STEPS.length} · <span className="text-foreground">{STEPS[step]}</span>
              </span>
            </div>
            {/* Desktop: stepper completo */}
            <ol className="hidden items-center gap-2 text-sm sm:flex">
              {STEPS.map((label, i) => {
                const active = i === step;
                const done = i < step;
                return (
                  <li key={label} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                        active
                          ? "bg-primary text-primary-foreground"
                          : done
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className={cn(active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {label}
                    </span>
                    {i < STEPS.length - 1 && <span className="text-muted-foreground">›</span>}
                  </li>
                );
              })}
            </ol>
          </header>

          {step === 0 ? (
            <div className="grid gap-6 lg:grid-cols-3 min-w-0">
              {/* Left: categories */}
              <div className="space-y-4 lg:col-span-2 min-w-0 overflow-hidden">
                <h2 className="text-lg font-semibold text-foreground">Seus itens</h2>

                {isLoading ? (
                  <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                    Carregando planos...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div ref={fibraRef} className="scroll-mt-20 lg:scroll-mt-24">
                      <CategoryAccordion
                        title="Internet Fibra"
                        category="fibra"
                        plans={fiberPlans}
                        allPlans={plans}
                        selectedId={selectedFiber?.id}
                        open={openCategory === "fibra"}
                        onToggleOpen={() => setOpenCategory(openCategory === "fibra" ? null : "fibra")}
                        onSelect={handleSelect}
                        onCardSelect={handleCardSelect}
                        onRemove={remove}
                      />
                    </div>
                    {selectedFiber && !tvFreeByFiber && (
                      <div className="px-0">
                        <FiberTvUpgradeBanner
                          selectedFiber={selectedFiber}
                          fiberPlans={fiberPlans}
                          freeTvSpeedMb={500}
                          onUpgrade={(plan) => {
                            handleSelect(plan);
                            setOpenCategory("fibra");
                            window.setTimeout(() => {
                              fibraRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 80);
                          }}
                        />
                      </div>
                    )}
                    {selectedFiber && !selectedByCategory.movel && allMobilePlans.length > 0 && (
                      <div className="px-0">
                        <FiberMobileUpgradeBanner
                          mobilePlans={allMobilePlans}
                          onAddMobile={() => {
                            setMobileChipType("black");
                            setOpenCategory("movel");
                            window.setTimeout(() => {
                              movelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 80);
                          }}
                        />
                      </div>
                    )}
                    <div ref={movelRef} className="scroll-mt-20 lg:scroll-mt-24">
                      <CategoryAccordion
                        title="Móvel 5G"
                        category="movel"
                        plans={mobilePlans}
                        allPlans={plans}
                        selectedId={selectedByCategory.movel?.id}
                        open={openCategory === "movel"}
                        onToggleOpen={() => setOpenCategory(openCategory === "movel" ? null : "movel")}
                        onSelect={handleSelect}
                        onCardSelect={handleCardSelect}
                        onRemove={remove}
                        promoBadgePlanId={undefined}
                        promoBadgeText={undefined}
                        freeOverlayPlanId={undefined}
                        chipTypeFilter={mobileChipType}
                        onChipTypeChange={setMobileChipType}
                        chipImages={chipImages}
                        simFormat={mobileSimFormat}
                        onSimFormatChange={setMobileSimFormat}
                      />
                    </div>
                    <div ref={tvRef} className="scroll-mt-20 lg:scroll-mt-24">
                      <CategoryAccordion
                        title="TV"
                        category="tv"
                        plans={displayedTvPlans}
                        allPlans={plans}
                        selectedId={selectedByCategory.tv?.id}
                        open={openCategory === "tv"}
                        onToggleOpen={() => setOpenCategory(openCategory === "tv" ? null : "tv")}
                        onSelect={handleSelect}
                        onCardSelect={handleCardSelect}
                        onRemove={remove}
                        freeNote={undefined}
                        freeOverlayPlanId={tvFreeByFiber ? cheapestTvPlan?.id : undefined}
                      />
                      {/* HBO Max SVA add-on */}
                      {hboMaxSva && (
                        <div className="mt-6 animate-fade-in overflow-visible pr-2">
                          <p className="mb-4 text-base font-bold tracking-wide text-foreground">🚀 Turbine seu Combo</p>
                          <div className="w-full max-w-sm overflow-visible p-1">
                            <PremiumPlanCard
                              plan={hboMaxSva}
                              allPlans={plans}
                              isSelected={hboInCart}
                              onSelect={() => {
                                if (hboInCart) {
                                  remove(hboMaxSva.id);
                                } else {
                                  add(hboMaxSva);
                                }
                              }}
                              compact={false}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upsell section — only when full combo (Fibra + Móvel + TV) */}
                    {selectedFiber && selectedMobile && selectedTv && upsellPlans.length > 0 && (
                      <div className="relative animate-fade-in rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-card to-card p-5 shadow-lg shadow-accent/10 overflow-hidden">
                        {/* Badge Recomendado */}
                        <span className="absolute top-3 right-3 rounded-full bg-accent px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent-foreground shadow-sm">
                          Recomendado
                        </span>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-md shadow-accent/30">
                            <Zap className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-lg font-bold text-foreground">Turbine seu combo</h3>
                            <p className="text-xs text-muted-foreground">Adicione benefícios exclusivos com descontos especiais</p>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {upsellPlans.map((up) => {
                            const inCart = cartItems.some((i) => i.plan.id === up.id);
                            return (
                              <button
                                key={up.id}
                                type="button"
                                onClick={() => inCart ? remove(up.id) : add(up)}
                                className={cn(
                                  "flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
                                  inCart
                                    ? "border-[#25D366] bg-[#25D366]/10 shadow-sm shadow-[#25D366]/20"
                                    : "border-border bg-card hover:border-accent/50",
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">{up.name}</p>
                                  {up.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{up.description}</p>
                                  )}
                                </div>
                                <span className={cn(
                                  "ml-3 shrink-0 text-sm font-bold",
                                  inCart ? "text-[#25D366]" : "text-accent",
                                )}>
                                  {inCart ? "✓ Adicionado" : `+ ${formatBRL(up.priceCents)}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: summary (desktop only) */}
              <div className="hidden lg:col-span-1 lg:block">
                <OrderSummaryPanel
                  items={summaryItems}
                  comboDiscountCents={comboDiscountCents}
                  onRemove={handleRemove}
                  onClear={clear}
                  onRemoveFiber={handleRemoveFiber}
                  onRemoveChipFromCombo={handleRemoveChipFromCombo}
                  onCheckout={handleGoToDetails}
                  className="lg:sticky lg:top-24"
                  mobileChipType={mobileChipType}
                  mobileSimFormat={mobileSimFormat}
                  promoTotal={hasPromo ? totalCents : undefined}
                  afterPromoTotal={hasPromo ? afterPromoTotal : undefined}
                  promoMonths={promoMonths}
                  afterPromoMonth={afterPromoMonth}
                  couponCode={promoCoupon?.code ?? null}
                  couponDiscountCents={promoCoupon?.discountCents ?? 0}
                  onApplyCoupon={(code, discountCents) => setPromoCoupon({ code, discountCents })}
                  onRemoveCoupon={() => setPromoCoupon(null)}
                />
              </div>
            </div>
          ) : step === 1 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <CustomerDetailsStep 
                  onBack={() => setStep(0)} 
                  onSubmit={handleSubmitDetails} 
                  initialCep={new URLSearchParams(window.location.search).get("cep") ?? undefined}
                />
              </div>
              <div className="hidden lg:col-span-1 lg:block">
                <OrderSummaryPanel
                  items={summaryItems}
                  comboDiscountCents={comboDiscountCents}
                  onRemove={handleRemove}
                  onClear={clear}
                  onRemoveFiber={handleRemoveFiber}
                  onRemoveChipFromCombo={handleRemoveChipFromCombo}
                  onCheckout={() => {/* submit handled by form */}}
                  className="lg:sticky lg:top-24"
                  mobileChipType={mobileChipType}
                  mobileSimFormat={mobileSimFormat}
                  promoTotal={hasPromo ? totalCents : undefined}
                  afterPromoTotal={hasPromo ? afterPromoTotal : undefined}
                  promoMonths={promoMonths}
                  afterPromoMonth={afterPromoMonth}
                  couponCode={promoCoupon?.code ?? null}
                  couponDiscountCents={promoCoupon?.discountCents ?? 0}
                  onApplyCoupon={(code, discountCents) => setPromoCoupon({ code, discountCents })}
                  onRemoveCoupon={() => setPromoCoupon(null)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {customerDetails && (
                  <CompletionStep
                    details={customerDetails}
                    items={summaryItems}
                    comboDiscountCents={comboDiscountCents}
                    onBack={() => setStep(1)}
                    onFinishWebsite={handleFinishWebsite}
                    onFinishWhatsApp={handleFinishWhatsApp}
                    mobileChipType={mobileChipType}
                    mobileSimFormat={mobileSimFormat}
                  />
                )}
              </div>
              <div className="hidden lg:col-span-1 lg:block">
                <OrderSummaryPanel
                  items={summaryItems}
                  comboDiscountCents={comboDiscountCents}
                  onRemove={() => {}}
                  onClear={() => {}}
                  onCheckout={() => {}}
                  className="lg:sticky lg:top-24"
                  mobileChipType={mobileChipType}
                  mobileSimFormat={mobileSimFormat}
                  promoTotal={hasPromo ? totalCents : undefined}
                  afterPromoTotal={hasPromo ? afterPromoTotal : undefined}
                  promoMonths={promoMonths}
                  afterPromoMonth={afterPromoMonth}
                  couponCode={promoCoupon?.code ?? null}
                  couponDiscountCents={promoCoupon?.discountCents ?? 0}
                  onApplyCoupon={(code, discountCents) => setPromoCoupon({ code, discountCents })}
                  onRemoveCoupon={() => setPromoCoupon(null)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile sticky bottom bar (only on step 0) */}
        {step === 0 && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  {count} {count === 1 ? "item" : "itens"} no pedido
                </div>
                <div className="text-lg font-extrabold text-primary">
                  {formatBRL(totalCents)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/mês</span>
                </div>
              </div>
              <Sheet open={mobileSummaryOpen} onOpenChange={setMobileSummaryOpen}>
                <SheetTrigger asChild>
                  <Button size="lg" className="relative h-12 gap-2 px-5 font-bold">
                    <ShoppingCart className="h-5 w-5" />
                    Ver pedido
                    {count > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground shadow-md ring-2 ring-card">
                        {count}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-0 pb-[env(safe-area-inset-bottom)]">
                  <div className="p-4">
                    <OrderSummaryPanel
                      items={summaryItems}
                      comboDiscountCents={comboDiscountCents}
                      onRemove={handleRemove}
                      onClear={clear}
                      onRemoveFiber={handleRemoveFiber}
                      onRemoveChipFromCombo={handleRemoveChipFromCombo}
                      onCheckout={() => {
                        setMobileSummaryOpen(false);
                        handleGoToDetails();
                      }}
                      mobileChipType={mobileChipType}
                      mobileSimFormat={mobileSimFormat}
                      promoTotal={hasPromo ? totalCents : undefined}
                      afterPromoTotal={hasPromo ? afterPromoTotal : undefined}
                      promoMonths={promoMonths}
                      afterPromoMonth={afterPromoMonth}
                      couponCode={promoCoupon?.code ?? null}
                      couponDiscountCents={promoCoupon?.discountCents ?? 0}
                      onApplyCoupon={(code, discountCents) => setPromoCoupon({ code, discountCents })}
                      onRemoveCoupon={() => setPromoCoupon(null)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}
      </main>

      <SvaRemoveDialog
        open={!!svaRemoveConfirmId}
        onOpenChange={(open) => !open && setSvaRemoveConfirmId(null)}
        onConfirm={confirmSvaRemove}
      />


      <FiberRemoveDialog
        open={fiberRemoveConfirmOpen}
        onOpenChange={setFiberRemoveConfirmOpen}
        fiberName={selectedFiber?.name}
        cartContext={{
          hasTv: cartItems.some((i) => i.plan.category === "tv"),
          hasMobile: cartItems.some((i) => i.plan.category === "movel" && (i.plan as any).type !== "voz" && (i.plan as any).type !== "sva"),
          mobileQty: cartItems
            .filter((i) => i.plan.category === "movel" && (i.plan as any).type !== "voz" && (i.plan as any).type !== "sva")
            .reduce((acc, i) => acc + i.qty, 0),
          hasBlackChip: cartItems.some((i) => i.plan.category === "movel" && (i.plan as any).chipType === "black"),
          svaNames: cartItems.filter((i) => (i.plan as any).type === "sva").map((i) => i.plan.name),
          fiberSpeedLabel: selectedFiber?.name,
          totalMonthlyBRL: formatBRL(totalCents),
        }}
        onConfirm={confirmFiberRemove}
        onChangePlan={() => {
          setFiberRemoveConfirmOpen(false);
          setOpenCategory("fibra");
          setTimeout(() => {
            fibraRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }}
      />

      <ChipComboBreakDialog
        open={!!chipBreakConfirmId}
        onOpenChange={(open) => !open && setChipBreakConfirmId(null)}
        chipPlan={cartItems.find((i) => i.plan.id === chipBreakConfirmId)?.plan}
        fiberPlan={selectedFiber ?? undefined}
        onKeep={() => setChipBreakConfirmId(null)}
        onSwap={swapChipFromCombo}
        onConfirmRemove={confirmChipBreakRemove}
      />
    </>
  );
}
