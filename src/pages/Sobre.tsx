import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import jotazoLoja from "@/assets/jotazo-loja.webp";
import {
  Target,
  Eye,
  Heart,
  Wifi,
  Users,
  MapPin,
  Calendar,
  Newspaper,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Facebook,
  Instagram,
} from "lucide-react";
import { WhyJotazoSection } from "@/components/home/WhyJotazoSection";
import { InstagramFeedSection } from "@/components/sobre/InstagramFeedSection";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const timeline = [
  { year: "2009", title: "Fundação", description: "A Jotazo Telecom nasce com a missão de levar internet de qualidade para o interior do Vale do Ribeira." },
  { year: "2017", title: "Expansão regional", description: "Ampliação da rede para novas cidades da região, alcançando milhares de novos lares." },
  { year: "2019", title: "100% Fibra Óptica", description: "Toda a rede migra para fibra óptica FTTH, garantindo velocidade e estabilidade superiores." },
  { year: "2021", title: "Lançamento da TV", description: "Estreia do serviço de TV por assinatura com mais de 100 canais e conteúdo on demand." },
  { year: "2023", title: "Chip 5G Jotazo", description: "Lançamento do chip móvel 5G, levando conectividade para além da fibra." },
  { year: "2025", title: "Referência regional", description: "Consolidação como provedor referência em qualidade, atendimento e inovação no Vale do Ribeira." },
  { year: "2026", title: "Reconhecimento nacional", description: "A Jotazo foi premiada no maior evento de Provedores do mundo, a AGC, como Provedor Destaque Regional." },
];

const stats = [
  { value: "20+", label: "Cidades atendidas" },
  { value: "12 mil+", label: "Clientes conectados" },
  { value: "3.000+ km", label: "De fibra óptica" },
  { value: "17 anos", label: "De mercado" },
];

const links = [
  { to: "/planos", icon: Wifi, title: "Planos", description: "Conheça nossos planos de internet, TV e combo." },
  { to: "/cobertura", icon: MapPin, title: "Cobertura", description: "Veja se sua região é atendida pela Jotazo." },
  { to: "/blog", icon: Newspaper, title: "Blog", description: "Notícias, dicas e novidades sobre tecnologia." },
  { to: "/ouvidoria", icon: ShieldCheck, title: "Ouvidoria", description: "Canal de escuta, sigilo e transparência." },
  { to: "/atendimento", icon: Headphones, title: "Atendimento", description: "Fale conosco por chat, telefone ou WhatsApp." },
  { to: "/trabalhe-conosco", icon: Users, title: "Trabalhe Conosco", description: "Confira vagas e envie seu currículo." },
];

function TimelineItem({ item, index }: { item: { year: string; title: string; description: string }; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);
  const isEven = index % 2 === 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Observer para entrada inicial (animação de aparecer uma única vez)
    const enterObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          enterObs.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
    );
    enterObs.observe(el);

    // Tracker de scroll: marca como "active" quando o item está próximo do centro da viewport
    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - vh * 0.5);
      // Considera "ativo" quando o item está dentro de 25% da viewport ao redor do centro
      setActive(distance < vh * 0.25);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      enterObs.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col gap-3 md:flex-row md:items-start transition-all duration-700 ease-out will-change-transform",
        isEven ? "md:flex-row" : "md:flex-row-reverse",
        visible
          ? "opacity-100 translate-y-0 md:translate-x-0"
          : cn(
              "opacity-0 translate-y-8",
              isEven ? "md:-translate-x-10" : "md:translate-x-10",
            ),
      )}
    >
      <div className={cn("flex-1", isEven ? "md:text-right md:pr-10" : "md:text-left md:pl-10")}>
        <Card
          className={cn(
            "inline-block backdrop-blur-sm transition-all duration-500",
            active
              ? "border-accent bg-card scale-[1.03] shadow-xl shadow-accent/30 -translate-y-0.5"
              : visible
                ? "border-accent/20 bg-card/80 shadow-lg shadow-accent/10"
                : "border-accent/20 bg-card/80 shadow-none",
          )}
        >
          <CardContent className="p-5">
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-widest transition-colors duration-300",
                active ? "text-accent" : "text-accent/80",
              )}
            >
              {item.year}
            </span>
            <h3
              className={cn(
                "mt-1 text-sm font-semibold transition-colors duration-300",
                active ? "text-primary" : "",
              )}
            >
              {item.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      </div>
      <div
        className={cn(
          "absolute left-4 top-5 hidden h-4 w-4 -translate-x-1/2 rounded-full md:left-1/2 md:block transition-all duration-500",
          active
            ? "scale-150 bg-accent shadow-[0_0_0_5px_hsl(var(--background)),0_0_28px_hsl(var(--accent)/0.95)]"
            : visible
              ? "scale-100 bg-accent shadow-[0_0_0_4px_hsl(var(--background)),0_0_18px_hsl(var(--accent)/0.7)]"
              : "scale-50 bg-border shadow-none",
        )}
      />
      <div className="hidden flex-1 md:block" />
    </div>
  );
}

