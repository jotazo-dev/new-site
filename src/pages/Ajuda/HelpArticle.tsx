import { useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { HelpArticleLayout } from "@/components/help/HelpArticleLayout";
import { findArticle } from "@/data/helpCenter";
import {
  isValidElement,
  Children,
  type ReactElement,
  type ReactNode,
} from "react";

type TocItem = { id: string; title: string; level: 2 | 3 };

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return extractText(props.children);
  }
  return "";
}

function extractToc(body: ReactNode): TocItem[] {
  const items: TocItem[] = [];
  Children.forEach(body, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{ id?: string; children?: ReactNode }>;
    const type = el.type as string;
    if (type === "h2" || type === "h3") {
      const id = el.props.id;
      const title = extractText(el.props.children);
      if (id && title) {
        items.push({ id, title, level: type === "h2" ? 2 : 3 });
      }
    }
  });
  return items;
}

export default function HelpArticlePage() {
  const { categoria, artigo } = useParams();
  const result = categoria && artigo ? findArticle(categoria, artigo) : null;

  const toc = useMemo(
    () => (result ? extractToc(result.article.body) : []),
    [result],
  );

  if (!result) {
    return <Navigate to="/ajuda" replace />;
  }

  const { category, article } = result;

  return (
    <>
      <SEOHead
        path={`/ajuda/${category.slug}/${article.slug}`}
        title={`${article.title} — Central de Ajuda`}
        description={article.description}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Central de Ajuda", href: "/ajuda" },
          { name: category.title, href: `/ajuda/${category.slug}` },
          { name: article.title, href: `/ajuda/${category.slug}/${article.slug}` },
        ]}
      />
      <HelpArticleLayout category={category} article={article} toc={toc}>
        {article.body}
      </HelpArticleLayout>
    </>
  );
}
