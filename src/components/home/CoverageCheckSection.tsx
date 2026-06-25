import * as React from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Wifi, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedCity } from "@/hooks/useSelectedCity";

const ShaderBackground = React.lazy(() => import("@/components/ui/shader-background"));

export function CoverageCheckSection() {
  const [cep, setCep] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "available" | "unavailable">("idle");
  const [address, setAddress] = React.useState("");
  const { city } = useSelectedCity();

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  const checkCep = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setStatus("loading");
    setAddress("");

    // 1. Buscar endereço via ViaCEP
    let addr = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (!data.erro && data.localidade) {
        const parts = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`].filter(Boolean);
        addr = parts.join(", ");
      }
    } catch {
      // silently continue
    }

    // 2. Verificar cobertura na base
    try {
      const { data: rows } = await supabase
        .from("coverage_ceps")
        .select("id")
        .eq("active", true)
        .lte("cep_start", digits)
        .gte("cep_end", digits)
        .limit(1);

      if (rows && rows.length > 0) {
        setAddress(addr);
        setStatus("available");
      } else {
        setAddress(addr);
        setStatus("unavailable");
      }
    } catch {
      // fallback: mostrar como disponível para não bloquear
      setAddress(addr);
      setStatus("available");
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[20px] text-primary-foreground">
      <React.Suspense fallback={<div className="absolute inset-0 bg-primary" aria-hidden />}>
        <ShaderBackground />
      </React.Suspense>
      <div className="pointer-events-none absolute inset-0 bg-primary/75" />

      <div className="relative px-6 py-12 md:px-12 md:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 backdrop-blur">
            <Wifi className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Cobertura</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {city ? (<>Verifique a <span className="text-accent">disponibilidade</span> em <span className="text-accent">{city.name}</span></>) : (<>Verifique a <span className="text-accent">disponibilidade</span></>)}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/80 md:text-base">
            Digite seu CEP para consultar se a Jotazo Fibra já chegou na sua região.
          </p>

          <div className="mx-auto mt-8 max-w-md">
            <div className="flex items-center gap-1.5 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-1.5 backdrop-blur sm:gap-2 sm:p-2">
              <MapPin className="ml-1 h-5 w-5 shrink-0 text-accent sm:ml-2" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Digite seu CEP"
                value={cep}
                onChange={(e) => { setCep(formatCep(e.target.value)); setStatus("idle"); setAddress(""); }}
                onKeyDown={(e) => e.key === "Enter" && checkCep()}
                className="w-0 min-w-0 flex-1 bg-transparent text-sm text-primary-foreground placeholder:text-primary-foreground/40 outline-none"
                maxLength={9}
              />
              <Button
                size="sm"
                onClick={checkCep}
                disabled={cep.replace(/\D/g, "").length !== 8 || status === "loading"}
                className="shrink-0 rounded-xl bg-accent px-3 text-accent-foreground hover:bg-accent/90 disabled:opacity-50 sm:px-4"
              >
                {status === "loading" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                ) : (
                  <><Search className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Verificar</span></>
                )}
              </Button>
            </div>

            {status === "available" && (
              <div className="mt-3 animate-fade-in text-center">
                <p className="text-sm font-semibold text-[hsl(142,70%,45%)]">✓ Disponível na sua região!</p>
                {address && (
                  <p className="mt-1 text-sm text-primary-foreground/90">
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />{address}
                  </p>
                )}
                <Button
                  asChild
                  size="lg"
                  className="mt-4 h-14 rounded-xl bg-accent px-8 text-base font-semibold text-accent-foreground hover:bg-accent/90 shadow-lg"
                >
                  <Link to={`/personalize-seu-combo?cep=${cep.replace(/\D/g, "")}`}>
                    Montar meu combo <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
            {status === "unavailable" && (
              <div className="mt-3 animate-fade-in text-center">
                <p className="text-sm font-semibold text-destructive">✗ Ainda não disponível na sua região.</p>
                {address && (
                  <p className="mt-1 text-sm text-primary-foreground/90">
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />{address}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
