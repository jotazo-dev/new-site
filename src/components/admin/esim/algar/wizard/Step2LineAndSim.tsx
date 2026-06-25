import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Phone, CreditCard } from "lucide-react";
import { listAvailableTns, listAvailableSimcards, type AlgarTn, type AlgarSim, formatMsisdn } from "../algarClient";
import { cn } from "@/lib/utils";

export type LineAndSimDraft = {
  tn: string;
  iccid: string;
  simType: "sim" | "esim";
};

export function Step2LineAndSim({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: LineAndSimDraft;
  onChange: (v: LineAndSimDraft) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [tns, setTns] = useState<AlgarTn[]>([]);
  const [sims, setSims] = useState<AlgarSim[]>([]);
  const [loading, setLoading] = useState(false);
  const [tnFilter, setTnFilter] = useState("");
  const [simFilter, setSimFilter] = useState("");

  async function load() {
    setLoading(true);
    // Legacy wizard: TNs require product+locale; left empty here.
    const [t, s] = await Promise.all([listAvailableTns("", ""), listAvailableSimcards()]);
    setTns(t);
    setSims(s);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const filteredTns = tns.filter((t) => t.tn?.includes(tnFilter.replace(/\D/g, "")));
  const filteredSims = sims.filter((s) => (s.iccid || "").includes(simFilter.replace(/\D/g, "")));

  const canContinue = value.tn && value.iccid;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar estoque
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">Número (TN) *</h4>
          </div>
          <Input
            placeholder="Filtrar por dígitos..."
            value={tnFilter}
            onChange={(e) => setTnFilter(e.target.value)}
          />
          <div className="max-h-64 overflow-auto border rounded-md divide-y">
            {filteredTns.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {loading ? "Carregando..." : "Nenhum número disponível"}
              </div>
            )}
            {filteredTns.map((t) => (
              <button
                key={t.tn}
                type="button"
                onClick={() => onChange({ ...value, tn: t.tn })}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between",
                  value.tn === t.tn && "bg-emerald-50 ring-1 ring-emerald-500"
                )}
              >
                <span className="font-mono">{formatMsisdn(t.tn)}</span>
                {t.locale?.name && (
                  <Badge variant="outline" className="text-xs">
                    {t.locale.name}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">SIM / eSIM (ICCID) *</h4>
          </div>
          <Input
            placeholder="Filtrar por ICCID..."
            value={simFilter}
            onChange={(e) => setSimFilter(e.target.value)}
          />
          <div className="max-h-64 overflow-auto border rounded-md divide-y">
            {filteredSims.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {loading ? "Carregando..." : "Nenhum chip disponível"}
              </div>
            )}
            {filteredSims.map((s) => (
              <button
                key={s.iccid}
                type="button"
                onClick={() =>
                  onChange({ ...value, iccid: s.iccid, simType: (s.type as any) || "sim" })
                }
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between",
                  value.iccid === s.iccid && "bg-emerald-50 ring-1 ring-emerald-500"
                )}
              >
                <span className="font-mono">{s.iccid}</span>
                <Badge variant="outline" className="text-xs uppercase">
                  {s.type || "sim"}
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext} disabled={!canContinue}>Continuar</Button>
      </div>
    </div>
  );
}
