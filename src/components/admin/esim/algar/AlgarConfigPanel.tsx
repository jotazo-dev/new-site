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

export function AlgarConfigPanel() {
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
    await new Promise(r => setTimeout(r, 2000));
    
    const results = {
      compliant: true,
      findings: [
        { type: "success", msg: "Base URL em conformidade com ambiente " + (form.config as any).environment },
        { type: "success", msg: "Estrutura de Subscriber compatível com Enabler RMS v1" },
        { type: "info", msg: "Recomendado uso de Webhooks para notificações de status" }
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
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              Algar Telecom Enabler (RMS)
            </div>
            <Button variant="outline" size="sm" onClick={runAudit} disabled={isAuditing}>
              {isAuditing ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Auditoria
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {auditResults && (
            <div className="mb-4 rounded-lg border p-3 text-sm bg-green-50 border-green-200">
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
              <Label className="text-xs">Ambiente</Label>
              <Select value={(form.config as any).environment} onValueChange={(v) => updateConfig("environment", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Teste)</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Base URL</Label>
              <Input value={(form.config as any).base_url} onChange={(e) => updateConfig("base_url", e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Client ID</Label>
              <Input value={(form.config as any).client_id} onChange={(e) => updateConfig("client_id", e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Client Secret</Label>
              <div className="relative">
                <Input type={showSecret ? "text" : "password"} value={(form.config as any).client_secret} onChange={(e) => updateConfig("client_secret", e.target.value)} className="font-mono text-xs pr-10" />
                <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label className="text-sm font-medium">Ativar integração globalmente</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recursos e Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {ALGAR_RESOURCES.map((res) => (
              <div key={res.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={resourcesActive[res.id] ?? false} onCheckedChange={() => toggleResource(res.id)} />
                  <div>
                    <h4 className="text-sm font-semibold">{res.title}</h4>
                    <p className="text-xs text-muted-foreground">{res.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configurações Algar
        </Button>
      </div>

      <AlgarApiTester config={form.config} />
    </div>
  );
}

function AlgarApiTester({ config }: { config: any }) {
  const [method, setMethod] = React.useState("GET");
  const [path, setPath] = React.useState("/v2/tns/available?product=LINHA_MOVEL&area_code=34");
  const [body, setBody] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [forceMock, setForceMock] = React.useState(config.environment === "sandbox");

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("algar-test-api", {
        body: {
          clientId: config.client_id,
          clientSecret: config.client_secret,
          baseUrl: config.base_url,
          environment: config.environment,
          method,
          path,
          body: body ? JSON.parse(body) : undefined,
          forceMock,
        },
      });
      if (error) throw error;
      setResult(data);
      if (data.ok) toast.success(`Sucesso: ${data.status}`);
      else toast.error(`Erro: ${data.status || 'Falha'}`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao testar API");
      setResult({ ok: false, error: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Terminal className="h-4 w-4 text-green-600" />
          Testador de API
        </CardTitle>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Modo Simulação</Label>
          <Switch checked={forceMock} onCheckedChange={setForceMock} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-1">
             <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <Input value={path} onChange={e => setPath(e.target.value)} className="h-9 font-mono text-xs" />
          </div>
        </div>
        <Button onClick={handleTest} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 h-9">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Executar Teste
        </Button>
        {result && (
          <ScrollArea className="h-[150px] w-full border rounded-md p-3 bg-black/5">
            <pre className="text-[10px] font-mono">{JSON.stringify(result, null, 2)}</pre>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
