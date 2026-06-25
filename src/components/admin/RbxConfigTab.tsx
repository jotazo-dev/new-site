import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Server,
  Save,
  Plug,
  TestTube,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { RbxServicesSection } from "./RbxServicesSection";
import { InvoiceExtractionTests } from "./RbxInvoiceExtractionTests";

type RbxConfig = {
  id: string;
  base_url: string;
  auth_key_v1: string;
  auth_key_v2: string;
  environment: string;
  active: boolean;
  last_test_at: string | null;
  last_test_status: string;
};

export function RbxConfigTab() {
  const qc = useQueryClient();
  const [form, setForm] = React.useState({
    base_url: "",
    auth_key_v1: "",
    auth_key_v2: "",
    environment: "homologacao",
    active: true,
  });
  const [configId, setConfigId] = React.useState<string | null>(null);
  const [showV1, setShowV1] = React.useState(false);
  const [showV2, setShowV2] = React.useState(false);
  type VersionResult = {
    ok: boolean;
    version: "v1" | "v2";
    latency_ms?: number;
    method_name?: string;
    header_variant?: string;
    status?: number;
    body_preview?: string;
    error?: string;
    attempts_count?: number;
    skipped?: boolean;
  };
  const [testResult, setTestResult] = React.useState<{
    ok: boolean;
    error?: string;
    v1?: VersionResult;
    v2?: VersionResult;
  } | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["rbx-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rbx_config" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as RbxConfig | null;
    },
  });

  React.useEffect(() => {
    if (config) {
      setForm({
        base_url: config.base_url,
        auth_key_v1: config.auth_key_v1,
        auth_key_v2: config.auth_key_v2,
        environment: config.environment,
        active: config.active,
      });
      setConfigId(config.id);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (configId) {
        const { error } = await supabase
          .from("rbx_config" as any)
          .update(form as any)
          .eq("id", configId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("rbx_config" as any)
          .insert(form as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rbx-config"] });
      toast.success("Configuração RBX salva!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("rbx-test-connection", {
        body: {
          base_url: form.base_url,
          auth_key_v1: form.auth_key_v1,
          auth_key_v2: form.auth_key_v2,
        },
      });
      if (error) throw error;
      return data as { ok: boolean; error?: string; v1?: VersionResult; v2?: VersionResult };
    },
    onSuccess: (data) => {
      setTestResult(data);
      const v1ok = data.v1?.ok;
      const v2ok = data.v2?.ok;
      if (data.ok) {
        toast.success(`Conexão OK — v1 e v2 funcionando`);
        if (configId) {
          supabase
            .from("rbx_config" as any)
            .update({ last_test_at: new Date().toISOString(), last_test_status: "ok" } as any)
            .eq("id", configId)
            .then();
        }
      } else {
        const parts: string[] = [];
        if (data.v1 && !data.v1.skipped) parts.push(`v1: ${v1ok ? "OK" : "falhou"}`);
        if (data.v2 && !data.v2.skipped) parts.push(`v2: ${v2ok ? "OK" : "falhou"}`);
        toast.error(`Falha parcial — ${parts.join(" • ") || data.error || "verifique credenciais"}`);
        if (configId) {
          supabase
            .from("rbx_config" as any)
            .update({
              last_test_at: new Date().toISOString(),
              last_test_status: v1ok || v2ok ? "partial" : "error",
            } as any)
            .eq("id", configId)
            .then();
        }
      }
    },
    onError: (e: any) => {
      setTestResult({ ok: false, error: e.message });
      toast.error(e.message);
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-10 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Credentials */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <Server className="h-4 w-4 text-white" />
            </div>
            Credenciais RBX Soft
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">URL Base do Servidor RBX</Label>
            <Input
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              placeholder="https://seuservidor.rbxsoft.com"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Chave de Integração v1</Label>
            <div className="flex gap-2">
              <Input
                type={showV1 ? "text" : "password"}
                value={form.auth_key_v1}
                onChange={(e) => setForm({ ...form, auth_key_v1: e.target.value })}
                placeholder="Chave v1..."
              />
              <Button variant="outline" size="icon" onClick={() => setShowV1(!showV1)}>
                {showV1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Chave de Integração v2</Label>
            <div className="flex gap-2">
              <Input
                type={showV2 ? "text" : "password"}
                value={form.auth_key_v2}
                onChange={(e) => setForm({ ...form, auth_key_v2: e.target.value })}
                placeholder="Chave v2..."
              />
              <Button variant="outline" size="icon" onClick={() => setShowV2(!showV2)}>
                {showV2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ambiente</Label>
              <Select value={form.environment} onValueChange={(v) => setForm({ ...form, environment: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Integração ativa</Label>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <span className="text-sm text-muted-foreground">{form.active ? "Ativa" : "Inativa"}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white shadow-lg shadow-primary/25"
          >
            <Save className="h-4 w-4 mr-1" />
            {saveMutation.isPending ? "Salvando..." : "Salvar configuração"}
          </Button>
        </CardContent>
      </Card>

      {/* Connection Test */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <TestTube className="h-4 w-4 text-white" />
            </div>
            Teste de Conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Teste a conexão com o servidor RBX usando as credenciais preenchidas acima (não é necessário salvar antes).
          </p>

          <Button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending || !form.base_url}
            variant="outline"
            className="gap-2"
          >
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plug className="h-4 w-4" />
            )}
            {testMutation.isPending ? "Testando..." : "Testar Conexão"}
          </Button>

          {testResult && (
            <div className="space-y-3">
              <div
                className={`rounded-lg border p-3 text-sm ${
                  testResult.ok
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <p className="font-medium flex items-center gap-2">
                  {testResult.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-600" />
                  )}
                  {testResult.ok
                    ? "Integração 100% operacional (v1 + v2)"
                    : "Integração incompleta — verifique os detalhes abaixo"}
                </p>
                {testResult.error && !testResult.v1 && !testResult.v2 && (
                  <p className="mt-1 opacity-80">Erro: {testResult.error}</p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(["v1", "v2"] as const).map((v) => {
                  const r = testResult[v];
                  if (!r) return null;
                  const isOk = r.ok;
                  const isSkipped = r.skipped;
                  return (
                    <div
                      key={v}
                      className={`rounded-lg border p-3 text-sm ${
                        isSkipped
                          ? "bg-muted/40 border-border text-muted-foreground"
                          : isOk
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      <p className="font-semibold flex items-center gap-2 uppercase text-xs tracking-wide">
                        {isSkipped ? (
                          <Info className="h-4 w-4" />
                        ) : isOk ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        API {v.toUpperCase()} {isSkipped ? "— não testada" : isOk ? "— OK" : "— falhou"}
                      </p>
                      {r.latency_ms !== undefined && (
                        <p className="mt-1 flex items-center gap-1 opacity-80 text-xs">
                          <Clock className="h-3 w-3" /> {r.latency_ms}ms
                        </p>
                      )}
                      {r.method_name && (
                        <p className="mt-0.5 opacity-80 text-xs">
                          Método: {r.method_name}
                          {r.header_variant && r.header_variant !== "—" && ` • Header: ${r.header_variant}`}
                        </p>
                      )}
                      {r.status !== undefined && !isOk && (
                        <p className="mt-0.5 opacity-80 text-xs">Status HTTP: {r.status}</p>
                      )}
                      {r.error && (
                        <p className="mt-1 opacity-80 text-xs">Erro: {r.error}</p>
                      )}
                      {r.body_preview && !isOk && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium opacity-80 hover:opacity-100">
                            Ver resposta bruta
                          </summary>
                          <pre className="mt-1 text-xs bg-white/60 border border-red-200 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                            {r.body_preview}
                          </pre>
                        </details>
                      )}
                      {!isOk && r.status === 412 && (
                        <div className="mt-2 text-xs bg-white/60 border border-red-200 rounded p-2">
                          <strong>Dica (412 — "Invalid service"):</strong> A chave v2 está ativa, mas o serviço usado para o teste (<code>get_tickets_mode</code>) não está liberado. No RBX Soft, vá em <strong>Empresa → Parâmetros → Web Services</strong>, edite a chave v2 e marque pelo menos um serviço de consulta (ex.: "Consulta modos de atendimento").
                        </div>
                      )}
                      {r.attempts_count !== undefined && r.attempts_count > 1 && (
                        <p className="mt-1 text-xs opacity-60">
                          {r.attempts_count} tentativa(s) realizadas.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {config?.last_test_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Último teste: {new Date(config.last_test_at).toLocaleString("pt-BR")} — Status: {config.last_test_status || "—"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Serviços de Atendimento (v1 + v2) */}
      <RbxServicesSection />

      {/* Testes de integração: extração de PDF / linha digitável / PIX */}
      <InvoiceExtractionTests />

      {/* Info */}
      <Card className="border shadow-sm border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-medium">Onde encontrar as chaves?</p>
            <p>No RBX Soft, acesse <strong>Empresa → Parâmetros → Web Services</strong>. Lá você encontra as chaves de integração v1 e v2, e pode configurar permissões por serviço.</p>
            <p className="opacity-80">Em homologação, validações são reais mas os cadastros não persistem. Em produção, todos os dados são permanentes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
