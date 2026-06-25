import { useEffect, useRef, useState } from "react";
import { FileText, Gauge, PhoneCall, Monitor, MapPin, MessageSquare, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { LINKS } from "@/config/site";
import { CallbackDialog } from "./CallbackDialog";
import { RemoteSupportDialog } from "./RemoteSupportDialog";
import { StoresMapDialog } from "./StoresMapDialog";

const items: {
  icon: LucideIcon;
  title: string;
  description: string;
  to?: string;
  href?: string;
  onClick?: "callback" | "remote" | "stores";
}[] = [
  {
    icon: FileText,
    title: "2ª via da Fatura",
    description: "Acesse seu boleto atualizado de forma rápida e prática.",
    href: LINKS.customerPortal,
  },
  {
    icon: Gauge,
    title: "Teste de Velocidade",
    description: "Meça a velocidade real da sua conexão agora mesmo.",
    to: "/teste-de-velocidade",
  },
  {
    icon: PhoneCall,
    title: "Ligamos para você",
    description: "Solicite uma ligação e nossa equipe entra em contato.",
    onClick: "callback",
  },
  {
    icon: Monitor,
    title: "Suporte Remoto",
    description: "Receba ajuda técnica sem sair de casa.",
    onClick: "remote",
  },
  {
    icon: MapPin,
    title: "Onde Estamos",
    description: "Encontre a loja Jotazo mais perto de você.",
    onClick: "stores",
  },
  {
    icon: MessageSquare,
    title: "Ouvidoria",
    description: "Canal direto para sugestões, elogios ou reclamações.",
    to: "/atendimento",
  },
];

export function SelfServiceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [storesOpen, setStoresOpen] = useState(false);

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
          Autoatendimento
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Resolva o que precisar de forma rápida e sem complicação.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {items.map((item, i) => {
          const Icon = item.icon;
          const content = (
            <div
              className={`group relative overflow-hidden rounded-2xl bg-muted/50 p-6 transition-all duration-500 hover:shadow-md hover:bg-muted ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${150 + i * 80}ms` }}
            >
              <Icon className="h-8 w-8 text-accent" />
              <h3 className="mt-4 font-display text-base font-bold text-foreground sm:text-lg">
                {item.title}
              </h3>
              <div className="mt-2 h-[2px] w-10 rounded-full bg-accent" />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {item.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                Acessar <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          );

          if (item.onClick) {
            const handler = item.onClick === "callback" ? () => setCallbackOpen(true) : item.onClick === "remote" ? () => setRemoteOpen(true) : () => setStoresOpen(true);
            return (
              <button key={item.title} type="button" onClick={handler} className="text-left">
                {content}
              </button>
            );
          }

          if (item.href) {
            return (
              <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            );
          }

          return (
            <Link key={item.title} to={item.to!}>
              {content}
            </Link>
          );
        })}
      </div>

      <CallbackDialog open={callbackOpen} onOpenChange={setCallbackOpen} />
      <RemoteSupportDialog open={remoteOpen} onOpenChange={setRemoteOpen} />
      <StoresMapDialog open={storesOpen} onOpenChange={setStoresOpen} />
    </section>
  );
}
