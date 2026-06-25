CREATE TABLE public.custom_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read custom_themes"
ON public.custom_themes FOR SELECT
USING (true);

CREATE POLICY "Admins can manage custom_themes"
ON public.custom_themes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_custom_themes_updated_at
BEFORE UPDATE ON public.custom_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();