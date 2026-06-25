import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Smartphone, Signal, Zap, Globe, Shield, Wifi, Gamepad2, Video, MapPin, Briefcase, MessageCircle, Music, CheckCircle2, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, FAQPageJsonLd, OrganizationJsonLd, ServiceJsonLd } from "@/components/seo/JsonLd";
import { AnswerFirstParagraph } from "@/components/seo/AnswerFirstParagraph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBaseUrl } from "@/hooks/useSiteSettings";
import { Chip5GLaunchSection } from "@/components/home/Chip5GLaunchSection";
import { FAQSection } from "@/components/home/FAQSection";
import { PageTopBanner } from "@/components/layout/PageTopBanner";
import { BenefitCard } from "@/components/BenefitCard";
import { PortabilidadeSection } from "@/components/internet-movel/PortabilidadeSection";
import velocidadeExtremaImg from "@/assets/internet-movel/velocidade-extrema.jpg";
import coberturaNacionalImg from "@/assets/internet-movel/cobertura-nacional.jpg";
import dualChannelImg from "@/assets/internet-movel/dual-channel.jpg";
import esimChipImg from "@/assets/internet-movel/esim-chip.jpg";

const benefits = [
  { icon: Zap, title: "Velocidade 5G real", desc: "Downloads ultrarrápidos e latência mínima para tudo que você faz." },
  { icon: Globe, title: "Cobertura nacional", desc: "Conectado em todo o Brasil com a melhor rede 5G do país." },
  { icon: Signal, title: "Dual Channel", desc: "Tecnologia avançada que combina duas bandas para máxima estabilidade." },
  { icon: Smartphone, title: "eSIM + chip físico", desc: "Escolha o formato que preferir — ativação instantânea via eSIM." },
  { icon: Wifi, title: "Hotspot ilimitado", desc: "Compartilhe sua internet 5G com outros dispositivos sem custo extra." },
  { icon: Shield, title: "Sem fidelidade", desc: "Liberdade total: cancele ou troque de plano quando quiser." },
];

const useCases = [
  { icon: MessageCircle, label: "Redes sociais" },
  { icon: Video, label: "Streaming" },
  { icon: Gamepad2, label: "Games" },
  { icon: Briefcase, label: "Trabalho remoto" },
  { icon: MapPin, label: "GPS / Maps" },
  { icon: Music, label: "Música" },
];

const collections = [
  {
    title: "Velocidade extrema",
    desc: "Navegue, baixe e transmita na velocidade que só o 5G oferece.",
    gradient: "from-blue-900 via-indigo-900 to-violet-800",
    image: velocidadeExtremaImg,
  },
  {
    title: "Cobertura nacional",
    desc: "Presente nas principais cidades e em constante expansão pelo Brasil.",
    gradient: "from-emerald-900 via-teal-900 to-cyan-800",
    image: coberturaNacionalImg,
  },
  {
    title: "Dual Channel",
    desc: "Duas bandas simultâneas para conexão mais estável e potente.",
    gradient: "from-orange-900 via-amber-900 to-yellow-800",
    image: dualChannelImg,
  },
  {
    title: "eSIM + Chip",
    desc: "Ative seu plano instantaneamente via eSIM ou receba o chip em casa.",
    gradient: "from-rose-900 via-pink-900 to-fuchsia-800",
    image: esimChipImg,
  },
];

