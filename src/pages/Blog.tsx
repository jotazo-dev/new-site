import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Shield, Wifi, Lock, Newspaper, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, ItemListJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";

const iconMap: Record<string, any> = { Shield, Wifi, Lock, Newspaper, Zap, Globe };
const PER_PAGE = 9;

export default function BlogPage() {
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id,slug,title,excerpt,image_url,category,category_icon,date_label,read_time,author_first_name,author_last_name,author_avatar_url"
        )
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  const filtered = category === "all" ? posts : posts.filter((p) => p.category === category);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);

  function goToPage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeCategory(cat: string) {
    setCategory(cat);
    setPage(1);
  }

  return (
    <>
      <SEOHead title="Blog Jotazo — Internet Fibra, 5G, Wi-Fi e Tecnologia" description="Artigos, tutoriais e novidades sobre internet fibra óptica, 5G, Wi-Fi, segurança digital, streaming e tecnologia para residências e empresas." path="/blog" />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }, { name: "Blog", href: "/blog" }]} />
      <OrganizationJsonLd />
      <ItemListJsonLd
        name="Artigos do Blog Jotazo Telecom"
        items={filtered.map((p) => ({
          name: p.title,
          url: `/blog/${(p as any).slug || p.id}`,
        }))}
      />
      <div className="mx-auto max-w-7xl px-4 py-16 space-y-10">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <Globe className="h-3.5 w-3.5" />
            Blog
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Fique por dentro do mundo digital</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Artigos, dicas e notícias sobre internet, segurança e tecnologia.</p>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant={category === "all" ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => changeCategory("all")}>
              Todos
            </Button>
            {categories.map((c) => (
              <Button key={c} variant={category === c ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => changeCategory(c)}>
                {c}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Nenhum artigo encontrado.</div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((post, idx) => {
                const IconComp = iconMap[post.category_icon] || Globe;
                const slug = (post as any).slug || post.id;
                const isLcp = page === 1 && idx < 3;
                return (
                  <Link to={`/blog/${slug}`} key={post.id} className="group">
                    <article className="flex flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-sm transition-shadow hover:shadow-lg h-full">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          width={600}
                          height={400}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading={isLcp ? "eager" : "lazy"}
                          decoding="async"
                          {...(isLcp ? { fetchPriority: "high" as any } : {})}
                        />
                        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur">
                          <IconComp className="h-3 w-3" />
                          {post.category}
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{post.title}</h3>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">{post.excerpt}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {(post as any).author_avatar_url && (
                              <img src={(post as any).author_avatar_url} alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover" loading="lazy" decoding="async" />
                            )}
                            <span>
                              {(post as any).author_first_name
                                ? `${(post as any).author_first_name} ${(post as any).author_last_name}`.trim()
                                : post.date_label}
                            </span>
                            {(post as any).author_first_name && <span>· {post.date_label}</span>}
                          </div>
                          <span className="font-medium text-primary">{post.read_time} de leitura</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" disabled={page === 1} onClick={() => goToPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" disabled={page === totalPages} onClick={() => goToPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
