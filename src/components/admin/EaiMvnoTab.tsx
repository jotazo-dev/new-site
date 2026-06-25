import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  KeyRound, PlugZap, ScrollText, Loader2, CheckCircle2, XCircle,
  Eye, EyeOff, Save, Trash2, Compass, Send,
} from "lucide-react";

// Endpoints reais do Swagger oficial: https://hml-mvno.eai.net.br/apidocs.json
const ENDPOINT_PRESETS: { label: string; path: string; method?: "GET" | "POST"; description?: string }[] = [
  { label: "Companies", path: "/rest/service_eai/companies", description: "Lista companies (retorna JWT company-token)" },
  { label: "Main Products", path: "/rest/service_eai/mvno_main_products", description: "Catálogo de produtos principais" },
  { label: "Plans", path: "/rest/service_eai/mvno_plans", description: "Planos disponíveis" },
  { label: "Customers", path: "/rest/service_eai/customers", description: "Clientes cadastrados" },
  { label: "Lines", path: "/rest/service_eai/mvno_lines", description: "Linhas MSISDN" },
  { label: "SIM Cards", path: "/rest/service_eai/mvno_sim_card", description: "Chips/SIMs (singular, sem 's')" },
  { label: "Carts", path: "/rest/service_eai/mvno_carts", description: "Carrinhos de ativação" },
  { label: "Available DDDs", path: "/rest/service_eai/mvno_carts/available_ddds", description: "DDDs disponíveis para reserva" },
  { label: "Portabilities", path: "/rest/service_eai/mvno_portabilities", description: "Pedidos de portabilidade" },
  { label: "Cities (Shared)", path: "/rest/service_shared/cities", description: "Cidades (service_shared)" },
  { label: "States (Shared)", path: "/rest/service_shared/states", description: "Estados (service_shared)" },
  { label: "Countries (Shared)", path: "/rest/service_shared/countries", description: "Países (service_shared)" },
];

type EaiConfig = {
  id: string;
  base_url: string;
  oauth_url: string;
  client_id: string;
  client_secret: string;
  company_token: string;
  company_token_header: string | null;
  oauth_scope: string | null;
  oauth_audience: string | null;
  environment: "sandbox" | "homologacao" | "production" | "producao";
  active: boolean;
  notes: string | null;
};

type PingAttempt = { header: string | null; status: number; snippet: string; ok: boolean; durationMs: number };
type ProxyResult = {
  ok: boolean;
  status?: number;
  data?: unknown;
  error?: string;
  durationMs?: number;
  method?: string;
  path?: string;
  attempts?: PingAttempt[];
  winner?: PingAttempt | null;
};

async function callProxy(action: string, payload: any = {}): Promise<ProxyResult> {
  const { data, error } = await supabase.functions.invoke("eai-proxy", { body: { action, payload } });
  if (error) return { ok: false, error: error.message };
  return data as ProxyResult;
}

function MaskedInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 font-mono text-xs"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={show ? "Ocultar" : "Exibir"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function EaiMvnoTab() {
  const qc = useQueryClient();

  const { data: cfg, isLoading } = useQuery({
    queryKey: ["eai-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("eai_config").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as EaiConfig | null;
    },
  });

  const [form, setForm] = React.useState<EaiConfig | null>(null);
  React.useEffect(() => { if (cfg) setForm(cfg); }, [cfg]);

  const saveMutation = useMutation({
    mutationFn: async (next: EaiConfig) => {
      const { error } = await supabase.from("eai_config").update({
        base_url: next.base_url.trim(),
        oauth_url: next.oauth_url.trim(),
        client_id: next.client_id.trim(),
        client_secret: next.client_secret,
        company_token: next.company_token,
        company_token_header: (next.company_token_header || "company-token").trim(),
        oauth_scope: next.oauth_scope?.trim() || null,
        oauth_audience: next.oauth_audience?.trim() || null,
        environment: next.environment,
        active: next.active,
        notes: next.notes,
      }).eq("id", next.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuração EAI salva");
      callProxy("cache.clear");
      qc.invalidateQueries({ queryKey: ["eai-config"] });
      qc.invalidateQueries({ queryKey: ["eai-status"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["eai-status"],
    queryFn: () => callProxy("status"),
  });

  const [testing, setTesting] = React.useState(false);
  const [pingResult, setPingResult] = React.useState<ProxyResult | null>(null);
  async function testPing() {
    setTesting(true); setPingResult(null);
    try {
      const r = await callProxy("ping");
      setPingResult(r);
      await refetchStatus();
      qc.invalidateQueries({ queryKey: ["eai-logs"] });
    } finally { setTesting(false); }
  }

  async function clearCache() {
    const r = await callProxy("cache.clear");
    if (r.ok) toast.success("Cache de token limpo"); else toast.error(r.error || "Erro");
    await refetchStatus();
  }

  const [diagResult, setDiagResult] = React.useState<any>(null);
  const [diagnosing, setDiagnosing] = React.useState(false);
  async function runDiagnose() {
    setDiagnosing(true); setDiagResult(null);
    try {
      const r = await callProxy("diagnose");
      setDiagResult(r);
      qc.invalidateQueries({ queryKey: ["eai-logs"] });
    } finally { setDiagnosing(false); }
  }

  const { data: logs } = useQuery({
    queryKey: ["eai-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eai_logs").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Endpoint explorer
  const [customPath, setCustomPath] = React.useState("/rest/service_eai/");
  const [customMethod, setCustomMethod] = React.useState<"GET" | "POST">("GET");
  const [explorerResults, setExplorerResults] = React.useState<Record<string, any>>({});
  const [explorerLoading, setExplorerLoading] = React.useState<Record<string, boolean>>({});

  async function tryEndpoint(path: string, method: "GET" | "POST" = "GET") {
    const key = `${method} ${path}`;
    setExplorerLoading((s) => ({ ...s, [key]: true }));
    try {
      const r = await callProxy("tryEndpoint", { path, method });
      setExplorerResults((s) => ({ ...s, [key]: r }));
      qc.invalidateQueries({ queryKey: ["eai-logs"] });
    } finally {
      setExplorerLoading((s) => ({ ...s, [key]: false }));
    }
  }

  if (isLoading || !form) {
    return <div className="py-10 text-center text-muted-foreground">Carregando configuração EAI...</div>;
  }

  const tokenInfo = (status as any)?.token as { expires_at?: string; obtained_at?: string } | null | undefined;
  const tokenValid = tokenInfo?.expires_at ? new Date(tokenInfo.expires_at).getTime() > Date.now() : false;
  const httpOk = pingResult && (pingResult.status ?? 0) >= 200 && (pingResult.status ?? 0) < 300 && !pingResult.error;

  return (
    <div className="space-y-6">
      {/* Credenciais */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-white" />
            </div>
            Credenciais EAI MVNO
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Auth OAuth2 <code className="text-[11px]">client_credentials</code> em <code className="text-[11px]">oauth_url</code>. Toda chamada usa <code className="text-[11px]">Authorization: Bearer</code> + header <code className="text-[11px]">CompanyToken</code> (CNPJ).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Base URL</Label>
              <Input
                value={form.base_url}
                onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                placeholder="https://hml-mvno.eai.net.br/api"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">OAuth URL</Label>
              <Input
                value={form.oauth_url}
                onChange={(e) => setForm({ ...form, oauth_url: e.target.value })}
                className="font-mono text-xs"
                placeholder="https://api.eai.net.br/oauth2/token"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Client ID</Label>
              <Input
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="font-mono text-xs"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Client Secret</Label>
              <MaskedInput
                value={form.client_secret}
                onChange={(v) => setForm({ ...form, client_secret: v })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Company Token (CNPJ)</Label>
              <MaskedInput
                value={form.company_token}
                onChange={(v) => setForm({ ...form, company_token: v })}
                placeholder="00000000000000"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Header do Company Token</Label>
              <Input
                value={form.company_token_header ?? "company-token"}
                onChange={(e) => setForm({ ...form, company_token_header: e.target.value })}
                placeholder="company-token"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ambiente</Label>
              <Select
                value={form.environment}
                onValueChange={(v) => setForm({ ...form, environment: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="homologacao">Homologação</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label className="text-sm">Integração ativa</Label>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-1.5">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar credenciais
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teste de conexão */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <PlugZap className="h-4 w-4 text-white" />
            </div>
            Teste de conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <StatusPill label="Configurado" ok={!!(status as any)?.configured} />
            <StatusPill label="Ativo" ok={!!(status as any)?.active} />
            <StatusPill label="Token válido" ok={tokenValid} />
            <div className="rounded-lg border p-2">
              <div className="text-[11px] text-muted-foreground">Expira em</div>
              <div className="text-xs font-mono">
                {tokenInfo?.expires_at ? new Date(tokenInfo.expires_at).toLocaleString() : "—"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={testPing} disabled={testing} className="gap-1.5">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
              Testar conexão (ping)
            </Button>
            <Button onClick={runDiagnose} disabled={diagnosing} variant="secondary" className="gap-1.5">
              {diagnosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
              Diagnosticar (testa 4 OAuth + 5 headers)
            </Button>
            <Button onClick={clearCache} variant="outline" className="gap-1.5">
              <Trash2 className="h-4 w-4" />
              Limpar cache de token
            </Button>
          </div>

          {diagResult && (
            <div className="rounded-lg border p-3 text-xs space-y-3">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground mb-1">OAuth variants</div>
                <div className="space-y-1">
                  {(diagResult.oauth ?? []).map((o: any, i: number) => (
                    <div key={i} className={`rounded border p-2 ${o.apiStatus >= 200 && o.apiStatus < 300 ? "border-green-500/40 bg-green-500/5" : "border-muted"}`}>
                      <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-muted">{o.variant}</span>
                        <span>token: {o.tokenOk ? "✓" : "✗"} ({o.tokenStatus ?? "—"})</span>
                        <span>api: {o.apiStatus ?? "—"}</span>
                      </div>
                      {o.apiSnippet && <pre className="mt-1 bg-background/60 rounded p-1.5 overflow-auto max-h-32 whitespace-pre-wrap break-all font-mono text-[10px]">{o.apiSnippet}</pre>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground mb-1">Header name variants</div>
                <div className="space-y-1">
                  {(diagResult.headers ?? []).map((h: any, i: number) => (
                    <div key={i} className={`rounded border p-2 ${h.apiStatus >= 200 && h.apiStatus < 300 ? "border-green-500/40 bg-green-500/5" : "border-muted"}`}>
                      <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-muted">{h.name}</span>
                        <span>{h.apiStatus}</span>
                      </div>
                      {h.snippet && <pre className="mt-1 bg-background/60 rounded p-1.5 overflow-auto max-h-32 whitespace-pre-wrap break-all font-mono text-[10px]">{h.snippet}</pre>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {pingResult && (
            <div className={`rounded-lg border p-3 text-xs ${pingResult.ok ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {pingResult.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                <span className="font-mono text-[11px]">{pingResult.method ?? "GET"} {pingResult.path ?? ""}</span>
                {pingResult.winner && (
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-green-600/20 text-green-700">
                    header aceito: {pingResult.winner.header ?? "(nenhum)"} → {pingResult.winner.status}
                  </span>
                )}
              </div>
              {pingResult.error && (
                <pre className="text-destructive whitespace-pre-wrap break-all mb-2 bg-destructive/5 rounded p-2">{pingResult.error}</pre>
              )}
              {pingResult.attempts && pingResult.attempts.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Tentativas</div>
                  {pingResult.attempts.map((a, i) => (
                    <div key={i} className={`rounded border p-2 ${a.ok ? "border-green-500/40 bg-green-500/5" : "border-muted"}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="font-mono text-[11px]">{a.header ?? "(sem header)"}</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted">{a.status || "—"}</span>
                        <span className="text-[10px] text-muted-foreground">{a.durationMs}ms</span>
                      </div>
                      {a.snippet && (
                        <pre className="mt-1 bg-background/60 rounded p-1.5 overflow-auto max-h-40 whitespace-pre-wrap break-all font-mono text-[10px]">{a.snippet}</pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Endpoint Explorer */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <Compass className="h-4 w-4 text-white" />
            </div>
            Endpoint Explorer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Testa qualquer endpoint da EAI usando OAuth + company-token já configurados. Use os presets ou um caminho customizado.
          </p>

          {/* Presets */}
          <div>
            <div className="text-[10px] uppercase text-muted-foreground mb-2">Presets MVNO</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ENDPOINT_PRESETS.map((p) => {
                const key = `${p.method ?? "GET"} ${p.path}`;
                const r = explorerResults[key];
                const loading = explorerLoading[key];
                const ok = r && r.status >= 200 && r.status < 300;
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-2.5 text-xs space-y-1.5 ${
                      r ? (ok ? "border-green-500/40 bg-green-500/5" : "border-destructive/30 bg-destructive/5") : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{p.label}</div>
                        <div className="font-mono text-[10px] text-muted-foreground truncate">{p.path}</div>
                        {p.description && <div className="text-[10px] text-muted-foreground mt-0.5">{p.description}</div>}
                      </div>
                      <Button size="sm" variant="outline" disabled={loading} onClick={() => tryEndpoint(p.path, p.method ?? "GET")} className="h-7 px-2 shrink-0">
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      </Button>
                    </div>
                    {r && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          {ok ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <XCircle className="h-3 w-3 text-destructive" />}
                          <span className="px-1 py-0.5 rounded bg-muted">{r.status || "—"}</span>
                          <span className="text-muted-foreground">{r.durationMs}ms</span>
                        </div>
                        {r.snippet && (
                          <pre className="bg-background/60 rounded p-1.5 overflow-auto max-h-32 whitespace-pre-wrap break-all font-mono text-[10px]">{r.snippet}</pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom */}
          <div className="space-y-2 pt-2 border-t">
            <div className="text-[10px] uppercase text-muted-foreground">Caminho customizado</div>
            <div className="flex gap-2">
              <Select value={customMethod} onValueChange={(v) => setCustomMethod(v as "GET" | "POST")}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="/rest/service_eai/..."
                className="font-mono text-xs"
              />
              <Button
                onClick={() => tryEndpoint(customPath, customMethod)}
                disabled={!customPath.startsWith("/") || explorerLoading[`${customMethod} ${customPath}`]}
                className="gap-1.5"
              >
                {explorerLoading[`${customMethod} ${customPath}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar
              </Button>
            </div>
            {(() => {
              const key = `${customMethod} ${customPath}`;
              const r = explorerResults[key];
              if (!r) return null;
              const ok = r.status >= 200 && r.status < 300;
              return (
                <div className={`rounded-lg border p-3 text-xs space-y-2 ${ok ? "border-green-500/40 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    <span>{r.method} {r.path}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted">{r.status || "—"}</span>
                    <span className="text-muted-foreground">{r.durationMs}ms</span>
                  </div>
                  {r.snippet && (
                    <pre className="bg-background/60 rounded p-2 overflow-auto max-h-64 whitespace-pre-wrap break-all font-mono text-[10px]">{r.snippet}</pre>
                  )}
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <ScrollText className="h-4 w-4 text-white" />
            </div>
            Logs recentes (50 últimas chamadas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma chamada registrada ainda.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {logs.map((l: any) => {
                const ok = l.status && l.status >= 200 && l.status < 300 && !l.error;
                return (
                  <details key={l.id} className="rounded-lg border bg-card text-xs">
                    <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none">
                      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                      <span className="font-mono">{l.method}</span>
                      <span className="font-mono truncate flex-1">{l.path}</span>
                      <span className="font-mono">{l.status ?? "—"}</span>
                      <span className="text-muted-foreground">{l.duration_ms}ms</span>
                      <span className="text-muted-foreground hidden md:inline">{new Date(l.created_at).toLocaleString()}</span>
                    </summary>
                    <div className="px-3 pb-3 space-y-2">
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground mb-1">Action</div>
                        <code className="text-[11px]">{l.action}</code>
                      </div>
                      {l.response_body && (
                        <div>
                          <div className="text-[10px] uppercase text-muted-foreground mb-1">Response</div>
                          <pre className="bg-muted rounded p-2 overflow-auto whitespace-pre-wrap break-all">{l.response_body}</pre>
                        </div>
                      )}
                      {l.error && (
                        <div>
                          <div className="text-[10px] uppercase text-destructive mb-1">Erro</div>
                          <pre className="bg-destructive/5 text-destructive rounded p-2 overflow-auto whitespace-pre-wrap break-all">{l.error}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="rounded-lg border p-2 flex items-center gap-2">
      {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
      <div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-xs font-medium">{ok ? "OK" : "Pendente"}</div>
      </div>
    </div>
  );
}
