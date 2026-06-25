import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, Download, Trash2, Smartphone, FileText, Image as ImageIcon, Eye, ChevronRight, Pencil, Radio, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import esimTemplate from "@/assets/esim-template.png";
import { EaiMvnoTab } from "@/components/admin/esim/eai/EaiMvnoTab";
import { AlgarMvnoTab } from "@/components/admin/esim/algar/AlgarMvnoTab";

type NumeroInfo = { novoNumero?: string; numeroAtual?: string; numeroTemporario?: string };

// QR placeholder box (normalized to template image 1055x1491)
// Inner safe area inside the orange/blue border
const QR_BOX = { x: 0.245, y: 0.395, w: 0.500, h: 0.325 };

// Extracts the storage object path from either a stored path or an old public URL.
function esimPathOf(stored: string | null): string | null {
  if (!stored) return null;
  const clean = stored.split("?")[0];
  const marker = "/esim-assets/";
  const idx = clean.indexOf(marker);
  if (idx >= 0) return clean.slice(idx + marker.length);
  return clean.replace(/^\/+/, "");
}

async function openEsimAsset(stored: string | null, opts: { download?: boolean; filename?: string } = {}) {
  const path = esimPathOf(stored);
  if (!path) return toast.error("Arquivo indisponível");
  const { data, error } = await supabase.storage
    .from("esim-assets")
    .createSignedUrl(path, 60, opts.download ? { download: opts.filename || true } : undefined);
  if (error || !data?.signedUrl) return toast.error("Não foi possível gerar o link");
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

type EsimRecord = {
  id: string;
  client_id: string;
  qr_url: string | null;
  pdf_url: string | null;
  novo_numero: string | null;
  numero_atual: string | null;
  numero_temporario: string | null;
  created_at: string;
};

type EsimClient = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  created_at: string;
};

type EsimClientWithRecords = EsimClient & { records: EsimRecord[] };

