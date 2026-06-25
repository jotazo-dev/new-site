import { useEffect, useRef, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

import comboInternet from "@/assets/combo/jotazo-telecom-combo-internet.webp";
import comboEntretenimento from "@/assets/combo/jotazo-telecom-combo-entretenimento.webp";
import comboTelefonia from "@/assets/combo/jotazo-telecom-combo-telefonia.webp";

export const comboImageUrls = [comboInternet, comboEntretenimento, comboTelefonia];

const comboCards = [
  {
    title: "Internet",
    description: "Conexão fibra óptica de ultra velocidade com estabilidade total. Navegue, trabalhe e jogue sem interrupções.",
    gradient: "from-[hsl(0,80%,55%)] to-[hsl(10,85%,50%)]",
    image: comboInternet,
  },
  {
    title: "Entretenimento",
    description: "Os melhores conteúdos de streaming em um só lugar. Filmes, séries, esportes e música para toda a família aproveitar.",
    gradient: "from-[hsl(340,80%,55%)] to-[hsl(350,75%,50%)]",
    image: comboEntretenimento,
  },
  {
    title: "Conexão",
    description: "Conectividade de alta velocidade em todo o território nacional. Rede robusta que leva internet de qualidade para todos os cantos do Brasil.",
    gradient: "from-[hsl(24,95%,55%)] to-[hsl(30,90%,50%)]",
    image: comboTelefonia,
  },
];

function CardItem({ card, visible, index, withPlus }: { card: typeof comboCards[number]; visible: boolean; index: number; withPlus: boolean }) {
  const show = visible;
  return (
    <div className="relative flex items-stretch gap-[5px] h-full">
      {withPlus && index > 0 && (
        <span
          className={`absolute left-0 -translate-x-[65%] z-20 text-5xl font-light text-accent transition-all duration-500 ease-out top-[75%] -translate-y-1/2 sm:left-[-2.5px] sm:translate-x-[-50%] sm:top-auto sm:translate-y-0 sm:bottom-10 sm:text-5xl ${
            show ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
          style={{ transitionDelay: `${300 + index * 150}ms` }}
        >
          +
        </span>
      )}

      <div
        className={`flex w-full flex-col overflow-hidden rounded-2xl transition-all duration-700 ease-out ${
          show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
        style={{ transitionDelay: `${200 + index * 150}ms` }}
      >
        <div className="relative flex h-44 w-full items-end justify-center overflow-hidden sm:h-60 md:h-72">
          <img
            src={card.image}
            alt={card.title}
            width={600}
            height={400}
            className="relative z-10 h-full w-full object-cover object-center"
            decoding="async"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        <div className="flex-1 w-full space-y-1 bg-[#f4f4f4] p-5 text-left">
          <h3 className="font-display text-sm font-bold text-foreground sm:text-base">
            {card.title}
          </h3>
          <div className="h-[2px] w-10 rounded-full bg-accent" />
          <p className="text-xs leading-snug text-muted-foreground sm:text-sm">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ComboOffersSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const settings = useSiteSettings();
  const mobileColumns = settings["combo_offers_mobile_columns"] === "2" ? 2 : 1;
  const mobileMode = settings["combo_offers_mobile_mode"] === "grade" ? "grade" : "slide";

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect();
          // Pré-carrega as 3 imagens em paralelo para que entrem juntas e na ordem correta
          const preload = comboImageUrls.map(
            (src) =>
              new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = src;
              })
          );
          const timeout = new Promise<void>((resolve) => setTimeout(resolve, 600));
          Promise.race([Promise.all(preload).then(() => undefined), timeout]).then(() => {
            setVisible(true);
          });
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-10 md:py-14">
      <div className="w-full">
        {/* Desktop layout */}
        <div className="hidden lg:flex relative items-stretch justify-center gap-[5px]">
          {comboCards.map((card, i) => (
            <div key={card.title} className="w-72">
              <CardItem card={card} visible={visible} index={i} withPlus />
            </div>
          ))}
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden">
          {mobileMode === "slide" ? (
            <Carousel opts={{ align: "start", loop: false }} className="w-full">
              <CarouselContent className="-ml-3">
                {comboCards.map((card, i) => (
                  <CarouselItem
                    key={card.title}
                    className={cn("pl-3", mobileColumns === 2 ? "basis-1/2" : "basis-[66%]")}
                  >
                    <div className="h-full">
                      <CardItem card={card} visible={visible} index={i} withPlus />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious variant="outline" className="-left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
              <CarouselNext variant="outline" className="-right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full md:flex" />
            </Carousel>
          ) : (
            <div className={cn("grid gap-3", mobileColumns === 2 ? "grid-cols-2" : "grid-cols-1")}>
              {comboCards.map((card, i) => (
                <CardItem key={card.title} card={card} visible={visible} index={i} withPlus />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
