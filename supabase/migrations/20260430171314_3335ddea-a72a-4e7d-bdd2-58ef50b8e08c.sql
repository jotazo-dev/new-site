
-- ============================================================
-- GRUPO 1: Substituir WITH CHECK (true) por validações mínimas
-- ============================================================

-- crm_leads
DROP POLICY IF EXISTS "Anyone can insert crm_leads" ON public.crm_leads;
CREATE POLICY "Anyone can insert crm_leads"
ON public.crm_leads
FOR INSERT
TO public
WITH CHECK (
  customer_name <> ''
  AND length(customer_name) <= 200
  AND (customer_email IS NULL OR length(customer_email) <= 255)
  AND (customer_phone IS NULL OR length(customer_phone) <= 30)
  AND length(coalesce(notes, '')) <= 5000
);

-- referrals
DROP POLICY IF EXISTS "Anyone can insert referrals" ON public.referrals;
CREATE POLICY "Anyone can insert referrals"
ON public.referrals
FOR INSERT
TO public
WITH CHECK (
  referrer_name <> ''
  AND referred_name <> ''
  AND length(referrer_name) <= 200
  AND length(referred_name) <= 200
  AND length(coalesce(referrer_phone, '')) <= 30
  AND length(coalesce(referred_phone, '')) <= 30
  AND length(coalesce(message, '')) <= 2000
);

-- resumes
DROP POLICY IF EXISTS "Anyone can insert resumes" ON public.resumes;
CREATE POLICY "Anyone can insert resumes"
ON public.resumes
FOR INSERT
TO public
WITH CHECK (
  name <> ''
  AND length(name) <= 200
  AND length(coalesce(email, '')) <= 255
  AND length(coalesce(phone, '')) <= 30
  AND length(coalesce(message, '')) <= 5000
  AND length(coalesce(city, '')) <= 120
);

-- page_views
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
TO public
WITH CHECK (
  length(page_path) <= 500
  AND length(coalesce(session_id, '')) <= 100
  AND length(coalesce(referrer, '')) <= 500
  AND length(coalesce(user_agent, '')) <= 500
  AND duration_ms >= 0
  AND duration_ms <= 1800000
);

-- popup_stats
DROP POLICY IF EXISTS "Anyone can insert popup stats" ON public.popup_stats;
CREATE POLICY "Anyone can insert popup stats"
ON public.popup_stats
FOR INSERT
TO public
WITH CHECK (
  event_type IN ('view', 'click', 'close', 'convert', 'dismiss', 'cta_click')
  AND length(page_path) <= 500
  AND length(coalesce(session_id, '')) <= 100
);

-- ============================================================
-- GRUPO 3: Revogar EXECUTE de PUBLIC/anon em funções internas
-- ============================================================

-- Funções administrativas: só authenticated pode chamar
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_user_role_slug(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.count_users_by_role_slug(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_section_permission(uuid, text) FROM PUBLIC, anon;

-- has_role: usada pelo frontend autenticado, revogar de anon mas manter authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Garantir grants para authenticated (painel admin)
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role_slug(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_users_by_role_slug(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_section_permission(uuid, text) TO authenticated;

-- log_crm_stage_change é trigger interno — bloquear de qualquer chamada direta
REVOKE EXECUTE ON FUNCTION public.log_crm_stage_change() FROM PUBLIC, anon, authenticated;
