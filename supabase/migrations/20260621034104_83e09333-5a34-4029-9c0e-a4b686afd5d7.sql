
UPDATE public.payment_routing SET primary_provider = 'mercadopago', fallback_order = ARRAY['cielo','asaas']::text[] WHERE method = 'credit';
UPDATE public.payment_routing SET primary_provider = 'mercadopago', fallback_order = ARRAY['cielo','asaas']::text[] WHERE method = 'pix';
UPDATE public.payment_routing SET primary_provider = 'mercadopago', fallback_order = ARRAY['cielo','asaas']::text[] WHERE method = 'boleto';
UPDATE public.payment_routing SET primary_provider = 'cielo', fallback_order = ARRAY[]::text[] WHERE method = 'debit';

ALTER TABLE public.payment_routing
  ALTER COLUMN primary_provider SET DEFAULT 'mercadopago';
