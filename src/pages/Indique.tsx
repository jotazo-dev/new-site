import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Gift,
  Share2,
  UserCheck,
  Sparkles,
  Trophy,
  Crown,
  Medal,
  Award,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
  Tv,
  Wifi,
  Ticket,
  Shirt,
  Star,
  PartyPopper,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import { HolographicCard } from "@/components/ui/holographic-card";
import { useCountUp, useInView } from "@/hooks/useCountUp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WHATSAPP } from "@/config/site";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Animated background
--------------------------------------------------------------------------- */
function AnimatedBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary-foreground)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      {/* Blobs */}
      <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-accent/30 blur-3xl animate-blob-drift" />
      <div
        className="absolute -right-24 top-1/4 h-[480px] w-[480px] rounded-full bg-primary-foreground/10 blur-3xl animate-blob-drift"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute bottom-[-180px] left-1/3 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl animate-blob-drift"
        style={{ animationDelay: "-12s" }}
      />
      {/* Floating particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-accent/60"
          style={{
            top: `${(i * 53) % 95}%`,
            left: `${(i * 37) % 95}%`,
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            opacity: 0.35,
            animation: `float-y ${5 + (i % 5)}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   1. Hero
--------------------------------------------------------------------------- */
function HeroSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  const totalEarned = useCountUp(142350, 1800, inView);
  const totalUsers = useCountUp(2847, 1800, inView);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden rounded-3xl border border-primary-foreground/10 bg-primary text-primary-foreground"
    >
      <AnimatedBg />
      <div className="relative grid gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:px-12 md:py-24">
        <div className="space-y-7 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Programa de Indicação
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Indique. <span className="text-accent">Ganhe.</span>
            <br />
            Repita.
          </h1>
          <p className="max-w-xl text-base text-primary-foreground/80 md:text-lg">
            Cada amigo que vira cliente Jotazo coloca dinheiro de volta no seu bolso, meses
            grátis na sua conta e brindes exclusivos no seu sofá. Quanto mais você indica,
            maior o seu nível.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/30"
            >
              <a href="#formulario">
                Quero indicar agora <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <a href="#como-funciona">Como funciona</a>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-primary-foreground/70">
            <div>
              <div className="font-display text-2xl font-bold text-primary-foreground">
                +{totalUsers.toLocaleString("pt-BR")}
              </div>
              <div>clientes participando</div>
            </div>
            <div className="h-10 w-px bg-primary-foreground/20" />
            <div>
              <div className="font-display text-2xl font-bold text-accent">
                R$ {totalEarned.toLocaleString("pt-BR")}
              </div>
              <div>já distribuídos</div>
            </div>
          </div>
        </div>

        {/* Right side — floating reward cards */}
        <div className="relative h-[420px] md:h-[520px]">
          <FloatingRewardCard
            icon={Gift}
            title="R$ 50"
            subtitle="cashback por amigo"
            className="left-0 top-4 rotate-[-6deg]"
            delay="0s"
          />
          <FloatingRewardCard
            icon={Sparkles}
            title="1 mês grátis"
            subtitle="na sua mensalidade"
            className="right-0 top-24 rotate-[5deg]"
            delay="-2s"
            highlight
          />
          <FloatingRewardCard
            icon={Trophy}
            title="Smart TV"
            subtitle="prêmio Diamante"
            className="left-6 top-56 rotate-[3deg]"
            delay="-4s"
          />
          <FloatingRewardCard
            icon={Ticket}
            title="Ingressos"
            subtitle="cinema premium"
            className="right-4 bottom-4 rotate-[-4deg]"
            delay="-1s"
          />
        </div>
      </div>
    </section>
  );
}

function FloatingRewardCard({
  icon: Icon,
  title,
  subtitle,
  className,
  delay = "0s",
  highlight = false,
}: {
  icon: typeof Gift;
  title: string;
  subtitle: string;
  className?: string;
  delay?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute w-52 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.08] p-4 shadow-2xl backdrop-blur-md animate-float-y",
        highlight && "ring-2 ring-accent/60",
        className,
      )}
      style={{ animationDelay: delay }}
    >
      <div
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-lg",
          highlight ? "bg-accent text-accent-foreground" : "bg-primary-foreground/15 text-accent",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-xl font-bold text-primary-foreground">{title}</div>
      <div className="text-xs text-primary-foreground/70">{subtitle}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   2. Social proof marquee
