import { Link } from "react-router-dom";
import { FileText, ArrowUpRight } from "lucide-react";
import type { HelpArticle } from "@/data/helpCenter";

interface Props {
  categorySlug: string;
  article: HelpArticle;
  categoryTitle?: string;
}

export function HelpArticleCard({ categorySlug, article, categoryTitle }: Props) {
  return (
    <Link
      to={`/ajuda/${categorySlug}/${article.slug}`}
      className="group flex items-start gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        {categoryTitle && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {categoryTitle}
          </p>
        )}
        <h4 className="mt-0.5 text-sm font-semibold text-foreground group-hover:text-primary">
          {article.title}
        </h4>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {article.description}
        </p>
      </div>
      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
