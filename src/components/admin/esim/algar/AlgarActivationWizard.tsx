import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { activateMobileLine } from "./algarClient";
import { Step1Subscriber, emptySubscriberDraft, type SubscriberDraft } from "./wizard/Step1Subscriber";
import { Step2LineAndSim, type LineAndSimDraft } from "./wizard/Step2LineAndSim";
import { Step3PlanConfirm } from "./wizard/Step3PlanConfirm";

const steps = [
  { id: 1, label: "Cliente" },
  { id: 2, label: "Linha & Chip" },
  { id: 3, label: "Plano & Confirmação" },
];

export function AlgarActivationWizard() {
  const [step, setStep] = useState(1);
  const [subscriber, setSubscriber] = useState<SubscriberDraft>(emptySubscriberDraft);
  const [line, setLine] = useState<LineAndSimDraft>({ tn: "", iccid: "", simType: "sim" });
  const [productSku, setProductSku] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function confirm() {
    setLoading(true);
    const res = await activateMobileLine({
      tn: line.tn,
      card: { type: line.simType, iccid: line.iccid },
      service: {
        subscriber: {
          ref: subscriber.existing?.ref || `USR_${subscriber.document}`,
          type: subscriber.type,
          document: subscriber.document.replace(/\D/g, ""),
          name: subscriber.name,
          birthdate: subscriber.birthdate || undefined,
          email: subscriber.email || undefined,
          contact_number: subscriber.contact_number || undefined,
        },
        address: {
          zipCode: subscriber.address.zipCode.replace(/\D/g, ""),
          streetName: subscriber.address.streetName,
          streetNumber: subscriber.address.streetNumber,
          complement: subscriber.address.complement || undefined,
          neighborhood: subscriber.address.neighborhood,
          city: subscriber.address.city,
          state: subscriber.address.state,
        },
        products: [productSku],
        ref: `APP_${Date.now()}`,
        description: "Ativação via painel admin",
      },
    });
    setLoading(false);
    if (res.ok) {
      setResult(res.data);
      toast.success("Linha ativada com sucesso!");
    } else {
      toast.error(res.error || "Erro na ativação");
    }
  }

  function reset() {
    setStep(1);
    setSubscriber(emptySubscriberDraft);
    setLine({ tn: "", iccid: "", simType: "sim" });
    setProductSku("");
    setResult(null);
  }

  if (result) {
    return (
      <Card className="p-8 text-center space-y-4 border-emerald-200 bg-emerald-50/30">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-emerald-900">Ativação Concluída</h3>
          <p className="text-sm text-emerald-700">
            A linha foi provisionada com sucesso na rede Algar.
          </p>
        </div>
        <div className="max-w-sm mx-auto text-left bg-white border rounded-lg p-4 space-y-2 text-sm shadow-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID:</span>
            <span className="font-mono font-bold">{result?.id || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {result?.service?.status || result?.status || "active"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Número:</span>
            <span className="font-mono">{result?.tn || line.tn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ICCID:</span>
            <span className="font-mono text-xs">{result?.simcard?.iccid || line.iccid}</span>
          </div>
        </div>
        <Button variant="outline" onClick={reset}>Nova Ativação</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center justify-between border-b pb-4">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold",
                step > s.id
                  ? "bg-emerald-600 text-white"
                  : step === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s.id ? <Check className="h-4 w-4" /> : s.id}
            </div>
            <div className="ml-2 text-sm flex-1">
              <div className={cn("font-medium", step === s.id ? "" : "text-muted-foreground")}>
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border mx-2" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Step1Subscriber
          value={subscriber}
          onChange={setSubscriber}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2LineAndSim
          value={line}
          onChange={setLine}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3PlanConfirm
          subscriber={subscriber}
          line={line}
          productSku={productSku}
          onChangeProduct={setProductSku}
          onBack={() => setStep(2)}
          onConfirm={confirm}
          loading={loading}
        />
      )}
    </div>
  );
}
