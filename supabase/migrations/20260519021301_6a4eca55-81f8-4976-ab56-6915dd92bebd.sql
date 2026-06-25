-- Webmail accounts (IMAP/SMTP credentials, encrypted)
CREATE TABLE public.webmail_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_secure BOOLEAN NOT NULL DEFAULT true,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 465,
  smtp_secure BOOLEAN NOT NULL DEFAULT true,
  encrypted_password TEXT NOT NULL,
  signature_html TEXT NOT NULL DEFAULT '',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webmail_accounts ENABLE ROW LEVEL SECURITY;
-- No policies = denied to anon/authenticated. Only service_role (edge functions) can access.

CREATE TRIGGER trg_webmail_accounts_updated_at
  BEFORE UPDATE ON public.webmail_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sessions
CREATE TABLE public.webmail_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.webmail_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webmail_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_webmail_sessions_token ON public.webmail_sessions(token_hash);
CREATE INDEX idx_webmail_sessions_expires ON public.webmail_sessions(expires_at);

-- Message cache (headers only)
CREATE TABLE public.webmail_message_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.webmail_accounts(id) ON DELETE CASCADE,
  folder TEXT NOT NULL,
  uid BIGINT NOT NULL,
  message_id TEXT NOT NULL DEFAULT '',
  thread_id TEXT NOT NULL DEFAULT '',
  in_reply_to TEXT NOT NULL DEFAULT '',
  "from" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "to" JSONB NOT NULL DEFAULT '[]'::jsonb,
  cc JSONB NOT NULL DEFAULT '[]'::jsonb,
  subject TEXT NOT NULL DEFAULT '',
  snippet TEXT NOT NULL DEFAULT '',
  date TIMESTAMPTZ,
  flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, folder, uid)
);

ALTER TABLE public.webmail_message_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_webmail_cache_folder ON public.webmail_message_cache(account_id, folder, date DESC);
CREATE INDEX idx_webmail_cache_thread ON public.webmail_message_cache(account_id, thread_id);

-- Drafts
CREATE TABLE public.webmail_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.webmail_accounts(id) ON DELETE CASCADE,
  "to" JSONB NOT NULL DEFAULT '[]'::jsonb,
  cc JSONB NOT NULL DEFAULT '[]'::jsonb,
  bcc JSONB NOT NULL DEFAULT '[]'::jsonb,
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  in_reply_to TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webmail_drafts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_webmail_drafts_updated_at
  BEFORE UPDATE ON public.webmail_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('webmail-attachments', 'webmail-attachments', false)
ON CONFLICT (id) DO NOTHING;