import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  KeyRound, Webhook, ShieldCheck, Settings2, FlaskConical, ScrollText,
  Loader2, CheckCircle2, XCircle, Copy, Eye, EyeOff, Save, AlertTriangle, Wallet,
} from "lucide-react";

type MpConfig = {
  id?: string;
  environment: "sandbox" | "production";
  access_token_sandbox: string | null;
  public_key_sandbox: string | null;
  access_token_production: string | null;
  public_key_production: string | null;
  webhook_secret: string | null;
  site_id: string;
  currency_id: string;
  default_statement_descriptor: string | null;
  default_capture: boolean;
  three_d_secure_mode: "optional" | "mandatory" | "not_supported";
  max_installments: number;
  binary_mode: boolean;
  pix_expiration_minutes: number;
  boleto_due_days: number;
  active: boolean;
};

type MpLog = {
  id: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  duration_ms: number | null;
  payment_id: string | null;
  external_reference: string | null;
  request_body: any;
  response_body: any;
  error: string | null;
  created_at: string;
};

function copyText(v: string, label = "Copiado!") {
  navigator.clipboard.writeText(v).then(() => toast.success(label)).catch(() => toast.error("Falha ao copiar"));
}

function getWebhookUrl(): string {
  const projectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/mercadopago-webhook`;
}

export function MercadoPagoTab() {
  const qc = useQueryClient();

  const { data: cfg, isLoading } = useQuery({
    queryKey: ["mp-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mp_config" as any).select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as MpConfig | null;
    },
  });

  const [form, setForm] = React.useState<Partial<MpConfig>>({});
  React.useEffect(() => { if (cfg) setForm(cfg); }, [cfg]);

  const [showSbToken, setShowSbToken] = React.useState(false);
  const [showPrToken, setShowPrToken] = React.useState(false);
  const [showSecret, setShowSecret] = React.useState(false);

  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<any>(null);

  const { data: logs = [] } = useQuery({
    queryKey: ["mp-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mp_logs" as any).select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data || []) as unknown as MpLog[];
    },
  });

  const { data: hooks = [] } = useQuery({
    queryKey: ["mp-webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mp_webhooks" as any).select("*").order("received_at", { ascending: false }).limit(10);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (patch: Partial<MpConfig>) => {
      const payload: any = {
        environment: patch.environment ?? "sandbox",
        access_token_sandbox: patch.access_token_sandbox ?? null,
        public_key_sandbox: patch.public_key_sandbox ?? null,
        access_token_production: patch.access_token_production ?? null,
        public_key_production: patch.public_key_production ?? null,
        webhook_secret: patch.webhook_secret ?? null,
        site_id: patch.site_id ?? "MLB",
        currency_id: patch.currency_id ?? "BRL",
        default_statement_descriptor: patch.default_statement_descriptor ?? null,
        default_capture: !!patch.default_capture,
        three_d_secure_mode: patch.three_d_secure_mode ?? "optional",
        max_installments: Number(patch.max_installments ?? 12),
        binary_mode: !!patch.binary_mode,
        pix_expiration_minutes: Number(patch.pix_expiration_minutes ?? 30),
        boleto_due_days: Number(patch.boleto_due_days ?? 3),
        active: !!patch.active,
      };
      if (cfg?.id) {
        const { error } = await supabase.from("mp_config" as any).update(payload).eq("id", cfg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mp_config" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mp-config"] }); toast.success("Configurações salvas"); },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("mp-test-connection", {
        body: { environment: form.environment },
      });
      if (error) throw error;
      setTestResult(data);
      qc.invalidateQueries({ queryKey: ["mp-logs"] });
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
    } finally {
      setTesting(false);
    }
  }

  const isProd = form.environment === "production";
  const webhookUrl = getWebhookUrl();

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Carregando configurações Mercado Pago...</div>;

  return (
    <div className="space-y-6">
      {/* Ambiente */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-primary" /> Ambiente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Modo de operação</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Sandbox para homologação, Produção para cobranças reais.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isProd ? "destructive" : "secondary"}>{isProd ? "PRODUÇÃO" : "SANDBOX"}</Badge>
              <Switch checked={isProd} onCheckedChange={(v) => setForm({ ...form, environment: v ? "production" : "sandbox" })} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Integração ativa</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Desligue para pausar sem perder configurações.</p>
            </div>
            <Switch checked={!!form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
          </div>
          {isProd && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Produção ativa — transações são reais e cobradas.</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">site_id</Label>
              <Select value={form.site_id ?? "MLB"} onValueChange={(v) => setForm({ ...form, site_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MLB">MLB — Brasil</SelectItem>
                  <SelectItem value="MLA">MLA — Argentina</SelectItem>
                  <SelectItem value="MLM">MLM — México</SelectItem>
                  <SelectItem value="MLC">MLC — Chile</SelectItem>
                  <SelectItem value="MCO">MCO — Colômbia</SelectItem>
                  <SelectItem value="MPE">MPE — Peru</SelectItem>
                  <SelectItem value="MLU">MLU — Uruguai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">currency_id</Label>
              <Input value={form.currency_id ?? "BRL"} onChange={(e) => setForm({ ...form, currency_id: e.target.value.toUpperCase() })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credenciais */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" /> Credenciais
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Pegue em <a className="underline" href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noreferrer">Painel de desenvolvedores → Sua aplicação → Credenciais</a>.
            <strong> Access Token</strong> é secreto (server-side). <strong>Public Key</strong> vai para o frontend (Bricks).
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sandbox */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Sandbox (Test)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Access Token (TEST-...)</Label>
                <div className="relative">
                  <Input
                    type={showSbToken ? "text" : "password"}
                    value={form.access_token_sandbox ?? ""}
                    onChange={(e) => setForm({ ...form, access_token_sandbox: e.target.value })}
                    placeholder="TEST-1234...-1234"
                    className="pr-10 font-mono text-xs"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowSbToken((v) => !v)}>
                    {showSbToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Public Key (TEST-...)</Label>
                <Input
                  value={form.public_key_sandbox ?? ""}
                  onChange={(e) => setForm({ ...form, public_key_sandbox: e.target.value })}
                  placeholder="TEST-abc...-xyz"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>
          {/* Produção */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Produção</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Access Token (APP_USR-...)</Label>
                <div className="relative">
                  <Input
                    type={showPrToken ? "text" : "password"}
                    value={form.access_token_production ?? ""}
                    onChange={(e) => setForm({ ...form, access_token_production: e.target.value })}
                    placeholder="APP_USR-1234...-1234"
                    className="pr-10 font-mono text-xs"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPrToken((v) => !v)}>
                    {showPrToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Public Key (APP_USR-...)</Label>
                <Input
                  value={form.public_key_production ?? ""}
                  onChange={(e) => setForm({ ...form, public_key_production: e.target.value })}
                  placeholder="APP_USR-abc...-xyz"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comportamento */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> Comportamento padrão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Statement Descriptor (fatura — até 22 caracteres)</Label>
            <Input maxLength={22}
              value={form.default_statement_descriptor ?? ""}
              onChange={(e) => setForm({ ...form, default_statement_descriptor: e.target.value })}
              placeholder="JOTAZO TELECOM"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Parcelas máx.</Label>
              <Input type="number" min={1} max={24}
                value={form.max_installments ?? 12}
                onChange={(e) => setForm({ ...form, max_installments: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Pix — expira em (min)</Label>
              <Input type="number" min={5} max={1440}
                value={form.pix_expiration_minutes ?? 30}
                onChange={(e) => setForm({ ...form, pix_expiration_minutes: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Boleto — vence em (dias)</Label>
              <Input type="number" min={1} max={30}
                value={form.boleto_due_days ?? 3}
                onChange={(e) => setForm({ ...form, boleto_due_days: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">3DS (cartão)</Label>
              <Select value={form.three_d_secure_mode ?? "optional"} onValueChange={(v) => setForm({ ...form, three_d_secure_mode: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="optional">Optional</SelectItem>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="not_supported">Not supported</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Auto-captura</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Captura no momento da autorização.</p>
              </div>
              <Switch checked={!!form.default_capture}
                onCheckedChange={(v) => setForm({ ...form, default_capture: v })} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Binary mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Apenas approved/rejected (sem in_process/pending).</p>
            </div>
            <Switch checked={!!form.binary_mode}
              onCheckedChange={(v) => setForm({ ...form, binary_mode: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4 text-primary" /> Webhook (Notificações)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Configure esta URL em <a className="underline" href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noreferrer">Painel → App → Webhooks</a> para os eventos
            <code className="mx-1">payment</code> e copie a <strong>chave secreta</strong> do painel.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">URL do webhook</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => copyText(webhookUrl)}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Secret HMAC (x-signature)</Label>
            <div className="relative">
              <Input type={showSecret ? "text" : "password"}
                value={form.webhook_secret ?? ""}
                onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
                placeholder="cole aqui a secret do painel MP"
                className="pr-10 font-mono text-xs"
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowSecret((v) => !v)}>
                {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Sem secret, todo webhook é aceito sem validação HMAC. Configure assim que possível.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Salvar + testar conexão */}
      <div className="flex flex-wrap items-center gap-3 sticky bottom-0 bg-background/90 backdrop-blur py-3 border-t">
        <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar configurações
        </Button>
        <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FlaskConical className="h-4 w-4 mr-2" />}
          Testar conexão ({form.environment === "production" ? "prod" : "sandbox"})
        </Button>
        {testResult && (
          <Badge variant={testResult.ok ? "default" : "destructive"} className="gap-1">
            {testResult.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {testResult.message || (testResult.ok ? "OK" : "Falha")}
          </Badge>
        )}
      </div>

      {/* Painel de testes */}
      <TestPanel environment={form.environment ?? "sandbox"} />

      {/* Logs + Webhooks */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-4 w-4 text-primary" /> Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs">
            <TabsList>
              <TabsTrigger value="logs">API Logs ({logs.length})</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks recebidos ({hooks.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="logs" className="mt-3 space-y-2 max-h-[500px] overflow-auto">
              {logs.length === 0 && <p className="text-xs text-muted-foreground py-4">Sem chamadas ainda.</p>}
              {logs.map((l) => (
                <details key={l.id} className="rounded border p-2 text-xs">
                  <summary className="cursor-pointer flex items-center gap-2 flex-wrap">
                    <Badge variant={l.status_code && l.status_code < 300 ? "default" : "destructive"}>{l.status_code ?? "—"}</Badge>
                    <code>{l.method} {l.endpoint}</code>
                    {l.duration_ms != null && <span className="text-muted-foreground">{l.duration_ms}ms</span>}
                    {l.payment_id && <span className="text-muted-foreground">pid:{l.payment_id}</span>}
                    <span className="ml-auto text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                  </summary>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase">Request</Label>
                      <pre className="bg-muted/50 p-2 rounded text-[11px] overflow-auto max-h-60">{JSON.stringify(l.request_body, null, 2)}</pre>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase">Response</Label>
                      <pre className="bg-muted/50 p-2 rounded text-[11px] overflow-auto max-h-60">{JSON.stringify(l.response_body, null, 2)}</pre>
                    </div>
                  </div>
                </details>
              ))}
            </TabsContent>
            <TabsContent value="webhooks" className="mt-3 space-y-2 max-h-[500px] overflow-auto">
              {hooks.length === 0 && <p className="text-xs text-muted-foreground py-4">Nenhum webhook recebido ainda.</p>}
              {hooks.map((h: any) => (
                <details key={h.id} className="rounded border p-2 text-xs">
                  <summary className="cursor-pointer flex items-center gap-2 flex-wrap">
                    <Badge variant={h.signature_valid ? "default" : "destructive"}>{h.signature_valid ? "sig ok" : "sig?"}</Badge>
                    <code>{h.topic}/{h.action}</code>
                    <span>id:{h.data_id}</span>
                    {h.live_mode === false && <Badge variant="secondary">test</Badge>}
                    <span className="ml-auto text-muted-foreground">{new Date(h.received_at).toLocaleString("pt-BR")}</span>
                  </summary>
                  <pre className="mt-2 bg-muted/50 p-2 rounded text-[11px] overflow-auto max-h-60">{JSON.stringify(h.raw_body, null, 2)}</pre>
                </details>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Painel de testes — endpoints + payloads
// ============================================================
function TestPanel({ environment }: { environment: "sandbox" | "production" }) {
  const qc = useQueryClient();
  const [kind, setKind] = React.useState<"pix" | "boleto" | "preference" | "get_payment" | "refund">("pix");
  const [amount, setAmount] = React.useState("1.00");
  const [payerEmail, setPayerEmail] = React.useState("test_user_123@testuser.com");
  const [payerDoc, setPayerDoc] = React.useState("12345678909");
  const [paymentId, setPaymentId] = React.useState("");
  const [refundAmount, setRefundAmount] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  async function runTest() {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("mp-test-payment", {
        body: {
          kind, environment,
          amount: Number(amount),
          payer_email: payerEmail,
          payer_doc: payerDoc,
          payment_id: paymentId || undefined,
          ...(kind === "refund" && refundAmount ? { amount: Number(refundAmount) } : {}),
        },
      });
      if (error) throw error;
      setResult(data);
      qc.invalidateQueries({ queryKey: ["mp-logs"] });
    } catch (e: any) {
      setResult({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  }

  const kindDescriptions: Record<string, string> = {
    pix: "POST /v1/payments com payment_method_id=pix — retorna qr_code, qr_code_base64 e ticket_url",
    boleto: "POST /v1/payments com payment_method_id=bolbradesco — retorna PDF do boleto e linha digitável",
    preference: "POST /checkout/preferences — Checkout Pro, retorna init_point para redirect",
    get_payment: "GET /v1/payments/{id} — consulta status autoritativo",
    refund: "POST /v1/payments/{id}/refunds — reembolso total (sem amount) ou parcial",
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-primary" /> Painel de testes ({environment})
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Dispara chamadas reais para a API do Mercado Pago usando as credenciais salvas.
          Em sandbox, Pix/Boleto criados ficam pendentes; use cartões de teste para forçar aprovação.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Endpoint de teste</Label>
            <Select value={kind} onValueChange={(v: any) => setKind(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix — /v1/payments</SelectItem>
                <SelectItem value="boleto">Boleto — /v1/payments</SelectItem>
                <SelectItem value="preference">Checkout Pro — /checkout/preferences</SelectItem>
                <SelectItem value="get_payment">Consultar — /v1/payments/{`{id}`}</SelectItem>
                <SelectItem value="refund">Refund — /v1/payments/{`{id}`}/refunds</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">{kindDescriptions[kind]}</p>
          </div>
          {(kind === "pix" || kind === "boleto" || kind === "preference") && (
            <div>
              <Label className="text-xs">Valor (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          )}
          {(kind === "pix" || kind === "boleto" || kind === "preference") && (
            <>
              <div>
                <Label className="text-xs">E-mail do pagador</Label>
                <Input value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">CPF/CNPJ do pagador</Label>
                <Input value={payerDoc} onChange={(e) => setPayerDoc(e.target.value)} />
              </div>
            </>
          )}
          {(kind === "get_payment" || kind === "refund") && (
            <div className="sm:col-span-2">
              <Label className="text-xs">Payment ID</Label>
              <Input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="ex: 1234567890" />
            </div>
          )}
          {kind === "refund" && (
            <div>
              <Label className="text-xs">Valor a reembolsar (vazio = total)</Label>
              <Input type="number" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </div>
          )}
        </div>

        <Button onClick={runTest} disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
          Executar teste
        </Button>

        {result && (
          <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={result.ok ? "default" : "destructive"}>{result.ok ? "OK" : "Falha"}</Badge>
              {result.status_code && <Badge variant="outline">HTTP {result.status_code}</Badge>}
              {result.duration_ms != null && <Badge variant="outline">{result.duration_ms}ms</Badge>}
              {result.response_body?.id && (
                <Badge variant="outline">id: {result.response_body.id}</Badge>
              )}
              {result.response_body?.status && (
                <Badge variant="outline">status: {result.response_body.status}</Badge>
              )}
              {result.idempotency_key && (
                <code className="text-[10px] text-muted-foreground">idem: {result.idempotency_key}</code>
              )}
            </div>

            {result.response_body?.point_of_interaction?.transaction_data?.qr_code_base64 && (
              <div className="flex gap-3 items-start">
                <img
                  src={`data:image/png;base64,${result.response_body.point_of_interaction.transaction_data.qr_code_base64}`}
                  alt="QR Pix" className="w-32 h-32 border rounded" />
                <div className="flex-1 min-w-0">
                  <Label className="text-[10px] uppercase">Copia-e-cola</Label>
                  <Textarea readOnly className="text-[10px] font-mono h-24"
                    value={result.response_body.point_of_interaction.transaction_data.qr_code} />
                  <Button size="sm" variant="outline" className="mt-1"
                    onClick={() => copyText(result.response_body.point_of_interaction.transaction_data.qr_code)}>
                    <Copy className="h-3 w-3 mr-1" /> Copiar
                  </Button>
                </div>
              </div>
            )}
            {result.response_body?.transaction_details?.external_resource_url && (
              <a className="text-primary underline text-xs"
                href={result.response_body.transaction_details.external_resource_url} target="_blank" rel="noreferrer">
                Abrir boleto (PDF) →
              </a>
            )}
            {result.response_body?.init_point && (
              <a className="text-primary underline text-xs"
                href={result.response_body.init_point} target="_blank" rel="noreferrer">
                Abrir Checkout Pro → init_point
              </a>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] uppercase">Request body</Label>
                <pre className="bg-background p-2 rounded text-[11px] overflow-auto max-h-60 border">{JSON.stringify(result.request_body, null, 2)}</pre>
              </div>
              <div>
                <Label className="text-[10px] uppercase">Response body</Label>
                <pre className="bg-background p-2 rounded text-[11px] overflow-auto max-h-60 border">{JSON.stringify(result.response_body, null, 2)}</pre>
              </div>
            </div>
            {result.curl && (
              <div>
                <Label className="text-[10px] uppercase">cURL equivalente</Label>
                <pre className="bg-background p-2 rounded text-[11px] overflow-auto max-h-40 border">{result.curl}</pre>
                <Button size="sm" variant="outline" className="mt-1" onClick={() => copyText(result.curl)}>
                  <Copy className="h-3 w-3 mr-1" /> Copiar cURL
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
