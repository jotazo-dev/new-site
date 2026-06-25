import { useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useWebmailInstallState } from "./useInstallState";

const DISMISS_KEY = "webmail-install-banner-dismissed";

export function WebmailInstallBanner() {
  const { isInstalled, canPrompt, isIOS, promptInstall } = useWebmailInstallState();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });

  if (isInstalled || dismissed) return null;

  function dismiss() {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setDismissed(true);
  }

  async function install() {
    await promptInstall();
  }

  return (
    <div
      className="lg:hidden fixed left-3 right-3 z-40 rounded-2xl border border-white/15 bg-gradient-to-r from-[#001a4d] via-[#00358f] to-[#0a1e5c] text-white shadow-2xl p-3 flex items-center gap-3"
      style={{ bottom: `calc(env(safe-area-inset-bottom) + 80px)` }}
    >
      <div className="bg-white/15 rounded-xl p-2 shrink-0">
        <Smartphone className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Instale o app Webmail</p>
        <p className="text-[11px] text-white/75 truncate">
          {isIOS && !canPrompt ? "Compartilhar → Adicionar à Tela de Início" : "Acesso rápido na tela inicial"}
        </p>
      </div>
      {canPrompt ? (
        <button
          onClick={install}
          className="bg-white text-[#00358f] rounded-xl px-3 h-9 text-sm font-semibold flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Instalar
        </button>
      ) : (
        <Link
          to="/webmail/install"
          className="bg-white text-[#00358f] rounded-xl px-3 h-9 text-sm font-semibold inline-flex items-center"
          onClick={dismiss}
        >
          Como instalar
        </Link>
      )}
      <button onClick={dismiss} aria-label="Fechar" className="text-white/70 hover:text-white p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
