import { useParams, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { HelpBreadcrumb } from "@/components/help/HelpBreadcrumb";
import { HelpSearch } from "@/components/help/HelpSearch";
import { HelpArticleCard } from "@/components/help/HelpArticleCard";
import { findCategory } from "@/data/helpCenter";

export default function HelpCategoryPage() {
  const { categoria } = useParams();
  const category = categoria ? findCategory(categoria) : null;

  if (!category) {
    return <Navigate to="/ajuda" replace />;
  }

  const Icon = category.icon;

  return (
    <>
      <SEOHead
        path={`/ajuda/${category.slug}`}
        title={`${category.title} — Central de Ajuda`}
        description={category.description}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Central de Ajuda", href: "/ajuda" },
          { name: category.title, href: `/ajuda/${category.slug}` },
        ]}
      />

      <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <HelpBreadcrumb
            items={[{ label: "Central de Ajuda", to: "/ajuda" }, { label: category.title }]}
          />
          <div className="mt-4 flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted ${category.accent}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {category.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {category.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {category.articles.length}{" "}
                {category.articles.length === 1 ? "artigo" : "artigos"}
              </p>
            </div>
          </div>
          <div className="mt-6 max-w-2xl">
            <HelpSearch />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-3 md:grid-cols-2">
          {category.articles.map((a) => (
            <HelpArticleCard
              key={a.slug}
              categorySlug={category.slug}
              article={a}
            />
          ))}
        </div>
      </section>
    </>
  );
}
