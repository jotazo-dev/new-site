import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick, TrendingUp, Image as ImageIcon, Calendar } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

type BannerClick = {
  id: string;
  banner_type: string;
  banner_id: string;
  link_url: string;
  page_path: string;
  session_id: string;
  created_at: string;
};

type BannerInfo = { id: string; label: string; image_url: string };

const PERIOD_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
];

export function BannerAnalyticsTab() {
  const [period, setPeriod] = React.useState(30);

  const { data: clicks = [], isLoading } = useQuery({
    queryKey: ["banner-clicks", period],
    queryFn: async () => {
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("banner_clicks")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data as BannerClick[];
    },
  });

  const { data: bannerLabels = {} } = useQuery({
    queryKey: ["banner-labels"],
    queryFn: async () => {
      const [hero, promo, mid] = await Promise.all([
        supabase.from("hero_banners").select("id, alt, title_top, title_bottom, image_url"),
        supabase.from("promo_banners").select("id, alt, title, image_url"),
        supabase.from("mid_banners").select("id, alt, image_url"),
      ]);
      const map: Record<string, BannerInfo> = {};
      hero.data?.forEach((b: any) => {
        map[b.id] = { id: b.id, label: `${b.title_top || ""} ${b.title_bottom || ""}`.trim() || b.alt || "Hero", image_url: b.image_url };
      });
      promo.data?.forEach((b: any) => {
        map[b.id] = { id: b.id, label: b.title || b.alt || "Promo", image_url: b.image_url };
      });
      mid.data?.forEach((b: any) => {
        map[b.id] = { id: b.id, label: b.alt || "Intermediário", image_url: b.image_url };
      });
      return map;
    },
  });

  const stats = React.useMemo(() => {
    const totalClicks = clicks.length;
    const uniqueSessions = new Set(clicks.map((c) => c.session_id).filter(Boolean)).size;
    const byType: Record<string, number> = { hero: 0, promo: 0, mid: 0 };
    const byBanner: Record<string, { count: number; type: string; linkUrl: string }> = {};

    for (const c of clicks) {
      byType[c.banner_type] = (byType[c.banner_type] || 0) + 1;
      if (!byBanner[c.banner_id]) {
        byBanner[c.banner_id] = { count: 0, type: c.banner_type, linkUrl: c.link_url };
      }
      byBanner[c.banner_id].count++;
    }

    const ranking = Object.entries(byBanner)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count);

    return { totalClicks, uniqueSessions, byType, ranking };
  }, [clicks]);

  const timeSeries = React.useMemo(() => {
    const map = new Map<string, { date: string; total: number; hero: number; promo: number; mid: number }>();
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { date: key, total: 0, hero: 0, promo: 0, mid: 0 });
    }
    for (const c of clicks) {
      const key = c.created_at.slice(0, 10);
      const row = map.get(key);
      if (!row) continue;
      row.total++;
      if (c.banner_type === "hero") row.hero++;
      else if (c.banner_type === "promo") row.promo++;
      else if (c.banner_type === "mid") row.mid++;
    }
    return Array.from(map.values()).map((r) => ({
      ...r,
      label: new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    }));
  }, [clicks, period]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Analytics de Cliques nos Banners
          </h3>
          <p className="text-xs text-muted-foreground">
            Acompanhe o engajamento dos visitantes com seus banners promocionais.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-background p-0.5">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={MousePointerClick} label="Total de cliques" value={stats.totalClicks} color="from-blue-500 to-blue-700" />
        <StatCard icon={TrendingUp} label="Sessões únicas" value={stats.uniqueSessions} color="from-emerald-500 to-emerald-700" />
        <StatCard icon={ImageIcon} label="Banners clicados" value={stats.ranking.length} color="from-purple-500 to-purple-700" />
        <StatCard icon={Calendar} label="Período" value={`${period} dias`} color="from-amber-500 to-amber-700" />
      </div>

      {/* Time series line chart */}
      <Card className="p-4">
        <h4 className="mb-3 text-sm font-semibold">Cliques ao longo do tempo</h4>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="hero" name="Hero" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="promo" name="Promo" stroke="#a855f7" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="mid" name="Intermediário" stroke="#10b981" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Per-type breakdown */}
      <Card className="p-4">
        <h4 className="mb-3 text-sm font-semibold">Cliques por tipo de banner</h4>
        <div className="grid gap-3 md:grid-cols-3">
          <TypeStat label="Hero (principal)" value={stats.byType.hero || 0} total={stats.totalClicks} color="bg-blue-500" />
          <TypeStat label="Promo (carrossel)" value={stats.byType.promo || 0} total={stats.totalClicks} color="bg-purple-500" />
          <TypeStat label="Intermediário" value={stats.byType.mid || 0} total={stats.totalClicks} color="bg-emerald-500" />
        </div>
      </Card>

      {/* Tabs: Ranking | Latest events */}
      <Tabs defaultValue="ranking">
        <TabsList>
          <TabsTrigger value="ranking">Ranking de banners</TabsTrigger>
          <TabsTrigger value="latest">Últimos cliques</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="mt-4">
          <Card className="overflow-hidden">
            {stats.ranking.length === 0 ? (
              <EmptyState message="Nenhum clique registrado ainda no período selecionado." />
            ) : (
              <div className="divide-y">
                {stats.ranking.map((item, i) => {
                  const info = bannerLabels[item.id];
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        #{i + 1}
                      </div>
                      {info?.image_url ? (
                        <img src={info.image_url} alt="" className="h-12 w-20 rounded object-cover" />
                      ) : (
                        <div className="flex h-12 w-20 items-center justify-center rounded bg-muted text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{info?.label || "Banner removido"}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.type}
                          </Badge>
                        </div>
                        {item.linkUrl && (
                          <p className="truncate text-xs text-muted-foreground">{item.linkUrl}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold tabular-nums">{item.count}</div>
                        <div className="text-[10px] text-muted-foreground">cliques</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="latest" className="mt-4">
          <Card className="overflow-hidden">
            {clicks.length === 0 ? (
              <EmptyState message="Nenhum clique registrado ainda no período selecionado." />
            ) : (
              <div className="max-h-[500px] divide-y overflow-y-auto">
                {clicks.slice(0, 100).map((c) => {
                  const info = bannerLabels[c.banner_id];
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 text-sm hover:bg-muted/50">
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                        {c.banner_type}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{info?.label || "Banner removido"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.page_path} → {c.link_url || "—"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-br ${color} p-3 text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {value}
        </p>
      </div>
    </Card>
  );
}

function TypeStat({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value} ({pct}%)</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
      <MousePointerClick className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/70">
        Os cliques nos banners aparecerão aqui assim que ocorrerem.
      </p>
    </div>
  );
}
