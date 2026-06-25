import * as React from "react";
import { Star, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedCity } from "@/hooks/useSelectedCity";

type Testimonial = {
  id: string;
  name: string;
  rating: number;
  text: string;
  date_label: string;
  photo_url: string;
};

// 12 cidades de cobertura - rotacionadas entre depoimentos com contexto local
const COVERAGE_CITIES = [
  "Apiaí",
  "Itapeva",
  "Ribeirão Branco",
  "Nova Campina",
  "Barra do Chapéu",
  "Itaóca",
  "Ribeira",
  "Itapirapuã Paulista",
  "Adrianópolis",
  "Cerro Azul",
  "Tunas do Paraná",
  "Doutor Ulysses",
];

// Heurística: depoimentos que mencionam lugar/casa/região/aqui ganham cidade.
// Genéricos sobre velocidade/preço sem contexto local ficam sem.
function hasLocalContext(text: string): boolean {
  return /\b(aqui|casa|condomínio|região|cidade|bairro|moro|trabalho|busão|rua)\b/i.test(text);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ name, rating, text, date_label, photo_url, city }: Testimonial & { city?: string | null }) {
  return (
    <Card className="min-w-[300px] max-w-[300px] shrink-0 sm:min-w-[340px] sm:max-w-[340px]">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-center gap-3">
          <img
            src={photo_url}
            alt={name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{date_label}</span>
              {city && (
                <>
                  <span aria-hidden>•</span>
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {city}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{text}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <StarRating rating={rating} />
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-xs text-muted-foreground">Google</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TestimonialsSection() {
  const { city } = useSelectedCity();
  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Testimonial[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (testimonials.length === 0) return null;

  // Atribui cidades de cobertura rotacionando entre depoimentos com contexto local.
  // Mantém estável usando o índice dentre os elegíveis (não usa Math.random).
  let localIdx = 0;
  const enriched = testimonials.map((t) => {
    if (!hasLocalContext(t.text)) return { ...t, city: null as string | null };
    const c = COVERAGE_CITIES[localIdx % COVERAGE_CITIES.length];
    localIdx += 1;
    return { ...t, city: c };
  });

  // Duplicate items for seamless infinite loop
  const items = [...enriched, ...enriched];

  return (
    <section aria-labelledby="testimonials-title" className="space-y-6">
      <header className="space-y-2">
        <h2 id="testimonials-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {city ? (<>O que nossos clientes em <span className="text-accent">{city.name}</span> dizem</>) : "O que nossos clientes dizem"}
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Avaliações reais de quem já é Jotazo.
        </p>
      </header>

      <div className="group/marquee relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-24" />

        <div className="flex w-max gap-4 py-2 animate-marquee group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none">
          {items.map((t, i) => (
            <TestimonialCard key={`${t.id}-${i}`} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
