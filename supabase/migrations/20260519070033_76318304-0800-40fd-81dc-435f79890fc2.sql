CREATE TABLE public.webmail_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email text NOT NULL UNIQUE,
  html text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webmail_signatures ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_webmail_signatures_updated_at
BEFORE UPDATE ON public.webmail_signatures
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_webmail_signatures_account ON public.webmail_signatures(account_email);