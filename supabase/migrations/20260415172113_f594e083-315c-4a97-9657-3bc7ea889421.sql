
CREATE TABLE public.custom_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT 'head',
  content TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage custom_scripts"
ON public.custom_scripts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read custom_scripts"
ON public.custom_scripts FOR SELECT
TO public
USING (true);

CREATE TRIGGER update_custom_scripts_updated_at
BEFORE UPDATE ON public.custom_scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
