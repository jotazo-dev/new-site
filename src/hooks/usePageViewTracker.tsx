import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, updatePageViewDuration } from "@/lib/pageTracking";

export function usePageViewTracker() {
  const location = useLocation();
  const lastPath = useRef<string>("");
  const currentIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;

    // Flush previous page duration before recording the new view
    if (currentIdRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      updatePageViewDuration(currentIdRef.current, elapsed);
    }

    lastPath.current = path;
    startTimeRef.current = Date.now();
    currentIdRef.current = null;

    trackPageView(path).then((id) => {
      // Only set if we're still on the same page (avoid race)
      if (lastPath.current === path) {
        currentIdRef.current = id;
      }
    });
  }, [location.pathname]);

  // Send duration on tab close / refresh
  useEffect(() => {
    const flush = () => {
      if (!currentIdRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      updatePageViewDuration(currentIdRef.current, elapsed);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
