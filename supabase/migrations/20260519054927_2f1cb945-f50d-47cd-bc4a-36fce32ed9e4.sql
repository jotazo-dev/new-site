CREATE TABLE public.webmail_contact_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wm_contact_categories_account ON public.webmail_contact_categories(account_id);
CREATE UNIQUE INDEX uq_wm_contact_categories_account_lname ON public.webmail_contact_categories(account_id, lower(name));

ALTER TABLE public.webmail_contact_categories ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_wm_contact_categories_updated_at
BEFORE UPDATE ON public.webmail_contact_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();