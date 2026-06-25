import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchArticles } from "@/data/helpCenter";
import { cn } from "@/lib/utils";

interface HelpSearchProps {
  size?: "default" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
}

export function HelpSearch({
  size = "default",
  autoFocus,
  placeholder = "Busque por 'roteador', 'boleto', 'lentidão'...",
}: HelpSearchProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => searchArticles(q), [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSelect = (categorySlug: string, articleSlug: string) => {
    setOpen(false);
    setQ("");
    navigate(`/ajuda/${categorySlug}/${articleSlug}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Buscar na Central de Ajuda"
          className={cn(
            "border-2 bg-background pl-12 pr-12 shadow-sm focus-visible:ring-2 focus-visible:ring-primary",
            size === "lg" ? "h-14 text-base" : "h-12",
          )}
        />
        {q && (
          <button
            type="button"
            aria-label="Limpar"
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && q && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border bg-popover p-2 shadow-2xl">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado para "<span className="font-medium text-foreground">{q}</span>".
              <br />
              <Link to="/atendimento" className="text-primary hover:underline">
                Fale com um especialista →
              </Link>
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map(({ category, article }) => (
                <li key={`${category.slug}/${article.slug}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(category.slug, article.slug)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {article.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {category.title} · {article.description}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
