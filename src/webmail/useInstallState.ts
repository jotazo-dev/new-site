import { useCallback, useEffect, useState } from "react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const FLAG_KEY = "webmail-installed";

function getStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari
  if ((window.navigator as any).standalone === true) return true;
  return false;
}

export function useWebmailInstallState() {
  const [event, setEvent] = useState<BIPEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => getStandalone());
  const [installedFlag, setInstalledFlag] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(FLAG_KEY) === "1"; } catch { return false; }
  });
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    const android = /android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);
    setIsStandalone(getStandalone());

    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvent(e as BIPEvent);
      // Se o navegador está oferecendo install de novo, o app não está mais instalado
      try { localStorage.removeItem(FLAG_KEY); } catch {}
      setInstalledFlag(false);
    };
    const onInstalled = () => {
      try { localStorage.setItem(FLAG_KEY, "1"); } catch {}
      setInstalledFlag(true);
      setEvent(null);
    };
    const onDisplayChange = () => setIsStandalone(getStandalone());

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    const mm = window.matchMedia?.("(display-mode: standalone)");
    mm?.addEventListener?.("change", onDisplayChange);

    // Chrome Android — verifica se já está instalado
    const nav = navigator as any;
    if (typeof nav.getInstalledRelatedApps === "function") {
      nav.getInstalledRelatedApps().then((apps: any[]) => {
        if (apps && apps.length > 0) {
          try { localStorage.setItem(FLAG_KEY, "1"); } catch {}
          setInstalledFlag(true);
        }
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      mm?.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!event) return "unavailable";
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") {
      try { localStorage.setItem(FLAG_KEY, "1"); } catch {}
      setInstalledFlag(true);
      setEvent(null);
    }
    return outcome;
  }, [event]);

  const isInstalled = isStandalone || installedFlag;
  const canPrompt = !!event && !isInstalled;

  return { isStandalone, isInstalled, canPrompt, isIOS, isAndroid, promptInstall };
}
