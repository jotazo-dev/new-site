import { Link } from "react-router-dom";
import * as React from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { BreadcrumbJsonLd, OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";
import { AnswerFirstParagraph } from "@/components/seo/AnswerFirstParagraph";
import { Helmet } from "react-helmet-async";

import { LazySection } from "@/components/common/LazySection";

// Above-the-fold / first-screen sections — eager
import { PremiumPlansSection } from "@/components/shop/PremiumPlansSection";
import { CoverageCheckSection } from "@/components/home/CoverageCheckSection";
import { Chip5GBrasilSection } from "@/components/home/Chip5GBrasilSection";
import { SelfServiceSection } from "@/components/home/SelfServiceSection";
import { ExitOfferPopup } from "@/components/home/ExitOfferPopup";

// Below-the-fold — lazy chunks, prefetched on idle
const TestimonialsSection = React.lazy(() =>
  import("@/components/home/TestimonialsSection").then((m) => ({ default: m.TestimonialsSection }))
);
const MidBannersSection = React.lazy(() =>
  import("@/components/home/MidBannersSection").then((m) => ({ default: m.MidBannersSection }))
);
const Chip5GLaunchSection = React.lazy(() =>
  import("@/components/home/Chip5GLaunchSection").then((m) => ({ default: m.Chip5GLaunchSection }))
);
const HighlightCardsSection = React.lazy(() =>
  import("@/components/home/HighlightCardsSection").then((m) => ({ default: m.HighlightCardsSection }))
);
const BlogSection = React.lazy(() =>
  import("@/components/home/BlogSection").then((m) => ({ default: m.BlogSection }))
);
const ComboOffersSection = React.lazy(() =>
  import("@/components/home/ComboOffersSection").then((m) => ({ default: m.ComboOffersSection }))
);
const ServicesOverviewSection = React.lazy(() =>
  import("@/components/home/ServicesOverviewSection").then((m) => ({ default: m.ServicesOverviewSection }))
);
const AppDownloadSection = React.lazy(() =>
  import("@/components/home/AppDownloadSection").then((m) => ({ default: m.AppDownloadSection }))
);
const TVStreamingSection = React.lazy(() =>
  import("@/components/home/TVStreamingSection").then((m) => ({ default: m.TVStreamingSection }))
);
const NetflixCatalogSection = React.lazy(() =>
  import("@/components/home/NetflixCatalogSection").then((m) => ({ default: m.NetflixCatalogSection }))
);
const PromoBannersSection = React.lazy(() =>
  import("@/components/home/PromoBannersSection").then((m) => ({ default: m.PromoBannersSection }))
);

// Prefetch helpers (referenced as LazySection prefetch props below)
const prefetchTestimonials = () => import("@/components/home/TestimonialsSection");
const prefetchMidBanners = () => import("@/components/home/MidBannersSection");
const prefetchChip5G = () => import("@/components/home/Chip5GLaunchSection");
const prefetchHighlight = () => import("@/components/home/HighlightCardsSection");
const prefetchBlog = () => import("@/components/home/BlogSection");


const prefetchCombo = () => {
  const mod = import("@/components/home/ComboOffersSection");
  mod.then((m) => {
    m.comboImageUrls?.forEach((url) => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    });
  }).catch(() => {});
  return mod;
};
const prefetchServices = () => import("@/components/home/ServicesOverviewSection");
const prefetchTv = () => import("@/components/home/TVStreamingSection");
const prefetchAppDownload = () => import("@/components/home/AppDownloadSection");
const prefetchNetflix = () => import("@/components/home/NetflixCatalogSection");
const prefetchPromo = () => import("@/components/home/PromoBannersSection");


import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";

import { useQuery } from "@tanstack/react-query";
import heroBannerFallback from "@/assets/jotazo-telecom-hero-banner.webp";
import { supabase } from "@/integrations/supabase/client";
import { trackBannerClick } from "@/lib/bannerTracking";
import { supabaseImageUrl } from "@/lib/imageOptim";
import { useSiteSettingsLoaded } from "@/hooks/useSiteSettings";
import { usePrefetchHomeData } from "@/hooks/usePrefetchHomeData";
import { Skeleton } from "@/components/ui/skeleton";

type HeroBanner = {
  id: string;
  image_url: string;
  image_mobile_url: string;
  alt: string;
  kicker: string;
  title_top: string;
  title_bottom: string;
  cta_primary: string;
  to_primary: string;
  cta_secondary: string;
  to_secondary: string;
  link_url?: string;
  link_target?: string;
};

