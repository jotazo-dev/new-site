
CREATE TABLE public.theme_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id TEXT NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.theme_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage theme_schedules"
ON public.theme_schedules
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read theme_schedules"
ON public.theme_schedules
FOR SELECT
TO public
USING (true);

CREATE TRIGGER update_theme_schedules_updated_at
BEFORE UPDATE ON public.theme_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
