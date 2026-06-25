import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_GROUPS, type WebhookEventGroup } from "@/config/webhookEvents";
import type { WebhookEndpoint } from "./AutomationTab";

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "whsec_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface Props {
  endpoint: WebhookEndpoint | null;
  open: boolean;
  onClose: () => void;
}

export function EndpointForm({ endpoint, open, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!endpoint;

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [active, setActive] = useState(true);
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [allEvents, setAllEvents] = useState(false);
  const [maxRetries, setMaxRetries] = useState(5);
  const [timeoutMs, setTimeoutMs] = useState(10000);
  const [headersText, setHeadersText] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (endpoint) {
      setName(endpoint.name);
      setUrl(endpoint.url);
      setActive(endpoint.active);
      setSecret(endpoint.secret);
      setAllEvents(endpoint.events.includes("*"));
      setSelectedEvents(endpoint.events.filter((e) => e !== "*"));
      setMaxRetries(endpoint.max_retries);
      setTimeoutMs(endpoint.timeout_ms);
      setHeadersText(JSON.stringify(endpoint.headers ?? {}, null, 2));
      setDescription(endpoint.description ?? "");
    } else {
      setName(""); setUrl(""); setActive(true);
      setSecret(generateSecret());
      setAllEvents(false); setSelectedEvents([]);
      setMaxRetries(5); setTimeoutMs(10000);
      setHeadersText("{}"); setDescription("");
    }
  }, [endpoint]);

  const grouped = useMemo(() => {
    const map: Record<WebhookEventGroup, typeof WEBHOOK_EVENTS> = { Pedidos: [], "Ativações": [], Leads: [] };
    WEBHOOK_EVENTS.forEach((e) => map[e.group].push(e));
    return map;
  }, []);

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Nome obrigatório");
      if (!/^https?:\/\//i.test(url)) throw new Error("URL deve começar com http(s)://");
      if (!allEvents && selectedEvents.length === 0) throw new Error("Selecione ao menos 1 evento");

      let headers: Record<string, string> = {};
      try { headers = headersText.trim() ? JSON.parse(headersText) : {}; }
      catch { throw new Error("Headers extras: JSON inválido"); }

      const events = allEvents ? ["*"] : selectedEvents;
      const payload = {
        name: name.trim(), url: url.trim(), active, secret,
        events, headers, max_retries: maxRetries, timeout_ms: timeoutMs,
        description: description.trim() || null,
      };

      if (isEdit && endpoint) {
        const { error } = await (supabase as any).from("webhook_endpoints").update(payload).eq("id", endpoint.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("webhook_endpoints").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhook_endpoints"] });
      toast.success(isEdit ? "Endpoint atualizado" : "Endpoint criado");
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleGroup = (group: WebhookEventGroup, checked: boolean) => {
    const ids = grouped[group].map((e) => e.id);
    setSelectedEvents((prev) => checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((i) => !ids.includes(i)));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar endpoint" : "Novo endpoint"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome interno</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Integração CRM" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch checked={active} onCheckedChange={setActive} />
                <span className="text-sm">{active ? "Ativo" : "Pausado"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">URL (https)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.exemplo.com/webhooks/jotazo" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Signing secret</Label>
            <div className="flex items-center gap-2">
              <Input type={showSecret ? "text" : "password"} value={secret} readOnly className="font-mono text-xs" />
              <Button type="button" size="icon" variant="ghost" onClick={() => setShowSecret((v) => !v)}>
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(secret); toast.success("Copiado"); }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => { setSecret(generateSecret()); toast.info("Novo secret gerado — lembre de salvar"); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Use este valor para validar a assinatura <code>X-Webhook-Signature</code> (HMAC-SHA256 de <code>timestamp.body</code>).</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Eventos</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="all-events" checked={allEvents} onCheckedChange={(v) => setAllEvents(!!v)} />
                <Label htmlFor="all-events" className="text-xs">Todos os eventos (*)</Label>
              </div>
            </div>

            {!allEvents && (
              <div className="border rounded-lg p-3 space-y-3 max-h-72 overflow-y-auto">
                {WEBHOOK_EVENT_GROUPS.map((group) => {
                  const ids = grouped[group].map((e) => e.id);
                  const allSelected = ids.every((i) => selectedEvents.includes(i));
                  return (
                    <div key={group}>
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox checked={allSelected} onCheckedChange={(v) => toggleGroup(group, !!v)} />
                        <span className="text-sm font-medium">{group}</span>
                      </div>
                      <div className="space-y-1 pl-6">
                        {grouped[group].map((ev) => (
                          <div key={ev.id} className="flex items-start gap-2">
                            <Checkbox
                              id={ev.id}
                              checked={selectedEvents.includes(ev.id)}
                              onCheckedChange={(v) => {
                                setSelectedEvents((prev) => v ? [...prev, ev.id] : prev.filter((i) => i !== ev.id));
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={ev.id} className="text-xs cursor-pointer">{ev.label}</Label>
                              <div className="text-[11px] text-muted-foreground font-mono">{ev.id}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Retentativas (0–10)</Label>
              <Input type="number" min={0} max={10} value={maxRetries} onChange={(e) => setMaxRetries(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Timeout (ms, 1000–30000)</Label>
              <Input type="number" min={1000} max={30000} step={500} value={timeoutMs} onChange={(e) => setTimeoutMs(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Headers extras (JSON)</Label>
            <Textarea value={headersText} onChange={(e) => setHeadersText(e.target.value)} className="font-mono text-xs" rows={3} placeholder='{"X-Custom-Token": "..."}' />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descrição (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
