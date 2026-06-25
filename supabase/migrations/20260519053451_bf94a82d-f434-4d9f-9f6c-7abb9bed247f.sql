
-- Webmail contacts feature
CREATE TABLE public.webmail_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  favorite boolean NOT NULL DEFAULT false,
  last_interaction_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX webmail_contacts_account_idx ON public.webmail_contacts(account_id);
CREATE UNIQUE INDEX webmail_contacts_account_email_uidx
  ON public.webmail_contacts(account_id, lower(email))
  WHERE email <> '';

ALTER TABLE public.webmail_contacts ENABLE ROW LEVEL SECURITY;
-- Sem políticas: acesso somente via edge function (service role bypassa RLS).

CREATE TRIGGER webmail_contacts_set_updated_at
BEFORE UPDATE ON public.webmail_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webmail_contact_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX webmail_contact_labels_account_idx ON public.webmail_contact_labels(account_id);
CREATE UNIQUE INDEX webmail_contact_labels_account_name_uidx
  ON public.webmail_contact_labels(account_id, lower(name));

ALTER TABLE public.webmail_contact_labels ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER webmail_contact_labels_set_updated_at
BEFORE UPDATE ON public.webmail_contact_labels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webmail_contact_label_links (
  contact_id uuid NOT NULL REFERENCES public.webmail_contacts(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.webmail_contact_labels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, label_id)
);
CREATE INDEX webmail_contact_label_links_label_idx ON public.webmail_contact_label_links(label_id);

ALTER TABLE public.webmail_contact_label_links ENABLE ROW LEVEL SECURITY;
