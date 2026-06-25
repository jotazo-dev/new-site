import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, Upload, Send, Eye } from "lucide-react";

type Template = {
  id?: string;
  slug: string;
  subject: string;
  header_title: string;
  intro_html: string;
  footer_html: string;
  signature_html: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  pdf_header_text: string;
  pdf_footer_text: string;
};

const VARS = [
  "primeiro_nome", "nome", "tn", "iccid", "produto", "ciclo",
  "codigo_ativacao", "qr_code", "email", "telefone", "documento", "operadora", "tipo_chip",
];

const SAMPLE = {
  algar: "algar" as const,
  esim: { simType: "esim" as const, tn: "5511999990001", iccid: "8955010091234567890", productName: "Plano 30GB", cycle: 10, subscriberName: "Maria Souza", subscriberEmail: "cliente@exemplo.com", subscriberPhone: "(11) 99999-0001", subscriberDoc: "12345678901", activationCode: "LPA:1$smdp.example$matching-id", qrPayload: "LPA:1$smdp.example$matching-id" },
  sim:  { simType: "sim" as const, tn: "5511988880002", iccid: "8955010099876543210", productName: "Plano 20GB", cycle: 5, subscriberName: "João Lima", subscriberEmail: "cliente@exemplo.com", subscriberPhone: "(11) 98888-0002", subscriberDoc: "98765432100" },
};

