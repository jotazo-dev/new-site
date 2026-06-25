import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Search, Loader2, Activity, ShieldCheck, Smartphone } from "lucide-react";
import { algarCall, formatMsisdn } from "./algarClient";
import { toast } from "sonner";

export function AlgarLinesPanel() {
  const [loading, setLoading] = useState(false);
  const [terminal, setTerminal] = useState("");
  const [line, setLine] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);

  async function handleSearch() {
    if (!terminal) return toast.error("Informe o número da linha");
    setLoading(true);
    setLine(null);
    setUsage(null);

    // Busca linha móvel pelo terminal (documentação: mobilelinegetbyterminal)
    const res = await algarCall(`/v2/mobilelines/tn/${terminal}`);

    if (res.ok && res.data) {
      const ml: any = (res.data as any)?.data ?? res.data;
      const service = ml.service || {};
      const subscriber = service.subscriber || {};
      setLine({
        id: ml.id,
        name: subscriber.name || "—",
        status: service.status || ml.status || "—",
      });
      // Consumo da linha
      if (ml.id) {
        const usageRes = await algarCall(`/v2/mobilelines/${ml.id}/usage`);
        if (usageRes.ok) setUsage(usageRes.data);
      }
    } else {
      toast.error(res.error || "Linha não encontrada");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-3">
        <Label>Número da Linha (MSISDN)</Label>
        <div className="flex gap-2">
          <Input
            value={terminal}
            onChange={e => setTerminal(e.target.value.replace(/\D/g, ""))}
            placeholder="34991234567"
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Consultar
          </Button>
        </div>
      </Card>

      {line && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Informações da Linha</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">MSISDN:</span>
                <span className="font-mono font-bold">{formatMsisdn(terminal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Assinante:</span>
                <span className="font-medium">{line.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status na Rede:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {line.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ID Algar:</span>
                <span className="font-mono text-xs">{line.id}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Consumo Atual</h3>
            </div>
            {usage ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Dados Moveis</span>
                    <span className="font-bold">{usage.data_usage} / {usage.limit}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[12%]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="text-[10px] uppercase text-muted-foreground">Voz</div>
                    <div className="text-sm font-bold">{usage.voice_usage}</div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="text-[10px] uppercase text-muted-foreground">SMS</div>
                    <div className="text-sm font-bold">{usage.sms_usage}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">Buscando dados de consumo...</div>
            )}
          </Card>
          
          <Card className="p-6 md:col-span-2 space-y-4">
             <div className="flex items-center gap-2 border-b pb-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Serviços Habilitados</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Roaming Nacional</Badge>
              <Badge variant="secondary">4G/5G Habilitado</Badge>
              <Badge variant="secondary">VoLTE</Badge>
              <Badge variant="secondary">SVA Premium</Badge>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
