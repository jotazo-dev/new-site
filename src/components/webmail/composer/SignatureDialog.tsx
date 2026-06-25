import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { webmailApi } from "@/lib/webmail";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; onSaved?: (html: string, enabled: boolean) => void; }

export default function SignatureDialog({ open, onClose, onSaved }: Props) {
  const [html, setHtml] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    webmailApi.signature({ action: "get" })
      .then((r: any) => { setHtml(r.html || ""); setEnabled(r.enabled ?? true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  async function save() {
    setSaving(true);
    try {
      await webmailApi.signature({ action: "upsert", html, enabled });
      toast.success("Assinatura salva");
      onSaved?.(html, enabled);
      onClose();
    } catch (e: any) {
      toast.error("Falha ao salvar", { description: e?.message });
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Assinatura de e-mail</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={setEnabled} id="sig-enabled" />
              <label htmlFor="sig-enabled" className="text-sm">Incluir em novos e-mails</label>
            </div>
            <RichTextEditor value={html} onChange={setHtml} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando…</> : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
