import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { creditCardSchema, type CreditCardInput, detectCardBrand } from "@/lib/checkoutValidation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatBRL } from "@/data/plans";
import { AnimatedCreditCard } from "./AnimatedCreditCard";

export function CreditCardForm({
  totalCents,
  loading,
  onSubmit,
}: {
  totalCents: number;
  loading?: boolean;
  onSubmit: (card: CreditCardInput, installments: number) => void;
}) {
  const [installments, setInstallments] = useState(1);
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
      onSubmit={handleSubmit((data) => onSubmit({ ...data, brand, installments }, installments))}
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
          <div className="relative">
            <Input {...register("number")} placeholder="0000 0000 0000 0000" inputMode="numeric" />
            {brand && <span className="absolute right-3 top-2.5 text-[10px] font-semibold text-muted-foreground">{brand}</span>}
          </div>
        </Field>
        <Field label="Nome impresso *" error={errors.holder?.message} className="md:col-span-2">
          <Input {...register("holder")} placeholder="Como está no cartão" />
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
            placeholder="123"
            inputMode="numeric"
            onFocus={() => setFlipped(true)}
            onBlur={() => setFlipped(false)}
          />
        </Field>
        <Field label="Parcelas" className="md:col-span-2">
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}x de {formatBRL(Math.round(totalCents / n))} {n === 1 ? "à vista" : "(sem juros na loja)"}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pagar ${formatBRL(totalCents)}`}
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
