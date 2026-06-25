import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WEBHOOK_EVENTS, buildEnvelopeSample } from "@/config/webhookEvents";
import type { WebhookEndpoint } from "./AutomationTab";

interface Props {
  endpoint: WebhookEndpoint;
  open: boolean;
  onClose: () => void;
}

export function TestEventDialog({ endpoint, open, onClose }: Props) {
  const subscribed = endpoint.events.includes("*")
    ? WEBHOOK_EVENTS
    : WEBHOOK_EVENTS.filter((e) => endpoint.events.includes(e.id));
  const [eventId, setEventId] = useState(subscribed[0]?.id ?? WEBHOOK_EVENTS[0].id);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      const sample = buildEnvelopeSample(eventId).data;
      const { error } = await supabase.functions.invoke("webhook-test", {
        body: { endpointId: endpoint.id, event: eventId, sampleData: sample },
      });
      if (error) throw error;
      toast.success("Evento de teste enfileirado. Veja em Logs.");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar evento de teste</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Será enviado um payload de exemplo para <code className="text-foreground">{endpoint.url}</code> com a marcação <code>"test": true</code>.
          </p>
          <div className="space-y-1">
            <Label className="text-xs">Evento</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(subscribed.length > 0 ? subscribed : WEBHOOK_EVENTS).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.label} <span className="text-muted-foreground ml-1">({e.id})</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={send} disabled={sending}>{sending ? "Enviando..." : "Enviar teste"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
