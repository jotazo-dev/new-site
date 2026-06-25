
-- Create resumes table
CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  file_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert resumes" ON public.resumes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can read resumes" ON public.resumes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update resumes" ON public.resumes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete resumes" ON public.resumes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create private storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Storage policies
CREATE POLICY "Anyone can upload resumes" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'resumes');
CREATE POLICY "Admins can read resumes files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete resumes files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'));
