import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LucideIcon, ChevronRight, MessageCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

interface LegalPageLayoutProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalPageLayout({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  sections,
}: LegalPageLayoutProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-14 sm:w-14">
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
                {subtitle}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Última atualização: <span className="font-medium text-foreground">{lastUpdated}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* TOC desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nesta página
              </p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      activeId === s.id
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{s.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* TOC mobile */}
          <div className="lg:hidden">
            <Accordion type="single" collapsible>
              <AccordionItem value="toc" className="rounded-lg border bg-card px-4">
                <AccordionTrigger className="text-sm font-semibold">
                  Sumário ({sections.length} seções)
                </AccordionTrigger>
                <AccordionContent>
                  <nav className="space-y-1 pb-2">
                    {sections.map((s, i) => (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        className="block rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {i + 1}. {s.title}
                      </a>
                    ))}
                  </nav>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Sections */}
          <article className="min-w-0">
            <div className="space-y-10">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="mb-4 flex items-baseline gap-3 text-xl font-bold text-foreground sm:text-2xl">
                    <span className="text-sm font-mono text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </h2>
                  <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-li:my-1 prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline sm:prose-base">
                    {s.content}
                  </div>
                </section>
              ))}
            </div>

            {/* CTA final */}
            <Card className="mt-12 border-primary/20 bg-primary/5 p-6 sm:p-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Ainda tem dúvidas?
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nosso time está pronto para esclarecer qualquer ponto deste documento.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to="/atendimento">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Atendimento
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/ouvidoria">Abrir Ouvidoria</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </article>
        </div>
      </section>
    </div>
  );
}
