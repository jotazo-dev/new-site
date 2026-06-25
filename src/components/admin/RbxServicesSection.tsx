import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Wrench,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  AlertCircle,
  Info,
} from "lucide-react";

type ServicePerm = {
  id: string;
  version: "v1" | "v2";
  service_slug: string;
  service_label: string;
  service_type: "leitura" | "escrita";
  sort_order: number;
  enabled: boolean;
  last_test_at: string | null;
  last_test_status: string | null;
  last_test_error: string | null;
  last_test_latency_ms: number | null;
};

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function RbxServicesSection() {
  const qc = useQueryClient();
  const [testing, setTesting] = React.useState<string | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["rbx-service-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rbx_service_permissions" as any)
        .select("*")
        .order("version", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ServicePerm[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("rbx_service_permissions" as any)
        .update({ enabled } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: ["rbx-service-permissions"] });
      const prev = qc.getQueryData<ServicePerm[]>(["rbx-service-permissions"]);
      qc.setQueryData<ServicePerm[]>(["rbx-service-permissions"], (old) =>
        (old || []).map((s) => (s.id === id ? { ...s, enabled } : s)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["rbx-service-permissions"], ctx.prev);
      toast.error("Falha ao salvar permissão");
    },
  });

  const testService = async (svc: ServicePerm) => {
    setTesting(svc.id);
    try {
      const { data, error } = await supabase.functions.invoke("rbx-test-service", {
        body: { version: svc.version, service_slug: svc.service_slug },
      });
      if (error) throw error;
      const ok = (data as any)?.ok;
      const note = (data as any)?.note;
      if (ok) {
        toast.success(`${svc.service_label} — OK (${(data as any).latency_ms}ms)`, {
          description: note || undefined,
        });
      } else {
        toast.error(`${svc.service_label} — ${(data as any)?.error || "falhou"}`);
      }
      qc.invalidateQueries({ queryKey: ["rbx-service-permissions"] });
    } catch (e: any) {
      toast.error(e.message || "Falha no teste");
    } finally {
      setTesting(null);
    }
  };

  const renderList = (version: "v1" | "v2") => {
    const list = services.filter((s) => s.version === version);
    const activeCount = list.filter((s) => s.enabled).length;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {activeCount} de {list.length} serviços ativos
          </span>
          <span className="font-mono">
            Endpoint: {version === "v1" ? "/routerbox/ws/rbx_server_json.php" : "/routerbox/ws_json/ws_json.php"}
          </span>
        </div>

        <div className="grid gap-2">
          {list.map((svc) => {
            const isTesting = testing === svc.id;
            const lastOk = svc.last_test_status === "ok";
            const lastErr = svc.last_test_status === "error";
            const isWrite = svc.service_type === "escrita";

            return (
              <div
                key={svc.id}
                className={`rounded-lg border p-3 transition-colors ${
                  svc.enabled ? "bg-card" : "bg-muted/30 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{svc.service_label}</p>
                      <Badge
                        variant="outline"
                        className={
                          svc.service_type === "leitura"
                            ? "border-blue-300 text-blue-700 bg-blue-50 text-[10px] h-5"
                            : "border-amber-300 text-amber-700 bg-amber-50 text-[10px] h-5"
                        }
                      >
                        {svc.service_type}
                      </Badge>
                      {isWrite && (
                        <Badge variant="outline" className="border-muted text-muted-foreground text-[10px] h-5 gap-1">
                          <Info className="h-2.5 w-2.5" /> teste em modo dry-run
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                      {svc.service_slug}
                    </p>

                    {svc.last_test_at && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] flex-wrap">
                        {lastOk && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                        {lastErr && <XCircle className="h-3 w-3 text-red-600" />}
                        <span className={lastOk ? "text-emerald-700" : "text-red-700"}>
                          {lastOk ? "OK" : "Erro"}
                        </span>
                        {svc.last_test_latency_ms !== null && (
                          <span className="text-muted-foreground">· {svc.last_test_latency_ms}ms</span>
                        )}
                        <span className="text-muted-foreground">· {relativeTime(svc.last_test_at)}</span>
                        {lastErr && svc.last_test_error && (
                          <span className="text-red-600 truncate" title={svc.last_test_error}>
                            · {svc.last_test_error}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {svc.enabled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testService(svc)}
                        disabled={isTesting}
                        className="h-8 gap-1.5 text-xs"
                      >
                        {isTesting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        Testar
                      </Button>
                    )}
                    <Switch
                      checked={svc.enabled}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: svc.id, enabled: v })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle
          className="flex items-center gap-2 text-base"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          Serviços de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              Catálogo oficial RBX Soft — 8 serviços v1 + 14 serviços v2 (categoria <strong>Atendimentos</strong>).
            </p>
            <p className="opacity-80">
              Os toggles funcionam como uma <strong>whitelist local</strong>: serviços desativados não serão chamados pelo nosso código. Para que o teste funcione, o serviço também precisa estar habilitado para a chave no painel RBX (Empresa → Parâmetros → Web Services).
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando serviços...
          </div>
        ) : (
          <Tabs defaultValue="v1" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-xs">
              <TabsTrigger value="v1">
                v1 ({services.filter((s) => s.version === "v1").length})
              </TabsTrigger>
              <TabsTrigger value="v2">
                v2 ({services.filter((s) => s.version === "v2").length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="v1" className="mt-4">
              {renderList("v1")}
            </TabsContent>
            <TabsContent value="v2" className="mt-4">
              {renderList("v2")}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
