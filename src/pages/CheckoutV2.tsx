import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { CheckoutStepper } from "@/components/checkout-v2/CheckoutStepper";
import { CustomerStep } from "@/components/checkout-v2/CustomerStep";
import { LineStep } from "@/components/checkout-v2/LineStep";
import { PaymentStep, type PaymentSubmit } from "@/components/checkout-v2/PaymentStep";
import { PixPanel } from "@/components/checkout-v2/PixPanel";
import { BoletoPanel } from "@/components/checkout-v2/BoletoPanel";
import { OrderSummaryPanel, type SummaryItem } from "@/components/combo/OrderSummaryPanel";
import { useCart } from "@/cart/CartContext";
import { usePlans } from "@/hooks/usePlans";
import { computeCartTotals } from "@/cart/pricing";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, ShieldCheck } from "lucide-react";
import { createCheckoutPayment, type CheckoutCreateResult } from "@/hooks/useCheckoutPayment";
import type { CustomerInput, LineInput } from "@/lib/checkoutValidation";
import { toast } from "sonner";
import { savePendingPayment, loadPendingPayment, clearPendingPayment } from "@/components/checkout-v2/pendingPayment";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

export default function CheckoutV2() {
  const navigate = useNavigate();
  const { items, remove, clear } = useCart();
  const { data: plans = [] } = usePlans();
  const { user, profile } = useCustomerAuth();

  const totals = useMemo(() => computeCartTotals(items, plans), [items, plans]);
  const summaryItems = totals.summaryItems as unknown as SummaryItem[];

  const hasMobile = items.some((it) => it.plan.category === "movel");

  // Steps: 1 Revisão · 2 Dados · 3 Linha (se móvel) · 4 Pagamento · 5 Confirmação
  type Step = 1 | 2 | 3 | 4 | 5;
  const [step, setStep] = useState<Step>(1);
  const [customer, setCustomer] = useState<CustomerInput | null>(null);
  const [line, setLine] = useState<LineInput | null>(null);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<CheckoutCreateResult | null>(null);

  // Rehidrata pagamento pendente (Pix/Boleto) ao montar — sobrevive a refresh.
  useEffect(() => {
    const p = loadPendingPayment();
    if (!p) return;
    setResult({
      ok: true,
      orderId: p.orderId,
      method: p.method,
      status: "pending",
      pix: p.pix,
      boleto: p.boleto,
    });
    setStep((p.hasMobile ? 5 : 4) as Step);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill from logged-in customer profile (only if not already set)
  useEffect(() => {
    if (customer || !user || !profile) return;
    setCustomer((prev) => prev ?? ({
      name: profile.full_name || "",
      doc: profile.cpf_cnpj || "",
      email: user.email || "",
      phone: profile.phone || "",
      birthDate: profile.birthdate || "",
      address: { cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" },
    } as CustomerInput));
  }, [user, profile, customer]);

  const isEmpty = items.length === 0;

  const stepperList = hasMobile
    ? [
        { id: 1, label: "Revisão" },
        { id: 2, label: "Seus dados" },
        { id: 3, label: "Linha" },
        { id: 4, label: "Pagamento" },
        { id: 5, label: "Confirmação" },
      ]
    : [
        { id: 1, label: "Revisão" },
        { id: 2, label: "Seus dados" },
        { id: 3, label: "Pagamento" },
        { id: 4, label: "Confirmação" },
      ];
  const stepperCurrent = hasMobile ? step : (step >= 4 ? step - 1 : step);

  // Helpers to step around the conditional LineStep.
  const goToPayment = () => setStep((hasMobile ? 4 : 3) as Step);
  const goBackFromPayment = () => setStep((hasMobile ? 3 : 2) as Step);
  const isPaymentStep = step === (hasMobile ? 4 : 3);
  const isResultStep = step === (hasMobile ? 5 : 4);

  const handlePay: PaymentSubmit = async (args) => {
    if (!customer) return;
    setPaying(true);
    const payload: any = {
      items: items.map((it) => ({
        id: it.plan.id,
        name: it.plan.name,
        qty: it.qty,
        unit_cents: it.plan.priceCents,
        category: it.plan.category,
      })),
      total_cents: totals.totalCents,
      customer,
      method: args.method,
      returnUrl: `${window.location.origin}/checkoutv2/sucesso/PENDING`,
    };
    payload.customer_birthdate = customer.birthDate;
    if (hasMobile && line) {
      payload.sim_kind = line.sim_kind;
      if (line.desired_msisdn_prefix) payload.desired_msisdn_prefix = line.desired_msisdn_prefix;
      if (line.portability_enabled && line.portability) {
        payload.portability = {
          enabled: true,
          current_msisdn: line.portability.current_msisdn,
          current_operator: line.portability.current_operator,
          current_doc: line.portability.current_doc,
          window_id: line.portability.window_id,
        };
      }
      if (line.sim_kind === "physical") {
        payload.shipping_address = line.shipping_same_as_billing ? customer.address : line.shipping_address;
      }
    }
    if (args.method === "credit") { payload.card = args.card; payload.installments = args.installments; }

    const r = await createCheckoutPayment(payload);
    setPaying(false);
    if (r.error) {
      toast.error("Não foi possível processar", { description: r.error });
      return;
    }
    setResult(r);
    if (r.card?.authenticationUrl) {
      window.location.href = r.card.authenticationUrl;
      return;
    }
    if (r.status === "paid") {
      clearPendingPayment();
      clear();
      navigate(`/checkoutv2/sucesso/${r.orderId}`);
      return;
    }
    // Persiste Pix/Boleto pendentes para sobreviver a refresh.
    if ((r.method === "pix" || r.method === "boleto") && r.orderId) {
      savePendingPayment({
        orderId: r.orderId,
        method: r.method,
        createdAt: Date.now(),
        expiresAt: r.method === "pix" ? r.pix?.expiresAt : r.boleto?.dueDate,
        hasMobile,
        pix: r.pix,
        boleto: r.boleto,
      });
    }
    setStep((hasMobile ? 5 : 4) as Step);
  };

  return (
    <>
      <SEOHead title="Checkout — Jotazo Telecom" description="Finalize seu pedido com pagamento online seguro." path="/checkoutv2" noindex />

      <div className="bg-muted/20 min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" /> Checkout seguro
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Pagamento online processado pela Cielo.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/meu-combo")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar ao carrinho
            </Button>
          </div>

          {isEmpty && !isResultStep ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
              <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="mt-3 text-lg font-semibold">Seu carrinho está vazio</h2>
              <Button className="mt-5" onClick={() => navigate("/")}>Ver planos</Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <section className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <CheckoutStepper current={stepperCurrent} steps={stepperList} />
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  {step === 1 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-lg font-bold">Revise seu pedido</h2>
                        <p className="text-sm text-muted-foreground mt-1">Confira os itens antes de continuar.</p>
                      </div>
                      <ul className="divide-y divide-border rounded-xl border border-border">
                        {items.map((it) => (
                          <li key={it.plan.id} className="flex items-center justify-between gap-3 p-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{it.plan.name}</div>
                              <div className="text-xs text-muted-foreground">{it.plan.category}</div>
                            </div>
                            <button onClick={() => remove(it.plan.id)} className="text-xs text-muted-foreground hover:text-destructive">Remover</button>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-end">
                        <Button onClick={() => setStep(2)}>Continuar</Button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-lg font-bold">Seus dados</h2>
                        <p className="text-sm text-muted-foreground mt-1">Vamos usá-los para o pagamento e para entrar em contato.</p>
                      </div>
                      <CustomerStep
                        defaultValues={customer || undefined}
                        onBack={() => setStep(1)}
                        onSubmit={(data) => {
                          setCustomer(data);
                          setStep((hasMobile ? 3 : 3) as Step);
                        }}
                      />
                    </div>
                  )}

                  {step === 3 && hasMobile && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-lg font-bold">Sua linha móvel</h2>
                        <p className="text-sm text-muted-foreground mt-1">Como você quer ativar sua linha?</p>
                      </div>
                      <LineStep
                        customer={customer}
                        defaultValues={line || undefined}
                        onBack={() => setStep(2)}
                        onSubmit={(data) => { setLine(data); goToPayment(); }}
                      />
                    </div>
                  )}

                  {isPaymentStep && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-lg font-bold">Pagamento</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {hasMobile
                            ? "Sua linha será ativada automaticamente assim que o pagamento for confirmado."
                            : "Escolha como deseja pagar."}
                        </p>
                      </div>
                      <PaymentStep
                        totalCents={totals.totalCents}
                        loading={paying}
                        customerDoc={customer?.doc}
                        onBack={goBackFromPayment}
                        onSubmit={handlePay}
                      />
                    </div>
                  )}

                  {isResultStep && result && (
                    <div className="space-y-5">
                      <div className="text-center">
                        <h2 className="text-lg font-bold">Quase lá!</h2>
                        <p className="text-sm text-muted-foreground mt-1">Finalize o pagamento abaixo.</p>
                      </div>
                      {result.method === "pix" && result.orderId && (
                        <PixPanel
                          orderId={result.orderId}
                          qrBase64={result.pix?.qrBase64}
                          qrString={result.pix?.qrString}
                          expiresAt={result.pix?.expiresAt}
                          onPaid={() => { clearPendingPayment(); clear(); navigate(`/checkoutv2/sucesso/${result.orderId}`); }}
                        />
                      )}
                      {result.method === "boleto" && result.orderId && (
                        <BoletoPanel
                          orderId={result.orderId}
                          url={result.boleto?.url}
                          digitableLine={result.boleto?.digitableLine}
                          dueDate={result.boleto?.dueDate}
                          onPaid={() => { clearPendingPayment(); clear(); navigate(`/checkoutv2/sucesso/${result.orderId}`); }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </section>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                <OrderSummaryPanel
                  items={summaryItems}
                  comboDiscountCents={0}
                  onRemove={remove}
                  onClear={clear}
                  onCheckout={() => setStep((s) => (s < (hasMobile ? 4 : 3) ? ((s + 1) as Step) : s))}
                />
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
