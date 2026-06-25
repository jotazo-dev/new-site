import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Network, Shield, Globe2, Download, ExternalLink, MapPin, CheckCircle2, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";

const GEOFEED_URL = "https://jotazo.com.br/geofeed.csv";

type Prefix = {
  id: string;
  prefix: string;
  country: string;
  region: string;
  city: string;
};

export default function TransparenciaRedePage() {
  const [prefixes, setPrefixes] = useState<Prefix[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("geofeed_prefixes")
      .select("id, prefix, country, region, city")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setPrefixes(data ?? []);
        setLoading(false);
      });
  }, []);

  const totalCidades = new Set(prefixes.map((p) => p.city).filter(Boolean)).size;
  const totalEstados = new Set(prefixes.map((p) => p.region).filter(Boolean)).size;

  return (
    <>
      <SEOHead
        path="/transparencia-rede"
        title="Transparência de Rede — GEOFEED e Blocos de IP | Jotazo Telecom"
        description="Conheça a infraestrutura de rede da Jotazo Telecom: GEOFEED público (RFC 8805), blocos de IP atendidos e práticas de roteamento responsável."
      />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Transparência de Rede", href: "/transparencia-rede" }]} />
      <OrganizationJsonLd />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 py-20 text-primary-foreground mx-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-foreground/20 blur-3xl" />
        </div>

        <div className="container relative mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-2 bg-primary-foreground/10 text-primary-foreground backdrop-blur">
              <Network className="h-3.5 w-3.5" />
              Infraestrutura de Rede
            </Badge>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Transparência de Rede
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/90 md:text-xl">
              Operamos com boas práticas de roteamento e geolocalização autoritativa.
              Aqui você encontra nossos blocos de IP atendidos e o GEOFEED público
              que garante a melhor experiência aos nossos clientes.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/30 py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <StatCard icon={Server} label="Blocos /CIDR" value={prefixes.length.toString()} />
            <StatCard icon={MapPin} label="Cidades atendidas" value={totalCidades.toString()} />
            <StatCard icon={Globe2} label="Estados" value={totalEstados.toString()} />
            <StatCard icon={Shield} label="RFC 8805" value="Compatível" />
          </div>
        </div>
      </section>

      {/* O que é GEOFEED */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-3">RFC 8805</Badge>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Por que isso importa pra você?</h2>
              <p className="mt-4 text-muted-foreground">
                O GEOFEED é um arquivo público que declara a localização exata dos
                nossos blocos de IP. Isso garante que serviços online identifiquem
                sua conexão corretamente, entregando conteúdo mais rápido e evitando
                problemas de acesso.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  "Streaming sem travamentos, com conteúdo do servidor mais próximo",
                  "Acesso a bancos e apps sem alertas de 'localização suspeita'",
                  "Menos verificações de CAPTCHA ao navegar",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <a href={GEOFEED_URL} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                    Baixar GEOFEED (CSV)
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <a
                    href="https://datatracker.ietf.org/doc/html/rfc8805"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ler a RFC 8805
                  </a>
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden border-2 p-0">
              <div className="border-b bg-muted/50 px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-accent/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">geofeed.csv</span>
                </div>
              </div>
              <pre className="overflow-x-auto bg-background p-5 text-xs leading-relaxed">
                <code className="font-mono">
{`# Jotazo Telecom - Geofeed (RFC 8805)
# Format: prefix,country,region,city,postal
${prefixes.slice(0, 6).map((p) => `${p.prefix},${p.country},${p.region},${p.city},`).join("\n") || "# carregando..."}
`}
                </code>
              </pre>
            </Card>
          </div>
        </div>
      </section>

      {/* Tabela de blocos */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">Blocos de IP atendidos</h2>
              <p className="mt-2 text-muted-foreground">
                Lista pública e atualizada dos prefixos /CIDR operados pela Jotazo Telecom.
              </p>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Atualizado em tempo real
            </Badge>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto -mx-px">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left">
                    <th className="px-5 py-3 font-semibold">Prefixo (CIDR)</th>
                    <th className="px-5 py-3 font-semibold">País</th>
                    <th className="px-5 py-3 font-semibold">Região</th>
                    <th className="px-5 py-3 font-semibold">Cidade</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Carregando...</td></tr>
                  ) : prefixes.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Nenhum bloco cadastrado.</td></tr>
                  ) : (
                    prefixes.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                        <td className="px-5 py-3 font-mono font-medium">{p.prefix}</td>
                        <td className="px-5 py-3">{p.country}</td>
                        <td className="px-5 py-3 text-muted-foreground">{p.region}</td>
                        <td className="px-5 py-3">{p.city}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/80 p-10 text-primary-foreground md:p-14">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">
                  Dúvidas técnicas ou solicitações de operadores?
                </h2>
                <p className="mt-2 text-primary-foreground/90">
                  Equipes de NOC, peering e abuse podem entrar em contato através
                  dos nossos canais oficiais.
                </p>
              </div>
              <Button asChild size="lg" variant="secondary">
                <Link to="/atendimento">Falar com a Jotazo</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Network; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}
