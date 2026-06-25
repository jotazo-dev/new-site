import * as React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wifi, Tv, Smartphone, Check, ChevronRight, Zap, Router, Plus, Minus, MapPin, Search, Share2, MessageCircle, Sparkles, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/data/plans";
import { badgeClassesFor } from "@/lib/comboBadges";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { WHATSAPP } from "@/config/site";
import { TV_FREE_FIBER_SPEED_MB } from "@/cart/pricing";

/* ── Settings defaults ── */
const DEFAULTS: Record<string, string> = {
  combo_section_active: "true",
  combo_section_title: "Monte seu combo personalizado",
  combo_section_subtitle: "Selecione os serviços que você precisa e monte o pacote perfeito para sua casa.",
  combo_section_badge: "Exclusivo",
  combo_tv_description: "80+ canais em HD · Filmes, séries, esportes e infantil",
  
  combo_extra_modem_cents: "3990",
  combo_max_chips: "5",
  combo_max_modems: "4",
};

function useComboData() {
  const settingsQ = useQuery({
    queryKey: ["combo_settings_public"],
    queryFn: async () => {
      const keys = Object.keys(DEFAULTS);
      const { data } = await supabase.from("site_settings").select("key, value").in("key", keys);
      const map: Record<string, string> = { ...DEFAULTS };
      for (const row of data ?? []) if (row.value) map[row.key] = row.value;
      return map;
    },
    staleTime: 5 * 60_000,
  });

  const optionsQ = useQuery({
    queryKey: ["combo_options_from_plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plans")
        .select("id, category, name, description, price_cents, badges, includes, sort_order, combo_discount_percent, combo_price_cents, combo_highlight_text")
        .eq("active", true)
        .in("category", ["fibra", "movel", "tv"])
        .neq("type", "voz")
        .order("sort_order", { ascending: true });

      const mapped = (data ?? []).map((p: any) => {
        const rawIncludes = Array.isArray(p.includes) ? p.includes : [];
        const includes: string[] = rawIncludes
          .map((it: any) => {
            if (typeof it === "string") return it;
            if (it && typeof it === "object") return it.label || it.title || it.text || it.name || "";
            return "";
          })
          .filter(Boolean);

        return {
          id: p.id,
          category: p.category,
          label: p.name,
          description: p.description || "",
          price_cents: p.price_cents,
          sort_order: p.sort_order,
          includes,
          combo_discount_percent: Number(p.combo_discount_percent) || 0,
          combo_price_cents: Number(p.combo_price_cents) || 0,
          combo_highlight_text: p.combo_highlight_text || "",
        };
      });
      return mapped;
    },
    staleTime: 5 * 60_000,
  });

  return { settings: settingsQ.data ?? DEFAULTS, options: optionsQ.data ?? [], isLoading: settingsQ.isLoading || optionsQ.isLoading };
}

export function CustomComboSection(_props: { hideHeader?: boolean } = {}) {
  const { settings: s, options, isLoading } = useComboData();

  const fibraOptions = React.useMemo(() => options.filter((o: any) => o.category === "fibra"), [options]);
  const movelOptions = React.useMemo(() => options.filter((o: any) => o.category === "movel"), [options]);
  const tvOption = React.useMemo(() => options.find((o: any) => o.category === "tv"), [options]);
  const tvPriceCents = tvOption?.price_cents ?? 7990;

  const sectionActive = s.combo_section_active === "true";
  // tvFreeThreshold removido: regra unificada usa velocidade da fibra (TV_FREE_FIBER_SPEED_MB)
  // diretamente em CustomComboInner.
  const extraModemCents = Number(s.combo_extra_modem_cents) || 3990;
  const maxChips = Number(s.combo_max_chips) || 5;
  const maxModems = Number(s.combo_max_modems) || 4;

  // Don't render if inactive or no options at all
  if (!sectionActive || isLoading) return null;
  if (fibraOptions.length === 0 && movelOptions.length === 0) return null;

  return <CustomComboInner
    settings={s}
    fibraOptions={fibraOptions}
    movelOptions={movelOptions}
    tvPriceCents={tvPriceCents}
    
    extraModemCents={extraModemCents}
    maxChips={maxChips}
    maxModems={maxModems}
    hasTv={!!tvOption}
  />;
}

