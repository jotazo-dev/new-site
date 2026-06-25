import { Link } from "react-router-dom";
import { LifeBuoy, Phone, MessageCircle, Mail, ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HelpSearch } from "@/components/help/HelpSearch";
import { HelpCategoryCard } from "@/components/help/HelpCategoryCard";
import { HelpArticleCard } from "@/components/help/HelpArticleCard";
import { helpCategories, getPopularArticles } from "@/data/helpCenter";

export default function HelpHomePage() {
  const popular = getPopularArticles(6);

  const faqs = [
    { question: "Como acesso a 2ª via do meu boleto?", answer: "Pelo Portal do Cliente em jotazo.rbxsoft.com, pelo app Jotazo ou enviando 'boleto' para nosso WhatsApp." },
    { question: "Como reinicio meu roteador corretamente?", answer: "Tire o cabo de energia da ONU e do roteador, aguarde 30 segundos, ligue primeiro a ONU, espere 1 minuto e depois ligue o roteador." },
    { question: "Qual é o horário de atendimento?", answer: "Suporte técnico 24 horas. Atendimento comercial via WhatsApp das 8h às 22h." },
    { question: "Como cancelo o serviço?", answer: "Pelo WhatsApp, telefone 0800 721 0179, Portal do Cliente ou loja física. O cancelamento é efetivado em até 24 horas." },
  ];

  return (
    <>
      <SEOHead
        path="/ajuda"
        title="Central de Ajuda — Tutoriais e Suporte | Jotazo Telecom"
        description="Tutoriais técnicos, guias e respostas oficiais sobre internet fibra, 5G, TV, Wi-Fi, faturas e cancelamento. Encontre soluções rápidas para seus serviços Jotazo."
      />
      <BreadcrumbJsonLd items={[{ name: "Central de Ajuda", href: "/ajuda" }]} />
      <FAQPageJsonLd faqs={faqs} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/15 via-background to-background">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:py-20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <LifeBuoy className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Como podemos ajudar?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Tutoriais, soluções de problemas e respostas para as dúvidas mais comuns sobre seus
            serviços Jotazo.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <HelpSearch size="lg" />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span>Buscas populares:</span>
            {["lentidão", "boleto", "wifi", "5G", "cancelar"].map((t) => (
              <span key={t} className="rounded-full border bg-background px-2.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Navegue por categoria</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {helpCategories.length} categorias com tudo que você precisa saber.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {helpCategories.map((c) => (
            <HelpCategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      {/* Populares */}
      {popular.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <h2 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">Artigos mais lidos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {popular.map(({ category, article }) => (
              <HelpArticleCard
                key={`${category.slug}/${article.slug}`}
                categorySlug={category.slug}
                article={article}
                categoryTitle={category.title}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA contato */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Não encontrou o que procurava?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Nosso time atende 24/7 pelos canais abaixo. Você é nossa prioridade.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href="https://wa.me/5511920047488" target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="tel:08007210179">
                  <Phone className="mr-1.5 h-4 w-4" />
                  0800 721 0179
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:contato@jotazo.com">
                  <Mail className="mr-1.5 h-4 w-4" />
                  E-mail
                </a>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/atendimento">
                  Atendimento <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
