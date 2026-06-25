
-- ========================================================================
-- CHECKOUT V2 — Provisioning structure
-- ========================================================================

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE public.sim_kind AS ENUM ('esim', 'physical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.provisioning_status AS ENUM (
    'not_started', 'queued', 'running', 'provisioned', 'failed', 'manual_review'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.provisioning_job_status AS ENUM (
    'pending', 'running', 'done', 'failed', 'dead_letter'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.iccid_status AS ENUM (
    'available', 'reserved', 'assigned', 'burned'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.iccid_kind AS ENUM ('physical', 'esim_profile');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. ALTER checkout_orders
ALTER TABLE public.checkout_orders
  ADD COLUMN IF NOT EXISTS sim_kind public.sim_kind,
  ADD COLUMN IF NOT EXISTS customer_doc text,
  ADD COLUMN IF NOT EXISTS customer_birthdate date,
  ADD COLUMN IF NOT EXISTS desired_msisdn_prefix text,
  ADD COLUMN IF NOT EXISTS portability jsonb,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS provisioning_status public.provisioning_status NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS provisioning_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provisioning_last_error text,
  ADD COLUMN IF NOT EXISTS provisioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS algar_subscriber_id text,
  ADD COLUMN IF NOT EXISTS algar_service_id text,
  ADD COLUMN IF NOT EXISTS algar_mobileline_id text,
  ADD COLUMN IF NOT EXISTS msisdn text,
  ADD COLUMN IF NOT EXISTS iccid text,
  ADD COLUMN IF NOT EXISTS esim_qr_url text,
  ADD COLUMN IF NOT EXISTS esim_activation_code text,
  ADD COLUMN IF NOT EXISTS tracking_code text;

-- 3. provisioning_jobs
CREATE TABLE IF NOT EXISTS public.provisioning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.checkout_orders(id) ON DELETE CASCADE,
  status public.provisioning_job_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.provisioning_jobs TO service_role;
ALTER TABLE public.provisioning_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage provisioning jobs"
  ON public.provisioning_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_next_run
  ON public.provisioning_jobs(status, next_run_at)
  WHERE status IN ('pending', 'failed');

CREATE TRIGGER trg_provisioning_jobs_updated_at
  BEFORE UPDATE ON public.provisioning_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. iccid_inventory
CREATE TABLE IF NOT EXISTS public.iccid_inventory (
  iccid text PRIMARY KEY,
  kind public.iccid_kind NOT NULL,
  status public.iccid_status NOT NULL DEFAULT 'available',
  reserved_order_id uuid REFERENCES public.checkout_orders(id) ON DELETE SET NULL,
  reserved_until timestamptz,
  assigned_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.iccid_inventory TO authenticated;
GRANT ALL ON public.iccid_inventory TO service_role;
ALTER TABLE public.iccid_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage iccid inventory"
  ON public.iccid_inventory FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_iccid_inventory_status_kind
  ON public.iccid_inventory(status, kind);

CREATE TRIGGER trg_iccid_inventory_updated_at
  BEFORE UPDATE ON public.iccid_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. activation_events
CREATE TABLE IF NOT EXISTS public.activation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.checkout_orders(id) ON DELETE CASCADE,
  step text NOT NULL,
  level text NOT NULL DEFAULT 'info',
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activation_events TO authenticated;
GRANT ALL ON public.activation_events TO service_role;
ALTER TABLE public.activation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view activation events"
  ON public.activation_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_activation_events_order
  ON public.activation_events(order_id, created_at DESC);

-- 6. RPC: enqueue_provisioning
CREATE OR REPLACE FUNCTION public.enqueue_provisioning(_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_id uuid;
BEGIN
  INSERT INTO public.provisioning_jobs (order_id, status, next_run_at)
  VALUES (_order_id, 'pending', now())
  ON CONFLICT (order_id) DO UPDATE
    SET status = CASE
      WHEN public.provisioning_jobs.status IN ('done') THEN public.provisioning_jobs.status
      ELSE 'pending'
    END,
    next_run_at = LEAST(public.provisioning_jobs.next_run_at, now())
  RETURNING id INTO job_id;

  UPDATE public.checkout_orders
  SET provisioning_status = 'queued'
  WHERE id = _order_id AND provisioning_status IN ('not_started', 'failed');

  RETURN job_id;
END;
$$;

-- 7. RPC: mark_order_paid (idempotent)
CREATE OR REPLACE FUNCTION public.mark_order_paid(
  _order_id uuid,
  _cielo_status integer DEFAULT NULL,
  _payload jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status text;
  transitioned boolean := false;
BEGIN
  SELECT status::text INTO current_status
  FROM public.checkout_orders WHERE id = _order_id FOR UPDATE;

  IF current_status IS NULL THEN
    RETURN false;
  END IF;

  IF current_status IN ('pending', 'authorized') THEN
    UPDATE public.checkout_orders
    SET status = 'paid', paid_at = now()
    WHERE id = _order_id;
    transitioned := true;

    INSERT INTO public.checkout_events (order_id, source, cielo_status, payload)
    VALUES (_order_id, 'mark_order_paid', _cielo_status, _payload);

    PERFORM public.enqueue_provisioning(_order_id);
  END IF;

  RETURN transitioned;
END;
$$;

-- 8. RPC: reserve_iccid (safe concurrent reservation)
CREATE OR REPLACE FUNCTION public.reserve_iccid(_order_id uuid, _kind public.iccid_kind)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  picked text;
BEGIN
  -- Already reserved for this order? return it.
  SELECT iccid INTO picked
  FROM public.iccid_inventory
  WHERE reserved_order_id = _order_id AND status IN ('reserved', 'assigned')
  LIMIT 1;

  IF picked IS NOT NULL THEN
    RETURN picked;
  END IF;

  -- Pick an available ICCID with FOR UPDATE SKIP LOCKED.
  WITH cte AS (
    SELECT iccid FROM public.iccid_inventory
    WHERE status = 'available' AND kind = _kind
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.iccid_inventory inv
  SET status = 'reserved',
      reserved_order_id = _order_id,
      reserved_until = now() + interval '1 hour'
  FROM cte
  WHERE inv.iccid = cte.iccid
  RETURNING inv.iccid INTO picked;

  RETURN picked;
END;
$$;
