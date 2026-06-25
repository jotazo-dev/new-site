import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PageSEO {
  meta_title: string;
  meta_description: string;
  og_image: string;
  active: boolean;
}

export function usePageSEO(slug: string) {
  return useQuery({
    queryKey: ["page_seo", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("pages")
        .select("meta_title, meta_description, og_image, active")
        .eq("slug", slug)
        .maybeSingle();
      return data as PageSEO | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
