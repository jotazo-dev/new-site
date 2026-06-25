import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useEaiClientes, type EaiCustomer } from "@/hooks/useEaiClientes";
import { formatCpfCnpj, formatMsisdn, statusClasses, statusTone } from "@/components/admin/esim/eai/eaiClient";

const PAGE_SIZE = 50;

function getCityUf(c: EaiCustomer): string {
  const a = (c.addresses && c.addresses[0]) || {};
  const city = a.city || a.cidade || a.cityName || "";
  const uf = a.state || a.uf || a.stateAbbr || "";
  if (!city && !uf) return "—";
  return `${city}${uf ? "/" + uf : ""}`;
}

function getPhone(c: EaiCustomer): string {
  if (c.phone) return c.phone;
  const ct = (c.contacts && c.contacts[0]) || null;
  return ct?.phone || ct?.value || "";
}

function getEmail(c: EaiCustomer): string {
  if (c.email) return c.email;
  const ct = (c.contacts || []).find((x: any) => x?.email);
  return ct?.email || "";
}

export function EaiClientesTab() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isFetching, refetch } = useEaiClientes(page, PAGE_SIZE);

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {data && !data.ok && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Erro ao carregar clientes EAI</p>
            <p className="text-muted-foreground text-xs">{data.error}</p>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isLoading ? "Carregando..." : `${totalItems} cliente(s)`}
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
                <TableHead className="w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando clientes EAI...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c, i) => {
                  const tone = statusTone(c.status);
                  return (
                    <TableRow key={c.id || i}>
                      <TableCell className="align-top">
                        <div className="font-medium">{c.name || c.legalName || "—"}</div>
                        <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                          {formatCpfCnpj(c.cpfCnpj)}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline" className="text-[10px]">
                          {c.type === "JURIDICAL" || c.typeTelecom === "JURIDICAL" ? "PJ"
                            : c.type === "PHYSICAL" || c.typeTelecom === "PHYSICAL" ? "PF"
                            : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="text-xs truncate max-w-[240px]">{getEmail(c) || "—"}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {formatMsisdn(getPhone(c)) || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs align-top">{getCityUf(c)}</TableCell>
                      <TableCell className="align-top">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] ${statusClasses(tone)}`}>
                          {c.status || "—"}
                        </span>
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

export default EaiClientesTab;
