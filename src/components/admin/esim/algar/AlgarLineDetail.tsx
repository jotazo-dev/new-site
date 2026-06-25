import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  Headphones, 
  MoreVertical, 
  Smartphone, 
  Signal, 
  RefreshCw,
  Clock,
  MapPin,
  CreditCard,
  History,
  Code,
  QrCode,
  Download,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileJson,
  FileText,
  Copy,
  Check,
  Wifi,
  WifiOff
} from "lucide-react";
import { formatMsisdn } from "./algarClient";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { algarCall } from "./algarClient";

interface AlgarLineDetailProps {
  line: any;
  onBack: () => void;
  onUpdate?: (updatedLine: any) => void;
}

// ---------- Helpers ----------
function parseIsoToBR(iso?: string | null, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = d.getUTCFullYear();
  if (!withTime) return `${dd}/${mm}/${yy}`;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

function bytesToGb(bytes?: number | null): number {
  if (!bytes || bytes <= 0) return 0;
  const gb = bytes / (1024 * 1024 * 1024);
  return +gb.toFixed(2);
}

const PORT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  requested:  { label: "Solicitada",  color: "bg-amber-50 text-amber-700 border-amber-100" },
  scheduled:  { label: "Programada",  color: "bg-sky-50 text-sky-700 border-sky-100" },
  approved:   { label: "Aprovada",    color: "bg-sky-50 text-sky-700 border-sky-100" },
  completed:  { label: "Concluída",   color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  cancelled:  { label: "Cancelada",   color: "bg-gray-50 text-gray-700 border-gray-200" },
  failed:     { label: "Falhou",      color: "bg-rose-50 text-rose-700 border-rose-100" },
};

function translatePortStatus(s?: string) {
  if (!s) return { label: "Nenhuma", color: "bg-gray-50 text-gray-700 border-gray-200" };
  return PORT_STATUS_MAP[s.toLowerCase()] ?? { label: s, color: "bg-gray-50 text-gray-700 border-gray-200" };
}

function normalizeAlgarLine(raw: any) {
  if (!raw) return null;
  const service = raw.service || {};
  const card = raw.card || {};
  const subscriber = service.subscriber || raw.subscriber || {};
  const representative = service.representative || {};
  const addr = service.address || raw.address || {};
  const register = raw.register || null;
  const port = Array.isArray(raw.portabilities) && raw.portabilities.length ? raw.portabilities[0] : (raw.portabilityData || null);
  const simTypeRaw = String(card.type || raw.sim?.type || "").toLowerCase();
  const simTypeLabel = simTypeRaw === "esim" ? "eSIM" : simTypeRaw === "sim" ? "SIM Físico" : (raw.device?.sim_type || "—");

  return {
    raw,
    id: raw.id,
    msisdn: raw.tn || raw.msisdn || raw.terminal || "",
    terminal: service.terminal || raw.terminal || "—",
    status: service.status || raw.status || "—",
    cycle: service.cycle ?? raw.cycle ?? null,
    activatedAt: service.activatedAt || null,
    publishedAt: service.publishedAt || null,
    suspendedAt: service.suspendedAt || null,
    blockedAt: service.blockedAt || null,
    cancelledAt: service.cancelledAt || null,
    createdAt: service.createdAt || null,
    profile: service.profile?.name || "—",
    subscriber: {
      name: subscriber.name || representative.name || raw.name || "—",
      document: subscriber.document || representative.document || raw.document || "—",
      type: subscriber.type || representative.type || "—",
    },
    sim: {
      type: simTypeLabel,
      iccid: card.iccid || raw.iccid || "—",
      imsi: card.imsi || "—",
      profile: service.profile?.name || "ALGAR",
    },
    address: {
      street: addr.streetName || addr.street || "—",
      number: addr.streetNumber || addr.number || "",
      complement: addr.complement || "",
      neighborhood: addr.neighborhood || "—",
      city: addr.city || "—",
      state: addr.state || "—",
      zipcode: addr.zipCode || addr.zipcode || "—",
    },
    products: Array.isArray(service.products) && service.products.length
      ? service.products.map((p: any) => ({
          sku: p.sku || "—",
          name: p.name || "—",
          activatedAt: p.activatedAt,
          cancelledAt: p.cancelledAt,
          status: p.status || "—",
          role: p.role || "—",
        }))
      : [],
    usage: {
      cycle: raw.usage?.cycle ?? service.cycle ?? null,
      quotaTotal: raw.usage?.quotaTotal ?? 0,
      usageTotal: raw.usage?.usageTotal ?? 0,
    },
    network: register ? {
      operator: register.networkName || register.operator || "—",
      tech: register.tech || register.technology || "—",
      state: String(register.state || "").toLowerCase() === "online" ? "online" : (register.state || "offline"),
      lastSeen: register.lastSeen || register.updatedAt || null,
      signal: register.signal ?? register.rssi ?? null,
      mcc: register.mcc, mnc: register.mnc, lac: register.lac, cellId: register.cellId,
      imei: register.imei || raw.device?.imei || null,
    } : null,
    portability: port ? {
      status: port.status,
      bp: port.bp || "—",
      tn: port.tn || "—",
      tnReplace: port.tnReplace || null,
      locale: port.locale || "—",
      createdAt: port.createdAt,
      updatedAt: port.updatedAt,
      window: port.window || port.scheduledDate,
    } : null,
    card,
  };
}

export function AlgarLineDetail({ line: initialLine, onBack, onUpdate }: AlgarLineDetailProps) {
  const [raw, setRaw] = useState<any>(initialLine);
  const [copied, setCopied] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const N = useMemo(() => normalizeAlgarLine(raw)!, [raw]);

  const line = useMemo(() => ({
    ...raw,
    id: N.id,
    name: N.subscriber.name,
    document: N.subscriber.document,
    msisdn: N.msisdn,
    terminal: N.terminal,
    iccid: N.sim.iccid,
    status: N.status,
    plan: N.products[0]?.name || raw?.plan || "—",
    portabilityData: N.portability,
    address: N.address,
  }), [raw, N]);

  const activationData = raw?.card?.activationData || raw?.sim?.activationData || raw?.qrCode;
  const isEsim = (raw?.card?.type === 'esim' || raw?.sim?.type === 'esim' || raw?.device?.sim_type === 'eSIM');

  // Fetch full payload on mount / id change to get all real fields
  useEffect(() => {
    let cancelled = false;
    async function fetchFull() {
      if (!initialLine?.id) return;
      try {
        const res = await algarCall(`/v2/mobilelines/${initialLine.id}`);
        if (cancelled) return;
        if (res.ok && res.data) {
          const full = (res.data as any).data ?? res.data;
          setRaw((prev: any) => ({ ...prev, ...full }));
          onUpdate?.(full);
        }
      } catch (e) {
        console.error("[AlgarLineDetail] fetch full failed", e);
      }
    }
    fetchFull();
    return () => { cancelled = true; };
  }, [initialLine?.id]);

  const copyLPA = () => {
    if (activationData) {
      navigator.clipboard.writeText(activationData);
      setCopied(true);
      toast.success("LPA copiado para a área de transferência");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(raw, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `payload_algar_${N.subscriber.document || 'line'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Payload JSON exportado");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Relatório de Linha eSIM - Algar", 20, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 20, 30);

    autoTable(doc, {
      startY: 40,
      head: [['Campo', 'Valor']],
      body: [
        ['Nome', N.subscriber.name || '—'],
        ['Documento', N.subscriber.document || '—'],
        ['MSISDN', N.msisdn ? formatMsisdn(N.msisdn) : '—'],
        ['ICCID', N.sim.iccid || '—'],
        ['Status', N.status || '—'],
        ['Plano', N.products[0]?.name || '—'],
        ['LPA (eSIM)', activationData || 'Não disponível'],
      ],
    });

    doc.save(`relatorio_algar_${N.subscriber.document || 'line'}.pdf`);
    toast.success("Relatório PDF exportado");
  };

  const downloadHighResQR = () => {
    const svg = document.querySelector('.qr-code-svg svg') as SVGGraphicsElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = 2048;
        canvas.height = 2048;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, 2048, 2048);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `QR_HighRes_${N.sim.iccid || 'eSIM'}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  // Signal strength bucket
  const signalBucket = (() => {
    const s = N.network?.signal;
    if (s == null) return null;
    if (s >= -70) return { label: "Excelente", pct: 100, color: "bg-emerald-500" };
    if (s >= -85) return { label: "Boa",       pct: 70,  color: "bg-sky-500" };
    if (s >= -100) return { label: "Fraca",    pct: 40,  color: "bg-amber-500" };
    return { label: "Muito fraca", pct: 15, color: "bg-rose-500" };
  })();

  const usageGb = bytesToGb(N.usage.usageTotal);
  const quotaGb = bytesToGb(N.usage.quotaTotal);
  const usagePct = quotaGb > 0 ? Math.round((usageGb / quotaGb) * 100) : 0;
  const cycleLeft = N.cycle ?? 0;
  const cycleTotal = 30;
  const cyclePct = Math.max(0, Math.min(100, Math.round(((cycleTotal - cycleLeft) / cycleTotal) * 100)));

  const detailData = {
    operator: N.profile || "Algar",
    mcc: N.network?.mcc || "724",
    mnc: N.network?.mnc || "32",
    lastUpdate: N.publishedAt ? parseIsoToBR(N.publishedAt, true) : "—",
    usage: { current: usageGb, total: quotaGb, percentage: usagePct, daysLeft: cycleLeft, totalDays: cycleTotal, daysPercentage: cyclePct },
    sim: N.sim,
    address: N.address,
    products: N.products.length ? N.products : [{ sku: "—", name: "Sem produto vinculado", activatedAt: null, cancelledAt: null, status: "—", role: "—" }],
    portability: N.portability,
    network: N.network,
    protocols: raw?.protocols || [],
  };

  useEffect(() => {
    let intervalId: any;
    const pollLineData = async () => {
      if (!isEsim || activationData || !N.id) return;
      setIsPolling(true);
      try {
        const response = await algarCall(`/v2/mobilelines/${N.id}`, { method: 'GET' });
        if (response.ok && response.data) {
          const updatedLine = (response.data as any).data ?? response.data;
          const newActivationData = updatedLine.card?.activationData || updatedLine.sim?.activationData;
          if (newActivationData) {
            setRaw((prev: any) => ({ ...prev, ...updatedLine }));
            onUpdate?.(updatedLine);
            toast.success("eSIM provisionado com sucesso!");
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error("Erro ao realizar polling da linha:", error);
      }
    };
    if (isEsim && !activationData) {
      pollLineData();
      intervalId = setInterval(pollLineData, 10000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isEsim, activationData, N.id, onUpdate]);


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Linha Móvel</h2>
          <p className="text-xs text-muted-foreground">Telefonia Móvel</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 h-9 gap-2">
            <Headphones className="h-4 w-4" />
            Iniciar Atendimento
          </Button>
          <Button variant="outline" size="sm" onClick={onBack} className="h-9 gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Activation Checklist */}
      <Card className="p-4 bg-white border-muted/40 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <History className="h-4 w-4 text-sky-500" />
            Checklist de Ativação
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportJSON}>
              <FileJson className="h-3.5 w-3.5" />
              JSON
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportPDF}>
              <FileText className="h-3.5 w-3.5" />
              Relatório PDF
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {[
            { label: "Provisionamento", status: "completed", desc: "SIM provisionado" },
            { label: "QR Code / LPA", status: activationData ? "completed" : "pending", desc: activationData ? "Disponível para leitura" : "Aguardando geração" },
            { label: "Ativação Rede", status: line.status === "ACTIVE" ? "completed" : "pending", desc: "Linha ativa na rede" },
            { label: "Consumo / Portab.", status: line.usage?.current !== undefined ? "completed" : "pending", desc: "Dados integrados" }
          ].map((step, i) => (
            <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${step.status === 'completed' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-100'}`}>
              {step.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300 mt-0.5" />
              )}
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${step.status === 'completed' ? 'text-emerald-700' : 'text-gray-500'}`}>{step.label}</span>
                <span className="text-[10px] text-muted-foreground">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Subscriber Card */}
          <Card className="p-5 relative overflow-hidden bg-white border-muted/40 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-base uppercase text-gray-900">{line.name}</h3>
                <p className="text-xs text-muted-foreground font-semibold uppercase">{detailData.operator}</p>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p>MCC: {detailData.mcc} • MNC: {detailData.mnc}</p>
                  <p>Última atualização: {detailData.lastUpdate}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-none text-xs h-6 gap-1.5 px-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </Badge>
            </div>
            <div className="absolute right-0 bottom-0 p-3 opacity-10">
              <Signal className="h-14 w-14" />
            </div>
          </Card>

          {/* Service Info */}
          <Card className="p-5 bg-white border-muted/40 shadow-sm">
            <div className="flex items-center justify-between mb-5 border-b pb-3">
              <h3 className="text-sm font-bold text-sky-600 uppercase tracking-wider">Serviço</h3>
              <MoreVertical className="h-5 w-5 text-muted-foreground cursor-pointer" />
            </div>
            <div className="space-y-5">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Número Móvel</span>
                <span className="text-lg font-bold text-gray-900">{N.msisdn ? formatMsisdn(N.msisdn) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">Terminal</span>
                <span className="text-base font-bold text-gray-900">{N.terminal || "—"}</span>
              </div>
              
              <div className="pt-4 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs h-6 font-bold uppercase">{N.status}</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Provisionamento na rede</span>
                  <span className={`font-bold uppercase text-xs ${N.network ? 'text-emerald-600' : 'text-gray-400'}`}>{N.network ? 'Confirmado' : 'Aguardando'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Data de ativação</span>
                  <span className="font-semibold text-gray-800">{parseIsoToBR(N.activatedAt, true)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Data de atualização</span>
                  <span className="font-semibold text-gray-800">{parseIsoToBR(N.publishedAt, true)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Ciclo do plano</span>
                  <span className="font-black text-gray-900">{N.cycle ?? "—"}</span>
                </div>
              </div>

            </div>
          </Card>

          {/* SIM Info & QR Code */}
          <Card className="p-5 bg-white border-muted/40 shadow-sm">
            <div className="flex items-center justify-between mb-5 border-b pb-3">
              <h3 className="text-sm font-bold text-sky-600 uppercase tracking-wider">SIM & Ativação</h3>
              <MoreVertical className="h-5 w-5 text-muted-foreground cursor-pointer" />
            </div>
            
            <div className="space-y-4">
              {[
                { label: "Tipo", value: detailData.sim.type },
                { label: "ICCID", value: detailData.sim.iccid, mono: true },
                { label: "IMSI", value: detailData.sim.imsi, mono: true },
                { label: "Perfil", value: detailData.sim.profile },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className={`font-semibold text-gray-800 ${item.mono ? 'font-mono text-xs' : ''}`}>{item.value}</span>
                </div>
              ))}
            </div>

            {isEsim && (
              <div className="mt-6 pt-6 border-t flex flex-col items-center">
                {activationData ? (
                  <>
                    <div className="qr-code-svg bg-white p-3 border rounded-xl shadow-sm mb-4">
                      <QRCodeSVG value={activationData} size={140} />
                    </div>
                    <div className="text-center space-y-3 w-full">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase text-left ml-1">Conteúdo LPA</span>
                        <div className="relative group">
                          <div className="p-2 bg-slate-50 border rounded text-[9px] font-mono text-slate-600 break-all text-left pr-8">
                            {activationData}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-slate-200"
                            onClick={copyLPA}
                          >
                            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full h-9 text-xs gap-1.5 font-bold" 
                        onClick={downloadHighResQR}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Baixar em Alta Resolução
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                    <RefreshCw className={`h-10 w-10 text-sky-400 ${isPolling ? 'animate-spin' : ''}`} />
                    <div>
                      <p className="text-sm font-bold text-gray-800">Aguardando QR Code</p>
                      <p className="text-xs text-muted-foreground">O provisionamento do eSIM está em andamento.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t flex justify-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs font-bold border-sky-100 text-sky-600 hover:bg-sky-50">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Validar Payload
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      Validação de Payload (Sandbox vs Schema)
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto p-4 space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Campo Esperado</TableHead>
                          <TableHead>Valor Recebido</TableHead>
                          <TableHead className="w-[100px] text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { key: 'document', label: 'Documento (CPF/CNPJ)', val: line.document },
                          { key: 'name', label: 'Nome do Assinante', val: line.name },
                          { key: 'iccid', label: 'ICCID (Chip)', val: line.iccid || line.card?.iccid },
                          { key: 'msisdn', label: 'MSISDN (Linha)', val: line.msisdn },
                          { key: 'terminal', label: 'Terminal', val: line.terminal },
                          { key: 'activationData', label: 'QR Code (LPA)', val: activationData },
                          { key: 'usage', label: 'Dados de Consumo', val: line.usage?.current !== undefined ? 'Integrado' : null },
                          { key: 'address', label: 'Endereço Completo', val: line.address?.street ? 'Integrado' : null },
                          { key: 'portabilityData', label: 'Portabilidade', val: line.portabilityData?.status ? 'Integrado' : null },
                          { key: 'device', label: 'Dispositivo', val: line.device?.name ? 'Integrado' : null },
                        ].map((field) => (
                          <TableRow key={field.key}>
                            <TableCell className="font-semibold text-xs">{field.label}</TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {field.val ? (typeof field.val === 'string' ? field.val : 'OK') : 'NÃO ENCONTRADO'}
                            </TableCell>
                            <TableCell className="text-center">
                              {field.val ? 
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : 
                                <AlertCircle className="h-4 w-4 text-rose-500 mx-auto" />
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="bg-slate-950 p-4 rounded-md">
                      <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Raw Response (Full)</h4>
                      <pre className="text-[10px] text-slate-50 font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(line, null, 2)}
                      </pre>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>

        {/* Right Column - Details Tables */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Row Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Usage Card */}
            <Card className="p-5 bg-white border-muted/40 shadow-sm col-span-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-800">{N.products[0]?.name || "Plano"}</h3>
              </div>
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-bold uppercase">Dados</span>
                    <span className="font-black text-gray-900">{detailData.usage.current} GB / {detailData.usage.total} GB ({detailData.usage.percentage}%)</span>
                  </div>
                  <Progress value={detailData.usage.percentage} className="h-2.5 bg-gray-100" indicatorClassName="bg-emerald-500 shadow-sm" />
                </div>
                <div className="space-y-2.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-bold uppercase">Ciclo</span>
                    <span className="font-black text-sky-600">{detailData.usage.daysLeft}/{detailData.usage.totalDays} dias ({detailData.usage.daysPercentage}%)</span>
                  </div>
                  <Progress value={detailData.usage.daysPercentage} className="h-2.5 bg-gray-100" indicatorClassName="bg-sky-500 shadow-sm" />
                </div>
              </div>
            </Card>

            {/* Device / Network Card */}
            <Card className="p-5 bg-white border-muted/40 shadow-sm col-span-1">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dispositivo & Rede</h3>
                {detailData.network ? (
                  <Badge variant="secondary" className={`text-[9px] h-5 font-bold ${detailData.network.state === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'} border-none`}>
                    {detailData.network.state === 'online' ? <Wifi className="h-3 w-3 mr-1 inline" /> : <WifiOff className="h-3 w-3 mr-1 inline" />}
                    {detailData.network.state === 'online' ? 'Registrada' : 'Offline'}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] h-5 font-bold bg-gray-100 text-gray-600 border-none">Não atachada</Badge>
                )}
              </div>
              <div className="flex gap-5">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50 flex items-center justify-center border border-muted/30 shadow-inner">
                  <Smartphone className="h-10 w-10 text-sky-500" />
                </div>
                <div className="space-y-1.5 pt-1 flex-1">
                  {detailData.network ? (
                    <>
                      <h4 className="text-sm font-black text-gray-900">{detailData.network.operator}</h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-none text-[9px] h-4 px-1.5 font-bold">{detailData.network.tech || '—'}</Badge>
                        <Badge variant="secondary" className="bg-sky-100 text-sky-700 border-none text-[9px] h-4 px-1.5 ml-1 font-bold">{detailData.sim.type}</Badge>
                      </p>
                      {detailData.network.imei && <p className="text-xs text-muted-foreground font-semibold">IMEI: {detailData.network.imei}</p>}
                      {detailData.network.lastSeen && <p className="text-[10px] text-muted-foreground">Última conexão: {parseIsoToBR(detailData.network.lastSeen, true)}</p>}
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-black text-gray-900">Dispositivo não identificado</h4>
                      <p className="text-xs text-muted-foreground">A linha ainda não está registrada na rede.</p>
                      <p className="text-[10px] text-muted-foreground">Marca, modelo e IMEI são preenchidos pela operadora após o primeiro registro do chip em um aparelho.</p>
                      <Badge variant="secondary" className="bg-sky-100 text-sky-700 border-none text-[9px] h-4 px-1.5 font-bold mt-1">{detailData.sim.type}</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Signal */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><Signal className="h-3 w-3" /> Força do sinal</span>
                  {signalBucket ? (
                    <span className="text-xs font-bold text-gray-800">{detailData.network?.signal} dBm · {signalBucket.label}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem dados</span>
                  )}
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${signalBucket?.color || 'bg-gray-200'}`} style={{ width: `${signalBucket?.pct ?? 0}%` }} />
                </div>
                {detailData.network && (detailData.network.mcc || detailData.network.cellId) && (
                  <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                    MCC {detailData.network.mcc || '—'} · MNC {detailData.network.mnc || '—'}
                    {detailData.network.lac ? ` · LAC ${detailData.network.lac}` : ''}
                    {detailData.network.cellId ? ` · Cell ${detailData.network.cellId}` : ''}
                  </p>
                )}
              </div>
            </Card>

          </div>

          {/* Registration Info */}
          <Card className="p-5 bg-white border-muted/40 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-sm font-bold text-sky-600 uppercase tracking-wider">Informações cadastrais</h3>
              <MoreVertical className="h-5 w-5 text-muted-foreground cursor-pointer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{line.name}</p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Documento (CPF/CNPJ)</p>
                  <p className="text-sm font-bold text-gray-800">{line.document}</p>
                </div>
              </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground uppercase">Endereço</p>
                  <div className="text-sm font-medium text-gray-800 space-y-0.5">
                    <p>{detailData.address.street}, {detailData.address.number}</p>
                    {detailData.address.complement && <p>{detailData.address.complement}</p>}
                    <p>{detailData.address.neighborhood}</p>
                    <p>{detailData.address.city} - {detailData.address.state}</p>
                    <p>{detailData.address.zipcode}</p>
                  </div>
                </div>
            </div>
          </Card>

          {/* Products Table */}
          <Card className="bg-white border-muted/40 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-sky-600 uppercase tracking-wider">Produtos</h3>
              <MoreVertical className="h-5 w-5 text-muted-foreground cursor-pointer" />
            </div>
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="text-xs uppercase font-black text-muted-foreground h-12">SKU</TableHead>
                  <TableHead className="text-xs uppercase font-black text-muted-foreground h-12">Produto</TableHead>
                  <TableHead className="text-xs uppercase font-black text-muted-foreground h-12">Data de ativação</TableHead>
                  <TableHead className="text-xs uppercase font-black text-muted-foreground h-12">Data de cancelamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailData.products.map((p: any, i: number) => (
                  <TableRow key={i} className="hover:bg-muted/5 border-b last:border-0 transition-colors">
                    <TableCell className="text-sm font-black py-4 text-gray-900">{p.sku}</TableCell>
                    <TableCell className="text-sm font-bold py-4 text-gray-800">{p.name}</TableCell>
                    <TableCell className="text-sm py-4 font-medium text-gray-700">{parseIsoToBR(p.activatedAt)}</TableCell>
                    <TableCell className="text-sm py-4 text-muted-foreground font-medium">{p.cancelledAt ? parseIsoToBR(p.cancelledAt) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t bg-gray-50/50 flex justify-end">
               <p className="text-xs font-bold text-muted-foreground">Itens por página: 10 | 1-{detailData.products.length} de {detailData.products.length}</p>
            </div>
          </Card>

          {/* Portability Banner */}
          <Card className="bg-white border-muted/40 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-sky-600 uppercase tracking-wider">Portabilidade</h3>
              <div className="flex items-center gap-4">
                <RefreshCw className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-sky-500 transition-colors" />
                <MoreVertical className="h-5 w-5 text-muted-foreground cursor-pointer" />
              </div>
            </div>
            {detailData.portability ? (
              <>
                <div className="px-5 pt-5 pb-0">
                  {(() => {
                    const t = translatePortStatus(detailData.portability.status);
                    return (
                      <div className={`rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 border ${t.color}`}>
                        <h4 className="text-base font-black">{t.label}</h4>
                        <p className="text-xs font-bold uppercase opacity-70">Atualizado em {parseIsoToBR(detailData.portability.updatedAt, true)}</p>
                      </div>
                    );
                  })()}
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: "Número a ser portado", value: detailData.portability.tn ? formatMsisdn(detailData.portability.tn) : "—" },
                    { label: "Novo número (tnReplace)", value: detailData.portability.tnReplace ? formatMsisdn(detailData.portability.tnReplace) : "—" },
                    { label: "BP", value: detailData.portability.bp },
                    { label: "Locale", value: detailData.portability.locale },
                    { label: "Data de solicitação", value: parseIsoToBR(detailData.portability.createdAt, true) },
                    { label: "Data da portabilidade (janela)", value: parseIsoToBR(detailData.portability.window, true), bold: true },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <span className="text-muted-foreground font-bold">{item.label}</span>
                      <span className={`text-gray-900 ${item.bold ? 'font-black text-base' : 'font-bold'}`}>{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-end pt-3">
                     <Button variant="outline" size="sm" className="text-xs font-bold h-9 gap-2 px-4 border-muted/60 hover:bg-muted/10 transition-all">
                       Ações <ChevronLeft className="h-4 w-4 -rotate-90" />
                     </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-sm text-muted-foreground">Linha sem portabilidade vinculada.</div>
            )}
          </Card>



          {/* Protocols Table */}
          <Card className="bg-white border-muted/40 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-sky-600 uppercase tracking-wider">Protocolos</h3>
              <MoreVertical className="h-5 w-5 text-muted-foreground cursor-pointer" />
            </div>
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="text-xs uppercase font-black text-muted-foreground h-12">Protocolo</TableHead>
                  <TableHead className="text-xs uppercase font-black text-muted-foreground h-12">Assunto</TableHead>
                  <TableHead className="text-xs uppercase font-black text-muted-foreground h-12">Status</TableHead>
                  <TableHead className="text-xs uppercase font-black text-muted-foreground h-12">Data de abertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailData.protocols.map((prot, i) => (
                  <TableRow key={i} className="hover:bg-muted/5 border-b last:border-0 transition-colors">
                    <TableCell className="text-sm font-black py-4 text-gray-900">{prot.id}</TableCell>
                    <TableCell className="text-sm font-bold py-4 text-gray-800">{prot.subject}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-none text-[10px] h-5 font-bold uppercase">{prot.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm py-4 font-medium text-gray-700">{prot.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t bg-gray-50/50 flex justify-end">
               <p className="text-xs font-bold text-muted-foreground">Itens por página: 10 | 1-2 de 2</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
