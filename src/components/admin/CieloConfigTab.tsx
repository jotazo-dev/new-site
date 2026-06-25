import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  KeyRound, Webhook, ShieldCheck, Settings2, FlaskConical, ScrollText,
  Loader2, CheckCircle2, XCircle, Copy, Eye, EyeOff, RefreshCw, Save, CreditCard, AlertTriangle,
} from "lucide-react";
import {
  testCieloConnection, getCieloWebhookUrl, generateWebhookSecret,
} from "@/lib/cielo";
import type { CieloConfig, CieloLog, CieloTestResult } from "@/types/cielo";
import { CieloTestPanel } from "./cielo/CieloTestPanel";

function copyText(v: string, label = "Copiado!") {
  navigator.clipboard.writeText(v).then(() => toast.success(label)).catch(() => toast.error("Falha ao copiar"));
}

export function CieloConfigTab() {
  const qc = useQueryClient();
  const { data: cfg, isLoading } = useQuery({
    queryKey: ["cielo-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cielo_config" as any).select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as CieloConfig | null;
    },
  });

  const [form, setForm] = React.useState<Partial<CieloConfig>>({});
  React.useEffect(() => { if (cfg) setForm(cfg); }, [cfg]);

  const [showSandboxKey, setShowSandboxKey] = React.useState(false);
  const [showProdKey, setShowProdKey] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<CieloTestResult | null>(null);

  const { data: logs = [] } = useQuery({
    queryKey: ["cielo-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cielo_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as CieloLog[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (patch: Partial<CieloConfig>) => {
      const payload = {
        environment: patch.environment ?? "sandbox",
        merchant_id_sandbox: patch.merchant_id_sandbox ?? null,
        merchant_key_sandbox: patch.merchant_key_sandbox ?? null,
        merchant_id_production: patch.merchant_id_production ?? null,
        merchant_key_production: patch.merchant_key_production ?? null,
        provider_credit: patch.provider_credit ?? "Cielo30",
        provider_debit: patch.provider_debit ?? "Cielo30",
        provider_boleto: patch.provider_boleto ?? "Bradesco2",
        provider_pix: patch.provider_pix ?? "Cielo2",
        provider_pix_sandbox: patch.provider_pix_sandbox ?? "Cielo2",
        provider_pix_production: patch.provider_pix_production ?? "Cielo2",
        default_soft_descriptor: patch.default_soft_descriptor ?? null,
        default_capture: !!patch.default_capture,
        antifraud_enabled: !!patch.antifraud_enabled,
        antifraud_provider: patch.antifraud_provider ?? null,
        webhook_secret: patch.webhook_secret ?? null,
        active: !!patch.active,
      };
      if (cfg?.id) {
        const { error } = await supabase.from("cielo_config" as any).update(payload).eq("id", cfg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cielo_config" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cielo-config"] });
      toast.success("Configurações salvas");
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testCieloConnection();
      setTestResult(res);
      qc.invalidateQueries({ queryKey: ["cielo-logs"] });
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
    } finally {
      setTesting(false);
    }
  }

  const webhookUrl = getCieloWebhookUrl();
  const isProd = form.environment === "production";

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Carregando configurações Cielo...</div>;
  }

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
              <p className="text-xs text-muted-foreground mt-0.5">
                Sandbox para testes, Produção para cobranças reais.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isProd ? "destructive" : "secondary"}>
                {isProd ? "PRODUÇÃO" : "SANDBOX"}
              </Badge>
              <Switch
                checked={isProd}
                onCheckedChange={(v) => setForm({ ...form, environment: v ? "production" : "sandbox" })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Integração ativa</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Desligue para pausar cobranças sem perder configurações.
              </p>
            </div>
            <Switch
              checked={!!form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
          </div>

          {isProd && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Ambiente de produção ativo. Transações serão reais.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credenciais */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" /> Credenciais
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Obtenha no portal Cielo / Braspag. MerchantKey é secreto — nunca exposto ao navegador.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sandbox */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Sandbox</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Merchant ID</Label>
                <Input
                  value={form.merchant_id_sandbox ?? ""}
                  onChange={(e) => setForm({ ...form, merchant_id_sandbox: e.target.value })}
                  placeholder="GUID 36 caracteres"
                />
              </div>
              <div>
                <Label className="text-xs">Merchant Key</Label>
                <div className="relative">
                  <Input
                    type={showSandboxKey ? "text" : "password"}
                    value={form.merchant_key_sandbox ?? ""}
                    onChange={(e) => setForm({ ...form, merchant_key_sandbox: e.target.value })}
                    placeholder="40 caracteres"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowSandboxKey((v) => !v)}
                  >
                    {showSandboxKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Produção */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Produção</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Merchant ID</Label>
                <Input
                  value={form.merchant_id_production ?? ""}
                  onChange={(e) => setForm({ ...form, merchant_id_production: e.target.value })}
                  placeholder="GUID 36 caracteres"
                />
              </div>
              <div>
                <Label className="text-xs">Merchant Key</Label>
                <div className="relative">
                  <Input
                    type={showProdKey ? "text" : "password"}
                    value={form.merchant_key_production ?? ""}
                    onChange={(e) => setForm({ ...form, merchant_key_production: e.target.value })}
                    placeholder="40 caracteres"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowProdKey((v) => !v)}
                  >
                    {showProdKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers padrão */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" /> Providers padrão
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Adquirente/banco usado em cada meio de pagamento. Pode ser sobrescrito em cada cobrança.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Crédito</Label>
            <Select
              value={form.provider_credit ?? "Cielo30"}
              onValueChange={(v) => setForm({ ...form, provider_credit: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cielo30">Cielo30</SelectItem>
                <SelectItem value="Cielo">Cielo</SelectItem>
                <SelectItem value="Rede">Rede</SelectItem>
                <SelectItem value="Getnet">Getnet</SelectItem>
                <SelectItem value="FirstData">FirstData</SelectItem>
                <SelectItem value="SafraPay">SafraPay</SelectItem>
                <SelectItem value="Simulado">Simulado (sandbox)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Débito</Label>
            <Select
              value={form.provider_debit ?? "Cielo30"}
              onValueChange={(v) => setForm({ ...form, provider_debit: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cielo30">Cielo30</SelectItem>
                <SelectItem value="Cielo">Cielo</SelectItem>
                <SelectItem value="Rede">Rede</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Boleto</Label>
            <Select
              value={form.provider_boleto ?? "Bradesco2"}
              onValueChange={(v) => setForm({ ...form, provider_boleto: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bradesco2">Bradesco</SelectItem>
                <SelectItem value="BancoDoBrasil3">Banco do Brasil</SelectItem>
                <SelectItem value="Itau3">Itaú</SelectItem>
                <SelectItem value="Santander2">Santander</SelectItem>
                <SelectItem value="Citibank2">Citibank</SelectItem>
                <SelectItem value="Simulado">Simulado (sandbox)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Pix — Sandbox</Label>
            <Select
              value={form.provider_pix_sandbox ?? "Cielo2"}
              onValueChange={(v) => setForm({ ...form, provider_pix_sandbox: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cielo2">Cielo2 (recomendado — nova integração oficial)</SelectItem>
                <SelectItem value="Cielo30">Cielo30</SelectItem>
                <SelectItem value="BBPix">BB Pix</SelectItem>
                <SelectItem value="Bradesco">Bradesco</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              ⚠️ Pix <code>Cielo2</code> (nova integração oficial) <strong>não tem sandbox</strong> conforme <a href="https://docs.cielo.com.br/gateway/docs/pix-cielo" target="_blank" rel="noreferrer" className="underline">docs Cielo</a>. Em sandbox use providers legados (Cielo30/BBPix) apenas se sua conta tiver afiliação Pix neles, ou teste Pix diretamente em produção com R$ 0,01.
            </p>
          </div>
          <div>
            <Label className="text-xs">Pix — Produção</Label>
            <Select
              value={form.provider_pix_production ?? "Cielo2"}
              onValueChange={(v) => setForm({ ...form, provider_pix_production: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cielo2">Cielo2 (recomendado)</SelectItem>
                <SelectItem value="Cielo30">Cielo30</SelectItem>
                <SelectItem value="BBPix">BB Pix</SelectItem>
                <SelectItem value="Bradesco">Bradesco</SelectItem>
              </SelectContent>
            </Select>
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
            <Label className="text-xs">Soft Descriptor (até 13 caracteres)</Label>
            <Input
              maxLength={13}
              value={form.default_soft_descriptor ?? ""}
              onChange={(e) => setForm({ ...form, default_soft_descriptor: e.target.value })}
              placeholder="JOTAZO"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Aparece na fatura do cliente.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Auto-captura (crédito)</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Captura no momento da autorização, sem etapa manual.
              </p>
            </div>
            <Switch
              checked={!!form.default_capture}
              onCheckedChange={(v) => setForm({ ...form, default_capture: v })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Antifraude</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Análise antes de autorizar transações de crédito.
              </p>
            </div>
            <Switch
              checked={!!form.antifraud_enabled}
              onCheckedChange={(v) => setForm({ ...form, antifraud_enabled: v })}
            />
          </div>

          {form.antifraud_enabled && (
            <div>
              <Label className="text-xs">Provedor de antifraude</Label>
              <Select
                value={form.antifraud_provider ?? ""}
                onValueChange={(v) => setForm({ ...form, antifraud_provider: v })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cybersource">Cybersource</SelectItem>
                  <SelectItem value="ClearSale">ClearSale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4 text-primary" /> Webhook (Post de Notificação)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Cadastre essa URL no portal Cielo via Atendimento. Inclui o secret na query string para validação.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">URL do webhook (com secret)</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={form.webhook_secret ? `${webhookUrl}?secret=${form.webhook_secret}` : webhookUrl}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  copyText(form.webhook_secret ? `${webhookUrl}?secret=${form.webhook_secret}` : webhookUrl)
                }
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Webhook secret</Label>
            <div className="flex gap-2">
              <Input
                value={form.webhook_secret ?? ""}
                onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
                placeholder="Clique em Gerar"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm({ ...form, webhook_secret: generateWebhookSecret() })}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Gerar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Toda notificação que chegar sem esse secret será rejeitada com 403.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teste de conexão */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4 text-primary" /> Teste de conexão
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Faz uma transação Zero Auth contra a Cielo usando as credenciais do ambiente ativo.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleTest} disabled={testing} className="gap-2">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            {testing ? "Testando..." : "Testar agora"}
          </Button>
          {testResult && (
            <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              testResult.ok
                ? "border-green-500/30 bg-green-500/5 text-green-700"
                : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}>
              {testResult.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testes de pagamento */}
      <CieloTestPanel isProd={isProd} />

      {/* Logs */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-4 w-4 text-primary" /> Últimas chamadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma chamada registrada ainda.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border p-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant={l.direction === "webhook" ? "secondary" : "outline"} className="shrink-0">
                      {l.direction}
                    </Badge>
                    <span className="font-mono truncate">{l.method} {l.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                    {l.status_code && (
                      <span className={l.status_code >= 200 && l.status_code < 300 ? "text-green-600" : "text-destructive"}>
                        {l.status_code}
                      </span>
                    )}
                    {l.duration_ms != null && <span>{l.duration_ms}ms</span>}
                    <span>{new Date(l.created_at).toLocaleTimeString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salvar */}
      <div className="flex justify-end gap-2 sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t">
        <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} className="gap-2">
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
