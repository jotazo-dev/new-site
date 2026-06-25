import { useEffect, useRef, useState } from "react";
import { Zap, Shield, Headphones, Wifi, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const reasons = [
  {
    icon: Zap,
    title: "Velocidade real",
    description: "Fibra óptica com entrega garantida. Sem surpresas na hora de usar.",
  },
  {
    icon: Shield,
    title: "Estabilidade 24h",
    description: "Rede própria com redundância, pra você nunca ficar na mão.",
  },
  {
    icon: Headphones,
    title: "Suporte humano",
    description: "Atendimento rápido pelo WhatsApp, sem robô enrolando.",
  },
  {
    icon: Wifi,
    title: "Wi-Fi de ponta",
    description: "Roteadores dual-band que cobrem a casa toda sem zona morta.",
  },
  {
    icon: Clock,
    title: "Instalação ágil",
    description: "Agendamento rápido e equipe técnica especializada.",
  },
  {
    icon: Award,
    title: "Melhor custo-benefício",
    description: "Planos pensados pro seu bolso, sem taxa escondida.",
  },
];

export function WhyJotazoSection() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        // Atrasa a ativação: só dispara quando ~40% da seção já está visível
        const shouldActivate =
          entry.intersectionRatio > 0.35 || entry.boundingClientRect.top < 0;
        if (shouldActivate) {
          // Delay extra de 400ms antes de aplicar a transformação
          window.setTimeout(() => setActive(true), 400);
        }
      },
      { threshold: [0, 0.15, 0.35, 0.5], rootMargin: "0px 0px -25% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl border py-14 px-6 md:px-10 transition-colors duration-1000 ease-out",
        active
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-secondary/40 text-foreground",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl transition-all duration-1000",
          active ? "bg-accent/30 scale-110" : "bg-primary/5",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full blur-3xl transition-all duration-1000",
          active ? "bg-accent/40 scale-110" : "bg-accent/10",
        )}
      />

      <div className="relative mx-auto max-w-5xl space-y-10">
        <header className="text-center space-y-3">
          <span
            className={cn(
              "inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-700",
              active ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary",
            )}
          >
            Diferenciais
          </span>
          <h2
            className={cn(
              "text-3xl font-semibold tracking-tight md:text-4xl transition-colors duration-700",
              active ? "text-primary-foreground" : "text-foreground",
            )}
          >
            Por que a Jotazo é a melhor internet pra você?
          </h2>
          <p
            className={cn(
              "mx-auto max-w-xl transition-colors duration-700",
              active ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            Mais do que velocidade — entregamos uma experiência completa de conexão.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <div
              key={r.title}
              style={{ transitionDelay: active ? `${i * 80}ms` : "0ms" }}
              className={cn(
                "group rounded-xl border p-6 shadow-sm transition-all duration-700 hover:shadow-md",
                active
                  ? "bg-primary-foreground/5 border-primary-foreground/15 backdrop-blur-sm shadow-accent/10"
                  : "bg-card border-border",
              )}
            >
              <div
                className={cn(
                  "mb-4 flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-700 group-hover:bg-accent group-hover:text-accent-foreground",
                  active ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary",
                )}
              >
                <r.icon className="h-5 w-5" />
              </div>
              <h3
                className={cn(
                  "text-lg font-semibold transition-colors duration-700",
                  active ? "text-primary-foreground" : "text-foreground",
                )}
              >
                {r.title}
              </h3>
              <p
                className={cn(
                  "mt-1 text-sm transition-colors duration-700",
                  active ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                {r.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
