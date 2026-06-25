import { supabase } from "@/integrations/supabase/client";

export type BannerType = "hero" | "promo" | "mid";

const SESSION_KEY = "banner_session_id";

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
 * Records a banner click event. Fire-and-forget — never blocks navigation.
 */
export function trackBannerClick(params: {
  bannerType: BannerType;
  bannerId: string;
  linkUrl: string;
}) {
  // Skip tracking for fallback/non-uuid IDs
  if (!params.bannerId || params.bannerId === "fallback" || !/^[0-9a-f-]{36}$/i.test(params.bannerId)) {
    return;
  }

  // Fire-and-forget — don't await, don't block navigation
  void supabase
    .from("banner_clicks")
    .insert({
      banner_type: params.bannerType,
      banner_id: params.bannerId,
      link_url: params.linkUrl || "",
      page_path: typeof window !== "undefined" ? window.location.pathname : "/",
      session_id: getSessionId(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "",
    })
    .then(({ error }) => {
      if (error) console.warn("[banner-tracking] Failed to record click:", error.message);
    });
}
