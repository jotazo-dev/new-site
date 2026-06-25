import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BenefitCard } from "@/components/BenefitCard";
import { Input } from "@/components/ui/input";
import { COVERAGE } from "@/config/site";
import { buildWhatsAppCheckoutUrl } from "@/lib/whatsapp";
import { useCart } from "@/cart/CartContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd, ServiceJsonLd } from "@/components/seo/JsonLd";
import { AnswerFirstParagraph } from "@/components/seo/AnswerFirstParagraph";
import { citySlug } from "@/lib/slug";
import {
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  Wifi,
  Map as MapIcon,
  ArrowRight,
  PhoneCall,
  Building2,
  Gauge,
} from "lucide-react";

function normalizeCep(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 8);
}

function formatCep(value: string) {
  const digits = normalizeCep(value);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}

export default function CoberturaPage() {
  const { items, totalCents } = useCart();
  const [cep, setCep] = React.useState("");
  const [status, setStatus] = React.useState<"" | "covered" | "not_covered">("");
  const [address, setAddress] = React.useState("");
  const [cityUf, setCityUf] = React.useState<{ city?: string; uf?: string }>({});

  const cepDigits = normalizeCep(cep);

  const { data: cities = [] } = useQuery({
    queryKey: ["coverage_cities_public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coverage_cities")
        .select("name, state")
        .eq("active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const checkCep = async () => {
    if (cepDigits.length < 8) return;
    setAddress("");
    setCityUf({});

    let addr = "";
    let foundCity: string | undefined;
    let foundUf: string | undefined;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (!data.erro && data.localidade) {
        const parts = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`].filter(Boolean);
        addr = parts.join(", ");
        foundCity = data.localidade;
        foundUf = data.uf;
      }
    } catch {
      // silently continue
    }

    const { data } = await supabase
      .from("coverage_ceps")
      .select("id")
      .eq("active", true)
      .lte("cep_start", cepDigits)
      .gte("cep_end", cepDigits)
      .limit(1);
    setAddress(addr);
    setCityUf({ city: foundCity, uf: foundUf });
    setStatus(data && data.length > 0 ? "covered" : "not_covered");
  };

  const whatsappHref = buildWhatsAppCheckoutUrl({
    items,
    totalCents,
    cep: cepDigits || undefined,
    customerCity: cityUf.city,
    customerUf: cityUf.uf,
  });

  const heroHighlights = [
    { metric: `${cities.length || "10+"}`, label: "Cidades atendidas" },
    { metric: "100% Fibra", label: "Tecnologia FTTH/GPON" },
    { metric: "<10 ms", label: "Latência média na rede" },
    { metric: "24/7", label: "Monitoramento da rede" },
  ];

  return (
    <div className="space-y-20">
      <SEOHead
        title="Área de Cobertura — Consulte por CEP | Jotazo Telecom"
        description="Verifique a disponibilidade de internet fibra óptica e 5G da Jotazo Telecom no seu endereço. Consulta gratuita por CEP em Apiaí/SP, Vale do Ribeira e cidades atendidas."
        path="/cobertura"
      />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Cobertura", href: "/cobertura" }]} />
      <OrganizationJsonLd />
      <ServiceJsonLd
        name="Cobertura de Fibra Óptica"
        description="Consulta de cobertura de internet fibra da Jotazo Telecom por CEP. Atende Apiaí/SP e toda a região do Vale do Ribeira."
        serviceType="Coverage Lookup"
        url="/cobertura"
        areaServed={["Apiaí", "Registro", "Pariquera-Açu", "Jacupiranga", "Cajati", "Cananéia", "Iguape", "Ilha Comprida", "Eldorado", "Sete Barras"]}
      />
      <AnswerFirstParagraph>
        A Jotazo Telecom oferece cobertura de internet fibra óptica em Apiaí, Registro, Pariquera-Açu, Jacupiranga, Cajati, Cananéia, Iguape, Ilha Comprida, Eldorado, Sete Barras e demais cidades do Vale do Ribeira. Consulte a disponibilidade pelo CEP.
      </AnswerFirstParagraph>

      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-background/10 blur-3xl" />
        <div className="relative grid gap-10 p-8 md:grid-cols-2 md:items-center md:p-14">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Disponibilidade
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Veja se a Jotazo já chegou no seu endereço
            </h1>
            <p className="max-w-lg text-base text-primary-foreground/85 md:text-lg">
              Nossa rede 100% fibra óptica está em constante expansão pelo Vale do Ribeira.
              Consulte por CEP e descubra os planos disponíveis na sua região.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#verificar-cep">
                  Verificar meu CEP
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
              >
                <a href="#mapa-cobertura">Ver mapa</a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Consulta gratuita
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Resposta imediata
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Instalação rápida
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {heroHighlights.map((b) => (
              <div
                key={b.label}
                className="flex items-center justify-between rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 px-5 py-4 backdrop-blur"
              >
                <span className="text-sm text-primary-foreground/80">{b.label}</span>
                <span className="text-2xl font-bold text-accent">{b.metric}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONSULTA + CIDADES */}
      <section id="verificar-cep" className="grid gap-6 md:grid-cols-2 scroll-mt-20">
        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <Search className="mb-3 h-8 w-8 text-accent" />
            <h2 className="text-2xl font-semibold tracking-tight">Buscar por CEP</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Digite seu CEP para verificar a disponibilidade na sua região.
            </p>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={formatCep(cep)}
                onChange={(e) => { setCep(formatCep(e.target.value)); setStatus(""); setAddress(""); }}
                placeholder="00000-000"
                inputMode="numeric"
                aria-label="CEP"
                onKeyDown={(e) => e.key === "Enter" && checkCep()}
                maxLength={9}
              />
              <Button onClick={checkCep} disabled={cepDigits.length !== 8} className="w-full sm:w-auto">
                Verificar
              </Button>
            </div>

            {status === "covered" && (
              <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <div>
                  <p className="font-semibold text-success">Temos cobertura na sua região!</p>
                  {address && <p className="mt-1 text-success/80">{address}</p>}
                </div>
              </div>
            )}
            {status === "not_covered" && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Cobertura em verificação</p>
                  <p className="mt-1 text-destructive/80">
                    Fale com nossa equipe pelo WhatsApp para uma análise personalizada.
                  </p>
                  {address && <p className="mt-1 text-destructive/80">{address}</p>}
                </div>
              </div>
            )}

            <Button
              asChild
              variant={status === "not_covered" ? "default" : "outline"}
              className={status === "not_covered" ? "w-full bg-accent text-accent-foreground hover:bg-accent/90" : "w-full"}
            >
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                Consultar cobertura no WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <Building2 className="mb-3 h-8 w-8 text-accent" />
            <h2 className="text-2xl font-semibold tracking-tight">Cidades atendidas</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Regiões com cobertura ativa e expansão constante.
            </p>
          </div>
          <CardContent className="p-6">
            {cities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma cidade cadastrada ainda.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {cities.map((c) => (
                  <li key={c.name}>
                    <Link
                      to={`/cobertura/${citySlug(c.name)}`}
                      className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition hover:border-accent hover:text-accent"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>{c.name} - {c.state}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* DIFERENCIAIS */}
      <section className="space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Por que escolher a Jotazo
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Uma rede pensada para a sua região
          </h2>
          <p className="mt-3 text-muted-foreground">
            Infraestrutura própria, manutenção rápida e suporte humano onde a internet faz a diferença.
          </p>
        </header>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Wifi, title: "100% fibra óptica", desc: "Tecnologia FTTH/GPON com velocidade real até a sua casa." },
            { icon: Gauge, title: "Baixa latência", desc: "Resposta de menos de 10 ms para jogos, reuniões e streaming." },
            { icon: MapIcon, title: "Expansão constante", desc: "Novas cidades e bairros sendo conectados a cada mês." },
          ].map((r, i) => (
            <BenefitCard key={r.title} icon={r.icon} title={r.title} description={r.desc} index={i} />
          ))}
        </div>
      </section>

      {/* MAPA */}
      <section id="mapa-cobertura" className="space-y-6 scroll-mt-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Mapa interativo
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Visualize a área de cobertura
          </h2>
        </header>
        <div className="overflow-hidden rounded-2xl border bg-card">
          <iframe
            title="Mapa de cobertura"
            src="https://www.google.com/maps/d/embed?mid=139LCRqbj5gGyAB_y9cGyQnPQ2LRLft0&ehbc=2E312F"
            className="aspect-video w-full md:aspect-[16/7]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Ainda não temos cobertura no seu endereço?
            </h2>
            <p className="max-w-xl text-primary-foreground/85">
              Cadastre seu interesse pelo WhatsApp. Nossa equipe avalia novas regiões a cada mês
              e entra em contato assim que sua cidade for atendida.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <PhoneCall className="mr-2 h-4 w-4" />
                Falar com a equipe
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
            >
              <Link to="/planos">Ver planos</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
