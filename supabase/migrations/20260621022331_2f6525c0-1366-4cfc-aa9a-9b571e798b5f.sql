
-- 1) Remove function/tables duplicadas
DROP FUNCTION IF EXISTS public.reserve_iccid(uuid, iccid_kind);
DROP TABLE IF EXISTS public.iccid_inventory CASCADE;
DROP TABLE IF EXISTS public.activation_events CASCADE;
DROP TABLE IF EXISTS public.algar_token_cache CASCADE;
DROP TABLE IF EXISTS public.algar_plan_map CASCADE;
DROP TABLE IF EXISTS public.algar_config CASCADE;
DROP TYPE IF EXISTS iccid_status;
DROP TYPE IF EXISTS iccid_kind;

-- 2) Novo valor no enum provisioning_status
ALTER TYPE provisioning_status ADD VALUE IF NOT EXISTS 'awaiting_shipment';

-- 3) mvno_activations recebe vínculo com checkout
ALTER TABLE public.mvno_activations
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS checkout_order_id uuid REFERENCES public.checkout_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mvno_activations_checkout_order
  ON public.mvno_activations (checkout_order_id)
  WHERE checkout_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mvno_activations_one_per_checkout
  ON public.mvno_activations (checkout_order_id)
  WHERE source = 'checkout' AND checkout_order_id IS NOT NULL;
