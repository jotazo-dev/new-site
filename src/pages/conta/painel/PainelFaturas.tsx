import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { ContaRbxLinkDialog } from "@/components/conta/ContaRbxLinkDialog";
import { InvoiceDetailsInline } from "@/components/minhaconta/InvoiceDetailsInline";
import { useInvoicesList, type Invoice } from "@/hooks/useMinhaContaInvoices";

const TOKEN_KEY = "minhaconta.token";

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDateBR = (iso: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const formatReference = (ref: string) => {
  const m = ref.match(/^(\d{4})-(\d{2})/);
  if (!m) return ref;
  const months = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];
  return `${months[Number(m[2]) - 1] ?? m[2]}/${m[1]}`;
};

type Filter = "todas" | "open" | "paid" | "overdue";

function StatusPill({ status, label }: { status: Invoice["status"]; label: string }) {
  const map: Record<Invoice["status"], string> = {
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    open: "bg-amber-100 text-amber-700 border-amber-200",
    overdue: "bg-red-100 text-red-700 border-red-200",
    future: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <Badge variant="outline" className={`${map[status]} font-medium`}>
      {label}
    </Badge>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className={`h-11 w-11 rounded-xl grid place-items-center ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold leading-tight mt-0.5">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

function FaturasContent() {
  const { list, loading, error, refetch } = useInvoicesList();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<Filter>("todas");

  const items = list ?? [];

  const kpis = useMemo(() => {
    const open = items.filter((i) => i.status === "open" || i.status === "future");
    const overdue = items.filter((i) => i.status === "overdue");
    const paid = items.filter((i) => i.status === "paid");
    const openTotal = [...open, ...overdue].reduce((s, i) => s + i.amountCents, 0);
    const nextDue = open
      .slice()
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))[0];
    return { open, overdue, paid, openTotal, nextDue };
  }, [items]);

  const filtered = useMemo(() => {
    const sorted = items
      .slice()
      .sort((a, b) => (b.dueDate ?? "").localeCompare(a.dueDate ?? ""));
    if (filter === "todas") return sorted;
    return sorted.filter((i) =>
      filter === "open" ? i.status === "open" || i.status === "future" : i.status === filter,
    );
  }, [items, filter]);

  if (selected) {
    return <InvoiceDetailsInline invoice={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Minhas faturas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe vencimentos, pague e baixe a 2ª via.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Wallet}
          label="Em aberto"
          value={formatBRL(kpis.openTotal)}
          hint={`${kpis.open.length + kpis.overdue.length} fatura(s)`}
          tone={kpis.overdue.length > 0 ? "danger" : "warning"}
        />
        <KpiCard
          icon={Clock}
          label="Próximo vencimento"
          value={kpis.nextDue ? formatDateBR(kpis.nextDue.dueDate) : "—"}
          hint={kpis.nextDue ? formatBRL(kpis.nextDue.amountCents) : "Nenhuma pendente"}
        />
        <KpiCard
          icon={AlertCircle}
          label="Atrasadas"
          value={String(kpis.overdue.length)}
          hint={kpis.overdue.length ? "Regularize para evitar bloqueio" : "Tudo em dia"}
          tone={kpis.overdue.length > 0 ? "danger" : "success"}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Pagas"
          value={String(kpis.paid.length)}
          hint="Histórico disponível"
          tone="success"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="todas">Todas ({items.length})</TabsTrigger>
              <TabsTrigger value="open">
                Em aberto ({kpis.open.length})
              </TabsTrigger>
              <TabsTrigger value="overdue">
                Atrasadas ({kpis.overdue.length})
              </TabsTrigger>
              <TabsTrigger value="paid">Pagas ({kpis.paid.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading && (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-sm text-muted-foreground">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma fatura nesta categoria.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(inv)}
                    >
                      <TableCell className="font-medium capitalize">
                        {formatReference(inv.reference)}
                      </TableCell>
                      <TableCell>{formatDateBR(inv.dueDate)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatBRL(inv.amountCents)}
                      </TableCell>
                      <TableCell>
                        <StatusPill status={inv.status} label={inv.statusLabel} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(inv);
                          }}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y">
              {filtered.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setSelected(inv)}
                  className="w-full text-left p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold capitalize text-sm">
                        {formatReference(inv.reference)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Vence em {formatDateBR(inv.dueDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold tabular-nums text-sm">
                        {formatBRL(inv.amountCents)}
                      </p>
                      <div className="mt-1">
                        <StatusPill status={inv.status} label={inv.statusLabel} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default function PainelFaturas() {
  const { profile, loading } = useCustomerAuth();
  const [hasToken, setHasToken] = useState<boolean>(
    () => !!sessionStorage.getItem(TOKEN_KEY),
  );
  const [linkOpen, setLinkOpen] = useState(false);

  useEffect(() => {
    if (!linkOpen) setHasToken(!!sessionStorage.getItem(TOKEN_KEY));
  }, [linkOpen]);

  return (
    <>
      <Helmet>
        <title>Faturas — Painel Jotazo</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : !profile?.rbx_code ? (
        <Card className="p-8 text-center max-w-xl mx-auto">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 grid place-items-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">Vincule sua conta de cliente</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Para acessar suas faturas, vincule seu CPF/CNPJ ao painel.
          </p>
          <Button onClick={() => setLinkOpen(true)}>
            <ShieldCheck className="h-4 w-4 mr-2" /> Vincular agora
          </Button>
        </Card>
      ) : !hasToken ? (
        <Card className="p-8 text-center max-w-xl mx-auto border-amber-200 bg-amber-50/50">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 grid place-items-center mx-auto mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">Reconecte para ver suas faturas</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Por segurança, pedimos a confirmação dos seus dados a cada sessão antes de exibir
            suas faturas.
          </p>
          <Button onClick={() => setLinkOpen(true)}>
            <ShieldCheck className="h-4 w-4 mr-2" /> Reconectar agora
          </Button>
        </Card>
      ) : (
        <FaturasContent />
      )}

      <ContaRbxLinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        prefillDoc={profile?.cpf_cnpj}
      />
    </>
  );
}
