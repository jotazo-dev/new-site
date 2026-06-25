ALTER TABLE public.hero_banners
  ADD COLUMN IF NOT EXISTS link_target text NOT NULL DEFAULT '_self';

ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS link_target text NOT NULL DEFAULT '_self';

ALTER TABLE public.mid_banners
  ADD COLUMN IF NOT EXISTS link_target text NOT NULL DEFAULT '_self';

COMMENT ON COLUMN public.hero_banners.link_target IS 'Link target: _self (same tab) or _blank (new tab)';
COMMENT ON COLUMN public.promo_banners.link_target IS 'Link target: _self (same tab) or _blank (new tab)';
COMMENT ON COLUMN public.mid_banners.link_target IS 'Link target: _self (same tab) or _blank (new tab)';