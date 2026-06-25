DELETE FROM public.mvno_activations WHERE checkout_order_id='453db93c-9a68-47f9-8038-c33bc7811c17';
DELETE FROM public.provisioning_jobs WHERE order_id='453db93c-9a68-47f9-8038-c33bc7811c17';
DELETE FROM public.checkout_orders WHERE id='453db93c-9a68-47f9-8038-c33bc7811c17';
UPDATE public.integrations SET config = config || '{"environment":"production"}'::jsonb WHERE provider='algar';