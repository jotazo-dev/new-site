import { useState } from "react";
import { Loader2, ShieldCheck, ArrowLeft, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { AuthOption, AuthCustomer } from "@/hooks/useMinhaContaAuth";

interface Props {
  sessionId: string;
  options: AuthOption[];
  confirm: (sessionId: string, optionId: string) => Promise<{ customer: AuthCustomer; accessToken: string }>;
  onSuccess: (customer: AuthCustomer, accessToken: string) => void;
  onBack: () => void;
}

export function ConfirmacaoStep({ sessionId, options, confirm, onSuccess, onBack }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true); setErr(null);
    try {
      const { customer, accessToken } = await confirm(sessionId, selected);
      onSuccess(customer, accessToken);
    } catch (e: any) {
      const left = e?.attemptsLeft;
      setErr(`${e?.message || "Falhou."}${typeof left === "number" ? ` (${left} tentativa${left === 1 ? "" : "s"} restante${left === 1 ? "" : "s"})` : ""}`);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Confirme seus dados
        </p>
        <p className="text-xs text-muted-foreground">
          Selecione a combinação de e-mail e telefone que pertencem a você.
        </p>
      </div>

      <div className="space-y-2">
        {options.map((opt) => {
          const checked = selected === opt.id;
          return (
            <label
              key={opt.id}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                checked ? "border-primary bg-primary/5" : "border-input hover:bg-accent/30"
              }`}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => setSelected(v ? opt.id : null)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono truncate">{opt.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono">{opt.phone}</span>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {err && <p className="text-xs text-destructive">{err}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button type="submit" className="flex-1" disabled={!selected || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Confirmar
        </Button>
      </div>
    </form>
  );
}
