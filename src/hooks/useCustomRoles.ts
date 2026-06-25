import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CustomRole = {
  id: string;
  slug: string;
  label: string;
  description: string;
  color: string;
  is_system: boolean;
  sort_order: number;
};

export function useCustomRoles() {
  return useQuery({
    queryKey: ["custom_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data || []) as CustomRole[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
