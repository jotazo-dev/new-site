import {
  Signal,
  Smartphone,
  MessageCircle,
  Zap,
  Wifi,
  Shield,
  Star,
  Check,
  Phone,
  Globe,
  Rocket,
  CreditCard,
  QrCode,
  type LucideIcon,
} from "lucide-react";

export const CHIP_BADGE_ICONS: Record<string, LucideIcon> = {
  Signal,
  Smartphone,
  MessageCircle,
  Zap,
  Wifi,
  Shield,
  Star,
  Check,
  Phone,
  Globe,
  Rocket,
  CreditCard,
  QrCode,
};

export const CHIP_BADGE_ICON_NAMES = Object.keys(CHIP_BADGE_ICONS);

export type ChipBadge = { icon: string; text: string };

export const DEFAULT_CHIP_BADGES: ChipBadge[] = [
  { icon: "Signal", text: "Rede 5G de alta velocidade" },
  { icon: "Smartphone", text: "Portabilidade grátis" },
  { icon: "MessageCircle", text: "Atendimento via WhatsApp" },
  { icon: "Zap", text: "Ativação rápida e fácil" },
];

export function parseChipBadges(raw: string | undefined | null): ChipBadge[] {
  if (!raw) return DEFAULT_CHIP_BADGES;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((p) => typeof p?.icon === "string" && typeof p?.text === "string")) {
      return parsed as ChipBadge[];
    }
    return DEFAULT_CHIP_BADGES;
  } catch {
    return DEFAULT_CHIP_BADGES;
  }
}

export function getChipBadgeIcon(name: string): LucideIcon {
  return CHIP_BADGE_ICONS[name] ?? Check;
}
