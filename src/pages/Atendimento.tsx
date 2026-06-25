import { useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, FAQPageJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Headphones,
  MessageCircle,
  Phone,
  ExternalLink,
  Mail,
  MapPin,
  UserCheck,
  UserPlus,
  Send,
  ShieldCheck,
  ArrowRight,
  Wifi,
  Clock,
  CheckCircle2,
  PhoneCall,
} from "lucide-react";
import { WHATSAPP, LINKS } from "@/config/site";
import { toast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type ProfileType = "cliente" | "visitante" | null;

interface ContactForm {
  nome: string;
  telefone: string;
  email: string;
  assunto: string;
  mensagem: string;
}

const initialForm: ContactForm = {
  nome: "",
  telefone: "",
  email: "",
  assunto: "",
  mensagem: "",
};

const faqs = [
  { question: "Como funciona a instalação?", answer: "Após a contratação, nossa equipe entra em contato para agendar a visita técnica. A instalação é feita por profissionais qualificados e inclui a configuração completa do equipamento." },
  { question: "Qual o prazo para ativação do serviço?", answer: "O prazo padrão é de até 5 dias úteis após a confirmação do pedido, podendo variar conforme a região e disponibilidade de agenda técnica." },
  { question: "Como emitir a 2ª via do boleto?", answer: "Acesse o Portal do Cliente com seus dados de login. Lá você encontra todas as faturas, incluindo opção de 2ª via e código de barras para pagamento." },
  { question: "Posso fazer portabilidade do meu número móvel?", answer: "Sim! Basta informar seu número atual durante o processo de contratação. A portabilidade é gratuita e leva até 3 dias úteis." },
  { question: "Como altero meu plano?", answer: "Você pode solicitar a mudança de plano pelo WhatsApp, telefone ou diretamente no Portal do Cliente. Upgrades são ativados em até 24h." },
  { question: "Estou com lentidão na internet, o que fazer?", answer: "Primeiro, reinicie o roteador desligando por 30 segundos. Se o problema persistir, entre em contato com nosso suporte técnico pelo WhatsApp para diagnóstico remoto." },
  { question: "Como funciona o cancelamento?", answer: "O cancelamento pode ser solicitado por qualquer canal de atendimento. Verifique as condições contratuais sobre multa de fidelidade, se aplicável." },
  { question: "Vocês oferecem planos de TV?", answer: "Sim! Oferecemos planos de TV com canais ao vivo e conteúdo sob demanda. Confira nossas opções de combo que incluem internet + TV com desconto." },
  { question: "Qual o horário de atendimento?", answer: "Nosso atendimento via WhatsApp funciona de segunda a sábado, das 8h às 22h. O suporte técnico está disponível 24h para emergências." },
  { question: "Como consultar a cobertura na minha região?", answer: "Acesse nossa página de cobertura e digite seu CEP. Em segundos, você saberá se há disponibilidade de fibra óptica no seu endereço." },
];

const heroHighlights = [
  { metric: "24/7", label: "Suporte técnico em emergências" },
  { metric: "8h–22h", label: "Atendimento via WhatsApp" },
  { metric: "<24h", label: "Resposta por e-mail" },
  { metric: "100%", label: "Atendimento humano" },
];

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function AtendimentoPage() {
  const [profile, setProfile] = useState<ProfileType>(null);
  const [form, setForm] = useState<ContactForm>(initialForm);
  const settings = useSiteSettings();

  const whatsappNumber = "08007210179";
  const phoneNumber = settings["phone"] || "0800 721 0179";
  const emailAddress = settings["email"] || "contato@jotazo.com";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.telefone.trim() || !form.assunto || !form.mensagem.trim()) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const lines = [
      "*Contato via Site — Atendimento*",
      `*Nome:* ${form.nome.trim()}`,
      `*Telefone:* ${form.telefone}`,
      form.email.trim() ? `*E-mail:* ${form.email.trim()}` : "",
      `*Assunto:* ${form.assunto}`,
      `*Mensagem:* ${form.mensagem.trim()}`,
    ].filter(Boolean).join("\n");
    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(whatsappNumber)}&text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank", "noopener");
    toast({ title: "Redirecionando para o WhatsApp…" });
    setForm(initialForm);
  };

  return (
    <div className="space-y-20">
      <SEOHead
        title="Central de Atendimento e Suporte Técnico 24h | Jotazo Telecom"
        description="Fale com a Jotazo Telecom pelo WhatsApp, telefone ou formulário. Suporte técnico, 2ª via de boleto, alteração de plano, agendamento de visita e FAQ completo em um só lugar."
        path="/atendimento"
      />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Atendimento", href: "/atendimento" }]} />
      <FAQPageJsonLd faqs={faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
      <OrganizationJsonLd />

      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-background/10 blur-3xl" />
        <div className="relative grid gap-10 p-8 md:grid-cols-2 md:items-center md:p-14">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">
              <Headphones className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Central de Atendimento
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Estamos aqui para te ajudar
            </h1>
            <p className="max-w-lg text-base text-primary-foreground/85 md:text-lg">
              Suporte técnico, 2ª via, mudança de plano, contratação ou dúvidas — escolha o canal mais
              conveniente e fale com a nossa equipe.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a
                  href={`https://api.whatsapp.com/send?phone=${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
              >
                <a href="#canais">Ver canais</a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Atendimento humano
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Sem fila de espera
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Suporte 24h em emergências
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

      {/* PERFIL */}
      <section id="canais" className="space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Como podemos ajudar
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Selecione seu perfil
          </h2>
          <p className="mt-3 text-muted-foreground">
            Mostramos os canais e recursos mais relevantes para você.
          </p>
        </header>

        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          <Card
            className={`cursor-pointer rounded-2xl border-2 p-6 text-center transition-all hover:shadow-md ${profile === "cliente" ? "border-primary bg-primary/5 shadow-md" : "border-border"}`}
            onClick={() => setProfile("cliente")}
          >
            <CardContent className="flex flex-col items-center gap-3 p-0">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${profile === "cliente" ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"}`}>
                <UserCheck className="h-7 w-7" />
              </div>
              <span className="text-lg font-semibold">Sou Cliente Jotazo</span>
              <span className="text-sm text-muted-foreground">Suporte, 2ª via, dados e serviços</span>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer rounded-2xl border-2 p-6 text-center transition-all hover:shadow-md ${profile === "visitante" ? "border-primary bg-primary/5 shadow-md" : "border-border"}`}
            onClick={() => setProfile("visitante")}
          >
            <CardContent className="flex flex-col items-center gap-3 p-0">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${profile === "visitante" ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"}`}>
                <UserPlus className="h-7 w-7" />
              </div>
              <span className="text-lg font-semibold">Ainda não sou cliente</span>
              <span className="text-sm text-muted-foreground">Planos, cobertura e contratação</span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CANAIS */}
      {profile && (
        <section className="space-y-8">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {profile === "cliente" ? "Suporte ao cliente" : "Comercial"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {profile === "cliente" ? "Canais de atendimento" : "Fale com nosso time"}
            </h2>
          </header>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* WhatsApp */}
            <Card className="group transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col items-start p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">WhatsApp</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {profile === "cliente" ? "Suporte rápido e 2ª via." : "Tire dúvidas e contrate."}
                </p>
                <Button size="sm" className="mt-auto w-full bg-[#25D366] text-white hover:bg-[#1ea952]" asChild>
                  <a href={`https://api.whatsapp.com/send?phone=${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                    Chamar no WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Telefone */}
            <Card className="group transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col items-start p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Telefone</h3>
                <p className="mb-4 text-sm text-muted-foreground">{phoneNumber}</p>
                <Button size="sm" variant="outline" className="mt-auto w-full" asChild>
                  <a href={`tel:${phoneNumber.replace(/\D/g, "")}`}>Ligar agora</a>
                </Button>
              </CardContent>
            </Card>

            {profile === "cliente" ? (
              <>
                <Card className="group transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col items-start p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                      <ExternalLink className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Portal do Cliente</h3>
                    <p className="mb-4 text-sm text-muted-foreground">2ª via, dados e serviços.</p>
                    <Button size="sm" variant="outline" className="mt-auto w-full" asChild>
                      <a href={LINKS.customerPortal} target="_blank" rel="noopener noreferrer">Acessar portal</a>
                    </Button>
                  </CardContent>
                </Card>
                <Card className="group transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col items-start p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Ouvidoria</h3>
                    <p className="mb-4 text-sm text-muted-foreground">Canal de 2ª instância.</p>
                    <Button size="sm" variant="outline" className="mt-auto w-full" asChild>
                      <Link to="/ouvidoria">Abrir ouvidoria</Link>
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="group transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col items-start p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Cobertura</h3>
                    <p className="mb-4 text-sm text-muted-foreground">Consulte por CEP.</p>
                    <Button size="sm" variant="outline" className="mt-auto w-full" asChild>
                      <Link to="/cobertura">Ver cobertura</Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card className="group transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col items-start p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                      <Wifi className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Nossos Planos</h3>
                    <p className="mb-4 text-sm text-muted-foreground">Internet, TV e Móvel.</p>
                    <Button size="sm" variant="outline" className="mt-auto w-full" asChild>
                      <Link to="/planos">Ver planos</Link>
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* E-mail bloco split */}
          <Card className="overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[1fr_2fr]">
              <div className="bg-primary p-6 text-primary-foreground">
                <Mail className="mb-3 h-8 w-8 text-accent" />
                <h3 className="text-xl font-semibold tracking-tight">Atendimento por e-mail</h3>
                <p className="mt-2 text-sm text-primary-foreground/80">
                  Para assuntos mais detalhados ou envio de documentos.
                </p>
              </div>
              <CardContent className="flex flex-col justify-center gap-3 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium">E-mail</p>
                    <a href={`mailto:${emailAddress}`} className="text-sm text-primary underline-offset-2 hover:underline">
                      {emailAddress}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium">Tempo de resposta</p>
                    <p className="text-sm text-muted-foreground">Até 24h úteis.</p>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </section>
      )}

      {/* FORMULÁRIO */}
      <section className="mx-auto max-w-2xl space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Contato rápido
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Envie sua mensagem
          </h2>
          <p className="mt-3 text-muted-foreground">
            Preencha os dados e envie direto pelo WhatsApp.
          </p>
        </header>
        <Card>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome completo"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })}
                    maxLength={15}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label>Assunto *</Label>
                <Select value={form.assunto} onValueChange={(v) => setForm({ ...form, assunto: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o assunto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Suporte técnico">Suporte técnico</SelectItem>
                    <SelectItem value="Financeiro / 2ª via">Financeiro / 2ª via</SelectItem>
                    <SelectItem value="Mudança de plano">Mudança de plano</SelectItem>
                    <SelectItem value="Cancelamento">Cancelamento</SelectItem>
                    <SelectItem value="Contratação">Contratação</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  placeholder="Descreva como podemos ajudar…"
                  value={form.mensagem}
                  onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                  rows={4}
                  maxLength={1000}
                />
              </div>
              <Button type="submit" className="w-full gap-2" size="lg">
                <Send className="h-4 w-4" />
                Enviar via WhatsApp
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Dúvidas frequentes
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Perguntas frequentes
          </h2>
          <p className="mt-3 text-muted-foreground">
            Encontre respostas rápidas para as dúvidas mais comuns.
          </p>
        </header>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="overflow-hidden rounded-2xl border bg-card px-5 shadow-sm transition-shadow data-[state=open]:shadow-md"
            >
              <AccordionTrigger className="py-4 text-left text-base font-semibold hover:no-underline [&[data-state=open]]:text-primary">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Não encontrou o que procurava?
            </h2>
            <p className="max-w-xl text-primary-foreground/85">
              Nossa equipe está pronta para ajudar com qualquer dúvida sobre planos,
              suporte técnico ou contratação.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <a
                href={`https://api.whatsapp.com/send?phone=${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PhoneCall className="mr-2 h-4 w-4" />
                Falar agora
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
