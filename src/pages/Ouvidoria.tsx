import { useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Phone,
  Mail,
  Clock,
  Shield,
  ChevronRight,
  ChevronLeft,
  Send,
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Lock,
} from "lucide-react";
import { WHATSAPP } from "@/config/site";
import { toast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type PublicType = "cliente" | "cidadao";
type IdentificationType = "identificado" | "sigiloso" | "anonimo";
type CategoryType = "denuncia" | "reclamacao" | "sugestao" | "elogio";

interface FormData {
  publicType: PublicType;
  identification: IdentificationType;
  name: string;
  phone: string;
  email: string;
  protocol: string;
  category: CategoryType | "";
  description: string;
  acceptPrivacy: boolean;
}

const initialForm: FormData = {
  publicType: "cliente",
  identification: "identificado",
  name: "",
  phone: "",
  email: "",
  protocol: "",
  category: "",
  description: "",
  acceptPrivacy: false,
};

const categories: { value: CategoryType; label: string; description: string; icon: React.ElementType }[] = [
  { value: "denuncia", label: "Denúncia", description: "Relato de irregularidade, fraude ou conduta antiética.", icon: AlertTriangle },
  { value: "reclamacao", label: "Reclamação de 2ª instância", description: "Insatisfação não resolvida pelos canais de atendimento.", icon: MessageSquare },
  { value: "sugestao", label: "Sugestão", description: "Proposta de melhoria nos serviços ou processos.", icon: Lightbulb },
  { value: "elogio", label: "Elogio", description: "Reconhecimento de uma experiência positiva.", icon: ThumbsUp },
];

function formatPhoneMask(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function OuvidoriaPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const settings = useSiteSettings();

  const ouvidoriaPhone = settings["ouvidoria_phone"] || "0800 721 0179";
  const ouvidoriaEmail = settings["ouvidoria_email"] || "contato@jotazo.com";
  const ouvidoriaHours = settings["ouvidoria_hours"] || "Seg–Sex: 8h às 17h";

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const showContactFields = form.identification !== "anonimo";

  const canAdvance1 = form.publicType && form.identification && (form.identification === "anonimo" || form.name.trim().length >= 2);
  const canAdvance2 = form.category !== "";
  const canSubmit = form.description.trim().length >= 10 && form.acceptPrivacy;

  function handleSubmit() {
    const DIVIDER = "━━━━━━━━━━━━━━━";
    const lines: string[] = [];
    lines.push("📢 *Ouvidoria Jotazo Telecom*");
    lines.push("");
    lines.push(DIVIDER);
    lines.push("");

    const catLabel = categories.find((c) => c.value === form.category)?.label || form.category;
    lines.push(`📋 *Assunto:* ${catLabel}`);
    lines.push(`👥 *Público:* ${form.publicType === "cliente" ? "Cliente Jotazo" : "Cidadão"}`);
    lines.push(`🔒 *Identificação:* ${form.identification === "identificado" ? "Identificado" : form.identification === "sigiloso" ? "Sigiloso" : "Anônimo"}`);
    lines.push("");

    if (showContactFields) {
      lines.push(DIVIDER);
      lines.push("👤 *DADOS DO SOLICITANTE*");
      lines.push(DIVIDER);
      lines.push("");
      if (form.name) lines.push(`📛 Nome: ${form.name}`);
      if (form.phone) lines.push(`📞 Telefone: ${form.phone}`);
      if (form.email) lines.push(`📧 E-mail: ${form.email}`);
      if (form.protocol) lines.push(`🔖 Protocolo anterior: ${form.protocol}`);
      lines.push("");
    }

    lines.push(DIVIDER);
    lines.push("📝 *RELATO*");
    lines.push(DIVIDER);
    lines.push("");
    lines.push(form.description);
    lines.push("");
    lines.push("Aguardo retorno. 🙏");

    const text = encodeURIComponent(lines.join("\n"));
    const number = WHATSAPP.number.replace(/\D/g, "");
    window.open(`https://api.whatsapp.com/send?phone=${number}&text=${text}`, "_blank");

    toast({ title: "Redirecionando para o WhatsApp", description: "Seu relato está sendo enviado via WhatsApp." });
  }

  const heroHighlights = [
    { metric: "100%", label: "Sigilo garantido" },
    { metric: "10 dias", label: "Prazo médio de resposta" },
    { metric: "2ª instância", label: "Independente do atendimento" },
    { metric: "LGPD", label: "Conformidade total" },
  ];

  return (
    <div className="space-y-20">
      <SEOHead
        title="Ouvidoria — Registre sua Manifestação | Jotazo Telecom"
        description="Canal independente de Ouvidoria da Jotazo Telecom para denúncias, reclamações, sugestões e elogios. Resposta com sigilo, imparcialidade e prazo conforme regulamentação Anatel."
        path="/ouvidoria"
      />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Ouvidoria", href: "/ouvidoria" }]} />
      <OrganizationJsonLd />

      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-primary text-primary-foreground">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-background/10 blur-3xl" />
        <div className="relative grid gap-10 p-8 md:grid-cols-2 md:items-center md:p-14">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Ouvidoria
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Canal independente, sigiloso e imparcial
            </h1>
            <p className="max-w-lg text-base text-primary-foreground/85 md:text-lg">
              A Ouvidoria é dedicada a receber denúncias, reclamações, sugestões e elogios.
              Garantimos sigilo, transparência e tratativa formal em todas as manifestações.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#manifestacao">
                  Abrir manifestação
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
                <Lock className="h-4 w-4 text-accent" />
                Sigilo total
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Pode ser anônimo
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Tratativa formal
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

      {/* MANIFESTAÇÃO */}
      <section id="manifestacao" className="mx-auto max-w-3xl space-y-8 scroll-mt-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Registrar manifestação
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Em três passos simples
          </h2>
          <p className="mt-3 text-muted-foreground">
            Identificação, assunto e relato. Você pode acompanhar pelo WhatsApp ao final.
          </p>
        </header>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  s === step
                    ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30"
                    : s < step
                    ? "bg-accent/20 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 rounded-full transition-colors ${s < step ? "bg-accent" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card className="overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground">
              <h3 className="text-xl font-semibold tracking-tight">Identificação</h3>
              <p className="mt-1 text-sm text-primary-foreground/80">Informe como deseja ser atendido.</p>
            </div>
            <CardContent className="space-y-8 p-6 md:p-8">
              <div className="space-y-2">
                <Label className="font-medium">Você é:</Label>
                <RadioGroup value={form.publicType} onValueChange={(v) => set("publicType", v as PublicType)} className="flex gap-4">
                  {[{ v: "cliente", l: "Cliente Jotazo" }, { v: "cidadao", l: "Cidadão" }].map((o) => (
                    <label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                      <RadioGroupItem value={o.v} />
                      <span className="text-sm">{o.l}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Tipo de identificação:</Label>
                <RadioGroup value={form.identification} onValueChange={(v) => set("identification", v as IdentificationType)} className="flex flex-wrap gap-3">
                  {[
                    { v: "identificado", l: "Identificado", d: "Seus dados serão registrados" },
                    { v: "sigiloso", l: "Sigiloso", d: "Dados protegidos, acessíveis apenas à Ouvidoria" },
                    { v: "anonimo", l: "Anônimo", d: "Nenhum dado pessoal será coletado" },
                  ].map((o) => (
                    <label key={o.v} className="flex flex-1 cursor-pointer items-start gap-2 rounded-xl border px-4 py-3 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                      <RadioGroupItem value={o.v} className="mt-0.5" />
                      <div>
                        <span className="text-sm font-medium">{o.l}</span>
                        <p className="text-xs text-muted-foreground">{o.d}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {showContactFields && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input id="name" placeholder="Seu nome" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => set("phone", formatPhoneMask(e.target.value))} maxLength={15} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={255} />
                    </div>
                  </div>
                  {form.publicType === "cliente" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="protocol">Protocolo de atendimento anterior (opcional)</Label>
                      <Input id="protocol" placeholder="Nº do protocolo" value={form.protocol} onChange={(e) => set("protocol", e.target.value)} maxLength={50} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!canAdvance1} className="gap-1.5">
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card className="overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground">
              <h3 className="text-xl font-semibold tracking-tight">Assunto</h3>
              <p className="mt-1 text-sm text-primary-foreground/80">Selecione a categoria da sua manifestação.</p>
            </div>
            <CardContent className="space-y-8 p-6 md:p-8">
              <RadioGroup value={form.category} onValueChange={(v) => set("category", v as CategoryType)} className="grid gap-3 sm:grid-cols-2">
                {categories.map((cat) => (
                  <label
                    key={cat.value}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:shadow-md"
                  >
                    <RadioGroupItem value={cat.value} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4 text-accent" />
                        <span className="font-medium">{cat.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canAdvance2} className="gap-1.5">
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card className="overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground">
              <h3 className="text-xl font-semibold tracking-tight">Relato</h3>
              <p className="mt-1 text-sm text-primary-foreground/80">Descreva sua manifestação com o máximo de detalhes possível.</p>
            </div>
            <CardContent className="space-y-8 p-6 md:p-8">
              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  rows={6}
                  placeholder="Descreva detalhadamente sua manifestação…"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  maxLength={2000}
                />
                <p className="text-right text-xs text-muted-foreground">{form.description.length}/2000</p>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="privacy"
                  checked={form.acceptPrivacy}
                  onCheckedChange={(v) => set("acceptPrivacy", v === true)}
                />
                <Label htmlFor="privacy" className="text-sm leading-snug text-muted-foreground">
                  Declaro que as informações prestadas são verdadeiras e concordo com a{" "}
                  <Link to="/privacidade" className="font-medium text-primary underline hover:no-underline">
                    Política de Privacidade
                  </Link>{" "}
                  da Jotazo Telecom.
                </Label>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Send className="h-4 w-4" /> Enviar via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* CANAIS */}
      <section id="canais" className="space-y-8 scroll-mt-20">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Contato direto
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Canais da Ouvidoria
          </h2>
        </header>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: Phone, label: "Telefone", value: ouvidoriaPhone },
            { icon: Mail, label: "E-mail", value: ouvidoriaEmail },
            { icon: Clock, label: "Horário", value: ouvidoriaHours },
          ].map((item) => (
            <Card key={item.label} className="group transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
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
              Antes da Ouvidoria, fale com o Atendimento
            </h2>
            <p className="max-w-xl text-primary-foreground/85">
              A Ouvidoria é o canal de 2ª instância. Para resolver questões mais rapidamente,
              a primeira tentativa deve ser feita pelos canais de atendimento.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/atendimento">
                Ir para Atendimento
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
            >
              <a href="#manifestacao">Abrir manifestação</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
