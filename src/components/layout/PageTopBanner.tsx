import { useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseImageUrl } from "@/lib/imageOptim";

type Banner = {
  id: string;
  path: string;
  image_url: string;
  image_mobile_url: string;
  alt: string;
  link_url: string;
  active: boolean;
  sort_order: number;
  height_px: number;
  overlay_enabled: boolean;
  overlay_color: string;
  overlay_opacity: number;
  overlay_text: string;
  overlay_text_color: string;
  overlay_align_h: string;
  overlay_align_v: string;
  overlay_subtitle: string;
  overlay_cta_text: string;
  overlay_cta_url: string;
  overlay_cta_bg: string;
  overlay_cta_color: string;
  overlay_type: string;
  overlay_color2: string;
  overlay_gradient_dir: string;
  overlay_cta_variant: string;
  overlay_cta_size: string;
};

export function PageTopBanner() {
  const { pathname } = useLocation();

  const { data: banners } = useQuery({
    queryKey: ["page_top_banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_top_banners")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!banners || banners.length === 0) return null;

  const specific = banners.find((b) => b.path === pathname);
  const wildcard = pathname === "/" ? undefined : banners.find((b) => b.path === "*");
  const banner = specific ?? wildcard;

  if (!banner || !banner.image_url) return null;

  const height = banner.height_px || 300;

  const desktopAvif = supabaseImageUrl(banner.image_url, { format: "avif", width: 1920, quality: 70 });
  const desktopWebp = supabaseImageUrl(banner.image_url, { format: "webp", width: 1920, quality: 78 });
  const mobileAvif = supabaseImageUrl(banner.image_mobile_url, { format: "avif", width: 828, quality: 65 });
  const mobileWebp = supabaseImageUrl(banner.image_mobile_url, { format: "webp", width: 828, quality: 75 });

  const img = (
    <picture>
      {mobileAvif && <source media="(max-width: 768px)" type="image/avif" srcSet={mobileAvif} />}
      {mobileWebp && <source media="(max-width: 768px)" type="image/webp" srcSet={mobileWebp} />}
      {banner.image_mobile_url && (
        <source media="(max-width: 768px)" srcSet={banner.image_mobile_url} />
      )}
      {desktopAvif && <source type="image/avif" srcSet={desktopAvif} />}
      {desktopWebp && <source type="image/webp" srcSet={desktopWebp} />}
      <img
        src={banner.image_url}
        alt={banner.alt || "Banner promocional Jotazo Telecom"}
        loading="eager"
        decoding="async"
        style={{ height: `${height}px` }}
        className="w-full object-cover block"
      />
    </picture>
  );

  const alignH = banner.overlay_align_h || "center";
  const alignV = banner.overlay_align_v || "center";

  const justifyClass =
    alignV === "top" ? "justify-start pt-8 md:pt-12" : alignV === "bottom" ? "justify-end pb-8 md:pb-12" : "justify-center";
  const itemsClass =
    alignH === "left" ? "items-start text-left" : alignH === "right" ? "items-end text-right" : "items-center text-center";

  const hasContent = banner.overlay_text || banner.overlay_subtitle || banner.overlay_cta_text;

  // Overlay background style — solid color or gradient
  const overlayBg =
    (banner.overlay_type || "solid") === "gradient"
      ? `linear-gradient(${banner.overlay_gradient_dir || "to bottom"}, ${banner.overlay_color || "#000000"}, ${banner.overlay_color2 || "#000000"})`
      : undefined;

  // CTA variant styles
  const variant = banner.overlay_cta_variant || "solid";
  const size = banner.overlay_cta_size || "md";
  const ctaBg = banner.overlay_cta_bg || "#FFFFFF";
  const ctaFg = banner.overlay_cta_color || "#000000";

  const sizeClass =
    size === "sm" ? "px-4 py-2 text-xs md:text-sm" : size === "lg" ? "px-8 py-4 text-base md:text-lg" : "px-6 py-3 text-sm md:text-base";

  const ctaStyle: React.CSSProperties =
    variant === "outline"
      ? { backgroundColor: "transparent", color: ctaFg, border: `2px solid ${ctaFg}` }
      : variant === "ghost"
        ? { backgroundColor: "transparent", color: ctaFg }
        : { backgroundColor: ctaBg, color: ctaFg };

  const ctaClass = `pointer-events-auto inline-flex items-center justify-center rounded-full font-semibold shadow-lg hover:scale-105 transition-transform ${sizeClass}`;

  const cta = banner.overlay_cta_text ? (
    banner.overlay_cta_url?.startsWith("http") ? (
      <a href={banner.overlay_cta_url} target="_blank" rel="noopener noreferrer" className={ctaClass} style={ctaStyle}>
        {banner.overlay_cta_text}
      </a>
    ) : (
      <Link to={banner.overlay_cta_url || "#"} className={ctaClass} style={ctaStyle}>
        {banner.overlay_cta_text}
      </Link>
    )
  ) : null;

  const inner = (
    <div className="relative w-full">
      {img}
      {banner.overlay_enabled && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            ...(overlayBg ? { backgroundImage: overlayBg } : { backgroundColor: banner.overlay_color || "#000000" }),
            opacity: (banner.overlay_opacity ?? 40) / 100,
          }}
        />
      )}
      {hasContent && (
        <div className={`absolute inset-0 flex flex-col px-6 md:px-12 pointer-events-none ${justifyClass} ${itemsClass}`}>
          <div className={`flex flex-col gap-3 max-w-3xl ${itemsClass}`}>
            {banner.overlay_text && (
              <h2
                className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight"
                style={{ color: banner.overlay_text_color || "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
              >
                {banner.overlay_text}
              </h2>
            )}
            {banner.overlay_subtitle && (
              <p
                className="text-sm md:text-lg lg:text-xl"
                style={{ color: banner.overlay_text_color || "#FFFFFF", textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
              >
                {banner.overlay_subtitle}
              </p>
            )}
            {cta && <div className="mt-2">{cta}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const wrapWithLink = banner.link_url && !banner.overlay_cta_text;

  const content = wrapWithLink ? (
    banner.link_url.startsWith("http") ? (
      <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    ) : (
      <Link to={banner.link_url} className="block">
        {inner}
      </Link>
    )
  ) : (
    inner
  );

  return <div className="w-full bg-background">{content}</div>;
}
