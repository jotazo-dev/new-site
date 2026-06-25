import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useAlgarClientes } from "@/hooks/useAlgarClientes";
import type { AlgarSubscriber } from "@/components/admin/esim/algar/algarClient";

const PAGE_SIZE = 50;

function fmtDoc(v?: string) {
  if (!v) return "—";
  const d = String(v).replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return v;
}

function fmtPhone(v?: string | number) {
  if (!v) return "";
  const d = String(v).replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return String(v);
}

function getDoc(c: AlgarSubscriber): string {
  return (c.document || c.cpf || c.cnpj || (c as any).tax_id || (c as any).taxId || "") as string;
}
function getName(c: AlgarSubscriber): string {
  return (c.name || (c as any).full_name || (c as any).fullName || "") as string;
}
function getPhone(c: AlgarSubscriber): string {
  return String((c as any).contact_number || (c as any).contactPhone || (c as any).contact_phone || (c as any).phone || (c as any).celular || "");
}
function getCityUf(c: AlgarSubscriber): string {
  const a = (c.address || (c as any).endereco || {}) as any;
  const city = a.city || a.cidade || a.localidade || "";
  const uf = a.state || a.uf || a.estado || "";
  if (!city && !uf) return "—";
  return `${city}${uf ? "/" + uf : ""}`;
}

export function AlgarClientesTab() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isFetching, refetch } = useAlgarClientes(page, PAGE_SIZE, search);

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;

  React.useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por CPF/CNPJ ou nome..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setSearch(searchInput)} disabled={isFetching}>
          <Search className="h-3.5 w-3.5 mr-1.5" /> Buscar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setSearchInput(""); setSearch(""); }} disabled={isFetching}>
          Limpar
        </Button>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {data && !data.ok && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">{data.error || "Erro"}</p>
            {data.message && <p className="text-muted-foreground text-xs">{data.message}</p>}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isLoading ? "Carregando..." : `${totalItems} assinante(s)`}
            {data?.latency_ms != null && <span className="ml-2 opacity-60">· {data.latency_ms}ms</span>}
          </span>
          <span>
            Página <strong className="text-foreground">{page}</strong> de <strong className="text-foreground">{totalPages}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome / Documento</TableHead>
                <TableHead className="w-[90px]">Tipo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="w-[160px]">Cidade/UF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando clientes Algar...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                    Nenhum assinante encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c, i) => (
                  <TableRow key={`${c.id || c.ref || i}`}>
                    <TableCell className="align-top">
                      <div className="font-medium">{getName(c) || "—"}</div>
                      <div className="font-mono text-[11px] text-muted-foreground mt-0.5">{fmtDoc(getDoc(c))}</div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant="outline" className="text-[10px]">
                        {c.type === "company" ? "PJ" : c.type === "individual" ? "PF" : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-xs truncate max-w-[240px]">{c.email || "—"}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{fmtPhone(getPhone(c)) || "—"}</div>
                    </TableCell>
                    <TableCell className="text-xs align-top">{getCityUf(c)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {items.length > 0
              ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + items.length} de ${totalItems}`
              : "—"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isFetching}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isFetching}>
              Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AlgarClientesTab;
