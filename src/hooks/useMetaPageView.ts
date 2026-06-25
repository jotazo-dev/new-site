import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMetaEvents } from "@/hooks/useMetaEvents";

/**
 * Dispara PageView do Meta Pixel a cada mudança de rota (SPA),
 * com deduplicação via event_id entre browser pixel e CAPI server-side.
 * O PageView inicial é disparado pelo script base em TrackingScripts.tsx,
 * então pulamos a primeira execução para evitar duplicação.
 */
export function useMetaPageView() {
  const location = useLocation();
  const { trackEvent } = useMetaEvents();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackEvent("PageView");
  }, [location.pathname, location.search, trackEvent]);
}
