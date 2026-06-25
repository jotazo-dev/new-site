import { useEffect, useState } from "react";
import { CreditCard as CardIcon, QrCode, ShieldAlert, CheckCircle2, Zap, Clock, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCardForm } from "./CreditCardForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatBRL } from "@/data/plans";
import { isValidCpfOrCnpj, onlyDigits } from "@/lib/brMasks";

export type PaymentSubmit = (
  args:
    | { method: "credit"; card: any; installments: number }
    | { method: "pix" }
) => Promise<void> | void;

export function PaymentStep({
  totalCents,
  loading,
  customerDoc,
  onSubmit,
  onBack,
}: {
  totalCents: number;
  loading?: boolean;
  customerDoc?: string;
  onSubmit: PaymentSubmit;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"credit" | "pix">("credit");

  const docDigits = onlyDigits(customerDoc || "");
  const docValid = isValidCpfOrCnpj(customerDoc || "");
  const cardEnabled = docValid && docDigits.length === 11;

  // Se a aba ativa for cartão e o CPF for inválido, mover para Pix automaticamente.
  useEffect(() => {
    if (!cardEnabled && tab === "credit") setTab("pix");
  }, [cardEnabled, tab]);

  return (
    <div className="space-y-5">
      {!cardEnabled && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-900">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Pagamento com cartão indisponível</p>
            <p className="mt-0.5">
              Para liberar o cartão de crédito é necessário informar um CPF válido na etapa “Seus dados”. Você ainda pode pagar com Pix.
            </p>
          </div>
        </div>
      )}
      {cardEnabled && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> CPF do titular validado — pagamento com cartão liberado.
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="credit" disabled={!cardEnabled} title={!cardEnabled ? "Informe um CPF válido para liberar" : undefined}>
            <CardIcon className="mr-1.5 h-4 w-4" /> Crédito
          </TabsTrigger>
          <TabsTrigger value="pix"><QrCode className="mr-1.5 h-4 w-4" /> Pix</TabsTrigger>
        </TabsList>

        <TabsContent value="credit" className="mt-5">
          <CreditCardForm
            totalCents={totalCents}
            loading={loading}
            onSubmit={(card, installments) => onSubmit({ method: "credit", card, installments })}
          />
        </TabsContent>

        <TabsContent value="pix" className="mt-5">
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-background dark:to-emerald-950/20 dark:border-emerald-900">
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-tight">Pagar com Pix</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Confirmação instantânea, sem taxas.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 leading-tight">{formatBRL(totalCents)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Benefit icon={<Zap className="h-4 w-4" />} title="Aprovação na hora" desc="Liberação em segundos após o pagamento." />
                <Benefit icon={<Clock className="h-4 w-4" />} title="24h por dia" desc="Pague a qualquer hora, inclusive fins de semana." />
                <Benefit icon={<ShieldCheck className="h-4 w-4" />} title="100% seguro" desc="Transação garantida pelo Banco Central." />
              </div>

              <ol className="mt-5 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><Step n={1} /> Clique em <strong className="text-foreground">Gerar Pix</strong> para criar o QR Code.</li>
                <li className="flex items-start gap-2"><Step n={2} /> Abra o app do seu banco e escolha pagar via Pix.</li>
                <li className="flex items-start gap-2"><Step n={3} /> Aponte a câmera para o QR Code ou cole o código copia-e-cola.</li>
              </ol>

              <Button size="lg" className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading} onClick={() => onSubmit({ method: "pix" })}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><QrCode className="mr-2 h-4 w-4" /> Gerar Pix de {formatBRL(totalCents)}</>}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Pagamento processado em ambiente seguro. Nenhum dado bancário é armazenado.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Voltar</Button>
      </div>
    </div>
  );
}

function Benefit({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-emerald-200/60 bg-white/70 p-3 dark:bg-background/40 dark:border-emerald-900/60">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
        {icon}
        <span className="text-xs font-semibold">{title}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{desc}</p>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
      {n}
    </span>
  );
}
