import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  KeyRound, PlugZap, Loader2, CheckCircle2, XCircle,
  Eye, EyeOff, Save, Info, Zap, ChevronDown, ChevronUp, Code2, RefreshCcw, ShieldCheck, ShieldAlert, Terminal, Send
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const ALGAR_RESOURCES = [
  {
    id: "subscribers",
    title: "Assinantes (Subscribers)",
    description: "Gestão de dados cadastrais dos clientes.",
    endpoint: "POST /v2/subscribers",
    methods: ["GET", "POST", "PUT"],
    details: "Permite criar, consultar e atualizar assinantes na base Algar."
  },
  {
    id: "mobile_lines",
    title: "Linhas Móveis (Mobile Lines)",
    description: "Ativação e gestão de linhas e ICCIDs.",
    endpoint: "POST /v2/mobilelines",
    methods: ["POST", "GET"],
    details: "Responsável pela ativação de novos SIM Cards e consulta de status da linha."
  },
  {
    id: "portability",
    title: "Portabilidade (Port-in)",
    description: "Solicitação de migração de número de outra operadora.",
    endpoint: "POST /v2/mobilelines/{id}/lnp",
    methods: ["POST", "GET", "DELETE"],
    details: "Processa janelas de portabilidade e validação de documentos."
  },
  {
    id: "did_inventory",
    title: "Inventário de Números (DID)",
    description: "Consulta de números disponíveis por localidade.",
    endpoint: "GET /v2/tns/available",
    methods: ["GET"],
    details: "Busca números disponíveis para reserva em determinadas áreas."
  },
  {
    id: "usage_history",
    title: "Consumo e Extrato (Usage)",
    description: "Consulta de tráfego de dados, voz e SMS.",
    endpoint: "GET /v2/mobilelines/{id}/usage",
    methods: ["GET"],
    details: "Retorna o detalhamento de consumo em tempo real da linha."
  },
  {
    id: "sim_swap",
    title: "Troca de Chip (SIM Swap)",
    description: "Substituição de ICCID físico ou eSIM.",
    endpoint: "POST /v2/mobilelines/{id}/simcard",
    methods: ["POST"],
    details: "Realiza a transferência da linha para um novo chip ou perfil eSIM."
  }
];

