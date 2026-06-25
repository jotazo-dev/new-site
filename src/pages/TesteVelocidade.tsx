import { SpeedTestSection } from "@/components/home/SpeedTestSection";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";

export default function TesteVelocidadePage() {
  return (
    <div className="space-y-10">
      <SEOHead title="Teste de Velocidade da Internet — Download, Upload e Ping | Jotazo" description="Meça grátis a velocidade real da sua internet: download, upload, latência (ping) e jitter. Teste preciso e sem instalação, da Jotazo Telecom." path="/teste-de-velocidade" />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Teste de Velocidade", href: "/teste-de-velocidade" }]} />
      <OrganizationJsonLd />
      <header className="text-center space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Teste de Velocidade
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Meça a velocidade real da sua conexão — download, upload, latência e jitter.
        </p>
      </header>
      <SpeedTestSection />
    </div>
  );
}
