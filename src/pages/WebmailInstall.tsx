import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Download, Smartphone, Zap, ShieldCheck, Share, Plus, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import jotazoLogo from "@/assets/webmail-app-icon.png";
import { useWebmailInstallState } from "@/webmail/useInstallState";

export default function WebmailInstallPage() {
  const { isInstalled, canPrompt, isIOS, promptInstall } = useWebmailInstallState();
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    const onInstalled = () => setJustInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  async function install() {
    const outcome = await promptInstall();
    if (outcome === "accepted") setJustInstalled(true);
  }

  const showInstalled = isInstalled || justInstalled;


  return (
    <>
      <Helmet>
        <title>Instalar Webmail Jotazo</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="manifest" href="/webmail.webmanifest" />
        <meta name="theme-color" content="#00358f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Webmail Jotazo" />
        <link rel="apple-touch-icon" href="/webmail-apple-touch-180.png" />
      </Helmet>

      <div
        className="min-h-[100dvh] text-white relative overflow-hidden"
        style={{
          background:
            "radial-gradient(at 20% 10%, hsl(220 90% 50% / 0.35) 0, transparent 50%)," +
            "radial-gradient(at 80% 90%, hsl(25 95% 55% / 0.18) 0, transparent 50%)," +
            "linear-gradient(135deg, #001a4d 0%, #00358f 60%, #0a1e5c 100%)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-[hsl(220_90%_50%/0.5)] blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-[hsl(25_95%_55%/0.3)] blur-3xl" />
        </div>

        <header className="relative z-10 flex items-center justify-between px-4 h-14">
          <Link to="/webmail" className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </header>

        <main className="relative z-10 max-w-md mx-auto px-5 pb-10">
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-24 h-24 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/15 grid place-items-center shadow-2xl shadow-black/40 mb-5">
              <img src={jotazoLogo} alt="Jotazo" className="w-14 h-auto" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Webmail Jotazo</h1>
            <p className="text-sm text-white/70 mt-1">Instale o app no seu celular</p>
          </div>

          {showInstalled ? (
            <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-6 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-[#25D366]" />
              <p className="font-semibold">App instalado!</p>
              <p className="text-sm text-white/70 mt-1">Abra o Webmail pelo ícone na sua tela inicial.</p>
              <Link
                to="/webmail"
                className="mt-4 inline-block bg-white text-[#00358f] rounded-xl px-5 h-11 leading-[44px] font-semibold"
              >
                Ir para o Webmail
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8 grid grid-cols-1 gap-3">
                <Benefit icon={Zap} title="Acesso instantâneo" desc="Abra do ícone, sem digitar URL." />
                <Benefit icon={ShieldCheck} title="Tela cheia" desc="Sem barra do navegador. Cara de app." />
                <Benefit icon={Smartphone} title="Funciona offline" desc="Sua caixa fica disponível mesmo sem rede." />
              </div>

              {canPrompt ? (
                <button
                  onClick={install}
                  className="mt-6 w-full h-14 rounded-2xl bg-white text-[#00358f] font-semibold inline-flex items-center justify-center gap-2 shadow-2xl shadow-black/40"
                >
                  <Download className="w-5 h-5" /> Instalar app Webmail
                </button>
              ) : isIOS ? (
                <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-5 space-y-3">
                  <p className="text-sm font-semibold">Como instalar no iPhone / iPad</p>
                  <ol className="space-y-3 text-sm text-white/85">
                    <li className="flex items-start gap-3">
                      <span className="bg-white/15 rounded-lg w-7 h-7 grid place-items-center shrink-0">1</span>
                      <span className="flex-1">Toque no botão <Share className="w-4 h-4 inline -mt-0.5" /> <b>Compartilhar</b> no Safari.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-white/15 rounded-lg w-7 h-7 grid place-items-center shrink-0">2</span>
                      <span className="flex-1">Role e toque em <Plus className="w-4 h-4 inline -mt-0.5" /> <b>Adicionar à Tela de Início</b>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-white/15 rounded-lg w-7 h-7 grid place-items-center shrink-0">3</span>
                      <span className="flex-1">Confirme em <b>Adicionar</b>. Pronto!</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-5 text-sm text-white/85">
                  Abra este site no <b>Chrome</b> (ou outro navegador compatível) no seu celular e procure por
                  <b> "Instalar app"</b> no menu do navegador.
                </div>
              )}
            </>
          )}

          <p className="text-[11px] text-white/50 text-center mt-6">
            Você precisa acessar pelo domínio publicado para instalar o app.
          </p>
        </main>
      </div>
    </>
  );
}

function Benefit({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4">
      <div className="bg-white/15 rounded-xl p-2">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-white/70">{desc}</p>
      </div>
    </div>
  );
}
