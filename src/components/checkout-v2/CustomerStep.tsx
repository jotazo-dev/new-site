import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerInput } from "@/lib/checkoutValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { maskCpfCnpj, maskPhone, maskCEP, isValidCpfOrCnpj, onlyDigits } from "@/lib/brMasks";

export function CustomerStep({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues?: Partial<CustomerInput>;
  onSubmit: (data: CustomerInput) => void;
  onBack: () => void;
}) {
  const [loadingCep, setLoadingCep] = useState(false);
  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      doc: "",
      email: "",
      phone: "",
      birthDate: "",
      address: { cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" },
      ...defaultValues,
    } as CustomerInput,
  });
  const { register, handleSubmit, setValue, control, watch, formState: { errors, isSubmitting } } = form;

  const docValue = watch("doc") || "";
  const docDigits = onlyDigits(docValue);
  const docValid = isValidCpfOrCnpj(docValue);
  const showDocFeedback = docDigits.length >= 11;

  const fetchCep = async (cep: string) => {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const j = await r.json();
      if (!j.erro) {
        setValue("address.street", j.logradouro || "");
        setValue("address.district", j.bairro || "");
        setValue("address.city", j.localidade || "");
        setValue("address.state", j.uf || "");
      }
    } finally { setLoadingCep(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome completo *" error={errors.name?.message}>
          <Input {...register("name")} placeholder="Como está no documento" />
        </Field>
        <Field
          label="CPF ou CNPJ *"
          error={errors.doc?.message}
          hint={
            showDocFeedback
              ? docValid
                ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> {docDigits.length === 11 ? "CPF" : "CNPJ"} validado</span>
                : <span className="text-destructive">{docDigits.length === 11 ? "CPF" : "CNPJ"} inválido</span>
              : null
          }
        >
          <Controller
            control={control}
            name="doc"
            render={({ field }) => (
              <Input
                {...field}
                value={maskCpfCnpj(field.value || "")}
                onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                aria-invalid={showDocFeedback && !docValid}
              />
            )}
          />
        </Field>
        <Field label="E-mail *" error={errors.email?.message}>
          <Input type="email" {...register("email")} placeholder="seu@email.com" />
        </Field>
        <Field label="Telefone (WhatsApp) *" error={errors.phone?.message}>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                {...field}
                value={maskPhone(field.value || "")}
                onChange={(e) => field.onChange(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                inputMode="tel"
              />
            )}
          />
        </Field>
        <Field label="Data de nascimento *" error={errors.birthDate?.message}>
          <Input type="date" {...register("birthDate")} max={new Date().toISOString().slice(0, 10)} />
        </Field>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <h4 className="mb-3 text-sm font-semibold">Endereço de cobrança</h4>
        <div className="grid gap-4 md:grid-cols-6">
          <Field className="md:col-span-2" label="CEP *" error={errors.address?.cep?.message}>
            <div className="relative">
              <Controller
                control={control}
                name="address.cep"
                render={({ field }) => (
                  <Input
                    {...field}
                    value={maskCEP(field.value || "")}
                    onChange={(e) => field.onChange(maskCEP(e.target.value))}
                    onBlur={(e) => fetchCep(e.target.value)}
                    placeholder="00000-000"
                    inputMode="numeric"
                  />
                )}
              />
              {loadingCep && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </Field>
          <Field className="md:col-span-3" label="Rua *" error={errors.address?.street?.message}>
            <Input {...register("address.street")} />
          </Field>
          <Field className="md:col-span-1" label="Nº *" error={errors.address?.number?.message}>
            <Input {...register("address.number")} />
          </Field>
          <Field className="md:col-span-2" label="Complemento" error={errors.address?.complement?.message as string}>
            <Input {...register("address.complement")} />
          </Field>
          <Field className="md:col-span-2" label="Bairro *" error={errors.address?.district?.message}>
            <Input {...register("address.district")} />
          </Field>
          <Field className="md:col-span-1" label="Cidade *" error={errors.address?.city?.message}>
            <Input {...register("address.city")} />
          </Field>
          <Field className="md:col-span-1" label="UF *" error={errors.address?.state?.message}>
            <Input {...register("address.state")} maxLength={2} />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>Voltar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ir para pagamento"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label, error, hint, children, className,
}: { label: string; error?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-foreground">{label}</Label>
      {children}
      {error
        ? <p className="mt-1 text-xs text-destructive">{error}</p>
        : hint ? <p className="mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
