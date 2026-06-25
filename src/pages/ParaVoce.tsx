import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Zap, Shield, Infinity as InfinityIcon, Wifi, Rocket, CheckCircle2, Star,
  Tv, Briefcase, Gamepad2, Video, Home, Download, Wrench, Headphones,
  Smartphone, PiggyBank, Package, Receipt, Sparkles, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd, ServiceJsonLd } from "@/components/seo/JsonLd";
import { AnswerFirstParagraph } from "@/components/seo/AnswerFirstParagraph";
import { PremiumPlansSection } from "@/components/shop/PremiumPlansSection";
import { CoverageCheckSection } from "@/components/home/CoverageCheckSection";
import { FAQSection } from "@/components/home/FAQSection";
import { useBaseUrl } from "@/hooks/useSiteSettings";
import { useInView } from "@/hooks/useInView";
import velocidadeSimetricaImg from "@/assets/velocidade-simetrica.webp";
import estabilidadeFibraImg from "@/assets/estabilidade-fibra.webp";
import wifi6InclusoImg from "@/assets/wifi6-incluso.jpg";
import semFranquiaImg from "@/assets/sem-franquia.jpg";
import faqMascote from "@/assets/jotazo-faq-mascote.png";

const benefits = [
  { icon: Zap, title: "Velocidade simétrica", desc: "Upload e download iguais — envie arquivos pesados sem travar." },
  { icon: Shield, title: "Estabilidade total", desc: "Fibra óptica imune a interferências, sinal estável 24h por dia." },
  { icon: InfinityIcon, title: "Sem franquia", desc: "Use à vontade, sem limites de consumo ou redução de velocidade." },
  { icon: Wifi, title: "Wi-Fi 6 incluso", desc: "Roteador de última geração cobrindo toda a sua casa." },
  { icon: Wrench, title: "Instalação rápida", desc: "Agendamento ágil e técnicos certificados em toda a região." },
  { icon: Headphones, title: "Suporte 24h", desc: "Atendimento humano sempre que você precisar, sem robô." },
];

const useCases = [
  { icon: Tv, label: "Streaming 4K" },
  { icon: Briefcase, label: "Home office" },
  { icon: Gamepad2, label: "Games online" },
  { icon: Video, label: "Videochamadas" },
  { icon: Home, label: "Smart home" },
  { icon: Download, label: "Downloads pesados" },
];

const collections = [
  { title: "Plano dedicado", desc: "Banda exclusiva só pra você — sem compartilhamento.", gradient: "from-blue-900 via-indigo-900 to-violet-800", image: velocidadeSimetricaImg },
  { title: "Wi-Fi 6 incluso", desc: "Tecnologia de ponta com alta velocidade e estabilidade.", gradient: "from-emerald-900 via-teal-900 to-cyan-800", image: wifi6InclusoImg },
  { title: "Sem franquia", desc: "Navegue à vontade, sem limites de consumo.", gradient: "from-orange-900 via-amber-900 to-yellow-800", image: semFranquiaImg },
  { title: "Estabilidade fibra", desc: "Sinal blindado contra interferências do clima.", gradient: "from-rose-900 via-pink-900 to-fuchsia-800", image: estabilidadeFibraImg },
];

const testimonials = [
  {
    name: "Mariana S.",
    text: "Trocamos da concorrência e a diferença foi imediata. Streaming em 4K na sala e home office no quarto, tudo funcionando perfeitamente.",
    role: "Cliente há 1 ano",
    photo: "https://i.pravatar.cc/120?img=47",
  },
  {
    name: "Rafael T.",
    text: "Instalação rápida e o Wi-Fi 6 cobre minha casa inteira sem repetidor. O suporte atende na hora quando precisei.",
    role: "Cliente há 8 meses",
    photo: "https://i.pravatar.cc/120?img=12",
  },
  {
    name: "Camila A.",
    text: "Velocidade simétrica fez toda a diferença pro meu trabalho. Upload de vídeos pesados em minutos. Recomendo demais!",
    role: "Cliente há 5 meses",
    photo: "https://i.pravatar.cc/120?img=32",
  },
];

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
      <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-accent/30 blur-3xl animate-blob-drift" />
      <div
        className="absolute -left-24 top-1/4 h-[480px] w-[480px] rounded-full bg-primary-foreground/10 blur-3xl animate-blob-drift"
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

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

