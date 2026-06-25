import { Star, Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type GamerTestimonial = {
  nick: string;
  game: string;
  city: string;
  rating: number;
  text: string;
  rank?: string;
  photo: string;
};

const TESTIMONIALS: GamerTestimonial[] = [
  {
    nick: "ShadowBR",
    game: "Valorant",
    city: "Apiaí",
    rating: 5,
    rank: "Imortal",
    text: "Saí do 80ms pro 12ms depois que troquei pra Jotazo. Subi pra Imortal no mesmo mês. Sem lag, sem packet loss.",
    photo: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    nick: "Lulu.exe",
    game: "League of Legends",
    city: "Itapeva",
    rating: 5,
    rank: "Diamante",
    text: "Wi-Fi 6 chega forte no quarto, ping estável 18ms no servidor BR. Antes eu travava em teamfight, agora não trava mais.",
    photo: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    nick: "Kaiosz",
    game: "CS2",
    city: "Ribeirão Branco",
    rating: 5,
    rank: "Global Elite",
    text: "NAT aberto direto, sem precisar mexer em nada. Lobby com a galera funciona de primeira. Suporte responde rápido também.",
    photo: "https://randomuser.me/api/portraits/men/41.jpg",
  },
  {
    nick: "MiraGG",
    game: "Fortnite",
    city: "Nova Campina",
    rating: 5,
    rank: "Champion",
    text: "Upload de 1Giga mudou minhas lives na Twitch. 1080p60 sem cair frame. Galera para na live por causa da qualidade.",
    photo: "https://randomuser.me/api/portraits/women/83.jpg",
  },
  {
    nick: "Renan_PvP",
    game: "Free Fire",
    city: "Barra do Chapéu",
    rating: 5,
    rank: "Heroico",
    text: "Joguei o ano inteiro de 4G antes. Quando coloquei a fibra Jotazo, ping caiu pra 22ms e o headshot virou natural.",
    photo: "https://randomuser.me/api/portraits/men/86.jpg",
  },
  {
    nick: "Bia.RL",
    game: "Rocket League",
    city: "Cerro Azul",
    rating: 5,
    rank: "Grand Champion",
    text: "Conexão estável é tudo no Rocket. Zero variação de ping em partida ranqueada. Recomendei pra todo mundo do time.",
    photo: "https://randomuser.me/api/portraits/women/52.jpg",
  },
  {
    nick: "TioGabs",
    game: "Dota 2",
    city: "Adrianópolis",
    rating: 5,
    rank: "Ancient",
    text: "Moro na zona rural e achei que nunca teria fibra boa. Jotazo chegou aqui e o ping pro servidor de SP é 28ms.",
    photo: "https://randomuser.me/api/portraits/men/64.jpg",
  },
  {
    nick: "Naah_FPS",
    game: "Apex Legends",
    city: "Itaóca",
    rating: 5,
    rank: "Mestre",
    text: "Duo ranked com a galera daqui da cidade, todo mundo com Jotazo, voz cristalina e zero rubberband. Vício total.",
    photo: "https://randomuser.me/api/portraits/women/29.jpg",
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function GamerCard({ t }: { t: GamerTestimonial }) {
  return (
    <Card className="min-w-[300px] max-w-[300px] shrink-0 border-primary/20 bg-gradient-to-br from-background to-primary/5 sm:min-w-[340px] sm:max-w-[340px]">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-center gap-3">
          <img
            src={t.photo}
            alt={t.nick}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/40"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{t.nick}</p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Gamepad2 className="h-3 w-3" />
                {t.game}
              </span>
            </div>
          </div>
        </div>
        {t.rank && (
          <span className="mt-3 inline-flex w-fit items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {t.rank}
          </span>
        )}
        <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{t.text}</p>
        <div className="mt-auto pt-3">
          <StarRow rating={t.rating} />
        </div>
      </CardContent>
    </Card>
  );
}

export function GamerTestimonials() {
  const items = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section aria-labelledby="gamer-testimonials-title" className="space-y-6">
      <header className="space-y-2 text-center">
        <h2 id="gamer-testimonials-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Aprovado por <span className="text-primary">quem joga sério</span>
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Depoimentos reais de jogadores que viraram o jogo com a fibra Jotazo.
        </p>
      </header>

      <div className="group/marquee relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />

        <div className="flex w-max gap-4 py-2 animate-marquee group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none">
          {items.map((t, i) => (
            <GamerCard key={`${t.nick}-${i}`} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
