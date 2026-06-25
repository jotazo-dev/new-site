import { Tv, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL, type Plan, type PlanIncludeItem } from "@/data/plans";
import { useCart } from "@/cart/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlanAccent } from "@/lib/planAccent";
import { PlanIncludeIcon } from "@/components/shop/PlanIncludeIcon";
import { isHboMaxSva, isHboCompatibleTvPlan } from "@/lib/hboMaxRule";

function normalizeIncludes(raw: unknown): PlanIncludeItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: unknown) => {
    if (typeof item === "string") return { icon: "check", text: item };
    if (item && typeof item === "object" && "text" in item) {
      return { icon: (item as any).icon || "check", text: (item as any).text || "" };
    }
    return { icon: "check", text: String(item) };
  });
}

export function TVSvaSection() {
  const { add, items, remove } = useCart();

  const { data: svaPlansRaw = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["sva-plans-tv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(
          "id,category,name,price_cents,original_price_cents,description,conditions,includes,badges,type,icon,logo_url,sva_ids,accent_color,accent_label,combo_discount_percent,combo_price_cents,combo_highlight_text,chip_type,portability_gb,portability_label,sort_order"
        )
        .eq("active", true)
        .eq("type", "sva")
        .eq("category", "tv")
        .order("sort_order", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        category: row.category as Plan["category"],
        name: row.name,
        priceCents: row.price_cents,
        originalPriceCents: row.original_price_cents || undefined,
        description: row.description,
        conditions: (row as any).conditions || "",
        includes: normalizeIncludes(row.includes),
        badges: ((row.badges as string[]) ?? []) as Plan["badges"],
        type: row.type,
        icon: (row as any).icon || "check",
        logoUrl: (row as any).logo_url || "",
        svaIds: [],
        accentColor: (row as any).accent_color || "",
        accentLabel: (row as any).accent_label || "",
        comboDiscountPercent: Number((row as any).combo_discount_percent) || 0,
        comboPriceCents: Number((row as any).combo_price_cents) || 0,
        comboHighlightText: (row as any).combo_highlight_text || "",
        chipType: (row as any).chip_type || "5g",
        portabilityGb: Number((row as any).portability_gb) || 0,
        portabilityLabel: (row as any).portability_label || "",
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const tvInCart = items.find((i) => i.plan.category === "tv" && (i.plan as any).type !== "sva")?.plan;
  const hboAllowed = isHboCompatibleTvPlan(tvInCart as any);
  const svaPlans = svaPlansRaw.filter((p) => (hboAllowed ? true : !isHboMaxSva(p)));

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="mx-auto h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </section>
    );
  }

  if (svaPlans.length === 0) return null;

  return (
    <section className="space-y-6">
      <header className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Adicione Canais e Streamings extras
          </span>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">
          Turbine o seu Plano com Streamings Exclusivos
        </h2>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          Turbine seu plano de TV com pacotes premium, esportes e os principais streamings do mercado.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {svaPlans.map((plan) => {
          const inCart = items.some((i) => i.plan.id === plan.id);
          const accent = getPlanAccent(plan.accentColor);
          const hasAccent = !!accent.value;
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1",
                inCart
                  ? "border-[#25D366] ring-2 ring-[#25D366] shadow-lg"
                  : hasAccent
                    ? cn(accent.border, "shadow-lg")
                    : "shadow-sm hover:shadow-lg"
              )}
            >
              {plan.badges && plan.badges.length > 0 && (
                <div className="absolute right-3 top-3 flex gap-1.5">
                  {plan.badges.map((b) => (
                    <span
                      key={b}
                      className={cn(
                        "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase",
                        hasAccent ? accent.badge : "bg-accent text-accent-foreground",
                      )}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-3 flex h-14 items-center justify-start">
                  {plan.logoUrl ? (
                    <img
                      src={plan.logoUrl}
                      alt={plan.name}
                      loading="lazy"
                      className="h-14 w-auto max-w-[180px] object-contain"
                    />
                  ) : (
                    <Tv className="h-10 w-10 text-accent" aria-hidden="true" />
                  )}
                </div>
                <h3 className="text-xl font-semibold tracking-tight">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                )}

                <div className="mt-4">
                  <span className="text-3xl font-bold tracking-tight">
                    {formatBRL(plan.priceCents)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                {plan.includes.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {plan.includes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <PlanIncludeIcon icon={item.icon} className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                )}

                {plan.conditions && (
                  <p className="mt-3 text-[11px] leading-tight text-muted-foreground/70">{plan.conditions}</p>
                )}

                <div className="mt-auto pt-5">
                  <Button
                    className={cn(
                      "w-full rounded-xl transition-colors",
                      inCart && "bg-[#25D366] hover:bg-[#20bd5a] text-white",
                    )}
                    onClick={() => (inCart ? remove(plan.id) : add(plan))}
                  >
                    {inCart ? "✓ Adicionado" : "Adicionar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
