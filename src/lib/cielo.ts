import { supabase } from "@/integrations/supabase/client";
import type {
  CieloTestResult,
  CieloTestPaymentInput,
  CieloPaymentTestResult,
} from "@/types/cielo";

export function getCieloWebhookUrl(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/cielo-webhook`;
}

export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function testCieloConnection(): Promise<CieloTestResult> {
  const { data, error } = await supabase.functions.invoke("cielo-test-connection", { body: {} });
  if (error) return { ok: false, message: error.message };
  return data as CieloTestResult;
}

export async function callCieloProxy(args: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  useQueryHost?: boolean;
}) {
  const { data, error } = await supabase.functions.invoke("cielo-proxy", { body: args });
  if (error) throw error;
  return data;
}

export async function testCieloPayment(input: CieloTestPaymentInput): Promise<CieloPaymentTestResult> {
  const { data, error } = await supabase.functions.invoke("cielo-test-payment", { body: input });
  if (error) return { ok: false, message: error.message };
  return data as CieloPaymentTestResult;
}

export async function captureCieloPayment(paymentId: string, amount?: number) {
  const qs = amount ? `?amount=${amount}` : "";
  return callCieloProxy({ method: "PUT", path: `/v2/sales/${paymentId}/capture${qs}` });
}

export async function voidCieloPayment(paymentId: string, amount?: number) {
  const qs = amount ? `?amount=${amount}` : "";
  return callCieloProxy({ method: "PUT", path: `/v2/sales/${paymentId}/void${qs}` });
}

export async function queryCieloPayment(paymentId: string) {
  return callCieloProxy({
    method: "GET",
    path: `/v2/sales/${paymentId}`,
    useQueryHost: true,
  });
}

export function maskKey(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 4) return "•".repeat(value.length);
  return "•".repeat(value.length - 4) + value.slice(-4);
}

export function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 12) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
