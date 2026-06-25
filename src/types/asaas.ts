export type AsaasEnvironment = "sandbox" | "production";
export type AsaasBillingType = "BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED";

export interface AsaasConfig {
  id: string;
  environment: AsaasEnvironment;
  sandbox_api_key: string | null;
  production_api_key: string | null;
  sandbox_webhook_token: string | null;
  production_webhook_token: string | null;
  default_billing_type: AsaasBillingType;
  default_due_days: number;
  notification_disabled: boolean;
  auto_create_customer: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AsaasLog {
  id: string;
  environment: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  request_payload: any;
  response_payload: any;
  error_message: string | null;
  duration_ms: number | null;
  created_by: string | null;
  created_at: string;
}

export interface AsaasWebhookEvent {
  event_id: string;
  event_type: string;
  object_id: string | null;
  environment: string | null;
  payload: any;
  processed_at: string | null;
  received_at: string;
}
