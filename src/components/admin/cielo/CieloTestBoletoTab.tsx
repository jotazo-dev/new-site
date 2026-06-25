import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Barcode } from "lucide-react";
import { toast } from "sonner";
import { testCieloPayment } from "@/lib/cielo";
import type { CieloPaymentTestResult } from "@/types/cielo";
import { CieloTestResultView } from "./CieloTestResult";

export function CieloTestBoletoTab({ isProd }: { isProd: boolean }) {
  const [amount, setAmount] = React.useState("10,00");
  const [dueDays, setDueDays] = React.useState("3");
  const [name, setName] = React.useState("Cliente Teste");
  const [cpf, setCpf] = React.useState("12345678909");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CieloPaymentTestResult | null>(null);

  const amountCents = Math.round(Number(amount.replace(",", ".")) * 100) || 0;

  async function submit() {
    if (isProd && !confirm("Ambiente de PRODUÇÃO. Continuar?")) return;
    setLoading(true); setResult(null);
    try {
      const r = await testCieloPayment({
        method: "boleto", amount: amountCents,
        customer: { name, identity: cpf },
        boletoDueDays: Number(dueDays),
      });
      setResult(r);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      {!isProd && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-400">
          <strong>Sandbox.</strong> Provider forçado para <code>Simulado</code>. Boleto fictício, não vai para banco real.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Valor (R$)</Label><Input value={amount} onChange={e => setAmount(e.target.value)} /></div>
        <div><Label className="text-xs">Vencimento (dias)</Label><Input value={dueDays} onChange={e => setDueDays(e.target.value)} type="number" min={1} /></div>
        <div><Label className="text-xs">Nome</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
        <div><Label className="text-xs">CPF</Label><Input value={cpf} onChange={e => setCpf(e.target.value)} /></div>
      </div>
      <Button onClick={submit} disabled={loading} className="gap-2 w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Barcode className="h-4 w-4" />}
        Gerar boleto
      </Button>
      {result && <CieloTestResultView result={result} />}
    </div>
  );
}
