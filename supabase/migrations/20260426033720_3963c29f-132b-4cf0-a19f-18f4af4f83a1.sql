-- Create public bucket for testimonial photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public read testimonials photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonials');

-- Allow anyone to upload (admin area is access-controlled at app level)
CREATE POLICY "Anyone can upload testimonials photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "Anyone can update testimonials photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'testimonials');

CREATE POLICY "Anyone can delete testimonials photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'testimonials');