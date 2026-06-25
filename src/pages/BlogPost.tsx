import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Globe, Shield, Wifi, Lock, Newspaper, Zap, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { optimizeImageUrl } from "@/lib/imageOptim";
import DOMPurify from "dompurify";

const iconMap: Record<string, any> = { Shield, Wifi, Lock, Newspaper, Zap, Globe };

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Artigo não encontrado</h1>
        <Button asChild variant="outline"><Link to="/blog"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao blog</Link></Button>
      </div>
    );
  }

  const IconComp = iconMap[post.category_icon] || Globe;

  return (
    <>
      <SEOHead title={post.title} description={post.excerpt} path={`/blog/${slug}`} type="article" ogImage={post.image_url} />
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        url={`/blog/${slug}`}
        imageUrl={post.image_url}
        datePublished={post.created_at}
        dateModified={post.updated_at}
      />
      <BreadcrumbJsonLd items={[
        { name: "Home", href: "/" },
        { name: "Blog", href: "/blog" },
        { name: post.title, href: `/blog/${slug}` },
      ]} />
      <article className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link to="/blog"><ArrowLeft className="h-3.5 w-3.5" />Voltar ao blog</Link>
        </Button>

        {post.image_url && (
          <img
            src={optimizeImageUrl(post.image_url, { width: 1200, quality: 80 })}
            alt={post.title}
            width={1200}
            height={630}
            className="w-full h-56 sm:h-72 object-cover rounded-2xl"
            loading="eager"
            decoding="async"
            fetchPriority={"high" as any}
          />
        )}

        <div className="space-y-4">
          <Badge className="bg-primary/90 text-primary-foreground gap-1.5">
            <IconComp className="h-3 w-3" />
            {post.category}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {post.author_first_name && (
              <div className="flex items-center gap-2">
                {post.author_avatar_url && (
                  <img src={post.author_avatar_url} alt={`${post.author_first_name} ${post.author_last_name}`} width={32} height={32} className="h-8 w-8 rounded-full object-cover border border-border" loading="lazy" decoding="async" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{post.author_first_name} {post.author_last_name}</span>
                  {post.author_instagram && (
                    <a href={`https://instagram.com/${post.author_instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Instagram className="h-3 w-3" />
                      {post.author_instagram.startsWith("@") ? post.author_instagram : `@${post.author_instagram}`}
                    </a>
                  )}
                </div>
              </div>
            )}
            {post.date_label && <span>{post.date_label}</span>}
            {post.read_time && <span>· {post.read_time} de leitura</span>}
          </div>
        </div>

        <div
          className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl [&_img]:!max-w-full [&_img]:!h-auto [&_table]:!block [&_table]:!w-full [&_table]:!overflow-x-auto [&_pre]:!overflow-x-auto [&_blockquote]:!break-words"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(post.content || "", {
              ADD_ATTR: ["target", "rel", "style"],
              FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
              FORBID_ATTR: ["onerror", "onload", "onclick"],
            }),
          }}
        />
      </article>
    </>
  );
}
