import { Link } from "react-router-dom";
import { Play, Tv, Film, Trophy, Baby, Music, Star, Clapperboard, Sparkles, Users, Smartphone, Wifi, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd, ServiceJsonLd } from "@/components/seo/JsonLd";
import { AnswerFirstParagraph } from "@/components/seo/AnswerFirstParagraph";
import { TVStreamingSection } from "@/components/home/TVStreamingSection";
import { NetflixCatalogSection } from "@/components/home/NetflixCatalogSection";
import { TVPlansSection } from "@/components/home/TVPlansSection";
import { TVSvaSection } from "@/components/home/TVSvaSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FAQSection } from "@/components/home/FAQSection";
import { BenefitCard } from "@/components/BenefitCard";
import { AnimatedHeroBg } from "@/components/common/AnimatedHeroBg";
import cinemaEmCasaImg from "@/assets/streaming/cinema-em-casa.jpg";
import maratonaSeriesImg from "@/assets/streaming/maratona-series.jpg";
import esportesAoVivoImg from "@/assets/streaming/esportes-ao-vivo.jpg";
import universoInfantilImg from "@/assets/streaming/universo-infantil.jpg";

const benefits = [
  { icon: Tv, title: "+100 Canais HD", desc: "Abertos, fechados, premium e 4K." },
  { icon: Film, title: "Filmes em estreia", desc: "Lançamentos toda semana, direto do cinema." },
  { icon: Trophy, title: "Esportes ao vivo", desc: "Brasileirão, Champions, NBA, UFC e Fórmula 1." },
  { icon: Smartphone, title: "Multi-tela", desc: "Assista no celular, tablet, smart TV ou notebook." },
  { icon: Users, title: "Para toda família", desc: "Perfis separados, controle parental e infantil." },
  { icon: Wifi, title: "Sem antena, sem fios", desc: "Tudo via internet — fácil de instalar." },
];

const genres = [
  { icon: Film, label: "Filmes" },
  { icon: Clapperboard, label: "Séries" },
  { icon: Trophy, label: "Esportes" },
  { icon: Baby, label: "Infantil" },
  { icon: Music, label: "Música" },
  { icon: Sparkles, label: "Documentários" },
  { icon: Star, label: "Variedades" },
];

const collections = [
  {
    title: "Cinema em casa",
    desc: "Mais de 5.000 títulos sob demanda, dos clássicos aos lançamentos.",
    gradient: "from-rose-900 via-red-900 to-orange-800",
    image: cinemaEmCasaImg,
  },
  {
    title: "Maratona de séries",
    desc: "Temporadas completas das produções mais comentadas do mundo.",
    gradient: "from-indigo-900 via-purple-900 to-fuchsia-800",
    image: maratonaSeriesImg,
  },
  {
    title: "Esportes ao vivo",
    desc: "Todas as ligas, todas as partidas — sem perder um lance sequer.",
    gradient: "from-emerald-900 via-green-900 to-teal-800",
    image: esportesAoVivoImg,
  },
  {
    title: "Universo infantil",
    desc: "Desenhos, educativos e filmes para a criançada se divertir com segurança.",
    gradient: "from-sky-900 via-cyan-900 to-blue-800",
    image: universoInfantilImg,
  },
];

function AnimatedBg() {
  return <AnimatedHeroBg />;
}

export default function StreamingPage() {
  return (
    <>
      <SEOHead
        title="Streaming e TV — Filmes, Séries, Esportes ao Vivo | Jotazo"
        description="Plataforma completa de streaming com +100 Canais HD, filmes em estreia, séries exclusivas, esportes ao vivo e conteúdo infantil. Multi-tela, sem antena."
        path="/streaming"
      />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Streaming", href: "/streaming" }]} />
      <OrganizationJsonLd />
      <ServiceJsonLd
        name="TV por Assinatura e Streaming"
        description="Pacotes de TV por assinatura da Jotazo Telecom com mais de 100 canais HD, filmes em estreia, esportes ao vivo, multi-tela e perfis para toda a família — tudo via internet, sem antena."
        serviceType="Pay TV Service"
        url="/streaming"
      />
      <AnswerFirstParagraph>
        A Jotazo Telecom oferece TV por assinatura e streaming com mais de 100 canais HD, filmes em estreia, esportes ao vivo (Brasileirão, Champions, NBA, UFC, F1) e suporte multi-tela. Tudo via internet, sem antena ou fios.
      </AnswerFirstParagraph>

      {/* HERO */}
      <section className="relative left-1/2 -mt-10 w-screen -translate-x-1/2 overflow-hidden bg-primary text-primary-foreground">
        <AnimatedBg />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="space-y-6">
            <div className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5">
              <Tv className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Jotazo Streaming</span>
            </div>
            <h1 className="animate-fade-in-up text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl" style={{ animationDelay: "100ms" }}>
              Tudo o que você ama em <span className="text-accent">um só lugar</span>
            </h1>
            <p className="max-w-xl animate-fade-in-up text-base text-primary-foreground/80 md:text-lg" style={{ animationDelay: "200ms" }}>
              Filmes, séries, esportes ao vivo, infantil e muito mais. +100 Canais em HD, multi-tela e sem complicação. Cancele quando quiser.
            </p>
            <div className="flex animate-fade-in-up flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#planos">
                  <Play className="mr-2 h-4 w-4" />
                  Ver planos
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <a href="#catalogo">Explorar catálogo</a>
              </Button>
            </div>
            <div className="flex animate-fade-in-up flex-wrap items-center gap-4 pt-2 text-xs text-primary-foreground/70" style={{ animationDelay: "400ms" }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Sem fidelidade</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Multi-tela</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> 4K disponível</span>
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
      {/* PLANOS */}
      <div id="planos">
        <TVPlansSection />
      </div>

      {/* SVAs DE TV */}
      <TVSvaSection />

      {/* BENEFITS */}
      <section className="space-y-8">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Por que escolher</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">A melhor experiência de entretenimento</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Esqueça antena, parabólica e fios pela casa. Com o Jotazo Streaming você assiste tudo via internet, em qualquer dispositivo.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <BenefitCard key={b.title} icon={b.icon} title={b.title} description={b.desc} index={i} />
          ))}
        </div>
      </section>

      {/* GENRES */}
      <section className="space-y-6">
        <header className="space-y-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Conteúdo para todos</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Seu gosto, sua programação</h2>
        </header>
        <div className="flex flex-wrap justify-center gap-3">
          {genres.map((g) => (
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

      {/* CHANNELS (reuso) */}
      <TVStreamingSection />

      {/* CATÁLOGO */}
      <div id="catalogo">
        <NetflixCatalogSection />
      </div>

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* CTA FINAL */}
      <section className="relative overflow-hidden rounded-[20px] bg-primary p-10 text-primary-foreground md:p-14">
        <AnimatedHeroBg />
        <div className="relative mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Pronto para curtir o melhor do entretenimento?
          </h2>
          <p className="text-primary-foreground/80">
            Combine fibra óptica + TV e economize. Cancele quando quiser, sem multa.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <a href="#planos">
                <Play className="mr-2 h-4 w-4" />
                Assinar agora
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
