import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CreditCard, CheckCheck, Ban } from "lucide-react";
import { toast } from "sonner";
import { testCieloPayment, captureCieloPayment, voidCieloPayment, luhnCheck } from "@/lib/cielo";
import type { CieloPaymentTestResult } from "@/types/cielo";
import { CieloTestResultView } from "./CieloTestResult";

export function CieloTestCreditTab({ isProd }: { isProd: boolean }) {
  const [amount, setAmount] = React.useState("10,00");
  const [number, setNumber] = React.useState("4024007197692931");
  const [holder, setHolder] = React.useState("Teste Cielo");
  const [exp, setExp] = React.useState("12/2030");
  const [cvv, setCvv] = React.useState("123");
  const [brand, setBrand] = React.useState("Visa");
  const [installments, setInstallments] = React.useState("1");
  const [capture, setCapture] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [actLoading, setActLoading] = React.useState(false);
  const [result, setResult] = React.useState<CieloPaymentTestResult | null>(null);

  const amountCents = Math.round(Number(amount.replace(",", ".")) * 100) || 0;

  async function submit() {
    if (!luhnCheck(number)) return toast.error("Número de cartão inválido");
    if (isProd && !confirm("Ambiente de PRODUÇÃO. Vai gerar transação real. Continuar?")) return;
    setLoading(true); setResult(null);
    try {
      const r = await testCieloPayment({
        method: "credit",
        amount: amountCents,
        card: { number, holder, expiration: exp, cvv, brand, installments: Number(installments) },
        capture,
      });
      setResult(r);
      if (r.ok) toast.success("Transação enviada"); else toast.error(r.message || r.returnMessage || "Falhou");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  async function doCapture() {
    if (!result?.paymentId) return;
    setActLoading(true);
    try {
      const r = await captureCieloPayment(result.paymentId);
      toast.success(`Captura: HTTP ${r.status}`);
    } catch (e: any) { toast.error(e.message); } finally { setActLoading(false); }
  }
  async function doVoid() {
    if (!result?.paymentId) return;
    setActLoading(true);
    try {
      const r = await voidCieloPayment(result.paymentId);
      toast.success(`Cancelamento: HTTP ${r.status}`);
    } catch (e: any) { toast.error(e.message); } finally { setActLoading(false); }
  }

  return (
    <div className="space-y-4">
      {!isProd && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-400">
          <strong>Sandbox.</strong> Provider forçado para <code>Simulado</code> (oficial Cielo p/ testes). Use o cartão de teste padrão para autorizar; troque a validade para uma data passada para simular recusa.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Valor (R$)</Label><Input value={amount} onChange={e => setAmount(e.target.value)} /></div>
        <div>
          <Label className="text-xs">Parcelas</Label>
          <Select value={installments} onValueChange={setInstallments}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map(n => <SelectItem key={n} value={String(n)}>{n}x</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label className="text-xs">Número do cartão</Label><Input value={number} onChange={e => setNumber(e.target.value)} className="font-mono" /></div>
        <div><Label className="text-xs">Titular</Label><Input value={holder} onChange={e => setHolder(e.target.value)} /></div>
        <div>
          <Label className="text-xs">Bandeira</Label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Visa","Master","Amex","Elo","Hipercard","Diners","JCB"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Validade (MM/AAAA)</Label><Input value={exp} onChange={e => setExp(e.target.value)} /></div>
        <div><Label className="text-xs">CVV</Label><Input value={cvv} onChange={e => setCvv(e.target.value)} maxLength={4} /></div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label className="text-sm">Auto-captura</Label>
          <p className="text-xs text-muted-foreground">Se desligado, autoriza só e libera botão capturar.</p>
        </div>
        <Switch checked={capture} onCheckedChange={setCapture} />
      </div>

      <Button onClick={submit} disabled={loading} className="gap-2 w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Cobrar R$ {amount}
      </Button>

      {result && (
        <CieloTestResultView
          result={result}
          extra={result.paymentId && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={doCapture} disabled={actLoading} className="gap-1">
                <CheckCheck className="h-3.5 w-3.5" /> Capturar
              </Button>
              <Button size="sm" variant="outline" onClick={doVoid} disabled={actLoading} className="gap-1">
                <Ban className="h-3.5 w-3.5" /> Cancelar
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}