export default function AdminMvnoEmailTemplate() {
  const [slug, setSlug] = useState<"activation_sim" | "activation_esim">("activation_esim");
  const [tpl, setTpl] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<"html" | "pdf">("html");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase.from("mvno_email_templates").select("*").eq("slug", slug).maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setTpl((data as Template) || {
          slug, subject: "", header_title: "JOTAZO TELECOM",
          intro_html: "", footer_html: "", signature_html: "",
          primary_color: "#0B4189", accent_color: "#F47F1B",
          logo_url: null, pdf_header_text: "", pdf_footer_text: "",
        });
        setLoading(false);
      });
    return () => { alive = false; };
  }, [slug]);

  async function refreshPreview() {
    if (!tpl) return;
    const body = { mode: "preview", provider: SAMPLE.algar, ...(slug === "activation_esim" ? SAMPLE.esim : SAMPLE.sim) };
    const { data, error } = await supabase.functions.invoke("send-mvno-activation-email", { body });
    if (error) { toast.error("Falha no preview"); return; }
    setPreview((data as any).html || "");
  }

  async function refreshPdfPreview() {
    setPdfLoading(true);
    try {
      const body = { mode: "preview_pdf", provider: SAMPLE.algar, ...(slug === "activation_esim" ? SAMPLE.esim : SAMPLE.sim) };
      const { data, error } = await supabase.functions.invoke("send-mvno-activation-email", { body });
      if (error) throw error;
      const b64 = (data as any).pdfBase64;
      if (b64) setPdfDataUrl(`data:application/pdf;base64,${b64}`);
    } catch (e: any) {
      toast.error(e.message || "Falha ao gerar PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  function downloadPdf() {
    if (!pdfDataUrl) return;
    const a = document.createElement("a");
    a.href = pdfDataUrl;
    a.download = `preview-${slug}.pdf`;
    a.click();
  }


  async function save(silent = false) {
    if (!tpl) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("mvno_email_templates").upsert({
        slug: tpl.slug,
        subject: tpl.subject,
        header_title: tpl.header_title,
        intro_html: tpl.intro_html,
        footer_html: tpl.footer_html,
        signature_html: tpl.signature_html,
        primary_color: tpl.primary_color,
        accent_color: tpl.accent_color,
        logo_url: tpl.logo_url,
        pdf_header_text: tpl.pdf_header_text,
        pdf_footer_text: tpl.pdf_footer_text,
      }, { onConflict: "slug" });
      if (error) throw error;
      if (!silent) toast.success("Template salvo");
      await refreshPreview();
      if (previewTab === "pdf") await refreshPdfPreview();
    } catch (e: any) {
      toast.error(e.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `mvno-email/${slug}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      setTpl((t) => t ? { ...t, logo_url: pub.publicUrl } : t);
      toast.success("Logo enviado");
    } catch (e: any) {
      toast.error(e.message || "Falha no upload");
    }
  }

  async function sendTest() {
    if (!testEmail) return toast.error("Informe um e-mail de teste");
    setSending(true);
    try {
      await save(true);
      const body = {
        mode: "test", recipientEmail: testEmail, provider: SAMPLE.algar,
        ...(slug === "activation_esim" ? SAMPLE.esim : SAMPLE.sim),
      };
      const { data, error } = await supabase.functions.invoke("send-mvno-activation-email", { body });
      if (error) throw error;
      if ((data as any)?.ok === false || (data as any)?.error) throw new Error((data as any).userMessage || (data as any).error);
      toast.success(`E-mail de teste enviado para ${testEmail}`);
    } catch (e: any) {
      toast.error(e.message || "Falha ao enviar teste");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => { if (tpl && !loading) { refreshPreview(); setPdfDataUrl(""); } /* eslint-disable-next-line */ }, [slug]);
  useEffect(() => { if (previewTab === "pdf" && !pdfDataUrl && tpl && !loading) refreshPdfPreview(); /* eslint-disable-next-line */ }, [previewTab, slug]);

  function insertVar(field: keyof Template, v: string) {
    setTpl((t) => t ? { ...t, [field]: `${(t as any)[field] || ""}{{${v}}}` } : t);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Templates de E-mail MVNO"
        subtitle="Personalize o assunto, cabeçalho, cores e logotipo dos e-mails enviados na contratação de linhas."
      />

      <Tabs value={slug} onValueChange={(v) => setSlug(v as any)}>
        <TabsList>
          <TabsTrigger value="activation_esim">eSIM</TabsTrigger>
          <TabsTrigger value="activation_sim">SIM Card</TabsTrigger>
        </TabsList>

        <TabsContent value={slug} className="mt-4">
          {loading || !tpl ? (
            <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_500px]">
              <Card className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label>Assunto do e-mail</Label>
                  <Input value={tpl.subject} onChange={(e) => setTpl({ ...tpl, subject: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cor primária</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={tpl.primary_color} onChange={(e) => setTpl({ ...tpl, primary_color: e.target.value })} className="w-16 p-1 h-10" />
                      <Input value={tpl.primary_color} onChange={(e) => setTpl({ ...tpl, primary_color: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor de destaque</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={tpl.accent_color} onChange={(e) => setTpl({ ...tpl, accent_color: e.target.value })} className="w-16 p-1 h-10" />
                      <Input value={tpl.accent_color} onChange={(e) => setTpl({ ...tpl, accent_color: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logotipo (cabeçalho do e-mail)</Label>
                  <div className="flex items-center gap-3">
                    {tpl.logo_url && <img src={tpl.logo_url} alt="logo" className="h-20 bg-muted rounded p-1" />}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />{tpl.logo_url ? "Trocar" : "Enviar logo"}
                    </Button>
                    {tpl.logo_url && <Button type="button" variant="ghost" size="sm" onClick={() => setTpl({ ...tpl, logo_url: null })}>Remover</Button>}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG transparente, fundo azul. Se vazio, mostra texto "{tpl.header_title}".</p>
                </div>

                <div className="space-y-2">
                  <Label>Título do cabeçalho</Label>
                  <Input value={tpl.header_title} onChange={(e) => setTpl({ ...tpl, header_title: e.target.value })} />
                </div>

                <VarChips onPick={(v) => insertVar("intro_html", v)} />
                <div className="space-y-2">
                  <Label>Texto de introdução (HTML)</Label>
                  <Textarea rows={5} value={tpl.intro_html} onChange={(e) => setTpl({ ...tpl, intro_html: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Caixa de destaque (rodapé do e-mail)</Label>
                  <Textarea rows={3} value={tpl.footer_html} onChange={(e) => setTpl({ ...tpl, footer_html: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Assinatura</Label>
                  <Textarea rows={2} value={tpl.signature_html} onChange={(e) => setTpl({ ...tpl, signature_html: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subtítulo do PDF</Label>
                    <Input value={tpl.pdf_header_text} onChange={(e) => setTpl({ ...tpl, pdf_header_text: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rodapé do PDF</Label>
                    <Input value={tpl.pdf_footer_text} onChange={(e) => setTpl({ ...tpl, pdf_footer_text: e.target.value })} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={() => save()} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar template
                  </Button>
                  <Button variant="outline" onClick={refreshPreview}>
                    <Eye className="h-4 w-4 mr-2" />Atualizar preview
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <Label>Enviar e-mail de teste</Label>
                  <div className="flex gap-2">
                    <Input type="email" placeholder="seu@email.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                    <Button variant="secondary" onClick={sendTest} disabled={sending}>
                      {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Enviar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Salva o template atual e envia com dados de exemplo.</p>
                </div>
              </Card>

              <Card className="p-3 space-y-2 sticky top-4 self-start">
                <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)}>
                  <div className="flex items-center justify-between gap-2 px-1 pt-1">
                    <TabsList>
                      <TabsTrigger value="html">E-mail (HTML)</TabsTrigger>
                      <TabsTrigger value="pdf">PDF anexo</TabsTrigger>
                    </TabsList>
                    {previewTab === "pdf" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={refreshPdfPreview} disabled={pdfLoading}>
                          {pdfLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={downloadPdf} disabled={!pdfDataUrl}>Baixar</Button>
                      </div>
                    )}
                  </div>
                  <TabsContent value="html" className="mt-2">
                    <iframe srcDoc={preview} title="Preview HTML" className="w-full h-[700px] rounded bg-white border" />
                    {slug === "activation_esim" && (
                      <p className="text-[11px] text-muted-foreground px-1 pt-2">
                        O QR Code é enviado como imagem dentro do corpo do e-mail e também no PDF anexo.
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="pdf" className="mt-2">
                    {pdfDataUrl ? (
                      <iframe src={pdfDataUrl} title="Preview PDF" className="w-full h-[700px] rounded bg-white border" />
                    ) : (
                      <div className="w-full h-[700px] rounded border flex items-center justify-center text-sm text-muted-foreground">
                        {pdfLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Clique no ícone para gerar o PDF de exemplo"}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VarChips({ onPick }: { onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      <span className="text-xs text-muted-foreground mr-1">Variáveis:</span>
      {VARS.map((v) => (
        <button key={v} type="button" onClick={() => onPick(v)}
          className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-muted/70 font-mono">
          {`{{${v}}}`}
        </button>
      ))}
    </div>
  );
}
