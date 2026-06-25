export const PWA_UPDATE_EVENT = "minhaconta:pwa-update-available";

let waitingWorker: ServiceWorker | null = null;

export function applyMinhaContaUpdate() {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }
}

export function registerMinhaContaSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Não registrar no editor Lovable (iframe)
  try {
    if (window.self !== window.top) return;
  } catch {
    return;
  }

  const host = window.location.hostname;
  if (host.includes("id-preview--") || host.includes("lovableproject.com")) {
    console.log("[PWA] Registration skipped on preview host");
    return;
  }

  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/minhaconta-sw.js", { scope: "/minhaconta/" })
      .then((registration) => {
        console.log("[PWA] SW registered:", registration.scope);

        const notifyIfWaiting = (sw: ServiceWorker | null) => {
          if (sw && sw.state === "installed" && navigator.serviceWorker.controller) {
            waitingWorker = sw;
            window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT));
          }
        };

        notifyIfWaiting(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => notifyIfWaiting(newWorker));
        });

        // Recarregar quando o novo SW assumir
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      })
      .catch((error) => {
        console.error("[PWA] SW registration failed:", error);
      });
  });
}
