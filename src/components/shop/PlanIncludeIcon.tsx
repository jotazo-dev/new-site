import {
  Wifi, Download, Upload, Monitor, Phone, Signal, Shield, Headphones,
  Wrench, Zap, Globe, Router, Tv, Music, Film, Star, Check, Clock,
  MapPin, Users, Gift, Cloud, Lock, Settings, Award, Smartphone,
  Activity, BarChart3, Gauge, HardDrive, Blocks, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Ícone oficial do WhatsApp
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2Zm5.38 13.7c-.23.65-1.34 1.24-1.86 1.32-.5.08-1.02.11-1.53-.03-.35-.1-.8-.25-1.37-.5-2.42-1-3.99-3.35-4.12-3.55-.12-.2-.98-1.3-.98-2.48 0-1.18.62-1.76.84-2 .22-.24.48-.3.64-.3.16 0 .32 0 .46.01.15 0 .35-.06.55.42.2.48.64 1.63.7 1.75.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.3-.36.4-.12.12-.24.25-.12.48.12.24.53.87 1.14 1.41.78.7 1.44.92 1.74 1.02.2.06.38-.04.48-.14.1-.1.46-.54.58-.72.12-.18.24-.15.4-.09.16.06 1.03.48 1.21.57.18.09.3.14.35.22.04.08.04.46-.1 1.11Z" />
    </svg>
  );
}

const ICON_MAP: Record<string, LucideIcon | React.FC<{ className?: string }>> = {
  wifi: Wifi, download: Download, upload: Upload, monitor: Monitor,
  phone: Phone, signal: Signal, shield: Shield, headphones: Headphones,
  wrench: Wrench, zap: Zap, globe: Globe, router: Router,
  tv: Tv, music: Music, film: Film, star: Star, check: Check,
  clock: Clock, "map-pin": MapPin, users: Users, gift: Gift,
  cloud: Cloud, lock: Lock, settings: Settings, award: Award,
  smartphone: Smartphone, activity: Activity, "bar-chart": BarChart3,
  gauge: Gauge, "hard-drive": HardDrive, blocks: Blocks,
  whatsapp: WhatsAppIcon,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function PlanIncludeIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon] || Check;
  return <Icon className={cn("h-4 w-4 shrink-0", className)} />;
}
