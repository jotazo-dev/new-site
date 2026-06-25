import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchSiteSettings, SITE_SETTINGS_QUERY_KEY } from "@/hooks/useSiteSettings";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
};

/**
 * Warms the React Query cache for all public home data in parallel,
 * scheduled on idle so it doesn't block first paint.
 *
 * Each prefetch uses the same queryKey/queryFn shape that the consuming
 * sections rely on — when those sections mount, data is already cached.
 */
export function usePrefetchHomeData() {
  const qc = useQueryClient();

  React.useEffect(() => {
    const run = () => {
      // Site settings (shared key)
      qc.prefetchQuery({
        queryKey: SITE_SETTINGS_QUERY_KEY,
        queryFn: fetchSiteSettings,
        staleTime: 5 * 60 * 1000,
      });

      // Plans
      qc.prefetchQuery({
        queryKey: ["plans"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("plans")
            .select("*")
            .eq("active", true)
            .neq("type", "sva")
            .neq("type", "voz")
            .order("sort_order");
          if (error) throw error;
          return data ?? [];
        },
        staleTime: 5 * 60 * 1000,
      });

      // Hero banners
      qc.prefetchQuery({
        queryKey: ["hero-banners"],
        queryFn: async () => {
          const { data } = await supabase
            .from("hero_banners")
            .select("*")
            .eq("active", true)
            .order("sort_order");
          return data ?? [];
        },
      });

      // Mid banners
      qc.prefetchQuery({
        queryKey: ["mid-banners"],
        queryFn: async () => {
          const { data } = await supabase
            .from("mid_banners")
            .select("*")
            .eq("active", true)
            .order("sort_order");
          return data ?? [];
        },
      });

      // Promo banners
      qc.prefetchQuery({
        queryKey: ["promo-banners"],
        queryFn: async () => {
          const { data } = await supabase
            .from("promo_banners")
            .select("*")
            .eq("active", true)
            .order("sort_order");
          return data ?? [];
        },
      });

      // Testimonials
      qc.prefetchQuery({
        queryKey: ["testimonials"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("testimonials")
            .select("*")
            .eq("active", true)
            .order("sort_order");
          if (error) throw error;
          return data ?? [];
        },
        staleTime: 10 * 60 * 1000,
      });

      // Blog posts
      qc.prefetchQuery({
        queryKey: ["blog-posts-home"],
        queryFn: async () => {
          const { data } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("active", true)
            .order("sort_order")
            .limit(6);
          return data ?? [];
        },
        staleTime: 10 * 60 * 1000,
      });
    };

    const w = window as IdleWindow;
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(run, { timeout: 1500 });
    } else {
      window.setTimeout(run, 200);
    }
  }, [qc]);
}
