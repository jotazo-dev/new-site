import { ArrowRightLeft, Smartphone, CheckCircle2, Gift, ShieldCheck, Repeat, MessageCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP } from "@/config/site";

const steps = [
  {
    icon: ArrowRightLeft,
    title: "Escolha seu plano 5G",
    desc: "Selecione o plano ideal e finalize o pedido informando que deseja portar seu número.",
  },
  {
    icon: Smartphone,
    title: "Ative seu chip ou eSIM",
    desc: "Receba o chip em casa ou ative o eSIM na hora. A linha provisória já fica disponível.",
  },
  {
    icon: CheckCircle2,
    title: "Portabilidade automática",
    desc: "Em até 3 dias úteis seu número antigo migra para a Jotazo. Sem interrupção, sem custo.",
  },
];

const highlights = [
  { icon: Gift, label: "100% grátis" },
  { icon: ShieldCheck, label: "Sem perder o número" },
  { icon: Repeat, label: "Qualquer operadora" },
  { icon: Rocket, label: "Bônus de GB na 1ª recarga" },
];

const waMessage = encodeURIComponent(
  "Olá! Quero fazer a portabilidade do meu número para a Jotazo 5G."
);
const waHref = `https://wa.me/${WHATSAPP.number.replace(/\D/g, "")}?text=${waMessage}`;

export function PortabilidadeSection() {
  return (
    <section aria-labelledby="portabilidade-titulo" className="relative">
      <div className="relative overflow-hidden rounded-[20px] border bg-card p-8 md:p-12">
        {/* Mesh gradient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        </div>

        <div className="relative grid items-start gap-10 md:grid-cols-[1fr_1.2fr]">
          {/* Left: title + CTAs */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5">
              <ArrowRightLeft className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Traga seu número
              </span>
            </div>
            <h2
              id="portabilidade-titulo"
              className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl"
            >
              Portabilidade <span className="text-accent">grátis</span> em até 3 dias úteis
            </h2>
            <p className="max-w-md text-sm text-muted-foreground md:text-base">
              Mude para o 5G da Jotazo sem perder seu número de qualquer operadora. A gente cuida
              de todo o processo para você.
            </p>

            <ul className="flex flex-wrap gap-2">
              {highlights.map((h) => (
                <li
                  key={h.label}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-medium backdrop-blur"
                >
                  <h.icon className="h-3.5 w-3.5 text-accent" />
                  {h.label}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#planos">
                  <Rocket className="mr-2 h-4 w-4" />
                  Quero portar meu número
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#25D366]/40 bg-[#25D366]/10 text-[#1faa53] hover:bg-[#25D366]/20 hover:text-[#1faa53]"
              >
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Tirar dúvidas no WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Right: steps */}
          <ol className="relative space-y-4">
            <span
              aria-hidden
              className="pointer-events-none absolute left-7 top-4 bottom-4 hidden w-px bg-gradient-to-b from-accent/40 via-border to-transparent md:block"
            />
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="group relative flex gap-4 rounded-2xl border bg-background/60 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">
                  <s.icon className="h-5 w-5" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shadow">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
