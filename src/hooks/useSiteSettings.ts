import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_BASE_URL = "https://jotazo.com.br";

export const SITE_SETTINGS_QUERY_KEY = ["site_settings_public"] as const;

export async function fetchSiteSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value) map[row.key] = row.value;
  }
  return map;
}

export function useSiteSettings() {
  const { data: settings = {} } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: fetchSiteSettings,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  return settings;
}

export function useSiteSettingsLoaded() {
  const { data, isLoading } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: fetchSiteSettings,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  return { settings: data ?? {}, isLoading };
}

export function useBaseUrl(): string {
  const settings = useSiteSettings();
  const raw = settings["base_url"] || FALLBACK_BASE_URL;
  return raw.replace(/\/+$/, "");
}
