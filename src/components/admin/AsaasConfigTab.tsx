import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  KeyRound, PlugZap, Webhook, ShieldCheck, Settings2, FlaskConical, ScrollText,
  Loader2, CheckCircle2, XCircle, Copy, Eye, EyeOff, RefreshCw, Save, Send, Play,
  Wallet, User, QrCode, FileText, CreditCard, Repeat, ArrowUpRight, Search,
} from "lucide-react";
import { asaasCall, asaasTestConnection, asaasWebhookUrl } from "@/lib/asaas";
import type { AsaasConfig, AsaasLog, AsaasWebhookEvent, AsaasEnvironment, AsaasBillingType } from "@/types/asaas";

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function copyText(v: string, label = "Copiado!") {
  navigator.clipboard.writeText(v).then(() => toast.success(label)).catch(() => toast.error("Falha ao copiar"));
}

function formatJson(v: any): string {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + (days || 0));
  return d.toISOString().slice(0, 10);
}

export function AsaasConfigTab() {
  const qc = useQueryClient();
  const { data: cfg, isLoading } = useQuery({
    queryKey: ["asaas-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("asaas_config" as any).select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as AsaasConfig | null;
    },
  });

  const [form, setForm] = React.useState<Partial<AsaasConfig>>({});
  React.useEffect(() => { if (cfg) setForm(cfg); }, [cfg]);

  const [showSandboxKey, setShowSandboxKey] = React.useState(false);
  const [showProdKey, setShowProdKey] = React.useState(false);

  const saveMut = useMutation({
    mutationFn: async (patch: Partial<AsaasConfig>) => {
      if (!cfg?.id) throw new Error("Config não inicializada");
      const { error } = await supabase
        .from("asaas_config" as any)
        .update(patch as any)
        .eq("id", cfg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asaas-config"] });
      toast.success("Salvo!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Carregando…</div>;
  if (!cfg) return <div className="py-10 text-center text-muted-foreground">Erro ao carregar configuração.</div>;

  const env = (form.environment ?? cfg.environment) as AsaasEnvironment;

  return (
    <div className="space-y-6">
      {/* ENVIRONMENT */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            Ambiente ativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={env === "production" ? "destructive" : "secondary"} className="text-xs px-3 py-1">
              {env === "production" ? "PRODUÇÃO" : "SANDBOX"}
            </Badge>
            <Select value={env} onValueChange={(v) => setForm((f) => ({ ...f, environment: v as AsaasEnvironment }))}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (homologação)</SelectItem>
                <SelectItem value="production">Produção (cobranças reais)</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => saveMut.mutate({ environment: form.environment })} disabled={saveMut.isPending || form.environment === cfg.environment}>
              <Save className="h-3.5 w-3.5 mr-1" /> Salvar ambiente
            </Button>
          </div>
          {env === "production" && (
            <p className="text-xs text-destructive">
              ⚠️ Atenção: ambiente de PRODUÇÃO ativo. Todas as cobranças, transferências e webhooks afetam dinheiro real.
            </p>
          )}
        </CardContent>
      </Card>

      {/* CREDENCIAIS */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-white" />
            </div>
            Credenciais
          </CardTitle>
          <p className="text-sm text-muted-foreground">As chaves nunca são expostas ao frontend — ficam apenas no banco e no proxy.</p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <CredentialColumn
            title="Sandbox"
            badgeClass="bg-amber-500/10 text-amber-700"
            apiKeyValue={form.sandbox_api_key ?? ""}
            onApiKeyChange={(v) => setForm((f) => ({ ...f, sandbox_api_key: v }))}
            showKey={showSandboxKey}
            setShowKey={setShowSandboxKey}
            webhookToken={form.sandbox_webhook_token ?? ""}
            onWebhookTokenChange={(v) => setForm((f) => ({ ...f, sandbox_webhook_token: v }))}
            apiKeyPlaceholder="$aact_hmlg_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            onSave={() => saveMut.mutate({
              sandbox_api_key: form.sandbox_api_key,
              sandbox_webhook_token: form.sandbox_webhook_token,
            })}
            saving={saveMut.isPending}
            environment="sandbox"
          />
          <CredentialColumn
            title="Produção"
            badgeClass="bg-destructive/10 text-destructive"
            apiKeyValue={form.production_api_key ?? ""}
            onApiKeyChange={(v) => setForm((f) => ({ ...f, production_api_key: v }))}
            showKey={showProdKey}
            setShowKey={setShowProdKey}
            webhookToken={form.production_webhook_token ?? ""}
            onWebhookTokenChange={(v) => setForm((f) => ({ ...f, production_webhook_token: v }))}
            apiKeyPlaceholder="$aact_prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            onSave={() => saveMut.mutate({
              production_api_key: form.production_api_key,
              production_webhook_token: form.production_webhook_token,
            })}
            saving={saveMut.isPending}
            environment="production"
          />
        </CardContent>
      </Card>

      {/* WEBHOOK */}
      <WebhookCard cfg={cfg} env={env} />

      {/* DEFAULTS */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <Settings2 className="h-4 w-4 text-white" />
            </div>
            Configurações padrão
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tipo de cobrança padrão</Label>
            <Select
              value={form.default_billing_type ?? cfg.default_billing_type}
              onValueChange={(v) => setForm((f) => ({ ...f, default_billing_type: v as AsaasBillingType }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UNDEFINED">Indefinido (cliente escolhe)</SelectItem>
                <SelectItem value="PIX">Pix</SelectItem>
                <SelectItem value="BOLETO">Boleto</SelectItem>
                <SelectItem value="CREDIT_CARD">Cartão de crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dias até vencimento</Label>
            <Input
              type="number"
              min={0}
              max={365}
              value={form.default_due_days ?? cfg.default_due_days}
              onChange={(e) => setForm((f) => ({ ...f, default_due_days: parseInt(e.target.value || "0", 10) }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Desabilitar notificações do Asaas</div>
              <div className="text-xs text-muted-foreground">Evita que o Asaas envie email/SMS ao cliente.</div>
            </div>
            <Switch
              checked={form.notification_disabled ?? cfg.notification_disabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, notification_disabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Criar cliente automaticamente</div>
              <div className="text-xs text-muted-foreground">Cria no Asaas quando uma nova cobrança é gerada.</div>
            </div>
            <Switch
              checked={form.auto_create_customer ?? cfg.auto_create_customer}
              onCheckedChange={(v) => setForm((f) => ({ ...f, auto_create_customer: v }))}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button size="sm" onClick={() => saveMut.mutate({
              default_billing_type: form.default_billing_type,
              default_due_days: form.default_due_days,
              notification_disabled: form.notification_disabled,
              auto_create_customer: form.auto_create_customer,
            })} disabled={saveMut.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" /> Salvar padrões
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PLAYGROUND */}
      <PlaygroundCard env={env} defaultDueDays={cfg.default_due_days} />

      {/* LOGS */}
      <LogsCard />
    </div>
  );
}

/* ---------- CredentialColumn ---------- */

function CredentialColumn(props: {
  title: string;
  badgeClass: string;
  apiKeyValue: string;
  onApiKeyChange: (v: string) => void;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
  webhookToken: string;
  onWebhookTokenChange: (v: string) => void;
  apiKeyPlaceholder: string;
  onSave: () => void;
  saving: boolean;
  environment: AsaasEnvironment;
}) {
  const [testing, setTesting] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; message?: string; account?: any; balance?: number | null } | null>(null);

  async function handleTest() {
    setTesting(true); setResult(null);
    const r = await asaasTestConnection({ environment: props.environment, apiKey: props.apiKeyValue || undefined });
    setResult(r);
    setTesting(false);
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${props.badgeClass}`}>{props.title}</span>
        </div>
        {result && (
          result.ok
            ? <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> OK</Badge>
            : <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Falhou</Badge>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">API Key</Label>
        <div className="flex gap-1">
          <Input
            type={props.showKey ? "text" : "password"}
            value={props.apiKeyValue}
            onChange={(e) => props.onApiKeyChange(e.target.value)}
            placeholder={props.apiKeyPlaceholder}
            autoComplete="off"
          />
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => props.setShowKey(!props.showKey)}>
            {props.showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Webhook Auth Token</Label>
        <div className="flex gap-1">
          <Input
            value={props.webhookToken}
            onChange={(e) => props.onWebhookTokenChange(e.target.value)}
            placeholder="Cole aqui ou clique em gerar"
            autoComplete="off"
          />
          <Button type="button" variant="outline" size="icon" className="shrink-0" title="Gerar novo" onClick={() => props.onWebhookTokenChange(randomToken())}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => copyText(props.webhookToken)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" className="flex-1" disabled={testing} onClick={handleTest}>
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <PlugZap className="h-3.5 w-3.5 mr-1" />}
          Testar conexão
        </Button>
        <Button size="sm" className="flex-1" disabled={props.saving} onClick={props.onSave}>
          <Save className="h-3.5 w-3.5 mr-1" /> Salvar
        </Button>
      </div>
      {result && (
        <div className={`rounded-lg border p-2 text-xs ${result.ok ? "border-green-500/30 bg-green-500/5 text-green-700" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
          {result.ok ? (
            <div className="space-y-0.5">
              <div className="font-medium">{result.account?.name || "Conta autenticada"}</div>
              {result.account?.email && <div>{result.account.email}</div>}
              {result.account?.cpfCnpj && <div>CPF/CNPJ: {result.account.cpfCnpj}</div>}
              {result.account?.walletId && <div className="font-mono break-all">Wallet: {result.account.walletId}</div>}
              {typeof result.balance === "number" && <div>Saldo: R$ {result.balance.toFixed(2)}</div>}
            </div>
          ) : (
            <div>{result.message}</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- WebhookCard ---------- */

function WebhookCard({ cfg, env }: { cfg: AsaasConfig; env: AsaasEnvironment }) {
  const url = asaasWebhookUrl();
  const recommendedEvents = [
    "PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED",
    "PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "PAYMENT_DELETED", "PAYMENT_RESTORED",
    "PAYMENT_BANK_SLIP_VIEWED", "PAYMENT_CHECKOUT_VIEWED",
  ];

  const { data: webhooks = [] } = useQuery({
    queryKey: ["asaas-webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asaas_webhooks" as any)
        .select("*")
        .order("received_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as AsaasWebhookEvent[];
    },
    refetchInterval: 15000,
  });

  const [creating, setCreating] = React.useState(false);

  async function createWebhook() {
    const token = env === "production" ? cfg.production_webhook_token : cfg.sandbox_webhook_token;
    if (!token) { toast.error("Defina o Webhook Auth Token primeiro"); return; }
    setCreating(true);
    const r = await asaasCall({
      path: "/webhooks",
      method: "POST",
      environment: env,
      body: {
        name: "Lovable Integração",
        url,
        email: cfg.sandbox_api_key ? "dev@jotazo.com.br" : undefined,
        enabled: true,
        interrupted: false,
        authToken: token,
        sendType: "SEQUENTIALLY",
        events: recommendedEvents,
      },
    });
    setCreating(false);
    if (r.ok) toast.success("Webhook criado no Asaas!");
    else toast.error(r.data?.errors?.[0]?.description || r.error || "Falha ao criar webhook");
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
            <Webhook className="h-4 w-4 text-white" />
          </div>
          Webhook
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure esta URL no painel Asaas (Integrações → Webhooks) e cole o mesmo Auth Token do ambiente correspondente.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">URL do Webhook</Label>
          <div className="flex gap-1">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={() => copyText(url, "URL copiada!")}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Eventos recomendados</Label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {recommendedEvents.map((e) => (
              <Badge key={e} variant="outline" className="text-[10px] font-mono">{e}</Badge>
            ))}
          </div>
        </div>

        <Button size="sm" variant="outline" onClick={createWebhook} disabled={creating}>
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
          Criar webhook automaticamente no Asaas ({env})
        </Button>

        <div>
          <Label className="text-xs text-muted-foreground">Últimos eventos recebidos</Label>
          {webhooks.length === 0 ? (
            <p className="text-xs text-muted-foreground mt-2">Nenhum evento recebido ainda.</p>
          ) : (
            <div className="mt-2 rounded-lg border divide-y max-h-64 overflow-auto">
              {webhooks.map((w) => (
                <div key={w.event_id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[10px]">{w.environment || "—"}</Badge>
                    <span className="font-mono truncate">{w.event_type}</span>
                    {w.object_id && <span className="text-muted-foreground font-mono truncate">{w.object_id}</span>}
                  </div>
                  <span className="text-muted-foreground shrink-0">{new Date(w.received_at).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Playground ---------- */

type RunResult = { ok: boolean; status?: number; data?: any; error?: string; durationMs?: number; environment?: string } | null;

function PlaygroundCard({ env, defaultDueDays }: { env: AsaasEnvironment; defaultDueDays: number }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          Playground de testes
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ambiente atual: <Badge variant={env === "production" ? "destructive" : "secondary"} className="ml-1 text-[10px]">{env.toUpperCase()}</Badge>
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="customer">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="customer" className="gap-1 text-xs"><User className="h-3 w-3" /> Cliente</TabsTrigger>
            <TabsTrigger value="pix" className="gap-1 text-xs"><QrCode className="h-3 w-3" /> Pix</TabsTrigger>
            <TabsTrigger value="boleto" className="gap-1 text-xs"><FileText className="h-3 w-3" /> Boleto</TabsTrigger>
            <TabsTrigger value="card" className="gap-1 text-xs"><CreditCard className="h-3 w-3" /> Cartão</TabsTrigger>
            <TabsTrigger value="sub" className="gap-1 text-xs"><Repeat className="h-3 w-3" /> Assinatura</TabsTrigger>
            <TabsTrigger value="transfer" className="gap-1 text-xs"><ArrowUpRight className="h-3 w-3" /> Transferência</TabsTrigger>
            <TabsTrigger value="lookup" className="gap-1 text-xs"><Search className="h-3 w-3" /> Consulta</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="mt-4"><CustomerForm env={env} /></TabsContent>
          <TabsContent value="pix" className="mt-4"><PaymentForm env={env} billingType="PIX" defaultDueDays={defaultDueDays} /></TabsContent>
          <TabsContent value="boleto" className="mt-4"><PaymentForm env={env} billingType="BOLETO" defaultDueDays={defaultDueDays} /></TabsContent>
          <TabsContent value="card" className="mt-4"><CardPaymentForm env={env} defaultDueDays={defaultDueDays} /></TabsContent>
          <TabsContent value="sub" className="mt-4"><SubscriptionForm env={env} defaultDueDays={defaultDueDays} /></TabsContent>
          <TabsContent value="transfer" className="mt-4"><TransferForm env={env} /></TabsContent>
          <TabsContent value="lookup" className="mt-4"><LookupForm env={env} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ResultBox({ result }: { result: RunResult }) {
  if (!result) return null;
  return (
    <div className={`mt-3 rounded-lg border ${result.ok ? "border-green-500/30" : "border-destructive/30"}`}>
      <div className={`flex items-center justify-between px-3 py-1.5 text-xs ${result.ok ? "bg-green-500/5 text-green-700" : "bg-destructive/5 text-destructive"}`}>
        <div className="flex items-center gap-2">
          {result.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          <span>HTTP {result.status ?? "?"}</span>
          {result.environment && <Badge variant="outline" className="text-[10px]">{result.environment}</Badge>}
        </div>
        <span className="text-muted-foreground">{result.durationMs ?? 0} ms</span>
      </div>
      <pre className="text-xs p-3 overflow-auto max-h-80 bg-muted/30">{formatJson(result.data ?? result.error ?? null)}</pre>
    </div>
  );
}

function PayloadPreview({ body }: { body: any }) {
  return (
    <details className="mt-2 rounded-lg border bg-muted/20">
      <summary className="cursor-pointer px-3 py-1.5 text-xs text-muted-foreground">Ver payload JSON</summary>
      <pre className="text-xs p-3 overflow-auto max-h-60">{formatJson(body)}</pre>
    </details>
  );
}

/* ---------- Forms ---------- */

function CustomerForm({ env }: { env: AsaasEnvironment }) {
  const [name, setName] = React.useState("Cliente Teste");
  const [cpfCnpj, setCpfCnpj] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [externalRef, setExternalRef] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<RunResult>(null);

  const body = { name, cpfCnpj, email, mobilePhone: phone, externalReference: externalRef || undefined };

  async function create() {
    setRunning(true); setResult(null);
    const r = await asaasCall({ path: "/customers", method: "POST", environment: env, body });
    setResult(r); setRunning(false);
  }
  async function search() {
    setRunning(true); setResult(null);
    const params = new URLSearchParams();
    if (cpfCnpj) params.set("cpfCnpj", cpfCnpj);
    if (externalRef) params.set("externalReference", externalRef);
    const r = await asaasCall({ path: `/customers?${params.toString()}`, method: "GET", environment: env });
    setResult(r); setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="CPF/CNPJ (somente números)" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Celular (DDD+9 dígitos)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="externalReference (opcional)" value={externalRef} onChange={(e) => setExternalRef(e.target.value)} className="md:col-span-2" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={create} disabled={running || !name || !cpfCnpj}><Play className="h-3.5 w-3.5 mr-1" />Criar cliente (POST /customers)</Button>
        <Button size="sm" variant="outline" onClick={search} disabled={running || (!cpfCnpj && !externalRef)}><Search className="h-3.5 w-3.5 mr-1" />Buscar (GET /customers)</Button>
      </div>
      <PayloadPreview body={body} />
      <ResultBox result={result} />
    </div>
  );
}

function PaymentForm({ env, billingType, defaultDueDays }: { env: AsaasEnvironment; billingType: "PIX" | "BOLETO"; defaultDueDays: number }) {
  const [customer, setCustomer] = React.useState("");
  const [value, setValue] = React.useState<number>(10);
  const [dueDate, setDueDate] = React.useState(todayPlusDays(defaultDueDays));
  const [description, setDescription] = React.useState("Cobrança de teste");
  const [externalRef, setExternalRef] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<RunResult>(null);
  const [qrResult, setQrResult] = React.useState<RunResult>(null);

  const body = {
    customer, billingType, value, dueDate, description,
    externalReference: externalRef || undefined,
  };

  async function create() {
    setRunning(true); setResult(null); setQrResult(null);
    const r = await asaasCall({ path: "/payments", method: "POST", environment: env, body });
    setResult(r);
    if (r.ok && billingType === "PIX" && r.data?.id) {
      const qr = await asaasCall({ path: `/payments/${r.data.id}/pixQrCode`, method: "GET", environment: env });
      setQrResult(qr);
    }
    setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Input placeholder="customer (cus_...)" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        <Input type="number" step="0.01" placeholder="Valor (R$)" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <Input placeholder="externalReference (opcional)" value={externalRef} onChange={(e) => setExternalRef(e.target.value)} />
        <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="md:col-span-2" />
      </div>
      <Button size="sm" onClick={create} disabled={running || !customer || !value}>
        <Play className="h-3.5 w-3.5 mr-1" />
        Criar {billingType === "PIX" ? "Pix" : "Boleto"} (POST /payments)
      </Button>
      <PayloadPreview body={body} />
      <ResultBox result={result} />
      {qrResult && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">QR Code Pix (GET /payments/&#123;id&#125;/pixQrCode):</div>
          <ResultBox result={qrResult} />
          {qrResult.data?.encodedImage && (
            <div className="rounded-lg border p-3 flex items-center gap-4">
              <img src={`data:image/png;base64,${qrResult.data.encodedImage}`} alt="QR Pix" className="h-32 w-32" />
              <div className="space-y-1 text-xs">
                <div className="font-medium">Copia e cola:</div>
                <Textarea readOnly value={qrResult.data.payload || ""} className="font-mono text-[10px] h-20" />
                <Button size="sm" variant="outline" onClick={() => copyText(qrResult.data.payload || "", "Pix copia e cola copiado!")}>
                  <Copy className="h-3 w-3 mr-1" /> Copiar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardPaymentForm({ env, defaultDueDays }: { env: AsaasEnvironment; defaultDueDays: number }) {
  const [customer, setCustomer] = React.useState("");
  const [value, setValue] = React.useState<number>(10);
  const [dueDate, setDueDate] = React.useState(todayPlusDays(defaultDueDays));
  const [card, setCard] = React.useState({ holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "" });
  const [holder, setHolder] = React.useState({ name: "", email: "", cpfCnpj: "", postalCode: "", addressNumber: "", phone: "" });
  const [remoteIp, setRemoteIp] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<RunResult>(null);

  const body = {
    customer, billingType: "CREDIT_CARD", value, dueDate,
    description: "Pagamento cartão (teste)",
    creditCard: card, creditCardHolderInfo: holder, remoteIp: remoteIp || undefined,
  };

  async function run() {
    setRunning(true); setResult(null);
    const r = await asaasCall({ path: "/payments", method: "POST", environment: env, body });
    setResult(r); setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Input placeholder="customer (cus_...)" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        <Input type="number" step="0.01" placeholder="Valor (R$)" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <Input placeholder="Remote IP (opcional)" value={remoteIp} onChange={(e) => setRemoteIp(e.target.value)} />
      </div>
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium">Cartão</div>
        <div className="grid md:grid-cols-2 gap-2">
          <Input placeholder="Nome impresso" value={card.holderName} onChange={(e) => setCard({ ...card, holderName: e.target.value })} />
          <Input placeholder="Número (sem espaços)" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
          <Input placeholder="MM" value={card.expiryMonth} onChange={(e) => setCard({ ...card, expiryMonth: e.target.value })} />
          <Input placeholder="YYYY" value={card.expiryYear} onChange={(e) => setCard({ ...card, expiryYear: e.target.value })} />
          <Input placeholder="CCV" value={card.ccv} onChange={(e) => setCard({ ...card, ccv: e.target.value })} />
        </div>
      </div>
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium">Dados do titular</div>
        <div className="grid md:grid-cols-2 gap-2">
          <Input placeholder="Nome completo" value={holder.name} onChange={(e) => setHolder({ ...holder, name: e.target.value })} />
          <Input placeholder="Email" value={holder.email} onChange={(e) => setHolder({ ...holder, email: e.target.value })} />
          <Input placeholder="CPF/CNPJ" value={holder.cpfCnpj} onChange={(e) => setHolder({ ...holder, cpfCnpj: e.target.value })} />
          <Input placeholder="CEP" value={holder.postalCode} onChange={(e) => setHolder({ ...holder, postalCode: e.target.value })} />
          <Input placeholder="Número endereço" value={holder.addressNumber} onChange={(e) => setHolder({ ...holder, addressNumber: e.target.value })} />
          <Input placeholder="Telefone" value={holder.phone} onChange={(e) => setHolder({ ...holder, phone: e.target.value })} />
        </div>
      </div>
      <Button size="sm" onClick={run} disabled={running || !customer || !value}>
        <Play className="h-3.5 w-3.5 mr-1" /> Cobrar cartão (POST /payments)
      </Button>
      <PayloadPreview body={body} />
      <ResultBox result={result} />
    </div>
  );
}

function SubscriptionForm({ env, defaultDueDays }: { env: AsaasEnvironment; defaultDueDays: number }) {
  const [customer, setCustomer] = React.useState("");
  const [billingType, setBillingType] = React.useState<AsaasBillingType>("PIX");
  const [value, setValue] = React.useState<number>(19.9);
  const [nextDueDate, setNextDueDate] = React.useState(todayPlusDays(defaultDueDays));
  const [cycle, setCycle] = React.useState("MONTHLY");
  const [description, setDescription] = React.useState("Assinatura de teste");
  const [externalRef, setExternalRef] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<RunResult>(null);

  const body = { customer, billingType, value, nextDueDate, cycle, description, externalReference: externalRef || undefined };

  async function run() {
    setRunning(true); setResult(null);
    const r = await asaasCall({ path: "/subscriptions", method: "POST", environment: env, body });
    setResult(r); setRunning(false);
  }
  async function listPayments() {
    if (!result?.data?.id) { toast.error("Crie a assinatura primeiro"); return; }
    setRunning(true);
    const r = await asaasCall({ path: `/subscriptions/${result.data.id}/payments`, method: "GET", environment: env });
    setResult(r); setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Input placeholder="customer (cus_...)" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        <Select value={billingType} onValueChange={(v) => setBillingType(v as AsaasBillingType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UNDEFINED">Indefinido</SelectItem>
            <SelectItem value="PIX">Pix</SelectItem>
            <SelectItem value="BOLETO">Boleto</SelectItem>
            <SelectItem value="CREDIT_CARD">Cartão</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" step="0.01" placeholder="Valor" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} />
        <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
        <Select value={cycle} onValueChange={setCycle}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["WEEKLY","BIWEEKLY","MONTHLY","QUARTERLY","SEMIANNUALLY","YEARLY"].map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="externalReference (opcional)" value={externalRef} onChange={(e) => setExternalRef(e.target.value)} />
        <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="md:col-span-2" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={run} disabled={running || !customer || !value}><Play className="h-3.5 w-3.5 mr-1" />Criar assinatura</Button>
        <Button size="sm" variant="outline" onClick={listPayments} disabled={running}><Search className="h-3.5 w-3.5 mr-1" />Listar cobranças</Button>
      </div>
      <PayloadPreview body={body} />
      <ResultBox result={result} />
    </div>
  );
}

function TransferForm({ env }: { env: AsaasEnvironment }) {
  const [mode, setMode] = React.useState<"pix" | "bank">("pix");
  const [value, setValue] = React.useState<number>(10);
  const [description, setDescription] = React.useState("Transferência de teste");
  // pix
  const [pixKey, setPixKey] = React.useState("");
  const [pixKeyType, setPixKeyType] = React.useState("CPF");
  // bank
  const [bank, setBank] = React.useState({ bankCode: "237", ownerName: "", cpfCnpj: "", agency: "", account: "", accountDigit: "", bankAccountType: "CONTA_CORRENTE" });

  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<RunResult>(null);

  const body: any = mode === "pix"
    ? { value, pixAddressKey: pixKey, pixAddressKeyType: pixKeyType, description }
    : { value, description, bankAccount: {
        bank: { code: bank.bankCode },
        ownerName: bank.ownerName,
        cpfCnpj: bank.cpfCnpj,
        agency: bank.agency,
        account: bank.account,
        accountDigit: bank.accountDigit,
        bankAccountType: bank.bankAccountType,
      } };

  async function run() {
    setRunning(true); setResult(null);
    const r = await asaasCall({ path: "/transfers", method: "POST", environment: env, body });
    setResult(r); setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
        ⚠️ Transferências em produção movimentam dinheiro real. Em sandbox, são simuladas.
      </div>
      <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pix" className="text-xs">Pix</TabsTrigger>
          <TabsTrigger value="bank" className="text-xs">Conta bancária</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid md:grid-cols-2 gap-3">
        <Input type="number" step="0.01" placeholder="Valor" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} />
        <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {mode === "pix" ? (
        <div className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Chave Pix" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
          <Select value={pixKeyType} onValueChange={setPixKeyType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["CPF","CNPJ","EMAIL","PHONE","EVP"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Código banco (ex 237)" value={bank.bankCode} onChange={(e) => setBank({ ...bank, bankCode: e.target.value })} />
          <Input placeholder="Nome titular" value={bank.ownerName} onChange={(e) => setBank({ ...bank, ownerName: e.target.value })} />
          <Input placeholder="CPF/CNPJ titular" value={bank.cpfCnpj} onChange={(e) => setBank({ ...bank, cpfCnpj: e.target.value })} />
          <Input placeholder="Agência" value={bank.agency} onChange={(e) => setBank({ ...bank, agency: e.target.value })} />
          <Input placeholder="Conta" value={bank.account} onChange={(e) => setBank({ ...bank, account: e.target.value })} />
          <Input placeholder="Dígito" value={bank.accountDigit} onChange={(e) => setBank({ ...bank, accountDigit: e.target.value })} />
          <Select value={bank.bankAccountType} onValueChange={(v) => setBank({ ...bank, bankAccountType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CONTA_CORRENTE">Conta corrente</SelectItem>
              <SelectItem value="CONTA_POUPANCA">Conta poupança</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Button size="sm" onClick={run} disabled={running || !value}><Play className="h-3.5 w-3.5 mr-1" />Executar transferência</Button>
      <PayloadPreview body={body} />
      <ResultBox result={result} />
    </div>
  );
}

function LookupForm({ env }: { env: AsaasEnvironment }) {
  const [resource, setResource] = React.useState<"payments" | "subscriptions" | "customers" | "transfers">("payments");
  const [id, setId] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<RunResult>(null);

  async function run() {
    setRunning(true); setResult(null);
    const r = await asaasCall({ path: `/${resource}/${id}`, method: "GET", environment: env });
    setResult(r); setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        <Select value={resource} onValueChange={(v) => setResource(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="payments">Pagamentos</SelectItem>
            <SelectItem value="subscriptions">Assinaturas</SelectItem>
            <SelectItem value="customers">Clientes</SelectItem>
            <SelectItem value="transfers">Transferências</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="ID (pay_..., sub_..., cus_..., etc)" value={id} onChange={(e) => setId(e.target.value)} className="md:col-span-2" />
      </div>
      <Button size="sm" onClick={run} disabled={running || !id}><Search className="h-3.5 w-3.5 mr-1" />Consultar</Button>
      <ResultBox result={result} />
    </div>
  );
}

/* ---------- Logs ---------- */

function LogsCard() {
  const { data: logs = [], refetch, isFetching } = useQuery({
    queryKey: ["asaas-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asaas_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as AsaasLog[];
    },
  });
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <ScrollText className="h-4 w-4 text-white" />
            </div>
            Logs de chamadas
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma chamada registrada ainda.</p>
        ) : (
          <div className="rounded-lg border divide-y">
            {logs.map((l) => {
              const ok = (l.status_code ?? 500) < 400;
              const isOpen = expanded === l.id;
              return (
                <div key={l.id} className="text-xs">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : l.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/30 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      <Badge variant="outline" className="text-[10px]">{l.environment}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{l.method}</Badge>
                      <span className="font-mono truncate">{l.endpoint}</span>
                      <span className="text-muted-foreground shrink-0">{l.status_code ?? "—"}</span>
                    </div>
                    <span className="text-muted-foreground shrink-0">{new Date(l.created_at).toLocaleString("pt-BR")} · {l.duration_ms ?? "?"}ms</span>
                  </button>
                  {isOpen && (
                    <div className="px-3 py-2 bg-muted/20 space-y-2">
                      {l.error_message && <div className="text-destructive">{l.error_message}</div>}
                      <details>
                        <summary className="cursor-pointer text-muted-foreground">Request</summary>
                        <pre className="mt-1 max-h-60 overflow-auto text-[10px]">{formatJson(l.request_payload)}</pre>
                      </details>
                      <details>
                        <summary className="cursor-pointer text-muted-foreground">Response</summary>
                        <pre className="mt-1 max-h-60 overflow-auto text-[10px]">{formatJson(l.response_payload)}</pre>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
