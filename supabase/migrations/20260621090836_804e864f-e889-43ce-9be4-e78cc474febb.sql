UPDATE public.cielo_config
SET webhook_secret = encode(gen_random_bytes(24), 'hex')
WHERE webhook_secret IS NULL OR length(webhook_secret) = 0;