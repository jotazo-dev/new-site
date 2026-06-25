import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import bannerChip5gFallback from "@/assets/jotazo-telecom-banner-chip5g.webp";
import { trackBannerClick } from "@/lib/bannerTracking";
import { supabaseImageUrl } from "@/lib/imageOptim";

type MidBanner = {
  id: string;
  image_url: string;
  image_mobile_url: string;
  alt: string;
  link_url: string;
  link_target: string;
};

export function MidBannersSection() {
  const { data: banners = [] } = useQuery({
    queryKey: ["mid-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mid_banners")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      return (data ?? []) as MidBanner[];
    },
  });

  const items = banners.length > 0
    ? banners
    : [{ 
        id: "fallback", 
        image_url: bannerChip5gFallback, 
        image_mobile_url: "", 
        alt: "Banner promocional Jotazo Telecom", 
        link_url: "",
        link_target: "_self"
      }];

  return (
    <div className="overflow-hidden rounded-[20px]">
      {items.map((b) => {
        const desktopSrc = b.image_url || bannerChip5gFallback;
        const mobileSrc = b.image_mobile_url || "";
        const img = (
          <picture key={b.id}>
            {mobileSrc && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
            <img
              src={desktopSrc}
              alt={b.alt || "Banner promocional Jotazo Telecom"}
              width={1920}
              height={400}
              className="h-auto w-full object-cover"
              loading="lazy"
              decoding="async"
              style={{ maxHeight: "400px" }}
            />
          </picture>
        );

        if (b.link_url) {
          const isExternal = b.link_url.startsWith("http");
          const openInNewTab = b.link_target === "_blank";
          const handleClick = () => trackBannerClick({ bannerType: "mid", bannerId: b.id, linkUrl: b.link_url });

          if (isExternal) {
            return (
              <a
                key={b.id}
                href={b.link_url}
                target={openInNewTab ? "_blank" : "_self"}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
                onClick={handleClick}
              >
                {img}
              </a>
            );
          }

          return openInNewTab ? (
            <a
              key={b.id}
              href={b.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
            >
              {img}
            </a>
          ) : (
            <Link key={b.id} to={b.link_url} onClick={handleClick}>{img}</Link>
          );
        }

        return img;
      })}
    </div>
  );
}
