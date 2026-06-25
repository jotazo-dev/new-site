import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = { label: string; to?: string };

export function HelpBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        <li>
          <Link to="/" className="flex items-center hover:text-foreground">
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Início</span>
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            {c.to && i < items.length - 1 ? (
              <Link to={c.to} className="hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
