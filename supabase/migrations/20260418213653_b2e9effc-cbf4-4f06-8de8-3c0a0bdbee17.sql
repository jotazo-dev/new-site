INSERT INTO public.sitemap_pages (path, priority, changefreq, active, sort_order)
VALUES ('/transparencia-rede', '0.4', 'monthly', true, 95)
ON CONFLICT DO NOTHING;