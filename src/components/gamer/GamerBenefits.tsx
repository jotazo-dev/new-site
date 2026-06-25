import { Zap, Wifi, Activity, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const benefits: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Zap,
    title: "Latência ultra-baixa",
    description: "Roteamento direto até os principais servidores de jogos. Ping abaixo de 20ms na maior parte do Brasil.",
  },
  {
    icon: Wifi,
    title: "Wi-Fi 6 incluso",
    description: "Roteador de última geração cobrindo toda a casa, sem jitter nem oscilação de sinal.",
  },
  {
    icon: Activity,
    title: "Fibra simétrica",
    description: "Mesma velocidade de download e upload. Streaming, lives e gameplay sem travamento.",
  },
  {
    icon: ShieldCheck,
    title: "Suporte 24/7",
    description: "Time técnico especializado disponível todos os dias pra sua partida nunca parar.",
  },
];

export function GamerBenefits() {
  return (
    <section className="space-y-10">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Tudo que um gamer precisa
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          A combinação certa de velocidade, estabilidade e tecnologia pra você
          render no máximo a cada partida.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_0_60px_-12px_hsl(var(--accent)/0.4)]"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(218,90%,25%)] text-white shadow-lg shadow-primary/40">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">{b.title}</h3>
              <div className="mt-2 h-[2px] w-10 rounded-full bg-accent" />
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.description}</p>
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/15 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
