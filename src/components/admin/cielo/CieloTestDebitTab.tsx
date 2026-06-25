import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { testCieloPayment, queryCieloPayment, luhnCheck } from "@/lib/cielo";
import type { CieloPaymentTestResult } from "@/types/cielo";
import { CieloTestResultView } from "./CieloTestResult";

export function CieloTestDebitTab({ isProd }: { isProd: boolean }) {
  const [amount, setAmount] = React.useState("10,00");
  const [number, setNumber] = React.useState("4024007197692931");
  const [holder, setHolder] = React.useState("Teste Cielo");
  const [exp, setExp] = React.useState("12/2030");
  const [cvv, setCvv] = React.useState("123");
  const [brand, setBrand] = React.useState("Visa");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CieloPaymentTestResult | null>(null);

  const amountCents = Math.round(Number(amount.replace(",", ".")) * 100) || 0;

  async function submit() {
    if (!luhnCheck(number)) return toast.error("Número de cartão inválido");
    if (isProd && !confirm("Ambiente de PRODUÇÃO. Continuar?")) return;
    setLoading(true); setResult(null);
    try {
      const r = await testCieloPayment({
        method: "debit", amount: amountCents,
        card: { number, holder, expiration: exp, cvv, brand },
      });
      setResult(r);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  async function refresh() {
    if (!result?.paymentId) return;
    try {
      const r = await queryCieloPayment(result.paymentId);
      toast.success(`Status atual: ${r.body?.Payment?.Status ?? "?"}`);
      setResult({ ...result, status: r.body?.Payment?.Status, raw: r.body });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      {!isProd && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-400">
          <strong>Sandbox.</strong> Provider <code>Simulado</code> sem 3DS real. Em produção, Cielo aplica 3DS 2.2 obrigatoriamente e retorna <code>AuthenticationUrl</code>.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Valor (R$)</Label><Input value={amount} onChange={e => setAmount(e.target.value)} /></div>
        <div>
          <Label className="text-xs">Bandeira</Label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Visa","Master","Elo"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label className="text-xs">Número do cartão</Label><Input value={number} onChange={e => setNumber(e.target.value)} className="font-mono" /></div>
        <div><Label className="text-xs">Titular</Label><Input value={holder} onChange={e => setHolder(e.target.value)} /></div>
        <div><Label className="text-xs">Validade</Label><Input value={exp} onChange={e => setExp(e.target.value)} /></div>
        <div><Label className="text-xs">CVV</Label><Input value={cvv} onChange={e => setCvv(e.target.value)} maxLength={4} /></div>
      </div>
      <Button onClick={submit} disabled={loading} className="gap-2 w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Iniciar débito com 3DS
      </Button>
      {result && (
        <CieloTestResultView
          result={result}
          extra={result.paymentId && (
            <Button size="sm" variant="outline" onClick={refresh} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Consultar status
            </Button>
          )}
        />
      )}
    </div>
  );
}
