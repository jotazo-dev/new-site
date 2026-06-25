import { MessageCircle } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { CustomComboSection } from "@/components/home/CustomComboSection";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { WHATSAPP } from "@/config/site";

export default function MonteSeuComboPage() {
  const settings = useSiteSettings();
  const number = (settings.whatsapp_number || WHATSAPP.number).replace(/\D/g, "");
  const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(
    "Olá! Quero ajuda para montar meu combo personalizado."
  )}`;

  return (
    <>
      <SEOHead
        title="Monte seu Combo — Fibra + 5G + TV com Desconto | Jotazo"
        description="Crie um combo personalizado de internet fibra, móvel 5G e TV. Escolha velocidades, franquias e canais sob medida e economize na fatura mensal da Jotazo Telecom."
        path="/monte-seu-combo"
        noindex
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", href: "/" },
          { name: "Monte seu Combo", href: "/monte-seu-combo" },
        ]}
      />

      <div className="relative">
        {/* Mesh gradient background (clipado pelo wrapper externo se necessário) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        </div>

        {/* Hero */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-16 pb-8 text-center">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Configurador exclusivo
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Monte seu combo do seu jeito
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Combine Internet Fibra, Móvel 5G e TV em um único pacote — você paga apenas pelo que precisa.
          </p>
        </section>

        {/* Combo configurator */}
        <div className="mx-auto w-full max-w-7xl px-4">
          <CustomComboSection hideHeader />
        </div>

        {/* CTA secundária */}
        <section className="mx-auto w-full max-w-2xl px-4 py-16">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:border-[#25D366] hover:shadow-lg"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white">
              <MessageCircle className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Falar no WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Tire dúvidas e monte seu combo com nosso time.
              </p>
            </div>
          </a>
        </section>
      </div>
    </>
  );
}
