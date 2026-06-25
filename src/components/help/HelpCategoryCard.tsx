import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { HelpCategory } from "@/data/helpCenter";
import { cn } from "@/lib/utils";

export function HelpCategoryCard({ category }: { category: HelpCategory }) {
  const Icon = category.icon;
  const count = category.articles.length;

  return (
    <Link
      to={`/ajuda/${category.slug}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl bg-muted",
          category.accent,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-foreground">{category.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {category.description}
        </p>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {count} {count === 1 ? "artigo" : "artigos"}
        </span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
