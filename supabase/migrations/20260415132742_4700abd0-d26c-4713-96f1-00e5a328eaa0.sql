ALTER TABLE public.blog_posts
  ADD COLUMN author_first_name text NOT NULL DEFAULT '',
  ADD COLUMN author_last_name text NOT NULL DEFAULT '',
  ADD COLUMN author_instagram text NOT NULL DEFAULT '',
  ADD COLUMN author_avatar_url text NOT NULL DEFAULT '';