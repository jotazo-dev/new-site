import { Link } from "react-router-dom";
import { Smartphone, Signal, Headphones, Wrench, MessageCircle, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const supportFeatures = [
  { icon: Clock, label: "Agendamento rápido" },
  { icon: Wrench, label: "Suporte técnico especializado" },
  { icon: Signal, label: "Upgrade de Wi-Fi" },
  { icon: MessageCircle, label: "Atendimento via WhatsApp" },
];

export function HighlightCardsSection() {
  return (
    <section className="grid gap-5 md:grid-cols-2">
      {/* Card 5G */}
      <div className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-primary via-primary/95 to-[hsl(var(--speedtest-deep))] p-8 text-primary-foreground md:p-10">
        {/* Glow effects */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl transition-transform duration-500 group-hover:scale-125" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />

        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Destaque
          </div>

          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent">
              <Smartphone className="h-8 w-8 text-accent-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight md:text-3xl">Internet móvel 5G</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-primary-foreground/60">
                Mais liberdade para trabalhar, estudar e curtir — com franquias generosas e a tecnologia 5G mais rápida do mercado.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1.5 text-xs font-medium">Até 80 GB</span>
            <span className="rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1.5 text-xs font-medium">5G Ultra</span>
            <span className="rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1.5 text-xs font-medium">WhatsApp ilimitado</span>
          </div>

          <Button asChild className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
            <a href="https://jotazo.com.br/internet-movel">Ver planos móveis</a>
          </Button>
        </div>
      </div>

      {/* Card Suporte */}
      <div className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-primary via-primary/95 to-[hsl(var(--speedtest-deep))] p-8 text-primary-foreground md:p-10">
        {/* Glow effects */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl transition-transform duration-500 group-hover:scale-125" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />

        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Shield className="h-3.5 w-3.5 text-accent" />
            Confiança
          </div>

          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent">
              <Headphones className="h-8 w-8 text-accent-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight md:text-3xl">Instalação e suporte</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-primary-foreground/60">
                Da instalação ao dia a dia, você conta com atendimento rápido e uma equipe que realmente resolve.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {supportFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 px-3 py-2.5">
                <f.icon className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-xs font-medium">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/cobertura">Ver cobertura</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground font-semibold hover:bg-primary-foreground/20">
              <Link to="/atendimento">Tirar dúvidas</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
