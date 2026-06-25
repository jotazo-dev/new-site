import * as React from "react";
import { Link } from "react-router-dom";
import { Play, Tv, Film, Star, Trophy, Baby, Music, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedHeroBg } from "@/components/common/AnimatedHeroBg";
import filmesEstreiaImg from "@/assets/streaming/cinema-em-casa.jpg";
import futebolAoVivoImg from "@/assets/streaming/esportes-ao-vivo.jpg";
import seriesExclusivasImg from "@/assets/streaming/maratona-series.jpg";
import kidsFamilyImg from "@/assets/tv-blocks/jotazo-telecom-tv-kids-family.jpg";

const categories = [
  { icon: Film, label: "Filmes" },
  { icon: Clapperboard, label: "Séries" },
  { icon: Trophy, label: "Esportes" },
  { icon: Baby, label: "Infantil" },
  { icon: Music, label: "Música" },
  { icon: Star, label: "Variedades" },
];

import bandLogo from "@/assets/channels/jotazo-telecom-band-new.png";
import sbtLogo from "@/assets/channels/jotazo-telecom-sbt-new.png";
import recordLogo from "@/assets/channels/jotazo-telecom-record-new.png";
import redetvLogo from "@/assets/channels/jotazo-telecom-redetv.png";
import culturaLogo from "@/assets/channels/jotazo-telecom-cultura.png";
import redeVidaLogo from "@/assets/channels/jotazo-telecom-redevida-new.png";
import halloLogo from "@/assets/channels/jotazo-telecom-hallo.png";
import cnnBrasilLogo from "@/assets/channels/jotazo-telecom-cnn-brasil-new.png";
import recordNewsLogo from "@/assets/channels/jotazo-telecom-record-news.png";
import discoveryLogo from "@/assets/channels/jotazo-telecom-discovery-new.webp";
import espnLogo from "@/assets/channels/jotazo-telecom-espn-new.webp";
import tntLogo from "@/assets/channels/jotazo-telecom-tnt-new.webp";

// Canais disponíveis no streaming Olé TV (lineup oficial) — total 12
const channels: { name: string; logo: string }[] = [
  // Abertos
  { name: "Band", logo: bandLogo },
  { name: "SBT", logo: sbtLogo },
  { name: "Record", logo: recordLogo },
  { name: "RedeTV!", logo: redetvLogo },
  { name: "TV Cultura", logo: culturaLogo },
  { name: "Rede Vida", logo: redeVidaLogo },
  { name: "Hallo", logo: halloLogo },
  // News
  { name: "CNN Brasil", logo: cnnBrasilLogo },
  { name: "Record News", logo: recordNewsLogo },
  // Fechados
  { name: "Discovery Channel", logo: discoveryLogo },
  { name: "ESPN", logo: espnLogo },
  { name: "TNT", logo: tntLogo },
];

const featured = [
  { title: "Filmes em estreia", subtitle: "Lançamentos toda semana", gradient: "from-purple-900/80 to-indigo-900/80", image: filmesEstreiaImg },
  { title: "Futebol ao vivo", subtitle: "Brasileirão e Champions", gradient: "from-green-900/80 to-emerald-900/80", image: futebolAoVivoImg },
  { title: "Séries exclusivas", subtitle: "Maratonas sem parar", gradient: "from-red-900/80 to-rose-900/80", image: seriesExclusivasImg },
  { title: "Kids & Family", subtitle: "Diversão pra toda família", gradient: "from-sky-900/80 to-cyan-900/80", image: kidsFamilyImg },
];

export function TVStreamingSection() {
  return (
    <section className="space-y-6">
      {/* Hero banner – estilo streaming */}
      <div className="relative overflow-hidden rounded-[20px] bg-primary text-primary-foreground">
        <AnimatedHeroBg />

        <div className="relative grid gap-8 p-8 md:grid-cols-2 md:p-12 lg:p-14">
          <div className="flex flex-col justify-center space-y-5">
            <div className="flex items-center gap-2">
              <Tv className="h-5 w-5 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Jotazo TV
              </span>
            </div>

            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
              Sua TV por assinatura com{" "}
              <span className="text-accent">+de 100 canais</span>
            </h2>

            <p className="max-w-md text-sm text-primary-foreground/80 md:text-base">
              Filmes, séries, esportes ao vivo, infantil e muito mais. Tudo em HD,
              com guia de programação e acesso multi-tela.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/planos?cat=tv">
                  <Play className="mr-2 h-4 w-4" />
                  Ver planos TV
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground font-semibold hover:bg-primary-foreground/20"
              >
                <Link to="/planos?cat=combo">Combos Fibra + TV</Link>
              </Button>
            </div>
          </div>

          {/* Featured cards grid */}
          <div className="grid grid-cols-2 gap-3">
            {featured.map((f) => (
              <div
                key={f.title}
                className="group relative flex flex-col justify-end overflow-hidden rounded-xl p-4 min-h-[120px] md:min-h-[140px] border border-background/10 transition-transform hover:scale-[1.03]"
              >
                <img
                  src={f.image}
                  alt={f.title}
                  width={768}
                  height={512}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.gradient}`} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative">
                  <h3 className="text-sm font-semibold md:text-base text-white">{f.title}</h3>
                  <p className="text-xs text-white/80">{f.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-secondary"
          >
            <c.icon className="h-4 w-4 text-accent" />
            {c.label}
          </div>
        ))}
      </div>

      {/* Channel grid */}
      <div className="rounded-[20px] border bg-card p-6 md:p-8">
        <h3 className="mb-5 text-center text-lg font-semibold tracking-tight">
          Principais canais inclusos
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {channels.map((ch) => (
            <div
              key={ch.name}
              className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border bg-secondary/50 p-3 transition-shadow hover:shadow-md"
            >
              <div className="flex h-14 w-full items-center justify-center">
                <img
                  src={ch.logo}
                  alt={ch.name}
                  width={200}
                  height={112}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="max-h-14 max-w-[80%] object-contain"
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{ch.name}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          E mais de 100 outros canais · Programação sujeita a alterações
        </p>
      </div>
    </section>
  );
}
