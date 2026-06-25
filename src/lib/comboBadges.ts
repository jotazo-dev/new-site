export const COMBO_BADGE_COLORS: { value: string; label: string; classes: string }[] = [
  { value: "accent", label: "Laranja (accent)", classes: "bg-accent text-accent-foreground" },
  { value: "primary", label: "Azul (primary)", classes: "bg-primary text-primary-foreground" },
  { value: "success", label: "Verde", classes: "bg-[hsl(142,70%,45%)] text-white" },
  { value: "destructive", label: "Vermelho", classes: "bg-destructive text-destructive-foreground" },
  { value: "muted", label: "Cinza", classes: "bg-muted-foreground text-background" },
];

export function badgeClassesFor(color?: string) {
  return COMBO_BADGE_COLORS.find((b) => b.value === color)?.classes ?? COMBO_BADGE_COLORS[0].classes;
}
