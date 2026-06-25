import { Check } from "lucide-react";
import setupImg from "@/assets/gamer-setup.jpg";
import teamImg from "@/assets/gamer-team.jpg";

type Block = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  alt: string;
  reverse?: boolean;
};

const BLOCKS: Block[] = [
  {
    eyebrow: "Performance",
    title: "Cada milissegundo conta na hora do clutch",
    description:
      "Nossa rede é desenhada pra reduzir saltos até os servidores dos principais jogos. Menos hops, menos jitter, mais headshot.",
    bullets: [
      "Upload simétrico para streaming sem perda de qualidade",
      "Jitter consistente abaixo de 5ms",
      "IPv6 nativo e NAT aberto (consoles e PC)",
    ],
    image: setupImg,
    alt: "Mãos em teclado mecânico RGB",
  },
  {
    eyebrow: "Esports",
    title: "A mesma estabilidade dos torneios, dentro de casa",
    description:
      "Equipamentos profissionais, roteador Wi-Fi 6 incluso e suporte técnico especializado pra sua rede competir no mesmo nível dos pros.",
    bullets: [
      "Roteador Wi-Fi 6 corporativo incluso no plano",
      "Atendimento prioritário 24/7 pelo WhatsApp",
      "Instalação rápida com cabeamento dedicado",
    ],
    image: teamImg,
    alt: "Equipe de esports em arena profissional",
    reverse: true,
  },
];

export function GamerImmersion() {
  return (
    <section className="space-y-20">
      {BLOCKS.map((b) => (
        <div
          key={b.title}
          className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12"
        >
          <div className={b.reverse ? "md:order-2" : ""}>
            <div className="relative overflow-hidden rounded-[20px] border border-border">
              <img
                src={b.image}
                alt={b.alt}
                loading="lazy"
                width={1280}
                height={960}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10" />
            </div>
          </div>

          <div className={b.reverse ? "md:order-1" : ""}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {b.eyebrow}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
              {b.title}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">{b.description}</p>
            <ul className="mt-6 space-y-3">
              {b.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-foreground/80">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </section>
  );
}
