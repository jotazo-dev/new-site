// Cupons promocionais gerenciados pelo admin (tabela `coupons`).
// Acesso público é feito via RPCs (`validate_coupon`, `get_active_coupon_for`)
// que retornam apenas os campos seguros (code, label, discount_cents),
// preservando metadados internos (uses_count, max_uses, flags) no servidor.
import { supabase } from "@/integrations/supabase/client";

export type CouponDef = {
  code: string;
  discountCents: number;
  label: string;
};

export type CouponPlacement = "checkout" | "exit_popup" | "banner";

/** Valida um código digitado pelo usuário (checkout). */
export async function validateCoupon(
  raw: string,
  subtotalCents = 0
): Promise<CouponDef | null> {
  const code = raw.trim().toUpperCase().slice(0, 30);
  if (!code) return null;
  const { data, error } = await supabase.rpc("validate_coupon", {
    _code: code,
    _subtotal_cents: subtotalCents,
  });
  if (error || !data?.length) return null;
  const row = data[0] as { code: string; label: string; discount_cents: number };
  return { code: row.code, label: row.label || row.code, discountCents: row.discount_cents };
}

/** Retorna o cupom prioritário ativo para uma posição (popup, banner). */
export async function getActiveCouponFor(
  placement: CouponPlacement
): Promise<CouponDef | null> {
  const { data, error } = await supabase.rpc("get_active_coupon_for", {
    _placement: placement,
  });
  if (error || !data?.length) return null;
  const row = data[0] as { code: string; label: string; discount_cents: number };
  return { code: row.code, label: row.label || row.code, discountCents: row.discount_cents };
}
