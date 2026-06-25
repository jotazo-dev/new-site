import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Detectar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // Verificar se foi dispensado recentemente
    const dismissedAt = localStorage.getItem('pwa_install_dismissed');
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt);
      if (diff < 7 * 24 * 60 * 60 * 1000) return; // 7 dias
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detectar iOS para mostrar instruções manuais
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !isStandalone) {
      setIsVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Provavelmente iOS ou manual
      setShowIosInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-500">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-1.5 shrink-0">
            <img src="/minhaconta-icon-192.png" className="w-5 h-5 object-contain" alt="" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary leading-tight">Instalar Jotazo Telecom</p>
            <p className="text-[11px] text-muted-foreground">Acesse suas faturas mais rápido</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleInstall} className="h-8 px-3 text-[12px] bg-primary hover:bg-primary/90">
            <Download className="w-3 h-3 mr-1.5" /> Instalar
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showIosInstructions} onOpenChange={setShowIosInstructions}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <img src="/minhaconta-icon-192.png" className="w-16 h-16 rounded-2xl shadow-lg" alt="Logo" />
            </div>
            <DialogTitle className="text-center">Instalar no iPhone</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Siga os passos abaixo para adicionar a Minha Conta à sua tela de início:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
              <p className="text-sm">Toque no botão <strong>Compartilhar</strong> <Share className="inline w-4 h-4 mb-1 mx-0.5 text-blue-500" /> na barra inferior do Safari.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold">2</div>
              <p className="text-sm">Role a lista para baixo e toque em <strong>Adicionar à Tela de Início</strong>.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-muted rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold">3</div>
              <p className="text-sm">Toque em <strong>Adicionar</strong> no canto superior direito.</p>
            </div>
          </div>
          <Button onClick={() => setShowIosInstructions(false)} className="w-full mt-2">Entendi</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
