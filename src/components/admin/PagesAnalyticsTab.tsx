import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, FileText, Calendar, Globe, Clock, LogOut, Home, ListChecks, MapPin, MessageCircle, TrendingDown, ShoppingCart, Phone, Star, Settings2, type LucideIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { FunnelStepsDialog, DEFAULT_FUNNEL_STEPS, type FunnelStep } from "./FunnelStepsDialog";

const ICON_MAP: Record<string, LucideIcon> = {
  Home, ListChecks, MapPin, MessageCircle, FileText, Eye, Globe, Users, Calendar, ShoppingCart, Phone, Star,
};

type PageView = {
  id: string;
  page_path: string;
  referrer: string;
  session_id: string;
  created_at: string;
  duration_ms: number;
};

function formatDuration(ms: number) {
  if (!ms || ms <= 0) return "0s";
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s === 0 ? `${m}min` : `${m}min ${s}s`;
}

const PERIOD_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
];

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/para-voce": "Para Você",
  "/para-empresas": "Para Empresas",
  "/planos": "Planos",
  "/cobertura": "Cobertura",
  "/atendimento": "Atendimento",
  "/teste-de-velocidade": "Teste de velocidade",
  "/sobre": "Sobre",
  "/blog": "Blog",
  "/transparencia-rede": "Transparência de rede",
  "/monte-seu-combo": "Monte seu combo",
};

function labelForPath(path: string) {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/blog/")) return `Blog: ${path.replace("/blog/", "")}`;
  return path;
}

