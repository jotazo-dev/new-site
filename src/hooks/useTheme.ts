import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { getThemeById, THEMES } from "@/config/themes";
import { supabase } from "@/integrations/supabase/client";

const ALL_KEYS = Array.from(
  new Set(THEMES.flatMap((t) => Object.keys(t.overrides)))
);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useTheme() {
  const settings = useSiteSettings();
  const manualTheme = settings["site_theme"] || "default";

  const { data: scheduledThemeId } = useQuery({
    queryKey: ["active_theme_schedule"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("theme_schedules")
        .select("theme_id")
        .eq("active", true)
        .lte("starts_at", now)
        .gte("ends_at", now)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0]?.theme_id ?? null;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const themeId = scheduledThemeId || manualTheme;
  const isCustomSavedTheme = UUID_RE.test(themeId);

  // Fetch saved custom theme overrides if themeId is a UUID
  const { data: savedTheme } = useQuery({
    queryKey: ["custom_theme", themeId],
    enabled: isCustomSavedTheme,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_themes")
        .select("overrides")
        .eq("id", themeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-theme-scope]");
    if (!root) return;

    const clearAll = () => ALL_KEYS.forEach((key) => root.style.removeProperty(key));

    if (themeId === "default") {
      clearAll();
      return;
    }

    let overrides: Record<string, string> | null = null;

    if (isCustomSavedTheme) {
      overrides = (savedTheme?.overrides as Record<string, string> | undefined) ?? null;
    } else {
      const theme = getThemeById(themeId);
      overrides = theme?.overrides ?? null;
    }

    if (!overrides) {
      clearAll();
      return;
    }

    ALL_KEYS.forEach((key) => {
      if (overrides![key]) root.style.setProperty(key, overrides![key]);
      else root.style.removeProperty(key);
    });

    return () => clearAll();
  }, [themeId, isCustomSavedTheme, savedTheme]);

  return themeId;
}
