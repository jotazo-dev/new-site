import * as React from "react";
import { useRbxPlanos, type RbxPlano } from "@/hooks/useRbxPlanos";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RefreshCw, Eye, AlertTriangle, Database, Search, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getField(p: RbxPlano, ...keys: string[]): string {
  for (const k of keys) {
    const v = (p as any)[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return "";
}

export function RbxPlanosTab() {
  const [search, setSearch] = React.useState("");
  const [detalhe, setDetalhe] = React.useState<RbxPlano | null>(null);
  const [lastSync, setLastSync] = React.useState<Date | null>(null);

  const { data, isFetching, isError, error, refetch } = useRbxPlanos("");

  React.useEffect(() => {
    if (data && !isFetching) setLastSync(new Date());
  }, [data, isFetching]);

  const planos = data?.planos ?? [];
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return planos;
    return planos.filter((p) => {
      const cod = getField(p, "Codigo").toLowerCase();
      const desc = getField(p, "Descricao", "Nome").toLowerCase();
      const grupo = getField(p, "Grupo").toLowerCase();
      return cod.includes(q) || desc.includes(q) || grupo.includes(q);
    });
  }, [planos, search]);

  const errorMsg = !data?.ok
    ? data?.error === "auth"
      ? "Chave de integração RBX inválida ou inativa."
      : data?.error === "rbx_not_configured"
      ? "RBX não está configurado. Acesse Integrações → RBX."
      : data?.message || (isError ? (error as Error)?.message : null)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <AdminPageHeader
          title="Planos RBX"
          subtitle="Planos cadastrados no RBXSoft (somente leitura via ConsultaPlanos)"
        />
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-xs text-muted-foreground">
              Última sincronização: {lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button onClick={() => refetch()} disabled={isFetching} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
        <span>
          A API <code className="bg-muted px-1 py-0.5 rounded">ConsultaPlanos</code> do RBX retorna apenas{" "}
          <strong>Código</strong>, <strong>Descrição</strong> e <strong>Grupo</strong> — valores comerciais e situação
          são gerenciados pelos contratos no RBX, não pelo cadastro do plano.
        </span>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, descrição ou grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Falha ao carregar planos</p>
            <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
          </div>
          <Button onClick={() => refetch()} size="sm" variant="outline">Tentar novamente</Button>
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[180px]">Grupo</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && planos.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {errorMsg ? "Sem dados." : "Nenhum plano encontrado."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p, i) => {
                const grupo = getField(p, "Grupo");
                return (
                  <TableRow key={`${getField(p, "Codigo")}-${i}`}>
                    <TableCell className="font-mono text-xs">{getField(p, "Codigo") || "—"}</TableCell>
                    <TableCell className="font-medium">{getField(p, "Descricao", "Nome") || "—"}</TableCell>
                    <TableCell>
                      {grupo && grupo !== "0" ? (
                        <Badge variant="secondary" className="font-normal">{grupo}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sem grupo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDetalhe(p)} className="gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground">
        {data?.ok ? `${filtered.length} de ${planos.length} plano(s)` : null}
      </div>

      <Sheet open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Plano #{detalhe ? getField(detalhe, "Codigo") : ""}</SheetTitle>
          </SheetHeader>
          {detalhe && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(detalhe).map(([k, v]) => (
                  <div key={k} className="border-b pb-2">
                    <div className="text-xs text-muted-foreground">{k}</div>
                    <div className="font-medium break-words">{String(v ?? "—") || "—"}</div>
                  </div>
                ))}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-muted-foreground">JSON cru</summary>
                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">{JSON.stringify(detalhe, null, 2)}</pre>
              </details>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
