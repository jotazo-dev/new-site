import { useEffect, useRef, useState } from "react";
import { Wifi, Smartphone, Tv, Phone, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

const services: { icon: LucideIcon; title: string; description: string; href: string }[] = [
  {
    icon: Wifi,
    title: "Internet Fibra",
    description: "Internet 100% fibra óptica com velocidades de até 1 Gbps para sua casa.",
    href: "/planos",
  },
  {
    icon: Smartphone,
    title: "Internet Móvel 5G",
    description: "Tecnologia 5G para navegar com ultra velocidade onde você estiver.",
    href: "/planos",
  },
  {
    icon: Tv,
    title: "TV por Assinatura",
    description: "Filmes, séries e canais ao vivo para toda a família aproveitar.",
    href: "/planos",
  },
  {
    icon: Phone,
    title: "Telefonia",
    description: "Serviço de telefonia fixa e móvel para você falar à vontade.",
    href: "/planos",
  },
];

export function ServicesOverviewSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="space-y-8">
      <div className="space-y-2 text-left">
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Conheça nossos serviços
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Soluções completas em conectividade e entretenimento para você e sua família.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {services.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className={`group relative overflow-hidden rounded-2xl bg-muted/50 p-6 transition-all duration-500 hover:shadow-md ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${150 + i * 100}ms` }}
            >
              <Icon className="h-8 w-8 text-accent" />
              <h3 className="mt-4 font-display text-base font-bold text-foreground sm:text-lg">
                {s.title}
              </h3>
              <div className="mt-2 h-[2px] w-10 rounded-full bg-accent" />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {s.description}
              </p>
              <Link
                to={s.href}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
              >
                Quero saber mais
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
