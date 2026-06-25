import { Link } from "react-router-dom";
import {
  Zap,
  Shield,
  Wifi,
  Headphones,
  Download,
  DollarSign,
  ChevronRight,
  Home,
  Briefcase,
  Tv,
  Gamepad2,
  Users,
  Building2,
  Layers,
  CheckCircle2,
  MapPin,
  Rocket,
  Monitor,
  Upload,
  Video,
  Pencil,
  Globe,
  Smartphone,
  Sparkles,
  Clock,
} from "lucide-react";

import { usePlans } from "@/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd, ItemListJsonLd, ProductJsonLd } from "@/components/seo/JsonLd";
import { AnswerFirstParagraph } from "@/components/seo/AnswerFirstParagraph";
import { CombosListSection } from "@/components/shop/CombosListSection";
import { FAQSection } from "@/components/home/FAQSection";
import fibraUltraImg from "@/assets/planos/fibra-ultra.jpg";
import combosImg from "@/assets/planos/combos.jpg";
import tvStreamingImg from "@/assets/planos/tv-streaming.jpg";
import internetMovelImg from "@/assets/planos/internet-movel.jpg";
import { AnimatedHeroBg } from "@/components/common/AnimatedHeroBg";
import { useInView } from "@/hooks/useInView";

/* ───── Hero collection cards ───── */
const collections = [
  {
    title: "Fibra Ultra",
    desc: "Até 1 Gbps de velocidade real com fibra óptica de última geração.",
    gradient: "from-blue-900 via-indigo-900 to-violet-800",
    image: fibraUltraImg,
  },
  {
    title: "Combos",
    desc: "Internet + TV + Móvel em um único pacote com desconto exclusivo.",
    gradient: "from-orange-900 via-amber-900 to-yellow-800",
    image: combosImg,
  },
  {
    title: "TV & Streaming",
    desc: "Canais ao vivo, apps de streaming e conteúdo sob demanda.",
    gradient: "from-purple-900 via-pink-900 to-fuchsia-800",
    image: tvStreamingImg,
  },
  {
    title: "Internet Móvel",
    desc: "Chip 5G com cobertura nacional e eSIM disponível.",
    gradient: "from-emerald-900 via-teal-900 to-cyan-800",
    image: internetMovelImg,
  },
];

/* ───── How it works steps ───── */
const steps = [
  { num: "01", icon: MapPin, title: "Verifique a cobertura", desc: "Consulte seu CEP e descubra se a fibra óptica já chegou no seu endereço." },
  { num: "02", icon: Layers, title: "Escolha seu plano", desc: "Compare velocidades, combos e benefícios — e escolha o ideal para você." },
  { num: "03", icon: Rocket, title: "Instalação em 24h", desc: "Agende a visita técnica e comece a navegar no mesmo dia, sem custo." },
];

/* ───── Speed comparison ───── */
const techBars = [
  { label: "Fibra óptica", speed: "1 Gbps", pct: 100, accent: true },
  { label: "Cabo coaxial", speed: "250 Mbps", pct: 25 },
  { label: "DSL / ADSL", speed: "50 Mbps", pct: 5 },
  { label: "Rádio / Satélite", speed: "30 Mbps", pct: 3 },
];

/* ───── Stats ───── */
const stats = [
  { value: "+5.000", label: "clientes conectados" },
  { value: "99,8%", label: "de uptime garantido" },
  { value: "20+", label: "cidades atendidas" },
  { value: "24/7", label: "suporte humano" },
];

/* ───── Usage profiles ───── */
const profiles = [
  { icon: Tv, title: "Streaming", gradient: "from-purple-900/40 to-fuchsia-900/20", speed: "200 Mbps", bullets: ["4K sem travamento", "Múltiplas telas simultâneas", "Smart TV e dispositivos móveis"] },
  { icon: Gamepad2, title: "Gamer", gradient: "from-emerald-900/40 to-cyan-900/20", speed: "400 Mbps", bullets: ["Baixa latência (ping)", "Download rápido de updates", "Streaming de gameplay"] },
  { icon: Briefcase, title: "Home Office", gradient: "from-blue-900/40 to-indigo-900/20", speed: "300 Mbps", bullets: ["Upload estável para calls", "VPN sem queda", "Múltiplos dispositivos"] },
  { icon: Users, title: "Família Grande", gradient: "from-orange-900/40 to-amber-900/20", speed: "500 Mbps", bullets: ["10+ dispositivos", "Streaming + games + trabalho", "Wi-Fi em todos os cômodos"] },
  { icon: Building2, title: "Empresa", gradient: "from-slate-800/40 to-zinc-900/20", speed: "600 Mbps", bullets: ["IP fixo disponível", "SLA de atendimento", "Suporte prioritário"] },
  { icon: Pencil, title: "Criador de Conteúdo", gradient: "from-pink-900/40 to-rose-900/20", speed: "500 Mbps", bullets: ["Upload de vídeos rápido", "Lives sem buffering", "Backup na nuvem"] },
];

