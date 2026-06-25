import { useState, useRef } from "react";

import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Rocket,
  Users,
  Cpu,
  Heart,
  GraduationCap,
  TrendingUp,
  MapPin,
  Upload,
  FileText,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const benefits = [
  { icon: Rocket, title: "Crescimento Acelerado", desc: "Oportunidades reais de desenvolvimento e promoção interna." },
  { icon: Cpu, title: "Tecnologia de Ponta", desc: "Trabalhe com as tecnologias mais modernas do mercado de telecom." },
  { icon: Users, title: "Ambiente Colaborativo", desc: "Time unido, diverso e apaixonado por conectar pessoas." },
  { icon: Heart, title: "Qualidade de Vida", desc: "Benefícios completos e equilíbrio entre vida pessoal e profissional." },
  { icon: GraduationCap, title: "Capacitação Contínua", desc: "Treinamentos, workshops e incentivo a certificações." },
  { icon: TrendingUp, title: "Impacto Real", desc: "Seu trabalho conecta milhares de pessoas e transforma comunidades." },
];

const positionOptions = [
  "Técnico de Campo",
  "Suporte / Atendimento",
  "Tecnologia / TI",
  "Comercial / Vendas",
  "Administrativo / Financeiro",
  "Marketing",
  "Outro",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function TrabalheConosco() {
  const { data: openPositions = [] } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, department, type, location, description")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", availableToTravel: "", position: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formMountedAt = useRef<number>(Date.now());

  const phoneMask = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const valid =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.phone.replace(/\D/g, "").length >= 10 &&
    form.city.trim().length >= 2 &&
    (form.availableToTravel === "sim" || form.availableToTravel === "nao") &&
    form.position &&
    file !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !file) return;
    if (honeypot.trim() !== "" || Date.now() - formMountedAt.current < 2000) {
      setSent(true);
      return;
    }
    setSending(true);

    try {
      const ext = file.name.split(".").pop() || "pdf";
      const filePath = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("resumes").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase.from("resumes").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        available_to_travel: form.availableToTravel === "sim",
        position: form.position,
        message: form.message.trim(),
        file_path: filePath,
        file_name: file.name,
      });
      if (insertErr) throw insertErr;

      setSent(true);
      toast({ title: "Currículo enviado!", description: "Obrigado pelo interesse. Entraremos em contato em breve." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao enviar", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const heroHighlights = [
    { metric: `${openPositions.length || "—"}`, label: "Vagas abertas agora" },
    { metric: "6+", label: "Áreas de atuação" },
    { metric: "100%", label: "Plano de carreira" },
    { metric: "24/7", label: "Treinamento contínuo" },
  ];

  return (
    <>
      <SEOHead
        title="Trabalhe Conosco — Vagas e Carreiras na Jotazo Telecom"
        description="Faça parte do time da Jotazo Telecom em Apiaí/SP e região do Vale do Ribeira. Veja vagas abertas em técnico de campo, atendimento, comercial e tecnologia, e envie seu currículo."
        path="/trabalhe-conosco"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", href: "/" },
          { name: "Trabalhe Conosco", href: "/trabalhe-conosco" },
        ]}
      />
      <OrganizationJsonLd />

      <div className="space-y-20">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-2xl border bg-primary text-primary-foreground">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-background/10 blur-3xl" />
          <div className="relative grid gap-10 p-8 md:grid-cols-2 md:items-center md:p-14">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1">
                <Briefcase className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Carreiras
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                Construa sua carreira na Jotazo
              </h1>
              <p className="max-w-lg text-base text-primary-foreground/85 md:text-lg">
                Faça parte de um time que conecta pessoas, transforma comunidades e cresce junto com você.
                Aqui, seu trabalho tem propósito e reconhecimento.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href="#formulario">
                    Enviar currículo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/60 bg-primary-foreground/15 text-primary-foreground font-semibold hover:bg-primary-foreground/25"
                >
                  <a href="#vagas">Ver vagas</a>
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 pt-4 text-sm text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  Plano de carreira
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  Benefícios completos
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  Ambiente diverso
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

        {/* BENEFÍCIOS */}
        <section className="space-y-8">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Por que trabalhar na Jotazo
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Mais do que um emprego
            </h2>
            <p className="mt-3 text-muted-foreground">
              Uma oportunidade de fazer a diferença, com estrutura, propósito e crescimento.
            </p>
          </header>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <Card key={b.title} className="group transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* VAGAS */}
        <section id="vagas" className="space-y-8 scroll-mt-20">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Oportunidades
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Vagas abertas
            </h2>
            <p className="mt-3 text-muted-foreground">
              Confira as oportunidades disponíveis e candidate-se.
            </p>
          </header>
          {openPositions.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhuma vaga aberta no momento. Envie seu currículo mesmo assim!
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {openPositions.map((v) => (
                <Card key={v.id} className="group transition-shadow hover:shadow-md">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{v.title}</h3>
                      {v.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{v.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {v.department && <span className="rounded-full bg-muted px-2 py-0.5">{v.department}</span>}
                        <span className="rounded-full bg-muted px-2 py-0.5">{v.type}</span>
                        {v.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {v.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0" asChild>
                      <a href="#formulario">Candidatar</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* FORMULÁRIO */}
        <section id="formulario" className="mx-auto max-w-3xl space-y-8 scroll-mt-20">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Banco de talentos
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Envie seu currículo
            </h2>
            <p className="mt-3 text-muted-foreground">
              Preencha seus dados e anexe seu currículo. Entraremos em contato caso seu perfil
              se encaixe em uma de nossas oportunidades.
            </p>
          </header>

          <Card>
            <CardContent className="p-6 md:p-8">
              {sent ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold">Currículo enviado com sucesso!</h3>
                  <p className="text-muted-foreground">Obrigado pelo interesse em fazer parte do time Jotazo.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
                    <label htmlFor="website_url">Não preencha este campo</label>
                    <input
                      id="website_url"
                      type="text"
                      name="website_url"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input id="name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input id="email" type="email" required maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: phoneMask(e.target.value) })} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade onde trabalha/mora *</Label>
                      <Input id="city" required maxLength={100} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ex.: Apiaí - SP" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="travel">Disponibilidade para viajar *</Label>
                      <Select value={form.availableToTravel} onValueChange={(v) => setForm({ ...form, availableToTravel: v })}>
                        <SelectTrigger id="travel"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Área de interesse *</Label>
                      <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                        <SelectTrigger id="position"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {positionOptions.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem (opcional)</Label>
                    <Textarea id="message" maxLength={1000} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Conte um pouco sobre você e sua experiência..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Currículo (PDF ou DOC, máx. 5 MB) *</Label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (!ALLOWED_TYPES.includes(f.type)) {
                          toast({ title: "Formato inválido", description: "Envie um arquivo PDF ou DOC.", variant: "destructive" });
                          return;
                        }
                        if (f.size > MAX_FILE_SIZE) {
                          toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 5 MB.", variant: "destructive" });
                          return;
                        }
                        setFile(f);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 text-left transition-colors hover:border-accent/60 hover:bg-accent/5"
                    >
                      {file ? (
                        <>
                          <FileText className="h-5 w-5 text-accent" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Clique para selecionar o arquivo</span>
                        </>
                      )}
                    </button>
                  </div>

                  <Button type="submit" disabled={!valid || sending} size="lg" className="w-full">
                    {sending ? "Enviando..." : "Enviar currículo"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>

        {/* CTA FINAL */}
        <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Conecte-se à Jotazo
              </h2>
              <p className="max-w-xl text-primary-foreground/85">
                Não encontrou a vaga ideal? Envie seu currículo mesmo assim — novas oportunidades surgem o tempo todo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href="#formulario">
                  Enviar currículo
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
        </section>
      </div>
    </>
  );
}
