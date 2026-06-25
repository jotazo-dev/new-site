ALTER TABLE public.cielo_config
ADD COLUMN IF NOT EXISTS provider_pix_sandbox text NOT NULL DEFAULT 'Cielo30',
ADD COLUMN IF NOT EXISTS provider_pix_production text NOT NULL DEFAULT 'Cielo2';

UPDATE public.cielo_config
SET provider_pix_sandbox = COALESCE(NULLIF(provider_pix_sandbox, ''), 'Cielo30'),
    provider_pix_production = COALESCE(NULLIF(provider_pix_production, ''), COALESCE(NULLIF(provider_pix, ''), 'Cielo2'));