export function PagesAnalyticsTab() {
  const [period, setPeriod] = React.useState(30);
  const [funnelDialogOpen, setFunnelDialogOpen] = React.useState(false);

  const { data: funnelSteps = DEFAULT_FUNNEL_STEPS } = useQuery({
    queryKey: ["funnel-steps-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "funnel_steps")
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return DEFAULT_FUNNEL_STEPS;
      try {
        const parsed = JSON.parse(data.value) as FunnelStep[];
        return Array.isArray(parsed) && parsed.length >= 2 ? parsed : DEFAULT_FUNNEL_STEPS;
      } catch {
        return DEFAULT_FUNNEL_STEPS;
      }
    },
  });

  const { data: views = [], isLoading } = useQuery({
    queryKey: ["page-views", period],
    queryFn: async () => {
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("page_views")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return data as PageView[];
    },
  });

  const stats = React.useMemo(() => {
    const totalViews = views.length;
    const uniqueSessions = new Set(views.map((v) => v.session_id).filter(Boolean)).size;
    const byPage: Record<string, { count: number; sessions: Set<string>; totalDuration: number; durationCount: number }> = {};
    const byReferrer: Record<string, number> = {};
    const sessionPageCount: Record<string, number> = {};

    let totalDurationMs = 0;
    let durationSamples = 0;

    for (const v of views) {
      if (!byPage[v.page_path]) byPage[v.page_path] = { count: 0, sessions: new Set(), totalDuration: 0, durationCount: 0 };
      byPage[v.page_path].count++;
      if (v.session_id) {
        byPage[v.page_path].sessions.add(v.session_id);
        sessionPageCount[v.session_id] = (sessionPageCount[v.session_id] || 0) + 1;
      }

      if (v.duration_ms && v.duration_ms > 0) {
        byPage[v.page_path].totalDuration += v.duration_ms;
        byPage[v.page_path].durationCount++;
        totalDurationMs += v.duration_ms;
        durationSamples++;
      }

      let ref = "Direto";
      if (v.referrer) {
        try {
          const url = new URL(v.referrer);
          if (url.hostname && !url.hostname.includes(window.location.hostname)) {
            ref = url.hostname.replace(/^www\./, "");
          } else {
            ref = "Interno";
          }
        } catch {
          ref = "Direto";
        }
      }
      byReferrer[ref] = (byReferrer[ref] || 0) + 1;
    }

    // Bounce rate: % of sessions with exactly 1 page view
    const sessionTotal = Object.keys(sessionPageCount).length;
    const bouncedSessions = Object.values(sessionPageCount).filter((c) => c === 1).length;
    const bounceRate = sessionTotal > 0 ? Math.round((bouncedSessions / sessionTotal) * 100) : 0;

    const avgDurationMs = durationSamples > 0 ? Math.round(totalDurationMs / durationSamples) : 0;

    const pageRanking = Object.entries(byPage)
      .map(([path, v]) => ({
        path,
        count: v.count,
        uniqueSessions: v.sessions.size,
        avgDurationMs: v.durationCount > 0 ? Math.round(v.totalDuration / v.durationCount) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const referrerRanking = Object.entries(byReferrer)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    return { totalViews, uniqueSessions, pageRanking, referrerRanking, avgDurationMs, bounceRate };
  }, [views]);

  const timeSeries = React.useMemo(() => {
    const map = new Map<string, { date: string; views: number; sessions: Set<string> }>();
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { date: key, views: 0, sessions: new Set() });
    }
    for (const v of views) {
      const key = v.created_at.slice(0, 10);
      const row = map.get(key);
      if (!row) continue;
      row.views++;
      if (v.session_id) row.sessions.add(v.session_id);
    }
    return Array.from(map.values()).map((r) => ({
      label: new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      views: r.views,
      sessions: r.sessions.size,
    }));
  }, [views, period]);

  const funnelData = React.useMemo(() => {
    const steps = funnelSteps.map((s) => ({
      key: s.path,
      label: s.label,
      icon: ICON_MAP[s.icon] || Eye,
    }));
    const sessionPaths = new Map<string, Set<string>>();
    for (const v of views) {
      if (!v.session_id) continue;
      if (!sessionPaths.has(v.session_id)) sessionPaths.set(v.session_id, new Set());
      sessionPaths.get(v.session_id)!.add(v.page_path);
    }
    const counts = steps.map((s) => {
      let n = 0;
      sessionPaths.forEach((paths) => {
        if (paths.has(s.key)) n++;
      });
      return n;
    });
    const top = counts[0] || 0;
    return steps.map((s, i) => {
      const count = counts[i];
      const pctTop = top > 0 ? (count / top) * 100 : 0;
      const prev = i > 0 ? counts[i - 1] : count;
      const pctPrev = prev > 0 ? (count / prev) * 100 : 0;
      return { ...s, count, pctTop, pctPrev, isFirst: i === 0 };
    });
  }, [views, funnelSteps]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Acessos às páginas
          </h3>
          <p className="text-xs text-muted-foreground">
            Quem está visitando seu site e quais páginas mais atraem visitantes.
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

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Eye} label="Total de visualizações" value={stats.totalViews} color="from-sky-500 to-sky-700" />
        <StatCard icon={Users} label="Sessões únicas" value={stats.uniqueSessions} color="from-emerald-500 to-emerald-700" />
        <StatCard icon={Clock} label="Tempo médio" value={formatDuration(stats.avgDurationMs)} color="from-indigo-500 to-indigo-700" />
        <StatCard icon={LogOut} label="Taxa de rejeição" value={`${stats.bounceRate}%`} color="from-rose-500 to-rose-700" />
        <StatCard icon={FileText} label="Páginas vistas" value={stats.pageRanking.length} color="from-purple-500 to-purple-700" />
        <StatCard icon={Calendar} label="Período" value={`${period} dias`} color="from-amber-500 to-amber-700" />
      </div>

      <Card className="p-4">
        <h4 className="mb-3 text-sm font-semibold">Acessos ao longo do tempo</h4>
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
              <Line type="monotone" dataKey="views" name="Visualizações" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="sessions" name="Sessões únicas" stroke="#10b981" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Funil de conversão</h4>
          <span className="hidden text-xs text-muted-foreground sm:inline">— jornada do visitante por sessão única</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-7 gap-1.5 text-xs"
            onClick={() => setFunnelDialogOpen(true)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            Editar etapas
          </Button>
        </div>
        {funnelData[0]?.count === 0 ? (
          <EmptyState message="Sem dados de jornada no período selecionado." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Coluna esquerda — barras detalhadas */}
            <div className="space-y-3">
              {funnelData.map((step, i) => {
                const Icon = step.icon;
                const width = Math.max(step.pctTop, 4);
                const hue = 210 + i * 12;
                return (
                  <div key={step.key} className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">{step.label}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold tabular-nums text-foreground">{step.count}</span>
                            <span className="text-muted-foreground">sessões</span>
                            {!step.isFirst && (
                              <Badge variant="outline" className="text-[10px]">
                                {step.pctPrev.toFixed(1)}% conv.
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-1.5 h-6 overflow-hidden rounded-md bg-muted">
                          <div
                            className="flex h-full items-center justify-end rounded-md px-2 text-[10px] font-semibold text-white transition-all"
                            style={{
                              width: `${width}%`,
                              background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(${hue} 80% 55%) 100%)`,
                            }}
                          >
                            {step.pctTop.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coluna direita — funil visual SVG (trapézios contínuos) */}
            <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-muted/40 to-muted/10 p-4">
              {(() => {
                const W = 320;
                const segH = 64;
                const gap = 6;
                const minW = 60;
                const H = funnelData.length * segH + (funnelData.length - 1) * gap;
                const widths = funnelData.map((s) => {
                  const pct = Math.max(s.pctTop, 0) / 100;
                  return Math.max(minW, W * (0.35 + 0.65 * pct));
                });
                widths[0] = W;
                return (
                  <div className="flex w-full items-center gap-3">
                    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="max-w-[340px] shrink-0">
                      <defs>
                        {funnelData.map((_, i) => {
                          const hue = 210 + i * 14;
                          return (
                            <linearGradient key={i} id={`fnl-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={`hsl(${hue}, 80%, 55%)`} />
                              <stop offset="100%" stopColor={`hsl(${hue + 25}, 85%, 42%)`} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                      {funnelData.map((step, i) => {
                        const topW = widths[i];
                        const bottomW = i < funnelData.length - 1 ? widths[i + 1] : Math.max(widths[i] * 0.72, minW * 0.8);
                        const y = i * (segH + gap);
                        const topL = (W - topW) / 2;
                        const topR = topL + topW;
                        const botL = (W - bottomW) / 2;
                        const botR = botL + bottomW;
                        const path = `M${topL},${y} L${topR},${y} L${botR},${y + segH} L${botL},${y + segH} Z`;
                        return (
                          <g key={step.key}>
                            <path d={path} fill={`url(#fnl-grad-${i})`} className="drop-shadow-sm" />
                            <text x={W / 2} y={y + segH / 2 - 4} textAnchor="middle" className="fill-white" style={{ fontSize: 12, fontWeight: 700 }}>
                              {step.label}
                            </text>
                            <text x={W / 2} y={y + segH / 2 + 12} textAnchor="middle" className="fill-white/90" style={{ fontSize: 11, fontWeight: 600 }}>
                              {step.count.toLocaleString("pt-BR")} · {step.pctTop.toFixed(1)}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="flex flex-col" style={{ height: H }}>
                      {funnelData.map((step, i) => {
                        const Icon = step.icon;
                        const isLast = i === funnelData.length - 1;
                        return (
                          <div key={step.key} className="flex flex-col justify-center" style={{ height: segH, marginBottom: isLast ? 0 : gap }}>
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-semibold">{step.label}</span>
                            </div>
                            {step.isFirst ? (
                              <div className="ml-5 text-[10px] text-muted-foreground">topo do funil</div>
                            ) : (
                              <div className="ml-5 text-[10px] text-muted-foreground">
                                <span className="font-bold tabular-nums text-foreground">{step.pctPrev.toFixed(1)}%</span> da etapa anterior
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Card>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Páginas mais vistas</TabsTrigger>
          <TabsTrigger value="referrers">Origens do tráfego</TabsTrigger>
          <TabsTrigger value="latest">Últimos acessos</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-4">
          <Card className="overflow-hidden">
            {stats.pageRanking.length === 0 ? (
              <EmptyState message="Nenhum acesso registrado ainda no período selecionado." />
            ) : (
              <div className="divide-y">
                {stats.pageRanking.map((item, i) => {
                  const max = stats.pageRanking[0]?.count || 1;
                  const pct = Math.round((item.count / max) * 100);
                  return (
                    <div key={item.path} className="space-y-2 p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          #{i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{labelForPath(item.path)}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.path}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold tabular-nums">{item.count}</div>
                          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                            <span>{item.uniqueSessions} únicos</span>
                            {item.avgDurationMs > 0 && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" /> {formatDuration(item.avgDurationMs)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-10 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="referrers" className="mt-4">
          <Card className="overflow-hidden">
            {stats.referrerRanking.length === 0 ? (
              <EmptyState message="Sem dados de origem no período." />
            ) : (
              <div className="divide-y">
                {stats.referrerRanking.map((item) => {
                  const pct = stats.totalViews > 0 ? Math.round((item.count / stats.totalViews) * 100) : 0;
                  return (
                    <div key={item.source} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm font-medium">{item.source}</span>
                      <Badge variant="outline" className="text-xs">{pct}%</Badge>
                      <span className="w-12 text-right text-sm font-bold tabular-nums">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="latest" className="mt-4">
          <Card className="overflow-hidden">
            {views.length === 0 ? (
              <EmptyState message="Nenhum acesso registrado ainda." />
            ) : (
              <div className="max-h-[500px] divide-y overflow-y-auto">
                {views.slice(0, 200).map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 text-sm hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{labelForPath(v.page_path)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {v.referrer || "Acesso direto"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <FunnelStepsDialog
        open={funnelDialogOpen}
        onOpenChange={setFunnelDialogOpen}
        initialSteps={funnelSteps}
      />
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
      <Eye className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
