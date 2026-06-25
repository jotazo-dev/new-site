import type { CartItem } from "@/cart/CartContext";
import { formatBRL } from "@/data/plans";
import { WHATSAPP } from "@/config/site";

function getNumber(overrideNumber?: string) {
  return (overrideNumber || WHATSAPP.number).replace(/\D/g, "");
}

const DIVIDER = "━━━━━━━━━━━━━━━";

export function formatPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

function categoryEmoji(category?: string) {
  switch (category) {
    case "fibra":
      return "🌐";
    case "movel":
      return "📱";
    case "tv":
      return "📺";
    default:
      return "🎁";
  }
}

function categoryLabel(category?: string, type?: string) {
  if (type === "sva") return "SVA / Streaming";
  switch (category) {
    case "fibra":
      return "Internet Fibra";
    case "movel":
      return "Móvel 5G";
    case "tv":
      return "TV";
    default:
      return "Adicional";
  }
}

export function buildWhatsAppCheckoutUrl(params: {
  items: CartItem[];
  totalCents: number;
  customerName?: string;
  customerPhone?: string;
  cep?: string;
  address?: string;
  bestTime?: string;
  whatsappNumber?: string;
  couponCode?: string;
  comboDiscountCents?: number;
  mobileChipType?: "5g" | "black";
  mobileSimFormat?: "fisico" | "esim";
  promoTotalCents?: number;
  afterPromoTotalCents?: number;
  promoMonths?: number;
  afterPromoMonth?: number;
  freeItemIds?: string[];
  customerCity?: string;
  customerUf?: string;
  /** Mapa id→preço efetivo no combo (mostrado riscando o original). Ex.: TV trocada com desconto Life Line HD. */
  discountedItemPrices?: Record<string, number>;
}) {
  const { items, totalCents, customerName, customerPhone, cep, address, bestTime, whatsappNumber, couponCode, comboDiscountCents, mobileChipType, mobileSimFormat, promoTotalCents, afterPromoTotalCents, promoMonths = 3, afterPromoMonth = 4, freeItemIds = [], discountedItemPrices = {}, customerCity, customerUf } = params;

  const lines: string[] = [];
  lines.push("🎉 *Olá! Quero contratar meu combo Jotazo* 🎉");
  lines.push("");
  lines.push(DIVIDER);
  lines.push("📦 *MEU PEDIDO*");
  lines.push(DIVIDER);
  lines.push("");

  const hasMobile = items.some((it) => it.plan.category === "movel");

  for (const it of items) {
    const emoji = categoryEmoji(it.plan.category);
    const qtyPart = it.qty > 1 ? ` x${it.qty}` : "";
    const isFree = freeItemIds.includes(it.plan.id);
    const discounted = discountedItemPrices[it.plan.id];
    const priceDisplay = isFree
      ? `~${formatBRL(it.plan.priceCents)}/mês~ *GRÁTIS no combo*`
      : discounted != null
        ? `~${formatBRL(it.plan.priceCents)}/mês~ *${formatBRL(discounted)}/mês* (desconto combo)`
        : `${formatBRL(it.plan.priceCents)}/mês`;
    lines.push(`${emoji} *${it.plan.name}*${qtyPart} — ${priceDisplay}`);
    const catLabel = categoryLabel(it.plan.category, (it.plan as any).type);
    const desc = (it.plan.description || "").trim();
    const subParts = [catLabel];
    if (desc) subParts.push(desc);
    lines.push(`   └ ${subParts.join(" · ")}`);
    if (it.plan.category === "movel" && (it.plan as any).type !== "voz" && (it.plan as any).type !== "sva") {
      const perItemChip = (it.plan as any).chipType as "5g" | "black" | undefined;
      const effectiveChip = perItemChip ?? mobileChipType;
      const chipLabel = effectiveChip === "black" ? "Black Chip 5G" : "Chip 5G";
      const formatLabel = mobileSimFormat === "esim" ? "eSIM Digital" : "Cartão SIM";
      lines.push(`   └ ${chipLabel} · ${formatLabel}`);
    }
  }

  lines.push("");
  lines.push(DIVIDER);
  lines.push("💰 *RESUMO*");
  lines.push(DIVIDER);
  lines.push("");

  if (comboDiscountCents && comboDiscountCents > 0) {
    lines.push(`🎟 Cupom: *${couponCode || "COMBO-JOTAZO"}*`);
    lines.push(`✅ Desconto combo: *-${formatBRL(comboDiscountCents)}*`);
  }
  if (promoTotalCents != null && afterPromoTotalCents != null && promoTotalCents !== afterPromoTotalCents) {
    lines.push("");
    lines.push(DIVIDER);
    lines.push("📋 *CONDIÇÕES DA PROMOÇÃO*");
    lines.push(DIVIDER);
    lines.push("");
    lines.push(`✨ ${promoMonths} primeiros meses: *${formatBRL(promoTotalCents)}/mês*`);
    lines.push(`📌 A partir do ${afterPromoMonth}º mês: *${formatBRL(afterPromoTotalCents)}/mês*`);
  }

  lines.push("");
  lines.push(`💵 *Total: ${formatBRL(totalCents)}/mês*`);

  lines.push("");
  lines.push(DIVIDER);
  lines.push("👤 *MEUS DADOS*");
  lines.push(DIVIDER);
  lines.push("");

  lines.push(`📛 Nome: ${customerName || "(a informar)"}`);
  if (customerPhone) lines.push(`📞 Telefone: ${formatPhoneBR(customerPhone)}`);
  lines.push(`📍 CEP: ${cep || "(a informar)"}`);
  if (address) {
    lines.push(`🏠 Endereço: ${address}`);
  } else if (customerCity) {
    lines.push(`🏙 Cidade: ${customerCity}${customerUf ? ` - ${customerUf}` : ""}`);
  }
  lines.push(`🕐 Melhor horário: ${bestTime || "(a combinar)"}`);

  lines.push("");
  lines.push(DIVIDER);
  lines.push("");
  lines.push("Aguardo o contato para finalizar! 🙌");

  const text = encodeURIComponent(String(lines.join("\n")));
  const number = getNumber(whatsappNumber);
  return `https://api.whatsapp.com/send?phone=${number}&text=${text}`;
}

export function buildWhatsAppChip5gUrl(params: { selectedPlanId?: string; whatsappNumber?: string; chipName?: string; simFormat?: "fisico" | "esim" }) {
  const { selectedPlanId, whatsappNumber, chipName, simFormat } = params;
  const chipLabel = chipName || "Chip 5G Jotazo";
  const formatLabel = simFormat === "esim" ? "eSIM Digital" : simFormat === "fisico" ? "Cartão SIM físico" : null;

  const lines: string[] = [];
  lines.push(`🚀 *Olá! Tenho interesse no ${chipLabel}* 📱`);
  lines.push("");
  lines.push(DIVIDER);
  lines.push("");
  if (selectedPlanId) lines.push(`🎯 Plano de interesse: *${selectedPlanId}*`);
  if (formatLabel) lines.push(`📲 Formato: *${formatLabel}*`);
  lines.push("");
  lines.push("👤 *MEUS DADOS*");
  lines.push(DIVIDER);
  lines.push("");
  lines.push("📛 Nome: (a informar)");
  lines.push("📍 CEP: (a informar)");
  lines.push("");
  lines.push("Aguardo o contato! 🙌");

  const text = encodeURIComponent(String(lines.join("\n")));
  const number = getNumber(whatsappNumber);
  return `https://api.whatsapp.com/send?phone=${number}&text=${text}`;
}
