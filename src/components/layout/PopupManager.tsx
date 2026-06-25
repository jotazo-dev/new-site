import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Popup = {
  id: string;
  title: string;
  text: string;
  image_url: string;
  cta_text: string;
  cta_url: string;
  popup_style: string;
  display_pages: string[];
  frequency: string;
  delay_seconds: number;
  expires_at: string | null;
  starts_at: string | null;
};

function getSessionId(): string {
  let id = sessionStorage.getItem("popup_session_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("popup_session_id", id);
  }
  return id;
}

function trackEvent(popupId: string, eventType: "view" | "click", pagePath: string) {
  supabase
    .from("popup_stats" as any)
    .insert({ popup_id: popupId, event_type: eventType, page_path: pagePath, session_id: getSessionId() } as any)
    .then();
}

function shouldShow(popup: Popup): boolean {
  const key = `popup_seen_${popup.id}`;
  switch (popup.frequency) {
    case "always":
      return true;
    case "once_per_session": {
      const seen = sessionStorage.getItem(key);
      return !seen;
    }
    case "once_per_day": {
      const last = localStorage.getItem(key);
      if (!last) return true;
      return Date.now() - Number(last) > 86400000;
    }
    case "once_ever":
      return !localStorage.getItem(key);
    default:
      return true;
  }
}

function markSeen(popup: Popup) {
  const key = `popup_seen_${popup.id}`;
  switch (popup.frequency) {
    case "once_per_session":
      sessionStorage.setItem(key, "1");
      break;
    case "once_per_day":
    case "once_ever":
      localStorage.setItem(key, String(Date.now()));
      break;
  }
}

function matchesPage(popup: Popup, pathname: string): boolean {
  const pages = popup.display_pages;
  if (!pages || pages.length === 0 || pages.includes("all")) return true;
  return pages.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function CenteredPopup({ popup, onClose, onCtaClick }: { popup: Popup; onClose: () => void; onCtaClick: () => void }) {
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        {popup.image_url && (
          <img src={popup.image_url} alt={popup.title} className="w-full aspect-video object-cover" />
        )}
        <div className="p-6 space-y-3">
          {popup.title && <h3 className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{popup.title}</h3>}
          {popup.text && <p className="text-sm text-muted-foreground">{popup.text}</p>}
          {popup.cta_text && popup.cta_url && (
            <Button asChild className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white">
              <Link to={popup.cta_url} onClick={onCtaClick}>{popup.cta_text}</Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BottomBarPopup({ popup, onClose, onCtaClick }: { popup: Popup; onClose: () => void; onCtaClick: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {popup.image_url && <img src={popup.image_url} alt={popup.title} className="h-12 w-12 rounded-lg object-cover shrink-0" />}
        <div className="flex-1 min-w-0">
          {popup.title && <p className="font-semibold text-sm truncate">{popup.title}</p>}
          {popup.text && <p className="text-xs text-muted-foreground truncate">{popup.text}</p>}
        </div>
        {popup.cta_text && popup.cta_url && (
          <Button asChild size="sm" className="shrink-0 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white">
            <Link to={popup.cta_url} onClick={onCtaClick}>{popup.cta_text}</Link>
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SlideInPopup({ popup, onClose, onCtaClick }: { popup: Popup; onClose: () => void; onCtaClick: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border rounded-xl shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
      <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 z-10" onClick={onClose}>
        <X className="h-3 w-3" />
      </Button>
      {popup.image_url && <img src={popup.image_url} alt={popup.title} className="w-full aspect-video object-cover" />}
      <div className="p-4 space-y-2">
        {popup.title && <p className="font-semibold text-sm">{popup.title}</p>}
        {popup.text && <p className="text-xs text-muted-foreground">{popup.text}</p>}
        {popup.cta_text && popup.cta_url && (
          <Button asChild size="sm" className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white">
            <Link to={popup.cta_url} onClick={onCtaClick}>{popup.cta_text}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function PopupManager() {
  const { pathname } = useLocation();
  const [visibleId, setVisibleId] = React.useState<string | null>(null);

  const { data: popups = [] } = useQuery({
    queryKey: ["public-popups"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("type", "popup")
        .eq("active", true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as Popup[];
    },
    staleTime: 60000,
  });

  React.useEffect(() => {
    if (visibleId) return;

    const eligible = popups.filter((p) => matchesPage(p, pathname) && shouldShow(p));
    if (eligible.length === 0) return;

    const exitIntentPopup = eligible.find((p) => p.popup_style === "exit_intent");
    const timedPopup = eligible.find((p) => p.popup_style !== "exit_intent");

    let timer: ReturnType<typeof setTimeout> | undefined;
    let handleMouseLeave: (() => void) | undefined;

    if (timedPopup) {
      const delay = (timedPopup.delay_seconds || 0) * 1000;
      timer = setTimeout(() => {
        setVisibleId(timedPopup.id);
        trackEvent(timedPopup.id, "view", pathname);
      }, delay);
    }

    if (exitIntentPopup) {
      handleMouseLeave = () => {
        setVisibleId(exitIntentPopup.id);
        trackEvent(exitIntentPopup.id, "view", pathname);
      };
      document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (handleMouseLeave) {
        document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [popups, pathname, visibleId]);

  const popup = popups.find((p) => p.id === visibleId);
  if (!popup) return null;

  const handleClose = () => {
    markSeen(popup);
    setVisibleId(null);
  };

  const handleCtaClick = () => {
    trackEvent(popup.id, "click", pathname);
    handleClose();
  };

  switch (popup.popup_style) {
    case "bottom_bar":
      return <BottomBarPopup popup={popup} onClose={handleClose} onCtaClick={handleCtaClick} />;
    case "slide_in":
      return <SlideInPopup popup={popup} onClose={handleClose} onCtaClick={handleCtaClick} />;
    case "exit_intent":
      return <CenteredPopup popup={popup} onClose={handleClose} onCtaClick={handleCtaClick} />;
    default:
      return <CenteredPopup popup={popup} onClose={handleClose} onCtaClick={handleCtaClick} />;
  }
}
