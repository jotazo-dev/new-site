import * as React from "react";
import { Smartphone, Tv } from "lucide-react";

const apps = [
  {
    name: "Jotazo 5G",
    icon: Smartphone,
    description: "Gerencie seu chip e plano móvel, acompanhe seu consumo de dados e muito mais.",
    appleUrl: "#",
    googleUrl: "#",
  },
  {
    name: "Jotazo TV",
    icon: Tv,
    description: "Acesse todo o conteúdo de TV por assinatura direto no seu celular, tablet ou smart TV.",
    appleUrl: "#",
    googleUrl: "#",
  },
];

function AppleStoreBadge({ hovered }: { hovered?: boolean }) {
  return (
    <svg viewBox="0 0 120 40" className="h-14" aria-label="Disponível na Apple Store">
      <rect width="120" height="40" rx="5" fill="hsl(var(--foreground))" />
      <g fill="hsl(var(--background))">
        <path d="M24.77 20.3a4.95 4.95 0 0 1 2.36-4.15 5.07 5.07 0 0 0-3.99-2.16c-1.68-.18-3.31 1.01-4.17 1.01-.87 0-2.19-.99-3.61-.96a5.32 5.32 0 0 0-4.48 2.73c-1.93 3.34-.49 8.27 1.36 10.97.93 1.33 2.02 2.82 3.44 2.76 1.39-.06 1.91-.89 3.59-.89 1.67 0 2.15.89 3.6.86 1.49-.02 2.44-1.34 3.33-2.68a11.05 11.05 0 0 0 1.52-3.11 4.78 4.78 0 0 1-2.95-4.38zM22.04 12.21a4.87 4.87 0 0 0 1.12-3.49 4.96 4.96 0 0 0-3.21 1.66 4.64 4.64 0 0 0-1.14 3.37 4.11 4.11 0 0 0 3.23-1.54z" />
        <text x="42" y="15" fontSize="7" fontFamily="system-ui,sans-serif" fontWeight="400" letterSpacing=".03em">DISPONÍVEL NA</text>
        <text x="42" y="27" fontSize="12" fontFamily="system-ui,sans-serif" fontWeight="600">Apple Store</text>
      </g>
    </svg>
  );
}

function GooglePlayBadge({ hovered }: { hovered?: boolean }) {
  return (
    <svg viewBox="0 0 135 40" className="h-14" aria-label="Disponível no Google Play">
      <rect width="135" height="40" rx="5" fill="hsl(var(--foreground))" />
      <g fill="hsl(var(--background))">
        <path d="M14.5 7.13a2.15 2.15 0 0 0-.5 1.53v22.68a2.14 2.14 0 0 0 .5 1.53l.08.08L27.2 20.33v-.26-.26L14.58 7.05z" fillOpacity=".7" />
        <path d="M31.4 24.54l-4.2-4.21v-.26-.26l4.2-4.21.1.05 4.98 2.83c1.42.81 1.42 2.13 0 2.94l-4.98 2.83z" fillOpacity=".7" />
        <text x="47" y="15" fontSize="7" fontFamily="system-ui,sans-serif" fontWeight="400" letterSpacing=".03em">DISPONÍVEL NO</text>
        <text x="47" y="27" fontSize="11.5" fontFamily="system-ui,sans-serif" fontWeight="600">Google Play</text>
      </g>
    </svg>
  );
}

function StoreBadgeLink({ href, label, children }: { href: string; label: string; children: (hovered: boolean) => React.ReactNode }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="transition-all duration-300 hover:scale-105 rounded-lg"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children(hovered)}
    </a>
  );
}

export function AppDownloadSection() {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="mx-auto w-full max-w-7xl">
      <div className="space-y-2 text-left mb-10">
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Baixe o Aplicativo da Jotazo
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Tenha o controle dos seus serviços na palma da mão. Disponível para iOS e Android.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {apps.map((app, i) => {
          const Icon = app.icon;
          return (
            <div
              key={app.name}
              className={
                "rounded-2xl bg-muted/50 p-6 md:p-8 flex flex-col gap-4 transition-all duration-700 " +
                (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")
              }
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{app.name}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{app.description}</p>
              <div className="flex flex-wrap gap-4 mt-auto pt-2">
                <StoreBadgeLink href={app.appleUrl} label={`${app.name} na Apple Store`}>
                  {(h) => <AppleStoreBadge hovered={h} />}
                </StoreBadgeLink>
                <StoreBadgeLink href={app.googleUrl} label={`${app.name} no Google Play`}>
                  {(h) => <GooglePlayBadge hovered={h} />}
                </StoreBadgeLink>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