/* ───── Included features ───── */
const includedFeatures = [
  { icon: Wifi, text: "Wi-Fi dual-band incluso" },
  { icon: Globe, text: "IP fixo disponível" },
  { icon: Shield, text: "Sem fidelidade" },
  { icon: Download, text: "Instalação grátis" },
  { icon: Headphones, text: "Suporte 24/7" },
  { icon: Smartphone, text: "App de gestão" },
];

function AnimatedBg() {
  return <AnimatedHeroBg />;
}

export default function PlanosPage() {
  const { data: plans = [] } = usePlans();

  return (
    <div className="space-y-20">
      <SEOHead
        title="Planos de Internet Fibra, 5G, TV e Combos | Jotazo Telecom"
        description="Compare todos os planos da Jotazo Telecom: fibra óptica até 1 Giga, internet móvel 5G, TV por assinatura e combos com desconto. Sem fidelidade e suporte humano via WhatsApp."
        path="/planos"
      />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Planos", href: "/planos" }]} />
      <OrganizationJsonLd />
      {plans.length > 0 && (
        <ItemListJsonLd
          name="Planos Jotazo Telecom"
          items={plans.map((p) => ({
            name: p.name,
            url: `/planos?q=${encodeURIComponent(p.name)}`,
            priceCents: p.priceCents,
          }))}
        />
      )}
      {plans.map((p) => (
        <ProductJsonLd
          key={p.id}
          name={p.name}
          description={p.description || `${p.name} — plano ${p.category} da Jotazo Telecom.`}
          url={`/planos?q=${encodeURIComponent(p.name)}`}
          priceCents={p.priceCents}
          category={p.category}
        />
      ))}

      {/* ═══════ HERO ═══════ */}
      <section className="relative left-1/2 -mt-20 w-screen -translate-x-1/2 overflow-hidden bg-primary text-primary-foreground">
        <AnimatedBg />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          {/* Left column */}
          <div className="space-y-6">
            <div className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Jotazo Internet</span>
            </div>

            <h1 className="animate-fade-in-up text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl" style={{ animationDelay: "100ms" }}>
              A internet que você merece na{" "}
              <span className="text-accent">sua casa</span>
            </h1>

            <p className="max-w-xl animate-fade-in-up text-base text-primary-foreground/80 md:text-lg" style={{ animationDelay: "200ms" }}>
              Fibra óptica, combos completos, TV e 5G — tudo sem fidelidade, com instalação gratuita e suporte 24/7.
            </p>

            <div className="flex animate-fade-in-up flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#planos">
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Ver planos
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <Link to="/personalize-seu-combo">Montar combo</Link>
              </Button>
            </div>

            <div className="flex animate-fade-in-up flex-wrap items-center gap-4 pt-2 text-xs text-primary-foreground/70" style={{ animationDelay: "400ms" }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Sem fidelidade</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Fibra óptica</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Suporte 24/7</span>
            </div>
          </div>

          {/* Right column — collection cards */}
          <div className="grid grid-cols-2 gap-3">
            {collections.map((c, i) => (
              <a
                key={c.title}
                href="#planos"
                className={`group animate-fade-in-up relative flex min-h-[180px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${c.gradient} border border-primary-foreground/10 p-5 transition-transform hover:-translate-y-1`}
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                <img
                  src={c.image}
                  alt={c.title}
                  width={768}
                  height={768}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative">
                  <h3 className="text-base font-semibold md:text-lg text-white">{c.title}</h3>
                  <p className="mt-1 text-xs text-white/80">{c.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ COMBOS ═══════ */}
      <section id="planos">
        <CombosListSection />
      </section>

      {/* ═══════ COMBO PROMO — 3 MESES GRÁTIS ═══════ */}
      <ComboPromoSection />

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="space-y-8">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Simples e rápido</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Como funciona</h2>
        </header>
        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connector line (desktop only) */}
          <div className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-12 hidden h-px border-t-2 border-dashed border-accent/30 md:block" />
          {steps.map((s) => (
            <div key={s.num} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 mb-4 flex h-24 w-24 flex-col items-center justify-center rounded-2xl bg-accent/10">
                <span className="text-2xl font-bold text-accent">{s.num}</span>
                <s.icon className="mt-1 h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ WHY FIBER — FULL-BLEED DARK ═══════ */}
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-primary text-primary-foreground">
        <AnimatedBg />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          {/* Speed bars */}
          <div className="space-y-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Comparativo de tecnologias</span>
            {techBars.map((t) => (
              <div key={t.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t.label}</span>
                  <span className={t.accent ? "font-bold text-accent" : "text-primary-foreground/60"}>{t.speed}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-primary-foreground/10">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${t.accent ? "bg-accent shadow-[0_0_12px_hsl(var(--accent)/0.5)]" : "bg-primary-foreground/30"}`}
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Text */}
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Fibra óptica de verdade</h2>
            <p className="text-primary-foreground/80">
              Diferente de tecnologias antigas, a fibra óptica transmite dados na velocidade da luz — sem perda de sinal, sem interferência e com a mesma velocidade de download e upload.
            </p>
            <ul className="space-y-3">
              {[
                "Latência ultra-baixa para games e chamadas",
                "Velocidade simétrica (download = upload)",
                "Sem interferência de clima ou distância",
                "Estabilidade 24h, sem quedas",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-primary-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════ STATS / SOCIAL PROOF ═══════ */}
      <section className="rounded-2xl bg-accent/5 px-6 py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <span className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{s.value}</span>
              <span className="mt-1 text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ USAGE PROFILES ═══════ */}
      <section className="space-y-8">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Para cada necessidade</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Conexão ideal para você</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Descubra qual velocidade combina com o seu perfil de uso.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p, i) => (
            <ProfileCard key={p.title} profile={p} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════ INCLUDED IN ALL PLANS ═══════ */}
      <section className="overflow-hidden rounded-2xl border border-accent/10 bg-accent/5 px-6 py-8">
        <h3 className="mb-5 text-center text-lg font-semibold tracking-tight">Incluso em todos os planos</h3>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-x-12">
          {includedFeatures.map((f) => (
            <div key={f.text} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <f.icon className="h-5 w-5 text-accent" />
              {f.text}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <FAQSection />

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-primary text-primary-foreground">
        <AnimatedBg />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          {/* Left */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Oferta especial</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Conecte-se agora</h2>
            <p className="max-w-md text-primary-foreground/80">
              Escolha seu plano e comece a navegar com a melhor fibra óptica da região. Sem fidelidade, sem multa.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#planos">
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Ver planos
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
                  Falar com consultor
                </a>
              </Button>
            </div>
          </div>
          {/* Right — mini stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 text-center">
                <span className="text-2xl font-bold text-accent">{s.value}</span>
                <span className="mt-1 text-xs text-primary-foreground/70">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileCard({ profile, index }: { profile: typeof profiles[number]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Icon = profile.icon;
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
      <h3 className="relative text-lg font-semibold tracking-tight">{profile.title}</h3>
      <ul className="relative mt-3 space-y-1.5">
        {profile.bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
            {b}
          </li>
        ))}
      </ul>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          A partir de {profile.speed}
        </span>
        <a href="#planos" className="text-xs font-medium text-accent hover:underline">
          Ver planos →
        </a>
      </div>
    </div>
  );
}

/* ───── Combo Promo Section: Fibra + TV + 5G — 3 meses grátis ───── */
function ComboPromoSection() {
  const items = [
    { icon: Wifi, title: "Fibra até 1 Gbps", desc: "Velocidade simétrica e Wi-Fi 6 incluso" },
    { icon: Tv, title: "TV + Streaming", desc: "Canais HD ao vivo + apps populares" },
    { icon: Smartphone, title: "Chip 5G nacional", desc: "Cobertura em todo o Brasil" },
  ];

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-primary text-primary-foreground">
      <AnimatedBg />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        {/* Left — pitch */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Oferta limitada</span>
          </div>

          <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            Fibra + TV + 5G
            <br />
            <span className="text-accent">3 meses grátis</span>
          </h2>

          <p className="max-w-md text-base text-primary-foreground/80">
            O combo completo da Jotazo: internet em fibra óptica, TV com canais HD e chip 5G nacional. Tudo em um único contrato e <strong className="text-primary-foreground">sem fidelidade</strong>.
          </p>

          {/* Price highlight */}
          <div className="inline-flex flex-col rounded-2xl border border-accent/30 bg-accent/10 px-6 py-4 shadow-[0_0_24px_hsl(var(--accent)/0.25)]">
            <span className="text-xs uppercase tracking-wider text-primary-foreground/60">
              De <span className="line-through">R$ 249,90/mês</span>
            </span>
            <span className="text-3xl font-bold text-accent md:text-4xl">R$ 0,00</span>
            <span className="text-xs text-primary-foreground/70">nos 3 primeiros meses</span>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-primary-foreground/70">
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Sem fidelidade</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Instalação grátis</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Cancele quando quiser</li>
          </ul>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/personalize-seu-combo">
                <ChevronRight className="mr-2 h-4 w-4" />
                Quero esse combo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
              <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>

        {/* Right — combo components */}
        <div className="space-y-3">
          {items.map((item, i) => (
            <ComboPromoItem key={item.title} item={item} index={i} />
          ))}
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-3 text-xs text-primary-foreground/80">
            <Clock className="h-4 w-4 text-accent" />
            Oferta válida por tempo limitado — garanta a sua hoje.
          </div>
        </div>
      </div>
    </section>
  );
}

function ComboPromoItem({
  item,
  index,
}: {
  item: { icon: typeof Wifi; title: string; desc: string };
  index: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Icon = item.icon;
  return (
    <div
      ref={ref}
      className={`group flex items-center gap-4 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 backdrop-blur-sm transition-all duration-500 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-primary-foreground/10 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent transition-all duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
        <p className="text-xs text-primary-foreground/70">{item.desc}</p>
      </div>
    </div>
  );
}
