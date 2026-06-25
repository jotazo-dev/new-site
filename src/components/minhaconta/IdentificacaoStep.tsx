import { useState } from "react";
import { Loader2, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidDocLength, maskCpfCnpj, onlyDigits } from "@/lib/docMask";
import type { AuthOption } from "@/hooks/useMinhaContaAuth";

interface Props {
  onSuccess: (sessionId: string, options: AuthOption[], document: string) => void;
  lookup: (document: string) => Promise<{ sessionId: string; options: AuthOption[] }>;
}

export function IdentificacaoStep({ onSuccess, lookup }: Props) {
  const [doc, setDoc] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = isValidDocLength(doc);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true); setErr(null);
    try {
      const { sessionId, options } = await lookup(onlyDigits(doc));
      onSuccess(sessionId, options, doc);
    } catch (e: any) {
      setErr(e?.message || "Não foi possível consultar agora.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="mc-doc" className="text-sm font-medium flex items-center gap-2">
          <IdCard className="h-4 w-4" /> CPF ou CNPJ
        </label>
        <Input
          id="mc-doc"
          type="text"
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          value={doc}
          onChange={(e) => setDoc(maskCpfCnpj(e.target.value))}
          placeholder="000.000.000-00"
          maxLength={18}
        />
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={!valid || loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continuar
      </Button>
    </form>
  );
}
