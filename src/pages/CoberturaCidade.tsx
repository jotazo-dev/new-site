import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  BreadcrumbJsonLd,
  OrganizationJsonLd,
  ServiceJsonLd,
  FAQPageJsonLd,
} from "@/components/seo/JsonLd";
import { AnswerFirstParagraph } from "@/components/seo/AnswerFirstParagraph";
import { citySlug } from "@/lib/slug";
import { usePlans } from "@/hooks/usePlans";
import { buildWhatsAppCheckoutUrl } from "@/lib/whatsapp";
import { useCart } from "@/cart/CartContext";
import {
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Wifi,
  Signal,
  PhoneCall,
  Building2,
} from "lucide-react";

function normalizeCep(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 8);
}
function formatCep(value: string) {
  const d = normalizeCep(value);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

interface CityRow {
  id: string;
  name: string;
  state: string;
}

export default function CoberturaCidadePage() {
  const { cidade: slugParam = "" } = useParams<{ cidade: string }>();
  const { items, totalCents } = useCart();
  const [cep, setCep] = React.useState("");
  const [status, setStatus] = React.useState<"" | "covered" | "not_covered">("");
  const [address, setAddress] = React.useState("");

  const cepDigits = normalizeCep(cep);

  // Todas as cidades ativas (para resolver slug e listar vizinhas)
  const { data: cities = [], isLoading } = useQuery<CityRow[]>({
    queryKey: ["coverage_cities_full_public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coverage_cities")
        .select("id, name, state")
        .eq("active", true)
        .order("sort_order");
      return (data || []) as CityRow[];
    },
  });

  const city = React.useMemo(
    () => cities.find((c) => citySlug(c.name) === slugParam),
    [cities, slugParam]
  );

  const { data: ceps = [] } = useQuery({
    queryKey: ["coverage_ceps_by_city", city?.id],
    enabled: !!city?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("coverage_ceps")
        .select("neighborhood, cep_start, cep_end")
        .eq("active", true)
        .eq("city_id", city!.id)
        .order("neighborhood");
      return data || [];
    },
  });

  const { data: plans = [] } = usePlans();

  const fiberPlans = plans.filter((p) => p.category === "fibra").slice(0, 3);
  const mobilePlan = plans.find((p) => p.category === "movel");

  const neighborhoods = React.useMemo(() => {
    const map = new Map<string, { start: string; end: string }>();
    for (const c of ceps) {
      const key = (c.neighborhood || "Diversos").trim();
      if (!map.has(key)) map.set(key, { start: c.cep_start, end: c.cep_end });
    }
    return Array.from(map.entries()).map(([name, r]) => ({ name, ...r }));
  }, [ceps]);

  const others = cities.filter((c) => c.id !== city?.id).slice(0, 8);

  const checkCep = async () => {
    if (cepDigits.length < 8) return;
    setAddress("");
    let addr = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!data.erro && data.localidade) {
        const parts = [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`].filter(Boolean);
        addr = parts.join(", ");
      }
    } catch {
      /* ignore */
    }
    const { data } = await supabase
      .from("coverage_ceps")
      .select("id")
      .eq("active", true)
      .lte("cep_start", cepDigits)
      .gte("cep_end", cepDigits)
      .limit(1);
    setAddress(addr);
    setStatus(data && data.length > 0 ? "covered" : "not_covered");
  };

  const whatsappHref = buildWhatsAppCheckoutUrl({
    items,
    totalCents,
    cep: cepDigits || undefined,
    customerCity: city?.name,
    customerUf: city?.state,
  });

  // ====== Cidade não encontrada ======
  if (!isLoading && !city) {
    return (
      <div className="space-y-10">
        <SEOHead
          title="Cidade não encontrada — Cobertura"
          description="A cidade informada ainda não está em nossa área de cobertura. Veja as cidades atendidas pela Jotazo Telecom."
          path={`/cobertura/${slugParam}`}
          noindex
        />
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold">Cidade não encontrada na cobertura</h1>
          <p className="mt-3 text-muted-foreground">
            Confira a lista de cidades atendidas pela Jotazo Telecom.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link to="/cobertura">Ver todas as cidades</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!city) {
    return <div className="min-h-[400px]" aria-hidden="true" />;
  }

  const cityName = city.name;
  const uf = city.state;
  const title = `Internet Fibra e 5G em ${cityName}/${uf}`;
  const description = `Planos de fibra óptica até 1 Gbps e internet móvel 5G em ${cityName}/${uf}. Verifique cobertura por CEP, veja bairros atendidos e contrate online com a Jotazo Telecom.`;
  const path = `/cobertura/${slugParam}`;

  const faqs = [
    {
      question: `Tem internet fibra óptica em ${cityName}?`,
      answer: `Sim. A Jotazo Telecom oferece internet fibra óptica (FTTH/GPON) em ${cityName}/${uf}, com planos a partir de 300 Mbps e velocidade real até 1 Gbps. Verifique a disponibilidade pelo seu CEP nesta página.`,
    },
    {
      question: `Quais são os bairros atendidos em ${cityName}?`,
      answer:
        neighborhoods.length > 0
          ? `A cobertura em ${cityName} inclui os bairros: ${neighborhoods.map((n) => n.name).join(", ")}. A expansão é constante — consulte seu CEP para confirmar.`
          : `A cobertura em ${cityName} está em constante expansão. Consulte seu CEP nesta página ou fale com nossa equipe pelo WhatsApp.`,
    },
    {
      question: `Quanto custa a instalação da internet em ${cityName}?`,
      answer: `A instalação da fibra Jotazo em ${cityName}/${uf} pode ser gratuita em campanhas promocionais. Consulte as condições atuais com nosso time pelo WhatsApp.`,
    },
    {
      question: `A Jotazo atende empresas em ${cityName}?`,
      answer: `Sim. Oferecemos planos empresariais com IP fixo, SLA e suporte prioritário em ${cityName}/${uf}. Acesse a página "Para Empresas" para conhecer as condições.`,
    },
    {
      question: `Tem 5G em ${cityName}?`,
      answer: `A Jotazo disponibiliza chips 5G com cobertura nacional, que funcionam também em ${cityName}/${uf}. Veja os planos móveis em /internet-movel.`,
    },
  ];

  return (
    <div className="space-y-16">
      <SEOHead title={title} description={description} path={path} />
      <OrganizationJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", href: "/" },
          { name: "Cobertura", href: "/cobertura" },
          { name: cityName, href: path },
        ]}
      />
      <ServiceJsonLd
        name={`Internet Fibra e 5G em ${cityName}`}
        description={`Internet fibra óptica FTTH e internet móvel 5G da Jotazo Telecom em ${cityName}/${uf}.`}
        serviceType="Internet fibra óptica e 5G"
        url={path}
        areaServed={[cityName]}
      />
      <FAQPageJsonLd faqs={faqs} />

      <AnswerFirstParagraph>
        A Jotazo Telecom oferece internet fibra óptica de até 1 Gbps e internet móvel 5G em {cityName}/{uf},
        com instalação rápida, suporte local e cobertura ampliada em {neighborhoods.length || "diversos"} bairros.
      </AnswerFirstParagraph>

      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-background/10 blur-3xl" />
        <div className="relative grid gap-10 p-8 md:grid-cols-2 md:items-center md:p-14">
          <div className="space-y-6">
            <nav className="text-xs text-primary-foreground/70" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-accent">Início</Link>
              <span className="mx-2">/</span>
              <Link to="/cobertura" className="hover:text-accent">Cobertura</Link>
              <span className="mx-2">/</span>
              <span className="text-accent">{cityName}</span>
            </nav>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Cobertura em {cityName}/{uf}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Internet fibra e 5G em {cityName}
            </h1>
            <p className="max-w-lg text-base text-primary-foreground/85 md:text-lg">
              Velocidade real, latência baixa e suporte local em {cityName}/{uf}.
              Consulte seu CEP, veja os bairros atendidos e contrate online.
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
                <Link to="/planos">Ver planos</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              { icon: Wifi, metric: "Até 1 Gbps", label: "Fibra óptica FTTH" },
              { icon: Signal, metric: "5G", label: "Chip Jotazo móvel" },
              { icon: MapPin, metric: `${neighborhoods.length || "+"}`, label: `Bairros em ${cityName}` },
              { icon: Building2, metric: "Empresas", label: "IP fixo + SLA" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-4 rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 px-5 py-4 backdrop-blur"
              >
                <b.icon className="h-6 w-6 text-accent" />
                <div className="flex-1">
                  <div className="text-lg font-bold text-accent">{b.metric}</div>
                  <div className="text-xs text-primary-foreground/80">{b.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CEP + BAIRROS */}
      <section id="verificar-cep" className="grid gap-6 md:grid-cols-2 scroll-mt-20">
        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <Search className="mb-3 h-8 w-8 text-accent" />
            <h2 className="text-2xl font-semibold tracking-tight">Verifique cobertura em {cityName}</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Digite o CEP para confirmar a disponibilidade no seu endereço.
            </p>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={formatCep(cep)}
                onChange={(e) => {
                  setCep(formatCep(e.target.value));
                  setStatus("");
                  setAddress("");
                }}
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
                  <p className="font-semibold text-success">Temos cobertura no seu endereço!</p>
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
                </div>
              </div>
            )}
            <Button asChild variant="outline" className="w-full">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                Falar pelo WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <Building2 className="mb-3 h-8 w-8 text-accent" />
            <h2 className="text-2xl font-semibold tracking-tight">Bairros atendidos em {cityName}</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Faixas de CEP onde a fibra Jotazo já está disponível.
            </p>
          </div>
          <CardContent className="p-6">
            {neighborhoods.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Estamos expandindo a cobertura em {cityName}. Consulte seu CEP acima.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {neighborhoods.map((n) => (
                  <li
                    key={n.name}
                    className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="truncate">{n.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* PLANOS */}
      {(fiberPlans.length > 0 || mobilePlan) && (
        <section className="space-y-6">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Planos disponíveis
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Planos para {cityName}
            </h2>
            <p className="mt-3 text-muted-foreground">
              Fibra óptica e 5G com instalação rápida e suporte humano.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {fiberPlans.map((p) => (
              <Card key={p.id} className="flex flex-col p-5">
                <Wifi className="mb-3 h-6 w-6 text-accent" />
                <div className="text-xs uppercase text-muted-foreground">Fibra</div>
                <div className="mt-1 text-lg font-semibold">{p.name}</div>
                <div className="mt-3 text-2xl font-bold text-primary">
                  R$ {(p.priceCents / 100).toFixed(2).replace(".", ",")}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/mês</span>
                </div>
                <Button asChild className="mt-auto" variant="outline">
                  <Link to="/planos">Ver detalhes</Link>
                </Button>
              </Card>
            ))}
            {mobilePlan && (
              <Card className="flex flex-col p-5">
                <Signal className="mb-3 h-6 w-6 text-accent" />
                <div className="text-xs uppercase text-muted-foreground">5G Móvel</div>
                <div className="mt-1 text-lg font-semibold">{mobilePlan.name}</div>
                <div className="mt-3 text-2xl font-bold text-primary">
                  R$ {(mobilePlan.priceCents / 100).toFixed(2).replace(".", ",")}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/mês</span>
                </div>
                <Button asChild className="mt-auto" variant="outline">
                  <Link to="/internet-movel">Ver detalhes</Link>
                </Button>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="space-y-6">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Perguntas frequentes
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Dúvidas sobre cobertura em {cityName}
          </h2>
        </header>
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-[16px] border border-border bg-card p-5 shadow-sm open:shadow-md"
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-foreground group-open:text-primary">
                {f.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CIDADES VIZINHAS */}
      {others.length > 0 && (
        <section className="space-y-6">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Cobertura na região
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Outras cidades atendidas
            </h2>
          </header>
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-4">
            {others.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/cobertura/${citySlug(c.name)}`}
                  className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition hover:border-accent hover:text-accent"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="truncate">
                    {c.name} - {c.state}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Pronto para contratar em {cityName}?
            </h2>
            <p className="max-w-xl text-primary-foreground/85">
              Fale agora com nosso time e garanta sua instalação rápida em {cityName}/{uf}.
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
