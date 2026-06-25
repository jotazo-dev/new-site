import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, Plus, Pencil, Trash2, Activity, PlayCircle, BookOpen, Power } from "lucide-react";
import { toast } from "sonner";
import { EndpointForm } from "./EndpointForm";
import { EndpointLogsDrawer } from "./EndpointLogsDrawer";
import { EventCatalog } from "./EventCatalog";
import { TestEventDialog } from "./TestEventDialog";

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  active: boolean;
  events: string[];
  headers: Record<string, string>;
  max_retries: number;
  timeout_ms: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function AutomationTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<WebhookEndpoint | null>(null);
  const [creating, setCreating] = useState(false);
  const [logsFor, setLogsFor] = useState<WebhookEndpoint | null>(null);
  const [testingFor, setTestingFor] = useState<WebhookEndpoint | null>(null);

  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ["webhook_endpoints"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("webhook_endpoints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WebhookEndpoint[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (ep: WebhookEndpoint) => {
      const { error } = await (supabase as any)
        .from("webhook_endpoints")
        .update({ active: !ep.active })
        .eq("id", ep.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook_endpoints"] });
      toast.success("Status atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeEndpoint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("webhook_endpoints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook_endpoints"] });
      toast.success("Endpoint removido");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <Webhook className="h-4 w-4 text-white" />
            </div>
            Webhooks de saída
          </CardTitle>
          <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo endpoint
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cadastre URLs que receberão eventos do site em tempo real (pedidos, ativações, leads).
            Cada endpoint recebe um <strong>signing secret</strong> exclusivo para validar assinatura HMAC-SHA256.
          </p>

          {isLoading && <div className="text-sm text-muted-foreground py-4">Carregando...</div>}

          {!isLoading && endpoints.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum endpoint configurado. Clique em <strong>Novo endpoint</strong> para começar.
            </div>
          )}

          <div className="space-y-2">
            {endpoints.map((ep) => (
              <div key={ep.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={ep.active ? "default" : "secondary"} className={ep.active ? "bg-green-500 hover:bg-green-600" : ""}>
                      {ep.active ? "Ativo" : "Pausado"}
                    </Badge>
                    <span className="font-medium text-sm truncate">{ep.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{ep.url}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ep.events.includes("*") ? "Todos os eventos" : `${ep.events.length} evento${ep.events.length !== 1 ? "s" : ""}`} ·
                    {" "}retries: {ep.max_retries} · timeout: {Math.round(ep.timeout_ms / 1000)}s
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => toggleActive.mutate(ep)} title={ep.active ? "Pausar" : "Ativar"}>
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setTestingFor(ep)} title="Testar">
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setLogsFor(ep)} title="Logs">
                    <Activity className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(ep)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => {
                    if (confirm(`Remover endpoint "${ep.name}"?`)) removeEndpoint.mutate(ep.id);
                  }} title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            Catálogo de eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EventCatalog />
        </CardContent>
      </Card>

      {(creating || editing) && (
        <EndpointForm
          endpoint={editing}
          open={true}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
      {logsFor && (
        <EndpointLogsDrawer endpoint={logsFor} open={true} onClose={() => setLogsFor(null)} />
      )}
      {testingFor && (
        <TestEventDialog endpoint={testingFor} open={true} onClose={() => setTestingFor(null)} />
      )}
    </div>
  );
}
