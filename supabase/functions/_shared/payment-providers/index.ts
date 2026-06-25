// deno-lint-ignore-file no-explicit-any
import type { Method, PaymentProvider, ProviderContext, ProviderName } from "./types.ts";
import { makeCielo } from "./cielo.ts";
import { makeMercadoPago } from "./mercadopago.ts";
import { makeAsaas } from "./asaas.ts";

const FACTORIES: Record<ProviderName, (ctx: ProviderContext) => Promise<PaymentProvider | null>> = {
  cielo: makeCielo,
  mercadopago: makeMercadoPago,
  asaas: makeAsaas,
};

/** Returns the ordered list of providers to attempt for the given method. */
export async function resolveRoute(ctx: ProviderContext, method: Method, requested?: ProviderName): Promise<PaymentProvider[]> {
  // 1) Load routing rule
  const { data: rule } = await ctx.admin
    .from("payment_routing")
    .select("*")
    .eq("method", method)
    .maybeSingle();

  let order: ProviderName[];
  if (requested) {
    order = [requested];
  } else if (rule && rule.enabled !== false) {
    order = [rule.primary_provider, ...(rule.fallback_order || [])] as ProviderName[];
  } else {
    order = ["cielo"];
  }
  // Dedup, preserve order
  order = [...new Set(order)].filter(Boolean) as ProviderName[];

  // 2) Instantiate providers that support the method AND have credentials available
  const out: PaymentProvider[] = [];
  for (const name of order) {
    const factory = FACTORIES[name];
    if (!factory) continue;
    const p = await factory(ctx);
    if (!p) continue;
    if (!(await p.supports(method))) continue;
    out.push(p);
  }
  return out;
}

/** Loads a provider by name (used by poll-status / webhooks). */
export async function getProvider(ctx: ProviderContext, name: ProviderName): Promise<PaymentProvider | null> {
  const factory = FACTORIES[name];
  if (!factory) return null;
  return await factory(ctx);
}
