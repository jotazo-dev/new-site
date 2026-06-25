import { useState } from "react";
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_GROUPS, buildEnvelopeSample } from "@/config/webhookEvents";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Eye } from "lucide-react";
import { toast } from "sonner";

export function EventCatalog() {
  const [previewing, setPreviewing] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-muted/30 border p-3 text-xs space-y-1">
        <p className="font-medium">Envelope padrão (todo evento)</p>
        <pre className="bg-background border rounded p-2 overflow-x-auto">{`{
  "id": "evt_...",
  "event": "<nome.do.evento>",
  "created_at": "ISO-8601",
  "api_version": "2026-06-21",
  "delivery_attempt": 1,
  "data": { ... }
}`}</pre>
        <p className="text-muted-foreground">
          Headers enviados: <code>X-Webhook-Event</code>, <code>X-Webhook-Id</code>,
          <code> X-Webhook-Timestamp</code>, <code>X-Webhook-Signature: sha256=&lt;hmac&gt;</code>.
          A assinatura é HMAC-SHA256 de <code>timestamp + "." + body</code>.
        </p>
      </div>

      {WEBHOOK_EVENT_GROUPS.map((group) => {
        const list = WEBHOOK_EVENTS.filter((e) => e.group === group);
        return (
          <div key={group}>
            <h4 className="text-sm font-semibold mb-2">{group}</h4>
            <div className="border rounded-lg divide-y">
              {list.map((ev) => (
                <div key={ev.id} className="p-3 flex items-start justify-between gap-3 hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[11px]">{ev.id}</Badge>
                      <span className="text-sm font-medium">{ev.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setPreviewing(ev.id)} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Payload
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {previewing && (
        <Dialog open={true} onOpenChange={(o) => !o && setPreviewing(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm">{previewing}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(buildEnvelopeSample(previewing), null, 2));
                toast.success("Copiado");
              }} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copiar JSON
              </Button>
              <pre className="bg-muted/30 border rounded p-3 overflow-x-auto text-xs max-h-[60vh]">
{JSON.stringify(buildEnvelopeSample(previewing), null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
