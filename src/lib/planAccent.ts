/* ── Cores de destaque para planos premium ──
 * Cada cor define classes para borda, badge, gradiente de glow e texto.
 */
export type PlanAccent = {
  value: string;
  label: string;
  /** swatch usado no admin (preview) */
  swatch: string;
  /** ring/border ao destacar o card */
  border: string;
  /** texto/anel de destaque (header) */
  accentText: string;
  /** background do badge "destaque" */
  badge: string;
  /** glow/halo do canto do card */
  glow: string;
};

export const PLAN_ACCENTS: PlanAccent[] = [
  {
    value: "",
    label: "Padrão (sem destaque)",
    swatch: "bg-muted",
    border: "",
    accentText: "",
    badge: "",
    glow: "",
  },
  {
    value: "orange",
    label: "Laranja (oferta)",
    swatch: "bg-accent",
    border: "ring-2 ring-accent border-accent",
    accentText: "text-accent",
    badge: "bg-accent text-accent-foreground",
    glow: "bg-accent/30",
  },
  {
    value: "blue",
    label: "Azul (premium)",
    swatch: "bg-primary",
    border: "ring-2 ring-primary border-primary",
    accentText: "text-primary",
    badge: "bg-primary text-primary-foreground",
    glow: "bg-primary/30",
  },
  {
    value: "green",
    label: "Verde (recomendado)",
    swatch: "bg-[hsl(142,70%,45%)]",
    border: "ring-2 ring-[hsl(142,70%,45%)] border-[hsl(142,70%,45%)]",
    accentText: "text-[hsl(142,70%,40%)]",
    badge: "bg-[hsl(142,70%,45%)] text-white",
    glow: "bg-[hsl(142,70%,45%)]/30",
  },
  {
    value: "purple",
    label: "Roxo (exclusivo)",
    swatch: "bg-[hsl(270,70%,55%)]",
    border: "ring-2 ring-[hsl(270,70%,55%)] border-[hsl(270,70%,55%)]",
    accentText: "text-[hsl(270,70%,55%)]",
    badge: "bg-[hsl(270,70%,55%)] text-white",
    glow: "bg-[hsl(270,70%,55%)]/30",
  },
  {
    value: "pink",
    label: "Rosa (novo)",
    swatch: "bg-[hsl(330,80%,60%)]",
    border: "ring-2 ring-[hsl(330,80%,60%)] border-[hsl(330,80%,60%)]",
    accentText: "text-[hsl(330,80%,55%)]",
    badge: "bg-[hsl(330,80%,60%)] text-white",
    glow: "bg-[hsl(330,80%,60%)]/30",
  },
  {
    value: "red",
    label: "Vermelho (urgência)",
    swatch: "bg-destructive",
    border: "ring-2 ring-destructive border-destructive",
    accentText: "text-destructive",
    badge: "bg-destructive text-destructive-foreground",
    glow: "bg-destructive/30",
  },
];

export function getPlanAccent(value?: string): PlanAccent {
  return PLAN_ACCENTS.find((a) => a.value === value) ?? PLAN_ACCENTS[0];
}
