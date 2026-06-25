
-- Add starts_at to announcements
ALTER TABLE public.announcements
ADD COLUMN starts_at timestamp with time zone DEFAULT NULL;

-- Create popup_stats table
CREATE TABLE public.popup_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  popup_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'view',
  page_path text NOT NULL DEFAULT '/',
  session_id text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast aggregation
CREATE INDEX idx_popup_stats_popup_id ON public.popup_stats(popup_id);
CREATE INDEX idx_popup_stats_event_type ON public.popup_stats(event_type);

-- Enable RLS
ALTER TABLE public.popup_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can insert stats (tracking)
CREATE POLICY "Anyone can insert popup stats"
ON public.popup_stats
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can read stats
CREATE POLICY "Admins can read popup stats"
ON public.popup_stats
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete stats
CREATE POLICY "Admins can delete popup stats"
ON public.popup_stats
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
