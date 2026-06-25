import { Button } from "@/components/ui/button";
import { Zap, Wifi, Gauge, MessageCircle, Trophy } from "lucide-react";
import { WHATSAPP } from "@/config/site";
import heroImage from "@/assets/gamer-hero.jpg";

const waLink = `https://api.whatsapp.com/send?phone=${WHATSAPP.number.replace(/\D/g, "")}&text=${encodeURIComponent(
  "🎮 Olá! Quero contratar a Internet Gamer 1Giga da Jotazo.",
)}`;

export function GamerHero() {
  const scrollToPlans = () => {
    document.getElementById("gamer-plans")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden rounded-[20px] min-h-[560px] md:min-h-[680px] flex items-center">
      {/* Background image */}
      <img
        src={heroImage}
        alt="Gamer profissional com headset em ambiente RGB"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Overlays */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[hsl(220,80%,6%)]/95 via-[hsl(220,80%,8%)]/80 to-[hsl(218,90%,15%)]/85" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,hsl(var(--accent)/0.35),transparent_55%)]" />
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-2xl text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-accent backdrop-blur-sm">
            <Trophy className="h-3.5 w-3.5" /> Pro Gamer Ready
          </span>

          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Internet feita pra quem joga{" "}
            <span className="bg-gradient-to-r from-accent via-[hsl(35,100%,65%)] to-accent bg-clip-text text-transparent">
              pra ganhar
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-white/80 md:text-lg">
            Fibra 1 Giga simétrica, Wi-Fi 6 incluso e roteamento otimizado para
            os principais servidores de jogos. Ping abaixo de 20ms, zero lag,
            zero desculpa pra perder.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Gauge, label: "Ping < 20ms" },
              { icon: Wifi, label: "Wi-Fi 6" },
              { icon: Zap, label: "1Gbps simétrico" },
              { icon: Trophy, label: "NAT aberto" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md"
              >
                <Icon className="h-3.5 w-3.5 text-accent" /> {label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={scrollToPlans}
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_60px_-10px_hsl(var(--accent)/0.7)] font-bold"
            >
              Escolher plano <Zap className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white backdrop-blur-md"
            >
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
