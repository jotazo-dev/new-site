export type CieloEnvironment = "sandbox" | "production";

export type CieloProviderCredit =
  | "Cielo30"
  | "Cielo"
  | "Rede"
  | "Getnet"
  | "FirstData"
  | "SafraPay"
  | "Simulado";

export type CieloProviderDebit = "Cielo30" | "Cielo" | "Rede";

export type CieloProviderBoleto =
  | "Bradesco2"
  | "BancoDoBrasil3"
  | "Itau3"
  | "Santander2"
  | "Citibank2"
  | "Simulado";

export type CieloProviderPix = "Cielo2" | "Cielo30" | "BBPix" | "Bradesco";

export interface CieloConfig {
  id?: string;
  environment: CieloEnvironment;
  merchant_id_sandbox: string | null;
  merchant_key_sandbox: string | null;
  merchant_id_production: string | null;
  merchant_key_production: string | null;
  provider_credit: CieloProviderCredit;
  provider_debit: CieloProviderDebit;
  provider_boleto: CieloProviderBoleto;
  provider_pix: CieloProviderPix;
  provider_pix_sandbox?: CieloProviderPix;
  provider_pix_production?: CieloProviderPix;
  default_soft_descriptor: string | null;
  default_capture: boolean;
  antifraud_enabled: boolean;
  antifraud_provider: string | null;
  webhook_secret: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CieloLog {
  id: string;
  direction: "outbound" | "inbound" | "webhook";
  endpoint: string | null;
  method: string | null;
  request_id: string | null;
  merchant_order_id: string | null;
  payment_id: string | null;
  status_code: number | null;
  request_body: unknown;
  response_body: unknown;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface CieloTestResult {
  ok: boolean;
  message: string;
  details?: unknown;
}

export type CieloTestMethod = "credit" | "debit" | "boleto" | "pix";

export interface CieloTestPaymentInput {
  method: CieloTestMethod;
  amount: number; // centavos
  customer?: { name?: string; identity?: string; email?: string };
  card?: {
    number?: string;
    holder?: string;
    expiration?: string;
    cvv?: string;
    brand?: string;
    installments?: number;
  };
  capture?: boolean;
  boletoDueDays?: number;
  useSimulado?: boolean;
  provider?: string;
}

export interface CieloPaymentTestResult {
  ok: boolean;
  status?: number;
  paymentId?: string;
  authorizationCode?: string;
  proofOfSale?: string;
  returnMessage?: string;
  qrCodeBase64?: string;
  qrCodeString?: string;
  boletoUrl?: string;
  digitableLine?: string;
  barCodeNumber?: string;
  authenticationUrl?: string;
  httpStatus?: number;
  message?: string;
  diagnostic?: string;
  providerUsed?: string;
  errorCode?: number;
  environment?: "sandbox" | "production";
  paymentType?: string;
  raw?: unknown;
}
