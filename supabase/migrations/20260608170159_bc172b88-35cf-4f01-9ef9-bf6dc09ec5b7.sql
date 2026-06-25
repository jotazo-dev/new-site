
-- Defense-in-depth: explicit admin-only SELECT policies on webmail_* tables.
-- All read/write traffic should continue to flow through edge functions using
-- the service role (which bypasses RLS). These policies make the intent
-- auditable and block any future client-side access.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'webmail_accounts',
    'webmail_sessions',
    'webmail_contacts',
    'webmail_contact_labels',
    'webmail_contact_label_links',
    'webmail_contact_categories',
    'webmail_signatures',
    'webmail_drafts',
    'webmail_message_cache'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins can read %I" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "Admins can read %I" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))',
      t, t
    );
  END LOOP;
END $$;

-- eai_token_cache: explicit deny for non-service-role writes (no policy = deny by default,
-- but be explicit for auditability). Service role bypasses RLS so edge function still works.
DROP POLICY IF EXISTS "eai_token_cache admin write" ON public.eai_token_cache;
CREATE POLICY "eai_token_cache admin write"
  ON public.eai_token_cache
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
