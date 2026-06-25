import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Currency-masked input (BRL).
 *
 * Stores value as integer cents and displays it as "R$ 0,00" while typing.
 * The user types digits — the mask formats them automatically from the right
 * (so typing "7590" → "R$ 75,90", typing "12500" → "R$ 125,00").
 *
 * Usage:
 *   <MoneyInput valueCents={form.price_cents} onChangeCents={(c) => setForm(f => ({...f, price_cents: c}))} />
 */
export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  valueCents: number;
  onChangeCents: (cents: number) => void;
}

function formatCents(cents: number): string {
  const safe = Math.max(0, Math.floor(cents || 0));
  const reais = Math.floor(safe / 100);
  const centavos = safe % 100;
  const reaisStr = reais.toLocaleString("pt-BR");
  return `R$ ${reaisStr},${centavos.toString().padStart(2, "0")}`;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ valueCents, onChangeCents, className, placeholder = "R$ 0,00", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Keep only digits — they represent cents from the right
      const digits = e.target.value.replace(/\D/g, "");
      const cents = digits ? parseInt(digits, 10) : 0;
      onChangeCents(cents);
    };

    // Move caret to the end so typing always appends from the right
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const len = e.target.value.length;
      requestAnimationFrame(() => {
        try { e.target.setSelectionRange(len, len); } catch {}
      });
      props.onFocus?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={valueCents > 0 ? formatCents(valueCents) : ""}
        onChange={handleChange}
        onFocus={handleFocus}
        className={cn("font-mono tabular-nums", className)}
        {...props}
      />
    );
  }
);
MoneyInput.displayName = "MoneyInput";
