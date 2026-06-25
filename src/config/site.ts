import type { PlanCategory } from "@/data/plans";

export const BRAND = {
  name: "Jotazo Telecom",
};

export const LINKS = {
  customerPortal: "https://jotazo.rbxsoft.com/app_login/app_login.php",
};

// Número oficial WhatsApp Jotazo (formato internacional, apenas dígitos)
export const WHATSAPP = {
  number: "08007210179",
};

export const COVERAGE = {
  mapEmbedUrl:
    "https://www.google.com/maps?q=Jotazo%20Telecom&output=embed",
};

export const PLAN_CATEGORIES: { key: PlanCategory; label: string }[] = [
  { key: "fibra", label: "Fibra" },
  { key: "movel", label: "Móvel" },
  { key: "tv", label: "TV" },
  { key: "combo", label: "Combos" },
];
