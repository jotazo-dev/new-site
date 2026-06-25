import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { OrganizationJsonLd, WebSiteJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, Smartphone, Tv, Zap, Shield, HeadphonesIcon, Star } from "lucide-react";
import heroBannerFallback from "@/assets/jotazo-telecom-hero-banner.webp";

// === MOCK DATA (substitui chamadas ao Supabase) ===
const MOCK_PLANS = [
  { id: "1", name: "Fibra 300 Mega", price: "R$ 89,90", speed: "300 Mbps", features: ["Wi-Fi 6", "Instalação grátis", "Sem fidelidade"] },
  { id: "2", name: "Fibra 600 Mega", price: "R$ 109,90", speed: "600 Mbps", features: ["Wi-Fi 6", "Instalação grátis", "Globoplay incluso"], highlight: true },
  { id: "3", name: "Fibra 1 Giga", price: "R$ 149,90", speed: "1 Gbps", features: ["Wi-Fi 6E", "Instalação grátis", "Globoplay + Max"] },
];

const MOCK_SERVICES = [
  { icon: Wifi, title: "Internet Fibra", desc: "Velocidade ultrarrápida com Wi-Fi 6 incluso." },
  { icon: Smartphone, title: "Chip 5G", desc: "Cobertura nacional com a melhor tecnologia móvel." },
  { icon: Tv, title: "TV & Streaming", desc: "Canais ao vivo e os melhores streamings em um só lugar." },
  { icon: Zap, title: "Instalação Rápida", desc: "Em até 48h após a contratação." },
  { icon: Shield, title: "Sem Fidelidade", desc: "Liberdade total para escolher o melhor para você." },
  { icon: HeadphonesIcon, title: "Suporte 24/7", desc: "Atendimento humano via WhatsApp a qualquer hora." },
];

const MOCK_TESTIMONIALS = [
  { id: "1", name: "Maria Silva", role: "Cliente há 3 anos", text: "Internet estável e suporte impecável. Recomendo!", rating: 5 },
  { id: "2", name: "João Pereira", role: "Empresário", text: "Migrei para a Jotazo e nunca mais tive quedas.", rating: 5 },
  { id: "3", name: "Ana Costa", role: "Designer", text: "Velocidade real entregue. Trabalho de casa sem travamentos.", rating: 5 },
];

export default function HomePage() {
  return (
    <div>
      <SEOHead
        title="Jotazo Telecom — Internet Fibra, 5G e TV"
        description="Planos de internet fibra óptica, móvel 5G e TV por assinatura. Sem fidelidade, suporte humanizado e instalação ágil."
        path="/"
      />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }]} />
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <h1 className="sr-only">Jotazo Telecom — Internet Fibra, 5G e TV</h1>

      {/* HERO */}
      <section className="relative w-full overflow-hidden">
        <div className="aspect-[1536/1200] md:aspect-[1920/600] w-full">
          <img
            src={heroBannerFallback}
            alt="Jotazo Telecom"
            width={1920}
            height={600}
            className="block w-full h-full object-cover object-center"
            loading="eager"
          />
        </div>
      </section>

      <div className="mt-20 space-y-20 px-4 md:px-0">
        {/* PLANOS */}
        <section className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Nossos planos</h2>
            <p className="mt-3 text-muted-foreground">Escolha o ideal para você</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_PLANS.map((plan) => (
              <Card key={plan.id} className={plan.highlight ? "border-primary border-2 shadow-lg" : ""}>
                <CardContent className="p-6 text-center">
                  {plan.highlight && (
                    <span className="inline-block mb-3 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Mais popular
                    </span>
                  )}
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.speed}</p>
                  <p className="text-4xl font-bold text-primary mt-4">{plan.price}<span className="text-sm text-muted-foreground">/mês</span></p>
                  <ul className="mt-6 space-y-2 text-sm text-foreground/80">
                    {plan.features.map((f) => <li key={f}>✓ {f}</li>)}
                  </ul>
                  <Button asChild className="mt-6 w-full"><Link to="/planos">Assinar</Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SERVIÇOS */}
        <section className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Por que escolher a Jotazo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_SERVICES.map(({ icon: Icon, title, desc }) => (
              <Card key={title}>
                <CardContent className="p-6">
                  <Icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">O que dizem nossos clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_TESTIMONIALS.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-foreground/90 italic">"{t.text}"</p>
                  <div className="mt-4">
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl text-center bg-primary/5 rounded-2xl p-10 md:p-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Pronto para começar?</h2>
          <p className="mt-4 text-muted-foreground">Fale conosco e descubra o melhor plano para você.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/atendimento">Fale conosco</Link></Button>
        </section>
      </div>
    </div>
  );
}