function HeroCarousel() {
  const { settings } = useSiteSettingsLoaded();
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [active, setActive] = React.useState(0);
  const [snapCount, setSnapCount] = React.useState(1);
  const [paused, setPaused] = React.useState(false);

  const intervalSec = Number(settings["hero_banner_interval"]);
  const intervalMs = !Number.isNaN(intervalSec) && intervalSec >= 2 ? intervalSec * 1000 : 8000;
  const arrowsEnabled = settings["hero_arrows_enabled"] !== "false";
  const arrowsStyle = (settings["hero_arrows_style"] as "glass" | "solid" | "outline") || "glass";
  const arrowsColor = settings["hero_arrows_color"] || "#ffffff";
  const arrowsColorHover = settings["hero_arrows_color_hover"] || "#ffffff";
  const arrowsBg = settings["hero_arrows_bg"] || "rgba(255,255,255,0.7)";
  const arrowsBgHover = settings["hero_arrows_bg_hover"] || "rgba(255,255,255,1)";
  const arrowsSize = (settings["hero_arrows_size"] as "sm" | "md" | "lg") || "md";

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["hero-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hero_banners")
        .select(
          "id,image_url,image_mobile_url,alt,kicker,title_top,title_bottom,cta_primary,to_primary,cta_secondary,to_secondary,link_url,link_target"
        )
        .eq("active", true)
        .order("sort_order");
      return (data ?? []) as HeroBanner[];
    },
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!api) return;
    const sync = () => {
      setActive(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api || paused || slides.length <= 1) return;
    const timer = window.setInterval(() => api.scrollNext(), intervalMs);
    return () => window.clearInterval(timer);
  }, [api, paused, slides.length, intervalMs]);

  if (isLoading || slides.length === 0) {
    return (
      <div className="aspect-[1536/1200] md:aspect-[1920/600] w-full">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    );
  }

  const firstSlide = slides[0];
  const preloadUrl = firstSlide.image_url || heroBannerFallback;

  return (
    <>
      {preloadUrl && (
        <Helmet>
          <link rel="preload" as="image" href={preloadUrl} />
        </Helmet>
      )}
    <section
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent className="-ml-0">
          {slides.map((s, idx) => {
            const isFirst = idx === 0;
            // Banners 0 e 1 disparam o popup "Presente exclusivo" ao chegar
            // em /personalize-seu-combo. Sinalizamos isso adicionando ?gift=1
            // no link (só para rotas internas — externas ficam intactas).
            // Considera "interno" mesmo quando o link_url vem absoluto
            // apontando para o próprio domínio (ex.: https://jotazo.com.br/...).
            const internalHosts = ["jotazo.com.br", "www.jotazo.com.br", "jotazo.lovable.app"];
            let normalizedHref = s.link_url || "";
            let isExternal = false;
            if (normalizedHref.startsWith("http")) {
              try {
                const u = new URL(normalizedHref);
                const sameHost =
                  (typeof window !== "undefined" && u.host === window.location.host) ||
                  internalHosts.includes(u.host);
                if (sameHost) {
                  normalizedHref = `${u.pathname}${u.search}${u.hash}`;
                } else {
                  isExternal = true;
                }
              } catch {
                isExternal = true;
              }
            }
            const openInNewTab = s.link_target === "_blank";
            const shouldFlagGift = (idx === 0 || idx === 1) && !!normalizedHref && !isExternal;
            const linkUrl = (() => {
              if (!normalizedHref) return normalizedHref;
              if (!shouldFlagGift) return normalizedHref;
              const [path, query = ""] = normalizedHref.split("?");
              const qp = new URLSearchParams(query);
              qp.set("gift", "1");
              return `${path}?${qp.toString()}`;
            })();
            const handleClick = () => {
              if (s.link_url) {
                trackBannerClick({ bannerType: "hero", bannerId: s.id, linkUrl: s.link_url });
              }
            };


            const desktopSrc = s.image_url || heroBannerFallback;
            const mobileSrc = s.image_mobile_url || "";

            const img = (
              <picture className="block h-full w-full">
                {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
                <img
                  src={desktopSrc}
                  alt={s.alt}
                  width={1920}
                  height={600}
                  className="block w-full h-full object-cover object-center"
                  loading={isFirst ? "eager" : "lazy"}
                  decoding="async"
                  {...(isFirst ? { fetchPriority: "high" as any } : {})}
                />
              </picture>
            );

            const wrapped = linkUrl ? (
              isExternal || openInNewTab ? (
                <a
                  href={linkUrl}
                  target={openInNewTab ? "_blank" : "_self"}
                  rel={openInNewTab ? "noopener noreferrer" : undefined}
                  className="block w-full"
                  aria-label={s.alt || "Banner"}
                  onClick={handleClick}
                >
                  {img}
                </a>
              ) : (
                <Link to={linkUrl} className="block w-full" aria-label={s.alt || "Banner"} onClick={handleClick}>
                  {img}
                </Link>
              )
            ) : img;


            return (
              <CarouselItem key={s.id} className="pl-0">
                <div className="aspect-[1536/1200] md:aspect-[1920/600] w-full">{wrapped}</div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div className="pointer-events-auto absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2">
          {Array.from({ length: snapCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o slide ${i + 1}`}
              aria-current={i === active}
              onClick={() => api?.scrollTo(i)}
              className={
                "h-2.5 rounded-full ring-1 ring-black/20 transition-all " +
                (i === active ? "w-6 bg-accent shadow-md" : "w-2.5 bg-white/90 hover:bg-white")
              }
            />
          ))}
        </div>
        {arrowsEnabled && (() => {
          const isOutline = arrowsStyle === "outline";
          const baseClass = isOutline ? "border-2 border-current shadow-none" : "border-0 shadow-md";
          const sizeClass =
            arrowsSize === "sm"
              ? "h-9 w-9 [&_svg]:h-3.5 [&_svg]:w-3.5"
              : arrowsSize === "lg"
                ? "h-14 w-14 [&_svg]:h-6 [&_svg]:w-6"
                : "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5";
          const baseStyle: React.CSSProperties = {
            color: arrowsColor,
            backgroundColor: isOutline ? "transparent" : arrowsBg,
            transition: "background-color 200ms, color 200ms, border-color 200ms",
          };
          const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isOutline) e.currentTarget.style.backgroundColor = arrowsBgHover;
            e.currentTarget.style.color = arrowsColorHover;
          };
          const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.backgroundColor = isOutline ? "transparent" : arrowsBg;
            e.currentTarget.style.color = arrowsColor;
          };
          return (
            <>
              <CarouselPrevious
                className={`hidden md:flex left-6 ${sizeClass} ${baseClass}`}
                style={baseStyle}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
              />
              <CarouselNext
                className={`hidden md:flex right-6 ${sizeClass} ${baseClass}`}
                style={baseStyle}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
              />
            </>
          );
        })()}
      </Carousel>
    </section>
    </>
  );
}

export default function HomePage() {
  // Warm React Query cache for all public home data on idle.
  usePrefetchHomeData();

  return (
    <div>
      <SEOHead
        title="Jotazo Telecom — Internet Fibra, 5G e TV"
        description="Planos de internet fibra óptica, móvel 5G e TV por assinatura no Vale do Ribeira. Sem fidelidade, suporte humanizado via WhatsApp e instalação ágil."
        path="/"
      />
      <BreadcrumbJsonLd items={[{ name: "Início", href: "/" }]} />
      <OrganizationJsonLd />
      <AnswerFirstParagraph>
        A Jotazo Telecom é um provedor regional de internet fibra óptica, internet móvel 5G, TV por assinatura e streaming. Atende residências e empresas em Apiaí/SP e toda a região do Vale do Ribeira, com planos sem fidelidade, instalação gratuita e suporte humano 24/7 via WhatsApp.
      </AnswerFirstParagraph>
      <WebSiteJsonLd />
      <h1 className="sr-only">Jotazo Telecom — Internet Fibra, 5G e TV no Vale do Ribeira</h1>
      <div
        className="relative left-1/2 -mt-10 w-screen -translate-x-1/2 overflow-hidden aspect-[1536/1200] md:aspect-[1920/600]"
      >
        <HeroCarousel />
      </div>

      <div className="mt-20 space-y-20 px-2 md:px-0">
      <PremiumPlansSection />
      <CoverageCheckSection />
      <SelfServiceSection />
      <Chip5GBrasilSection />

      {/* Lazy sections with idle prefetch */}
      <LazySection minHeight="280px" rootMargin="600px" prefetch={prefetchTestimonials}><TestimonialsSection /></LazySection>
      <LazySection minHeight="400px" rootMargin="600px" prefetch={prefetchMidBanners}><MidBannersSection /></LazySection>
      <div id="chip5gblack" className="scroll-mt-24 md:scroll-mt-28">
        <LazySection minHeight="600px" rootMargin="600px" prefetch={prefetchChip5G}><Chip5GLaunchSection onlyChip="5g" /></LazySection>
      </div>

      {/* Lazy chunks with idle prefetch */}
      <LazySection minHeight="400px" prefetch={prefetchCombo}><ComboOffersSection /></LazySection>
      <LazySection minHeight="400px" prefetch={prefetchServices}><ServicesOverviewSection /></LazySection>
      <LazySection minHeight="400px" prefetch={prefetchTv}>
        <div className="cv-auto"><TVStreamingSection /></div>
      </LazySection>
      <LazySection minHeight="500px" prefetch={prefetchNetflix}>
        <div className="cv-auto"><NetflixCatalogSection /></div>
      </LazySection>
      <LazySection minHeight="300px" prefetch={prefetchAppDownload}><AppDownloadSection /></LazySection>
      <LazySection minHeight="400px" prefetch={prefetchBlog}><BlogSection /></LazySection>
      <LazySection minHeight="300px" prefetch={prefetchHighlight}><HighlightCardsSection /></LazySection>
      
      {/* PromoBanners reserved (currently not in layout, but chunk warmed if added) */}
      {false && <LazySection prefetch={prefetchPromo}><PromoBannersSection /></LazySection>}

      {false && <ExitOfferPopup />}
      </div>
    </div>
  );
}