function TimelineTrack({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Início: topo do container atinge a metade da viewport.
      // Fim: base do container atinge a metade da viewport.
      const start = vh * 0.5;
      const end = -rect.height + vh * 0.5;
      const denom = start - end || 1;
      const raw = (start - rect.top) / denom;
      setProgress(Math.max(0, Math.min(1, raw)));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative mx-auto max-w-3xl">
      {/* Trilha de fundo */}
      <div className="absolute left-4 top-0 hidden h-full w-[2px] bg-border md:left-1/2 md:-translate-x-1/2 md:block" aria-hidden />
      {/* Trilha preenchida (gradiente que cresce com o scroll) */}
      <div
        className="absolute left-4 top-0 hidden w-[2px] rounded-full bg-gradient-to-b from-accent via-accent to-primary md:left-1/2 md:-translate-x-1/2 md:block"
        style={{
          height: `${progress * 100}%`,
          boxShadow: "0 0 12px hsl(var(--accent) / 0.6)",
          transition: "height 120ms linear",
        }}
        aria-hidden
      />
      <div className="space-y-6">{children}</div>
    </div>
  );
}


function SobreSocialLinks() {
  const settings = useSiteSettings();
  const socials = [
    { icon: Facebook, href: settings.facebook_url, label: "Facebook" },
    { icon: Instagram, href: settings.instagram_url, label: "Instagram" },
  ].filter((s) => s.href && s.href.trim() && s.href !== "#");

  if (socials.length === 0) return null;

  return (
    <div className="flex items-center gap-4 pt-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-accent">
        Siga a Jotazo
      </span>
      <div className="flex items-center gap-2">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-all hover:border-accent hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:shadow-accent/30"
          >
            <s.icon className="h-5 w-5" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function SobrePage() {
  return (
    <div className="space-y-20">
      <SEOHead
        title="Sobre a Jotazo: Diferenciais em Internet Fibra e TV"
        description="Conheça a Jotazo Telecom: velocidade real em fibra óptica, estabilidade 24h, suporte humano via WhatsApp, Wi-Fi dual-band, instalação ágil e melhor custo-benefício no Vale do Ribeira."
        path="/sobre"
      />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Sobre", href: "/sobre" }]} />
      <OrganizationJsonLd />

      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-background/10 blur-3xl" />
        <div className="relative grid gap-10 p-8 md:grid-cols-2 md:items-center md:p-14">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Sobre a Jotazo
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Conectando pessoas, transformando o Vale do Ribeira
            </h1>
            <p className="max-w-lg text-base text-primary-foreground/85 md:text-lg">
              Internet de verdade, atendimento humano e tecnologia de ponta. Há 17 anos
              construindo uma rede que aproxima cidades, comunidades e pessoas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/planos">
                  Ver planos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
              >
                <a href="#nossa-historia">Conheça a história</a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Empresa local
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Suporte humano
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Rede própria
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {stats.map((b) => (
              <div
                key={b.label}
                className="flex items-center justify-between rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 px-5 py-4 backdrop-blur"
              >
                <span className="text-sm text-primary-foreground/80">{b.label}</span>
                <span className="text-2xl font-bold text-accent">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTAQUE COM IMAGEM */}
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Nossa história
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Nascemos no interior, crescemos com as pessoas
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            A Jotazo começou pequena, dentro de uma comunidade que precisava de algo simples e ao mesmo tempo essencial: uma internet que funcionasse de verdade. Foi conversando com vizinhos, ouvindo comerciantes e visitando famílias que entendemos qual seria o nosso caminho — conectar pessoas, e não apenas residências.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Ao longo dos anos, expandimos nossa rede para novas cidades, mas mantivemos o jeito de quem cresce junto com a comunidade: atendimento próximo, equipe local e o compromisso de estar perto quando você precisa. Cada cabo que passa, cada cliente que entra, faz parte de uma história que construímos com quem confia na gente.
          </p>
          <SobreSocialLinks />
        </div>
        <div className="relative overflow-hidden rounded-[20px] border bg-muted shadow-lg aspect-[4/3]">
          <img
            src={jotazoLoja}
            alt="Loja Jotazo Telecom"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </section>

      {/* PROPÓSITO */}
      <section className="space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Nosso propósito
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Conexão como direito de transformar vidas
          </h2>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground">
              <Target className="mb-3 h-8 w-8 text-accent" />
              <h3 className="text-xl font-semibold tracking-tight">Internet de verdade</h3>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Estável, veloz e acessível para cidades que merecem mais que promessas.
              </p>
            </div>
            <CardContent className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Acreditamos que a internet é um direito que transforma vidas. Por isso, nascemos
                com o compromisso de levar conectividade estável, veloz e acessível para cidades
                e comunidades que merecem mais do que promessas — merecem conexão de verdade.
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground">
              <Heart className="mb-3 h-8 w-8 text-accent" />
              <h3 className="text-xl font-semibold tracking-tight">Atendimento próximo</h3>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Pessoas reais, que conhecem sua cidade e entendem suas necessidades.
              </p>
            </div>
            <CardContent className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Nosso diferencial está no atendimento próximo e transparente. Aqui, você fala com
                pessoas reais, que conhecem sua cidade e entendem suas necessidades. Cada cliente
                é tratado como vizinho, não como número.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section id="nossa-historia" className="space-y-8 scroll-mt-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Nossa história
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            17 anos de evolução constante
          </h2>
        </header>
        <TimelineTrack>
          {timeline.map((item, i) => (
            <TimelineItem key={item.year} item={item} index={i} />
          ))}
        </TimelineTrack>
      </section>

      {/* DIFERENCIAIS */}
      <WhyJotazoSection />

      {/* MISSÃO, VISÃO E VALORES */}
      <section className="space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Quem somos
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Missão, visão e valores
          </h2>
        </header>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Target, title: "Missão", text: "Democratizar o acesso à internet de alta velocidade com atendimento humano, transparente e comprometido com a satisfação de cada cliente." },
            { icon: Eye, title: "Visão", text: "Ser reconhecida como o provedor regional mais confiável e inovador do Vale do Ribeira, referência em qualidade de conexão e experiência do cliente." },
            { icon: Heart, title: "Valores", text: "Proximidade, qualidade, agilidade, transparência e compromisso com o desenvolvimento das comunidades que atendemos." },
          ].map((item) => (
            <Card key={item.title} className="group transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* INSTAGRAM */}
      <InstagramFeedSection />

      {/* LINKS */}
      <section className="space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Explore
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Conheça mais sobre a Jotazo
          </h2>
        </header>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <l.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{l.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Pronto para se conectar?
            </h2>
            <p className="max-w-xl text-primary-foreground/85">
              Veja os planos disponíveis na sua região e finalize tudo pelo WhatsApp.
              Atendimento humano do começo ao fim.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/planos">
                Ver planos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
            >
              <Link to="/cobertura">Consultar cobertura</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
