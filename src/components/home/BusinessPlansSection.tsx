import { Link } from "react-router-dom";
import { Building2, Wifi, Headphones, ShieldCheck, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { WHATSAPP } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";

function whatsAppLink(number: string, message: string) {
  const clean = number.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

const highlights = [
  {
    icon: Wifi,
    title: "IP fixo e link dedicado",
    description: "Conexão estável e exclusiva para a operação do seu negócio.",
  },
  {
    icon: ShieldCheck,
    title: "SLA garantido",
    description: "Acordo de nível de serviço com tempo de resposta reduzido.",
  },
  {
    icon: Headphones,
    title: "Suporte prioritário",
    description: "Canal direto com a equipe técnica, sem fila.",
  },
];

const businessPlans = [
  {
    name: "Empresarial 300",
    speed: "300 Mega",
    priceCents: 19990,
    features: ["300 Mbps simétrico", "IP fixo", "Suporte prioritário", "SLA 8h"],
    popular: false,
  },
  {
    name: "Empresarial 500",
    speed: "500 Mega",
    priceCents: 29990,
    features: ["500 Mbps simétrico", "IP fixo", "Suporte prioritário", "SLA 4h", "Link dedicado"],
    popular: true,
  },
  {
    name: "Empresarial 1 Giga",
    speed: "1 Giga",
    priceCents: 49990,
    features: ["1 Gbps simétrico", "IP fixo", "Suporte 24/7", "SLA 2h", "Link dedicado", "Gerente de conta"],
    popular: false,
  },
];

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BusinessPlansSection() {
  const settings = useSiteSettings();
  const waNumber = settings.whatsapp_number || WHATSAPP.number;
  const mobileColumns = settings["business_plans_mobile_columns"] === "2" ? 2 : 1;
  const mobileMode = settings["business_plans_mobile_mode"] === "grade" ? "grade" : "slide";

  const renderPlanCard = (plan: typeof businessPlans[number]) => (
    <div
      key={plan.name}
      className={
        "relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md " +
        (plan.popular ? "ring-2 ring-accent" : "")
      }
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-accent-foreground">
          Mais popular
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <p className="text-2xl font-bold tracking-tight text-primary">{plan.speed}</p>
      </div>

      <div className="mb-6">
        <span className="text-3xl font-bold text-foreground">{formatBRL(plan.priceCents)}</span>
        <span className="text-sm text-muted-foreground">/mês</span>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        asChild
        className={plan.popular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
        variant={plan.popular ? "default" : "outline"}
      >
        <a
          href={whatsAppLink(waNumber, `Olá! Tenho interesse no plano ${plan.name}.`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Contratar
        </a>
      </Button>
    </div>
  );

  return (
    <section className="space-y-8">
      {/* hero banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-background/5 blur-3xl" />

        <div className="relative grid gap-10 p-8 md:grid-cols-2 md:p-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Para empresas
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Internet profissional para o seu negócio crescer
            </h2>
            <p className="max-w-md text-sm text-primary-foreground/80 md:text-base">
              Planos corporativos com fibra dedicada, IP fixo, SLA e suporte
              prioritário. Ideal para escritórios, lojas, clínicas e indústrias.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/para-empresas">
                  Conhecer planos empresariais
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
              >
                <Link to="/atendimento">Falar com consultor</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="group flex gap-4 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 transition-colors hover:bg-primary-foreground/10"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <h.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{h.title}</h3>
                  <p className="mt-0.5 text-sm text-primary-foreground/70">{h.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* plan cards */}
      <div className="hidden md:grid gap-5 md:grid-cols-3">
        {businessPlans.map(renderPlanCard)}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        {mobileMode === "slide" ? (
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent>
              {businessPlans.map((plan) => (
                <CarouselItem
                  key={plan.name}
                  className={cn(mobileColumns === 2 ? "basis-1/2" : "basis-[86%]")}
                >
                  <div className="h-full p-1">{renderPlanCard(plan)}</div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious variant="outline" className="-left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
            <CarouselNext variant="outline" className="-right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
          </Carousel>
        ) : (
          <div className={cn("grid gap-5", mobileColumns === 2 ? "grid-cols-2" : "grid-cols-1")}>
            {businessPlans.map(renderPlanCard)}
          </div>
        )}
      </div>
    </section>
  );
}
