import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Layers, Palette, Zap, Users, Star } from "lucide-react";

import heroBg from "../assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Estúdio — Criamos Experiências Digitais" },
      { name: "description", content: "Um estúdio criativo dedicado a transformar ideias em experiências digitais memoráveis. Design, tecnologia e estratégia." },
      { property: "og:title", content: "Estúdio — Criamos Experiências Digitais" },
      { property: "og:description", content: "Um estúdio criativo dedicado a transformar ideias em experiências digitais memoráveis." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Estúdio
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#sobre" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sobre
            </a>
            <a href="#servicos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Serviços
            </a>
            <a href="#depoimentos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Depoimentos
            </a>
            <a
              href="#contato"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Contato
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt=""
            className="h-full w-full object-cover opacity-30"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 md:py-40">
          <div className="max-w-3xl">
            <p className="mb-6 text-sm font-medium uppercase tracking-widest text-accent">
              Estúdio Criativo
            </p>
            <h1 className="font-serif text-5xl font-medium leading-[1.1] tracking-tight text-foreground md:text-7xl lg:text-8xl">
              Transformamos
              <br />
              <span className="italic text-accent">ideias</span> em realidade
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Unimos design, tecnologia e estratégia para criar experiências digitais
              que conectam marcas a pessoas de forma autêntica e memorável.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#contato"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                Começar um projeto
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#sobre"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-accent/5"
              >
                Conheça nosso trabalho
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <Stat label="Projetos entregues" value="120+" />
            <Stat label="Anos de experiência" value="8+" />
            <Stat label="Clientes satisfeitos" value="85+" />
            <Stat label="Prêmios conquistados" value="12" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
                Sobre Nós
              </p>
              <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-foreground md:text-5xl">
                Criatividade guiada
                <br />
                por <span className="italic">propósito</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Somos um time multidisciplinar apaixonado por resolver problemas complexos
                com soluções elegantes. Cada projeto é uma oportunidade de criar algo
                significativo — não apenas bonito, mas funcional e impactante.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Acreditamos que o melhor design nasce da empatia. Por isso, começamos
                sempre ouvindo, entendendo e colaborando antes de criar.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="rounded-2xl bg-sand p-8">
                <h3 className="font-serif text-2xl font-medium text-foreground">Nossa missão</h3>
                <p className="mt-3 text-muted-foreground">
                  Democratizar o acesso a design de excelência, ajudando negócios de todos
                  os portes a se comunicarem com clareza e beleza.
                </p>
              </div>
              <div className="rounded-2xl bg-secondary p-8">
                <h3 className="font-serif text-2xl font-medium text-foreground">Nossa visão</h3>
                <p className="mt-3 text-muted-foreground">
                  Ser referência em criatividade consciente, onde cada decisão de design
                  gera impacto positivo real para pessoas e negócios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="bg-card py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
              O que fazemos
            </p>
            <h2 className="font-serif text-4xl font-medium tracking-tight text-foreground md:text-5xl">
              Serviços especializados
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Oferecemos soluções completas para sua presença digital, do conceito
              à entrega final.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ServiceCard
              icon={<Palette className="h-6 w-6" />}
              title="Design de Identidade"
              description="Logotipos, paletas de cores, tipografia e sistemas visuais que contam a história da sua marca."
            />
            <ServiceCard
              icon={<Layers className="h-6 w-6" />}
              title="UI/UX Design"
              description="Interfaces intuitivas e experiências fluidas que encantam usuários e convertem visitantes."
            />
            <ServiceCard
              icon={<Zap className="h-6 w-6" />}
              title="Desenvolvimento Web"
              description="Sites e aplicações modernas, rápidas e otimizadas para performance e SEO."
            />
            <ServiceCard
              icon={<Star className="h-6 w-6" />}
              title="Branding Estratégico"
              description="Posicionamento de marca, voz, valores e estratégia de comunicação diferenciada."
            />
            <ServiceCard
              icon={<Users className="h-6 w-6" />}
              title="Consultoria Criativa"
              description="Orientação especializada para elevar o padrão visual e estratégico do seu negócio."
            />
            <ServiceCard
              icon={<ArrowRight className="h-6 w-6" />}
              title="Motion Design"
              description="Animações e microinterações que dão vida às suas interfaces e comunicações."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
              Depoimentos
            </p>
            <h2 className="font-serif text-4xl font-medium tracking-tight text-foreground md:text-5xl">
              O que dizem sobre nós
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <TestimonialCard
              quote="A equipe do Estúdio superou todas as expectativas. O resultado final é simplesmente espetacular e já estamos vendo resultados."
              author="Mariana Costa"
              role="CEO, Verde Organics"
            />
            <TestimonialCard
              quote="Profissionalismo, criatividade e atenção aos detalhes. Nosso novo site representa perfeitamente quem somos."
              author="Rafael Mendes"
              role="Fundador, TechFlow"
            />
            <TestimonialCard
              quote="O processo foi colaborativo e transparente do início ao fim. Recomendo para qualquer empresa que valorize design de qualidade."
              author="Carla Souza"
              role="Diretora de Marketing, Aura"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contato" className="bg-charcoal py-24 text-warm-50 md:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-serif text-4xl font-medium tracking-tight md:text-6xl">
            Vamos criar algo
            <br />
            <span className="italic text-terracotta-light">incrível</span> juntos?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-warm-300">
            Estamos sempre em busca de novos desafios e parcerias. Se você tem um
            projeto em mente, adoraríamos conversar sobre ele.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:hello@estudio.com"
              className="group inline-flex items-center gap-2 rounded-full bg-terracotta px-8 py-4 text-sm font-medium text-white transition-all hover:bg-terracotta-light"
            >
              Fale conosco
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link to="/" className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Estúdio
            </Link>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Estúdio. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Instagram
              </a>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                LinkedIn
              </a>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Behance
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-serif text-4xl font-medium text-foreground md:text-5xl">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-background p-8 transition-all hover:border-accent/30 hover:shadow-sm">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <h3 className="mt-6 font-serif text-xl font-medium text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-8">
      <div className="flex gap-1 text-accent">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <p className="mt-6 text-base leading-relaxed text-foreground">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 font-serif text-sm font-medium text-accent">
          {author.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{author}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}
