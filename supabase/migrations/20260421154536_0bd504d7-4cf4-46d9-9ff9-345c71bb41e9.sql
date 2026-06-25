
-- Add notes column for internal observations
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

-- Enable realtime for resumes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.resumes;
