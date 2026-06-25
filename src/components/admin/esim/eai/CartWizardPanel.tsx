import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Hash, ShoppingCart, Check, Trash2, RotateCcw, ArrowRight } from "lucide-react";
import { eaiCall, extractList, formatMsisdn } from "./eaiClient";
import { toast } from "sonner";

export function CartWizardPanel() {
  const [step, setStep] = useState(1);
  const [ddds, setDdds] = useState<string[]>([]);
  const [selectedDdd, setSelectedDdd] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [iccid, setIccid] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function reset() {
    setStep(1); setDdds([]); setSelectedDdd(""); setMsisdn("");
    setIccid(""); setCustomerId(""); setPlanId(""); setCart(null); setErrorMsg(null);
  }

  async function loadDdds() {
    setLoading(true); setErrorMsg(null);
    const r = await eaiCall<any>("/rest/service_eai/mvno_carts/available_ddds");
    setLoading(false);
    if (!r.ok) { setErrorMsg(`Erro ${r.status} ao buscar DDDs.`); toast.error("Falha"); return; }
    const list = Array.isArray(r.json) ? r.json
      : Array.isArray(r.json?.data) ? r.json.data
      : Array.isArray(r.json?.ddds) ? r.json.ddds
      : extractList(r);
    setDdds(list.map((d: any) => String(d.ddd ?? d)));
    if (list.length === 0) toast.info("Nenhum DDD disponível");
  }

  async function reserveMsisdn() {
    if (!selectedDdd) return toast.error("Selecione um DDD");
    setLoading(true); setErrorMsg(null);
    const r = await eaiCall<any>("/rest/service_eai/reserve_msisdns", {
      method: "POST",
      body: { ddd: selectedDdd, quantity: 1 },
    });
    setLoading(false);
    if (!r.ok) { setErrorMsg(`Erro ${r.status} ao reservar.`); toast.error("Falha"); return; }
    const list = Array.isArray(r.json) ? r.json : r.json?.msisdns || r.json?.data || [];
    const first = list[0];
    const num = typeof first === "string" ? first : (first?.msisdn ?? "");
    if (num) { setMsisdn(String(num)); toast.success("MSISDN reservado"); }
    else { setErrorMsg("Reserva sem MSISDN no retorno"); toast.error("Sem MSISDN"); }
  }

  async function createCart() {
    if (!iccid || !planId) return toast.error("Preencha ICCID e Plan ID");
    setLoading(true); setErrorMsg(null);
    const r = await eaiCall<any>("/rest/service_eai/mvno_carts", {
      method: "POST",
      body: {
        msisdn, iccid, mvno_plan_id: planId,
        ...(customerId ? { customer_id: customerId } : {}),
      },
    });
    setLoading(false);
    if (!r.ok) { setErrorMsg(`Erro ${r.status} ao criar cart.`); toast.error("Falha"); return; }
    const c = r.json?.data ?? r.json;
    setCart(c);
    toast.success("Cart criado");
  }

  async function deleteCart() {
    const id = cart?.id ?? cart?.cart_id;
    if (!id) return;
    if (!confirm(`Excluir cart ${id}?`)) return;
    setLoading(true); setErrorMsg(null);
    const r = await eaiCall<any>(`/rest/service_eai/mvno_carts/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!r.ok) { setErrorMsg(`Erro ${r.status} ao excluir.`); toast.error("Falha"); return; }
    toast.success("Cart removido");
    setCart(null);
  }

  return (
    <div className="space-y-4">
      <Stepper step={step} />

      {step === 1 && (
        <Card className="p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><h3 className="font-semibold">1. Escolher DDD</h3></div>
          <Button onClick={loadDdds} disabled={loading} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
            Carregar DDDs disponíveis
          </Button>
          {ddds.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {ddds.map((d) => (
                <button
                  key={d}
                  onClick={() => { setSelectedDdd(d); setStep(2); }}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-bold transition ${
                    selectedDdd === d ? "border-primary bg-primary/10 text-primary" : "border-input hover:border-primary/50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {step === 2 && (
        <Card className="p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-primary" /><h3 className="font-semibold">2. Reservar MSISDN (DDD {selectedDdd})</h3></div>

          {!msisdn ? (
            <div className="flex gap-2">
              <Button onClick={reserveMsisdn} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Reservar 1 número
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <Check className="h-4 w-4" /> Número reservado
              </div>
              <div className="text-2xl font-bold font-mono">{formatMsisdn(msisdn)}</div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(3)}>
                  Avançar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => { setMsisdn(""); }}>Reservar outro</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card className="p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /><h3 className="font-semibold">3. Criar Cart</h3></div>

          {!cart ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>MSISDN reservado</Label>
                  <Input value={formatMsisdn(msisdn)} readOnly className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>ICCID *</Label>
                  <Input value={iccid} onChange={(e) => setIccid(e.target.value)} placeholder="89550..." />
                </div>
                <div className="space-y-2">
                  <Label>Plan ID *</Label>
                  <Input value={planId} onChange={(e) => setPlanId(e.target.value)} placeholder="ID do plano (aba Catálogo)" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Customer ID (opcional)</Label>
                  <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="ID do cliente (aba Clientes EAI)" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createCart} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                  Criar Cart
                </Button>
                <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <Check className="h-4 w-4" /> Cart criado com sucesso
              </div>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <Field label="Cart ID" value={cart.id ?? cart.cart_id} mono />
                <Field label="MSISDN" value={formatMsisdn(cart.msisdn ?? msisdn)} mono />
                <Field label="ICCID" value={cart.iccid ?? iccid} mono />
                <Field label="Plan ID" value={cart.mvno_plan_id ?? planId} mono />
                {cart.status && (
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <Badge variant="outline">{cart.status}</Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="destructive" size="sm" onClick={deleteCart} disabled={loading}>
                  <Trash2 className="mr-2 h-4 w-4" />Excluir cart
                </Button>
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="mr-2 h-4 w-4" />Nova ativação
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {errorMsg && (
        <Card className="p-3 border-destructive/40 bg-destructive/5 text-sm text-destructive">{errorMsg}</Card>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium break-all ${mono ? "font-mono" : ""}`}>{value ?? "—"}</div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const items = ["DDD", "MSISDN", "Cart"];
  return (
    <div className="flex items-center gap-2">
      {items.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
              active ? "bg-primary text-primary-foreground" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>{done ? <Check className="h-3.5 w-3.5" /> : n}</div>
            <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
            {i < items.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        );
      })}
    </div>
  );
}
