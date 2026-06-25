import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lineSchema, type LineInput, type CustomerInput } from "@/lib/checkoutValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, CreditCard, Truck, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

const OPERATORS = [
  { id: "vivo", label: "Vivo" },
  { id: "claro", label: "Claro" },
  { id: "tim", label: "TIM" },
  { id: "oi", label: "Oi" },
  { id: "outra", label: "Outra" },
];

export function LineStep({
  defaultValues,
  customer,
  onBack,
  onSubmit,
}: {
  defaultValues?: Partial<LineInput>;
  customer?: CustomerInput | null;
  onBack: () => void;
  onSubmit: (data: LineInput) => void;
}) {
  const form = useForm<LineInput>({
    resolver: zodResolver(lineSchema),
    defaultValues: {
      sim_kind: "esim",
      birthdate: "",
      desired_msisdn_prefix: customer?.phone ? (customer.phone.replace(/\D/g, "").slice(0, 2)) : "",
      portability_enabled: false,
      shipping_same_as_billing: true,
      ...defaultValues,
    } as LineInput,
  });
  const { register, watch, setValue, handleSubmit, formState: { errors } } = form;
  const simKind = watch("sim_kind");
  const portability = watch("portability_enabled");
  const sameAddr = watch("shipping_same_as_billing");

  const submit = handleSubmit((data) => {
    if (data.portability_enabled && data.portability) {
      data.portability.enabled = true as const;
    } else {
      data.portability = undefined;
    }
    if (data.sim_kind !== "physical") data.shipping_address = undefined;
    onSubmit(data);
  });

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Estamos vendo um plano de internet móvel no seu pedido. Precisamos saber como você quer receber a linha.
      </p>

      {/* SIM kind */}
      <div className="grid gap-3 md:grid-cols-2">
        <RadioCard
          icon={<Smartphone className="h-5 w-5" />}
          title="eSIM"
          description="Ativação instantânea por QR Code. Funciona em iPhone XS+, Galaxy S20+, Pixel 3+ e outros aparelhos compatíveis."
          selected={simKind === "esim"}
          onSelect={() => setValue("sim_kind", "esim", { shouldValidate: true })}
        />
        <RadioCard
          icon={<CreditCard className="h-5 w-5" />}
          title="Chip físico"
          description="Enviamos o chip pelo correio para o endereço informado. Prazo médio de 3 a 7 dias úteis."
          selected={simKind === "physical"}
          onSelect={() => setValue("sim_kind", "physical", { shouldValidate: true })}
        />
      </div>

      {/* DDD desejado */}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="DDD desejado (opcional)" error={errors.desired_msisdn_prefix?.message as string}>
          <Input
            {...register("desired_msisdn_prefix")}
            placeholder="11"
            maxLength={2}
            inputMode="numeric"
          />
        </Field>
      </div>

      {/* Portability */}
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <input
            id="port-toggle"
            type="checkbox"
            className="mt-1 h-4 w-4 accent-primary"
            {...register("portability_enabled")}
          />
          <div className="flex-1">
            <label htmlFor="port-toggle" className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <Repeat className="h-4 w-4 text-primary" /> Quero trazer meu número de outra operadora
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              A portabilidade leva até 3 dias úteis e seu número atual continua funcionando até a transferência.
            </p>
          </div>
        </div>
        {portability && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Número atual com DDD *" error={(errors.portability as any)?.current_msisdn?.message}>
              <Input {...register("portability.current_msisdn")} placeholder="(11) 91234-5678" />
            </Field>
            <Field label="Operadora atual *" error={(errors.portability as any)?.current_operator?.message}>
              <select
                {...register("portability.current_operator")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione</option>
                {OPERATORS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="CPF do titular atual" error={(errors.portability as any)?.current_doc?.message}>
              <Input {...register("portability.current_doc")} placeholder="Mesmo da linha atual" />
            </Field>
          </div>
        )}
      </div>

      {/* Shipping (only physical) */}
      {simKind === "physical" && (
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Entrega do chip</h4>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              {...register("shipping_same_as_billing")}
            />
            <span>Usar o mesmo endereço de cobrança</span>
          </label>
          {!sameAddr && (
            <div className="mt-4 grid gap-4 md:grid-cols-6">
              <Field className="md:col-span-2" label="CEP *" error={(errors.shipping_address as any)?.cep?.message}>
                <Input {...register("shipping_address.cep")} placeholder="00000-000" />
              </Field>
              <Field className="md:col-span-3" label="Rua *" error={(errors.shipping_address as any)?.street?.message}>
                <Input {...register("shipping_address.street")} />
              </Field>
              <Field className="md:col-span-1" label="Nº *" error={(errors.shipping_address as any)?.number?.message}>
                <Input {...register("shipping_address.number")} />
              </Field>
              <Field className="md:col-span-2" label="Complemento" error={(errors.shipping_address as any)?.complement?.message}>
                <Input {...register("shipping_address.complement")} />
              </Field>
              <Field className="md:col-span-2" label="Bairro *" error={(errors.shipping_address as any)?.district?.message}>
                <Input {...register("shipping_address.district")} />
              </Field>
              <Field className="md:col-span-1" label="Cidade *" error={(errors.shipping_address as any)?.city?.message}>
                <Input {...register("shipping_address.city")} />
              </Field>
              <Field className="md:col-span-1" label="UF *" error={(errors.shipping_address as any)?.state?.message}>
                <Input {...register("shipping_address.state")} maxLength={2} />
              </Field>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>Voltar</Button>
        <Button type="submit">Ir para pagamento</Button>
      </div>
    </form>
  );
}

function RadioCard({
  icon, title, description, selected, onSelect,
}: { icon: React.ReactNode; title: string; description: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-2xl border-2 p-4 text-left transition-all",
        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", selected ? "bg-primary text-primary-foreground" : "bg-muted")}>
          {icon}
        </span>
        <span className="text-sm font-bold">{title}</span>
        {selected && <span className="ml-auto text-xs font-semibold text-primary">Selecionado</span>}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-foreground">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
