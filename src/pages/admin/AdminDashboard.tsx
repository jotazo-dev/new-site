import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Image, MessageSquareQuote, HelpCircle, Newspaper, Megaphone, RefreshCw, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PipelineKPIs } from "@/components/admin/crm/PipelineKPIs";
import type { CrmLead } from "@/components/admin/crm/types";
import { ClientesKpiCards } from "@/components/admin/dashboard/ClientesKpiCards";
import { ChamadosAbertosHojeCard } from "@/components/admin/dashboard/ChamadosAbertosHojeCard";
import { MotivosChamadosCard } from "@/components/admin/dashboard/MotivosChamadosCard";
import { ClientesOfflineCard } from "@/components/admin/dashboard/ClientesOfflineCard";

const cards: { label: string; table: "plans" | "hero_banners" | "promo_banners" | "testimonials" | "faqs" | "blog_posts" | "announcements"; icon: LucideIcon; color: string }[] = [
  { label: "Planos", table: "plans", icon: FileText, color: "from-blue-500 to-blue-700" },
  { label: "Banners Hero", table: "hero_banners", icon: Image, color: "from-purple-500 to-purple-700" },
  { label: "Banners Promo", table: "promo_banners", icon: Image, color: "from-indigo-500 to-indigo-700" },
  { label: "Depoimentos", table: "testimonials", icon: MessageSquareQuote, color: "from-emerald-500 to-emerald-700" },
  { label: "FAQs", table: "faqs", icon: HelpCircle, color: "from-amber-500 to-amber-700" },
  { label: "Posts do Blog", table: "blog_posts", icon: Newspaper, color: "from-rose-500 to-rose-700" },
  { label: "Anúncios", table: "announcements", icon: Megaphone, color: "from-orange-500 to-orange-700" },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const firstName = user?.email?.split("@")[0] ?? "Admin";

  const refreshKpis = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-kpis-clientes"] }),
        queryClient.invalidateQueries({ queryKey: ["rbx-atendimentos"] }),
        queryClient.invalidateQueries({ queryKey: ["clientes-offline"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-counts"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard-crm-leads"] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Single query to fetch all counts at once
  const { data: counts, isLoading } = useQuery({
    queryKey: ["admin-dashboard-counts"],
    enabled: isAdmin,
    staleTime: 30_000,
    queryFn: async () => {
      const tables = cards.map((c) => c.table);
      const results = await Promise.all(
        tables.map((t) =>
          supabase.from(t).select("*", { count: "exact", head: true }).then(({ count }) => count ?? 0)
        )
      );
      const map: Record<string, number> = {};
      tables.forEach((t, i) => { map[t] = results[i]; });
      return map;
    },
  });

  // Fetch CRM leads for pipeline KPIs
  const { data: leads } = useQuery({
    queryKey: ["admin-dashboard-crm-leads"],
    enabled: isAdmin,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      return (data ?? []) as unknown as CrmLead[];
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Bem-vindo,{" "}
            <span className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie todo o conteúdo do site Jotazo a partir daqui.</p>
        </div>
        <Button variant="outline" size="icon" onClick={refreshKpis} disabled={isRefreshing} aria-label="Atualizar KPIs" title="Atualizar KPIs">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <ClientesKpiCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ChamadosAbertosHojeCard />
        </div>
        <div className="lg:col-span-1">
          <MotivosChamadosCard />
        </div>
        <div className="lg:col-span-1">
          <ClientesOfflineCard />
        </div>
      </div>





    </div>
  );
}

function CountCard({ label, icon: Icon, color, count, isLoading }: {
  label: string; icon: LucideIcon; color: string; count?: number; isLoading: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {isLoading ? <Skeleton className="h-8 w-12" /> : count ?? 0}
        </div>
      </CardContent>
    </Card>
  );
}
