import { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Send, Paperclip, Trash2, Loader2, Save, ChevronDown, FileText, X, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { webmailApi, uploadAttachment } from "@/lib/webmail";
import RichTextEditor from "./composer/RichTextEditor";
import BlockBuilder from "./composer/BlockBuilder";
import { renderBlocksToHtml } from "./composer/renderBlocksToHtml";
import { TEMPLATES, type Block } from "./composer/templates";
import SignatureDialog from "./composer/SignatureDialog";

export interface ComposerDraft {
  id: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  mode: "rich" | "blocks";
  html: string;
  blocks: Block[];
  attachments: { path: string; name: string; size: number; contentType: string }[];
  inReplyTo?: string;
  references?: string;
  includeSignature: boolean;
  showCc: boolean;
  showBcc: boolean;
}

export function newDraft(init?: Partial<ComposerDraft>): ComposerDraft {
  return {
    id: init?.id || `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    to: init?.to || "",
    cc: init?.cc || "",
    bcc: init?.bcc || "",
    subject: init?.subject || "",
    mode: init?.mode || "rich",
    html: init?.html ?? "",
    blocks: init?.blocks || TEMPLATES[0].blocks(),
    attachments: init?.attachments || [],
    inReplyTo: init?.inReplyTo,
    references: init?.references,
    includeSignature: init?.includeSignature ?? true,
    showCc: !!init?.cc,
    showBcc: !!init?.bcc,
  };
}

const DRAFTS_KEY = "webmail_drafts_v1";
export function loadDrafts(): ComposerDraft[] {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || "[]"); } catch { return []; }
}
export function saveDrafts(list: ComposerDraft[]) {
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(list)); } catch {}
}

interface Props {
  draft: ComposerDraft;
  onChange: (d: ComposerDraft) => void;
  onClose: () => void;
  onSent: () => void;
}

const MAX_TOTAL = 25 * 1024 * 1024;

export default function ComposerInline({ draft, onChange, onClose, onSent }: Props) {
  const [sending, setSending] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [sigOpen, setSigOpen] = useState(false);
  const [signature, setSignature] = useState<{ html: string; enabled: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // load signature
  useEffect(() => {
    webmailApi.signature({ action: "get" })
      .then((r: any) => setSignature({ html: r.html || "", enabled: r.enabled ?? true }))
      .catch(() => setSignature({ html: "", enabled: false }));
  }, []);

  // autosave debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const list = loadDrafts().filter((d) => d.id !== draft.id);
      saveDrafts([draft, ...list]);
      setSavedAt(Date.now());
    }, 1200);
    return () => clearTimeout(t);
  }, [draft]);

  function patch(p: Partial<ComposerDraft>) { onChange({ ...draft, ...p }); }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const totalNow = draft.attachments.reduce((s, a) => s + a.size, 0);
    for (const f of Array.from(files)) {
      if (totalNow + f.size > MAX_TOTAL) { toast.error("Limite de 25MB excedido"); return; }
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name}: arquivo > 20MB`); continue; }
      const tId = toast.loading(`Enviando ${f.name}…`);
      try {
        const r = await uploadAttachment(f, draft.id);
        patch({ attachments: [...draft.attachments, { path: r.path, name: r.name, size: r.size, contentType: r.contentType }] });
        toast.success(`${f.name} anexado`, { id: tId });
      } catch (e: any) {
        toast.error("Falha no upload", { id: tId, description: e?.message });
      }
    }
  }

  async function removeAttachment(path: string) {
    try { await webmailApi.attachmentAction({ action: "delete", path }); } catch {}
    patch({ attachments: draft.attachments.filter((a) => a.path !== path) });
  }

  async function send() {
    const toList = draft.to.split(",").map((s) => s.trim()).filter(Boolean);
    if (toList.length === 0) { toast.error("Informe um destinatário"); return; }
    if (!draft.subject.trim() && !confirm("Enviar sem assunto?")) return;
    setSending(true);
    const tId = toast.loading("Enviando…");
    try {
      let html = draft.mode === "blocks" ? renderBlocksToHtml(draft.blocks) : draft.html;
      if (signature?.enabled && signature.html && draft.includeSignature) {
        html += `<br><br>-- <br>${signature.html}`;
      }
      const safeHtml = DOMPurify.sanitize(html, { ADD_TAGS: ["style"], ADD_ATTR: ["target"] });

      // fetch attachments as base64
      const atts: any[] = [];
      for (const a of draft.attachments) {
        const r = await webmailApi.attachmentAction({ action: "fetch_base64", path: a.path });
        atts.push({ filename: a.name, content_base64: r.content_base64, contentType: a.contentType });
      }

      await webmailApi.send({
        to: toList,
        cc: draft.cc ? draft.cc.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        bcc: draft.bcc ? draft.bcc.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        subject: draft.subject,
        html: safeHtml,
        text: safeHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        inReplyTo: draft.inReplyTo,
        references: draft.references,
        attachments: atts,
      });
      // cleanup
      try { await webmailApi.attachmentAction({ action: "cleanup_draft", draft_id: draft.id }); } catch {}
      saveDrafts(loadDrafts().filter((d) => d.id !== draft.id));
      toast.success("E-mail enviado", { id: tId, description: draft.subject || "(sem assunto)" });
      onSent();
    } catch (e: any) {
      toast.error("Falha ao enviar", { id: tId, description: e?.message });
    } finally { setSending(false); }
  }

  async function discard() {
    if (!confirm("Descartar este rascunho?")) return;
    try { await webmailApi.attachmentAction({ action: "cleanup_draft", draft_id: draft.id }); } catch {}
    saveDrafts(loadDrafts().filter((d) => d.id !== draft.id));
    onClose();
  }

  function switchMode(mode: "rich" | "blocks") {
    if (mode === draft.mode) return;
    if (mode === "rich") {
      patch({ mode, html: renderBlocksToHtml(draft.blocks) });
    } else {
      if (draft.html && !confirm("Mudar para o builder substituirá o conteúdo atual. Continuar?")) return;
      patch({ mode, blocks: TEMPLATES[0].blocks() });
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header fields */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <div className="flex items-center gap-1 text-sm font-semibold flex-1 min-w-0">
            <PenLine className="w-4 h-4 text-primary" />
            <span className="truncate">{draft.subject || "Nova mensagem"}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => switchMode("rich")}
              className={`px-2 py-1 rounded ${draft.mode === "rich" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >Rich text</button>
            <button
              onClick={() => switchMode("blocks")}
              className={`px-2 py-1 rounded ${draft.mode === "blocks" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >Builder</button>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} title="Fechar"><X className="w-4 h-4" /></Button>
        </div>
        <div className="grid gap-1.5 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">Para</span>
            <Input value={draft.to} onChange={(e) => patch({ to: e.target.value })} placeholder="email@exemplo.com, outro@exemplo.com" className="h-8 border-0 focus-visible:ring-0 px-0 shadow-none" />
            <div className="flex gap-1 text-xs">
              {!draft.showCc && <button onClick={() => patch({ showCc: true })} className="text-muted-foreground hover:text-foreground">Cc</button>}
              {!draft.showBcc && <button onClick={() => patch({ showBcc: true })} className="text-muted-foreground hover:text-foreground">Bcc</button>}
            </div>
          </div>
          {draft.showCc && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12">Cc</span>
              <Input value={draft.cc} onChange={(e) => patch({ cc: e.target.value })} className="h-8 border-0 focus-visible:ring-0 px-0 shadow-none" />
            </div>
          )}
          {draft.showBcc && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12">Bcc</span>
              <Input value={draft.bcc} onChange={(e) => patch({ bcc: e.target.value })} className="h-8 border-0 focus-visible:ring-0 px-0 shadow-none" />
            </div>
          )}
          <div className="flex items-center gap-2 border-t pt-1.5">
            <span className="text-xs text-muted-foreground w-12">Assunto</span>
            <Input value={draft.subject} onChange={(e) => patch({ subject: e.target.value })} className="h-8 border-0 focus-visible:ring-0 px-0 shadow-none font-medium" />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-3">
        {draft.mode === "rich"
          ? <RichTextEditor value={draft.html} onChange={(html) => patch({ html })} />
          : <BlockBuilder blocks={draft.blocks} onChange={(blocks) => patch({ blocks })} />}
      </div>

      {/* Attachments */}
      {draft.attachments.length > 0 && (
        <div className="px-4 py-2 border-t flex flex-wrap gap-2">
          {draft.attachments.map((a) => (
            <div key={a.path} className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-sm">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="truncate max-w-[180px]">{a.name}</span>
              <span className="text-xs text-muted-foreground">{(a.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => removeAttachment(a.path)} className="text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="sticky bottom-0 bg-background border-t px-3 py-2 flex flex-wrap items-center gap-2">
        <Button onClick={send} disabled={sending} className="gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar
        </Button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="gap-1"><Paperclip className="w-4 h-4" /> Anexar</Button>
        <div className="flex items-center gap-1.5 text-xs">
          <Switch id={`sig-${draft.id}`} checked={draft.includeSignature} onCheckedChange={(v) => patch({ includeSignature: v })} />
          <label htmlFor={`sig-${draft.id}`}>Assinatura</label>
          <button onClick={() => setSigOpen(true)} className="text-primary hover:underline ml-1">Editar</button>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {savedAt ? <><Save className="w-3 h-3 inline mr-1" />Salvo</> : "Editando…"}
        </span>
        <Button variant="ghost" size="sm" onClick={discard} className="text-destructive gap-1"><Trash2 className="w-4 h-4" /> Descartar</Button>
      </div>

      <SignatureDialog open={sigOpen} onClose={() => setSigOpen(false)} onSaved={(html, enabled) => setSignature({ html, enabled })} />
    </div>
  );
}
