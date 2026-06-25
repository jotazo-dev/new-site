import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "page_view_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

/**
 * Records a page view and returns its id (or null if skipped/failed).
 */
export async function trackPageView(pathname: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (pathname.startsWith("/admin")) return null;

  const { data, error } = await supabase
    .from("page_views")
    .insert({
      page_path: pathname || "/",
      referrer: document.referrer ? document.referrer.slice(0, 500) : "",
      session_id: getSessionId(),
      user_agent: navigator.userAgent.slice(0, 500),
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[page-tracking] Failed to record view:", error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Updates duration_ms for a previously recorded page view.
 * Capped at 30 minutes (1.8M ms) to match RLS check.
 */
export function updatePageViewDuration(id: string, ms: number) {
  if (!id || ms <= 0) return;
  const capped = Math.min(Math.round(ms), 1_800_000);
  void supabase
    .from("page_views")
    .update({ duration_ms: capped })
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.warn("[page-tracking] Failed to update duration:", error.message);
    });
}
