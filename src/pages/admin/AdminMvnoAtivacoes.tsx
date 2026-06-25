import { useMemo, useState, useEffect, Fragment } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Download, Mail, Eye, Copy, RefreshCw, Search, ChevronRight, ChevronDown, RotateCw, Pencil, Ban, MoreHorizontal, CheckCircle2, XCircle, Clock, MinusCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf, nameToHsl } from "@/lib/crmAvatar";
import { Link } from "react-router-dom";
import { activateMobileLine, algarCall } from "@/components/admin/esim/algar/algarClient";

type Row = {
  id: string;
  created_at: string;
  provider: string;
  tn: string | null;
  iccid: string | null;
  sim_type: string;
  product_name: string | null;
  product_sku: string | null;
  cycle: number | null;
  locale: string | null;
  subscriber_name: string | null;
  subscriber_doc: string | null;
  subscriber_email: string | null;
  subscriber_phone: string | null;
  status: string;
  email_status: string;
  email_sent_at: string | null;
  email_error: string | null;
  activation_code: string | null;
  qr_payload: string | null;
  notes: string | null;
  raw_response: any;
  created_by: string | null;
  _failureCount?: number;
};

function formatTn(tn?: string | null) {
  if (!tn) return "—";
  const d = tn.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 13 && d.startsWith("55")) return `(${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`;
  return tn;
}

function statusVariant(s: string) {
  if (s === "confirmed" || s === "sent") return "bg-green-500/15 text-green-700 border-green-200";
  if (s === "failed") return "bg-red-500/15 text-red-700 border-red-200";
  if (s === "pending" || s === "not_sent") return "bg-yellow-500/15 text-yellow-700 border-yellow-200";
  if (s === "cancelled") return "bg-zinc-500/15 text-zinc-700 border-zinc-200";
  return "bg-gray-500/15 text-gray-700 border-gray-200";
}

function statusLabel(s: string) {
  return ({
    confirmed: "Confirmada", pending: "Pendente", failed: "Falhou", cancelled: "Cancelada",
    sent: "Enviado", not_sent: "Não enviado", skipped: "Sem e-mail",
  } as Record<string,string>)[s] || s;
}

