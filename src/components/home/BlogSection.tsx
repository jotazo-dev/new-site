import { Link } from "react-router-dom";
import { ArrowRight, Globe, Shield, Wifi, Lock, Newspaper, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImageUrl } from "@/lib/imageOptim";

const iconMap: Record<string, any> = { Shield, Wifi, Lock, Newspaper, Zap, Globe };

export function BlogSection() {
  const { data: blogPosts = [] } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id,slug,title,excerpt,image_url,category,category_icon,date_label,read_time,author_first_name,author_last_name,author_avatar_url"
        )
        .eq("active", true)
        .order("sort_order")
        .limit(6);
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (blogPosts.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <Globe className="h-3.5 w-3.5" />
            Blog
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Fique por dentro do mundo digital
          </h2>
          <p className="max-w-lg text-muted-foreground">
            Artigos, dicas e notícias sobre internet, segurança e tecnologia para o seu dia a dia.
          </p>
        </div>
        <Button
          variant="outline"
          asChild
          className="group shrink-0 gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Link to="/blog">
            Ver todos os artigos
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => {
          const IconComp = iconMap[post.category_icon] || Globe;
          const postSlug = (post as any).slug || post.id;
          return (
            <Link to={`/blog/${postSlug}`} key={post.id} className="group">
            <article
              className="flex flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={optimizeImageUrl(post.image_url, { width: 600 })}
                  alt={post.title}
                  width={600}
                  height={400}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur">
                  <IconComp className="h-3 w-3" />
                  {post.category}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                {/* h3 mantido — h2 da seção é "Fique por dentro do mundo digital" */}
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{post.date_label}</span>
                  <span className="font-medium text-primary">{post.read_time} de leitura</span>
                </div>
              </div>
            </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
