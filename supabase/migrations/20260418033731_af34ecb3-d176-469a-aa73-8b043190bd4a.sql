ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS link_url text NOT NULL DEFAULT '';