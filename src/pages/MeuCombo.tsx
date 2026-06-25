import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Wifi, Smartphone, Tv, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { OrderSummaryPanel, type SummaryItem } from "@/components/combo/OrderSummaryPanel";
import { useCart } from "@/cart/CartContext";
import { usePlans } from "@/hooks/usePlans";
import { buildWhatsAppCheckoutUrl } from "@/lib/whatsapp";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { formatBRL } from "@/data/plans";
import { cn } from "@/lib/utils";
import { computeCartTotals, TV_FREE_CONDITION_TEXT } from "@/cart/pricing";

const CATEGORY_ICON: Record<string, typeof Wifi> = {
  fibra: Wifi,
  movel: Smartphone,
  tv: Tv,
};

const CATEGORY_STYLE: Record<string, string> = {
  fibra: "bg-primary/10 text-primary",
  movel: "bg-[#25D366]/10 text-[#25D366]",
  tv: "bg-accent/10 text-accent",
};

const CATEGORY_LABEL: Record<string, string> = {
  fibra: "Internet Fibra",
  movel: "Móvel 5G",
  tv: "TV",
  combo: "Combo",
};

export default function MeuCombo() {
  const navigate = useNavigate();
  const { items, totalCents, remove, clear } = useCart();
  const { data: plans = [] } = usePlans();
  const settings = useSiteSettings();

  const totals = computeCartTotals(items, plans);
  const summaryItems = totals.summaryItems as unknown as SummaryItem[];
  const summaryById = new Map(summaryItems.map((it) => [it.plan.id, it]));
  const isItemFree = (plan: typeof items[number]["plan"]) => summaryById.get(plan.id)?.freeOverride === true;

  const handleCheckout = () => {
    const freeItemIds = items.filter((it) => isItemFree(it.plan)).map((it) => it.plan.id);
    const url = buildWhatsAppCheckoutUrl({
      items,
      totalCents,
      whatsappNumber: (settings as any).whatsapp_number,
      freeItemIds,
    });
    window.open(url, "_blank");
  };

  const handleOnlineCheckout = () => navigate("/checkoutv2");

  const isEmpty = items.length === 0;

  return (
    <>
      <SEOHead
        title="Meu Combo | Jotazo Telecom"
        description="Revise os itens do seu combo e finalize o pedido."
        path="/meu-combo"
      />

      <main className="bg-muted/20 min-h-screen py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Meu Combo</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Confira os itens selecionados e finalize seu pedido.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Continuar navegando
            </Button>
          </div>

          {isEmpty ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Seu combo está vazio</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Adicione planos para montar seu combo.
              </p>
              <Button className="mt-5 rounded-xl" onClick={() => navigate("/")}>
                Ver planos
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Items list */}
              <section className="space-y-3">
                {items.map((it) => {
                  const Icon = CATEGORY_ICON[it.plan.category] ?? Phone;
                  return (
                    <div
                      key={it.plan.id}
                      className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                          CATEGORY_STYLE[it.plan.category] ?? "bg-muted text-foreground",
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {CATEGORY_LABEL[it.plan.category] ?? it.plan.category}
                        </div>
                        <div className="font-semibold text-foreground truncate">{it.plan.name}</div>
                        {it.plan.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {it.plan.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {isItemFree(it.plan) ? (
                          <>
                            <div className="text-sm text-muted-foreground line-through">{formatBRL(it.plan.priceCents)}</div>
                            <div className="text-lg font-bold text-[#25D366]">Grátis</div>
                            <div className="text-[10px] text-muted-foreground">{TV_FREE_CONDITION_TEXT}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-lg font-bold">{formatBRL(it.plan.priceCents)}</div>
                            <div className="text-[11px] text-muted-foreground">/mês</div>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(it.plan.id)}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Summary */}
              <div className="lg:sticky lg:top-24 lg:self-start space-y-3">
                <OrderSummaryPanel
                  items={summaryItems}
                  comboDiscountCents={0}
                  onRemove={remove}
                  onClear={clear}
                  onCheckout={handleCheckout}
                />
                <Button
                  size="lg"
                  variant="default"
                  className="w-full rounded-xl bg-primary hover:bg-primary/90"
                  onClick={handleOnlineCheckout}
                >
                  Pagar online (Pix, cartão ou boleto)
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">
                  Pagamento seguro processado pela Cielo.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
