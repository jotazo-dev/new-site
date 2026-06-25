import { Helmet } from "react-helmet-async";
import { Instagram, Facebook, Youtube, Music2, MessageCircle, ImageIcon, Signal } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BioSettings {
  avatar_url: string;
  title: string;
  description: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  footer_text: string;
}

interface BioCard {
  id: string;
  image_url: string;
  link_url: string;
  alt: string;
  active: boolean;
}

// Avatares estáticos da prova social — evita recriar arrays a cada render
const SOCIAL_PROOF_AVATARS = [
  "https://i.pravatar.cc/64?img=47",
  "https://i.pravatar.cc/64?img=12",
  "https://i.pravatar.cc/64?img=45",
  "https://i.pravatar.cc/64?img=32",
] as const;

const STATUS_LABELS = ["Internet Fibra", "Internet 5G", "Streaming TV"] as const;

// Cache longo: dados editoriais raramente mudam
const QUERY_OPTIONS = {
  staleTime: 10 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

export default function BioPage() {
  // Paraleliza as duas queries (antes eram sequenciais por hook order)
  const [settingsQuery, cardsQuery] = useQueries({
    queries: [
      {
        queryKey: ["bio_settings"],
        queryFn: async () => {
          const { data } = await supabase
            .from("bio_settings" as any)
            .select("*")
            .limit(1)
            .maybeSingle();
          return data as unknown as BioSettings | null;
        },
        ...QUERY_OPTIONS,
      },
      {
        queryKey: ["bio_cards"],
        queryFn: async () => {
          const { data } = await supabase
            .from("bio_cards" as any)
            .select("id, image_url, link_url, alt, active")
            .eq("active", true)
            .order("sort_order");
          return (data ?? []) as unknown as BioCard[];
        },
        ...QUERY_OPTIONS,
      },
    ],
  });

  const settings = settingsQuery.data;
  const cards = cardsQuery.data;

  const title = settings?.title || "Jotazo Telecom";
  const description =
    settings?.description ||
    "Internet de fibra, 5G e TV. Conecte-se com a gente pelas nossas redes.";
  const avatar = settings?.avatar_url;
  const footer =
    settings?.footer_text ||
    "Jotazo Telecom Copyright ® 2026 - Todos os Direitos Reservados.";

  const socials = useMemo(
    () =>
      [
        { label: "Instagram", href: settings?.instagram_url, Icon: Instagram },
        { label: "Facebook", href: settings?.facebook_url, Icon: Facebook },
        { label: "YouTube", href: settings?.youtube_url, Icon: Youtube },
        { label: "TikTok", href: settings?.tiktok_url, Icon: Music2 },
        { label: "WhatsApp", href: settings?.whatsapp_url, Icon: MessageCircle },
      ].filter((s) => s.href && s.href.trim() !== ""),
    [
      settings?.instagram_url,
      settings?.facebook_url,
      settings?.youtube_url,
      settings?.tiktok_url,
      settings?.whatsapp_url,
    ],
  );

  return (
    <>
      <Helmet>
        <title>{title} — Links</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content={description} />
        {avatar && <link rel="preload" as="image" href={avatar} />}
      </Helmet>

      <div className="min-h-screen bg-white text-slate-800">
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
          {/* Avatar */}
          {avatar && (
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden />
                <img
                  src={avatar}
                  alt={title}
                  width={128}
                  height={128}
                  fetchPriority="high"
                  decoding="async"
                  className="relative h-32 w-32 rounded-full border-4 border-primary bg-white object-cover shadow-lg"
                />
              </div>
            </div>
          )}

          {/* Title + Description */}
          <h1 className="mt-5 text-center text-2xl font-bold text-primary">{title}</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">{description}</p>

          {/* Social Proof */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {SOCIAL_PROOF_AVATARS.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  decoding="async"
                  className="h-7 w-7 rounded-full border-2 border-white object-cover shadow-sm"
                />
              ))}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-slate-800">+5 mil clientes aprovam</span>
              <div className="flex items-center gap-1">
                <div className="flex text-orange-500" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[11px] font-medium text-slate-600">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Socials */}
          {socials.length > 0 && (
            <div className="mt-6 flex justify-center gap-3">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-white text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-md"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}

          {/* Status de conexão */}
          <p className="mt-6 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
            <Signal className="h-3 w-3 text-orange-500" />
            Status da conexão em tempo real
          </p>
          <div className="mt-2 flex flex-nowrap justify-center gap-4">
            {STATUS_LABELS.map((label) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 whitespace-nowrap"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {label}
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="mt-8 flex flex-col gap-4">
            {cards?.map((card, index) => {
              const hasLink = card.link_url && card.link_url.trim() !== "";
              const Wrapper: any = hasLink ? "a" : "div";
              const wrapperProps = hasLink
                ? { href: card.link_url, target: "_blank", rel: "noopener noreferrer" }
                : {};
              // Primeiros 2 cards são "above the fold" no mobile — carregam eager
              const isEager = index < 2;
              return (
                <Wrapper
                  key={card.id}
                  {...wrapperProps}
                  className="group block overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
                >
                  <div className="relative w-full">
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.alt}
                        loading={isEager ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={isEager ? "high" : "low"}
                        className="block h-auto w-full"
                      />
                    ) : (
                      <div className="flex aspect-video w-full flex-col items-center justify-center text-primary/40">
                        <ImageIcon className="h-10 w-10" />
                        <span className="mt-2 text-xs font-medium uppercase tracking-wide">
                          {card.alt || "Em breve"}
                        </span>
                      </div>
                    )}
                  </div>
                </Wrapper>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-10">
            <p className="text-center text-xs text-slate-500">{footer}</p>
          </div>
        </div>
      </div>
    </>
  );
}
