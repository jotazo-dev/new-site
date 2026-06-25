import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2, Shuffle, AlertTriangle, CheckCircle2 } from "lucide-react";

type ProviderName = "cielo" | "mercadopago" | "asaas";
type Method = "credit" | "debit" | "pix" | "boleto";

type Routing = {
  method: Method;
  primary_provider: ProviderName;
  fallback_order: ProviderName[];
  enabled: boolean;
};

const METHOD_LABEL: Record<Method, string> = {
  credit: "Cartão de crédito",
  debit: "Cartão de débito",
  pix: "Pix",
  boleto: "Boleto",
};

const PROVIDER_LABEL: Record<ProviderName, string> = {
  cielo: "Cielo",
  mercadopago: "Mercado Pago",
  asaas: "Asaas",
};

const PROVIDER_COLOR: Record<ProviderName, string> = {
  cielo: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  mercadopago: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  asaas: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
};

// Quais providers suportam cada método (mantém UI consistente)
const SUPPORTS: Record<Method, ProviderName[]> = {
  credit: ["cielo", "mercadopago", "asaas"],
  debit: ["cielo"],
  pix: ["cielo", "mercadopago", "asaas"],
  boleto: ["cielo", "mercadopago", "asaas"],
};

export function PaymentRoutingTab() {
  const qc = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["payment-routing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_routing" as any)
        .select("*");
      if (error) throw error;
      const order: Method[] = ["credit", "debit", "pix", "boleto"];
      return order
        .map((m) => (data as any[]).find((r) => r.method === m))
        .filter(Boolean) as Routing[];
    },
  });

  // Verifica disponibilidade real das credenciais (sandbox/prod) por provider
  const { data: availability = {} as Record<ProviderName, { ok: boolean; env?: string; reason?: string }> } = useQuery({
    queryKey: ["payment-routing-availability"],
    queryFn: async () => {
      const out: Record<ProviderName, { ok: boolean; env?: string; reason?: string }> = {
        cielo: { ok: false }, mercadopago: { ok: false }, asaas: { ok: false },
      };
      const [cielo, mp, asaas] = await Promise.all([
        supabase.from("cielo_config").select("environment,merchant_id_sandbox,merchant_id_production,merchant_key_sandbox,merchant_key_production").maybeSingle(),
        supabase.from("mp_config").select("environment,access_token_sandbox,access_token_production").maybeSingle(),
        supabase.from("asaas_config").select("environment,sandbox_api_key,production_api_key,active").maybeSingle(),
      ]);
      if (cielo.data) {
        const isProd = cielo.data.environment === "production";
        const id = isProd ? cielo.data.merchant_id_production : cielo.data.merchant_id_sandbox;
        const key = isProd ? cielo.data.merchant_key_production : cielo.data.merchant_key_sandbox;
        out.cielo = { ok: !!id && !!key, env: cielo.data.environment, reason: !id || !key ? "Credenciais ausentes" : undefined };
      } else out.cielo.reason = "Não configurado";
      if (mp.data) {
        const isProd = mp.data.environment === "production";
        const t = isProd ? mp.data.access_token_production : mp.data.access_token_sandbox;
        out.mercadopago = { ok: !!t, env: mp.data.environment, reason: !t ? "Access token ausente" : undefined };
      } else out.mercadopago.reason = "Não configurado";
      if (asaas.data) {
        const isProd = asaas.data.environment === "production";
        const k = isProd ? asaas.data.production_api_key : asaas.data.sandbox_api_key;
        out.asaas = { ok: !!k && asaas.data.active !== false, env: asaas.data.environment, reason: !k ? "API key ausente" : asaas.data.active === false ? "Inativo" : undefined };
      } else out.asaas.reason = "Não configurado";
      return out;
    },
  });

  const save = useMutation({
    mutationFn: async (r: Routing) => {
      const { error } = await supabase
        .from("payment_routing" as any)
        .update({
          primary_provider: r.primary_provider,
          fallback_order: r.fallback_order,
          enabled: r.enabled,
        })
        .eq("method", r.method);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-routing"] });
      toast.success("Roteamento atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Carregando roteamento...</div>;

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
              <Shuffle className="h-4 w-4 text-white" />
            </div>
            Roteamento de Pagamento (Provider Gateway)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Defina o gateway <strong>primário</strong> e a ordem de <strong>contingência</strong> por método de pagamento.
            Quando o primário falhar, o checkout tenta automaticamente o próximo da fila.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            <div className="flex flex-wrap gap-2">
              {(["cielo", "mercadopago", "asaas"] as ProviderName[]).map((p) => {
                const a = availability[p];
                return (
                  <div key={p} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${a?.ok ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                    {a?.ok ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-amber-600" />}
                    <span className="font-medium">{PROVIDER_LABEL[p]}</span>
                    {a?.env && <span className="text-[10px] text-muted-foreground uppercase">({a.env})</span>}
                    {a?.reason && <span className="text-[10px] text-amber-700">{a.reason}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {rules.map((r) => (
        <RoutingRow key={r.method} rule={r} availability={availability} onSave={(updated) => save.mutate(updated)} />
      ))}
    </div>
  );
}

function RoutingRow({
  rule, availability, onSave,
}: {
  rule: Routing;
  availability: Record<ProviderName, { ok: boolean; reason?: string }>;
  onSave: (r: Routing) => void;
}) {
  const [local, setLocal] = React.useState<Routing>(rule);
  React.useEffect(() => setLocal(rule), [rule]);

  const supported = SUPPORTS[rule.method];
  const availableFallbacks = supported.filter((p) => p !== local.primary_provider && !local.fallback_order.includes(p));

  function move(idx: number, dir: -1 | 1) {
    const next = [...local.fallback_order];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setLocal({ ...local, fallback_order: next });
  }

  function remove(idx: number) {
    setLocal({ ...local, fallback_order: local.fallback_order.filter((_, i) => i !== idx) });
  }

  function addFallback(p: ProviderName) {
    if (local.fallback_order.includes(p) || p === local.primary_provider) return;
    setLocal({ ...local, fallback_order: [...local.fallback_order, p] });
  }

  function changePrimary(p: ProviderName) {
    // Remove from fallback if it was there
    setLocal({ ...local, primary_provider: p, fallback_order: local.fallback_order.filter((x) => x !== p) });
  }

  const dirty = JSON.stringify(local) !== JSON.stringify(rule);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-sm flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {METHOD_LABEL[rule.method]}
            {!local.enabled && <Badge variant="secondary" className="text-[10px]">Desativado</Badge>}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ativo</span>
          <Switch checked={local.enabled} onCheckedChange={(v) => setLocal({ ...local, enabled: v })} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primário */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Primário</label>
          <div className="mt-1 flex items-center gap-2">
            <Select value={local.primary_provider} onValueChange={(v) => changePrimary(v as ProviderName)}>
              <SelectTrigger className="max-w-[260px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {supported.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PROVIDER_LABEL[p]} {availability[p]?.ok ? "" : "⚠️"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className={`text-[11px] rounded-full border px-2 py-0.5 ${PROVIDER_COLOR[local.primary_provider]}`}>1º</span>
            {!availability[local.primary_provider]?.ok && (
              <span className="text-[11px] text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> sem credencial — pedido cairá no fallback
              </span>
            )}
          </div>
        </div>

        {/* Fallbacks */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Contingência (ordem importa)
          </label>
          {local.fallback_order.length === 0 ? (
            <p className="text-xs text-muted-foreground mt-1">Sem fallback. Se o primário falhar, o pedido é marcado como falho.</p>
          ) : (
            <ul className="mt-1 space-y-1.5">
              {local.fallback_order.map((p, idx) => (
                <li key={p} className="flex items-center gap-2 rounded-lg border bg-card p-2">
                  <span className={`text-[11px] rounded-full border px-2 py-0.5 ${PROVIDER_COLOR[p]}`}>{idx + 2}º</span>
                  <span className="text-sm font-medium flex-1">{PROVIDER_LABEL[p]}</span>
                  {!availability[p]?.ok && <span className="text-[11px] text-amber-700">⚠️ {availability[p]?.reason}</span>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => move(idx, -1)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === local.fallback_order.length - 1} onClick={() => move(idx, 1)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {availableFallbacks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {availableFallbacks.map((p) => (
                <Button key={p} variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => addFallback(p)}>
                  <Plus className="h-3 w-3" /> {PROVIDER_LABEL[p]}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button size="sm" disabled={!dirty} onClick={() => onSave(local)}>
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
