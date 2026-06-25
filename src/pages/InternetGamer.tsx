import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/seo/JsonLd";
import { GamerHero } from "@/components/gamer/GamerHero";
import { GamerStats } from "@/components/gamer/GamerStats";
import { GamerBenefits } from "@/components/gamer/GamerBenefits";
import { GamerImmersion } from "@/components/gamer/GamerImmersion";
import { GamerPlans } from "@/components/gamer/GamerPlans";
import { GameLineup } from "@/components/gamer/GameLineup";
import { GamerFAQ, GAMER_FAQ } from "@/components/gamer/GamerFAQ";
import { GamerTestimonials } from "@/components/gamer/GamerTestimonials";
import { Helmet } from "react-helmet-async";

const GAMER_AREAS = [
  "Apiaí", "Registro", "Pariquera-Açu", "Jacupiranga", "Cajati",
  "Cananéia", "Iguape", "Ilha Comprida", "Eldorado", "Sete Barras",
  "Juquiá", "Miracatu", "Ribeira", "Itapirapuã Paulista",
  "Barra do Chapéu", "Itaóca",
];

export default function InternetGamerPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GAMER_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <SEOHead
        title="Internet Gamer 1 Giga: Ping Baixo, Wi-Fi 6 | Jotazo Telecom"
        description="Fibra 1Gbps simétrica com ping <20ms, Wi-Fi 6 e NAT aberto. Internet pra Valorant, LoL, CS2, Fortnite e Free Fire — sem lag. Confira os planos."
        path="/internet-gamer"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", href: "/" },
          { name: "Planos", href: "/planos" },
          { name: "Internet Gamer", href: "/internet-gamer" },
        ]}
      />
      <ServiceJsonLd
        name="Internet Gamer Fibra 1 Giga"
        description="Internet de fibra óptica 1Gbps simétrica para games, com ping abaixo de 20ms, Wi-Fi 6 incluso, NAT aberto, suporte a IPv6 e roteamento otimizado para servidores brasileiros de Valorant, League of Legends, CS2, Fortnite, Free Fire e Rocket League."
        serviceType="Internet banda larga para games"
        url="/internet-gamer"
        areaServed={GAMER_AREAS}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="space-y-20">
        <GamerHero />
        <GamerStats />
        <GamerBenefits />
        <GamerImmersion />
        <GamerTestimonials />
        <GamerPlans />
        <GameLineup />
        <GamerFAQ />
      </div>
    </>
  );
}
