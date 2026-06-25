CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_name text NOT NULL,
  referrer_phone text NOT NULL,
  referrer_email text NOT NULL DEFAULT '',
  referrer_city text NOT NULL DEFAULT '',
  referred_name text NOT NULL,
  referred_phone text NOT NULL,
  referred_city text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'novo',
  reward_status text NOT NULL DEFAULT 'pendente',
  reward_value_cents integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert referrals"
  ON public.referrals FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Admins can read referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update referrals"
  ON public.referrals FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete referrals"
  ON public.referrals FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_referrals_created_at ON public.referrals (created_at DESC);
CREATE INDEX idx_referrals_status ON public.referrals (status);