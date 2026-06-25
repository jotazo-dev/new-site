import { Link } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  Gauge,
  Headphones,
  Wifi,
  Award,
  Clock,
  Users,
  Server,
  Lock,
  Zap,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BenefitCard } from "@/components/BenefitCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd, ServiceJsonLd } from "@/components/seo/JsonLd";
import { AnswerFirstParagraph } from "@/components/seo/AnswerFirstParagraph";

import { WHATSAPP } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";

function whatsAppLink(number: string, message: string) {
  const clean = number.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

const reasons = [
  {
    icon: Zap,
    title: "Alta velocidade simétrica",
    description:
      "Upload e download na mesma velocidade — ideal para videoconferências, backups em nuvem e transferência de arquivos pesados.",
  },
  {
    icon: ShieldCheck,
    title: "SLA garantido em contrato",
    description:
      "Acordo de nível de serviço com tempo de resposta reduzido e compromisso formal de disponibilidade.",
  },
  {
    icon: Server,
    title: "IP fixo dedicado",
    description:
      "IP exclusivo para sua empresa, perfeito para servidores, VPN, câmeras IP, PABX e acessos remotos.",
  },
  {
    icon: Headphones,
    title: "Suporte prioritário",
    description:
      "Canal direto com a equipe técnica, sem fila de atendimento. Atendimento humano e ágil.",
  },
  {
    icon: Lock,
    title: "Segurança e estabilidade",
    description:
      "Infraestrutura redundante com proteção contra ataques DDoS e monitoramento 24/7 da rede.",
  },
  {
    icon: Award,
    title: "Qualidade certificada",
    description:
      "Rede 100% fibra óptica com equipamentos profissionais e certificações Anatel.",
  },
];

const securityFeatures = [
  "Proteção anti-DDoS na borda da rede",
  "Monitoramento 24/7 do link e equipamentos",
  "Roteador empresarial com firewall integrado",
  "Backup de rota em caso de falha",
  "Logs de tráfego para auditoria",
];

const speedBenefits = [
  { metric: "1 Gbps", label: "Plano inicial simétrico" },
  { metric: "10 Gbps", label: "Velocidade máxima disponível" },
  { metric: "<10 ms", label: "Latência média na rede" },
  { metric: "99,5%", label: "Disponibilidade garantida em SLA" },
];

const useCases = [
  {
    icon: Building2,
    title: "Escritórios e Coworkings",
    description: "Conexão estável para reuniões em vídeo, ERP em nuvem e produtividade da equipe.",
  },
  {
    icon: Users,
    title: "Clínicas e Consultórios",
    description: "Prontuário eletrônico, telemedicina e integração com convênios sem interrupções.",
  },
  {
    icon: Wifi,
    title: "Lojas e Comércios",
    description: "PDV, maquininhas, câmeras de segurança e Wi-Fi para clientes funcionando 100% do tempo.",
  },
  {
    icon: Server,
    title: "Indústrias e Logística",
    description: "Automação, IoT, sistemas de gestão e câmeras IP com link dedicado.",
  },
];

export default function ParaEmpresasPage() {
  const settings = useSiteSettings();
  const waNumber = settings.whatsapp_number || WHATSAPP.number;

  return (
    <div className="space-y-20">
      <SEOHead
        title="Internet Empresarial — Fibra Dedicada, IP Fixo e SLA"
        description="Planos corporativos da Jotazo Telecom: fibra simétrica, IP fixo, SLA garantido e suporte prioritário para sua empresa crescer com segurança."
        path="/para-empresas"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", href: "/" },
          { name: "Para Empresas", href: "/para-empresas" },
        ]}
      />
      <OrganizationJsonLd />
      <ServiceJsonLd
        name="Internet Empresarial Dedicada"
        description="Internet fibra empresarial com banda dedicada, IP fixo, SLA garantido em contrato e suporte prioritário 24/7. Soluções para escritórios, clínicas, lojas e indústrias em Apiaí/SP e região."
        serviceType="Business Internet Service"
        url="/para-empresas"
        areaServed={["Apiaí", "Registro", "Pariquera-Açu", "Jacupiranga", "Cajati"]}
      />
      <AnswerFirstParagraph>
        A Jotazo Telecom oferece internet empresarial dedicada com fibra simétrica, IP fixo, SLA contratual e suporte prioritário. Atende escritórios, clínicas, lojas e indústrias em Apiaí/SP e Vale do Ribeira, com planos de 1 Gbps a 10 Gbps e instalação rápida.
      </AnswerFirstParagraph>

      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-background/10 blur-3xl" />
        <div className="relative grid gap-10 p-8 md:grid-cols-2 md:items-center md:p-14">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">
              <Building2 className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Soluções para empresas
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Internet empresarial que não para o seu negócio
            </h1>
            <p className="max-w-lg text-base text-primary-foreground/85 md:text-lg">
              Fibra óptica dedicada, IP fixo, SLA em contrato e suporte prioritário.
              A conectividade que sua empresa precisa para operar com segurança e performance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a
                  href={whatsAppLink(
                    waNumber,
                    "Olá! Gostaria de uma proposta de internet empresarial."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solicitar proposta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
              >
                <Link to="/atendimento">Falar com consultor</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Sem fidelidade
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Instalação rápida
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Suporte humano
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {speedBenefits.map((b) => (
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

      {/* MOTIVOS */}
      <section className="space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Por que escolher a Jotazo
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Conectividade profissional sem dor de cabeça
          </h2>
          <p className="mt-3 text-muted-foreground">
            Tudo o que sua empresa precisa para operar com performance, segurança e tranquilidade.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <BenefitCard key={r.title} icon={r.icon} title={r.title} description={r.description} index={i} />
          ))}
        </div>
      </section>

      {/* SEGURANÇA + VELOCIDADE */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <ShieldCheck className="mb-3 h-8 w-8 text-accent" />
            <h2 className="text-2xl font-semibold tracking-tight">Segurança em primeiro lugar</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Sua operação protegida em todas as camadas da rede.
            </p>
          </div>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {securityFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <Gauge className="mb-3 h-8 w-8 text-accent" />
            <h2 className="text-2xl font-semibold tracking-tight">Velocidade real, sem oscilação</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Fibra óptica simétrica com baixa latência para aplicações críticas.
            </p>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">Upload = Download</p>
                <p className="text-sm text-muted-foreground">
                  Mesma velocidade nos dois sentidos para reuniões e backups na nuvem.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">Latência abaixo de 10ms</p>
                <p className="text-sm text-muted-foreground">
                  Resposta instantânea para VoIP, jogos online e aplicações em tempo real.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Server className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">Link dedicado disponível</p>
                <p className="text-sm text-muted-foreground">
                  Banda exclusiva, sem compartilhamento com outros clientes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CASOS DE USO */}
      <section className="space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Para todos os segmentos
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            A solução certa para o seu negócio
          </h2>
          <p className="mt-3 text-muted-foreground">
            Atendemos empresas de todos os tamanhos com planos sob medida.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((u) => (
            <Card key={u.title} className="text-center transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                  <u.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-semibold">{u.title}</h3>
                <p className="text-sm text-muted-foreground">{u.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>


      {/* CTA FINAL */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Precisa de uma solução personalizada?
            </h2>
            <p className="max-w-xl text-primary-foreground/85">
              Nossa equipe comercial monta a proposta ideal para o porte e necessidade da sua empresa.
              Atendimento consultivo, sem compromisso.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <a
                href={whatsAppLink(
                  waNumber,
                  "Olá! Gostaria de falar com um consultor sobre internet empresarial."
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PhoneCall className="mr-2 h-4 w-4" />
                Falar com consultor
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
            >
              <Link to="/atendimento">Atendimento</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
