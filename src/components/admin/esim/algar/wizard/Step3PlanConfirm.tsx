import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, CheckCircle2, ShoppingCart } from "lucide-react";
import { listProducts, formatMsisdn, type AlgarProduct } from "../algarClient";
import { cn } from "@/lib/utils";
import type { SubscriberDraft } from "./Step1Subscriber";
import type { LineAndSimDraft } from "./Step2LineAndSim";

export function Step3PlanConfirm({
  subscriber,
  line,
  productSku,
  onChangeProduct,
  onBack,
  onConfirm,
  loading,
}: {
  subscriber: SubscriberDraft;
  line: LineAndSimDraft;
  productSku: string;
  onChangeProduct: (sku: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const [products, setProducts] = useState<AlgarProduct[]>([]);
  const [loadingProd, setLoadingProd] = useState(false);

  useEffect(() => {
    setLoadingProd(true);
    listProducts().then((p) => {
      setProducts(p);
      setLoadingProd(false);
    });
  }, []);

  const selected = products.find((p) => p.sku === productSku);

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">Escolha o plano *</h4>
        </div>
        {loadingProd ? (
          <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {products.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center col-span-2">
                Nenhum produto disponível
              </div>
            )}
            {products.map((p) => (
              <button
                key={p.sku}
                type="button"
                onClick={() => onChangeProduct(p.sku)}
                className={cn(
                  "text-left p-3 border rounded-lg hover:bg-accent transition",
                  productSku === p.sku && "ring-2 ring-emerald-500 bg-emerald-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{p.name}</div>
                  {p.price != null && (
                    <Badge variant="outline">R$ {p.price.toFixed(2)}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-1">{p.sku}</div>
                {p.description && (
                  <div className="text-xs text-muted-foreground mt-1">{p.description}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-3 bg-slate-50/50">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Resumo da ativação
        </h4>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Cliente</div>
            <div className="font-medium">{subscriber.name}</div>
            <div className="font-mono text-xs">{subscriber.document}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Endereço</div>
            <div className="text-xs">
              {subscriber.address.streetName}, {subscriber.address.streetNumber} —{" "}
              {subscriber.address.city}/{subscriber.address.state}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Número</div>
            <div className="font-mono font-semibold">{formatMsisdn(line.tn)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Chip ({line.simType?.toUpperCase()})</div>
            <div className="font-mono">{line.iccid}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground">Plano</div>
            <div className="font-medium">
              {selected ? `${selected.name} (${selected.sku})` : "—"}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={loading}>Voltar</Button>
        <Button
          onClick={onConfirm}
          disabled={!productSku || loading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
          Ativar Linha
        </Button>
      </div>
    </div>
  );
}
