export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  colors: { label: string; value: string }[];
  overrides: Record<string, string>;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "default",
    name: "Padrão",
    description: "Cores originais da Jotazo",
    emoji: "🎨",
    colors: [
      { label: "Primary", value: "hsl(218, 80%, 45%)" },
      { label: "Accent", value: "hsl(25, 95%, 53%)" },
      { label: "Background", value: "hsl(0, 0%, 100%)" },
    ],
    overrides: {},
  },
  {
    id: "personalizado",
    name: "Personalizado",
    description: "Defina suas próprias cores",
    emoji: "✨",
    colors: [
      { label: "Primary", value: "hsl(200, 70%, 50%)" },
      { label: "Accent", value: "hsl(160, 60%, 45%)" },
      { label: "Background", value: "hsl(210, 20%, 98%)" },
    ],
    overrides: {
      "--background": "210 20% 98%",
      "--foreground": "210 25% 10%",
      "--card": "0 0% 100%",
      "--card-foreground": "210 25% 10%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "210 25% 10%",
      "--primary": "200 70% 50%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "160 30% 92%",
      "--secondary-foreground": "200 50% 25%",
      "--muted": "210 15% 93%",
      "--muted-foreground": "210 10% 45%",
      "--accent": "160 60% 45%",
      "--accent-foreground": "0 0% 100%",
      "--border": "210 15% 88%",
      "--input": "210 15% 88%",
      "--ring": "200 70% 50%",
    },
  },
];

export function getThemeById(id: string): ThemeDefinition | undefined {
  return THEMES.find((t) => t.id === id);
}
