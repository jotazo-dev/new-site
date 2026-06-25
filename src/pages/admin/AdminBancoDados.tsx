import { useState } from "react";
import { Database, RefreshCw, HardDrive, Activity, Table as TableIcon, Lock, Zap, FileCode, BarChart3, Download, Loader2, Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Helmet } from "react-helmet-async";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useDbOverview, useDbTables, useDbTableDetail, useDbFunctions,
  useDbTriggers, useDbStorage, useDbSlowQueries, useDbIndexUsage,
} from "@/hooks/useDbInspector";
import { formatBytes, formatNumber } from "@/lib/dbInspector";

export default function AdminBancoDados() {
  const qc = useQueryClient();
  const [tableFilter, setTableFilter] = useState("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [backingUpMedia, setBackingUpMedia] = useState(false);
  const [exportingSchema, setExportingSchema] = useState(false);
  const [confirmMode, setConfirmMode] = useState<null | "full" | "full-media" | "schema">(null);

  const CONFIRM_COPY: Record<"full" | "full-media" | "schema", { title: string; description: string }> = {
    full: {
      title: "Gerar backup do banco (.zip)?",
      description: "Vai exportar todas as tabelas (CSV), schema, policies, triggers, funções, índices, grants e usuários auth — sem as mídias do Storage. Pode levar alguns segundos.",
    },
    "full-media": {
      title: "Gerar backup completo + mídias?",
      description: "Inclui TUDO do backup padrão MAIS todos os arquivos binários dos buckets do Storage. O arquivo pode ficar grande e o processo demora mais.",
    },
    schema: {
      title: "Exportar schema (.sql)?",
      description: "Baixa apenas a estrutura das tabelas (CREATE TABLE), sem nenhum dado.",
    },
  };

  const runConfirmed = () => {
    if (confirmMode === "full") handleBackup();
    else if (confirmMode === "full-media") handleBackupMedia();
    else if (confirmMode === "schema") handleExportSchema();
    setConfirmMode(null);
  };

  const refreshAll = () => qc.invalidateQueries({ queryKey: ["db-inspector"] });

  const downloadFromFn = async (mode: "full" | "full-media" | "schema", filename: string) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    if (!token) throw new Error("Sessão expirada. Faça login novamente.");
    const url = `https://lcbgiersxjeyjcstrxmc.supabase.co/functions/v1/db-backup?mode=${mode}`;
    const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      await downloadFromFn("full", `db-backup-${stamp}.zip`);
      toast({ title: "Backup gerado", description: "Download iniciado." });
    } catch (e: any) {
      toast({ title: "Falha no backup", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBackingUp(false);
    }
  };

  const handleBackupMedia = async () => {
    setBackingUpMedia(true);
    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      await downloadFromFn("full-media", `db-backup-completo-${stamp}.zip`);
      toast({ title: "Backup completo gerado", description: "Inclui todas as mídias do Storage." });
    } catch (e: any) {
      toast({ title: "Falha no backup completo", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBackingUpMedia(false);
    }
  };

  const handleExportSchema = async () => {
    setExportingSchema(true);
    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      await downloadFromFn("schema", `db-schema-${stamp}.sql`);
      toast({ title: "Schema exportado", description: "Download iniciado." });
    } catch (e: any) {
      toast({ title: "Falha ao exportar schema", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setExportingSchema(false);
    }
  };

  const IconAction = ({ label, onClick, disabled, loading, icon: Icon, variant = "outline" }: {
    label: string; onClick: () => void; disabled?: boolean; loading?: boolean;
    icon: React.ComponentType<{ className?: string }>; variant?: "outline" | "default";
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size="icon" onClick={onClick} disabled={disabled} aria-label={label}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{loading ? "Processando..." : label}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="p-6 space-y-6">
      <Helmet><title>Banco de Dados — Admin</title></Helmet>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Banco de Dados</h1>
            <p className="text-sm text-muted-foreground">Panorama completo do banco Postgres do projeto</p>
          </div>
        </div>
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-2">
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="default" size="icon" aria-label="Backup" disabled={backingUp || backingUpMedia || exportingSchema}>
                      {(backingUp || backingUpMedia || exportingSchema)
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Download className="h-4 w-4" />}
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Backup</TooltipContent>
              </Tooltip>
              <PopoverContent align="end" className="w-72 p-2">
                <button
                  onClick={() => setConfirmMode("full")}
                  disabled={backingUp || backingUpMedia || exportingSchema}
                  className="w-full flex items-start gap-3 rounded-md p-2 text-left hover:bg-muted disabled:opacity-50"
                >
                  {backingUp ? <Loader2 className="h-4 w-4 mt-0.5 animate-spin" /> : <Download className="h-4 w-4 mt-0.5 text-primary" />}
                  <div>
                    <div className="text-sm font-medium">Backup do banco (.zip)</div>
                    <div className="text-xs text-muted-foreground">Dados + schema, sem mídias</div>
                  </div>
                </button>
                <button
                  onClick={() => setConfirmMode("full-media")}
                  disabled={backingUp || backingUpMedia || exportingSchema}
                  className="w-full flex items-start gap-3 rounded-md p-2 text-left hover:bg-muted disabled:opacity-50"
                >
                  {backingUpMedia ? <Loader2 className="h-4 w-4 mt-0.5 animate-spin" /> : <Package className="h-4 w-4 mt-0.5 text-primary" />}
                  <div>
                    <div className="text-sm font-medium">Backup completo + mídias</div>
                    <div className="text-xs text-muted-foreground">Inclui arquivos do Storage (maior)</div>
                  </div>
                </button>
                <button
                  onClick={() => setConfirmMode("schema")}
                  disabled={backingUp || backingUpMedia || exportingSchema}
                  className="w-full flex items-start gap-3 rounded-md p-2 text-left hover:bg-muted disabled:opacity-50"
                >
                  {exportingSchema ? <Loader2 className="h-4 w-4 mt-0.5 animate-spin" /> : <FileCode className="h-4 w-4 mt-0.5 text-primary" />}
                  <div>
                    <div className="text-sm font-medium">Apenas schema (.sql)</div>
                    <div className="text-xs text-muted-foreground">Estrutura sem dados</div>
                  </div>
                </button>
              </PopoverContent>
            </Popover>
            <IconAction label="Atualizar dados" icon={RefreshCw} onClick={refreshAll} />
          </div>
        </TooltipProvider>
      </div>

      <AlertDialog open={!!confirmMode} onOpenChange={(o) => !o && setConfirmMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmMode && CONFIRM_COPY[confirmMode].title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMode && CONFIRM_COPY[confirmMode].description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirmed}>Confirmar e baixar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>




      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-2" />Visão Geral</TabsTrigger>
          <TabsTrigger value="tables"><TableIcon className="h-4 w-4 mr-2" />Tabelas</TabsTrigger>
          <TabsTrigger value="functions"><FileCode className="h-4 w-4 mr-2" />Funções</TabsTrigger>
          <TabsTrigger value="storage"><HardDrive className="h-4 w-4 mr-2" />Storage</TabsTrigger>
          <TabsTrigger value="performance"><Zap className="h-4 w-4 mr-2" />Performance</TabsTrigger>
          <TabsTrigger value="indexes"><BarChart3 className="h-4 w-4 mr-2" />Índices</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <OverviewSection />
        </TabsContent>

        {/* TABLES */}
        <TabsContent value="tables" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tabelas (schema public)</CardTitle>
              <Input
                placeholder="Filtrar..."
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="max-w-xs"
              />
            </CardHeader>
            <CardContent>
              <TablesSection filter={tableFilter} onSelect={setSelectedTable} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* FUNCTIONS */}
        <TabsContent value="functions" className="space-y-4 mt-6">
          <FunctionsSection />
          <TriggersSection />
        </TabsContent>

        {/* STORAGE */}
        <TabsContent value="storage" className="space-y-4 mt-6">
          <StorageSection />
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="space-y-4 mt-6">
          <SlowQueriesSection />
        </TabsContent>

        {/* INDEX USAGE */}
        <TabsContent value="indexes" className="space-y-4 mt-6">
          <IndexUsageSection />
        </TabsContent>
      </Tabs>

      <TableDetailSheet table={selectedTable} onClose={() => setSelectedTable(null)} />
    </div>
  );
}

/* ─────────── Overview ─────────── */
function OverviewSection() {
  const { data, isLoading } = useDbOverview();
  if (isLoading) return <SkeletonGrid n={6} />;
  if (!data) return null;
  const conns = data.connections ?? {};
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Kpi label="Tamanho do banco" value={formatBytes(data.db_size_bytes)} icon={<HardDrive className="h-5 w-5" />} />
      <Kpi label="Tabelas (public)" value={formatNumber(data.table_count)} icon={<TableIcon className="h-5 w-5" />} />
      <Kpi label="WAL" value={formatBytes(data.wal_bytes)} icon={<Activity className="h-5 w-5" />} />
      <Kpi label="Conexões ativas" value={`${conns.active ?? 0} / ${conns.max ?? "?"}`} sub={`${conns.total ?? 0} totais (${conns.idle ?? 0} idle)`} icon={<Zap className="h-5 w-5" />} />
      <Kpi label="Deadlocks" value={formatNumber(data.deadlocks)} sub="desde o boot" icon={<Lock className="h-5 w-5" />} />
      <Kpi label="Commits / Rollbacks" value={`${formatNumber(data.commits)} / ${formatNumber(data.rollbacks)}`} sub="desde o boot" icon={<BarChart3 className="h-5 w-5" />} />
      <Card className="sm:col-span-2 lg:col-span-3">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <div><span className="font-medium text-foreground">Versão:</span> {data.version}</div>
          <div><span className="font-medium text-foreground">Postmaster iniciado:</span> {new Date(data.postmaster_started).toLocaleString("pt-BR")}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          {icon && <div className="text-muted-foreground/60">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────── Tables ─────────── */
function TablesSection({ filter, onSelect }: { filter: string; onSelect: (t: string) => void }) {
  const { data, isLoading } = useDbTables();
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  const rows = (data ?? []).filter((r: any) => r.name.toLowerCase().includes(filter.toLowerCase()));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="text-right">Linhas (est.)</TableHead>
          <TableHead className="text-right">Tamanho</TableHead>
          <TableHead className="text-center">Colunas</TableHead>
          <TableHead className="text-center">Índices</TableHead>
          <TableHead className="text-center">RLS</TableHead>
          <TableHead className="text-center">Policies</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r: any) => (
          <TableRow key={r.name} className="cursor-pointer" onClick={() => onSelect(r.name)}>
            <TableCell className="font-mono text-sm">{r.name}</TableCell>
            <TableCell className="text-right">{formatNumber(r.est_rows)}</TableCell>
            <TableCell className="text-right">{formatBytes(r.size_bytes)}</TableCell>
            <TableCell className="text-center">{r.column_count}</TableCell>
            <TableCell className="text-center">{r.index_count}</TableCell>
            <TableCell className="text-center">
              {r.rls_enabled
                ? <Badge variant="default" className="bg-green-600">ON</Badge>
                : <Badge variant="destructive">OFF</Badge>}
            </TableCell>
            <TableCell className="text-center">{r.policy_count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ─────────── Table Detail ─────────── */
function TableDetailSheet({ table, onClose }: { table: string | null; onClose: () => void }) {
  const { data, isLoading } = useDbTableDetail(table);
  return (
    <Sheet open={!!table} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono">{table}</SheetTitle>
        </SheetHeader>
        {isLoading || !data ? (
          <div className="mt-6 space-y-3"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
        ) : (
          <ScrollArea className="mt-4">
            <div className="space-y-6">
              <DetailBlock title={`Linhas (exato): ${formatNumber(data.row_count)}`}>
                <span />
              </DetailBlock>

              <DetailBlock title="Colunas">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Nome</TableHead><TableHead>Tipo</TableHead>
                    <TableHead>Nullable</TableHead><TableHead>Default</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.columns.map((c: any) => (
                      <TableRow key={c.column_name}>
                        <TableCell className="font-mono text-xs">{c.column_name}</TableCell>
                        <TableCell className="text-xs">{c.data_type}</TableCell>
                        <TableCell className="text-xs">{c.is_nullable}</TableCell>
                        <TableCell className="text-xs font-mono truncate max-w-[180px]">{c.column_default ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DetailBlock>

              <DetailBlock title={`Índices (${data.indexes.length})`}>
                <div className="space-y-1 text-xs font-mono">
                  {data.indexes.map((i: any) => (
                    <div key={i.indexname} className="p-2 bg-muted/40 rounded">{i.indexdef}</div>
                  ))}
                  {!data.indexes.length && <p className="text-muted-foreground text-xs">Nenhum índice.</p>}
                </div>
              </DetailBlock>

              <DetailBlock title={`Políticas RLS (${data.policies.length})`}>
                <div className="space-y-2">
                  {data.policies.map((p: any) => (
                    <div key={p.policyname} className="p-3 border rounded text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge>{p.cmd}</Badge>
                        <span className="font-mono">{p.policyname}</span>
                        <span className="text-muted-foreground">{Array.isArray(p.roles) ? p.roles.join(", ") : p.roles}</span>
                      </div>
                      {p.qual && <div><span className="text-muted-foreground">USING:</span> <code>{p.qual}</code></div>}
                      {p.with_check && <div><span className="text-muted-foreground">WITH CHECK:</span> <code>{p.with_check}</code></div>}
                    </div>
                  ))}
                  {!data.policies.length && <p className="text-xs text-muted-foreground">Nenhuma policy.</p>}
                </div>
              </DetailBlock>

              <DetailBlock title={`Foreign Keys (${data.foreign_keys.length})`}>
                {data.foreign_keys.length ? (
                  <Table><TableBody>
                    {data.foreign_keys.map((f: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{f.column_name}</TableCell>
                        <TableCell className="text-xs">→ {f.foreign_table}.{f.foreign_column}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody></Table>
                ) : <p className="text-xs text-muted-foreground">Nenhuma FK.</p>}
              </DetailBlock>

              <DetailBlock title="Permissões (GRANTs)">
                <Table>
                  <TableHeader><TableRow><TableHead>Role</TableHead><TableHead>Privilégio</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.grants.map((g: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono">{g.grantee}</TableCell>
                        <TableCell className="text-xs">{g.privilege_type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DetailBlock>

              <DetailBlock title={`Triggers (${data.triggers.length})`}>
                {data.triggers.length ? data.triggers.map((t: any, i: number) => (
                  <div key={i} className="text-xs font-mono p-2 bg-muted/40 rounded mb-1">
                    {t.trigger_name} — {t.action_timing} {t.event_manipulation}
                  </div>
                )) : <p className="text-xs text-muted-foreground">Nenhum trigger.</p>}
              </DetailBlock>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

/* ─────────── Functions & Triggers ─────────── */
function FunctionsSection() {
  const { data, isLoading } = useDbFunctions();
  return (
    <Card>
      <CardHeader><CardTitle>Funções ({data?.length ?? 0})</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48 w-full" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>Retorno</TableHead>
              <TableHead>Args</TableHead><TableHead>Linguagem</TableHead>
              <TableHead className="text-center">SECDEF</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((f: any) => (
                <TableRow key={f.name + f.arguments}>
                  <TableCell className="font-mono text-xs">{f.name}</TableCell>
                  <TableCell className="text-xs">{f.return_type}</TableCell>
                  <TableCell className="text-xs font-mono truncate max-w-[260px]">{f.arguments || "—"}</TableCell>
                  <TableCell className="text-xs">{f.language}</TableCell>
                  <TableCell className="text-center">{f.security_definer ? <Badge>SEC</Badge> : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TriggersSection() {
  const { data, isLoading } = useDbTriggers();
  return (
    <Card>
      <CardHeader><CardTitle>Triggers ({data?.length ?? 0})</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-32 w-full" /> : (data?.length ? (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tabela</TableHead><TableHead>Nome</TableHead>
              <TableHead>Quando</TableHead><TableHead>Evento</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data!.map((t: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{t.table_name}</TableCell>
                  <TableCell className="font-mono text-xs">{t.trigger_name}</TableCell>
                  <TableCell className="text-xs">{t.action_timing}</TableCell>
                  <TableCell className="text-xs">{t.event_manipulation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : <p className="text-xs text-muted-foreground">Nenhum trigger no schema public.</p>)}
      </CardContent>
    </Card>
  );
}

/* ─────────── Storage ─────────── */
function StorageSection() {
  const { data, isLoading } = useDbStorage();
  return (
    <Card>
      <CardHeader><CardTitle>Buckets de Storage</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48 w-full" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Bucket</TableHead><TableHead>Público</TableHead>
              <TableHead className="text-right">Objetos</TableHead>
              <TableHead className="text-right">Tamanho total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.name}</TableCell>
                  <TableCell>{b.public ? <Badge>Público</Badge> : <Badge variant="secondary">Privado</Badge>}</TableCell>
                  <TableCell className="text-right">{formatNumber(b.object_count)}</TableCell>
                  <TableCell className="text-right">{formatBytes(b.total_bytes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────── Slow queries ─────────── */
function SlowQueriesSection() {
  const { data, isLoading } = useDbSlowQueries();
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data?.available) {
    return (
      <Card>
        <CardHeader><CardTitle>Queries mais lentas</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          pg_stat_statements não está disponível neste banco.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader><CardTitle>Top 20 queries por tempo total</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Query</TableHead>
            <TableHead className="text-right">Chamadas</TableHead>
            <TableHead className="text-right">Médio (ms)</TableHead>
            <TableHead className="text-right">Total (ms)</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(data.rows ?? []).map((q: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs max-w-[480px] truncate" title={q.query}>{q.query}</TableCell>
                <TableCell className="text-right">{formatNumber(Number(q.calls))}</TableCell>
                <TableCell className="text-right">{Number(q.mean_exec_time).toFixed(1)}</TableCell>
                <TableCell className="text-right">{Number(q.total_exec_time).toFixed(0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ─────────── Index usage ─────────── */
function IndexUsageSection() {
  const { data, isLoading } = useDbIndexUsage();
  return (
    <Card>
      <CardHeader><CardTitle>Uso de Índices (menor uso primeiro)</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48 w-full" /> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tabela</TableHead><TableHead>Índice</TableHead>
              <TableHead className="text-right">Scans</TableHead>
              <TableHead className="text-right">Tamanho</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(data ?? []).map((r: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{r.table}</TableCell>
                  <TableCell className="font-mono text-xs">{r.index}</TableCell>
                  <TableCell className="text-right">{formatNumber(Number(r.idx_scan))}</TableCell>
                  <TableCell className="text-right">{formatBytes(r.size_bytes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonGrid({ n }: { n: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: n }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
    </div>
  );
}
