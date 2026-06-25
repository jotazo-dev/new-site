import { useQuery } from "@tanstack/react-query";
import { supabase, SUPABASE_DISABLED } from "@/integrations/supabase/client";
import type { Plan, PlanIncludeItem } from "@/data/plans";
import { fallbackPlans } from "@/data/fallbackPlans";

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

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(
          "id,category,name,price_cents,original_price_cents,description,conditions,includes,badges,type,icon,logo_url,sva_ids,accent_color,accent_label,combo_discount_percent,combo_price_cents,combo_highlight_text,chip_type,portability_gb,portability_label,promo_months,sort_order"
        )
        .eq("active", true)
        .neq("type", "sva")
        .neq("type", "voz")
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
        svaIds: Array.isArray((row as any).sva_ids) ? (row as any).sva_ids : [],
        accentColor: (row as any).accent_color || "",
        accentLabel: (row as any).accent_label || "",
        comboDiscountPercent: Number((row as any).combo_discount_percent) || 0,
        comboPriceCents: Number((row as any).combo_price_cents) || 0,
        comboHighlightText: (row as any).combo_highlight_text || "",
        chipType: (row as any).chip_type || "5g",
        portabilityGb: Number((row as any).portability_gb) || 0,
        portabilityLabel: (row as any).portability_label || "",
        promoMonths: Number((row as any).promo_months) || 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
