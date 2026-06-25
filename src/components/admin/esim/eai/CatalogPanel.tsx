import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Package, Search } from "lucide-react";
import { eaiCall, brl, extractList } from "./eaiClient";

type AnyObj = Record<string, any>;

export function CatalogPanel() {
  const [search, setSearch] = useState("");
  const products = useQuery({
    queryKey: ["eai", "mvno_main_products"],
    queryFn: () => eaiCall<any>("/rest/service_eai/mvno_main_products"),
    staleTime: 5 * 60 * 1000,
  });
  const plans = useQuery({
    queryKey: ["eai", "mvno_plans"],
    queryFn: () => eaiCall<any>("/rest/service_eai/mvno_plans"),
    staleTime: 5 * 60 * 1000,
  });

  const productList = useMemo(() => extractList(products.data), [products.data]);
  const planList = useMemo(() => extractList(plans.data), [plans.data]);

  const filter = (arr: AnyObj[]) => {
    if (!search.trim()) return arr;
    const q = search.toLowerCase();
    return arr.filter((p) => JSON.stringify(p).toLowerCase().includes(q));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, plano, preço..."
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => { products.refetch(); plans.refetch(); }}
          disabled={products.isFetching || plans.isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${products.isFetching || plans.isFetching ? "animate-spin" : ""}`} />
          Recarregar
        </Button>
      </div>

      <Section title="Main Products" loading={products.isLoading} count={productList.length} error={products.data?.ok === false ? "Falha ao carregar produtos." : null}>
        <Grid items={filter(productList)} kind="product" />
      </Section>

      <Section title="Plans" loading={plans.isLoading} count={planList.length} error={plans.data?.ok === false ? "Falha ao carregar planos." : null}>
        <Grid items={filter(planList)} kind="plan" />
      </Section>
    </div>
  );
}

function Section({ title, count, loading, error, children }: { title: string; count: number; loading: boolean; error: string | null; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary">{count}</Badge>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…
        </div>
      ) : error ? (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">{error}</Card>
      ) : (
        children
      )}
    </div>
  );
}

function Grid({ items, kind }: { items: AnyObj[]; kind: "product" | "plan" }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nenhum item.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it, i) => (
        <Card key={it.id ?? it.uuid ?? i} className="p-4 space-y-2 rounded-2xl hover:shadow-md transition">
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium leading-snug">{it.name || it.description || it.title || `#${it.id ?? i}`}</div>
            {it.type && <Badge variant="outline" className="shrink-0 text-[10px]">{String(it.type)}</Badge>}
          </div>
          {it.description && it.description !== it.name && (
            <p className="text-xs text-muted-foreground line-clamp-2">{it.description}</p>
          )}
          {(it.price ?? it.value ?? it.amount) !== undefined && (
            <div className="text-lg font-bold text-primary">{brl(it.price ?? it.value ?? it.amount)}</div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {it.data_mb && <Badge variant="secondary" className="text-[10px]">{it.data_mb}MB</Badge>}
            {it.minutes && <Badge variant="secondary" className="text-[10px]">{it.minutes}min</Badge>}
            {it.sms && <Badge variant="secondary" className="text-[10px]">{it.sms} SMS</Badge>}
            {it.modality && <Badge variant="outline" className="text-[10px]">{it.modality}</Badge>}
            {it.status && <Badge variant="outline" className="text-[10px]">{it.status}</Badge>}
            {kind === "plan" && it.duration_days && <Badge variant="secondary" className="text-[10px]">{it.duration_days}d</Badge>}
          </div>
          {it.id !== undefined && (
            <div className="text-[10px] text-muted-foreground pt-1 border-t">ID: <code className="text-foreground">{String(it.id)}</code></div>
          )}
        </Card>
      ))}
    </div>
  );
}
