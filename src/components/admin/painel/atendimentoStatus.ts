import type { AtendimentoStatus } from "@/hooks/useRbxAtendimentos";

export const STATUS_META: Record<AtendimentoStatus, { label: string; dot: string; chip: string; ring: string }> = {
  aberto: {
    label: "Aberto",
    dot: "bg-blue-500",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    ring: "ring-blue-500",
  },
  em_andamento: {
    label: "Em andamento",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    ring: "ring-amber-500",
  },
  concluido: {
    label: "Concluído",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ring: "ring-emerald-500",
  },
  cancelado: {
    label: "Cancelado",
    dot: "bg-muted-foreground/60",
    chip: "bg-muted text-muted-foreground border-border",
    ring: "ring-muted-foreground",
  },
};

export const STATUS_ORDER: AtendimentoStatus[] = ["aberto", "em_andamento", "concluido", "cancelado"];
