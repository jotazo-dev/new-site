import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useRbxClientes, type RbxCliente } from "@/hooks/useRbxClientes";

const PAGE_SIZE = 50;

function fmtDoc(v?: string) {
  if (!v) return "—";
  const d = String(v).replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return v;
}

function fmtPhone(v?: string) {
  if (!v) return "";
  const d = String(v).replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return v;
}

const SITUACAO_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  A: { label: "Ativo", variant: "default" },
  I: { label: "Inativo", variant: "secondary" },
  B: { label: "Bloqueado", variant: "destructive" },
  S: { label: "Suspenso", variant: "destructive" },
  C: { label: "Cancelado", variant: "outline" },
  E: { label: "Aguard. Instalação", variant: "secondary" },
};

export function RbxClientesTab() {
  const [searchInput, setSearchInput] = React.useState("");
  const [filtro, setFiltro] = React.useState("");
  const [page, setPage] = React.useState(0);

  const { data, isLoading, isFetching, refetch, error } = useRbxClientes(filtro, true);

  const clientes: RbxCliente[] = data?.clientes ?? [];
  const total = clientes.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = clientes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  React.useEffect(() => { setPage(0); }, [filtro]);

  function buildFilter(q: string): string {
    const s = q.trim();
    if (!s) return "";
    const digits = s.replace(/\D/g, "");
    if (digits.length >= 11) return `CNPJ_CNPF = '${digits}'`;
    if (/^\d+$/.test(s)) return `Codigo = '${s}'`;
    const safe = s.replace(/'/g, "''");
    return `Nome LIKE '%${safe}%'`;
  }

  function onSearch() {
    setFiltro(buildFilter(searchInput));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por CPF/CNPJ, código ou nome..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onSearch} disabled={isFetching}>
          <Search className="h-3.5 w-3.5 mr-1.5" /> Buscar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setSearchInput(""); setFiltro(""); }} disabled={isFetching}>
          Limpar
        </Button>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {!data?.ok && data?.message && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">{data.error || "Erro"}</p>
            <p className="text-muted-foreground text-xs">{data.message}</p>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isLoading ? "Carregando..." : `${total} cliente(s)`}
            {data?.latency_ms != null && <span className="ml-2 opacity-60">· {data.latency_ms}ms</span>}
          </span>
          <span>
            Página <strong className="text-foreground">{page + 1}</strong> de <strong className="text-foreground">{pageCount}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Código</TableHead>
                <TableHead>Nome / Documento</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="w-[160px]">Cidade/UF</TableHead>
                <TableHead className="w-[140px]">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando clientes RBX...
                  </TableCell>
                </TableRow>
              ) : current.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                current.map((c, i) => {
                  const sit = SITUACAO_MAP[String(c.Situacao || "").toUpperCase()];
                  const phone = c.TelCelular || c.TelComercial || c.TelResidencial || "";
                  return (
                    <TableRow key={`${c.Codigo}-${i}`}>
                      <TableCell className="font-mono text-xs align-top">{String(c.Codigo ?? "—")}</TableCell>
                      <TableCell className="align-top">
                        <div className="font-medium flex items-center gap-2">
                          <span>{c.Nome || "—"}</span>
                          {c.Tipo && (
                            <span className="text-[10px] text-muted-foreground">
                              {c.Tipo === "F" ? "PF" : c.Tipo === "J" ? "PJ" : c.Tipo}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                          {fmtDoc(c.CNPJ_CNPF)}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="text-xs truncate max-w-[240px]">{c.Email || "—"}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{fmtPhone(phone) || "—"}</div>
                      </TableCell>
                      <TableCell className="text-xs align-top">
                        {c.Cidade ? `${c.Cidade}${c.UF ? "/" + c.UF : ""}` : "—"}
                      </TableCell>
                      <TableCell className="align-top">
                        {sit ? (
                          <Badge variant={sit.variant}>{sit.label}</Badge>
                        ) : (
                          <Badge variant="outline">{String(c.Situacao ?? "—")}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Mostrando {current.length === 0 ? 0 : page * PAGE_SIZE + 1}–{page * PAGE_SIZE + current.length} de {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || isLoading}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1 || isLoading}>
              Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default RbxClientesTab;