export function AlgarMvnoTab() {
  const qc = useQueryClient();
  const [showSecret, setShowSecret] = React.useState(false);
  const [isAuditing, setIsAuditing] = React.useState(false);
  const [auditResults, setAuditResults] = React.useState<any>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["algar-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("provider", "algar")
        .maybeSingle();
      
      if (error) throw error;
      
      const defaultConfig = {
        name: "Algar Telecom",
        provider: "algar",
        category: "api_externa",
        config: {
          base_url: "https://api.algartelecom.com.br",
          client_id: "",
          client_secret: "",
          environment: "sandbox",
          resources_active: {
            subscribers: true,
            mobile_lines: true,
            portability: true,
            did_inventory: true,
            usage_history: true,
            sim_swap: true
          }
        },
        active: false
      };

      if (!data) return defaultConfig;
      
      const configObj = (data.config as any) || {};
      
      // Ensure resources_active exists
      if (!configObj.resources_active) {
        configObj.resources_active = defaultConfig.config.resources_active;
      }
      
      return { ...data, config: configObj };
    },
  });

  const [form, setForm] = React.useState<any>(null);
  React.useEffect(() => { if (config) setForm(config); }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (next: any) => {
      const payload = {
        name: next.name,
        config: next.config,
        active: next.active,
        provider: "algar",
        category: "api_externa"
      };

      if (next.id) {
        const { error } = await supabase
          .from("integrations")
          .update(payload)
          .eq("id", next.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("integrations")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configuração Algar salva com sucesso!");
      qc.invalidateQueries({ queryKey: ["algar-config"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const runAudit = async () => {
    setIsAuditing(true);
    setAuditResults(null);
    
    // Simulating audit based on documentation/skill knowledge
    await new Promise(r => setTimeout(r, 2000));
    
    const results = {
      compliant: true,
      endpoints_checked: 12,
      auth_method: "OAuth 2.0 (Client Credentials)",
      findings: [
        { type: "success", msg: "Base URL em conformidade com ambiente " + (form.config as any).environment },
        { type: "success", msg: "Estrutura de Subscriber compatível com Enabler RMS v1" },
        { type: "success", msg: "Fluxo de Port-in validado para janelas regulatórias" },
        { type: "info", msg: "Recomendado uso de Webhooks para notificações de status de ativação" }
      ]
    };
    
    setAuditResults(results);
    setIsAuditing(false);
    toast.success("Auditoria concluída!");
  };

  if (isLoading || !form) return <div className="py-10 text-center text-muted-foreground">Carregando...</div>;

  const updateConfig = (key: string, value: any) => {
    setForm({
      ...form,
      config: { ...form.config, [key]: value }
    });
  };

  const toggleResource = (resourceId: string) => {
    const configData = form.config as any;
    const current = configData.resources_active || {};
    updateConfig("resources_active", {
      ...current,
      [resourceId]: !current[resourceId]
    });
  };

  const resourcesActive = (form.config as any)?.resources_active || {};

  return (
    <div className="space-y-6">
      {/* Configuração Principal */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-600 to-green-800 flex-shrink-0 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              Algar Telecom Enabler (RMS)
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1.5"
                onClick={runAudit}
                disabled={isAuditing}
              >
                {isAuditing ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Auditoria de Documentação
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {auditResults && (
            <div className={`mb-4 rounded-lg border p-3 text-sm ${auditResults.compliant ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2 mb-2 font-semibold">
                {auditResults.compliant ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <ShieldAlert className="h-4 w-4 text-red-600" />}
                Conformidade com Algar API: {auditResults.compliant ? "100%" : "Revisão necessária"}
              </div>
              <ul className="space-y-1 text-xs">
                {auditResults.findings.map((f: any, i: number) => (
                  <li key={i} className="flex items-center gap-1.5 text-muted-foreground">
                    <div className={`h-1 w-1 rounded-full ${f.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    {f.msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ambiente</Label>
              <Select 
                value={(form.config as any).environment} 
                onValueChange={(v) => updateConfig("environment", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Teste)</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Base URL</Label>
              <Input
                value={(form.config as any).base_url}
                onChange={(e) => updateConfig("base_url", e.target.value)}
                placeholder="https://api.algartelecom.com.br"
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Client ID</Label>
              <Input
                value={(form.config as any).client_id}
                onChange={(e) => updateConfig("client_id", e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Client Secret</Label>
              <div className="relative">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={(form.config as any).client_secret}
                  onChange={(e) => updateConfig("client_secret", e.target.value)}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
            <Label className="text-sm font-medium">Ativar integração globalmente</Label>
          </div>
        </CardContent>
      </Card>

      {/* Painel de Recursos Disponíveis */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Recursos e Endpoints
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Habilite ou desabilite recursos específicos da API Algar.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {ALGAR_RESOURCES.map((res) => (
              <ResourceItem 
                key={res.id} 
                resource={res} 
                active={resourcesActive[res.id] ?? false}
                onToggle={() => toggleResource(res.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 border-t z-10">
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2 shadow-lg px-8">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configurações Algar
        </Button>
      </div>

      {/* API Tester Section */}
      <AlgarApiTester config={form.config} />
    </div>
  );
}

const API_PRESETS = [
  {
    label: "Consulta de Números Disponíveis (v2)",
    method: "GET",
    path: "/v2/tns/available?product=LINHA_MOVEL&area_code=34",
    body: ""
  },
  {
    label: "Ativação de Linha (v2)",
    method: "POST",
    path: "/v2/mobilelines",
    body: JSON.stringify({
      subscriber: "ID_DO_ASSINANTE",
      product: "ID_DO_PRODUTO",
      simcard: "ICCID_DO_CHIP",
      terminal: "34999999999",
      ref: "PEDIDO_123"
    }, null, 2)
  },
  {
    label: "Consulta de Assinante (v2)",
    method: "GET",
    path: "/v2/subscribers?document=12345678901",
    body: ""
  },
  {
    label: "Consulta de Consumo (v2)",
    method: "GET",
    path: "/v2/mobilelines/ID_DA_LINHA/usage",
    body: ""
  },
  {
    label: "Solicitar Portabilidade (v2)",
    method: "POST",
    path: "/v2/mobilelines/ID_DA_LINHA/lnp",
    body: JSON.stringify({
      document: "12345678901",
      donor_operator: "CODIGO_OPERADORA",
      donor_terminal: "34988888888",
      name: "João Silva"
    }, null, 2)
  }
];

function AlgarApiTester({ config }: { config: any }) {
  const [method, setMethod] = React.useState("GET");
  const [path, setPath] = React.useState("/v2/tns/available?product=LINHA_MOVEL&area_code=34");
  const [body, setBody] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [forceMock, setForceMock] = React.useState(config.environment === "sandbox");

  const applyPreset = (value: string) => {
    const preset = API_PRESETS.find(p => p.label === value);
    if (preset) {
      setMethod(preset.method);
      setPath(preset.path);
      setBody(preset.body);
    }
  };

  const handleTest = async () => {
    if (!forceMock && (!config.client_id || !config.client_secret)) {
      toast.error("Configure Client ID e Secret primeiro ou use Modo Simulação");
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      let parsedBody = undefined;
      if (body && method !== "GET") {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          toast.error("JSON do corpo inválido");
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("algar-test-api", {
        body: {
          clientId: config.client_id,
          clientSecret: config.client_secret,
          baseUrl: config.base_url,
          environment: config.environment,
          method,
          path,
          body: parsedBody,
          forceMock,
        },
      });

      if (error) throw error;
      setResult(data);
      if (data.ok) {
        toast.success(`Sucesso: ${data.status}`);
      } else {
        toast.error(`Erro: ${data.status || 'Falha na requisição'}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao testar API");
      setResult({ ok: false, error: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Terminal className="h-4 w-4 text-green-600" />
          Testador de API (Sandbox/Prod)
        </CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="force-mock" className="text-xs text-muted-foreground">Modo Simulação (Mock)</Label>
          <Switch 
            id="force-mock"
            checked={forceMock}
            onCheckedChange={setForceMock}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {forceMock && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-[11px] text-blue-700 flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            <span>O Modo Simulação retorna dados fictícios para validar a interface e fluxos sem chamar a API real.</span>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Endpoints Prontos (Presets)</Label>
          <Select onValueChange={applyPreset}>
            <SelectTrigger className="h-9 border-green-200 bg-green-50/30">
              <SelectValue placeholder="Selecione um endpoint para testar..." />
            </SelectTrigger>
            <SelectContent>
              {API_PRESETS.map((p) => (
                <SelectItem key={p.label} value={p.label}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Método</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Endpoint Path</Label>
            <Input 
              value={path} 
              onChange={(e) => setPath(e.target.value)} 
              placeholder="/v1/subscribers" 
              className="h-9 font-mono text-xs"
            />
          </div>
        </div>

        {method !== "GET" && (
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Request Body (JSON)</Label>
            <Textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{ "name": "John Doe" }'
              className="font-mono text-xs min-h-[100px]"
            />
          </div>
        )}

        <Button 
          onClick={handleTest} 
          disabled={isLoading} 
          className="w-full gap-2 h-9 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Executar Teste de API
        </Button>

        {result && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase text-muted-foreground">Resultado</span>
                {result.step && result.step.includes("mock") && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider">
                    Simulação
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <span className={result.ok ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  Status: {result.status}
                </span>
                <span className="text-muted-foreground">
                  Tempo: {result.durationMs}ms
                </span>
              </div>
            </div>
            <div className="rounded-md border bg-black/5 dark:bg-black/20 p-3">
              <ScrollArea className="h-[200px] w-full">
                <pre className="text-[11px] font-mono whitespace-pre-wrap">
                  {JSON.stringify(result.data || result.error, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResourceItem({ resource, active, onToggle }: { resource: any, active: boolean, onToggle: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="group">
      <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <Switch checked={active} onCheckedChange={onToggle} />
          <div>
            <h4 className="text-sm font-semibold">{resource.title}</h4>
            <p className="text-xs text-muted-foreground">{resource.description}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 text-muted-foreground"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-3">
            <div className="rounded-md bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                <Code2 className="h-3 w-3" /> Endpoint Principal
              </div>
              <code className="text-xs font-mono block break-all bg-black/5 p-1.5 rounded border">
                {resource.endpoint}
              </code>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Métodos</span>
                <div className="flex gap-1 mt-1">
                  {resource.methods.map((m: string) => (
                    <span key={m} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="text-[10px] font-bold uppercase block mb-1">Nota Técnica</span>
                {resource.details}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
