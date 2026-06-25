ALTER TABLE public.eai_config DROP CONSTRAINT IF EXISTS eai_config_environment_check;
ALTER TABLE public.eai_config ADD CONSTRAINT eai_config_environment_check CHECK (environment IN ('sandbox','homologacao','producao','production'));
UPDATE public.eai_config SET
  base_url = 'https://hml-mvno.eai.net.br/api',
  oauth_url = 'https://api.eai.net.br/oauth2/token',
  client_id = '4efddb52-eef5-4f25-a1ca-706839f73d4d',
  client_secret = 'P7ii0U9sntQ8mJ9mcdhAJfsr0xhJjRqUDedLnqS5XRMuErxYUezEC89ALLkHUJsF',
  company_token = '08316162000145',
  company_token_header = 'CompanyToken',
  environment = 'homologacao',
  active = true,
  updated_at = now();
DELETE FROM public.eai_token_cache WHERE id = 1;