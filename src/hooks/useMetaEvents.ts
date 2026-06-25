/**
 * Hook for sending Meta Pixel events (browser + server-side CAPI).
 * Deduplicates via event_id so Meta counts each event only once.
 *
 * Usage:
 *   const { trackEvent } = useMetaEvents();
 *   trackEvent("Lead", { content_name: "Plano 300MB" });
 *   trackEvent("Purchase", { value: 99.9, currency: "BRL" });
 *   trackEvent("AddToCart", { content_ids: ["plan-123"] });
 */

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCallback } from "react";

function generateEventId() {
  return `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
}

type MetaEventParams = Record<string, unknown>;

export function useMetaEvents() {
  const settings = useSiteSettings();
  const isActive = settings["meta_pixel_active"] === "true";
  const pixelId = settings["meta_pixel_id"] ?? "";
  const capiToken = settings["meta_capi_token"] ?? "";

  const trackEvent = useCallback(
    (eventName: string, params?: MetaEventParams, userData?: Record<string, string>) => {
      if (!isActive || !pixelId) return;

      const eventId = generateEventId();

      // 1. Browser-side fbq
      try {
        const w = window as any;
        if (w.fbq) {
          w.fbq("track", eventName, params ?? {}, { eventID: eventId });
        }
      } catch {}

      // 2. Server-side CAPI (only if token is configured)
      if (capiToken) {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        if (projectId) {
          fetch(`https://${projectId}.supabase.co/functions/v1/meta-capi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_name: eventName,
              event_id: eventId,
              event_source_url: window.location.href,
              custom_data: params,
              user_data: {
                client_user_agent: navigator.userAgent,
                ...userData,
              },
            }),
          }).catch(() => {});
        }
      }
    },
    [isActive, pixelId, capiToken]
  );

  return { trackEvent, isActive };
}
