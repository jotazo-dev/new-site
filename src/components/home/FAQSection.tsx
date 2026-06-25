import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FAQPageJsonLd } from "@/components/seo/JsonLd";
import { useSelectedCity } from "@/hooks/useSelectedCity";

interface FAQSectionProps {
  variant?: "centered" | "split";
  image?: string;
  imageAlt?: string;
}

export function FAQSection({ variant = "centered", image, imageAlt = "" }: FAQSectionProps = {}) {
  const { city } = useSelectedCity();
  const { data: faqs = [] } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  if (faqs.length === 0) return null;

  const isSplit = variant === "split" && !!image;
  const faqLd = faqs.map((f) => ({ question: f.question, answer: f.answer }));

  const AccordionList = (
    <Accordion type="single" collapsible className="space-y-3">
      {faqs.map((faq, i) => (
        <AccordionItem
          key={faq.id}
          value={`faq-${i}`}
          className="overflow-hidden rounded-[16px] border border-border bg-card px-5 shadow-sm transition-shadow data-[state=open]:shadow-md"
        >
          <AccordionTrigger className="py-4 text-left text-base font-semibold text-foreground hover:no-underline [&[data-state=open]]:text-primary">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  if (isSplit) {
    return (
      <section className="space-y-8">
        <FAQPageJsonLd faqs={faqLd} />
        <div className="space-y-2 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <HelpCircle className="h-3.5 w-3.5" />
            FAQ
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Perguntas frequentes{city ? <> — <span className="text-accent">{city.name}</span></> : null}
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Tire suas dúvidas sobre nossos serviços de internet, TV e planos móveis.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div className="flex justify-center">
            <img
              src={image}
              alt={imageAlt}
              className="max-h-80 w-auto object-contain lg:max-h-[520px]"
              loading="lazy"
            />
          </div>
          <div>{AccordionList}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <FAQPageJsonLd faqs={faqLd} />
      <div className="space-y-2 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
          <HelpCircle className="h-3.5 w-3.5" />
          FAQ
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Perguntas frequentes{city ? <> — <span className="text-accent">{city.name}</span></> : null}
        </h2>
        <p className="mx-auto max-w-lg text-muted-foreground">
          Tire suas dúvidas sobre nossos serviços de internet, TV e planos móveis.
        </p>
      </div>

      <div className="mx-auto max-w-3xl">{AccordionList}</div>
    </section>
  );
}
