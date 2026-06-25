import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WEBMAIL_PWA_UPDATE_EVENT, applyWebmailUpdate } from "@/webmail/registerSW";

export function WebmailUpdatePrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener(WEBMAIL_PWA_UPDATE_EVENT, handler);
    return () => window.removeEventListener(WEBMAIL_PWA_UPDATE_EVENT, handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-sm rounded-2xl border border-primary/20 bg-background/95 backdrop-blur shadow-2xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom">
      <div className="bg-primary/10 rounded-xl p-2">
        <RefreshCw className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Nova versão do Webmail</p>
        <p className="text-xs text-muted-foreground">Atualize para ver as novidades.</p>
      </div>
      <Button size="sm" onClick={applyWebmailUpdate} className="h-8">Atualizar</Button>
    </div>
  );
}
