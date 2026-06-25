import * as React from "react";
import { Check, Signal, X } from "lucide-react";
import chipImg from "@/assets/chip-5g-card.png";
import { useSelectedCity } from "@/hooks/useSelectedCity";
import { AnimatedHeroBg } from "@/components/common/AnimatedHeroBg";

const STORAGE_KEY = "chip5g-brasil-popup-seen";
const DELAY_MS = 120000;

export function Chip5GBrasilSection() {
  const { city } = useSelectedCity();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    // Popup desativado temporariamente
    return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    }
  };

  const handleCta = () => {
    handleOpenChange(false);
    window.setTimeout(() => {
      const el = document.getElementById("chip5gblack");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleOpenChange(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="chip5g-brasil-popup-title">
      <button
        type="button"
        aria-label="Fechar popup"
        className="absolute inset-0 bg-foreground/80"
        onClick={() => handleOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[20px] bg-primary p-0 text-primary-foreground shadow-elegant ring-1 ring-primary-foreground/10">
        <button
          type="button"
          aria-label="Fechar popup"
          onClick={() => handleOpenChange(false)}
          className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground transition-colors hover:bg-primary-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary-foreground/60"
        >
          <X className="h-4 w-4" />
        </button>
        <AnimatedHeroBg />
        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <div className="relative flex flex-col items-center text-center">
            <div className="group relative overflow-hidden rounded-2xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 m-auto h-40 w-40 rounded-full bg-accent/40 blur-3xl transition-transform duration-500 group-hover:scale-110"
              />
              <img
                src={chipImg}
                alt="Chip 5G Jotazo Telecom"
                loading="lazy"
                decoding="async"
                className="relative max-h-[200px] w-auto object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent ring-1 ring-accent/30">
              <Signal className="h-3.5 w-3.5" />
              {city ? "Viaje sem perder sinal" : "Sem cobertura aí?"}
            </span>

            <h2
              id="chip5g-brasil-popup-title"
              className="mt-3 font-display text-2xl font-bold leading-tight md:text-3xl"
            >
              Chip 5G Jotazo —{" "}
              <span className="text-accent">funciona em todo o Brasil</span>
            </h2>

            <p className="mt-2 text-sm text-primary-foreground/80 md:text-base">
              Internet rápida onde você estiver, sem fidelidade e com WhatsApp Ilimitado.
              {city ? (
                <>
                  {" "}Ideal para quem mora em{" "}
                  <strong className="font-semibold text-primary-foreground">{city.name}</strong>{" "}
                  e precisa de internet fora de casa.
                </>
              ) : null}
            </p>

            <ul className="mt-5 w-full space-y-2 text-left">
              {[
                "Internet 5G de alta velocidade",
                "WhatsApp Ilimitado todo mês",
                "Sem fidelidade e sem burocracia",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 ring-1 ring-accent/40">
                    <Check className="h-3.5 w-3.5 text-accent" />
                  </span>
                  <span className="text-sm text-primary-foreground/90">{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleCta}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-lg transition-all hover:bg-accent/90 hover:shadow-xl"
            >
              Contratar Chip 5G
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
