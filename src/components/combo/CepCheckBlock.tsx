import * as React from "react";
import { MapPin, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "available" | "unavailable";

const STORAGE_KEY = "jotazo_cep_v1";

interface CepCheckBlockProps {
  onResult?: (data: { status: Status; cep: string; address: string }) => void;
  className?: string;
}

export function CepCheckBlock({ onResult, className }: CepCheckBlockProps) {
  const [cep, setCep] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [address, setAddress] = React.useState("");

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  const emit = (s: Status, c: string, addr: string) => {
    onResult?.({ status: s, cep: c, address: addr });
  };

  const checkCep = React.useCallback(async (rawCep?: string) => {
    const source = rawCep ?? cep;
    const digits = source.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setStatus("loading");
    setAddress("");
    emit("loading", source, "");

    let addr = "";
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: ctrl.signal });
      clearTimeout(t);
      const data = await res.json();
      if (!data.erro && data.localidade) {
        addr = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`].filter(Boolean).join(", ");
      }
    } catch {
      // continue
    }

    let nextStatus: Status = "available";
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
    setAddress(addr);
    setStatus(nextStatus);
    emit(nextStatus, source, addr);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cep: source, address: addr, status: nextStatus }));
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep]);

  // Pre-fill from localStorage on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { cep?: string; address?: string; status?: Status };
      if (parsed.cep) {
        setCep(parsed.cep);
        if (parsed.status === "available" || parsed.status === "unavailable") {
          // re-validate silently to confirm coverage but use stored as initial
          setStatus(parsed.status);
          setAddress(parsed.address || "");
          emit(parsed.status, parsed.cep, parsed.address || "");
        } else {
          checkCep(parsed.cep);
        }
      }
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("rounded-2xl border border-primary/20 bg-primary/5 p-5", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-foreground">
            <MapPin className="h-5 w-5 text-accent" />
            Verifique a disponibilidade
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite seu CEP para liberar a seleção dos pacotes.
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
              const formatted = formatCep(e.target.value);
              setCep(formatted);
              if (status !== "idle") {
                setStatus("idle");
                setAddress("");
                emit("idle", formatted, "");
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && checkCep()}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            maxLength={9}
          />
          <Button
            size="sm"
            onClick={() => checkCep()}
            disabled={cep.replace(/\D/g, "").length !== 8 || status === "loading"}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {status === "loading" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
            ) : (
              <><Search className="h-4 w-4" /> Verificar</>
            )}
          </Button>
        </div>
      </div>

      {status === "available" && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-[hsl(142,70%,40%)]/10 p-3 text-sm text-[hsl(142,70%,25%)]">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Disponível na sua região!</strong> Já pode escolher seus pacotes abaixo.
            {address && <div className="mt-0.5 text-xs opacity-80">{address}</div>}
          </div>
        </div>
      )}
      {status === "unavailable" && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Ainda não atendemos sua região.</strong>
            {address && <div className="mt-0.5 text-xs opacity-80">{address}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
