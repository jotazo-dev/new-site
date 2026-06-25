import * as React from "react";
import { Plus, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FiberMobileUpgradeBannerProps {
  /** Lista de planos móveis disponíveis (usado apenas para verificar se há planos) */
  mobilePlans: { id: string }[];
  /** Callback acionado ao clicar em "Adicionar 5G" */
  onAddMobile: () => void;
}

const SOCIAL_AVATARS = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
];

export function FiberMobileUpgradeBanner({ mobilePlans, onAddMobile }: FiberMobileUpgradeBannerProps) {
  if (!mobilePlans.length) return null;

  return (
    <div className="animate-fade-in rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-card to-card p-4 shadow-lg shadow-accent/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-emerald-400 shadow-lg shadow-[#25D366]/30">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-[#25D366]/40" />
          <Smartphone className="relative h-8 w-8 text-white" />
        </span>
        <div className="flex-1">
          <p className="flex items-center gap-2 text-base font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            Falta pouco! Adicione um chip 5G
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">📱 5G ilimitado redes sociais</span>
            <span className="inline-flex items-center gap-1">💳 Conta única</span>
          </div>
          {/* Prova social */}
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex -space-x-2">
              {SOCIAL_AVATARS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-6 w-6 rounded-full border-2 border-card object-cover"
                />
              ))}
            </div>
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(142,70%,45%)]/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(142,70%,45%)]" />
            </span>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">237 pessoas</span> adquiriram Chip 5G esta semana
            </p>
          </div>
        </div>
        <Button
          onClick={onAddMobile}
          className="shrink-0 bg-accent text-accent-foreground shadow-md shadow-accent/30 hover:bg-accent/90"
        >
          <Plus className="mr-1 h-4 w-4" /> Adicionar 5G
        </Button>
      </div>
    </div>
  );
}