--------------------------------------------------------------------------- */
const proofs = [
  { name: "Maria S.", city: "Apiaí", reward: "R$ 250 cashback" },
  { name: "João R.", city: "Apiaí", reward: "3 meses grátis" },
  { name: "Beatriz L.", city: "Ribeira", reward: "Camiseta + R$ 100" },
  { name: "Carlos M.", city: "Itaóca", reward: "Smart TV 50''" },
  { name: "Ana P.", city: "Apiaí", reward: "R$ 600 acumulados" },
  { name: "Diego F.", city: "Adrianópolis", reward: "6 meses grátis" },
  { name: "Letícia C.", city: "Barra do Chapéu", reward: "R$ 150 cashback" },
  { name: "Rafael V.", city: "Apiaí", reward: "Cesta gourmet" },
];

function ProofMarquee() {
  const items = [...proofs, ...proofs];
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-secondary/50 py-4">
      <div className="flex animate-marquee items-center gap-8 whitespace-nowrap">
        {items.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Star className="h-4 w-4 fill-current" />
            </div>
            <span className="text-sm">
              <strong className="text-foreground">{p.name}</strong>
              <span className="text-muted-foreground"> de {p.city} ganhou </span>
              <strong className="text-accent">{p.reward}</strong>
            </span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   3. How it works
--------------------------------------------------------------------------- */
const steps = [
  {
    icon: Share2,
    title: "Compartilhe",
    desc: "Indique pelo formulário ou compartilhe seu link da Jotazo no WhatsApp em 10 segundos.",
  },
  {
    icon: UserCheck,
    title: "Amigo contrata",
    desc: "Seu amigo escolhe o plano ideal (Fibra, 5G ou TV) e ativa em até 48h após a aprovação.",
  },
  {
    icon: Gift,
    title: "Vocês dois ganham",
    desc: "Cashback no PIX para você + 1 mês grátis para o seu amigo. Sem letra miúda.",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="space-y-10">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          3 passos · 0 burocracia
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
          Como funciona o programa
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Você ganha mesmo se nunca tiver indicado ninguém na vida. É realmente fácil.
        </p>
      </div>

      <div className="relative grid gap-6 md:grid-cols-3">
        {/* Connector line */}
        <div className="pointer-events-none absolute left-[16%] right-[16%] top-[68px] hidden h-px bg-gradient-to-r from-transparent via-accent to-transparent md:block" />

        {steps.map((s, i) => (
          <Card
            key={s.title}
            className="relative overflow-hidden border-2 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl"
          >
            <CardContent className="space-y-4 p-8 text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                <s.icon className="h-7 w-7" />
                <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-4 ring-background">
                  {i + 1}
                </span>
                <span className="pointer-events-none absolute inset-0 rounded-full bg-accent/40 animate-pulse-ring" />
              </div>
              <h3 className="font-display text-xl font-bold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   4. Calculator
--------------------------------------------------------------------------- */
const TIERS = [
  { name: "Bronze", min: 0, max: 2, cashback: 50, freeMonths: 0, perk: "Adesivo oficial Jotazo", color: "from-amber-700 to-amber-500", icon: Medal },
  { name: "Prata", min: 3, max: 5, cashback: 75, freeMonths: 1, perk: "Brinde surpresa no aniversário", color: "from-slate-400 to-slate-200", icon: Award },
  { name: "Ouro", min: 6, max: 10, cashback: 100, freeMonths: 2, perk: "Camiseta exclusiva + roteador upgrade", color: "from-yellow-500 to-yellow-300", icon: Trophy },
  { name: "Diamante", min: 11, max: 999, cashback: 150, freeMonths: 6, perk: "Smart TV 50'' no aniversário do programa", color: "from-cyan-400 to-blue-500", icon: Crown },
];

function getTier(count: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (count >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

function Calculator() {
  const [count, setCount] = useState(5);
  const tier = useMemo(() => getTier(count) ?? TIERS[0], [count]);
  const cashback = count * tier.cashback;
  const months = count * (tier.freeMonths || (tier.name === "Bronze" ? 0 : 1));
  const nextTier = TIERS.find((t) => t.min > count);
  const progressToNext = nextTier
    ? Math.min(100, ((count - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  return (
    <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-secondary via-background to-accent/5 p-6 md:p-12">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Calculadora interativa
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight md:text-5xl">
            Quanto você pode ganhar este ano?
          </h2>
          <p className="text-muted-foreground">
            Arraste a barra abaixo e descubra. A maioria dos nossos clientes consegue indicar
            entre 4 e 8 amigos no primeiro semestre — basicamente vizinhos e parentes.
          </p>

          <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Você indica</div>
                <div className="font-display text-5xl font-bold tabular-nums">
                  {count}
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    {count === 1 ? "amigo" : "amigos"}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                Nível {tier.name}
              </Badge>
            </div>
            <Slider
              value={[count]}
              onValueChange={(v) => setCount(v[0])}
              min={1}
              max={20}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultBox
              label="Cashback no PIX"
              value={`R$ ${cashback.toLocaleString("pt-BR")}`}
              icon={Gift}
              accent
            />
            <ResultBox
              label="Meses grátis"
              value={`${months} ${months === 1 ? "mês" : "meses"}`}
              icon={Sparkles}
            />
            <ResultBox
              label="Nível atual"
              value={tier.name}
              icon={tier.icon}
            />
            <ResultBox
              label="Brinde desbloqueado"
              value={tier.perk}
              icon={Trophy}
              small
            />
          </div>

          {nextTier ? (
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Próximo nível: {nextTier.name}</span>
                <span className="text-muted-foreground">
                  faltam {nextTier.min - count} {nextTier.min - count === 1 ? "indicação" : "indicações"}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-5 text-center">
              <Crown className="mx-auto h-7 w-7 text-accent" />
              <p className="mt-2 font-semibold">Você atingiu o nível máximo: Diamante 💎</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ResultBox({
  label,
  value,
  icon: Icon,
  accent,
  small,
}: {
  label: string;
  value: string;
  icon: typeof Gift;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md",
        accent && "border-accent/40 bg-accent/5",
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-lg",
          accent ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-display font-bold tabular-nums",
          small ? "text-base leading-snug" : "text-2xl",
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   5. Tier cards
--------------------------------------------------------------------------- */
function TierCards() {
  return (
    <section className="space-y-10">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Sistema de níveis
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
          Quanto mais você indica, mais alto você sobe
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Bronze, Prata, Ouro, Diamante. A cada nível, recompensas maiores e brindes exclusivos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier, i) => {
          const isDiamond = tier.name === "Diamante";
          const Wrapper = isDiamond ? HolographicCard : "div";
          return (
            <Wrapper key={tier.name} className="group h-full">
              <Card
                className={cn(
                  "relative h-full overflow-hidden border-2 transition-all hover:-translate-y-2 hover:shadow-2xl",
                  isDiamond && "border-accent/40",
                )}
              >
                {isDiamond && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine-sweep" />
                  </div>
                )}
                <div className={cn("h-2 w-full bg-gradient-to-r", tier.color)} />
                <CardContent className="relative space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                        tier.color,
                      )}
                    >
                      <tier.icon className="h-6 w-6" />
                    </div>
                    {isDiamond && (
                      <Badge className="bg-accent text-accent-foreground">Top</Badge>
                    )}
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold">{tier.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tier.min === 0
                        ? `1 a ${tier.max} indicações`
                        : tier.max > 100
                        ? `${tier.min}+ indicações`
                        : `${tier.min} a ${tier.max} indicações`}
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>
                        <strong>R$ {tier.cashback}</strong> de cashback por indicação
                      </span>
                    </li>
                    {tier.freeMonths > 0 && (
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>
                          <strong>{tier.freeMonths}</strong>{" "}
                          {tier.freeMonths === 1 ? "mês grátis" : "meses grátis"} por indicação
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{tier.perk}</span>
                    </li>
                  </ul>

                  <div className="pt-2 text-xs text-muted-foreground">
                    Posição #{i + 1} no programa
                  </div>
                </CardContent>
              </Card>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   6. Prizes gallery
--------------------------------------------------------------------------- */
const prizes = [
  { icon: Tv, name: "Smart TV 50''", desc: "Para o nível Diamante", tag: "Top" },
  { icon: Wifi, name: "Kit Casa Conectada", desc: "Roteador mesh + smart plug", tag: "Ouro" },
  { icon: Ticket, name: "Ingressos Premium", desc: "2 ingressos cinema/mês", tag: "Prata" },
  { icon: Shirt, name: "Camiseta Exclusiva", desc: "Edição limitada Jotazo", tag: "Ouro" },
];

function PrizesGallery() {
  return (
    <section className="space-y-10">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Brindes & prêmios
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
          O que está esperando por você
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {prizes.map((p) => (
          <Card
            key={p.name}
            className="group relative overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-primary via-primary to-primary/70 p-8">
              <div className="absolute inset-0 opacity-30 transition-opacity group-hover:opacity-50"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 30%, hsl(var(--accent) / 0.6), transparent 60%)",
                }}
              />
              <p.icon className="relative h-20 w-20 text-primary-foreground transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
              <Badge className="absolute right-3 top-3 bg-accent text-accent-foreground">
                {p.tag}
              </Badge>
            </div>
            <CardContent className="space-y-1 p-5">
              <h3 className="font-display text-lg font-bold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   7. Form
--------------------------------------------------------------------------- */
const phoneRegex = /^[()\d\s\-+]{10,20}$/;

const referralSchema = z.object({
  referrer_name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  referrer_phone: z.string().trim().regex(phoneRegex, "Telefone inválido").max(20),
  referrer_email: z.string().trim().email("E-mail inválido").max(255).or(z.literal("")),
  referrer_city: z.string().trim().max(80).default(""),
  referred_name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  referred_phone: z.string().trim().regex(phoneRegex, "Telefone inválido").max(20),
  referred_city: z.string().trim().max(80).default(""),
  message: z.string().trim().max(500).default(""),
});

const initialForm = {
  referrer_name: "",
  referrer_phone: "",
  referrer_email: "",
  referrer_city: "",
  referred_name: "",
  referred_phone: "",
  referred_city: "",
  message: "",
};

function ReferralForm() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = referralSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast.error(first?.message ?? "Verifique os campos");
      return;
    }

    setLoading(true);
    const payload = {
      referrer_name: parsed.data.referrer_name,
      referrer_phone: parsed.data.referrer_phone,
      referrer_email: parsed.data.referrer_email ?? "",
      referrer_city: parsed.data.referrer_city ?? "",
      referred_name: parsed.data.referred_name,
      referred_phone: parsed.data.referred_phone,
      referred_city: parsed.data.referred_city ?? "",
      message: parsed.data.message ?? "",
    };
    const { error } = await supabase.from("referrals").insert(payload);
    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Não conseguimos enviar agora. Tente novamente em instantes.");
      return;
    }

    setSuccess(true);
    setForm(initialForm);
    toast.success("Indicação enviada! 🎉");
  }

  function shareOnWhatsApp() {
    const msg = encodeURIComponent(
      "Oi! Vim através da Jotazo Telecom — fibra estável e atendimento humano. Confere os planos: https://jotazo.com.br/planos",
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section id="formulario" className="relative scroll-mt-24">
      <Card className="relative overflow-hidden border-2 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/85 opacity-[0.03]" />
        <div className="grid lg:grid-cols-[1fr_1.3fr]">
          {/* Left — copy */}
          <div className="relative overflow-hidden bg-primary p-8 text-primary-foreground md:p-12">
            <AnimatedBg />
            <div className="relative space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                <Gift className="h-3.5 w-3.5" /> 30 segundos
              </span>
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
                Indique um amigo agora e comece a ganhar.
              </h2>
              <p className="text-primary-foreground/80">
                Preencha o formulário ao lado. Nossa equipe entra em contato com seu amigo em
                até 1 dia útil. Quando ele ativar o plano, o seu cashback cai no PIX.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  { i: ShieldCheck, t: "Dados protegidos pela LGPD" },
                  { i: Zap, t: "Cashback creditado em até 7 dias após ativação" },
                  { i: PartyPopper, t: "Sem limite de indicações por mês" },
                ].map((b) => (
                  <li key={b.t} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10 text-accent">
                      <b.i className="h-4 w-4" />
                    </span>
                    <span className="text-primary-foreground/90">{b.t}</span>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                variant="outline"
                onClick={shareOnWhatsApp}
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <MessageCircle className="mr-1 h-4 w-4" />
                Compartilhar meu link no WhatsApp
              </Button>
            </div>
          </div>

          {/* Right — form / success */}
          <div className="p-8 md:p-12">
            {success ? (
              <SuccessState onAgain={() => setSuccess(false)} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormSection title="Seus dados">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Seu nome *"
                      id="referrer_name"
                      value={form.referrer_name}
                      onChange={(v) => update("referrer_name", v)}
                      placeholder="João da Silva"
                      required
                    />
                    <Field
                      label="Seu WhatsApp *"
                      id="referrer_phone"
                      value={form.referrer_phone}
                      onChange={(v) => update("referrer_phone", v)}
                      placeholder="(15) 99999-0000"
                      required
                    />
                    <Field
                      label="Seu e-mail"
                      id="referrer_email"
                      value={form.referrer_email}
                      onChange={(v) => update("referrer_email", v)}
                      placeholder="voce@email.com"
                      type="email"
                    />
                    <Field
                      label="Sua cidade"
                      id="referrer_city"
                      value={form.referrer_city}
                      onChange={(v) => update("referrer_city", v)}
                      placeholder="Apiaí"
                    />
                  </div>
                </FormSection>

                <FormSection title="Quem você indica">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Nome do amigo *"
                      id="referred_name"
                      value={form.referred_name}
                      onChange={(v) => update("referred_name", v)}
                      placeholder="Maria Souza"
                      required
                    />
                    <Field
                      label="WhatsApp do amigo *"
                      id="referred_phone"
                      value={form.referred_phone}
                      onChange={(v) => update("referred_phone", v)}
                      placeholder="(15) 98888-1111"
                      required
                    />
                    <Field
                      label="Cidade do amigo"
                      id="referred_city"
                      value={form.referred_city}
                      onChange={(v) => update("referred_city", v)}
                      placeholder="Apiaí"
                    />
                    <div className="md:col-span-1">
                      <Label htmlFor="message" className="text-sm">
                        Mensagem (opcional)
                      </Label>
                      <Textarea
                        id="message"
                        value={form.message}
                        onChange={(e) => update("message", e.target.value)}
                        placeholder="Diz pro amigo o que você gosta na Jotazo…"
                        rows={3}
                        className="mt-1.5"
                        maxLength={500}
                      />
                    </div>
                  </div>
                </FormSection>

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="relative w-full overflow-hidden bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4" />
                      Indicar e ganhar
                    </>
                  )}
                  <span className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine-sweep" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Ao enviar, você concorda com os termos do programa e autoriza o contato com o
                  amigo indicado.
                </p>
              </form>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1.5"
      />
    </div>
  );
}

function SuccessState({ onAgain }: { onAgain: () => void }) {
  const colors = ["#FF6600", "#00358F", "#FFD700", "#34D399", "#EC4899"];
  return (
    <div className="relative flex h-full min-h-[420px] flex-col items-center justify-center gap-5 overflow-hidden text-center">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="pointer-events-none absolute h-2 w-3 animate-confetti-fall"
          style={{
            left: `${(i * 91) % 100}%`,
            top: "-10px",
            background: colors[i % colors.length],
            animationDelay: `${(i % 6) * 0.1}s`,
            transform: `rotate(${(i * 27) % 360}deg)`,
          }}
        />
      ))}

      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-accent animate-scale-in">
        <PartyPopper className="h-10 w-10" />
      </div>
      <div>
        <h3 className="font-display text-3xl font-bold">Indicação enviada!</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Nossa equipe vai entrar em contato com seu amigo em até 1 dia útil. Assim que ele
          ativar o plano, seu cashback cai no PIX.
        </p>
      </div>
      <Button onClick={onAgain} variant="outline" size="lg">
        Indicar outro amigo
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   8. FAQ
--------------------------------------------------------------------------- */
const faqs = [
  {
    q: "Como recebo o cashback?",
    a: "Por PIX, na chave do seu CPF. O valor é creditado em até 7 dias após o seu amigo ativar o plano contratado.",
  },
  {
    q: "Quantos amigos posso indicar?",
    a: "Quantos quiser! Não existe limite mensal nem teto de cashback. Quanto mais indica, mais alto seu nível e maiores as recompensas.",
  },
  {
    q: "O amigo precisa contratar qual plano?",
    a: "Qualquer plano Jotazo elegível: Fibra (a partir de 300 Mbps), Móvel 5G, TV ou Combo. A recompensa vale para todos.",
  },
  {
    q: "Quando recebo os meses grátis?",
    a: "São aplicados na sua próxima fatura após a ativação do amigo indicado. Se ainda não for cliente, viram crédito acumulado.",
  },
  {
    q: "Como funciona a subida de nível?",
    a: "Conforme o número de indicações ativadas no ano, você sobe automaticamente: Bronze (1-2), Prata (3-5), Ouro (6-10) e Diamante (11+).",
  },
  {
    q: "Os brindes são entregues em casa?",
    a: "Sim. Para clientes da área de cobertura Jotazo, entregamos pessoalmente. Para fora, enviamos via Correios sem custo.",
  },
];

function FaqSection() {
  return (
    <section className="space-y-8">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Dúvidas frequentes
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
          Tudo que você precisa saber
        </h2>
      </div>
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`f-${i}`}
              className="rounded-xl border bg-card px-5 data-[state=open]:border-accent/40 data-[state=open]:shadow-md"
            >
              <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   9. Final CTA
--------------------------------------------------------------------------- */
function FinalCta() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-10 text-primary-foreground md:p-16">
      <AnimatedBg />
      <div className="relative mx-auto max-w-3xl text-center">
        <Sparkles className="mx-auto h-10 w-10 text-accent-foreground" />
        <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">
          Pronto para transformar amigos em recompensas?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
          Leva menos de 30 segundos para indicar. Em 1 dia útil falamos com seu amigo. Em até
          7 dias o cashback está no seu PIX.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <a href="#formulario">
              Indicar agora <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <a
              href={`https://wa.me/${WHATSAPP.number.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Quero saber mais sobre o programa Indique e Ganhe da Jotazo.")}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="mr-1 h-4 w-4" /> Falar no WhatsApp
            </a>
          </Button>
        </div>
        <p className="mx-auto mt-6 max-w-lg text-xs text-primary-foreground/70">
          Programa válido por tempo indeterminado. Sujeito a aprovação cadastral. Consulte o
          regulamento completo na página de{" "}
          <Link to="/regulamento" className="underline underline-offset-2">
            Regulamento
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Page
--------------------------------------------------------------------------- */
export default function IndiquePage() {
  return (
    <>
      <SEOHead
        title="Indique e Ganhe — Cashback, meses grátis e brindes"
        description="Indique amigos para a Jotazo Telecom e ganhe cashback no PIX, meses grátis e brindes exclusivos. Programa em níveis: Bronze, Prata, Ouro e Diamante."
        path="/indique"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", href: "/" },
          { name: "Indique e Ganhe", href: "/indique" },
        ]}
      />
      <OrganizationJsonLd />

      <div className="container space-y-20 py-8 md:py-12">
        <HeroSection />
        <ProofMarquee />
        <HowItWorks />
        <Calculator />
        <TierCards />
        <PrizesGallery />
        <ReferralForm />
        <FaqSection />
        <FinalCta />
      </div>
    </>
  );
}
