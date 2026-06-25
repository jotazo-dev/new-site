export const WEBMAIL_PWA_UPDATE_EVENT = "webmail:pwa-update-available";

let waitingWorker: ServiceWorker | null = null;

export function applyWebmailUpdate() {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }
}

export function registerWebmailSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Não registrar dentro de iframe (editor Lovable)
  try {
    if (window.self !== window.top) return;
  } catch {
    return;
  }

  const host = window.location.hostname;
  if (host.includes("id-preview--") || host.includes("lovableproject.com")) {
    console.log("[Webmail PWA] Registration skipped on preview host");
    return;
  }

  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/webmail-sw.js", { scope: "/webmail/" })
      .then((registration) => {
        console.log("[Webmail PWA] SW registered:", registration.scope);

        const notifyIfWaiting = (sw: ServiceWorker | null) => {
          if (sw && sw.state === "installed" && navigator.serviceWorker.controller) {
            waitingWorker = sw;
            window.dispatchEvent(new CustomEvent(WEBMAIL_PWA_UPDATE_EVENT));
          }
        };

        notifyIfWaiting(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => notifyIfWaiting(newWorker));
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      })
      .catch((error) => {
        console.error("[Webmail PWA] SW registration failed:", error);
      });
  });
}
