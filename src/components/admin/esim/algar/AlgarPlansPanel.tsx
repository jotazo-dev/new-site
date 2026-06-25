import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Loader2, RefreshCw, Hash } from "lucide-react";
import { algarCall } from "./algarClient";
import { toast } from "sonner";

export function AlgarPlansPanel() {
  const [loading, setLoading] = useState(false);
  const [ddd, setDdd] = useState("34");
  const [numbers, setNumbers] = useState<any[]>([]);

  async function loadAvailableNumbers() {
    if (!ddd) return toast.error("Informe o DDD");
    setLoading(true);
    const res = await algarCall(`/v2/tns/available?product=LINHA_MOVEL&area_code=${ddd}`);
    setLoading(false);
    
    if (res.ok) {
      setNumbers(res.data.items || []);
      if ((res.data.items || []).length === 0) toast.info("Nenhum número disponível para este DDD");
    } else {
      toast.error(res.error || "Erro ao buscar números");
    }
  }

  useEffect(() => { loadAvailableNumbers(); }, []);

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Inventário de Números (DID)</h3>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-2 flex-1 max-w-[120px]">
            <Label>DDD</Label>
            <Input value={ddd} onChange={e => setDdd(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="34" />
          </div>
          <Button onClick={loadAvailableNumbers} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Consultar Disponibilidade
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Mock Plans mapping typical Algar products */}
        {[
          { id: "PLAN_GOLD", name: "Algar Gold 20GB", price: 49.90, data: "20GB", voice: "Ilimitado" },
          { id: "PLAN_PLATINUM", name: "Algar Platinum 50GB", price: 89.90, data: "50GB", voice: "Ilimitado" },
          { id: "PLAN_STANDARD", name: "Algar Standard 10GB", price: 29.90, data: "10GB", voice: "300 min" }
        ].map(plan => (
          <Card key={plan.id} className="p-4 space-y-3 rounded-2xl border-2 hover:border-primary/40 transition">
            <div className="flex justify-between items-start">
              <div className="font-bold text-lg">{plan.name}</div>
              <Badge variant="secondary">Ativo</Badge>
            </div>
            <div className="text-2xl font-black text-primary">R$ {plan.price.toFixed(2)}</div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[10px]">{plan.data}</Badge>
              <Badge variant="outline" className="text-[10px]">{plan.voice}</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground pt-2 border-t">ID: <code className="text-foreground">{plan.id}</code></div>
          </Card>
        ))}
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Números Disponíveis para Reserva</h3>
          </div>
          <Badge variant="secondary">{numbers.length}</Badge>
        </div>
        
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : numbers.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground border-2 border-dashed rounded-xl">Nenhum número disponível no momento.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {numbers.map((n, i) => (
              <div key={i} className="p-2 border rounded-lg text-center bg-muted/20 hover:bg-muted/50 cursor-pointer transition">
                <div className="text-xs font-mono font-bold">{n.terminal}</div>
                <div className="text-[9px] text-muted-foreground">{n.category}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