export default function ParaVocePage() {
  const baseUrl = useBaseUrl();
  const pageUrl = `${baseUrl}/para-voce`;

  return (
    <>
      <SEOHead
        title="Internet Fibra Óptica Residencial em Apiaí/SP e Vale do Ribeira"
        description="Planos de internet fibra óptica residencial com velocidade simétrica, Wi-Fi 6 incluso, sem fidelidade e instalação rápida em Apiaí/SP e região. Confira os planos da Jotazo."
        path="/para-voce"
      />
      <Helmet>
        <meta name="theme-color" content="#1e3a5f" />
      </Helmet>
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Para Você", href: "/para-voce" }]} />
      <OrganizationJsonLd />
      <ServiceJsonLd
        name="Internet Fibra Óptica Residencial"
        description="Planos de internet fibra óptica residencial com velocidade simétrica de 300 Mbps a 1 Gbps, Wi-Fi 6 incluso, sem fidelidade e instalação rápida em Apiaí/SP e região do Vale do Ribeira."
        serviceType="Internet Service Provider"
        url="/para-voce"
        areaServed={["Apiaí", "Registro", "Pariquera-Açu", "Jacupiranga", "Cajati", "Iguape"]}
      />
      <AnswerFirstParagraph>
        A Jotazo Telecom oferece internet fibra óptica residencial com velocidade simétrica de 300 Mbps a 1 Gbps, Wi-Fi 6 incluso, sem fidelidade e suporte humano 24/7. Atende Apiaí/SP e toda a região do Vale do Ribeira com instalação rápida e gratuita.
      </AnswerFirstParagraph>

      {/* HERO */}
      <section className="relative left-1/2 -mt-10 w-screen -translate-x-1/2 overflow-hidden bg-primary text-primary-foreground">
        <AnimatedBg />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="space-y-6">
            <div className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5">
              <Wifi className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Jotazo Fibra</span>
            </div>
            <h1 className="animate-fade-in-up text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl" style={{ animationDelay: "100ms" }}>
              Internet fibra para sua casa com <span className="text-accent">velocidade real</span>
            </h1>
            <p className="max-w-xl animate-fade-in-up text-base text-primary-foreground/80 md:text-lg" style={{ animationDelay: "200ms" }}>
              Streaming, home office e jogos sem travamentos. Velocidade simétrica, Wi-Fi 6 incluso e instalação rápida em toda a região.
            </p>
            <div className="flex animate-fade-in-up flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#planos">
                  <Rocket className="mr-2 h-4 w-4" />
                  Ver planos fibra
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <a href="#cobertura">Verificar cobertura</a>
              </Button>
            </div>
            <div className="flex animate-fade-in-up flex-wrap items-center gap-4 pt-2 text-xs text-primary-foreground/70" style={{ animationDelay: "400ms" }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Sem fidelidade</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Wi-Fi 6 incluso</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Velocidade simétrica</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {collections.map((c, i) => (
              <div
                key={c.title}
                className={`group relative animate-fade-in-up flex min-h-[160px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${c.gradient} p-5 border border-primary-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/20`}
                style={{ animationDelay: `${300 + i * 120}ms` }}
              >
                {c.image && (
                  <>
                    <img
                      src={c.image}
                      alt={c.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                  </>
                )}
                <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <h3 className="relative text-base font-semibold md:text-lg">{c.title}</h3>
                <p className="relative mt-1 text-xs text-primary-foreground/70">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-20 space-y-20">
      {/* PLANS */}
      <div id="planos">
        <PremiumPlansSection categoryFilter="fibra" />
      </div>

      {/* BENEFITS */}
      <AnimatedSection className="space-y-8">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Por que escolher</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Fibra óptica de verdade</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Tecnologia de ponta que garante a melhor experiência em internet residencial.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <BenefitCard key={b.title} benefit={b} index={i} />
          ))}
        </div>
      </AnimatedSection>

      {/* USE CASES */}
      <AnimatedSection className="space-y-6">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Para tudo que você faz</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Fibra para cada momento</h2>
        </header>
        <div className="flex flex-wrap justify-center gap-3">
          {useCases.map((g, i) => (
            <div
              key={g.label}
              className="group flex animate-fade-in-up items-center gap-2 rounded-full border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <g.icon className="h-4 w-4 text-accent transition-transform duration-300 group-hover:scale-110" />
              {g.label}
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* COVERAGE */}
      <div id="cobertura">
        <CoverageCheckSection />
      </div>

      {/* COMBO BENEFITS */}
      <AnimatedSection className="space-y-8">
        <header className="space-y-2 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Economize no combo
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Por que contratar tudo no <span className="text-accent">combo</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Junte fibra, móvel 5G e TV em um único plano e ganhe descontos, fatura unificada e benefícios exclusivos.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: PiggyBank, title: "Até 30% de desconto", desc: "Quanto mais serviços no combo, maior a sua economia mensal." },
            { icon: Receipt, title: "Fatura única", desc: "Tudo em uma conta só, com vencimento no dia que combina com você." },
            { icon: Package, title: "Mais serviços, menos preço", desc: "Internet, móvel 5G e TV juntos saem mais em conta que separados." },
            { icon: Smartphone, title: "Móvel 5G incluso", desc: "Chip com internet 5G de alta velocidade integrado ao seu plano." },
          ].map((b, i) => (
            <ComboBenefitCard key={b.title} benefit={b} index={i} />
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="group bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/planos?cat=combo">
              Ver combos disponíveis
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="group border-accent/40 text-foreground hover:border-accent hover:bg-accent/10 hover:text-foreground">
            <Link to="/monte-seu-combo">
              <Package className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              Monte seu combo personalizado
            </Link>
          </Button>
        </div>
      </AnimatedSection>

      {/* TESTIMONIALS */}
      <AnimatedSection className="space-y-8">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Quem usa, recomenda</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Experiências reais com fibra</h2>
        </header>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
        </div>
      </AnimatedSection>

      {/* CTA FINAL */}
      <AnimatedSection>
        <div className="relative overflow-hidden rounded-[20px] border border-primary-foreground/10 bg-primary p-10 text-primary-foreground md:p-14">
          <CtaAnimatedBg />
          <div className="relative mx-auto max-w-3xl space-y-5 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Pronto para uma fibra de verdade?
            </h2>
            <p className="text-primary-foreground/80">
              Combine com móvel 5G e TV e economize ainda mais. Sem fidelidade, sem multa.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="group relative bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#planos">
                  <span className="absolute inset-0 -z-10 rounded-md bg-accent/40 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                  <Rocket className="mr-2 h-4 w-4" />
                  Escolher meu plano
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <Link to="/planos?cat=combo">Ver combos</Link>
              </Button>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* FAQ */}
      <FAQSection variant="split" image={faqMascote} imageAlt="Mascote Jotazo Telecom" />
      </div>
    </>
  );
}

function BenefitCard({ benefit, index }: { benefit: typeof benefits[number]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Icon = benefit.icon;
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-accent group-hover:text-accent-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="relative text-lg font-semibold tracking-tight">{benefit.title}</h3>
      <p className="relative mt-1 text-sm text-muted-foreground">{benefit.desc}</p>
    </div>
  );
}

function TestimonialCard({ t, index }: { t: typeof testimonials[number]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="flex items-center gap-3">
        <img
          src={t.photo}
          alt={t.name}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.role}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">"{t.text}"</p>
      <div className="mt-auto flex items-end justify-between pt-3">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-yellow-400 text-yellow-400"
              style={inView ? { animation: `star-pop 0.4s ease-out ${index * 120 + i * 80 + 200}ms both` } : { opacity: 0 }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-xs text-muted-foreground">Google</span>
        </div>
      </div>
    </div>
  );
}

function CtaAnimatedBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary-foreground)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
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

function ComboBenefitCard({ benefit, index }: { benefit: { icon: typeof Zap; title: string; desc: string }; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Icon = benefit.icon;
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-card to-accent/5 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-accent group-hover:text-accent-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="relative text-lg font-semibold tracking-tight">{benefit.title}</h3>
      <p className="relative mt-1 text-sm text-muted-foreground">{benefit.desc}</p>
    </div>
  );
}
