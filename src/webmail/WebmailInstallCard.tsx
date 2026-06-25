import { Download, Smartphone, ArrowRight, Share, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWebmailInstallState } from "./useInstallState";

/**
 * Card de instalação exibido na tela de login mobile do Webmail.
 * Não renderiza se o app já está instalado.
 */
export function WebmailInstallCard() {
  const { isInstalled, canPrompt, isIOS, promptInstall } = useWebmailInstallState();
  const navigate = useNavigate();

  if (isInstalled) return null;

  const subtitle = canPrompt
    ? "Toque para instalar agora"
    : isIOS
      ? "Veja como instalar no iPhone"
      : "Veja como adicionar à tela inicial";

  async function handleClick() {
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome === "accepted" || outcome === "dismissed") return;
    }
    navigate("/webmail/install");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="lg:hidden mt-5 w-full text-left rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-lg shadow-black/20"
    >
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-[hsl(25_95%_55%)] blur-md opacity-60 rounded-xl" />
        <div className="relative bg-gradient-to-br from-[hsl(25_95%_60%)] to-[hsl(15_90%_50%)] rounded-xl p-2.5 grid place-items-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">Instalar app no celular</p>
        <p className="text-[11px] text-white/70 mt-0.5 flex items-center gap-1">
          {isIOS && !canPrompt && (
            <>
              <Share className="w-3 h-3 inline" /> Compartilhar
              <Plus className="w-3 h-3 inline ml-0.5" /> Adicionar
            </>
          )}
          {(!isIOS || canPrompt) && subtitle}
        </p>
      </div>
      {canPrompt ? (
        <span className="bg-white text-[#00358f] rounded-xl px-3 h-9 text-sm font-semibold inline-flex items-center gap-1 shrink-0">
          <Download className="w-4 h-4" /> Instalar
        </span>
      ) : (
        <ArrowRight className="w-5 h-5 text-white/60 shrink-0" />
      )}
    </button>
  );
}
