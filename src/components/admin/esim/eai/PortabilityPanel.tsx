import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowRightLeft, Plus, History, Search, RefreshCw, CheckCircle2, Circle } from "lucide-react";
import { eaiCall, extractList, formatMsisdn, formatDate, statusTone, statusClasses } from "./eaiClient";
import { toast } from "sonner";

const CARRIERS = [
  { code: "VIVO", label: "Vivo" },
  { code: "CLARO", label: "Claro" },
  { code: "TIM", label: "TIM" },
  { code: "OI", label: "Oi" },
  { code: "ALGAR", label: "Algar" },
];

export function PortabilityPanel() {
  const [msisdn, setMsisdn] = useState("");
  const [carrier, setCarrier] = useState("VIVO");
  const [iccid, setIccid] = useState("");
  const [planId, setPlanId] = useState("");
  const [statusLineId, setStatusLineId] = useState("");
  const [statusResult, setStatusResult] = useState<any | null>(null);
  const [history, setHistory] = useState<{ id: string; events: any[] } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["eai", "portabilities"],
    queryFn: () => eaiCall<any>("/rest/service_eai/mvno_portabilities"),
  });

  async function create() {
    if (!msisdn || !iccid || !planId) return toast.error("Preencha MSISDN, ICCID e Plan ID");
    setLoading("create"); setErrorMsg(null);
    const r = await eaiCall<any>("/rest/service_eai/mvno_portabilities", {
      method: "POST",
      body: { msisdn, current_carrier: carrier, new_iccid: iccid, mvno_plan_id: planId },
    });
    setLoading(null);
    if (!r.ok) { setErrorMsg(`Erro ${r.status}`); toast.error("Falha"); return; }
    toast.success("Portabilidade solicitada");
    setMsisdn(""); setIccid(""); setPlanId("");
    list.refetch();
  }

  async function openHistory(id: string) {
    setLoading("hist:" + id);
    const r = await eaiCall<any>(`/rest/service_eai/mvno_portabilities/${id}/history`);
    setLoading(null);
    if (!r.ok) { toast.error(`Erro ${r.status}`); return; }
    const events = extractList(r);
    setHistory({ id, events });
  }

  async function statusByLine() {
    if (!statusLineId) return toast.error("Informe o Line ID");
    setLoading("status"); setErrorMsg(null);
    const r = await eaiCall<any>(`/rest/service_eai/mvno_portability_status_by_line/${statusLineId}`);
    setLoading(null);
    if (!r.ok) { setErrorMsg(`Erro ${r.status}`); toast.error("Falha"); return; }
    setStatusResult(r.json?.data ?? r.json);
  }

  const items = extractList(list.data);

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /><h3 className="font-semibold">Nova portabilidade</h3></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>MSISDN a portar *</Label>
            <Input value={msisdn} onChange={(e) => setMsisdn(e.target.value.replace(/\D/g, ""))} placeholder="5511999999999" />
          </div>
          <div className="space-y-2">
            <Label>Operadora atual *</Label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded-md border border-input bg-background h-10 px-3 text-sm"
            >
              {CARRIERS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Novo ICCID *</Label>
            <Input value={iccid} onChange={(e) => setIccid(e.target.value)} placeholder="89550..." />
          </div>
          <div className="space-y-2">
            <Label>Plan ID *</Label>
            <Input value={planId} onChange={(e) => setPlanId(e.target.value)} />
          </div>
        </div>
        <Button onClick={create} disabled={loading === "create"}>
          {loading === "create" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
          Solicitar portabilidade
        </Button>
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <div className="flex items-center gap-2"><Search className="h-4 w-4 text-primary" /><h3 className="font-semibold">Status por Line ID</h3></div>
        <div className="flex gap-2">
          <Input value={statusLineId} onChange={(e) => setStatusLineId(e.target.value)} placeholder="Line ID" />
          <Button onClick={statusByLine} disabled={loading === "status"} variant="outline">
            {loading === "status" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Consultar"}
          </Button>
        </div>
        {statusResult && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status atual:</span>
              <Badge variant="outline" className={statusClasses(statusTone(statusResult.status))}>{statusResult.status ?? "—"}</Badge>
            </div>
            {statusResult.msisdn && <div className="text-sm">MSISDN: <span className="font-mono">{formatMsisdn(statusResult.msisdn)}</span></div>}
            {statusResult.message && <p className="text-sm text-muted-foreground">{statusResult.message}</p>}
          </div>
        )}
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Portabilidades em andamento</h3>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={() => list.refetch()} disabled={list.isFetching}>
            <RefreshCw className={`h-4 w-4 ${list.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {list.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma portabilidade.</p>
        ) : (
          <div className="space-y-2">
            {items.map((p: any, i: number) => {
              const tone = statusTone(p.status ?? p.state);
              return (
                <div key={p.id ?? i} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm">
                  <Badge variant="outline" className="text-[10px] font-mono">#{p.id ?? i + 1}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-medium truncate">{formatMsisdn(p.msisdn)}</div>
                    <div className="text-xs text-muted-foreground">{p.current_carrier ?? p.carrier ?? "—"}</div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusClasses(tone)}`}>{p.status ?? p.state ?? "—"}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => openHistory(String(p.id))} disabled={loading === "hist:" + p.id}>
                    {loading === "hist:" + p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {errorMsg && (
        <Card className="p-3 border-destructive/40 bg-destructive/5 text-sm text-destructive">{errorMsg}</Card>
      )}

      <Dialog open={!!history} onOpenChange={(o) => !o && setHistory(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico · Portabilidade #{history?.id}</DialogTitle>
          </DialogHeader>
          {history && <Timeline events={history.events} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Timeline({ events }: { events: any[] }) {
  if (!events || events.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Sem eventos registrados.</p>;
  }
  return (
    <ol className="relative border-l-2 border-border ml-3 space-y-4 py-2">
      {events.map((e: any, i: number) => {
        const tone = statusTone(e.status ?? e.event ?? e.type);
        const Icon = tone === "success" ? CheckCircle2 : Circle;
        return (
          <li key={i} className="ml-4">
            <span className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 ${
              tone === "success" ? "border-emerald-500 text-emerald-500"
                : tone === "warning" ? "border-amber-500 text-amber-500"
                : tone === "danger" ? "border-destructive text-destructive"
                : "border-muted-foreground text-muted-foreground"
            }`}>
              <Icon className="h-3 w-3" />
            </span>
            <div className="text-xs text-muted-foreground">{formatDate(e.date ?? e.created_at ?? e.timestamp)}</div>
            <div className="text-sm font-medium">{e.status ?? e.event ?? e.type ?? "—"}</div>
            {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
            {e.message && !e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.message}</p>}
          </li>
        );
      })}
    </ol>
  );
}
