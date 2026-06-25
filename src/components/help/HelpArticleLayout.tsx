import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpBreadcrumb, type Crumb } from "./HelpBreadcrumb";
import { HelpArticleCard } from "./HelpArticleCard";
import type { HelpArticle, HelpCategory } from "@/data/helpCenter";
import { findArticle, helpCategories } from "@/data/helpCenter";
import { toast } from "@/hooks/use-toast";
import { FileText, List, FolderOpen, LifeBuoy } from "lucide-react";

interface Props {
  category: HelpCategory;
  article: HelpArticle;
  toc: { id: string; title: string; level: 2 | 3 }[];
  children: ReactNode;
}

export function HelpArticleLayout({ category, article, toc, children }: Props) {
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  const breadcrumb: Crumb[] = [
    { label: "Central de Ajuda", to: "/ajuda" },
    { label: category.title, to: `/ajuda/${category.slug}` },
    { label: article.title },
  ];

  const related =
    article.related
      ?.map((r) => findArticle(r.categorySlug, r.articleSlug))
      .filter((x): x is { category: HelpCategory; article: HelpArticle } => !!x) ?? [];

  function handleFeedback(value: "up" | "down") {
    setFeedback(value);
    toast({
      title: value === "up" ? "Obrigado pelo retorno!" : "Vamos melhorar este artigo",
      description:
        value === "up"
          ? "Que bom que ajudou. Continue navegando pela Central."
          : "Você pode falar com nosso time se precisar de uma resposta detalhada.",
    });
  }

  return (
    <div className="bg-background">
      {/* Header do artigo */}
      <section className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <HelpBreadcrumb items={breadcrumb} />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {article.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
            {article.description}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Atualizado em {article.updatedAt}
          </div>
        </div>
      </section>

      {/* Corpo */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <article className="min-w-0">
            {toc.length > 0 && (
              <div className="mb-6 lg:hidden">
                <Accordion type="single" collapsible>
                  <AccordionItem value="toc" className="rounded-lg border bg-card px-4">
                    <AccordionTrigger className="text-sm font-semibold">
                      Sumário ({toc.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <nav className="space-y-1 pb-2">
                        {toc.map((t) => (
                          <a
                            key={t.id}
                            href={`#${t.id}`}
                            className={`block rounded px-2 py-1.5 text-sm hover:bg-muted hover:text-foreground ${
                              t.level === 3 ? "pl-5 text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {t.title}
                          </a>
                        ))}
                      </nav>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            <div className="prose prose-sm max-w-none text-foreground prose-headings:scroll-mt-24 prose-headings:text-foreground prose-h2:mt-10 prose-h2:text-xl prose-h2:font-bold prose-h3:mt-6 prose-h3:text-base prose-h3:font-semibold prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-li:my-1 prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:text-foreground prose-th:bg-muted prose-th:font-semibold prose-th:p-3 prose-td:p-3 prose-td:border-b prose-tr:border-b prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none sm:prose-base">
              {children}
            </div>

            {/* Feedback */}
            <Card className="mt-10 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-foreground">Esse artigo foi útil?</p>
                <div className="flex gap-2">
                  <Button
                    variant={feedback === "up" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFeedback("up")}
                  >
                    <ThumbsUp className="mr-1.5 h-4 w-4" />
                    Sim
                  </Button>
                  <Button
                    variant={feedback === "down" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFeedback("down")}
                  >
                    <ThumbsDown className="mr-1.5 h-4 w-4" />
                    Não
                  </Button>
                </div>
              </div>
            </Card>

            {/* Relacionados */}
            {related.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-foreground">Artigos relacionados</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {related.map(({ category: c, article: a }) => (
                    <HelpArticleCard
                      key={`${c.slug}/${a.slug}`}
                      categorySlug={c.slug}
                      article={a}
                      categoryTitle={c.title}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* CTA contato */}
            <Card className="mt-10 border-primary/20 bg-primary/5 p-6">
              <h3 className="text-base font-semibold text-foreground">
                Ainda precisa de ajuda?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Nosso time está pronto para resolver seu caso pelo canal que você preferir.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <a
                    href="https://wa.me/5511920047488"
                    target="_blank"
                    rel="noreferrer"
                  >
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
                    contato@jotazo.com
                  </a>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/atendimento">
                    Atendimento <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </article>

          {/* Sidebar de navegação - desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 -mr-2">
              {/* TOC */}
              {toc.length > 0 && (
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <List className="h-3.5 w-3.5" />
                    Nesta página
                  </p>
                  <nav className="space-y-0.5 border-l">
                    {toc.map((t) => (
                      <a
                        key={t.id}
                        href={`#${t.id}`}
                        className={`block border-l-2 px-3 py-1.5 text-sm transition-colors -ml-px ${
                          activeId === t.id
                            ? "border-primary font-medium text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        } ${t.level === 3 ? "pl-6 text-xs" : ""}`}
                      >
                        {t.title}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Artigos da categoria atual */}
              {category.articles.length > 1 && (
                <div>
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    {category.title}
                  </p>
                  <nav className="space-y-0.5">
                    {category.articles.map((a) => {
                      const isCurrent = a.slug === article.slug;
                      return (
                        <Link
                          key={a.slug}
                          to={`/ajuda/${category.slug}/${a.slug}`}
                          className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                            isCurrent
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {a.title}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* Outras categorias */}
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Outras categorias
                </p>
                <nav className="space-y-0.5">
                  {helpCategories
                    .filter((c) => c.slug !== category.slug)
                    .map((c) => {
                      const Icon = c.icon;
                      return (
                        <Link
                          key={c.slug}
                          to={`/ajuda/${c.slug}`}
                          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Icon className={`h-3.5 w-3.5 ${c.accent}`} />
                          {c.title}
                        </Link>
                      );
                    })}
                </nav>
              </div>

              {/* Mini CTA */}
              <Card className="border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <LifeBuoy className="h-4 w-4 text-primary" />
                  Precisa falar com a gente?
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atendimento humano 24/7 pelo WhatsApp.
                </p>
                <Button asChild size="sm" className="mt-3 w-full">
                  <a
                    href="https://wa.me/5511920047488"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Abrir WhatsApp
                  </a>
                </Button>
              </Card>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
