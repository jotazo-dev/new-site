
CREATE TABLE public.mvno_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('algar','eai')),
  tn text,
  iccid text,
  sim_type text CHECK (sim_type IN ('sim','esim')),
  product_sku text,
  product_name text,
  cycle integer,
  locale text,
  subscriber_doc text,
  subscriber_name text,
  subscriber_email text,
  subscriber_phone text,
  notes text,
  raw_response jsonb,
  activation_code text,
  qr_payload text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed')),
  email_status text NOT NULL DEFAULT 'not_sent' CHECK (email_status IN ('not_sent','sent','failed','skipped')),
  email_error text,
  email_sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.mvno_activations TO authenticated;
GRANT ALL ON public.mvno_activations TO service_role;

ALTER TABLE public.mvno_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MVNO section can read activations"
  ON public.mvno_activations FOR SELECT
  TO authenticated
  USING (public.has_section_permission(auth.uid(), 'mvno'));

CREATE POLICY "MVNO section can insert activations"
  ON public.mvno_activations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_section_permission(auth.uid(), 'mvno'));

CREATE POLICY "MVNO section can update activations"
  ON public.mvno_activations FOR UPDATE
  TO authenticated
  USING (public.has_section_permission(auth.uid(), 'mvno'))
  WITH CHECK (public.has_section_permission(auth.uid(), 'mvno'));

CREATE TRIGGER trg_mvno_activations_updated_at
  BEFORE UPDATE ON public.mvno_activations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mvno_activations_created_at ON public.mvno_activations (created_at DESC);
CREATE INDEX idx_mvno_activations_tn ON public.mvno_activations (tn);
CREATE INDEX idx_mvno_activations_doc ON public.mvno_activations (subscriber_doc);
