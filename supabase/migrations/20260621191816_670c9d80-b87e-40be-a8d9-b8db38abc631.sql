
-- ============================================================
-- WEBHOOKS DE SAÍDA (sistema de automação)
-- ============================================================

-- 1. Tabela de endpoints
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  events text[] NOT NULL DEFAULT '{}',
  headers jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_retries int NOT NULL DEFAULT 5,
  timeout_ms int NOT NULL DEFAULT 10000,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_endpoints_url_https CHECK (url ~* '^https?://'),
  CONSTRAINT webhook_endpoints_retries_range CHECK (max_retries BETWEEN 0 AND 10),
  CONSTRAINT webhook_endpoints_timeout_range CHECK (timeout_ms BETWEEN 1000 AND 30000)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_endpoints TO authenticated;
GRANT ALL ON public.webhook_endpoints TO service_role;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage webhook endpoints"
ON public.webhook_endpoints FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_webhook_endpoints_updated
BEFORE UPDATE ON public.webhook_endpoints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabela de entregas (logs + fila)
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending|in_progress|success|failed|dead
  attempts int NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_status_code int,
  last_response text,
  last_error text,
  duration_ms int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.webhook_deliveries TO service_role;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read webhook deliveries"
ON public.webhook_deliveries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_webhook_deliveries_queue ON public.webhook_deliveries (status, next_attempt_at)
WHERE status IN ('pending','failed');
CREATE INDEX idx_webhook_deliveries_endpoint ON public.webhook_deliveries (endpoint_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_event ON public.webhook_deliveries (event, created_at DESC);

CREATE TRIGGER trg_webhook_deliveries_updated
BEFORE UPDATE ON public.webhook_deliveries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Função central de emissão
CREATE OR REPLACE FUNCTION public.emit_webhook_event(_event text, _data jsonb)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ep record;
  envelope jsonb;
  inserted_count int := 0;
BEGIN
  envelope := jsonb_build_object(
    'id', 'evt_' || replace(gen_random_uuid()::text, '-', ''),
    'event', _event,
    'created_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'api_version', '2026-06-21',
    'data', COALESCE(_data, '{}'::jsonb)
  );

  FOR ep IN
    SELECT id FROM public.webhook_endpoints
    WHERE active = true
      AND (_event = ANY(events) OR '*' = ANY(events))
  LOOP
    INSERT INTO public.webhook_deliveries (endpoint_id, event, payload, status, next_attempt_at)
    VALUES (ep.id, _event, envelope, 'pending', now());
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.emit_webhook_event(text, jsonb) TO authenticated, service_role;

-- 4. Atualizar mark_order_paid para emitir evento
CREATE OR REPLACE FUNCTION public.mark_order_paid(_order_id uuid, _cielo_status integer DEFAULT NULL, _payload jsonb DEFAULT '{}'::jsonb)
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

  IF current_status IS NULL THEN RETURN false; END IF;

  IF current_status IN ('pending', 'authorized') THEN
    UPDATE public.checkout_orders SET status = 'paid', paid_at = now() WHERE id = _order_id;
    transitioned := true;

    INSERT INTO public.checkout_events (order_id, source, cielo_status, payload)
    VALUES (_order_id, 'mark_order_paid', _cielo_status, _payload);

    PERFORM public.enqueue_provisioning(_order_id);

    -- emit webhook
    PERFORM public.emit_webhook_event(
      'order.payment.paid',
      jsonb_build_object('order_id', _order_id, 'cielo_status', _cielo_status)
    );
  END IF;

  RETURN transitioned;
END;
$$;

-- 5. Atualizar enqueue_provisioning para emitir evento
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

  PERFORM public.emit_webhook_event(
    'order.provisioning.queued',
    jsonb_build_object('order_id', _order_id)
  );

  RETURN job_id;
END;
$$;

-- 6. Atualizar trigger de mudança de estágio do CRM para emitir
CREATE OR REPLACE FUNCTION public.log_crm_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.crm_activities (lead_id, type, payload, actor_id)
    VALUES (NEW.id, 'stage_change',
      jsonb_build_object('from', OLD.stage, 'to', NEW.stage), auth.uid());

    PERFORM public.emit_webhook_event(
      'lead.stage_changed',
      jsonb_build_object(
        'lead', to_jsonb(NEW),
        'from_stage', OLD.stage,
        'to_stage', NEW.stage
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Trigger AFTER INSERT em crm_leads
CREATE OR REPLACE FUNCTION public.emit_lead_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.emit_webhook_event(
    'lead.created',
    jsonb_build_object('lead', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_lead_created ON public.crm_leads;
CREATE TRIGGER trg_emit_lead_created
AFTER INSERT ON public.crm_leads
FOR EACH ROW EXECUTE FUNCTION public.emit_lead_created();

-- 8. Trigger em checkout_orders para eventos derivados de status
CREATE OR REPLACE FUNCTION public.emit_checkout_order_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  evt text;
BEGIN
  -- status changes (paid já é emitido por mark_order_paid)
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    evt := CASE NEW.status::text
      WHEN 'authorized' THEN 'order.payment.authorized'
      WHEN 'failed' THEN 'order.payment.failed'
      WHEN 'canceled' THEN 'order.payment.canceled'
      WHEN 'refunded' THEN 'order.payment.refunded'
      WHEN 'expired' THEN 'order.payment.expired'
      ELSE NULL
    END;
    IF evt IS NOT NULL THEN
      PERFORM public.emit_webhook_event(evt, jsonb_build_object('order_id', NEW.id, 'order', to_jsonb(NEW)));
    END IF;
  END IF;

  -- provisioning status
  IF TG_OP = 'UPDATE' AND NEW.provisioning_status IS DISTINCT FROM OLD.provisioning_status THEN
    evt := CASE NEW.provisioning_status::text
      WHEN 'in_progress' THEN 'order.provisioning.started'
      WHEN 'done' THEN 'order.provisioning.succeeded'
      WHEN 'failed' THEN 'order.provisioning.failed'
      ELSE NULL
    END;
    IF evt IS NOT NULL THEN
      PERFORM public.emit_webhook_event(evt, jsonb_build_object('order_id', NEW.id, 'order', to_jsonb(NEW)));
    END IF;
  END IF;

  -- created
  IF TG_OP = 'INSERT' THEN
    PERFORM public.emit_webhook_event('order.created', jsonb_build_object('order_id', NEW.id, 'order', to_jsonb(NEW)));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_checkout_order_events ON public.checkout_orders;
CREATE TRIGGER trg_emit_checkout_order_events
AFTER INSERT OR UPDATE ON public.checkout_orders
FOR EACH ROW EXECUTE FUNCTION public.emit_checkout_order_events();

-- 9. Trigger em mvno_activations
CREATE OR REPLACE FUNCTION public.emit_mvno_activation_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE evt text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.emit_webhook_event('activation.created', jsonb_build_object('activation', to_jsonb(NEW)));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    evt := CASE lower(NEW.status::text)
      WHEN 'success' THEN 'activation.succeeded'
      WHEN 'succeeded' THEN 'activation.succeeded'
      WHEN 'completed' THEN 'activation.succeeded'
      WHEN 'failed' THEN 'activation.failed'
      WHEN 'error' THEN 'activation.failed'
      ELSE NULL
    END;
    IF evt IS NOT NULL THEN
      PERFORM public.emit_webhook_event(evt, jsonb_build_object('activation', to_jsonb(NEW)));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_mvno_activation_events ON public.mvno_activations;
CREATE TRIGGER trg_emit_mvno_activation_events
AFTER INSERT OR UPDATE ON public.mvno_activations
FOR EACH ROW EXECUTE FUNCTION public.emit_mvno_activation_events();
