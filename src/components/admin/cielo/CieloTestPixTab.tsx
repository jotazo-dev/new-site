import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { testCieloPayment, queryCieloPayment } from "@/lib/cielo";
import type { CieloConfig, CieloPaymentTestResult } from "@/types/cielo";
import { CieloTestResultView } from "./CieloTestResult";

const PIX_PROVIDERS = ["Cielo2", "Cielo30", "BBPix", "Bradesco"] as const;

export function CieloTestPixTab({ isProd }: { isProd: boolean }) {
  const [amount, setAmount] = React.useState("0,01");
  const [name, setName] = React.useState("Cliente Teste");
  const [cpf, setCpf] = React.useState("12345678909");
  const [providerOverride, setProviderOverride] = React.useState<string>("auto");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CieloPaymentTestResult | null>(null);
  const [polling, setPolling] = React.useState(false);
  const pollRef = React.useRef<{ stop: boolean }>({ stop: false });

  const { data: cfg } = useQuery({
    queryKey: ["cielo-config"],
    queryFn: async () => {
      const { data } = await supabase.from("cielo_config" as any).select("*").limit(1).maybeSingle();
      return data as unknown as CieloConfig | null;
    },
  });

  const defaultProvider = isProd
    ? (cfg?.provider_pix_production || cfg?.provider_pix || "Cielo2")
    : (cfg?.provider_pix_sandbox || "Cielo2");
  const effectiveProvider = providerOverride === "auto" ? defaultProvider : providerOverride;

  const amountCents = Math.round(Number(amount.replace(",", ".")) * 100) || 0;

  async function submit() {
    if (isProd && !confirm(`Ambiente de PRODUÇÃO. Pix ${effectiveProvider} gera cobrança real. Continuar?`)) return;
    setLoading(true); setResult(null);
    try {
      const r = await testCieloPayment({
        method: "pix",
        amount: amountCents,
        customer: { name, identity: cpf },
        provider: providerOverride === "auto" ? undefined : providerOverride,
      });
      setResult(r);
      if (r.ok && r.paymentId) startPolling(r.paymentId, r);
      else if (!r.ok) toast.error(r.message || r.returnMessage || "Falha ao gerar Pix");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  function startPolling(paymentId: string, base: CieloPaymentTestResult) {
    pollRef.current.stop = false;
    setPolling(true);
    let count = 0;
    const maxTicks = isProd ? 24 : 6;
    const tick = async () => {
      if (pollRef.current.stop || count >= maxTicks) {
        setPolling(false);
        if (!isProd && count >= maxTicks) toast.info("Sandbox não confirma pagamento Pix — status permanece 12 (Pending).");
        return;
      }
      count++;
      try {
        const r = await queryCieloPayment(paymentId);
        const status = r.body?.Payment?.Status;
        setResult({ ...base, status, raw: r.body });
        if (status === 2) { toast.success("Pix pago!"); setPolling(false); return; }
      } catch { /* noop */ }
      setTimeout(tick, 5000);
    };
    setTimeout(tick, 5000);
  }

  React.useEffect(() => () => { pollRef.current.stop = true; }, []);

  return (
    <div className="space-y-4">
      {!isProd ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
          <p><strong>Pix Cielo2 não tem sandbox.</strong> Conforme <a href="https://docs.cielo.com.br/gateway/docs/pix-cielo" target="_blank" rel="noreferrer" className="underline">docs oficiais</a>, a nova integração Pix (Cielo2) só funciona em produção.</p>
          <p>Para validar Pix de verdade: ative o ambiente <strong>Produção</strong> e teste com R$ 0,01. Como alternativa em sandbox, sobrescreva para um provider legado (Cielo30/BBPix) — só funciona se sua conta tiver essa afiliação Pix ativa.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          <strong>Produção:</strong> Pix gera cobrança real. Provider padrão: <code>{defaultProvider}</code>. Use R$ 0,01 para testes.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Valor (R$)</Label><Input value={amount} onChange={e => setAmount(e.target.value)} /></div>
        <div><Label className="text-xs">Nome</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="col-span-2"><Label className="text-xs">CPF</Label><Input value={cpf} onChange={e => setCpf(e.target.value)} /></div>
        <div className="col-span-2">
          <Label className="text-xs">Provider Pix (sobrescrever)</Label>
          <Select value={providerOverride} onValueChange={setProviderOverride}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automático ({defaultProvider})</SelectItem>
              {PIX_PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground mt-1">
            Use o override para testar manualmente outro provider se o suporte Cielo indicar um diferente.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 p-2 text-[11px] text-muted-foreground">
        <strong>Será enviado:</strong> POST {isProd ? "https://api.braspag.com.br" : "https://apisandbox.braspag.com.br"}/v2/sales · Payment.Type=Pix · Provider={effectiveProvider} · Amount={amountCents}
      </div>

      <Button onClick={submit} disabled={loading} className="gap-2 w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
        Gerar QR Code Pix
      </Button>

      {polling && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" /> Aguardando pagamento... (polling a cada 5s)
        </p>
      )}
      {result && <CieloTestResultView result={result} />}
    </div>
  );
}
