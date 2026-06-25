-- Fase 2: triggers para vincular pedidos a contas de cliente
-- 1) BEFORE INSERT em checkout_orders: tenta preencher user_id por CPF/email
DROP TRIGGER IF EXISTS trg_auto_link_new_order ON public.checkout_orders;
CREATE TRIGGER trg_auto_link_new_order
BEFORE INSERT ON public.checkout_orders
FOR EACH ROW EXECUTE FUNCTION public.auto_link_new_order();

-- 2) AFTER INSERT/UPDATE em customer_profiles: reclama pedidos antigos por CPF/email
DROP TRIGGER IF EXISTS trg_auto_claim_orders_on_profile ON public.customer_profiles;
CREATE TRIGGER trg_auto_claim_orders_on_profile
AFTER INSERT OR UPDATE OF cpf_cnpj ON public.customer_profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_claim_orders_on_profile();

-- 3) Índice auxiliar para consultas de pedidos por usuário
CREATE INDEX IF NOT EXISTS idx_checkout_orders_user_id_created
  ON public.checkout_orders(user_id, created_at DESC);