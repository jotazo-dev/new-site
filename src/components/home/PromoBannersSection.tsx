import * as React from "react";
import { Link } from "react-router-dom";
import { trackBannerClick } from "@/lib/bannerTracking";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { supabaseImageUrl } from "@/lib/imageOptim";

type PromoBanner = {
  id: string;
  alt: string;
  bg_gradient: string;
  title: string;
  subtitle: string;
  highlight: string;
  image_url: string;
  image_mobile_url: string;
  link_url: string;
  link_target: string;
};

const fallbackBanners: PromoBanner[] = [
  {
    id: "promo-1",
    alt: "Promoção Jotazo Fibra + TV",
    bg_gradient: "from-primary/90 to-accent/80",
    title: "Fibra + TV",
    subtitle: "A partir de R$ 179,90/mês",
    highlight: "Internet ultra rápida com 80+ canais",
    image_url: "",
    image_mobile_url: "",
    link_url: "",
    link_target: "_self",
  },
  {
    id: "promo-2",
    alt: "Promoção Jotazo 5G",
    bg_gradient: "from-accent/90 to-primary/80",
    title: "Internet 5G",
    subtitle: "Conecte-se com a melhor tecnologia",
    highlight: "Planos móveis a partir de R$ 59,90",
    image_url: "",
    image_mobile_url: "",
    link_url: "",
    link_target: "_self",
  },
];

export function PromoBannersSection() {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [active, setActive] = React.useState(0);
  const [banners, setBanners] = React.useState<PromoBanner[]>([]);
  const [paused, setPaused] = React.useState(false);
  const count = banners.length;

  React.useEffect(() => {
    supabase
      .from("promo_banners")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        setBanners(data && data.length > 0 ? data : fallbackBanners);
      });
  }, []);

  React.useEffect(() => {
    if (!api) return;
    const sync = () => setActive(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api) return;
    if (paused) return;
    const timer = setInterval(() => api.scrollNext(), 8000);
    return () => clearInterval(timer);
  }, [api, paused]);

  if (banners.length === 0) return null;

  const hasImage = (b: PromoBanner) => !!b.image_url;

  return (
    <section
      className="relative w-full overflow-hidden rounded-[20px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((b) => {
            const desktopSrc =
              supabaseImageUrl(b.image_url, { format: "webp", width: 1920, quality: 75 }) || b.image_url;
            const mobileSrc = b.image_mobile_url
              ? supabaseImageUrl(b.image_mobile_url, { format: "webp", width: 768, quality: 75 }) || b.image_mobile_url
              : "";
            const content = hasImage(b) ? (
              <div className="relative h-[200px] w-full sm:h-[280px] md:h-[360px] lg:h-[400px]">
                <picture>
                  {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
                  <source media="(min-width: 768px)" srcSet={desktopSrc} />
                  <img
                    src={desktopSrc}
                    alt={b.alt || "Banner promocional Jotazo Telecom"}
                    width={1920}
                    height={600}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
            ) : (
              <div
                className={`relative flex h-[200px] sm:h-[280px] md:h-[360px] lg:h-[400px] w-full items-center justify-center bg-gradient-to-r ${b.bg_gradient}`}
                style={{ aspectRatio: "1920/600" }}
              >
                <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-background/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-background/10 blur-3xl" />
                <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center text-primary-foreground">
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                    {b.highlight}
                  </span>
                  <h3 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                    {b.title}
                  </h3>
                  <p className="text-base font-medium opacity-90 sm:text-lg md:text-xl">
                    {b.subtitle}
                  </p>
                </div>
              </div>
            );

            if (b.link_url) {
              const isExternal = b.link_url.startsWith("http");
              const openInNewTab = b.link_target === "_blank";
              const handleClick = () => trackBannerClick({ bannerType: "promo", bannerId: b.id, linkUrl: b.link_url });
              return (
                <CarouselItem key={b.id}>
                  {isExternal ? (
                    <a
                      href={b.link_url}
                      target={openInNewTab ? "_blank" : "_self"}
                      rel={openInNewTab ? "noopener noreferrer" : undefined}
                      className="block w-full h-full"
                      onClick={handleClick}
                    >
                      {content}
                    </a>
                  ) : openInNewTab ? (
                    <a
                      href={b.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full"
                      onClick={handleClick}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link to={b.link_url} className="block w-full h-full" onClick={handleClick}>
                      {content}
                    </Link>
                  )}
                </CarouselItem>
              );
            }

            return <CarouselItem key={b.id}>{content}</CarouselItem>;
          })}
        </CarouselContent>
        <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para banner ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={
                "h-2.5 w-2.5 rounded-full transition-all " +
                (i === active
                  ? "bg-background shadow-sm scale-125"
                  : "bg-background/50 hover:bg-background/80")
              }
            />
          ))}
        </div>
      </Carousel>
    </section>
  );
}
