import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/cart/CartContext";
import type { CustomerDetails } from "@/components/combo/CustomerDetailsStep";

export type LeadItem = {
  plan_id: string;
  plan_name: string;
  category: string;
  price_cents: number;
  qty: number;
  free_override: boolean;
};

export type LeadSource = "website" | "whatsapp";

export interface CreateLeadParams {
  details: CustomerDetails;
  items: CartItem[];
  freeTvOverride: boolean;
  subtotalCents: number;
  comboDiscountCents: number;
  totalCents: number;
  couponCode?: string;
  source: LeadSource;
  mobileChipType?: "5g" | "black";
  mobileSimFormat?: "fisico" | "esim";
}

export async function createLead(params: CreateLeadParams) {
  const {
    details,
    items,
    freeTvOverride,
    subtotalCents,
    comboDiscountCents,
    totalCents,
    couponCode,
    source,
    mobileChipType,
    mobileSimFormat,
  } = params;

  const hasMobile = items.some((it) => it.plan.category === "movel");
  const mobilePrefNote = hasMobile && (mobileChipType || mobileSimFormat)
    ? `Móvel: ${mobileChipType === "black" ? "Black Chip 5G" : "Chip 5G"} · ${mobileSimFormat === "esim" ? "eSIM Digital" : "Cartão SIM"}`
    : "";

  const leadItems: LeadItem[] = items.map((it) => ({
    plan_id: it.plan.id,
    plan_name: it.plan.name,
    category: it.plan.category,
    price_cents: it.plan.priceCents,
    qty: it.qty,
    free_override: it.plan.category === "tv" && freeTvOverride,
  }));

  const payload = {
    customer_name: `${details.firstName} ${details.lastName}`.trim(),
    customer_email: details.email || null,
    customer_phone: details.phone ? details.phone.replace(/\D/g, "") : null,
    cep: details.cep || "",
    street: details.street || "",
    number: details.number || "",
    complement: details.complement || "",
    neighborhood: details.neighborhood || "",
    city: details.city || "",
    uf: details.uf || "",
    items: leadItems as unknown as never,
    subtotal_cents: subtotalCents,
    combo_discount_cents: comboDiscountCents,
    total_cents: totalCents,
    coupon_code: couponCode || null,
    source,
    stage: "novo",
    notes: mobilePrefNote,
  };

  const { data, error } = await supabase
    .from("crm_leads")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
