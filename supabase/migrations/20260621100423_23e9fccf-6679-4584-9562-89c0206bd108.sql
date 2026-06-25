DELETE FROM public.mvno_activations WHERE checkout_order_id IN (SELECT id FROM public.checkout_orders WHERE merchant_order_id LIKE 'TEST-EAI-%');
DELETE FROM public.provisioning_jobs WHERE order_id IN (SELECT id FROM public.checkout_orders WHERE merchant_order_id LIKE 'TEST-EAI-%');
DELETE FROM public.checkout_events WHERE order_id IN (SELECT id FROM public.checkout_orders WHERE merchant_order_id LIKE 'TEST-EAI-%');
DELETE FROM public.checkout_orders WHERE merchant_order_id LIKE 'TEST-EAI-%';