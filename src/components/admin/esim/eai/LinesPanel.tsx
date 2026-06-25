import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Phone, Activity, Calendar, FileBarChart, Search } from "lucide-react";
import { eaiCall, extractList, formatMsisdn, formatDate, statusTone, statusClasses, gb, brl } from "./eaiClient";
import { toast } from "sonner";

export function LinesPanel() {
  const [identifier, setIdentifier] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openLine, setOpenLine] = useState<any | null>(null);

  async function search() {
    setLoading(true);
    setErrorMsg(null);
    const r = await eaiCall<any>("/rest/service_eai/mvno_lines", {
      query: identifier ? { msisdn: identifier } : undefined,
    });
    setLoading(false);
    if (!r.ok) {
      setItems([]);
      setErrorMsg(`Erro ${r.status || ""} ao buscar linhas.`);
      toast.error("Falha na busca");
      return;
    }
    const list = extractList(r);
    setItems(list);
    if (list.length === 0) toast.info("Nenhuma linha encontrada");
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl space-y-3">
        <Label>MSISDN (deixe vazio para listar todas)</Label>
        <div className="flex gap-2">
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ""))}
            placeholder="5511999999999"
            maxLength={13}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <Button onClick={search} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Buscar
          </Button>
        </div>
      </Card>

      {errorMsg && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">{errorMsg}</Card>
      )}

      {items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((line, i) => {
            const tone = statusTone(line.status);
            return (
              <button
                key={line.id ?? i}
                onClick={() => setOpenLine(line)}
                className="text-left"
              >
                <Card className="p-4 rounded-2xl hover:shadow-md hover:border-primary/40 transition cursor-pointer space-y-2 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-mono font-semibold text-sm">{formatMsisdn(line.msisdn)}</span>
                    </div>
                    {line.status && (
                      <Badge variant="outline" className={`text-[10px] ${statusClasses(tone)}`}>{line.status}</Badge>
                    )}
                  </div>
                  {line.plan_name || line.mvno_plan_name ? (
                    <div className="text-xs"><span className="text-muted-foreground">Plano: </span>{line.plan_name || line.mvno_plan_name}</div>
                  ) : null}
                  {line.iccid && (
                    <div className="text-xs text-muted-foreground truncate"><span>ICCID: </span><code className="text-foreground">{line.iccid}</code></div>
                  )}
                  {line.id !== undefined && (
                    <div className="text-[10px] text-muted-foreground pt-1 border-t">ID: <code className="text-foreground">{String(line.id)}</code></div>
                  )}
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <LineDetailDialog line={openLine} onClose={() => setOpenLine(null)} />
    </div>
  );
}

function LineDetailDialog({ line, onClose }: { line: any | null; onClose: () => void }) {
  const open = !!line;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            {line ? formatMsisdn(line.msisdn) : ""}
          </DialogTitle>
        </DialogHeader>
        {line && <LineDetail line={line} />}
      </DialogContent>
    </Dialog>
  );
}

function LineDetail({ line }: { line: any }) {
  const id = line.id;
  const [tab, setTab] = useState("dados");
  const [data, setData] = useState<Record<string, any>>({ dados: line });
  const [loading, setLoading] = useState<string | null>(null);

  async function load(key: string, path: string) {
    if (data[key]) return;
    setLoading(key);
    const r = await eaiCall<any>(path);
    setLoading(null);
    if (r.ok) setData((d) => ({ ...d, [key]: r.json }));
    else toast.error(`Falha (${r.status})`);
  }

  return (
    <Tabs value={tab} onValueChange={(v) => {
      setTab(v);
      if (v === "consumo") load("consumo", `/rest/service_eai/mvno_lines/${id}/consumption`);
      if (v === "detalhado") load("detalhado", `/rest/service_eai/mvno_lines/${id}/detailed_consumption`);
      if (v === "pospago") load("pospago", `/rest/service_eai/mvno_lines/${id}/post_paid`);
    }} className="mt-2">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="consumo"><Activity className="mr-1 h-3.5 w-3.5" />Consumo</TabsTrigger>
        <TabsTrigger value="detalhado"><FileBarChart className="mr-1 h-3.5 w-3.5" />Detalhado</TabsTrigger>
        <TabsTrigger value="pospago"><Calendar className="mr-1 h-3.5 w-3.5" />Pós-pago</TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="mt-4">
        <KeyValueGrid obj={line} />
      </TabsContent>

      <TabsContent value="consumo" className="mt-4">
        {loading === "consumo" ? <LoaderRow /> : <ConsumptionView data={data.consumo} />}
      </TabsContent>

      <TabsContent value="detalhado" className="mt-4">
        {loading === "detalhado" ? <LoaderRow /> : <DetailedView data={data.detalhado} />}
      </TabsContent>

      <TabsContent value="pospago" className="mt-4">
        {loading === "pospago" ? <LoaderRow /> : <PostPaidView data={data.pospago} />}
      </TabsContent>
    </Tabs>
  );
}

function LoaderRow() {
  return <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>;
}

const HIDDEN_KEYS = new Set(["created_at", "updated_at", "deleted_at"]);

function KeyValueGrid({ obj }: { obj: any }) {
  if (!obj || typeof obj !== "object") return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  const entries = Object.entries(obj).filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== "" && typeof v !== "object");
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.replace(/_/g, " ")}</span>
          <span className="text-sm font-medium break-all">
            {k === "msisdn" ? formatMsisdn(v as any)
              : k.includes("date") || k.includes("_at") ? formatDate(v as any)
              : k.includes("price") || k.includes("value") || k.includes("amount") ? brl(v as any)
              : String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ConsumptionView({ data }: { data: any }) {
  if (!data) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  const raw = Array.isArray(data) ? data : (data?.data ?? data?.items ?? [data]);
  const items = Array.isArray(raw) ? raw : [raw];
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  return (
    <div className="space-y-3">
      {items.map((c: any, i: number) => {
        const used = c.used_mb ?? c.used ?? c.consumed ?? 0;
        const total = c.total_mb ?? c.total ?? c.limit ?? 0;
        const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
        const label = c.type || c.category || c.name || "Dados";
        return (
          <Card key={i} className="p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground">{gb(used)} / {gb(total)}</span>
            </div>
            <Progress value={pct} className="h-2" />
            <div className="text-xs text-muted-foreground text-right">{pct}% utilizado</div>
          </Card>
        );
      })}
    </div>
  );
}

function DetailedView({ data }: { data: any }) {
  if (!data) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  const rows = Array.isArray(data) ? data : (data.data || data.items || data.events || []);
  if (!Array.isArray(rows) || rows.length === 0) return <p className="text-sm text-muted-foreground">Sem eventos.</p>;
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-3 py-2 font-medium">Data</th>
            <th className="text-left px-3 py-2 font-medium">Tipo</th>
            <th className="text-right px-3 py-2 font-medium">Volume</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((r: any, i: number) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{formatDate(r.date ?? r.timestamp ?? r.created_at)}</td>
              <td className="px-3 py-2">{r.type ?? r.category ?? "—"}</td>
              <td className="px-3 py-2 text-right font-mono">{gb(r.volume_mb ?? r.volume ?? r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PostPaidView({ data }: { data: any }) {
  if (!data) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  const d = Array.isArray(data) ? data[0] : (data.data ?? data);
  if (!d) return <p className="text-sm text-muted-foreground">Sem fatura.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="p-4 rounded-xl">
        <div className="text-[10px] uppercase text-muted-foreground">Valor</div>
        <div className="text-xl font-bold text-primary">{brl(d.amount ?? d.value ?? d.total)}</div>
      </Card>
      <Card className="p-4 rounded-xl">
        <div className="text-[10px] uppercase text-muted-foreground">Vencimento</div>
        <div className="text-sm font-semibold">{formatDate(d.due_date ?? d.expires_at)}</div>
      </Card>
      <Card className="p-4 rounded-xl">
        <div className="text-[10px] uppercase text-muted-foreground">Status</div>
        <Badge variant="outline" className={statusClasses(statusTone(d.status))}>{d.status ?? "—"}</Badge>
      </Card>
    </div>
  );
}
