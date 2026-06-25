DROP POLICY IF EXISTS "Anyone can update duration on fresh page views" ON public.page_views;

CREATE POLICY "Anyone can update duration on recent page views"
ON public.page_views
FOR UPDATE
TO public
USING (duration_ms = 0 AND created_at > (now() - interval '30 minutes'))
WITH CHECK (duration_ms >= 0 AND duration_ms <= 1800000);