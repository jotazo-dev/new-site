export type CrmStage = "novo" | "em_contato" | "proposta" | "agendado" | "instalado" | "perdido";

export const STAGES: { id: CrmStage; label: string; accent: string }[] = [
  { id: "novo", label: "Novo", accent: "hsl(var(--primary))" },
  { id: "em_contato", label: "Em contato", accent: "hsl(38 92% 50%)" },
  { id: "proposta", label: "Proposta", accent: "hsl(262 83% 58%)" },
  { id: "agendado", label: "Agendado", accent: "hsl(199 89% 48%)" },
  { id: "instalado", label: "Instalado", accent: "hsl(142 71% 45%)" },
  { id: "perdido", label: "Perdido", accent: "hsl(var(--destructive))" },
];

export type CrmLeadItem = {
  plan_id: string;
  plan_name: string;
  category: string;
  price_cents: number;
  qty: number;
  free_override: boolean;
};

export type CrmLead = {
  id: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
  items: CrmLeadItem[];
  subtotal_cents: number;
  combo_discount_cents: number;
  total_cents: number;
  coupon_code: string | null;
  source: string;
  stage: CrmStage;
  stage_order: number;
  notes: string;
  next_action_at?: string | null;
  next_action_note?: string;
  tags?: string[];
  assigned_to?: string | null;
};

// ===== Auto tags =====
export type AutoTag = "hot" | "stale" | "vip" | "repeat" | "follow_up_due";

// LTV horizon in months (1 year is the telecom industry standard for short-term LTV)
export const LTV_MONTHS = 12;

/** LTV = soma do mensal de todos os pedidos do contato × LTV_MONTHS. */
export function computeLtvCents(lifetimeMonthlyCents: number, months: number = LTV_MONTHS): number {
  return Math.round(lifetimeMonthlyCents * months);
}

export function computeAutoTags(lead: CrmLead, _lifetimeMonthlyCents: number, totalOrders: number): AutoTag[] {
  const tags: AutoTag[] = [];
  const now = Date.now();
  const created = new Date(lead.created_at).getTime();
  const updated = new Date(lead.updated_at).getTime();
  const day = 86400000;
  // VIP baseado no LTV do pedido atual (mensalidade × 12), não na soma de pedidos antigos.
  const ltv = computeLtvCents(lead.total_cents);
  if (now - created < day) tags.push("hot");
  if (lead.stage !== "instalado" && lead.stage !== "perdido" && now - updated > 7 * day) tags.push("stale");
  // VIP: LTV (12 meses) >= R$ 1.500
  if (ltv >= 150000) tags.push("vip");
  if (totalOrders > 1) tags.push("repeat");
  if (lead.next_action_at && new Date(lead.next_action_at).getTime() < now) tags.push("follow_up_due");
  return tags;
}

export const AUTO_TAG_META: Record<AutoTag, { label: string; emoji: string; className: string }> = {
  hot: { label: "Quente", emoji: "🔥", className: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  stale: { label: "Parado", emoji: "⏳", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  vip: { label: "VIP", emoji: "💎", className: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  repeat: { label: "Recorrente", emoji: "🔁", className: "bg-primary/10 text-primary border-primary/30" },
  follow_up_due: { label: "Follow-up vencido", emoji: "⏰", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  const hr = 3600000;
  const min = 60000;
  if (diff < min) return "agora";
  if (diff < hr) return `há ${Math.floor(diff / min)}min`;
  if (diff < day) return `há ${Math.floor(diff / hr)}h`;
  const days = Math.floor(diff / day);
  if (days === 1) return "há 1 dia";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? "há 1 mês" : `há ${months} meses`;
}

export function buildLeadAddress(lead: CrmLead): string {
  return [
    lead.street,
    lead.number && `nº ${lead.number}`,
    lead.complement,
    lead.neighborhood,
    lead.city && `${lead.city} - ${lead.uf}`,
  ]
    .filter(Boolean)
    .join(", ");
}

// ===== Contact unification =====
// A contact groups all leads sharing the same normalized phone OR same lowercased email.

export type CrmContact = {
  key: string;
  primary: CrmLead;
  leads: CrmLead[];
  totalOrders: number;
  lifetimeTotalCents: number;
};

const normPhone = (p?: string | null) => (p || "").replace(/\D/g, "");
const normEmail = (e?: string | null) => (e || "").trim().toLowerCase();

export function groupLeadsByContact(leads: CrmLead[]): CrmContact[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x);
    if (!p || p === x) return x;
    const r = find(p);
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const l of leads) parent.set(l.id, l.id);

  const byPhone = new Map<string, string>();
  const byEmail = new Map<string, string>();
  for (const l of leads) {
    const phone = normPhone(l.customer_phone);
    const email = normEmail(l.customer_email);
    if (phone) {
      const seen = byPhone.get(phone);
      if (seen) union(l.id, seen);
      else byPhone.set(phone, l.id);
    }
    if (email) {
      const seen = byEmail.get(email);
      if (seen) union(l.id, seen);
      else byEmail.set(email, l.id);
    }
  }

  const buckets = new Map<string, CrmLead[]>();
  for (const l of leads) {
    const root = find(l.id);
    const arr = buckets.get(root) || [];
    arr.push(l);
    buckets.set(root, arr);
  }

  const contacts: CrmContact[] = [];
  for (const [root, arr] of buckets) {
    const sorted = [...arr].sort(
      (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
    );
    const primary = sorted[0];
    const phone = normPhone(primary.customer_phone);
    const email = normEmail(primary.customer_email);
    contacts.push({
      key: phone || email || root,
      primary,
      leads: sorted,
      totalOrders: sorted.length,
      lifetimeTotalCents: sorted.reduce((s, l) => s + (l.total_cents || 0), 0),
    });
  }
  return contacts;
}
