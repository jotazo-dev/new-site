import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import type { WebhookEndpoint } from "./AutomationTab";

interface Props {
  endpoint: WebhookEndpoint;
  open: boolean;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-amber-500" },
  in_progress: { label: "Em curso", className: "bg-blue-500" },
  success: { label: "Sucesso", className: "bg-green-500" },
  failed: { label: "Falhou (retry)", className: "bg-orange-500" },
  dead: { label: "Esgotado", className: "bg-red-500" },
};

export function EndpointLogsDrawer({ endpoint, open, onClose }: Props) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: deliveries = [], isLoading, refetch } = useQuery({
    queryKey: ["webhook_deliveries", endpoint.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("webhook_deliveries")
        .select("*")
        .eq("endpoint_id", endpoint.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
    enabled: open,
  });

  const replay = useMutation({
    mutationFn: async (deliveryId: string) => {
      const { error } = await supabase.functions.invoke("webhook-replay", { body: { deliveryId } });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reenviado para a fila");
      setTimeout(() => qc.invalidateQueries({ queryKey: ["webhook_deliveries", endpoint.id] }), 1500);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Logs · {endpoint.name}</span>
            <Button size="sm" variant="ghost" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </SheetTitle>
          <p className="text-xs text-muted-foreground truncate">{endpoint.url}</p>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
          {!isLoading && deliveries.length === 0 && (
            <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
              Nenhuma entrega ainda.
            </div>
          )}
          {deliveries.map((d) => {
            const st = STATUS_LABEL[d.status] ?? { label: d.status, className: "bg-gray-500" };
            const open = expanded === d.id;
            return (
              <div key={d.id} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full p-3 flex items-center justify-between gap-3 hover:bg-muted/30 text-left"
                  onClick={() => setExpanded(open ? null : d.id)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge className={`${st.className} text-white hover:${st.className}`}>{st.label}</Badge>
                    <span className="font-mono text-xs truncate">{d.event}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 flex-shrink-0">
                    <span>HTTP {d.last_status_code ?? "—"}</span>
                    <span>{d.attempts} tent.</span>
                    <span>{d.duration_ms ? `${d.duration_ms}ms` : ""}</span>
                    <span>{new Date(d.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                </button>
                {open && (
                  <div className="border-t bg-muted/20 p-3 space-y-2 text-xs">
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => replay.mutate(d.id)} disabled={replay.isPending} className="gap-1.5">
                        <RotateCcw className="h-3 w-3" /> Reenviar
                      </Button>
                    </div>
                    {d.last_error && (
                      <div>
                        <div className="font-medium text-destructive mb-1">Erro</div>
                        <pre className="bg-background border rounded p-2 overflow-x-auto">{d.last_error}</pre>
                      </div>
                    )}
                    {d.last_response && (
                      <div>
                        <div className="font-medium mb-1">Resposta</div>
                        <pre className="bg-background border rounded p-2 overflow-x-auto max-h-48">{d.last_response}</pre>
                      </div>
                    )}
                    <div>
                      <div className="font-medium mb-1">Payload enviado</div>
                      <pre className="bg-background border rounded p-2 overflow-x-auto max-h-64">{JSON.stringify(d.payload, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
