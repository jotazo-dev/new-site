
ALTER TABLE public.blog_posts
ADD COLUMN content text NOT NULL DEFAULT '',
ADD COLUMN slug text NOT NULL DEFAULT '';

-- Backfill existing rows with a slug derived from id
UPDATE public.blog_posts SET slug = id::text WHERE slug = '';

-- Add unique constraint
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);