async function loadImageBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function buildPdf(qrBytes: Uint8Array, qrIsPng: boolean, info?: NumeroInfo | string): Promise<Uint8Array> {
  // Backwards compat: aceita string (legado = novoNumero) ou objeto
  const data: NumeroInfo = typeof info === "string" ? { novoNumero: info } : (info || {});
  const atual = (data.numeroAtual || "").trim();
  const temp = (data.numeroTemporario || "").trim();
  const novo = (data.novoNumero || "").trim();
  const isPort = !!(atual || temp);
  const lines: string[] = isPort
    ? [atual ? `Atual: ${atual}` : "", temp ? `Temporário: ${temp}` : ""].filter(Boolean)
    : novo
    ? [`Novo número: ${novo}`]
    : [];

  const tplBytes = await loadImageBytes(esimTemplate);
  const pdf = await PDFDocument.create();
  const tplImg = await pdf.embedPng(tplBytes);
  const { width, height } = tplImg;
  const page = pdf.addPage([width, height]);
  page.drawImage(tplImg, { x: 0, y: 0, width, height });

  const qrImg = qrIsPng ? await pdf.embedPng(qrBytes) : await pdf.embedJpg(qrBytes);
  const boxW = QR_BOX.w * width;
  const boxH = QR_BOX.h * height;
  const boxX = QR_BOX.x * width;
  // pdf-lib y origin is bottom; convert
  const boxY = height - QR_BOX.y * height - boxH;

  // Reserva espaço para o(s) texto(s) abaixo do QR mas dentro do QR_BOX
  const textRatio = lines.length === 0 ? 0 : lines.length === 1 ? 0.16 : 0.22;
  const textAreaH = boxH * textRatio;
  const qrAreaH = boxH - textAreaH;

  // Fit QR inside QR area (top), centered
  const scale = Math.min(boxW / qrImg.width, qrAreaH / qrImg.height);
  const drawW = qrImg.width * scale;
  const drawH = qrImg.height * scale;
  const drawX = boxX + (boxW - drawW) / 2;
  const drawY = boxY + textAreaH + (qrAreaH - drawH) / 2;
  page.drawImage(qrImg, { x: drawX, y: drawY, width: drawW, height: drawH });

  if (lines.length > 0) {
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    // Tamanho base; reduz se alguma linha não couber
    let fontSize = boxW * (lines.length === 1 ? 0.055 : 0.05);
    for (const line of lines) {
      const w = font.widthOfTextAtSize(line, fontSize);
      if (w > boxW * 0.95) fontSize = (boxW * 0.95 * fontSize) / w;
    }
    const lineGap = fontSize * 0.35;
    const totalH = fontSize * lines.length + lineGap * (lines.length - 1);
    const startY = boxY + (textAreaH - totalH) / 2 + (lines.length - 1) * (fontSize + lineGap);
    lines.forEach((line, i) => {
      const w = font.widthOfTextAtSize(line, fontSize);
      const x = boxX + (boxW - w) / 2;
      const y = startY - i * (fontSize + lineGap);
      page.drawText(line, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
    });
  }

  return await pdf.save();
}

function GeradorTab({ onCreated }: { onCreated: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [novoNumero, setNovoNumero] = useState("");
  const [isPortabilidade, setIsPortabilidade] = useState(false);
  const [numeroAtual, setNumeroAtual] = useState("");
  const [numeroTemporario, setNumeroTemporario] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setQrFile(f);
    if (qrPreview) URL.revokeObjectURL(qrPreview);
    setQrPreview(f ? URL.createObjectURL(f) : null);
  }

  function formatTelefone(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function reset() {
    setNome("");
    setEmail("");
    setTelefone("");
    setNovoNumero("");
    setIsPortabilidade(false);
    setNumeroAtual("");
    setNumeroTemporario("");
    setQrFile(null);
    if (qrPreview) URL.revokeObjectURL(qrPreview);
    setQrPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe o nome do cliente");
    if (!qrFile) return toast.error("Anexe o QR code do eSIM");

    setSubmitting(true);
    try {
      const ext = qrFile.name.split(".").pop()?.toLowerCase() || "png";
      const isPng = qrFile.type === "image/png" || ext === "png";

      // 1) Localiza ou cria o cliente (chave: email, case-insensitive)
      const emailNorm = email.trim().toLowerCase();
      let clientId: string | null = null;

      if (emailNorm) {
        const { data: existing, error: findErr } = await supabase
          .from("esim_clients")
          .select("id")
          .ilike("email", emailNorm)
          .maybeSingle();
        if (findErr) throw findErr;
        if (existing) {
          clientId = existing.id;
          // Atualiza dados de contato com os mais recentes
          await supabase
            .from("esim_clients")
            .update({
              nome: nome.trim(),
              telefone: telefone.trim() ? `+55 ${telefone.trim()}` : null,
            })
            .eq("id", clientId);
        }
      }

      if (!clientId) {
        clientId = crypto.randomUUID();
        const { error: cliErr } = await supabase.from("esim_clients").insert({
          id: clientId,
          nome: nome.trim(),
          email: email.trim() || null,
          telefone: telefone.trim() ? `+55 ${telefone.trim()}` : null,
        });
        if (cliErr) throw cliErr;
      }

      // 2) Cria o registro do eSIM
      const recordId = crypto.randomUUID();
      const qrPath = `${clientId}/${recordId}/qr.${ext}`;
      const { error: qrErr } = await supabase.storage
        .from("esim-assets")
        .upload(qrPath, qrFile, { upsert: true, contentType: qrFile.type });
      if (qrErr) throw qrErr;

      // 3) Gera PDF
      const qrBytes = new Uint8Array(await qrFile.arrayBuffer());
      const numeroInfo: NumeroInfo = isPortabilidade
        ? { numeroAtual: numeroAtual.trim(), numeroTemporario: numeroTemporario.trim() }
        : { novoNumero: novoNumero.trim() };
      const pdfBytes = await buildPdf(qrBytes, isPng, numeroInfo);
      const pdfPath = `${clientId}/${recordId}/esim.pdf`;
      const { error: pdfErr } = await supabase.storage
        .from("esim-assets")
        .upload(pdfPath, new Blob([pdfBytes as BlobPart], { type: "application/pdf" }), {
          upsert: true,
          contentType: "application/pdf",
        });
      if (pdfErr) throw pdfErr;

      // 4) Salva o registro (armazena apenas os caminhos; URLs assinadas geradas sob demanda)
      const { error: recErr } = await supabase.from("esim_records").insert({
        id: recordId,
        client_id: clientId,
        qr_url: qrPath,
        pdf_url: pdfPath,
        novo_numero: isPortabilidade ? null : (novoNumero.trim() || null),
        numero_atual: isPortabilidade ? (numeroAtual.trim() || null) : null,
        numero_temporario: isPortabilidade ? (numeroTemporario.trim() || null) : null,
      } as any);
      if (recErr) throw recErr;

      // 5) Download imediato
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `esim-${nome.trim().toLowerCase().replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("eSIM gerado com sucesso");
      reset();
      onCreated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar eSIM");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Smartphone className="h-4 w-4" /> Dados do cliente
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} placeholder="João da Silva" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} placeholder="joao@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                +55
              </span>
              <Input
                id="telefone"
                type="tel"
                inputMode="tel"
                value={telefone}
                onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                maxLength={16}
                placeholder="(11) 99999-9999"
                className="rounded-l-none"
              />
            </div>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <div>
              <Label htmlFor="portabilidade" className="cursor-pointer">Portabilidade</Label>
              <p className="text-xs text-muted-foreground">Ative para informar o número atual do cliente e o número temporário gerado.</p>
            </div>
            <Switch id="portabilidade" checked={isPortabilidade} onCheckedChange={setIsPortabilidade} />
          </div>
          {isPortabilidade ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="numero-atual">Número atual</Label>
                <Input
                  id="numero-atual"
                  type="tel"
                  inputMode="tel"
                  value={numeroAtual}
                  onChange={(e) => setNumeroAtual(formatTelefone(e.target.value))}
                  maxLength={16}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero-temp">Número temporário</Label>
                <Input
                  id="numero-temp"
                  type="tel"
                  inputMode="tel"
                  value={numeroTemporario}
                  onChange={(e) => setNumeroTemporario(formatTelefone(e.target.value))}
                  maxLength={16}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <p className="sm:col-span-2 text-xs text-muted-foreground">Ambos serão impressos no PDF, abaixo do QR Code.</p>
            </>
          ) : (
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="novo-numero">Novo número</Label>
              <Input
                id="novo-numero"
                type="tel"
                inputMode="tel"
                value={novoNumero}
                onChange={(e) => setNovoNumero(formatTelefone(e.target.value))}
                maxLength={16}
                placeholder="(11) 99999-9999"
              />
              <p className="text-xs text-muted-foreground">Será impresso no PDF, abaixo do QR Code.</p>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="qr">QR Code do eSIM *</Label>
          <label
            htmlFor="qr"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 px-6 py-10 text-center transition hover:border-primary/50 hover:bg-muted/50"
          >
            {qrPreview ? (
              <img src={qrPreview} alt="QR preview" className="h-32 w-32 rounded-lg border bg-white object-contain p-2" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="text-sm">
              <span className="font-medium text-primary">Clique para enviar</span>
              <span className="text-muted-foreground"> ou arraste a imagem</span>
            </div>
            <p className="text-xs text-muted-foreground">PNG ou JPG do QR code</p>
            <Input id="qr" type="file" accept="image/png,image/jpeg" className="hidden" onChange={onQrChange} />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting} className="min-w-40">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Gerar PDF do eSIM
          </Button>
          <Button type="button" variant="outline" onClick={reset} disabled={submitting}>
            Limpar
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3 bg-muted/20">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ImageIcon className="h-4 w-4" /> Pré-visualização
        </div>
        <div className="relative overflow-hidden rounded-lg border bg-white">
          <img src={esimTemplate} alt="Template eSIM" className="block w-full" />
          {qrPreview && (() => {
            const previewLines = isPortabilidade
              ? [numeroAtual.trim() ? `Atual: ${numeroAtual}` : "", numeroTemporario.trim() ? `Temporário: ${numeroTemporario}` : ""].filter(Boolean)
              : (novoNumero.trim() ? [`Novo número: ${novoNumero}`] : []);
            const ratio = previewLines.length === 0 ? 0 : previewLines.length === 1 ? 0.16 : 0.22;
            return (
              <>
                <img
                  src={qrPreview}
                  alt="QR no template"
                  className="absolute bg-white object-contain p-1"
                  style={{
                    left: `${QR_BOX.x * 100}%`,
                    top: `${QR_BOX.y * 100}%`,
                    width: `${QR_BOX.w * 100}%`,
                    height: `${QR_BOX.h * (1 - ratio) * 100}%`,
                  }}
                />
                {previewLines.length > 0 && (
                  <div
                    className="absolute flex flex-col items-center justify-center text-center font-bold text-black leading-tight"
                    style={{
                      left: `${QR_BOX.x * 100}%`,
                      top: `${(QR_BOX.y + QR_BOX.h * (1 - ratio)) * 100}%`,
                      width: `${QR_BOX.w * 100}%`,
                      height: `${QR_BOX.h * ratio * 100}%`,
                      fontSize: previewLines.length > 1 ? "clamp(7px, 1.2vw, 12px)" : "clamp(8px, 1.4vw, 14px)",
                    }}
                  >
                    {previewLines.map((l) => <div key={l}>{l}</div>)}
                  </div>
                )}
              </>
            );
          })()}
        </div>
        <p className="text-xs text-muted-foreground">O QR enviado será posicionado dentro do quadro do material oficial.</p>
      </Card>
    </form>
  );
}

function ClientesTab() {
  const queryClient = useQueryClient();
  const [openClients, setOpenClients] = useState<Record<string, boolean>>({});
  const [editingClient, setEditingClient] = useState<EsimClient | null>(null);
  const [editingRecord, setEditingRecord] = useState<{ clientId: string; record: EsimRecord } | null>(null);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["esim_clients_with_records"],
    queryFn: async () => {
      const { data: cli, error } = await supabase
        .from("esim_clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: recs, error: e2 } = await supabase
        .from("esim_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (e2) throw e2;
      const byClient = new Map<string, EsimRecord[]>();
      for (const r of (recs || []) as unknown as EsimRecord[]) {
        const arr = byClient.get(r.client_id) || [];
        arr.push(r);
        byClient.set(r.client_id, arr);
      }
      return (cli as EsimClient[]).map((c) => ({
        ...c,
        records: byClient.get(c.id) || [],
      })) as EsimClientWithRecords[];
    },
  });

  async function handleDeleteClient(c: EsimClientWithRecords) {
    if (!confirm(`Remover ${c.nome} e todos os ${c.records.length} eSIM(s)?`)) return;
    try {
      const paths: string[] = [];
      for (const r of c.records) {
        for (const ext of ["png", "jpg", "jpeg"]) paths.push(`${c.id}/${r.id}/qr.${ext}`);
        paths.push(`${c.id}/${r.id}/esim.pdf`);
      }
      if (paths.length) await supabase.storage.from("esim-assets").remove(paths);
      const { error } = await supabase.from("esim_clients").delete().eq("id", c.id);
      if (error) throw error;
      toast.success("Cliente removido");
      queryClient.invalidateQueries({ queryKey: ["esim_clients_with_records"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover");
    }
  }

  async function handleDeleteRecord(clientId: string, r: EsimRecord) {
    if (!confirm("Remover este eSIM?")) return;
    try {
      const paths = ["png", "jpg", "jpeg"].map((e) => `${clientId}/${r.id}/qr.${e}`);
      paths.push(`${clientId}/${r.id}/esim.pdf`);
      await supabase.storage.from("esim-assets").remove(paths);
      const { error } = await supabase.from("esim_records").delete().eq("id", r.id);
      if (error) throw error;
      toast.success("eSIM removido");
      queryClient.invalidateQueries({ queryKey: ["esim_clients_with_records"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando clientes…
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <Smartphone className="mx-auto mb-3 h-10 w-10 opacity-40" />
        Nenhum cliente cadastrado ainda. Use a aba "Gerador" para criar o primeiro.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {clientes.map((c) => {
        const isOpen = !!openClients[c.id];
        const count = c.records.length;
        return (
          <Card key={c.id} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenClients((s) => ({ ...s, [c.id]: !isOpen }))}
              className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/30 transition"
            >
              <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{c.nome}</span>
                  <Badge variant="secondary" className="text-[10px]">{count} eSIM{count !== 1 ? "s" : ""}</Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {c.email || "sem e-mail"}{c.telefone ? ` • ${c.telefone}` : ""}
                </div>
              </div>
              <div className="hidden sm:block text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString("pt-BR")}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setEditingClient(c); }}
                title="Editar cliente"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); handleDeleteClient(c); }}
                title="Excluir cliente"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </button>

            {isOpen && (
              <div className="border-t bg-muted/10 px-4 py-3 space-y-2">
                {count === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Nenhum eSIM gerado para este cliente.</p>
                ) : (
                  c.records.map((r, idx) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">#{count - idx}</Badge>
                      <div className="flex-1 text-xs text-muted-foreground">
                        <div>{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                        {(r.numero_atual || r.numero_temporario) ? (
                          <div className="mt-0.5 space-y-0.5">
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Portabilidade</Badge>
                            {r.numero_atual && (
                              <div className="font-medium text-primary">Atual: {r.numero_atual}</div>
                            )}
                            {r.numero_temporario && (
                              <div className="font-medium text-primary">Temporário: {r.numero_temporario}</div>
                            )}
                          </div>
                        ) : r.novo_numero && (
                          <div className="mt-0.5 font-medium text-primary">
                            Novo número: {r.novo_numero}
                          </div>
                        )}
                      </div>
                      {r.qr_url && (
                        <Button size="sm" variant="ghost" title="Ver QR" onClick={() => openEsimAsset(r.qr_url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {r.pdf_url && (
                        <Button size="sm" variant="outline" title="Baixar PDF" onClick={() => openEsimAsset(r.pdf_url, { download: true, filename: `esim-${c.nome.trim().toLowerCase().replace(/\s+/g, "-")}.pdf` })}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setEditingRecord({ clientId: c.id, record: r })} title="Substituir QR / regenerar PDF">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteRecord(c.id, r)} title="Excluir eSIM">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        );
      })}

      <EditClientDialog
        client={editingClient}
        onClose={() => setEditingClient(null)}
        onSaved={() => {
          setEditingClient(null);
          queryClient.invalidateQueries({ queryKey: ["esim_clients_with_records"] });
        }}
      />
      <EditRecordDialog
        data={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSaved={() => {
          setEditingRecord(null);
          queryClient.invalidateQueries({ queryKey: ["esim_clients_with_records"] });
        }}
      />
    </div>
  );
}

function EditClientDialog({
  client,
  onClose,
  onSaved,
}: {
  client: EsimClient | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [saving, setSaving] = useState(false);

  function formatTelefoneEdit(value: string) {
    const d = value.replace(/\D/g, "").replace(/^55/, "").slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  // Reset fields when opening
  if (client && nome === "" && email === "" && telefone === "") {
    setNome(client.nome || "");
    setEmail(client.email || "");
    setTelefone(formatTelefoneEdit(client.telefone || ""));
  }

  async function save() {
    if (!client) return;
    if (!nome.trim()) return toast.error("Informe o nome");
    setSaving(true);
    try {
      const { error } = await supabase
        .from("esim_clients")
        .update({
          nome: nome.trim(),
          email: email.trim() || null,
          telefone: telefone.trim() ? `+55 ${telefone.trim()}` : null,
        })
        .eq("id", client.id);
      if (error) throw error;
      toast.success("Cliente atualizado");
      setNome(""); setEmail(""); setTelefone("");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setNome(""); setEmail(""); setTelefone("");
    onClose();
  }

  return (
    <Dialog open={!!client} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">+55</span>
              <Input
                type="tel"
                inputMode="tel"
                value={telefone}
                onChange={(e) => setTelefone(formatTelefoneEdit(e.target.value))}
                maxLength={16}
                placeholder="(11) 99999-9999"
                className="rounded-l-none"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditRecordDialog({
  data,
  onClose,
  onSaved,
}: {
  data: { clientId: string; record: EsimRecord } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [novoNumero, setNovoNumero] = useState("");
  const [isPortabilidade, setIsPortabilidade] = useState(false);
  const [numeroAtual, setNumeroAtual] = useState("");
  const [numeroTemporario, setNumeroTemporario] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = data?.record;
    setNovoNumero(r?.novo_numero ?? "");
    setNumeroAtual(r?.numero_atual ?? "");
    setNumeroTemporario(r?.numero_temporario ?? "");
    setIsPortabilidade(!!(r?.numero_atual || r?.numero_temporario));
  }, [data]);

  function formatTelefoneEditRec(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function onQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setQrFile(f);
    if (qrPreview) URL.revokeObjectURL(qrPreview);
    setQrPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleClose() {
    if (qrPreview) URL.revokeObjectURL(qrPreview);
    setQrPreview(null);
    setQrFile(null);
    onClose();
  }

  async function save() {
    if (!data) return;
    const rec = data.record;
    const novoNorm = novoNumero.trim() || null;
    const atualNorm = numeroAtual.trim() || null;
    const tempNorm = numeroTemporario.trim() || null;
    const portChanged =
      isPortabilidade
        ? (atualNorm !== (rec.numero_atual ?? null) || tempNorm !== (rec.numero_temporario ?? null) || rec.novo_numero !== null)
        : (novoNorm !== (rec.novo_numero ?? null) || rec.numero_atual !== null || rec.numero_temporario !== null);
    if (!qrFile && !portChanged) return toast.error("Anexe um novo QR code ou altere os números");
    setSaving(true);
    try {
      const { clientId, record } = data;
      let qrPath = record.qr_url ?? "";
      let isPng = qrPath.toLowerCase().endsWith(".png");
      let qrBytes: Uint8Array;

      if (qrFile) {
        const ext = qrFile.name.split(".").pop()?.toLowerCase() || "png";
        isPng = qrFile.type === "image/png" || ext === "png";

        // Remove arquivos antigos
        const oldPaths = ["png", "jpg", "jpeg"].map((e) => `${clientId}/${record.id}/qr.${e}`);
        oldPaths.push(`${clientId}/${record.id}/esim.pdf`);
        await supabase.storage.from("esim-assets").remove(oldPaths);

        // Upload novo QR
        qrPath = `${clientId}/${record.id}/qr.${ext}`;
        const { error: qrErr } = await supabase.storage
          .from("esim-assets")
          .upload(qrPath, qrFile, { upsert: true, contentType: qrFile.type });
        if (qrErr) throw qrErr;

        qrBytes = new Uint8Array(await qrFile.arrayBuffer());
      } else {
        // Reaproveita QR atual para regerar PDF com o novo número
        const path = esimPathOf(qrPath);
        if (!path) throw new Error("QR atual indisponível");
        const { data: dl, error: dlErr } = await supabase.storage.from("esim-assets").download(path);
        if (dlErr || !dl) throw dlErr || new Error("Falha ao baixar QR");
        qrBytes = new Uint8Array(await dl.arrayBuffer());
      }

      // Regenera PDF
      const numeroInfo: NumeroInfo = isPortabilidade
        ? { numeroAtual: numeroAtual.trim(), numeroTemporario: numeroTemporario.trim() }
        : { novoNumero: novoNumero.trim() };
      const pdfBytes = await buildPdf(qrBytes, isPng, numeroInfo);
      const pdfPath = `${clientId}/${record.id}/esim.pdf`;
      const { error: pdfErr } = await supabase.storage
        .from("esim-assets")
        .upload(pdfPath, new Blob([pdfBytes as BlobPart], { type: "application/pdf" }), {
          upsert: true,
          contentType: "application/pdf",
        });
      if (pdfErr) throw pdfErr;

      // Atualiza registro armazenando os caminhos (URLs assinadas geradas sob demanda)
      const { error: upErr } = await supabase
        .from("esim_records")
        .update({
          qr_url: qrPath,
          pdf_url: pdfPath,
          novo_numero: isPortabilidade ? null : (novoNumero.trim() || null),
          numero_atual: isPortabilidade ? (numeroAtual.trim() || null) : null,
          numero_temporario: isPortabilidade ? (numeroTemporario.trim() || null) : null,
        } as any)
        .eq("id", record.id);
      if (upErr) throw upErr;

      toast.success("eSIM atualizado");
      handleClose();
      onSaved();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!data} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Substituir QR e regenerar PDF</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Envie um novo QR code para gerar um novo PDF timbrado. O QR e o PDF anteriores serão substituídos.
          </p>
          <label
            htmlFor="qr-edit"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 px-6 py-8 text-center transition hover:border-primary/50 hover:bg-muted/50"
          >
            {qrPreview ? (
              <img src={qrPreview} alt="QR preview" className="h-28 w-28 rounded-lg border bg-white object-contain p-2" />
            ) : (
              <Upload className="h-7 w-7 text-muted-foreground" />
            )}
            <div className="text-sm">
              <span className="font-medium text-primary">Clique para enviar</span>
              <span className="text-muted-foreground"> o novo QR</span>
            </div>
            <p className="text-xs text-muted-foreground">PNG ou JPG</p>
            <Input id="qr-edit" type="file" accept="image/png,image/jpeg" className="hidden" onChange={onQrChange} />
          </label>
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <Label htmlFor="portabilidade-edit" className="cursor-pointer">Portabilidade</Label>
            <Switch id="portabilidade-edit" checked={isPortabilidade} onCheckedChange={setIsPortabilidade} />
          </div>
          {isPortabilidade ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numero-atual-edit">Número atual</Label>
                <Input
                  id="numero-atual-edit"
                  type="tel"
                  inputMode="tel"
                  value={numeroAtual}
                  onChange={(e) => setNumeroAtual(formatTelefoneEditRec(e.target.value))}
                  maxLength={16}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero-temp-edit">Número temporário</Label>
                <Input
                  id="numero-temp-edit"
                  type="tel"
                  inputMode="tel"
                  value={numeroTemporario}
                  onChange={(e) => setNumeroTemporario(formatTelefoneEditRec(e.target.value))}
                  maxLength={16}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="novo-numero-edit">Novo número</Label>
              <Input
                id="novo-numero-edit"
                type="tel"
                inputMode="tel"
                value={novoNumero}
                onChange={(e) => setNovoNumero(formatTelefoneEditRec(e.target.value))}
                maxLength={16}
                placeholder="(11) 99999-9999"
              />
              <p className="text-xs text-muted-foreground">Será impresso no PDF, abaixo do QR Code.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar e gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminEsim() {
  const [tab, setTab] = useState("algar");
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="MVNO Gestão"
        subtitle="Gerencie ativações, clientes e configurações das operadoras Algar e EAI."
        extraActions={
          <a href="/admin/mvno/nova-linha">
            <Button className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white shadow-md gap-1.5">
              <Plus className="h-4 w-4" /> Nova linha
            </Button>
          </a>
        }
      />
      <div className="flex flex-wrap gap-2">
        <a href="/admin/mvno/ativacoes"><Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-2" />Histórico de ativações</Button></a>
        <a href="/admin/mvno/email-template"><Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-2" />Templates de e-mail</Button></a>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="algar">Algar MVNO</TabsTrigger>
          <TabsTrigger value="eai">EAI MVNO</TabsTrigger>
          <TabsTrigger value="gerador">Gerador</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>
        <TabsContent value="algar">
          <AlgarMvnoTab />
        </TabsContent>
        <TabsContent value="eai">
          <EaiMvnoTab />
        </TabsContent>
        <TabsContent value="gerador">
          <GeradorTab
            onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["esim_clients_with_records"] });
              setTab("clientes");
            }}
          />
        </TabsContent>
        <TabsContent value="clientes">
          <ClientesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
