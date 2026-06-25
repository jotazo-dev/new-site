import { useState } from "react";
import { ShoppingCart, Trash2, Sparkles, Wifi, Smartphone, Tv, Phone, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, type Plan } from "@/data/plans";
import { cn } from "@/lib/utils";
import { validateCoupon } from "@/lib/coupons";
import { useCart } from "@/cart/CartContext";
import { toast } from "sonner";
import { getChargedUnitPriceCents, getSubtotalUnitPriceCents } from "@/cart/pricing";

const CATEGORY_ICON: Record<string, typeof Wifi> = {
  fibra: Wifi,
  movel: Smartphone,
  tv: Tv,
  combo: Phone,
};

const CATEGORY_STYLE: Record<string, string> = {
  fibra: "bg-primary/10 text-primary",
  movel: "bg-[#25D366]/10 text-[#25D366]",
  tv: "bg-accent/10 text-accent",
  combo: "bg-purple-500/10 text-purple-500",
};

export type SummaryItem = {
  plan: Plan;
  freeOverride?: boolean;
  freeConditionText?: string;
  label?: string;
  isSva?: boolean;
  /** When true, show originalPriceCents struck through and priceCents as combo price */
  comboDiscount?: boolean;
  /** When set, use this as the effective price in the combo (e.g. comboPriceCents from DB) */
  comboPriceCents?: number;
  /** Quantity for this item (default 1) */
  qty?: number;
};

interface OrderSummaryPanelProps {
  items: SummaryItem[];
  comboDiscountCents?: number;
  customerName?: string;
  onCustomerNameChange?: (name: string) => void;
  onRemove: (planId: string) => void;
  onClear: () => void;
  /** Callback opcional para quando o usuário clica em remover a Fibra em modo combo.
   *  Permite a página pai abrir um popup de retenção antes de limpar o pedido. */
  onRemoveFiber?: () => void;
  /** Callback opcional para quando o usuário clica em remover o Chip 5G em modo combo.
   *  Permite abrir popup avisando que os preços voltam para "sem combo". */
  onRemoveChipFromCombo?: (planId: string) => void;
  onCheckout: () => void;
  className?: string;
  /** Preferências do plano móvel (chip e formato), exibidas abaixo do item móvel */
  mobileChipType?: "5g" | "black";
  mobileSimFormat?: "fisico" | "esim";
  /** Valor total promocional (primeiros meses) */
  promoTotal?: number;
  /** Valor total a partir do mês pós-promoção */
  afterPromoTotal?: number;
  /** Quantos meses dura a promoção (default 3) */
  promoMonths?: number;
  /** Mês a partir do qual o valor pleno passa a valer (default 4) */
  afterPromoMonth?: number;
  /** Cupom aplicado (controlado pelo pai). */
  couponCode?: string | null;
  couponDiscountCents?: number;
  onApplyCoupon?: (code: string, discountCents: number) => void;
  onRemoveCoupon?: () => void;
}

