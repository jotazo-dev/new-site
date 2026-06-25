import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single round-trip fetch for all admin branding settings.
 * Replaces 5 individual queries that were causing 600-1500ms of latency.
 */
export type AdminBranding = {
  iconUrl: string | null;
  iconFit: string;
  iconSize: number;
  wideUrl: string | null;
  wideSize: number;
};

const KEYS = [
  "logo_admin_url",
  "logo_admin_fit",
  "logo_admin_size",
  "logo_admin_wide_url",
  "logo_admin_wide_size",
] as const;

export function useAdminBranding() {
  return useQuery<AdminBranding>({
    queryKey: ["admin_branding"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", KEYS as unknown as string[]);
      const map = new Map<string, string>();
      for (const row of data || []) map.set(row.key, row.value);
      return {
        iconUrl: map.get("logo_admin_url") || null,
        iconFit: map.get("logo_admin_fit") || "contain",
        iconSize: map.get("logo_admin_size") ? parseInt(map.get("logo_admin_size")!) : 36,
        wideUrl: map.get("logo_admin_wide_url") || null,
        wideSize: map.get("logo_admin_wide_size") ? parseInt(map.get("logo_admin_wide_size")!) : 36,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
