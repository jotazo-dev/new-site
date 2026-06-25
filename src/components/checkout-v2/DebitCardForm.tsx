import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { creditCardSchema, type CreditCardInput, detectCardBrand } from "@/lib/checkoutValidation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { AnimatedCreditCard } from "./AnimatedCreditCard";

export function DebitCardForm({
  loading,
  onSubmit,
}: {
  loading?: boolean;
  onSubmit: (card: any) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreditCardInput>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: { number: "", holder: "", expiration: "", cvv: "", installments: 1 },
  });
  const maskExp = (v: string) => {
    const d = (v || "").replace(/\D/g, "").slice(0, 6);
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
  };
  const number = watch("number") || "";
  const holder = watch("holder") || "";
  const expiration = watch("expiration") || "";
  const cvv = watch("cvv") || "";
  const brand = number ? detectCardBrand(number) : "";

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({ ...data, brand }))}
      className="space-y-5"
    >
      <AnimatedCreditCard
        number={number}
        holder={holder}
        expiration={expiration}
        cvv={cvv}
        brand={brand}
        flipped={flipped}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Número do cartão *" error={errors.number?.message} className="md:col-span-2">
          <Input {...register("number")} placeholder="0000 0000 0000 0000" inputMode="numeric" />
        </Field>
        <Field label="Nome impresso *" error={errors.holder?.message} className="md:col-span-2">
          <Input {...register("holder")} />
        </Field>
        <Field label="Validade (MM/AAAA) *" error={errors.expiration?.message}>
          <Input
            {...register("expiration", {
              onChange: (e) => {
                e.target.value = maskExp(e.target.value);
                setValue("expiration", e.target.value, { shouldValidate: true });
              },
            })}
            placeholder="MM/AAAA"
            inputMode="numeric"
            maxLength={7}
          />

        </Field>
        <Field label="CVV *" error={errors.cvv?.message}>
          <Input
            {...register("cvv")}
            inputMode="numeric"
            onFocus={() => setFlipped(true)}
            onBlur={() => setFlipped(false)}
          />
        </Field>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autenticar e pagar"}
      </Button>
    </form>
  );
}

function Field({ label, error, children, className }: any) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
