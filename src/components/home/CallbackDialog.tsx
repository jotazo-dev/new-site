import { useState } from "react";
import { useMetaEvents } from "@/hooks/useMetaEvents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const SETORES = [
  "Comercial",
  "Financeiro",
  "Suporte Técnico",
  "Cancelamento",
  "Ouvidoria",
];

const HORARIOS = [
  "08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallbackDialog({ open, onOpenChange }: Props) {
  const { trackEvent } = useMetaEvents();
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState<"pf" | "pj">("pf");

  // Step 1
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [estado, setEstado] = useState("");
  const [setor, setSetor] = useState("");
  const [cidade, setCidade] = useState("");

  // Step 2
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [horario, setHorario] = useState("");
  const [problema, setProblema] = useState("");
  const [aceite, setAceite] = useState(false);

  const canProceed = nome.trim() && telefone.trim() && setor;
  const canSubmit = date && horario && aceite;

  function handleSubmit() {
    trackEvent("Lead", { content_name: setor, content_category: "callback" });
    toast.success("Solicitação enviada! Entraremos em contato.", {
      description: `${format(date!, "dd/MM/yyyy", { locale: ptBR })} às ${horario}`,
    });
    setStep(1);
    setNome("");
    setTelefone("");
    setEstado("");
    setSetor("");
    setCidade("");
    setDate(undefined);
    setHorario("");
    setProblema("");
    setAceite(false);
    onOpenChange(false);
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Ligamos para você
            </DialogTitle>
            <DialogDescription>
              Preencha as informações necessárias para entrarmos em contato com você.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="mt-6 flex items-center justify-center gap-0">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${step >= 1 ? "bg-accent text-accent-foreground" : "border-2 border-muted-foreground/30 text-muted-foreground"}`}>
                {step > 1 ? <Check className="h-5 w-5" /> : "01"}
              </div>
              <span className={`mt-1 text-xs font-semibold ${step >= 1 ? "text-accent" : "text-muted-foreground"}`}>
                Seus dados
              </span>
            </div>
            <div className={`mx-2 h-[3px] w-16 rounded-full ${step >= 2 ? "bg-accent" : "bg-muted"}`} />
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${step >= 2 ? "bg-accent text-accent-foreground" : "border-2 border-muted-foreground/30 text-muted-foreground"}`}>
                02
              </div>
              <span className={`mt-1 text-xs font-semibold ${step >= 2 ? "text-accent" : "text-muted-foreground"}`}>
                Data e horário
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setTipo("pf")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tipo === "pf" ? "bg-accent text-accent-foreground" : "bg-background text-accent hover:bg-muted"}`}
                >
                  Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("pj")}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tipo === "pj" ? "bg-accent text-accent-foreground" : "bg-background text-accent hover:bg-muted"}`}
                >
                  Pessoa Jurídica
                </button>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">Dados pessoais</p>
                <div className="space-y-3">
                  <Input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} />
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={setor} onValueChange={setSetor}>
                      <SelectTrigger><SelectValue placeholder="Setor de atendimento" /></SelectTrigger>
                      <SelectContent>
                        {SETORES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={100} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                *Precisamos que nos informe o setor de atendimento para prosseguir
              </p>

              <Button className="w-full" size="lg" disabled={!canProceed} onClick={() => setStep(2)}>
                Prosseguir
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm font-semibold text-foreground">Agende um horário</p>

              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      locale={ptBR}
                      disabled={(d) => d < new Date() || d.getDay() === 0 || d.getDay() === 6}
                    />
                  </PopoverContent>
                </Popover>

                <Select value={horario} onValueChange={setHorario}>
                  <SelectTrigger><SelectValue placeholder="Horário" /></SelectTrigger>
                  <SelectContent>
                    {HORARIOS.map((h) => (<SelectItem key={h} value={h}>{h}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Descreva aqui o seu problema"
                value={problema}
                onChange={(e) => setProblema(e.target.value)}
                maxLength={500}
                className="min-h-[100px] resize-none"
              />

              <div className="flex items-start gap-2">
                <Checkbox
                  id="aceite"
                  checked={aceite}
                  onCheckedChange={(v) => setAceite(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="aceite" className="text-xs leading-relaxed text-muted-foreground">
                  Eu concordo em receber comunicações. Ao informar meu dados, eu concordo com a{" "}
                  <a href="#" className="font-semibold text-accent underline">Política de Privacidade</a>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button size="lg" disabled={!canSubmit} onClick={handleSubmit}>
                  Agendar ligação
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
