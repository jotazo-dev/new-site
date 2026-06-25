import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettingsLoaded } from "@/hooks/useSiteSettings";

const fallback = [
  "🔥 Internet Fibra a partir de R$ 69,90/mês",
  "📺 Assine com TV e ganhe canais premium",
  "⚡ Wi-Fi 6 grátis em todos os planos",
];

export function AnnouncementBar() {
  const { settings, isLoading } = useSiteSettingsLoaded();

  const barEnabled = !isLoading && settings["announcement_bar_enabled"] !== "false";

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    enabled: barEnabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .eq("type", "bar")
        .order("sort_order");
      if (error) throw error;
      return data.map((a) => a.text);
    },
  });

  if (isLoading || !barEnabled) return null;

  const items = announcements && announcements.length > 0 ? announcements : fallback;

  const sep = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0";
  const block = items.join(sep);
  const repeated = block + sep + block + sep;

  // Cores independentes do header (configuradas em /admin/anuncios)
  const bg = settings["announcement_bg_color"] || "hsl(var(--accent))";
  const fg = settings["announcement_text_color"] || "hsl(var(--accent-foreground))";

  return (
    <div
      className="relative w-full overflow-hidden py-1.5"
      style={{ background: bg, color: fg }}
    >
      <div className="animate-marquee flex whitespace-nowrap [transform:translateZ(0)] motion-reduce:animate-none">
        <span className="inline-block px-4 text-xs font-semibold tracking-wide sm:text-sm">
          {repeated}
        </span>
        <span className="inline-block px-4 text-xs font-semibold tracking-wide sm:text-sm">
          {repeated}
        </span>
      </div>
    </div>
  );
}
