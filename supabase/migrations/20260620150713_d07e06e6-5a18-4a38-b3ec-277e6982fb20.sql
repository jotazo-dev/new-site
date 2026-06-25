
REVOKE EXECUTE ON FUNCTION public.mark_order_paid(uuid, integer, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_provisioning(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_iccid(uuid, public.iccid_kind) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.mark_order_paid(uuid, integer, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_provisioning(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_iccid(uuid, public.iccid_kind) TO service_role;
