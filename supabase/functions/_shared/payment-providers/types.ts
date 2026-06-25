// deno-lint-ignore-file no-explicit-any
export type Method = "credit" | "debit" | "pix" | "boleto";
export type ProviderName = "cielo" | "mercadopago" | "asaas";
export type InternalStatus = "paid" | "authorized" | "pending" | "failed" | "canceled" | "refunded";

export interface ChargeInput {
  orderId: string;
  merchantOrderId: string;
  method: Method;
  amountCents: number;
  installments?: number;
  customer: {
    name: string;
    email: string;
    doc: string; // digits only
    identityType: "CPF" | "CNPJ";
    phone?: string;
    birthdate?: string | null;
    address?: {
      cep?: string; street?: string; number?: string; complement?: string;
      district?: string; city?: string; state?: string;
    };
  };
  card?: { number: string; holder: string; expiration: string; cvv: string; brand?: string };
  boletoDueDays?: number;
  pixExpirationSeconds?: number;
  returnUrl?: string;
  webhookBaseUrl: string;
}

export interface NormalizedPayment {
  provider: ProviderName;
  ok: boolean;
  internalStatus: InternalStatus;
  providerPaymentId?: string | null;
  /** Provider-native status code (Cielo number, MP string, Asaas string). */
  providerStatus?: string | number | null;
  httpStatus: number;
  pix?: { qrBase64?: string; qrString?: string; expiresAt?: string };
  boleto?: { url?: string; digitableLine?: string; barCode?: string; dueDate?: string };
  card?: { authorizationCode?: string; proofOfSale?: string; authenticationUrl?: string };
  /** Best-effort error string for fallback decisions. */
  error?: string;
  /** Full raw response for logging. */
  raw: any;
  /** Provider-specific extras to persist on the order (column → value). */
  extraOrderColumns?: Record<string, unknown>;
}

export interface NormalizedStatus {
  internalStatus: InternalStatus;
  providerStatus: string | number | null;
  raw: any;
}

export interface PaymentProvider {
  name: ProviderName;
  supports(method: Method): Promise<boolean> | boolean;
  charge(input: ChargeInput): Promise<NormalizedPayment>;
  fetchStatus(providerPaymentId: string, method: Method): Promise<NormalizedStatus>;
}

export interface ProviderContext {
  admin: any; // SupabaseClient
}

export type ProviderFactory = (ctx: ProviderContext) => Promise<PaymentProvider | null>;
