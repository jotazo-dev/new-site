import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Eye, Loader2, Plus, RefreshCw, Search, Users } from "lucide-react";
import { eaiCall, extractList, formatCpfCnpj, statusTone, statusClasses } from "./eaiClient";
import { CustomerDetailsDialog } from "./CustomerDetailsDialog";
import { toast } from "sonner";

type Customer = {
  id?: string | number;
  name?: string;
  cpf_cnpj?: string;
  email?: string;
  phone?: string;
  cellphone?: string;
  city?: string;
  state?: string;
  status?: string;
  linesCount?: number;
};

const PAGE_SIZE = 20;

export function CustomerPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cpf_cnpj: "",
    email: "",
    phone: "",
    cellphone: "",
    city: "",
    state: "",
  });

  function normalize(raw: any): Customer {
    const addr = Array.isArray(raw?.addresses) && raw.addresses.length > 0 ? raw.addresses[0] : null;
    const linesArr = Array.isArray(raw?.lines) ? raw.lines : Array.isArray(raw?.mvno_lines) ? raw.mvno_lines : null;
    return {
      ...raw,
      id: raw?.id,
      name: raw?.name ?? raw?.legalName,
      cpf_cnpj: raw?.cpfCnpj ?? raw?.cpf_cnpj,
      email: raw?.email,
      phone: raw?.phone,
      cellphone: raw?.cellphone ?? raw?.mobile,
      city: addr?.city?.name ?? raw?.city,
      state: addr?.state?.uf ?? addr?.state?.name ?? raw?.state,
      status: raw?.status,
      linesCount: raw?.lines_count ?? raw?.linesCount ?? (linesArr ? linesArr.length : undefined),
    };
  }

  async function loadAll() {
    setLoading(true);
    setErrorMsg(null);
    const PAGE_LIMIT = 100;
    const MAX_PAGES = 1000;
    const all: any[] = [];
    let failed = false;
    for (let p = 1; p <= MAX_PAGES; p++) {
      const r = await eaiCall<any>("/rest/service_eai/customers", {
        query: { "pagination.page": p, "pagination.limit": PAGE_LIMIT },
      });
      if (!r.ok) {
        if (p === 1) failed = true;
        break;
      }
      const chunk = extractList(r) as any[];
      if (chunk.length === 0) break;
      all.push(...chunk);
      if (chunk.length < PAGE_LIMIT) break;
    }
    setLoading(false);
    if (failed) {
      setErrorMsg("Falha ao carregar clientes");
      toast.error("Falha ao carregar clientes");
      return;
    }
    setCustomers(all.map(normalize));
    setPage(1);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);



  const term = search.trim().toLowerCase();
  const termDigits = term.replace(/\D/g, "");
  const filtered = !term
    ? customers
    : customers.filter((c) => {
        const docDigits = String(c.cpf_cnpj ?? "").replace(/\D/g, "");
        if (termDigits && docDigits && docDigits.includes(termDigits)) return true;
        const blob = [c.name, c.cpf_cnpj, c.email, c.phone, c.cellphone, c.city, c.state, c.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(term);
      });


  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Clientes EAI MVNO</h3>
            <Badge variant="secondary" className="ml-1">
              {filtered.length}
              {filtered.length !== customers.length ? ` / ${customers.length}` : ""}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    loadAll();
                  }
                }}
                placeholder="Buscar nome, CPF/CNPJ, e-mail…"
                className="pl-8 pr-9 w-64"
              />
              <button
                type="button"
                onClick={() => loadAll()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors"
                title="Buscar"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <Button variant="outline" onClick={() => loadAll()} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Atualizar
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setShowCreate((s) => !s)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Cadastro
            </Button>

          </div>
        </div>

        {showCreate && (
          <Card className="p-5 rounded-2xl border-orange-500/30">
            <h4 className="font-semibold mb-4">Novo Cliente</h4>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCreating(true);
                const r = await eaiCall<any>("/rest/service_eai/customers", {
                  method: "POST",
                  body: {
                    customer: {
                      name: form.name,
                      cpf_cnpj: form.cpf_cnpj,
                      email: form.email,
                      phone: form.phone,
                      cellphone: form.cellphone,
                      city: form.city,
                      state: form.state,
                    },
                  },
                });
                setCreating(false);
                if (!r.ok) {
                  toast.error("Falha ao criar cliente");
                  return;
                }
                toast.success("Cliente criado com sucesso");
                setShowCreate(false);
                setForm({ name: "", cpf_cnpj: "", email: "", phone: "", cellphone: "", city: "", state: "" });
                loadAll();

              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <Input
                placeholder="Nome *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                placeholder="CPF/CNPJ *"
                value={form.cpf_cnpj}
                onChange={(e) => setForm((f) => ({ ...f, cpf_cnpj: e.target.value }))}
                required
              />
              <Input
                placeholder="E-mail *"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                placeholder="Telefone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                placeholder="Celular"
                value={form.cellphone}
                onChange={(e) => setForm((f) => ({ ...f, cellphone: e.target.value }))}
              />
              <Input
                placeholder="Cidade"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
              <Input
                placeholder="UF"
                maxLength={2}
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))}
              />
              <div className="sm:col-span-2 flex items-center gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating} className="bg-orange-500 hover:bg-orange-600 text-white">
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[160px]">CPF/CNPJ</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                    Carregando clientes…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {search.trim() ? "Nenhum cliente encontrado." : "Nenhum cliente."}
                  </TableCell>
                </TableRow>

              ) : (
                pageItems.map((c, i) => {
                  const tone = statusTone(c.status);
                  return (
                    <TableRow key={String(c.id ?? `${startIdx + i}`)}>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          {c.id ?? "—"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{c.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{c.email || "—"}</div>
                      </TableCell>
                      <TableCell>
                        {c.status ? (
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusClasses(tone)}`}>
                            {String(c.status)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatCpfCnpj(c.cpf_cnpj)}
                      </TableCell>
                      <TableCell>{c.phone || c.cellphone || "—"}</TableCell>
                      <TableCell>
                        {[c.city, c.state].filter(Boolean).join("/") || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => c.id && setDetailId(c.id)}
                          disabled={!c.id}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4 mr-1.5" />
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs text-muted-foreground">
              Mostrando {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {errorMsg && (
        <Card className="p-3 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {errorMsg}
        </Card>
      )}

      <CustomerDetailsDialog
        customerId={detailId}
        open={detailId !== null}
        onOpenChange={(o) => { if (!o) setDetailId(null); }}
      />
    </div>
  );
}
