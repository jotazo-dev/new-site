-- CRM leads table
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,

  cep TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  number TEXT NOT NULL DEFAULT '',
  complement TEXT NOT NULL DEFAULT '',
  neighborhood TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  uf TEXT NOT NULL DEFAULT '',
  best_time TEXT NOT NULL DEFAULT '',

  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  combo_discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  coupon_code TEXT,

  source TEXT NOT NULL DEFAULT 'website',
  stage TEXT NOT NULL DEFAULT 'novo',
  stage_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  assigned_to UUID
);

CREATE INDEX idx_crm_leads_stage ON public.crm_leads(stage, stage_order);
CREATE INDEX idx_crm_leads_created_at ON public.crm_leads(created_at DESC);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a lead (public order form)
CREATE POLICY "Anyone can insert crm_leads"
ON public.crm_leads
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read crm_leads"
ON public.crm_leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update crm_leads"
ON public.crm_leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete crm_leads"
ON public.crm_leads
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_crm_leads_updated_at
BEFORE UPDATE ON public.crm_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.crm_leads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;