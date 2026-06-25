import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, Film, Images, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

type PublicSettings = {
  active: boolean;
  post_count: number;
  layout: "grid" | "carousel" | "masonry" | string;
  columns_desktop: number;
  columns_mobile: number;
  aspect_ratio: "square" | "portrait" | "landscape" | "original" | string;
  show_caption: boolean;
  show_type_icon: boolean;
  title: string;
  subtitle: string;
  profile_url: string;
  cta_label: string;
  cache_minutes: number;
};

type Post = {
  id: string;
  caption: string;
  type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;
  image: string;
  link: string;
  timestamp: string;
};

const aspectClass: Record<string, string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[16/9]",
  original: "",
};

const desktopGridCols: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};
const mobileGridCols: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

function TypeIcon({ type }: { type: string }) {
  if (type === "VIDEO") return <Film className="h-4 w-4" />;
  if (type === "CAROUSEL_ALBUM") return <Images className="h-4 w-4" />;
  return <Instagram className="h-4 w-4" />;
}

function PostCard({ post, settings, className }: { post: Post; settings: PublicSettings; className?: string }) {
  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative block overflow-hidden rounded-[20px] bg-muted shadow-sm ring-1 ring-border/50 transition-all hover:shadow-xl hover:ring-primary/40 ${aspectClass[settings.aspect_ratio] || "aspect-square"} ${className || ""}`}
    >
      <img
        src={post.image}
        alt={post.caption?.slice(0, 80) || "Instagram post"}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {settings.show_type_icon && (
        <div className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur">
          <TypeIcon type={post.type} />
        </div>
      )}
      {settings.show_caption && post.caption && (
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="line-clamp-3 text-xs leading-relaxed">{post.caption}</p>
        </div>
      )}
    </a>
  );
}

export function InstagramFeedSection() {
  const { data: settings } = useQuery({
    queryKey: ["instagram-public-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_settings_public" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PublicSettings | null;
    },
  });

  const enabled = !!settings?.active;

  const { data: feed, isLoading } = useQuery({
    queryKey: ["instagram-feed"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("instagram-feed", { body: {} });
      if (error) throw error;
      return data as { posts: Post[] };
    },
    enabled,
    staleTime: (settings?.cache_minutes ?? 30) * 60 * 1000,
  });

  if (!settings || !settings.active) return null;

  const posts = feed?.posts || [];
  const desktopCols = desktopGridCols[settings.columns_desktop] || "md:grid-cols-3";
  const mobileCols = mobileGridCols[settings.columns_mobile] || "grid-cols-2";

  const renderGrid = () => (
    <div className={`grid gap-3 ${mobileCols} ${desktopCols}`}>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} settings={settings} />
      ))}
    </div>
  );

  const renderMasonry = () => (
    <div className={`grid gap-3 ${mobileCols} ${desktopCols}`}>
      {posts.map((p, i) => (
        <PostCard
          key={p.id}
          post={p}
          settings={settings}
          className={i === 0 ? "md:col-span-2 md:row-span-2" : ""}
        />
      ))}
    </div>
  );

  const renderCarousel = () => (
    <Carousel opts={{ align: "start", loop: true }}>
      <CarouselContent>
        {posts.map((p) => (
          <CarouselItem key={p.id} className={`basis-1/${settings.columns_mobile} md:basis-1/${settings.columns_desktop}`}>
            <PostCard post={p} settings={settings} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );

  return (
    <section className="relative space-y-8">
      {/* mesh gradient sutil */}
      <div className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 opacity-60 blur-3xl">
        <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-accent/10" />
        <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-primary/10" />
      </div>

      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center justify-center gap-2">
          <Instagram className="h-4 w-4" /> Instagram
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{settings.title}</h2>
        {settings.subtitle && <p className="mt-3 text-sm text-muted-foreground md:text-base">{settings.subtitle}</p>}
      </header>

      {isLoading ? (
        <div className={`grid gap-3 ${mobileCols} ${desktopCols}`}>
          {Array.from({ length: settings.post_count }).map((_, i) => (
            <Skeleton key={i} className={`rounded-[20px] ${aspectClass[settings.aspect_ratio] || "aspect-square"}`} />
          ))}
        </div>
      ) : posts.length === 0 ? null : settings.layout === "carousel" ? (
        renderCarousel()
      ) : settings.layout === "masonry" ? (
        renderMasonry()
      ) : (
        renderGrid()
      )}

      {posts.length > 0 && settings.profile_url && (
        <div className="flex justify-center">
          <Button asChild variant="outline" className="rounded-full">
            <a href={settings.profile_url} target="_blank" rel="noopener noreferrer">
              <Instagram className="mr-2 h-4 w-4" />
              {settings.cta_label || "Ver perfil"}
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      )}
    </section>
  );
}