function CustomComboInner({
  settings: s,
  fibraOptions,
  movelOptions,
  tvPriceCents,
  
  extraModemCents,
  maxChips,
  maxModems,
  hasTv,
}: {
  settings: Record<string, string>;
  fibraOptions: any[];
  movelOptions: any[];
  tvPriceCents: number;
  
  extraModemCents: number;
  maxChips: number;
  maxModems: number;
  hasTv: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isStandalonePage = location.pathname === "/monte-seu-combo";
  const settings = useSiteSettings();

  // ── Initial values from URL ──
  const initialCep = (searchParams.get("cep") || "").replace(/\D/g, "").slice(0, 8);
  const initialFormattedCep =
    initialCep.length > 5 ? `${initialCep.slice(0, 5)}-${initialCep.slice(5)}` : initialCep;

  // CEP verification
  const [cep, setCep] = React.useState(initialFormattedCep);
  const [cepStatus, setCepStatus] = React.useState<"idle" | "loading" | "available" | "unavailable">("idle");
  const [cepAddress, setCepAddress] = React.useState("");

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  const checkCep = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepStatus("loading");
    setCepAddress("");
    let addr = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (!data.erro && data.localidade) {
        const parts = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`].filter(Boolean);
        addr = parts.join(", ");
      }
    } catch { /* silently continue */ }

    try {
      const { data: rows } = await supabase
        .from("coverage_ceps")
        .select("id")
        .eq("active", true)
        .lte("cep_start", digits)
        .gte("cep_end", digits)
        .limit(1);
      setCepAddress(addr);
      setCepStatus(rows && rows.length > 0 ? "available" : "unavailable");
    } catch {
      setCepAddress(addr);
      setCepStatus("available");
    }
  };

  // Auto-check CEP when prefilled via URL
  const autoCheckedRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoCheckedRef.current && initialCep.length === 8) {
      autoCheckedRef.current = true;
      checkCep();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Category toggles (hydrated from URL)
  const [wantFibra, setWantFibra] = React.useState(searchParams.get("fibra") !== null);
  const [wantMovel, setWantMovel] = React.useState(searchParams.get("movel") !== null);
  const [wantTv, setWantTv] = React.useState(searchParams.get("tv") === "1");

  // Sub-options — pré-seleciona opção da URL, depois recomendada, depois primeira
  const recommendedFibra = React.useMemo(() => fibraOptions.find((o: any) => o.recommended), [fibraOptions]);
  const recommendedMovel = React.useMemo(() => movelOptions.find((o: any) => o.recommended), [movelOptions]);

  const urlFibraId = searchParams.get("fibra");
  const urlMovelId = searchParams.get("movel");
  const urlChips = parseInt(searchParams.get("chips") || "", 10);
  const urlModems = parseInt(searchParams.get("modems") || "", 10);

  const initialFibraId =
    (urlFibraId && fibraOptions.find((o: any) => o.id === urlFibraId)?.id) ||
    (recommendedFibra ?? fibraOptions[0])?.id ||
    "";
  const initialMovelId =
    (urlMovelId && movelOptions.find((o: any) => o.id === urlMovelId)?.id) ||
    (recommendedMovel ?? movelOptions[0])?.id ||
    "";

  const [fibraId, setFibraId] = React.useState(initialFibraId);
  const [extraModems, setExtraModems] = React.useState(
    Number.isFinite(urlModems) ? Math.max(0, Math.min(maxModems, urlModems)) : 0
  );
  const [movelId, setMovelId] = React.useState(initialMovelId);
  const [chips, setChips] = React.useState(
    Number.isFinite(urlChips) && urlChips > 0 ? Math.min(maxChips, urlChips) : 1
  );

  // Reset selections when options change (mantém a recomendada) — somente se URL não definiu
  React.useEffect(() => {
    if (fibraOptions.length && !urlFibraId) setFibraId((recommendedFibra ?? fibraOptions[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fibraOptions, recommendedFibra]);
  React.useEffect(() => {
    if (movelOptions.length && !urlMovelId) setMovelId((recommendedMovel ?? movelOptions[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movelOptions, recommendedMovel]);

  // Sync state → URL (only on standalone page, to avoid polluting home URL)
  React.useEffect(() => {
    if (!isStandalonePage) return;
    const params = new URLSearchParams();
    const cepDigits = cep.replace(/\D/g, "");
    if (cepDigits.length === 8) params.set("cep", cepDigits);
    if (wantFibra && fibraId) {
      params.set("fibra", fibraId);
      if (extraModems > 0) params.set("modems", String(extraModems));
    }
    if (wantMovel && movelId) {
      params.set("movel", movelId);
      if (chips > 1) params.set("chips", String(chips));
    }
    if (wantTv) params.set("tv", "1");
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantFibra, wantMovel, wantTv, fibraId, movelId, chips, extraModems, cep, isStandalonePage]);

  const handleShare = async () => {
    const params = new URLSearchParams();
    const cepDigits = cep.replace(/\D/g, "");
    if (cepDigits.length === 8) params.set("cep", cepDigits);
    if (wantFibra && fibraId) {
      params.set("fibra", fibraId);
      if (extraModems > 0) params.set("modems", String(extraModems));
    }
    if (wantMovel && movelId) {
      params.set("movel", movelId);
      if (chips > 1) params.set("chips", String(chips));
    }
    if (wantTv) params.set("tv", "1");
    const qs = params.toString();
    const url = `${window.location.origin}/monte-seu-combo${qs ? `?${qs}` : ""}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Meu combo Jotazo", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!", { description: "Compartilhe seu combo personalizado." });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      } catch {
        toast.error("Não foi possível copiar o link.");
      }
    }
  };

  const hasSelection = wantFibra || wantMovel || wantTv;

  const selectedFibra = fibraOptions.find((o: any) => o.id === fibraId);
  // Regra única alinhada ao carrinho (src/cart/pricing.ts):
  // TV grátis quando a fibra tem velocidade >= TV_FREE_FIBER_SPEED_MB (500 Mbps).
  const fibraSpeedMb = React.useMemo(() => {
    if (!selectedFibra) return 0;
    const name = String(selectedFibra.name ?? "");
    const giga = name.match(/(\d+(?:[.,]\d+)?)\s*GIGA/i);
    if (giga) return Math.round(parseFloat(giga[1].replace(",", ".")) * 1000);
    return parseInt(name.replace(/\D/g, ""), 10) || 0;
  }, [selectedFibra]);
  const tvIncludedFree = wantFibra && selectedFibra && fibraSpeedMb >= TV_FREE_FIBER_SPEED_MB;
  const prevTvFreeRef = React.useRef(false);

  React.useEffect(() => {
    if (tvIncludedFree && !wantTv) setWantTv(true);
    if (!tvIncludedFree && prevTvFreeRef.current) setWantTv(false);
    prevTvFreeRef.current = !!tvIncludedFree;
  }, [tvIncludedFree]);

  // Helper: aplica desconto de combo quando Fibra também está selecionada
  const applyComboDiscount = React.useCallback(
    (priceCents: number, discountPercent: number, comboPriceCents?: number) => {
      if (!wantFibra) return priceCents;
      if (comboPriceCents && comboPriceCents > 0) return comboPriceCents;
      if (!discountPercent) return priceCents;
      return Math.round(priceCents * (1 - discountPercent / 100));
    },
    [wantFibra]
  );

  const selectedMovel = React.useMemo(
    () => movelOptions.find((o: any) => o.id === movelId),
    [movelOptions, movelId]
  );

  // Prova social: número de pessoas que adicionaram Chip 5G nesta semana
  // Estável por semana (mesmo número a semana inteira), com micro-incremento por dia
  const socialProof = React.useMemo(() => {
    const now = new Date();
    // chave da semana (ano * 100 + número da semana ISO aproximado)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.floor(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const weekKey = now.getFullYear() * 100 + weekNum;
    // hash simples para gerar base entre 65 e 175
    let h = weekKey;
    h = ((h << 5) - h + 7919) | 0;
    const base = 65 + Math.abs(h) % 111; // 65..175
    const count = Math.min(189, base + now.getDay() * 2);
    // 4 avatares estáveis por dia
    const seedOffsets = [11, 27, 44, 63];
    const avatars = seedOffsets.map((o) => {
      const idx = (Math.abs(h) + o) % 99 + 1;
      const gender = idx % 2 === 0 ? "men" : "women";
      return `https://randomuser.me/api/portraits/${gender}/${idx}.jpg`;
    });
    return { count, avatars };
  }, []);

  // Melhor desconto disponível em planos móveis (para banner de incentivo)
  const bestMovelDiscount = React.useMemo(() => {
    let best = 0;
    let cheapestDiscounted = Infinity;
    let cheapestId = "";
    for (const o of movelOptions) {
      const disc = Number(o.combo_discount_percent) || 0;
      const cpCents = Number(o.combo_price_cents) || 0;
      if (disc > best) best = disc;
      const final = cpCents > 0 ? cpCents : (disc > 0 ? Math.round(o.price_cents * (1 - disc / 100)) : o.price_cents);
      if (final < cheapestDiscounted) {
        cheapestDiscounted = final;
        cheapestId = o.id;
      }
    }
    return {
      percent: best,
      cheapestPriceCents: isFinite(cheapestDiscounted) ? cheapestDiscounted : 0,
      cheapestId,
    };
  }, [movelOptions]);

  // Ref para a seção móvel (scroll do banner CTA)
  const movelSectionRef = React.useRef<HTMLDivElement | null>(null);
  const scrollToMovel = React.useCallback(() => {
    // Se ainda não está aberto, abre primeiro
    setWantMovel(true);
    // Pré-seleciona o mais barato com desconto
    if (bestMovelDiscount.cheapestId) {
      setMovelId(bestMovelDiscount.cheapestId);
    }
    requestAnimationFrame(() => {
      setTimeout(() => {
        movelSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    });
  }, [bestMovelDiscount.cheapestId]);

  // Ref + helper para a seção TV (banner upgrade)
  const tvSectionRef = React.useRef<HTMLDivElement | null>(null);
  const scrollToTv = React.useCallback(() => {
    setWantTv(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        tvSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    });
  }, []);

  // Refs por card de fibra + destaque visual ao apontar para upgrade
  const fibraCardRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [highlightedFibraId, setHighlightedFibraId] = React.useState<string | null>(null);
  const firstUpgradeFibra = React.useMemo(() => {
    const currentPrice = selectedFibra?.price_cents ?? 0;
    const above = fibraOptions
      .filter((o: any) => o.price_cents > currentPrice)
      .sort((a: any, b: any) => a.price_cents - b.price_cents);
    return above[0] || null;
  }, [fibraOptions, selectedFibra]);
  const upgradeToFreeTvFibra = React.useCallback(() => {
    if (!firstUpgradeFibra) return;
    setFibraId(firstUpgradeFibra.id);
    setHighlightedFibraId(firstUpgradeFibra.id);
    requestAnimationFrame(() => {
      setTimeout(() => {
        fibraCardRefs.current[firstUpgradeFibra.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    });
    window.setTimeout(() => setHighlightedFibraId(null), 2000);
  }, [firstUpgradeFibra]);

  // Detecta quando o usuário REMOVE o móvel após tê-lo escolhido (estratégia 4)
  const lostDiscountRef = React.useRef(0);
  const [showLostDiscount, setShowLostDiscount] = React.useState(0);
  const prevWantMovelRef = React.useRef(wantMovel);
  React.useEffect(() => {
    if (prevWantMovelRef.current && !wantMovel && wantFibra && selectedMovel) {
      const disc = Number(selectedMovel.combo_discount_percent) || 0;
      const cpCents = Number(selectedMovel.combo_price_cents) || 0;
      if (disc > 0 || cpCents > 0) {
        const lost = (selectedMovel.price_cents - applyComboDiscount(selectedMovel.price_cents, disc, cpCents)) * chips;
        if (lost > 0) {
          lostDiscountRef.current = lost;
          setShowLostDiscount(lost);
          setTimeout(() => setShowLostDiscount(0), 4000);
        }
      }
    }
    prevWantMovelRef.current = wantMovel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantMovel]);

  const totalCents = React.useMemo(() => {
    let t = 0;
    if (wantFibra && selectedFibra) t += selectedFibra.price_cents;
    if (wantMovel && selectedMovel) {
      const unit = applyComboDiscount(selectedMovel.price_cents, selectedMovel.combo_discount_percent, selectedMovel.combo_price_cents);
      t += unit * chips;
    }
    if (wantTv && !tvIncludedFree) t += tvPriceCents;
    return t;
  }, [wantFibra, fibraId, wantMovel, movelId, chips, wantTv, tvIncludedFree, selectedFibra, selectedMovel, tvPriceCents, applyComboDiscount]);

  // Quanto o usuário economiza por mês graças aos descontos de combo
  const comboSavingsCents = React.useMemo(() => {
    let s = 0;
    if (wantFibra && wantMovel && selectedMovel) {
      const disc = Number(selectedMovel.combo_discount_percent) || 0;
      const cpCents = Number(selectedMovel.combo_price_cents) || 0;
      if (disc > 0 || cpCents > 0) {
        const original = selectedMovel.price_cents * chips;
        const discounted = applyComboDiscount(selectedMovel.price_cents, disc, cpCents) * chips;
        s += original - discounted;
      }
    }
    return s;
  }, [wantFibra, wantMovel, selectedMovel, chips, applyComboDiscount]);

  const categories = [
    ...(fibraOptions.length > 0 ? [{ key: "fibra" as const, icon: Wifi, label: "Internet Fibra", color: "from-blue-500 to-cyan-400", active: wantFibra, toggle: () => setWantFibra((p) => !p) }] : []),
    ...(movelOptions.length > 0 ? [{ key: "movel" as const, icon: Smartphone, label: "Internet Móvel", color: "from-green-500 to-emerald-400", active: wantMovel, toggle: () => setWantMovel((p) => !p) }] : []),
    ...(hasTv ? [{ key: "tv" as const, icon: Tv, label: "TV por Assinatura", color: "from-purple-500 to-pink-400", active: wantTv, toggle: () => setWantTv((p) => !p) }] : []),
  ];

  return (
    <section className="relative overflow-hidden rounded-[20px] bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-[hsl(221,88%,14%)]" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative px-5 py-8 md:px-10 md:py-10 lg:px-14 lg:py-12">
        {/* Header */}
        {!isStandalonePage && (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-4 py-1.5 backdrop-blur">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">{s.combo_section_badge}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {(s.combo_section_title || "").split("combo").length > 1 ? (
                <>{s.combo_section_title.split("combo")[0]}combo <span className="text-accent">{s.combo_section_title.split("combo")[1]}</span></>
              ) : (
                s.combo_section_title
              )}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-background/60 md:text-base">{s.combo_section_subtitle}</p>
          </div>
        )}

        {/* CEP verification */}
        <div className={`mx-auto ${isStandalonePage ? "" : "mt-6"} max-w-md`}>
          {isStandalonePage && (
            <div className="mb-3 text-center">
              <h2 className="text-xl font-bold tracking-tight text-primary-foreground md:text-2xl">
                Verifique a disponibilidade
              </h2>
              <p className="mt-1 text-sm text-background/70">
                Digite seu CEP para liberar os planos disponíveis na sua região.
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-2xl border border-background/20 bg-background/5 p-2 backdrop-blur">
            <MapPin className="ml-2 h-5 w-5 shrink-0 text-accent" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Digite seu CEP"
              value={cep}
              onChange={(e) => { setCep(formatCep(e.target.value)); setCepStatus("idle"); setCepAddress(""); }}
              onKeyDown={(e) => e.key === "Enter" && checkCep()}
              className="flex-1 bg-transparent text-sm text-primary-foreground placeholder:text-background/40 outline-none"
              maxLength={9}
            />
            <Button
              size="sm"
              onClick={checkCep}
              disabled={cep.replace(/\D/g, "").length !== 8 || cepStatus === "loading"}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            >
              {cepStatus === "loading" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
              ) : (
                <><Search className="mr-1 h-4 w-4" /> Verificar</>
              )}
            </Button>
          </div>
          {cepStatus === "available" && (
            <div className="mt-2 animate-fade-in text-center">
              <p className="text-sm font-semibold text-[hsl(142,70%,45%)]">✓ Disponível na sua região!</p>
              {cepAddress && <p className="mt-1 text-xs text-primary-foreground/70"><MapPin className="mr-1 inline h-3 w-3" />{cepAddress}</p>}
            </div>
          )}
          {cepStatus === "unavailable" && (
            <div className="mt-2 animate-fade-in text-center">
              <p className="text-sm font-semibold text-destructive">✗ Ainda não disponível na sua região.</p>
              {cepAddress && <p className="mt-1 text-xs text-primary-foreground/70"><MapPin className="mr-1 inline h-3 w-3" />{cepAddress}</p>}
            </div>
          )}
        </div>

        {/* Category selector cards */}
        <div className={cn("mx-auto mt-6 grid max-w-6xl gap-3 sm:grid-cols-3 transition-all duration-500", cepStatus === "available" ? "opacity-100" : "opacity-40 pointer-events-none")}>
          {categories.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={opt.toggle}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all duration-300",
                opt.active
                  ? "border-accent bg-accent/15 shadow-lg shadow-accent/20 scale-[1.03]"
                  : "border-background/15 bg-background/5 hover:bg-background/10 hover:border-background/30",
              )}
            >
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform duration-300", opt.color, opt.active && "scale-110")}>
                <opt.icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-sm font-semibold">{opt.label}</span>
              <div className={cn("absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200", opt.active ? "scale-100 bg-accent text-accent-foreground" : "scale-0 bg-transparent")}>
                <Check className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>

        {/* Sub-options panels */}
        <div className={cn("mx-auto mt-4 max-w-6xl space-y-3", hasSelection ? "block" : "hidden")}>

          {/* Fibra sub-options */}
          {wantFibra && fibraOptions.length > 0 && (
            <div className="animate-fade-in rounded-2xl border border-background/15 bg-background/5 p-4 backdrop-blur">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Wifi className="h-4 w-4 text-accent" /> Escolha a velocidade
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {fibraOptions.map((o: any) => {
                  const selected = fibraId === o.id;
                  const highlighted = highlightedFibraId === o.id;
                  return (
                    <button
                      key={o.id}
                      ref={(el) => { fibraCardRefs.current[o.id] = el; }}
                      type="button"
                      onClick={() => setFibraId(o.id)}
                      className={cn(
                        "relative flex h-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-accent bg-accent/15 shadow-md shadow-accent/10"
                          : "border-background/20 bg-background/5 hover:bg-background/10 hover:border-background/40",
                        highlighted && "ring-2 ring-accent ring-offset-2 ring-offset-transparent scale-[1.03] shadow-xl shadow-accent/40 animate-pulse",
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <span className={cn("text-base font-bold leading-tight", selected ? "text-accent" : "text-background")}>{o.label}</span>
                      <span className={cn("text-lg font-extrabold leading-none", selected ? "text-[hsl(142,70%,55%)]" : "text-background/90")}>{formatBRL(o.price_cents)}<span className="ml-1 text-[10px] font-medium opacity-70">/mês</span></span>
                      {o.description && (
                        <span className={cn("text-sm font-normal leading-snug", selected ? "text-background" : "text-background/60")}>{o.description}</span>
                      )}
                      {o.includes && o.includes.length > 0 && (
                        <ul className="mt-1 w-full space-y-1">
                          {o.includes.map((it: string, i: number) => (
                            <li key={i} className={cn("flex items-start gap-1.5 text-[13px] leading-snug", selected ? "text-background/95" : "text-background/70")}>
                              <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", selected ? "text-background" : "text-background/50")} />
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-background/15 bg-background/5 p-4">
                <div className="flex items-center gap-3">
                  <Router className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Modem Wi-Fi</p>
                    <p className="text-xs text-background/50">1 incluso grátis · Ponto extra {formatBRL(extraModemCents)} (pagamento único)</p>
                    <p className="text-xs text-accent">✓ Instalação gratuita</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setExtraModems((v) => Math.max(0, v - 1))} disabled={extraModems === 0} className="flex h-8 w-8 items-center justify-center rounded-lg border border-background/20 bg-background/5 transition-colors hover:bg-background/15 disabled:opacity-30">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{1 + extraModems}</span>
                  <button type="button" onClick={() => setExtraModems((v) => Math.min(maxModems, v + 1))} disabled={extraModems >= maxModems} className="flex h-8 w-8 items-center justify-center rounded-lg border border-background/20 bg-background/5 transition-colors hover:bg-background/15 disabled:opacity-30">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aviso: plano de fibra abaixo do limiar para TV grátis */}
          {wantFibra && selectedFibra && !tvIncludedFree && hasTv && !wantTv && (
            <div className="animate-fade-in rounded-2xl border border-accent/30 bg-accent/5 p-4 backdrop-blur">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                  <Tv className="h-6 w-6 text-accent" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-background">
                    💡 Ganhe TV grátis fazendo upgrade!
                  </p>
                  <p className="mt-1 text-xs text-background/70">
                    Por apenas <strong className="text-accent">+{formatBRL((firstUpgradeFibra?.price_cents || 0) - (selectedFibra?.price_cents || 0))}/mês</strong> você faz upgrade para um plano melhor e leva TV por assinatura inclusa.
                  </p>
                  <p className="mt-1 text-[11px] text-background/55">
                    Clique no botão para realizar o upgrade e garantir TV por assinatura + internet Fibra.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  {firstUpgradeFibra && (
                    <Button
                      size="sm"
                      onClick={upgradeToFreeTvFibra}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md shadow-accent/20"
                    >
                      <ArrowUp className="mr-1 h-4 w-4" /> Upgrade e ganhar TV grátis
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Banner de incentivo: Fibra ativa, Móvel ainda não — sempre visível */}
          {wantFibra && !wantMovel && movelOptions.length > 0 && (
            <div className="animate-fade-in rounded-2xl border-2 border-accent/50 bg-gradient-to-r from-accent/15 via-accent/5 to-primary-foreground/5 p-4 backdrop-blur shadow-lg shadow-accent/10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 shadow-lg shadow-green-500/30">
                  <span className="absolute inset-0 animate-ping rounded-2xl bg-green-400/40" />
                  <Smartphone className="relative h-8 w-8 text-white" />
                </span>
                <div className="flex-1">
                  <p className="flex items-center gap-2 text-base font-bold text-background">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Falta pouco! Adicione um chip 5G
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-background/80">
                    {bestMovelDiscount.percent > 0 && (
                      <span className="inline-flex items-center gap-1">
                        🎁 <span>Desconto exclusivo de <strong className="text-[hsl(142,70%,55%)]">−{bestMovelDiscount.percent}%</strong></span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">📱 5G ilimitado redes sociais</span>
                    <span className="inline-flex items-center gap-1">💳 Conta única</span>
                  </div>
                  {bestMovelDiscount.cheapestPriceCents > 0 && (
                    <p className="mt-2 text-xs text-background/70">
                      A partir de{" "}
                      <span className="text-base font-extrabold text-[hsl(142,70%,55%)]">
                        {formatBRL(bestMovelDiscount.cheapestPriceCents)}
                      </span>
                      <span className="font-semibold">/mês</span> no combo
                    </p>
                  )}
                  {/* Prova social */}
                  <div className="mt-3 flex items-center gap-2.5">
                    <div className="flex -space-x-2">
                      {socialProof.avatars.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          loading="lazy"
                          className="h-6 w-6 rounded-full border-2 border-background/80 object-cover"
                        />
                      ))}
                    </div>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(142,70%,55%)]/70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(142,70%,55%)]" />
                    </span>
                    <p className="text-xs text-background/80">
                      <span className="font-semibold text-background">{socialProof.count} pessoas</span>{" "}
                      adquiriram Chip 5G esta semana
                    </p>
                  </div>
                </div>
                <Button
                  onClick={scrollToMovel}
                  className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 shadow-md shadow-accent/30"
                >
                  <Plus className="mr-1 h-4 w-4" /> Adicionar 5G
                </Button>
              </div>
              {showLostDiscount > 0 && (
                <p className="mt-3 animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                  ⚠️ Você perdeu {formatBRL(showLostDiscount)}/mês de desconto ao remover o móvel
                </p>
              )}
            </div>
          )}

          {/* Móvel sub-options */}
          {wantMovel && movelOptions.length > 0 && (
            <div ref={movelSectionRef} className="animate-fade-in rounded-2xl border border-background/15 bg-background/5 p-4 backdrop-blur">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Smartphone className="h-4 w-4 text-accent" />
                {wantFibra ? "Complete seu combo perfeito" : "Escolha o plano móvel"}
                {wantFibra && bestMovelDiscount.percent > 0 && (
                  <span className="ml-auto rounded-full bg-[hsl(142,70%,45%)]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-[hsl(142,70%,55%)]">
                    Desconto combo ativo
                  </span>
                )}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {movelOptions.map((o: any) => {
                  const selected = movelId === o.id;
                  const disc = Number(o.combo_discount_percent) || 0;
                  const cpCents = Number(o.combo_price_cents) || 0;
                  const showDiscount = wantFibra && (disc > 0 || cpCents > 0);
                  const finalPrice = showDiscount ? applyComboDiscount(o.price_cents, disc, cpCents) : o.price_cents;
                  const isMostChosen = wantFibra && o.id === bestMovelDiscount.cheapestId && movelOptions.length > 1;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setMovelId(o.id)}
                      className={cn(
                        "relative flex h-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-accent bg-accent/15 shadow-md shadow-accent/10"
                          : "border-background/20 bg-background/5 hover:bg-background/10 hover:border-background/40",
                        isMostChosen && !selected && "border-accent/60",
                      )}
                    >
                      {isMostChosen && (
                        <span className="absolute -top-2.5 left-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground shadow-md">
                          🔥 Mais escolhido
                        </span>
                      )}
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      {showDiscount && (
                        <span className="rounded-full bg-[hsl(142,70%,45%)] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                          −{disc}% no combo
                        </span>
                      )}
                      <span className={cn("text-base font-bold leading-tight", selected ? "text-accent" : "text-background")}>{o.label}</span>
                      <div className="flex flex-col leading-none">
                        {showDiscount && (
                          <span className="text-[11px] font-medium text-background/50 line-through">
                            {formatBRL(o.price_cents)}
                          </span>
                        )}
                        <span className={cn("text-lg font-extrabold leading-none", selected ? "text-[hsl(142,70%,55%)]" : "text-background/90")}>
                          {formatBRL(finalPrice)}<span className="ml-1 text-[10px] font-medium opacity-70">/chip</span>
                        </span>
                      </div>
                      {o.description && (
                        <span className={cn("text-sm font-normal leading-snug", selected ? "text-background" : "text-background/60")}>{o.description}</span>
                      )}
                      {o.includes && o.includes.length > 0 && (
                        <ul className="mt-1 w-full space-y-1">
                          {o.includes.map((it: string, i: number) => (
                            <li key={i} className={cn("flex items-start gap-1.5 text-[13px] leading-snug", selected ? "text-background/95" : "text-background/70")}>
                              <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", selected ? "text-background" : "text-background/50")} />
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {wantFibra && (
                        <ul className="mt-2 w-full space-y-1 border-t border-background/10 pt-2">
                          {[
                            "Conta única com sua fibra",
                            "5G ilimitado para redes sociais",
                            "Sem fidelidade extra",
                          ].map((b, i) => (
                            <li key={i} className={cn("flex items-start gap-1.5 text-[12.5px] leading-snug", selected ? "text-background/95" : "text-background/80")}>
                              <Sparkles className={cn("mt-0.5 h-3 w-3 shrink-0", selected ? "text-background" : "text-accent")} />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-background/15 bg-background/5 p-4">
                <div>
                  <p className="text-sm font-medium">Quantidade de chips</p>
                  <p className="text-xs text-background/50">Cada chip é uma linha independente</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setChips((v) => Math.max(1, v - 1))} disabled={chips <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-background/20 bg-background/5 transition-colors hover:bg-background/15 disabled:opacity-30">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{chips}</span>
                  <button type="button" onClick={() => setChips((v) => Math.min(maxChips, v + 1))} disabled={chips >= maxChips} className="flex h-8 w-8 items-center justify-center rounded-lg border border-background/20 bg-background/5 transition-colors hover:bg-background/15 disabled:opacity-30">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TV toggle info */}
          {wantTv && hasTv && (
            <div ref={tvSectionRef} className="animate-fade-in rounded-2xl border border-background/15 bg-background/5 p-4 backdrop-blur">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Tv className="h-4 w-4 text-accent" /> TV por Assinatura
                {tvIncludedFree && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">Grátis</span>
                )}
              </h3>
              <p className="mt-2 text-sm text-background/60">
                {s.combo_tv_description}
                {tvIncludedFree ? " · Incluso no plano de fibra selecionado" : ` · ${formatBRL(tvPriceCents)}/mês`}
              </p>
            </div>
          )}

          {/* Comparativo de economia (estratégia 3) */}
          {wantFibra && !wantMovel && bestMovelDiscount.percent > 0 && bestMovelDiscount.cheapestPriceCents > 0 && (
            <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 backdrop-blur">
              <p className="flex items-center gap-2 text-xs text-background/80">
                <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                <span>
                  💡 Adicionando 5G você paga apenas{" "}
                  <strong className="text-[hsl(142,70%,55%)]">{formatBRL(bestMovelDiscount.cheapestPriceCents)}/mês</strong>{" "}
                  (−{bestMovelDiscount.percent}% exclusivo do combo)
                </span>
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={scrollToMovel}
                className="shrink-0 border-accent/50 bg-accent/10 text-background hover:bg-accent/20"
              >
                Ver opções <ArrowDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Summary */}
          {hasSelection && (
            <div className="animate-fade-in rounded-2xl border border-accent/30 bg-accent/5 p-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-background/50">Resumo do combo</p>
                  <div className="flex flex-wrap gap-2">
                    {wantFibra && selectedFibra && (
                      <span className="rounded-full bg-background/10 px-3 py-1 text-xs font-medium">
                        Fibra {selectedFibra.label} + {1 + extraModems} modem{extraModems > 0 ? "s" : ""}
                      </span>
                    )}
                    {wantMovel && (
                      <span className="rounded-full bg-background/10 px-3 py-1 text-xs font-medium">
                        Móvel {movelOptions.find((o: any) => o.id === movelId)?.label} × {chips} chip{chips > 1 ? "s" : ""}
                      </span>
                    )}
                    {wantTv && (
                      <span className="rounded-full bg-background/10 px-3 py-1 text-xs font-medium">
                        TV {s.combo_tv_description?.split("·")[0]?.trim()} {tvIncludedFree && <span className="text-[hsl(142,70%,45%)] font-bold ml-1">GRÁTIS</span>}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-background/50">Total estimado</p>
                  <p className="text-3xl font-bold tracking-tight text-accent">
                    {formatBRL(totalCents)}
                    <span className="text-sm font-normal text-background/60">/mês</span>
                  </p>
                  {tvIncludedFree && (
                    <p className="mt-1 text-sm font-semibold text-[hsl(142,70%,45%)]">
                      Economia de {formatBRL(tvPriceCents)}/mês na TV
                    </p>
                  )}
                  {comboSavingsCents > 0 && (
                    <p className="mt-1 text-sm font-semibold text-[hsl(142,70%,45%)]">
                      Você economiza {formatBRL(comboSavingsCents)}/mês no combo
                    </p>
                  )}
                  {wantFibra && extraModems > 0 && (
                    <p className="mt-1 text-sm text-background/70">
                      + {formatBRL(extraModems * extraModemCents)} único ({extraModems} ponto{extraModems > 1 ? "s" : ""} extra{extraModems > 1 ? "s" : ""})
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  className="bg-[#25D366] text-white hover:bg-[#25D366]/90 shadow-lg shadow-[#25D366]/20"
                  onClick={() => {
                    const lines: string[] = [];
                    lines.push("Olá! Quero contratar este combo personalizado:");
                    lines.push("");
                    if (wantFibra && selectedFibra) {
                      lines.push(`• Internet Fibra: ${selectedFibra.label} — ${formatBRL(selectedFibra.price_cents)}/mês`);
                      lines.push(`  Modens: ${1 + extraModems}${extraModems > 0 ? ` (${extraModems} extra · ${formatBRL(extraModems * extraModemCents)} único)` : " (1 incluso)"}`);
                    }
                    if (wantMovel) {
                      const sel = movelOptions.find((o: any) => o.id === movelId);
                      if (sel) {
                        const unit = applyComboDiscount(sel.price_cents, sel.combo_discount_percent, sel.combo_price_cents);
                        const hasComboPrice = (sel.combo_price_cents > 0 || sel.combo_discount_percent > 0) && wantFibra;
                        const disc = hasComboPrice ? ` (valor no combo)` : "";
                        lines.push(`• Móvel 5G: ${sel.label} × ${chips} chip${chips > 1 ? "s" : ""} — ${formatBRL(unit * chips)}/mês${disc}`);
                      }
                    }
                    if (wantTv) {
                      lines.push(`• TV por Assinatura${tvIncludedFree ? " — GRÁTIS (incluso na fibra)" : ` — ${formatBRL(tvPriceCents)}/mês`}`);
                    }
                    lines.push("");
                    lines.push(`Total estimado: ${formatBRL(totalCents)}/mês`);
                    if (comboSavingsCents > 0) {
                      lines.push(`Economia no combo: ${formatBRL(comboSavingsCents)}/mês`);
                    }
                    const cepDigits = cep.replace(/\D/g, "");
                    if (cepDigits.length === 8) {
                      lines.push(`CEP: ${cep}${cepAddress ? ` — ${cepAddress}` : ""}`);
                    }
                    const params = new URLSearchParams();
                    if (cepDigits.length === 8) params.set("cep", cepDigits);
                    if (wantFibra && fibraId) {
                      params.set("fibra", fibraId);
                      if (extraModems > 0) params.set("modems", String(extraModems));
                    }
                    if (wantMovel && movelId) {
                      params.set("movel", movelId);
                      if (chips > 1) params.set("chips", String(chips));
                    }
                    if (wantTv) params.set("tv", "1");
                    const link = `${window.location.origin}/monte-seu-combo?${params.toString()}`;
                    lines.push("");
                    lines.push(`Configuração: ${link}`);

                    const number = (settings.whatsapp_number || WHATSAPP.number).replace(/\D/g, "");
                    const url = `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Enviar pelo WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="border-background/40 bg-background/10 text-background font-semibold hover:bg-background/20"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Compartilhar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
