import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import oletvLogo from "@/assets/jotazo-telecom-oletv-logo.png";

import strangerThings from "@/assets/catalog/jotazo-telecom-stranger-things.webp";
import theWitcher from "@/assets/catalog/jotazo-telecom-the-witcher.webp";
import laCasaDePapel from "@/assets/catalog/jotazo-telecom-la-casa-de-papel.webp";
import breakingBad from "@/assets/catalog/jotazo-telecom-breaking-bad.webp";
import dark from "@/assets/catalog/jotazo-telecom-dark.webp";
import peakyBlinders from "@/assets/catalog/jotazo-telecom-peaky-blinders.webp";
import narcos from "@/assets/catalog/jotazo-telecom-narcos.webp";
import interestelar from "@/assets/catalog/jotazo-telecom-interestelar.webp";
import oppenheimer from "@/assets/catalog/jotazo-telecom-oppenheimer.webp";
import duna from "@/assets/catalog/jotazo-telecom-duna.webp";
import avatar from "@/assets/catalog/jotazo-telecom-avatar.webp";
import barbie from "@/assets/catalog/jotazo-telecom-barbie.webp";
import guardioes from "@/assets/catalog/jotazo-telecom-guardioes-galaxia-3.webp";
import poderosoChefao from "@/assets/catalog/jotazo-telecom-poderoso-chefao.webp";
import matrix from "@/assets/catalog/jotazo-telecom-matrix.webp";
import gladiador from "@/assets/catalog/jotazo-telecom-gladiador.webp";
import inception from "@/assets/catalog/jotazo-telecom-inception.webp";
import parasita from "@/assets/catalog/jotazo-telecom-parasita.webp";
import vingadores from "@/assets/catalog/jotazo-telecom-vingadores-ultimato.webp";
import wednesday from "@/assets/catalog/jotazo-telecom-wednesday.webp";
import theLastOfUs from "@/assets/catalog/jotazo-telecom-the-last-of-us.webp";
import houseOfTheDragon from "@/assets/catalog/jotazo-telecom-house-of-the-dragon.webp";
import loki from "@/assets/catalog/jotazo-telecom-loki.webp";
import arcane from "@/assets/catalog/jotazo-telecom-arcane.webp";
import squidGame from "@/assets/catalog/jotazo-telecom-squid-game.webp";
import gameOfThrones from "@/assets/catalog/jotazo-telecom-game-of-thrones.webp";
import theCrown from "@/assets/catalog/jotazo-telecom-the-crown.webp";
import theOffice from "@/assets/catalog/jotazo-telecom-the-office.webp";
import friends from "@/assets/catalog/jotazo-telecom-friends.webp";
import euphoria from "@/assets/catalog/jotazo-telecom-euphoria.webp";
import theWalkingDead from "@/assets/catalog/jotazo-telecom-the-walking-dead.webp";

interface CatalogItem {
  id: number;
  title: string;
  image: string;
}

const rows = [
  {
    label: "Em alta 🔥",
    items: [
      { id: 1, title: "Stranger Things", image: strangerThings },
      { id: 2, title: "The Witcher", image: theWitcher },
      { id: 3, title: "La Casa de Papel", image: laCasaDePapel },
      { id: 4, title: "Breaking Bad", image: breakingBad },
      { id: 5, title: "Dark", image: dark },
      { id: 6, title: "Peaky Blinders", image: peakyBlinders },
      { id: 7, title: "Narcos", image: narcos },
    ],
  },
  {
    label: "Filmes imperdíveis 🎬",
    items: [
      { id: 10, title: "Interestelar", image: interestelar },
      { id: 11, title: "Oppenheimer", image: oppenheimer },
      { id: 12, title: "Duna", image: duna },
      { id: 14, title: "Avatar", image: avatar },
      { id: 16, title: "Barbie", image: barbie },
      { id: 17, title: "Guardiões da Galáxia 3", image: guardioes },
      { id: 30, title: "O Poderoso Chefão", image: poderosoChefao },
      { id: 31, title: "Matrix", image: matrix },
      { id: 32, title: "Gladiador", image: gladiador },
      { id: 33, title: "Inception", image: inception },
      { id: 34, title: "Parasita", image: parasita },
      { id: 35, title: "Vingadores: Ultimato", image: vingadores },
    ],
  },
  {
    label: "Séries originais ⭐",
    items: [
      { id: 20, title: "Wednesday", image: wednesday },
      { id: 21, title: "The Last of Us", image: theLastOfUs },
      { id: 22, title: "House of the Dragon", image: houseOfTheDragon },
      { id: 25, title: "Loki", image: loki },
      { id: 26, title: "Arcane", image: arcane },
      { id: 27, title: "Squid Game", image: squidGame },
      { id: 40, title: "Game of Thrones", image: gameOfThrones },
      { id: 41, title: "The Crown", image: theCrown },
      { id: 42, title: "The Office", image: theOffice },
      { id: 43, title: "Friends", image: friends },
      { id: 44, title: "Euphoria", image: euphoria },
      { id: 45, title: "The Walking Dead", image: theWalkingDead },
    ],
  },
];

function PosterCard({ item }: { item: CatalogItem }) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="group/card relative w-[140px] shrink-0 cursor-pointer sm:w-[160px] md:w-[170px]">
      <div
        className="overflow-hidden rounded-lg transition-transform duration-200 group-hover/card:scale-105"
        style={{ aspectRatio: "2/3" }}
      >
        {hasError ? (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-primary/20 p-3">
            <p className="text-center text-xs font-medium text-white/70">{item.title}</p>
          </div>
        ) : (
          <img
            src={item.image}
            alt={item.title}
            width={170}
            height={255}
            className="h-full w-full object-cover transition-all duration-300 group-hover/card:brightness-75"
            loading="lazy"
            decoding="async"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      {/* overlay with title */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
        <p className="text-xs font-semibold text-white drop-shadow">{item.title}</p>
      </div>
    </div>
  );
}

const PosterCardMemo = React.memo(PosterCard);

function CatalogRow({ label, items }: { label: string; items: CatalogItem[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <h3 className="mb-3 text-lg font-semibold tracking-tight text-white">{label}</h3>

      <div className="group/row relative">
        {/* scroll arrows */}
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label={`Rolar ${label} para a esquerda`}
          className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 shadow-md transition-opacity group-hover/row:opacity-100 hover:bg-black/70 md:flex"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label={`Rolar ${label} para a direita`}
          className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 shadow-md transition-opacity group-hover/row:opacity-100 hover:bg-black/70 md:flex"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pb-2"
        >
          {items.map((item) => (
            <PosterCardMemo key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NetflixCatalogSection() {
  return (
    <section
      className="space-y-8 rounded-[20px] p-6 md:p-10"
      style={{ backgroundColor: "hsl(222.2 84% 4.9%)" }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Catálogo Jotazo TV
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Assista o que quiser, quando quiser
          </h2>
        </div>
        <img src={oletvLogo} alt="OléTV" className="h-8 shrink-0 object-contain md:h-11" />
      </div>

      {rows.map((row) => (
        <CatalogRow key={row.label} label={row.label} items={row.items} />
      ))}
    </section>
  );
}