const testimonials = [
  {
    name: "Pedro H.",
    text: "Nunca imaginei ter essa velocidade no celular. Jogo online sem lag e faço calls de trabalho sem travar.",
    role: "Cliente há 6 meses",
    photo: "https://lcbgiersxjeyjcstrxmc.supabase.co/storage/v1/object/public/site-assets/testimonials/pedro.webp",
  },
  {
    name: "Juliana R.",
    text: "Uso o hotspot do 5G para trabalhar de qualquer lugar. É como ter fibra no bolso!",
    role: "Cliente há 1 ano",
    photo: "https://lcbgiersxjeyjcstrxmc.supabase.co/storage/v1/object/public/site-assets/testimonials/juliana.webp",
  },
  {
    name: "Lucas M.",
    text: "Migrei da concorrência e a diferença é absurda. Sinal forte, velocidade real e sem surpresas na conta.",
    role: "Cliente há 4 meses",
    photo: "https://lcbgiersxjeyjcstrxmc.supabase.co/storage/v1/object/public/site-assets/testimonials/lucas.webp",
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

export default function InternetMovelPage() {
  const baseUrl = useBaseUrl();
  const pageUrl = `${baseUrl}/internet-movel`;

  const { data: faqs = [] } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("question, answer")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    name: "Internet Móvel 5G — Planos com Velocidade Real",
    description: "Planos de internet móvel 5G com cobertura nacional, tecnologia Dual Channel, eSIM, hotspot ilimitado e sem fidelidade. Conheça o melhor 5G do Brasil.",
    url: pageUrl,
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", "@id": `${baseUrl}/#website`, name: "Jotazo Telecom", url: baseUrl },
    provider: { "@type": "Organization", "@id": `${baseUrl}/#organization`, name: "Jotazo Telecom" },
    about: {
      "@type": "OfferCatalog",
      name: "Planos de Internet Móvel 5G",
      description: "Planos 5G com tecnologia Dual Channel, eSIM e hotspot ilimitado.",
      itemListElement: [
        { "@type": "Offer", name: "Plano 5G Básico", priceCurrency: "BRL", availability: "https://schema.org/InStock", url: pageUrl },
        { "@type": "Offer", name: "Plano 5G Black", priceCurrency: "BRL", availability: "https://schema.org/InStock", url: pageUrl },
      ],
    },
  };

  return (
    <>
      <SEOHead
        title="Internet Móvel 5G — Planos com Velocidade Real"
        description="Planos de internet móvel 5G com cobertura nacional, tecnologia Dual Channel, eSIM, hotspot ilimitado e sem fidelidade. Conheça o melhor 5G do Brasil."
        path="/internet-movel"
        ogImage="https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9d79e0ff-8db3-456b-bcec-5c1086ed70d5"
      />
      <Helmet>
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="theme-color" content="#1e3a5f" />
        <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
      </Helmet>
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Internet Móvel 5G", href: "/internet-movel" }]} />
      {faqs.length > 0 && <FAQPageJsonLd faqs={faqs} />}
      <OrganizationJsonLd />
      <ServiceJsonLd
        name="Internet Móvel 5G"
        description="Chip 5G da Jotazo Telecom com cobertura nacional, velocidade real 5G, eSIM disponível, hotspot ilimitado e sem fidelidade."
        serviceType="Mobile Internet Service"
        url="/internet-movel"
      />
      <AnswerFirstParagraph>
        A Jotazo Telecom oferece chip de internet móvel 5G com cobertura nacional, velocidade real 5G, eSIM, hotspot ilimitado e sem fidelidade. Planos a partir de pacotes leves até ilimitados, com ativação instantânea via eSIM ou entrega do chip em casa.
      </AnswerFirstParagraph>


      {/* HERO (before plans) */}
      <section className="relative left-1/2 -mt-10 w-screen -translate-x-1/2 overflow-hidden bg-primary text-primary-foreground">
        <AnimatedBg />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="space-y-6">
            <div className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5">
              <Signal className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Jotazo 5G</span>
            </div>
            <h1 className="animate-fade-in-up text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl" style={{ animationDelay: "100ms" }}>
              O 5G mais rápido do Brasil na <span className="text-accent">palma da sua mão</span>
            </h1>
            <p className="max-w-xl animate-fade-in-up text-base text-primary-foreground/80 md:text-lg" style={{ animationDelay: "200ms" }}>
              Internet móvel com tecnologia Dual Channel, cobertura nacional, eSIM e hotspot ilimitado. Sem fidelidade, sem surpresas.
            </p>
            <div className="flex animate-fade-in-up flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#planos">
                  <Rocket className="mr-2 h-4 w-4" />
                  Ver planos 5G
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <Link to="/planos?cat=combo">Montar combo</Link>
              </Button>
            </div>
            <div className="flex animate-fade-in-up flex-wrap items-center gap-4 pt-2 text-xs text-primary-foreground/70" style={{ animationDelay: "400ms" }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Sem fidelidade</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Dual Channel</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> eSIM disponível</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {collections.map((c, i) => (
              <div
                key={c.title}
                className={`group animate-fade-in-up relative flex min-h-[180px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${c.gradient} p-5 border border-primary-foreground/10 transition-transform hover:-translate-y-1`}
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
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-20 space-y-20">
      {/* PLANS */}
      <div id="planos">
        <Chip5GLaunchSection onlyChip="5g" hideLaunchBadges titleOverride="Escolha o melhor Plano 5G" stackedLayout />
      </div>

      {/* BENEFITS */}
      <section className="space-y-8">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Por que escolher</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Internet móvel de verdade</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Tecnologia 5G de última geração com cobertura real, velocidade consistente e liberdade total.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <BenefitCard key={b.title} icon={b.icon} title={b.title} description={b.desc} index={i} />
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="space-y-6">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Para tudo que você faz</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">5G para cada momento</h2>
        </header>
        <div className="flex flex-wrap justify-center gap-3">
          {useCases.map((g) => (
            <div
              key={g.label}
              className="flex items-center gap-2 rounded-full border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:bg-secondary hover:shadow-md"
            >
              <g.icon className="h-4 w-4 text-accent" />
              {g.label}
            </div>
          ))}
        </div>
      </section>

      {/* PORTABILIDADE */}
      <PortabilidadeSection />

      {/* TESTIMONIALS */}
      <section className="space-y-8">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Quem usa, recomenda</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Experiências reais com 5G</h2>
        </header>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
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
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">"{t.text}"</p>
              <div className="mt-auto flex items-end justify-between pt-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
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
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden rounded-[20px] bg-primary p-10 text-primary-foreground md:p-14">
        <AnimatedBg />
        <div className="relative mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Pronto para experimentar o 5G de verdade?
          </h2>
          <p className="text-primary-foreground/80">
            Combine com fibra óptica e economize ainda mais. Sem fidelidade, sem multa.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <a href="#planos">
                <Rocket className="mr-2 h-4 w-4" />
                Escolher meu plano
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
              <Link to="/planos?cat=combo">Ver combos com fibra</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />
      </div>
    </>
  );
}
