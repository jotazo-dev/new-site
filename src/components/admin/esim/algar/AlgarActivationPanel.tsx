import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2, CheckCircle2, UserPlus, Smartphone } from "lucide-react";
import { algarCall } from "./algarClient";
import { toast } from "sonner";

export function AlgarActivationPanel() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    subscriber_id: "",
    product_id: "",
    iccid: "",
    terminal: "",
    ref: ""
  });
  const [result, setResult] = useState<any>(null);

  async function handleActivate() {
    if (!formData.subscriber_id || !formData.iccid || !formData.terminal) {
      return toast.error("Preencha os campos obrigatórios");
    }

    setLoading(true);
    const res = await algarCall("/v2/mobilelines", {
      method: "POST",
      body: {
        subscriber: formData.subscriber_id,
        product: formData.product_id || "PLAN_STANDARD",
        simcard: formData.iccid,
        terminal: formData.terminal,
        ref: formData.ref || `APP_${Date.now()}`
      }
    });
    setLoading(false);

    if (res.ok) {
      setResult(res.data);
      setStep(2);
      toast.success("Linha ativada com sucesso!");
    } else {
      toast.error(res.error || "Erro na ativação");
    }
  }

  return (
    <div className="space-y-4">
      {step === 1 ? (
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b pb-4">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Nova Ativação de Linha</h3>
              <p className="text-xs text-muted-foreground">Preencha os dados técnicos para habilitar o serviço.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><UserPlus className="h-3.5 w-3.5" /> ID do Assinante *</Label>
              <Input 
                placeholder="ID gerado na aba Clientes" 
                value={formData.subscriber_id}
                onChange={e => setFormData({...formData, subscriber_id: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>ID do Plano/Produto</Label>
              <Input 
                placeholder="Ex: PLAN_GOLD" 
                value={formData.product_id}
                onChange={e => setFormData({...formData, product_id: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>ICCID do Chip (SIM Card) *</Label>
              <Input 
                placeholder="8955..." 
                value={formData.iccid}
                onChange={e => setFormData({...formData, iccid: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Número da Linha (MSISDN) *</Label>
              <Input 
                placeholder="34991234567" 
                value={formData.terminal}
                onChange={e => setFormData({...formData, terminal: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Referência (Nº Pedido)</Label>
              <Input 
                placeholder="Ex: PDV_001" 
                value={formData.ref}
                onChange={e => setFormData({...formData, ref: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleActivate} 
              disabled={loading} 
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 h-10 px-8"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
              Confirmar Ativação
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center space-y-4 border-emerald-200 bg-emerald-50/30">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-emerald-900">Ativação Concluída</h3>
            <p className="text-sm text-emerald-700">A linha foi provisionada com sucesso na rede Algar.</p>
          </div>
          
          <div className="max-w-xs mx-auto text-left bg-white border rounded-lg p-4 space-y-2 text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID da Linha:</span>
              <span className="font-mono font-bold">{result?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{result?.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Terminal:</span>
              <span className="font-mono">{result?.terminal}</span>
            </div>
          </div>

          <Button variant="outline" onClick={() => { setStep(1); setFormData({ subscriber_id: "", product_id: "", iccid: "", terminal: "", ref: "" }); setResult(null); }}>
            Nova Ativação
          </Button>
        </Card>
      )}
    </div>
  );
}