export function OrderSummaryPanel({
  items,
  comboDiscountCents = 0,
  
  customerName = "",
  onCustomerNameChange,
  onRemove,
  onClear,
  onRemoveFiber,
  onRemoveChipFromCombo,
  onCheckout,
  className,
  mobileChipType,
  mobileSimFormat,
  promoTotal,
  afterPromoTotal,
  promoMonths = 3,
  afterPromoMonth = 4,
  couponCode = null,
  couponDiscountCents = 0,
  onApplyCoupon,
  onRemoveCoupon,
}: OrderSummaryPanelProps) {
  const [couponInput, setCouponInput] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const { setQty, count } = useCart();
  const displayItems = items;

  // Regra do combo: quando há fibra (modo combo), apenas a fibra pode ser removida.
  // Os demais itens ficam atrelados à fibra. Remover a fibra limpa o pedido inteiro.
  const hasFiberInItems = items.some((it) => it.plan.category === "fibra");
  

  // Fonte única de verdade compartilhada com o carrinho lateral.
  const subtotal = items.reduce((acc, it) => acc + getSubtotalUnitPriceCents(it) * (it.qty ?? 1), 0);
  const effectiveTotal = items.reduce((acc, it) => acc + getChargedUnitPriceCents(it) * (it.qty ?? 1), 0);
  const total = Math.max(0, effectiveTotal - comboDiscountCents - couponDiscountCents);
  const isEmpty = items.length === 0;

  const handleApplyCoupon = async () => {
    const def = await validateCoupon(couponInput, subtotal - comboDiscountCents);
    if (!def) {
      toast.error("Cupom inválido", { description: "Verifique o código e tente novamente." });
      return;
    }
    onApplyCoupon?.(def.code, def.discountCents);
    setCouponInput("");
    setCouponOpen(false);
    toast.success(`Cupom ${def.code} aplicado!`, { description: `Desconto de ${formatBRL(def.discountCents)}.` });
  };


  return (
    <aside className={cn("rounded-2xl border border-border bg-card shadow-lg", className)}>
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-foreground">Seu pedido</h3>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={() => {
              // Se há fibra no pedido, usa o fluxo de retenção (popup) — assim como o botão de remover fibra.
              if (hasFiberInItems && onRemoveFiber) {
                onRemoveFiber();
                return;
              }
              onClear();
            }}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
          >
            Esvaziar
          </button>
        )}
      </div>

      <div className="space-y-4 p-5">
        {isEmpty ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Comece adicionando seus serviços ao lado.
          </div>
        ) : (
          <>
            {items.length === 1 && (
              <div className="flex items-start gap-2 rounded-xl bg-[hsl(142,70%,40%)]/10 p-3 text-sm text-[hsl(142,70%,25%)]">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>Quer pagar menos?</strong> Adicione +1 produto e ganhe desconto no combo.
                </span>
              </div>
            )}

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Itens no pacote
              </div>
              <ul className="space-y-2">
                {displayItems.map((it) => {
                  const Icon = CATEGORY_ICON[it.plan.category] || ShoppingCart;
                  const iconStyle = CATEGORY_STYLE[it.plan.category] || "bg-muted text-foreground";
                  return (
                    <li key={it.plan.id}>
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconStyle)}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground">
                              <span className="truncate">
                                {it.label || it.plan.name}
                                {(it.qty ?? 1) > 1 && <span className="ml-1 text-muted-foreground">× {it.qty}</span>}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(() => {
                                const plan = it.plan;
                                const q = it.qty ?? 1;
                                const t = (plan as any).type;
                                const hasOriginal =
                                  !!plan.originalPriceCents &&
                                  plan.originalPriceCents > plan.priceCents;
                                const hasMobileInItems = items.some(
                                  (i) =>
                                    i.plan.category === "movel" &&
                                    (i.plan as any).type !== "sva" &&
                                    (i.plan as any).type !== "voz" &&
                                    (i.plan as any).type !== "upsell",
                                );
                                const hasTvInItems = items.some(
                                  (i) => i.plan.category === "tv" && (i.plan as any).type !== "sva",
                                );
                                const comboCompleto = hasFiberInItems && hasMobileInItems && hasTvInItems;

                                // Caso 1: Item grátis (TV grátis com fibra qualificada, etc.)
                                if (it.freeOverride) {
                                  return (
                                    <span>
                                      <span className="text-muted-foreground line-through">{formatBRL(plan.priceCents)}/mês</span>{" "}
                                      <span className="font-semibold text-[hsl(142,70%,40%)]">Grátis no combo</span>
                                      {q > 1 && (
                                        <span className="block text-[10px] font-semibold text-primary/70">
                                          + {q - 1} × {formatBRL(plan.priceCents)} = {formatBRL((q - 1) * plan.priceCents)}/mês
                                        </span>
                                      )}
                                      {it.freeConditionText && (
                                        <span className="block text-[10px] text-muted-foreground">{it.freeConditionText}</span>
                                      )}
                                    </span>
                                  );
                                }

                                // Caso 2: comboPriceCents explícito (preço de combo definido na base)
                                if (it.comboPriceCents != null && it.comboPriceCents > 0) {
                                  return (
                                    <span>
                                      <span className="text-muted-foreground line-through">{formatBRL(plan.priceCents)}/mês</span>{" "}
                                      <span className="font-semibold text-[hsl(142,70%,40%)]">{formatBRL(it.comboPriceCents)} Combo</span>
                                      {q > 1 && (
                                        <span className="block text-[10px] font-semibold text-primary/70">
                                          × {q} = {formatBRL(it.comboPriceCents * q)}/mês
                                        </span>
                                      )}
                                    </span>
                                  );
                                }

                                // Caso 3: Chip 5G SOZINHO (sem fibra) — mostra valor cheio + callout do combo (igual carrinho)
                                const isChipStandalone =
                                  plan.category === "movel" &&
                                  t !== "sva" &&
                                  t !== "voz" &&
                                  t !== "upsell" &&
                                  !hasFiberInItems &&
                                  hasOriginal;
                                if (isChipStandalone) {
                                  return (
                                    <span>
                                      {formatBRL(plan.originalPriceCents!)}/mês
                                      {q > 1 && (
                                        <span className="block text-[10px] font-semibold text-primary/70">
                                          × {q} = {formatBRL(plan.originalPriceCents! * q)}/mês
                                        </span>
                                      )}
                                      <span className="mt-1 flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                                        <Sparkles className="h-3 w-3" />
                                        {formatBRL(plan.priceCents)}/mês no combo com Internet Fibra
                                      </span>
                                    </span>
                                  );
                                }

                                // Caso 3b: Chip 5G com Fibra mas SEM TV (combo incompleto)
                                // — cobra valor cheio (originalPriceCents) sem riscado,
                                // pois desconto de combo só vale com os 3 itens (Fibra+TV+Chip).
                                const isChipFiberOnly =
                                  plan.category === "movel" &&
                                  t !== "sva" &&
                                  t !== "voz" &&
                                  t !== "upsell" &&
                                  hasFiberInItems &&
                                  !comboCompleto &&
                                  hasOriginal;
                                if (isChipFiberOnly) {
                                  return (
                                    <span>
                                      {formatBRL(plan.originalPriceCents!)}/mês
                                      {q > 1 && (
                                        <span className="block text-[10px] font-semibold text-primary/70">
                                          × {q} = {formatBRL(plan.originalPriceCents! * q)}/mês
                                        </span>
                                      )}
                                    </span>
                                  );
                                }

                                // Caso 4: Combo discount (fibra ou chip em combo) — riscado + preço combo
                                if (it.comboDiscount && plan.originalPriceCents) {

                                  return (
                                    <span>
                                      <span className="text-muted-foreground line-through">{formatBRL(plan.originalPriceCents)}/mês</span>{" "}
                                      <span className="font-semibold text-[hsl(142,70%,40%)]">{formatBRL(plan.priceCents)} Combo</span>
                                      {q > 1 && (
                                        <span className="block text-[10px] font-semibold text-primary/70">
                                          × {q} = {formatBRL(plan.priceCents * q)}/mês
                                        </span>
                                      )}
                                      {(() => {
                                        const promoM = Number((plan as any).promoMonths) || 0;
                                        if (promoM > 0 && comboCompleto) {
                                          return (
                                            <span className="mt-1 flex items-center gap-1 rounded-md bg-[hsl(142,70%,40%)]/10 px-2 py-0.5 text-[10px] font-semibold text-[hsl(142,70%,30%)]">
                                              <Sparkles className="h-3 w-3" />
                                              {promoM} primeiros meses · depois {formatBRL(plan.originalPriceCents!)}/mês
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </span>
                                  );
                                }

                                // Caso 5: TV em combo (não SVA, com fibra) — riscado + preço combo
                                if (
                                  plan.category === "tv" &&
                                  t !== "sva" &&
                                  hasFiberInItems &&
                                  hasOriginal
                                ) {
                                  return (
                                    <span>
                                      <span className="text-muted-foreground line-through">{formatBRL(plan.originalPriceCents!)}/mês</span>{" "}
                                      <span className="font-semibold text-[hsl(142,70%,40%)]">{formatBRL(plan.priceCents)} Combo</span>
                                      {q > 1 && (
                                        <span className="block text-[10px] font-semibold text-primary/70">
                                          × {q} = {formatBRL(plan.priceCents * q)}/mês
                                        </span>
                                      )}
                                    </span>
                                  );
                                }

                                // Caso 6: Fibra sem combo — mostra valor cheio (originalPriceCents) sem riscado
                                if (plan.category === "fibra" && hasOriginal) {
                                  return (
                                    <span>
                                      {formatBRL(plan.originalPriceCents!)}/mês
                                      {q > 1 && (
                                        <span className="block text-[10px] font-semibold text-primary/70">
                                          × {q} = {formatBRL(plan.originalPriceCents! * q)}/mês
                                        </span>
                                      )}
                                    </span>
                                  );
                                }

                                // Caso 7 (padrão): preço normal com riscado opcional
                                return (
                                  <span>
                                    {hasOriginal && (
                                      <>
                                        <span className="text-muted-foreground line-through">{formatBRL(plan.originalPriceCents!)}/mês</span>{" "}
                                      </>
                                    )}
                                    {formatBRL(plan.priceCents)}/mês
                                    {q > 1 && (
                                      <span className="block text-[10px] font-semibold text-primary/70">
                                        × {q} = {formatBRL(plan.priceCents * q)}/mês
                                      </span>
                                    )}
                                  </span>
                                );
                              })()}
                              {it.plan.category === "movel" && (it.plan as any).type !== "sva" && (it.plan as any).type !== "voz" && (mobileChipType || mobileSimFormat || (it.plan as any).chipType) && (
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    {((it.plan as any).chipType ?? mobileChipType) === "black" ? "Black Chip 5G" : "Chip 5G"}
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                                    {mobileSimFormat === "esim" ? "eSIM Digital" : "Cartão SIM"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {(() => {
                          const isFiber = it.plan.category === "fibra";
                          const isMobile = it.plan.category === "movel";
                          const isTv = it.plan.category === "tv";
                          const isSvaOrVoz = (it.plan as any).type === "sva" || (it.plan as any).type === "voz";
                          const isStepperEligible = isMobile && !isSvaOrVoz;
                          // TV só fica travada quando está grátis pelo combo (freeOverride). Caso contrário, pode remover.
                          const tvLocked = isTv && !!it.freeOverride;
                          if (hasFiberInItems && !isFiber && !isMobile && tvLocked) return null;
                          const qty = it.qty ?? 1;
                          return (
                            <div className="flex shrink-0 flex-col items-end gap-1 self-start">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isFiber && hasFiberInItems) {
                                    if (onRemoveFiber) onRemoveFiber();
                                    else onClear();
                                    return;
                                  }
                                  // Chip 5G dentro de um combo: avisa que preços voltam ao "sem combo"
                                  const isStandaloneChip =
                                    isMobile && !isSvaOrVoz && (it.plan as any).type !== "upsell";
                                  if (isStandaloneChip && hasFiberInItems && onRemoveChipFromCombo) {
                                    onRemoveChipFromCombo(it.plan.id);
                                    return;
                                  }
                                  onRemove(it.plan.id);
                                }}
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                aria-label={isFiber && hasFiberInItems ? "Remover fibra e limpar pedido" : "Remover"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              {isStepperEligible && (
                                <div className="flex items-center gap-1 rounded-full border border-border bg-background px-1 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setQty(it.plan.id, Math.max(1, qty - 1))}
                                    disabled={qty <= 1}
                                    aria-label="Diminuir quantidade"
                                    className="grid h-6 w-6 place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                                  >
                                    −
                                  </button>
                                  <span className="min-w-[1rem] text-center text-xs font-bold tabular-nums">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => setQty(it.plan.id, qty + 1)}
                                    aria-label="Aumentar quantidade"
                                    className="grid h-6 w-6 place-items-center rounded-full text-foreground transition-colors hover:bg-muted"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {comboDiscountCents > 0 && (
              <div className="flex items-center justify-between border-t border-dashed border-border pt-3 text-sm">
                <span className="text-muted-foreground">Desconto combo</span>
                <span className="font-semibold text-[hsl(142,70%,40%)]">
                  - {formatBRL(comboDiscountCents)}
                </span>
              </div>
            )}

            {/* Cupom */}
            <div className="border-t border-dashed border-border pt-3">
              {couponCode ? (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-[hsl(142,70%,40%)]/10 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag className="h-4 w-4 shrink-0 text-[hsl(142,70%,40%)]" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[hsl(142,70%,25%)] truncate">Cupom {couponCode}</div>
                      <div className="text-[11px] text-muted-foreground">Desconto aplicado</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm font-semibold text-[hsl(142,70%,40%)]">
                      - {formatBRL(couponDiscountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remover cupom"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : couponOpen ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase().slice(0, 30))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                    placeholder="Código do cupom"
                    className="h-9 text-sm uppercase tracking-wider"
                    maxLength={30}
                  />
                  <Button type="button" size="sm" className="h-9 shrink-0" onClick={handleApplyCoupon} disabled={!couponInput.trim()}>
                    Aplicar
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setCouponOpen(false); setCouponInput(""); }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCouponOpen(true)}
                  className="flex w-full items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Tag className="h-4 w-4" />
                  Tem um cupom de desconto?
                </button>
              )}
            </div>

            {/* Nome do cliente coletado na etapa "Seus dados" — removido daqui para evitar duplicação */}

            {promoTotal != null && afterPromoTotal != null && promoTotal !== afterPromoTotal && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Condições da promoção
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{promoMonths} primeiros meses</span>
                  <span className="font-bold text-[hsl(142,70%,40%)]">{formatBRL(promoTotal)}/mês</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">A partir do {afterPromoMonth}º mês</span>
                  <span className="font-semibold text-foreground">{formatBRL(afterPromoTotal)}/mês</span>
                </div>
              </div>
            )}

            {(() => {
              const hasPromoPeriod = promoTotal != null && afterPromoTotal != null && promoTotal !== afterPromoTotal && (promoMonths ?? 0) > 0;
              const pMonths = Math.min(12, Math.max(0, promoMonths ?? 0));
              const annualCost = hasPromoPeriod
                ? (promoTotal as number) * pMonths + (afterPromoTotal as number) * (12 - pMonths)
                : total * 12;
              const savingsAnnual = Math.max(0, subtotal * 12 - annualCost);
              const hasSavings = savingsAnnual > 0;
              const hasMobileInItems = items.some((i) => i.plan.category === "movel");
              return (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground -mt-1">
                    <span>{count} {count === 1 ? "item" : "itens"} no pedido</span>
                    {hasSavings && (
                      <span className="text-sm font-semibold text-[hsl(142,70%,40%)]">
                        (Economize {formatBRL(savingsAnnual)} por ano)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                    <span className={cn("text-sm text-muted-foreground", hasSavings && "line-through")}>
                      {formatBRL(subtotal)}/mês
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-base font-semibold text-foreground">
                      {hasFiberInItems && hasMobileInItems ? "Total no combo:" : "Total"}
                    </span>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-[hsl(142,70%,40%)]">{formatBRL(total)}</div>
                      <div className="text-xs text-muted-foreground">/mês</div>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        <Button
          type="button"
          onClick={onCheckout}
          disabled={isEmpty}
          className="h-12 w-full text-base font-bold"
          size="lg"
        >
          Fechar pedido
        </Button>
      </div>
    </aside>
  );
}
