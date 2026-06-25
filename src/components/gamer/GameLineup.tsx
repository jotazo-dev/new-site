import { Gauge } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import valorantImg from "@/assets/games/valorant.jpg";
import lolImg from "@/assets/games/lol.jpg";
import cs2Img from "@/assets/games/cs2.jpg";
import fortniteImg from "@/assets/games/fortnite.jpg";
import freefireImg from "@/assets/games/freefire.jpg";
import rocketImg from "@/assets/games/rocketleague.jpg";

type Game = { name: string; server: string; pingMs: number; image: string };

const GAMES: Game[] = [
  { name: "Valorant", server: "São Paulo (SA-East)", pingMs: 12, image: valorantImg },
  { name: "League of Legends", server: "BR1 — São Paulo", pingMs: 14, image: lolImg },
  { name: "Counter-Strike 2", server: "São Paulo", pingMs: 15, image: cs2Img },
  { name: "Fortnite", server: "Brasil", pingMs: 18, image: fortniteImg },
  { name: "Free Fire", server: "Brasil", pingMs: 16, image: freefireImg },
  { name: "Rocket League", server: "South America", pingMs: 22, image: rocketImg },
];

function pingTone(ms: number) {
  if (ms <= 15) return "bg-[hsl(142,70%,40%)]/20 text-[hsl(142,70%,30%)] border-[hsl(142,70%,40%)]/40";
  if (ms <= 20) return "bg-accent/20 text-accent border-accent/40";
  return "bg-destructive/20 text-destructive border-destructive/40";
}

export function GameLineup() {
  return (
    <section className="space-y-8">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Performance nos jogos que você joga
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Ping médio estimado a partir da nossa rede até os servidores oficiais
          dos principais títulos competitivos.
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-8 md:px-12">
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent className="-ml-3">
            {GAMES.map((g) => (
              <CarouselItem
                key={g.name}
                className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4"
              >
                <article className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_0_40px_-12px_hsl(var(--accent)/0.5)]">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={g.image}
                      alt={`Arte conceitual de ${g.name}`}
                      loading="lazy"
                      width={480}
                      height={640}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                    />
                    <span
                      className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${pingTone(g.pingMs)}`}
                    >
                      <Gauge className="h-2.5 w-2.5" />
                      {g.pingMs}ms
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <h3 className="font-display text-sm font-bold text-white">
                        {g.name}
                      </h3>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/70">
                        {g.server}
                      </p>
                    </div>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="border-accent/40 bg-background text-accent hover:bg-accent hover:text-accent-foreground" />
          <CarouselNext className="border-accent/40 bg-background text-accent hover:bg-accent hover:text-accent-foreground" />
        </Carousel>
      </div>
    </section>
  );
}
