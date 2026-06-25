import * as React from "react";
import { z } from "zod";
import { ArrowLeft, Check, Lock, MapPin, Phone, Search, Trash2, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  uf: string;
  number: string;
  complement: string;
};

type CepStatus = "idle" | "loading" | "available" | "unavailable";

interface CustomerDetailsStepProps {
  onBack: () => void;
  onSubmit: (details: CustomerDetails) => void;
  className?: string;
  initialCep?: string;
}

const STORAGE_KEY = "jotazo_customer_details_v1";
const CEP_STORAGE_KEY = "jotazo_cep_v1";

// Brazilian phone: 10 digits (landline) or 11 digits (mobile, starts with 9 after DDD)
const phoneRegex = /^\d{10,11}$/;

const detailsSchema = z.object({
  firstName: z.string().trim().min(2, "Informe seu nome").max(60),
  lastName: z.string().trim().min(2, "Informe seu sobrenome").max(80),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => phoneRegex.test(v), "Informe um telefone válido com DDD (ex: 11 99999-9999)"),
  number: z.string().trim().min(1, "Informe o número").max(10),
  complement: z.string().trim().max(60).optional().or(z.literal("")),
});

export function CustomerDetailsStep({ onBack, onSubmit, className, initialCep }: CustomerDetailsStepProps) {
  const { toast } = useToast();
  const [cep, setCep] = React.useState(initialCep || "");
  const [cepStatus, setCepStatus] = React.useState<CepStatus>(initialCep ? "loading" : "idle");
  const [street, setStreet] = React.useState("");
  const [neighborhood, setNeighborhood] = React.useState("");
  const [city, setCity] = React.useState("");
  const [uf, setUf] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [complement, setComplement] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Load saved + auto-check initialCep
  React.useEffect(() => {
    // If initialCep provided, validate it immediately
    if (initialCep && initialCep.replace(/\D/g, "").length === 8) {
      checkCep(initialCep);
      return;
    }
    
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<CustomerDetails>;
        setFirstName(p.firstName || "");
        setLastName(p.lastName || "");
        setEmail(p.email || "");
        setPhone(p.phone || "");
        setNumber(p.number || "");
        setComplement(p.complement || "");
      }
      const cepRaw = localStorage.getItem(CEP_STORAGE_KEY);
      if (cepRaw) {
        const c = JSON.parse(cepRaw) as { cep?: string; address?: string; status?: CepStatus };
        if (c.cep) {
          setCep(c.cep);
          if (c.status === "available" || c.status === "unavailable") {
            checkCep(c.cep);
          }
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-persist personal data as user types (debounced)
  const hydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ firstName, lastName, email, phone, number, complement }),
        );
      } catch {
        // ignore
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [firstName, lastName, email, phone, number, complement]);

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  const checkCep = React.useCallback(async (rawCep?: string) => {
    const source = rawCep ?? cep;
    const digits = source.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepStatus("loading");

    let foundStreet = "";
    let foundBairro = "";
    let foundCity = "";
    let foundUf = "";
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: ctrl.signal });
      clearTimeout(t);
      const data = await res.json();
      if (!data.erro && data.localidade) {
        foundStreet = data.logradouro || "";
        foundBairro = data.bairro || "";
        foundCity = data.localidade || "";
        foundUf = data.uf || "";
      }
    } catch {
      // continue
    }

    let nextStatus: CepStatus = "available";
    try {
      const { data: rows } = await supabase
        .from("coverage_ceps")
        .select("id")
        .eq("active", true)
        .lte("cep_start", digits)
        .gte("cep_end", digits)
        .limit(1);
      nextStatus = rows && rows.length > 0 ? "available" : "unavailable";
    } catch {
      nextStatus = "available";
    }

    setStreet(foundStreet);
    setNeighborhood(foundBairro);
    setCity(foundCity);
    setUf(foundUf);
    setCepStatus(nextStatus);

    try {
      const address = [foundStreet, foundBairro, foundCity && `${foundCity} - ${foundUf}`]
        .filter(Boolean)
        .join(", ");
      localStorage.setItem(
        CEP_STORAGE_KEY,
        JSON.stringify({ cep: source, address, status: nextStatus }),
      );
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep]);

  const cepApproved = cepStatus === "available";
  const showFields = cepApproved;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cepApproved) {
      toast({ title: "Verifique seu CEP", description: "Confirme a disponibilidade antes de prosseguir.", variant: "destructive" });
      return;
    }
    const result = detailsSchema.safeParse({ firstName, lastName, email, phone, number, complement });
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    const details: CustomerDetails = {
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      email: result.data.email,
      phone: result.data.phone,
      cep,
      street,
      neighborhood,
      city,
      uf,
      number: result.data.number,
      complement: result.data.complement || "",
    };
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          firstName: details.firstName,
          lastName: details.lastName,
          email: details.email,
          phone: details.phone,
          number: details.number,
          complement: details.complement,
        }),
      );
    } catch {
      // ignore
    }
    onSubmit(details);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)} noValidate>
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao pedido
        </Button>
      </div>

      {/* CEP */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <MapPin className="h-5 w-5 text-accent" />
              Onde será a instalação?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe seu CEP para confirmar a cobertura.
            </p>
          </div>
          <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
            <MapPin className="ml-1 h-4 w-4 shrink-0 text-accent" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => {
                setCep(formatCep(e.target.value));
                if (cepStatus !== "idle") setCepStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), checkCep())}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              maxLength={9}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => checkCep()}
              disabled={cep.replace(/\D/g, "").length !== 8 || cepStatus === "loading"}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {cepStatus === "loading" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
              ) : (
                <><Search className="h-4 w-4" /> Verificar</>
              )}
            </Button>
          </div>
        </div>

        {cepStatus === "available" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <strong>Disponível na sua região!</strong>
              {(street || city) && (
                <div className="mt-0.5 text-xs opacity-80">
                  {[street, neighborhood, city && `${city} - ${uf}`].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>
        )}
        {cepStatus === "unavailable" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            <strong>Ainda não atendemos sua região.</strong>
          </div>
        )}
      </section>

      {/* Personal data — appears after CEP validated */}
      {showFields ? (
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Seus dados</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={60}
                autoComplete="given-name"
              />
              {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={80}
                autoComplete="family-name"
              />
              {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Telefone (WhatsApp)
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={16}
                autoComplete="tel-national"
              />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="md:col-span-2">
              <Label>Endereço</Label>
              <Input value={[street, neighborhood, city && `${city} - ${uf}`].filter(Boolean).join(", ")} disabled />
            </div>

            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                maxLength={10}
                inputMode="numeric"
              />
              {errors.number && <p className="mt-1 text-xs text-destructive">{errors.number}</p>}
            </div>
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                maxLength={60}
                placeholder="Apto, bloco, ref..."
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="h-12 w-full text-base font-bold">
            Finalizar pedido
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline"
              >
                <Trash2 className="h-3 w-3" />
                Limpar dados salvos
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar dados salvos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso vai remover seu CEP, nome, e-mail e endereço salvos neste navegador.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    try {
                      localStorage.removeItem(STORAGE_KEY);
                      localStorage.removeItem(CEP_STORAGE_KEY);
                    } catch {
                      // ignore
                    }
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setPhone("");
                    setNumber("");
                    setComplement("");
                    setCep("");
                    setStreet("");
                    setNeighborhood("");
                    setCity("");
                    setUf("");
                    setCepStatus("idle");
                    setErrors({});
                    toast({ title: "Dados limpos", description: "As informações salvas foram removidas." });
                  }}
                >
                  Limpar dados
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 text-primary" />
          Informe e valide seu CEP para preencher seus dados.
        </div>
      )}
    </form>
  );
}
