import { z } from "zod";
import { isValidCpfOrCnpj, onlyDigits } from "./brMasks";

export const customerSchema = z.object({
  name: z.string().trim().min(3, "Nome muito curto").max(120),
  doc: z.string().trim().refine(isValidCpfOrCnpj, "CPF/CNPJ inválido"),
  email: z.string().trim().email("E-mail inválido").max(180),
  phone: z.string().trim().refine((v) => {
    const d = onlyDigits(v);
    return d.length === 10 || d.length === 11;
  }, "Telefone inválido"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento obrigatória"),
  address: z.object({
    cep: z.string().trim().refine((v) => onlyDigits(v).length === 8, "CEP inválido"),
    street: z.string().trim().min(2).max(180),
    number: z.string().trim().min(1).max(10),
    complement: z.string().max(80).optional().or(z.literal("")),
    district: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(120),
    state: z.string().trim().length(2, "UF deve ter 2 letras"),
  }),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const creditCardSchema = z.object({
  number: z.string().refine((v) => v.replace(/\D/g, "").length >= 13, "Número inválido"),
  holder: z.string().trim().min(3, "Nome do titular obrigatório").max(80),
  expiration: z.string().regex(/^(0[1-9]|1[0-2])\/(20\d{2})$/, "Validade no formato MM/AAAA"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
  brand: z.string().optional(),
  installments: z.number().min(1).max(12).default(1),
});
export type CreditCardInput = z.infer<typeof creditCardSchema>;

export function detectCardBrand(number: string): string {
  const n = number.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Master";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(606282|3841)/.test(n)) return "Hipercard";
  if (/^(4011|438935|451416|5067|636368|627780)/.test(n)) return "Elo";
  if (/^(38|60)/.test(n)) return "Hiper";
  return "Visa";
}

// ---------------------------------------------------------------------------
// Mobile line (SIM/eSIM + portability + shipping for physical SIM)
// ---------------------------------------------------------------------------



const portabilitySchema = z.object({
  enabled: z.literal(true).optional(),
  current_msisdn: z.string().refine((v) => onlyDigits(v).length >= 10, "Número atual inválido"),
  current_operator: z.string().trim().min(1, "Operadora atual obrigatória"),
  current_doc: z.string().optional(),
  window_id: z.string().optional(),
});

const shippingSchema = z.object({
  cep: z.string().refine((v) => onlyDigits(v).length === 8, "CEP inválido"),
  street: z.string().trim().min(2).max(180),
  number: z.string().trim().min(1).max(10),
  complement: z.string().max(80).optional().or(z.literal("")),
  district: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().length(2),
  recipient: z.string().trim().min(2).max(120).optional(),
});

export const lineSchema = z.object({
  sim_kind: z.enum(["esim", "physical"]),
  birthdate: z.string().optional(),
  desired_msisdn_prefix: z.string().regex(/^\d{2}$/).optional().or(z.literal("")),
  portability_enabled: z.boolean().default(false),
  portability: portabilitySchema.optional(),
  shipping_same_as_billing: z.boolean().default(true),
  shipping_address: shippingSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.portability_enabled && !data.portability) {
    ctx.addIssue({ code: "custom", message: "Preencha os dados de portabilidade", path: ["portability"] });
  }
  if (data.sim_kind === "physical" && !data.shipping_same_as_billing && !data.shipping_address) {
    ctx.addIssue({ code: "custom", message: "Endereço de entrega obrigatório", path: ["shipping_address"] });
  }
});

export type LineInput = z.infer<typeof lineSchema>;