function StatusIcon({ status }: { status: string }) {
  const ok = status === "confirmed" || status === "sent";
  const fail = status === "failed";
  const pending = status === "pending" || status === "not_sent";
  const skipped = status === "skipped" || status === "cancelled";
  const Icon = ok ? CheckCircle2 : fail ? XCircle : pending ? Clock : MinusCircle;
  const color = ok ? "text-green-600" : fail ? "text-red-600" : pending ? "text-yellow-600" : "text-zinc-400";
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex ${color}`}><Icon className="h-5 w-5" /></span>
        </TooltipTrigger>
        <TooltipContent>{statusLabel(status)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function b64ToBlob(b64: string, mime: string) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

type Group = {
  key: string;
  name: string;
  doc: string;
  rows: Row[];
};

const normalizeLineKey = (r: Pick<Row, "id" | "provider" | "tn" | "iccid">) => {
  const tn = (r.tn || "").replace(/\D/g, "");
  const iccid = (r.iccid || "").replace(/\D/g, "");
  const lineId = tn || iccid;
  return lineId ? `${r.provider}|${lineId}` : `${r.provider}|${r.id}`;
};

const statusRank = (status: string) => {
  if (status === "confirmed") return 4;
  if (status === "pending") return 3;
  if (status === "failed") return 2;
  if (status === "cancelled") return 1;
  return 0;
};

const isConsolidatedFailure = (r: Row) => r.raw_response?.consolidated_from_failed === true;

export default function AdminMvnoAtivacoes() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [fProvider, setFProvider] = useState("all");
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [selected, setSelected] = useState<Row | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [cancelRow, setCancelRow] = useState<Row | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["mvno_activations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mvno_activations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Row[];
    },
  });

  const { data: adminUsers = [] } = useQuery({
    queryKey: ["admin_users_for_mvno"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_users");
      if (error) throw error;
      return (data || []) as Array<{ id: string; email: string; first_name: string | null; last_name: string | null; avatar_url: string | null }>;
    },
    staleTime: 5 * 60 * 1000,
  });
  type AuthorInfo = { name: string; email: string; avatar: string | null };
  const userMap = useMemo(() => {
    const m = new Map<string, AuthorInfo>();
    for (const u of adminUsers) {
      const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
      const name = full || (u.email ? u.email.split("@")[0] : "");
      m.set(u.id, { name, email: u.email || "", avatar: u.avatar_url });
    }
    return m;
  }, [adminUsers]);
  const getAuthor = (id?: string | null): AuthorInfo | null => (id ? userMap.get(id) || null : null);

  // Deduplica por linha: se uma TN/ICCID falhou e depois ativou, mostra só o registro ativo.
  const dedupedData = useMemo(() => {
    const byLine = new Map<string, { row: Row; failureCount: number }>();
    for (const r of data) {
      const key = normalizeLineKey(r);
      const fromRaw = Number(r.raw_response?.failedAttempts) || 0;
      const existing = byLine.get(key);
      if (!existing) {
        byLine.set(key, { row: r, failureCount: r.status === "failed" ? Math.max(fromRaw, 1) : fromRaw });
        continue;
      }

      const failureCount = existing.failureCount + (r.status === "failed" ? Math.max(fromRaw, 1) : fromRaw);
      const currentRank = statusRank(r.status);
      const existingRank = statusRank(existing.row.status);
      const currentIsRealActivation = !isConsolidatedFailure(r);
      const existingIsRealActivation = !isConsolidatedFailure(existing.row);
      const shouldReplace =
        currentRank > existingRank ||
        (currentRank === existingRank && currentIsRealActivation && !existingIsRealActivation) ||
        (currentRank === existingRank && currentIsRealActivation === existingIsRealActivation && +new Date(r.created_at) > +new Date(existing.row.created_at));
      byLine.set(key, { row: shouldReplace ? r : existing.row, failureCount });
    }
    const merged = Array.from(byLine.values()).map(({ row, failureCount }) => ({
      ...row,
      _failureCount: row.status === "failed" ? Math.max(failureCount, 1) : undefined,
    } as Row));
    merged.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return merged;
  }, [data]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return dedupedData.filter((r) => {
      if (fProvider !== "all" && r.provider !== fProvider) return false;
      if (fType !== "all" && r.sim_type !== fType) return false;
      if (fStatus !== "all" && r.status !== fStatus) return false;
      if (!qn) return true;
      return [r.subscriber_name, r.subscriber_doc, r.subscriber_email, r.tn, r.iccid]
        .some((x) => (x || "").toLowerCase().includes(qn));
    });
  }, [dedupedData, q, fProvider, fType, fStatus]);

  // Group by subscriber_doc (fallback to name|email). Preserve order: group sorts by most recent row.
  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    for (const r of filtered) {
      const key = (r.subscriber_doc || "").replace(/\D/g, "") || r.subscriber_email || r.subscriber_name || r.id;
      const g = map.get(key);
      if (g) g.rows.push(r);
      else map.set(key, { key, name: r.subscriber_name || "—", doc: r.subscriber_doc || "", rows: [r] });
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => +new Date(b.rows[0].created_at) - +new Date(a.rows[0].created_at));
    return arr;
  }, [filtered]);

  // For popup: all lines for the selected client (from deduped data, not filtered)
  const selectedClientLines = useMemo(() => {
    if (!selected) return [] as Row[];
    const key = (selected.subscriber_doc || "").replace(/\D/g, "") || selected.subscriber_email || selected.subscriber_name;
    if (!key) return [selected];
    return dedupedData.filter((r) => {
      const k = (r.subscriber_doc || "").replace(/\D/g, "") || r.subscriber_email || r.subscriber_name;
      return k === key;
    });
  }, [dedupedData, selected]);


  async function downloadPdf(r: Row) {
    setBusy(`pdf-${r.id}`);
    try {
      const { data, error } = await supabase.functions.invoke("send-mvno-activation-email", {
        body: { mode: "pdf", activationId: r.id, provider: r.provider, simType: r.sim_type },
      });
      if (error) throw error;
      const blob = b64ToBlob((data as any).pdfBase64, "application/pdf");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (data as any).filename || `linha-${r.tn || r.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message || "Falha ao gerar PDF");
    } finally {
      setBusy(null);
    }
  }

  async function resendEmail(r: Row) {
    if (!r.subscriber_email) return toast.error("Cliente sem e-mail");
    setBusy(`send-${r.id}`);
    try {
      const { data, error } = await supabase.functions.invoke("send-mvno-activation-email", {
        body: { mode: "send", activationId: r.id, provider: r.provider, simType: r.sim_type },
      });
      if (error) throw error;
      if ((data as any)?.ok === false || (data as any)?.error) throw new Error((data as any).userMessage || (data as any).error);
      toast.success(`E-mail enviado para ${r.subscriber_email}`);
      qc.invalidateQueries({ queryKey: ["mvno_activations"] });
    } catch (e: any) {
      toast.error(e.message || "Falha ao enviar e-mail");
    } finally {
      setBusy(null);
    }
  }

  async function retryActivation(r: Row) {
    if (r.status !== "failed") return;
    if (r.provider !== "algar") {
      toast.error("Retentar disponível apenas para Algar. Para EAI, refaça pelo /admin/mvno/nova-linha.");
      return;
    }
    if (!r.tn || !r.iccid) {
      toast.error("Registro sem TN/ICCID — refaça pelo /admin/mvno/nova-linha.");
      return;
    }

    setBusy(`retry-${r.id}`);
    try {
      // Validação de duplicidade: ignora o próprio registro falhado, mas bloqueia outra linha já ativa.
      const { data: dupes } = await supabase
        .from("mvno_activations")
        .select("id, status, tn, iccid")
        .eq("provider", "algar")
        .in("status", ["confirmed", "pending"])
        .or(`tn.eq.${r.tn},iccid.eq.${r.iccid}`);
      const otherActive = (dupes || []).filter((d) => d.id !== r.id);
      if (otherActive.length > 0) {
        toast.error("Já existe uma ativação ativa para esta linha ou ICCID. Retentativa bloqueada.");
        return;
      }

      // Reconstrói o payload a partir do raw_response.requestBody persistido na falha.
      const rb = r.raw_response?.requestBody;
      const service = rb?.service;
      if (!service) {
        toast.error("Dados originais indisponíveis para retentar. Refaça pelo /admin/mvno/nova-linha.");
        return;
      }

      // Novo ref para idempotência
      const newRef = `RETRY_${Date.now()}_${r.id.slice(0, 6)}`;
      const newService: any = { ...service, ref: newRef };

      // Backfill de campos obrigatórios em payloads antigos (salvos antes de incluirmos `type`).
      // A Algar exige `service.representative.type` quando o assinante é PJ.
      if (newService.representative && typeof newService.representative === "object") {
        if (!newService.representative.type) {
          newService.representative.type = "individual";
        }
      } else if (newService.subscriber?.type === "company") {
        // PJ sem representative no payload original — não conseguimos retentar sem esses dados.
        toast.error("Payload original sem representante legal (PJ). Refaça pelo /admin/mvno/nova-linha.");
        return;
      }
      // Garante também `type` no subscriber se faltar
      if (newService.subscriber && !newService.subscriber.type) {
        const doc = String(newService.subscriber.document || "").replace(/\D/g, "");
        newService.subscriber.type = doc.length === 14 ? "company" : "individual";
      }

      const act = await activateMobileLine({
        tn: r.tn,
        card: { type: r.sim_type as "sim" | "esim", iccid: r.iccid },
        service: newService,
      } as any);

      if (!act?.ok) {
        const errMsg = String(
          act?.error || (act?.data && JSON.stringify(act.data)) || act?.raw || "Falha desconhecida",
        ).slice(0, 240);
        const prevAttempts: any[] = Array.isArray(r.raw_response?.attempts)
          ? r.raw_response.attempts
          : r.raw_response ? [r.raw_response] : [];
        const newAttempt = {
          step: "/v2/mobilelines (retry)",
          status: act?.status,
          at: new Date().toISOString(),
          requestBody: { tn: r.tn, card: { type: r.sim_type, iccid: r.iccid }, service: newService },
          response: { error: act?.error, data: act?.data, raw: act?.raw },
        };
        const attempts = [...prevAttempts, newAttempt].slice(-10);
        await supabase
          .from("mvno_activations")
          .update({
            raw_response: { ...newAttempt, failedAttempts: attempts.length, attempts } as any,
            notes: `[FAILED x${attempts.length} retry ${act?.status ?? "?"}] ${(r.notes || "").replace(/^\[FAILED[^\]]*\]\s*/, "")}`.slice(0, 500),
          })
          .eq("id", r.id);
        toast.error(`Retentativa falhou (${attempts.length}ª): (${act?.status ?? "?"}) ${errMsg}`);
        qc.invalidateQueries({ queryKey: ["mvno_activations"] });
        return;
      }

      const ad: any = act.data?.data ?? act.data ?? {};
      const card: any = ad.card || ad.sim || ad.mobileline?.card || {};
      const lineRef = ad.ref || ad.id || ad.mobileline?.ref || ad.mobileline?.id || ad.service?.id || "";
      const activationCode =
        card.activationData || ad.activation_code || ad.activationCode || ad.lpa ||
        ad.mobileline?.activation_code || "";
      const qrPayload = ad.qr_code || ad.qrCode || card.activationData || activationCode || "";

      await supabase
        .from("mvno_activations")
        .update({
          status: "pending",
          activation_code: activationCode || null,
          qr_payload: qrPayload || null,
          raw_response: ad,
          email_status: r.subscriber_email ? "not_sent" : "skipped",
          notes: (r.notes || "").replace(/^\[FAILED[^\]]*\]\s*/, "").slice(0, 500) || null,
        })
        .eq("id", r.id);

      // Confirmação opcional
      if (lineRef) {
        try {
          const confirm = await algarCall<any>(`/v2/mobilelines/${lineRef}`);
          if (confirm?.ok) {
            await supabase
              .from("mvno_activations")
              .update({ status: "confirmed", raw_response: confirm.data ?? ad })
              .eq("id", r.id);
          }
        } catch (e) { /* segue */ }
      }

      toast.success("Linha reativada com sucesso");
      qc.invalidateQueries({ queryKey: ["mvno_activations"] });
    } catch (e: any) {
      toast.error(e?.message || "Falha ao retentar ativação");
    } finally {
      setBusy(null);
    }
  }

  async function confirmCancel(r: Row) {
    setBusy(`cancel-${r.id}`);
    try {
      const prevNotes = r.notes || "";
      const { error } = await supabase
        .from("mvno_activations")
        .update({
          status: "cancelled",
          notes: `[CANCELLED em ${new Date().toLocaleString("pt-BR")}] ${prevNotes}`.slice(0, 500),
        })
        .eq("id", r.id);
      if (error) throw error;
      toast.success(`Linha ${r.tn || ""} cancelada. Número liberado para nova ativação.`);
      setCancelRow(null);
      if (selected?.id === r.id) setSelected({ ...r, status: "cancelled" });
      qc.invalidateQueries({ queryKey: ["mvno_activations"] });
    } catch (e: any) {
      toast.error(e?.message || "Falha ao cancelar");
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit(payload: {
    id: string;
    tn: string;
    iccid: string;
    sim_type: string;
    subscriber_name: string;
    subscriber_email: string;
    subscriber_phone: string;
    notes: string;
    birthdate: string;
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  }) {
    setBusy(`edit-${payload.id}`);
    try {
      // Atualiza raw_response.requestBody.service para a retentativa usar os dados novos
      const row = data.find((x) => x.id === payload.id);
      const raw = row?.raw_response || {};
      const rb = raw?.requestBody || {};
      const svc = rb?.service || {};
      const newSvc = {
        ...svc,
        subscriber: {
          ...(svc.subscriber || {}),
          name: payload.subscriber_name,
          email: payload.subscriber_email,
          contact_number: (svc.subscriber?.contact_number || ""),
          birthdate: payload.birthdate || svc.subscriber?.birthdate,
        },
        address: {
          ...(svc.address || {}),
          zipCode: payload.zipCode,
          streetName: payload.street,
          streetNumber: payload.number,
          complement: payload.complement || undefined,
          neighborhood: payload.neighborhood,
          city: payload.city,
          state: payload.state,
        },
        description: payload.notes || svc.description,
      };
      const newRaw = {
        ...raw,
        requestBody: { ...rb, tn: payload.tn, card: { type: payload.sim_type, iccid: payload.iccid }, service: newSvc },
      };

      const { error } = await supabase
        .from("mvno_activations")
        .update({
          tn: payload.tn,
          iccid: payload.iccid,
          sim_type: payload.sim_type,
          subscriber_name: payload.subscriber_name,
          subscriber_email: payload.subscriber_email || null,
          subscriber_phone: payload.subscriber_phone || null,
          notes: payload.notes || null,
          raw_response: newRaw,
        })
        .eq("id", payload.id);
      if (error) throw error;
      toast.success("Linha atualizada. Use 'Retentar' para tentar novamente.");
      setEditRow(null);
      qc.invalidateQueries({ queryKey: ["mvno_activations"] });
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar");
    } finally {
      setBusy(null);
    }
  }


  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Histórico de Ativações MVNO"
        subtitle="Todas as linhas ativadas via Algar e EAI. Reenvie e-mails, retente falhas e baixe os comprovantes."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, doc, e-mail, TN, ICCID..." className="pl-9" />
        </div>
        <Select value={fProvider} onValueChange={setFProvider}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Operadora</SelectItem>
            <SelectItem value="algar">Algar</SelectItem>
            <SelectItem value="eai">EAI</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fType} onValueChange={setFType}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tipo</SelectItem>
            <SelectItem value="sim">SIM Card</SelectItem>
            <SelectItem value="esim">eSIM</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["mvno_activations"] })}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
        <Link to="/admin/mvno/email-template">
          <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-2" />Editar templates</Button>
        </Link>
      </div>

      <div className="space-y-2">
        {isLoading && (
          <Card className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 mx-auto animate-spin" />
          </Card>
        )}
        {!isLoading && groups.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">Nenhuma ativação encontrada.</Card>
        )}
        {groups.map((g) => {
          const isOpen = !!expanded[g.key];
          const initials = (g.name || "?").split(/\s+/).filter(Boolean).slice(0,2).map(s => s[0]?.toUpperCase()).join("") || "?";
          const statusCounts = g.rows.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status]||0)+1; return acc; }, {});
          const lastDate = g.rows[0].created_at;
          const lineCount = g.rows.length;
          return (
            <Card key={g.key} className={`overflow-hidden transition-colors ${isOpen ? "ring-1 ring-primary/30" : ""}`}>
              {/* Header do cliente — layout fixo, idêntico para todos */}
              <button
                type="button"
                onClick={() => setExpanded((e) => ({ ...e, [g.key]: !isOpen }))}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isOpen ? "bg-primary/[0.04]" : "hover:bg-muted/40"}`}
              >
                <div className="flex items-center justify-center h-6 w-6 rounded-md border bg-background shrink-0">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{g.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                      {lineCount} {lineCount === 1 ? "linha" : "linhas"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {g.doc || g.rows[0].subscriber_email || "—"}
                  </div>
                </div>
                <div className="hidden md:flex flex-wrap gap-1 max-w-[260px] justify-end">
                  {Object.entries(statusCounts).map(([s, n]) => (
                    <Badge key={s} variant="outline" className={`${statusVariant(s)} text-[10px] px-1.5 py-0`}>
                      {n} {statusLabel(s)}
                    </Badge>
                  ))}
                </div>
                <div className="hidden sm:block text-right text-xs text-muted-foreground whitespace-nowrap leading-tight shrink-0 w-20">
                  <div>{new Date(lastDate).toLocaleDateString("pt-BR")}</div>
                  <div className="text-[10px] opacity-70">{new Date(lastDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </button>

              {/* Sub-tabela de linhas — só aparece quando expandido */}
              {isOpen && (
                <div className="border-t bg-primary/[0.02] overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">Data</th>
                        <th className="px-3 py-2 font-medium">Operadora</th>
                        <th className="px-3 py-2 font-medium">Linha</th>
                        <th className="px-3 py-2 font-medium">Tipo</th>
                        <th className="px-3 py-2 font-medium">Plano</th>
                        <th className="px-3 py-2 font-medium text-center">Status</th>
                        <th className="px-3 py-2 font-medium text-center">E-mail</th>
                        <th className="px-3 py-2 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r) => (
                        <tr key={r.id} className="border-t hover:bg-primary/[0.04]">
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                            <div className="leading-tight">
                              <div className="text-xs">{new Date(r.created_at).toLocaleDateString("pt-BR")}</div>
                              <div className="text-[10px] opacity-70">{new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3 uppercase text-xs">{r.provider}</td>
                          <td className="px-3 py-3 font-mono text-xs">
                            <div className="flex items-center gap-1.5">
                              <span>{formatTn(r.tn)}</span>
                              {r.status === "failed" && (r._failureCount ?? 1) > 1 && (
                                <Badge variant="outline" className="bg-red-500/15 text-red-700 border-red-300 text-[10px] px-1.5 py-0 font-bold">
                                  {r._failureCount}x
                                </Badge>
                              )}
                            </div>
                            {r.iccid && <div className="text-muted-foreground">{r.iccid}</div>}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="outline">{r.sim_type === "esim" ? "eSIM" : "SIM"}</Badge>
                          </td>
                          <td className="px-3 py-3 text-xs">
                            <div>{r.product_name || r.product_sku || "—"}</div>
                            {(() => {
                              const a = getAuthor(r.created_by);
                              if (!a) return null;
                              const label = a.name || a.email;
                              return (
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                                  <Avatar className="h-4 w-4">
                                    {a.avatar ? <AvatarImage src={a.avatar} alt={label} /> : null}
                                    <AvatarFallback className="text-[8px] text-white" style={{ background: nameToHsl(label) }}>
                                      {initialsOf(label)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate max-w-[140px]">por <span className="font-medium text-foreground/70">{label}</span></span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <StatusIcon status={r.status} />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <StatusIcon status={r.email_status} />
                          </td>
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" title="Ações" disabled={!!busy && busy.endsWith(`-${r.id}`)}>
                                  {busy && busy.endsWith(`-${r.id}`)
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <MoreHorizontal className="h-4 w-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="text-xs">Ações da linha</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSelected(r)}>
                                  <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                                </DropdownMenuItem>
                                {r.status === "failed" && (
                                  <>
                                    <DropdownMenuItem onClick={() => setEditRow(r)}>
                                      <Pencil className="h-4 w-4 mr-2 text-blue-600" /> Editar dados
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => retryActivation(r)}>
                                      <RotateCw className="h-4 w-4 mr-2 text-amber-600" /> Retentar ativação
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setCancelRow(r)} className="text-destructive focus:text-destructive">
                                      <Ban className="h-4 w-4 mr-2" /> Cancelar / liberar número
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {r.status !== "failed" && r.status !== "cancelled" && (
                                  <>
                                    <DropdownMenuItem onClick={() => downloadPdf(r)}>
                                      <Download className="h-4 w-4 mr-2" /> Baixar PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => resendEmail(r)}
                                      disabled={!r.subscriber_email}
                                    >
                                      <Mail className="h-4 w-4 mr-2" /> Reenviar e-mail
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>


      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da ativação</SheetTitle>
          </SheetHeader>
          {selected && (
            <Tabs defaultValue="detalhes" className="mt-6">
              <TabsList>
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="linhas">
                  Linhas do cliente
                  <Badge variant="outline" className="ml-2">{selectedClientLines.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="detalhes" className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Info label="Data" value={new Date(selected.created_at).toLocaleString("pt-BR")} />
                  <Info label="Operadora" value={selected.provider.toUpperCase()} />
                  <Info label="Tipo" value={selected.sim_type === "esim" ? "eSIM" : "SIM Card"} />
                  <Info label="Status" value={statusLabel(selected.status)} />
                  <Info label="Número" value={formatTn(selected.tn)} />
                  <Info label="ICCID" value={selected.iccid || "—"} mono />
                  <Info label="Plano" value={selected.product_name || selected.product_sku || "—"} />
                  <Info label="Ciclo" value={selected.cycle ? `Dia ${selected.cycle}` : "—"} />
                  <Info label="Nome" value={selected.subscriber_name || "—"} />
                  <Info label="Documento" value={selected.subscriber_doc || "—"} />
                  <Info label="E-mail" value={selected.subscriber_email || "—"} />
                  <Info label="Telefone" value={selected.subscriber_phone || "—"} />
                </div>
                {selected.activation_code && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Código LPA (eSIM)</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted p-2 rounded text-xs break-all">{selected.activation_code}</code>
                      <Button size="icon" variant="outline" onClick={() => {
                        navigator.clipboard.writeText(selected.activation_code!);
                        toast.success("Copiado");
                      }}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
                {selected.email_error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
                    <div className="font-medium mb-1">Erro do e-mail:</div>
                    {selected.email_error}
                  </div>
                )}
                {selected.notes && <Info label="Observações" value={selected.notes} />}
                <details className="border rounded p-3">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Resposta bruta da operadora</summary>
                  <pre className="mt-2 text-[10px] overflow-auto max-h-64">{JSON.stringify(selected.raw_response, null, 2)}</pre>
                </details>
                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.status === "failed" && (
                    <>
                      <Button variant="outline" onClick={() => setEditRow(selected)}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar dados
                      </Button>
                      <Button variant="outline" onClick={() => retryActivation(selected)} disabled={busy === `retry-${selected.id}`}>
                        {busy === `retry-${selected.id}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCw className="h-4 w-4 mr-2" />}
                        Retentar ativação
                      </Button>
                      <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setCancelRow(selected)}>
                        <Ban className="h-4 w-4 mr-2" /> Cancelar / liberar número
                      </Button>
                    </>
                  )}
                  {selected.status !== "failed" && selected.status !== "cancelled" && (
                    <Button onClick={() => downloadPdf(selected)} disabled={busy === `pdf-${selected.id}`}>
                      {busy === `pdf-${selected.id}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      Baixar PDF
                    </Button>
                  )}
                  {selected.subscriber_email && selected.status !== "failed" && selected.status !== "cancelled" && (
                    <Button variant="outline" onClick={() => resendEmail(selected)} disabled={busy === `send-${selected.id}`}>
                      {busy === `send-${selected.id}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                      Reenviar e-mail
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="linhas" className="mt-4">
                <div className="space-y-2">
                  {selectedClientLines.length === 0 && (
                    <div className="text-sm text-muted-foreground">Nenhuma linha encontrada.</div>
                  )}
                  {selectedClientLines.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className={`w-full text-left border rounded-lg p-3 hover:bg-muted/40 transition ${r.id === selected.id ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono text-sm flex items-center gap-1.5">
                          {formatTn(r.tn)}
                          {r.status === "failed" && (r._failureCount ?? 1) > 1 && (
                            <Badge variant="outline" className="bg-red-500/15 text-red-700 border-red-300 text-[10px] px-1.5 py-0 font-bold">
                              {r._failureCount}x
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="uppercase">{r.provider}</span>
                        <span>•</span>
                        <span>{r.sim_type === "esim" ? "eSIM" : "SIM"}</span>
                        {r.iccid && <><span>•</span><span className="font-mono">{r.iccid}</span></>}
                        <span>•</span>
                        <span>{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {r.product_name && (
                        <div className="text-xs text-muted-foreground mt-1">{r.product_name}</div>
                      )}
                      {r.status === "failed" && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); retryActivation(r); }}
                            disabled={busy === `retry-${r.id}`}
                          >
                            {busy === `retry-${r.id}` ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RotateCw className="h-3 w-3 mr-2" />}
                            Retentar
                          </Button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      <EditFailedDialog
        row={editRow}
        onClose={() => setEditRow(null)}
        onSave={saveEdit}
        busy={busy?.startsWith("edit-") ?? false}
      />

      <AlertDialog open={!!cancelRow} onOpenChange={(o) => !o && setCancelRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar ativação?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro será marcado como cancelado e o número {cancelRow?.tn ? <strong>{formatTn(cancelRow.tn)}</strong> : ""}
              {" "}e o ICCID {cancelRow?.iccid ? <strong>{cancelRow.iccid}</strong> : ""} ficarão liberados para uma nova ativação futura.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (cancelRow) confirmCancel(cancelRow); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!cancelRow && busy === `cancel-${cancelRow.id}`}
            >
              {cancelRow && busy === `cancel-${cancelRow.id}` ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
              Cancelar linha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditFailedDialog({
  row,
  onClose,
  onSave,
  busy,
}: {
  row: Row | null;
  onClose: () => void;
  onSave: (payload: any) => void;
  busy: boolean;
}) {
  const svc = row?.raw_response?.requestBody?.service || {};
  const addr = svc.address || {};
  const sub = svc.subscriber || {};
  const [f, setF] = useState({
    tn: "", iccid: "", sim_type: "sim",
    subscriber_name: "", subscriber_email: "", subscriber_phone: "",
    notes: "", birthdate: "",
    zipCode: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
  });

  // Reinicializa ao abrir
  useEffect(() => {
    if (!row) return;
    setF({
      tn: row.tn || "",
      iccid: row.iccid || "",
      sim_type: row.sim_type || "sim",
      subscriber_name: row.subscriber_name || sub.name || "",
      subscriber_email: row.subscriber_email || sub.email || "",
      subscriber_phone: row.subscriber_phone || "",
      notes: row.notes?.replace(/^\[FAILED[^\]]*\]\s*/, "") || "",
      birthdate: sub.birthdate || "",
      zipCode: addr.zipCode || "",
      street: addr.streetName || "",
      number: addr.streetNumber || "",
      complement: addr.complement || "",
      neighborhood: addr.neighborhood || "",
      city: addr.city || "",
      state: addr.state || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id]);

  const upd = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar dados da linha que falhou</DialogTitle>
        </DialogHeader>
        {row && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Número (TN)</Label>
                <Input value={f.tn} onChange={(e) => upd("tn", e.target.value)} className="font-mono" />
              </div>
              <div>
                <Label className="text-xs">ICCID</Label>
                <Input value={f.iccid} onChange={(e) => upd("iccid", e.target.value)} className="font-mono" />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={f.sim_type} onValueChange={(v) => upd("sim_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">SIM</SelectItem>
                    <SelectItem value="esim">eSIM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Dados do cliente</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input value={f.subscriber_name} onChange={(e) => upd("subscriber_name", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" value={f.subscriber_email} onChange={(e) => upd("subscriber_email", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input value={f.subscriber_phone} onChange={(e) => upd("subscriber_phone", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Data de nascimento (YYYY-MM-DD)</Label>
                  <Input value={f.birthdate} onChange={(e) => upd("birthdate", e.target.value)} placeholder="1990-01-31" />
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Endereço</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">CEP</Label>
                  <Input value={f.zipCode} onChange={(e) => upd("zipCode", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Rua</Label>
                  <Input value={f.street} onChange={(e) => upd("street", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Número</Label>
                  <Input value={f.number} onChange={(e) => upd("number", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Complemento</Label>
                  <Input value={f.complement} onChange={(e) => upd("complement", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Bairro</Label>
                  <Input value={f.neighborhood} onChange={(e) => upd("neighborhood", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Cidade</Label>
                  <Input value={f.city} onChange={(e) => upd("city", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">UF</Label>
                  <Input value={f.state} onChange={(e) => upd("state", e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea value={f.notes} onChange={(e) => upd("notes", e.target.value)} rows={3} />
            </div>

            <div className="text-[11px] text-muted-foreground bg-amber-500/10 border border-amber-500/30 rounded p-2">
              Após salvar, clique em "Retentar ativação" para enviar à Algar com os dados corrigidos.
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={() => row && onSave({ id: row.id, ...f })} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-xs" : "text-sm"}>{value}</div>
    </div>
  );
}
