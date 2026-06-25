ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS duration_ms integer NOT NULL DEFAULT 0;

-- Allow public to update their own page view rows (for sending duration on unload)
-- Since we don't have user_id, allow updates only on rows where duration_ms = 0 (initial state)
-- to prevent tampering with already-set durations.
CREATE POLICY "Anyone can update duration on fresh page views"
ON public.page_views
FOR UPDATE
TO public
USING (duration_ms = 0)
WITH CHECK (duration_ms >= 0);