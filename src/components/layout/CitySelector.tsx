import * as React from "react";
import { MapPin, LocateFixed, ChevronDown, Check, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "jotazo:selected-city";
const AUTO_DETECT_KEY = "jotazo:city-autodetect-tried";

type City = { id: string; name: string; state: string };

function normalize(s: string) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function readSavedCity(): City | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as City;
  } catch {
    return null;
  }
}

interface CitySelectorProps {
  variant?: "header" | "menu";
  isWhite?: boolean;
}

export function CitySelector({ variant = "header", isWhite = false }: CitySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [cities, setCities] = React.useState<City[]>([]);
  const [selected, setSelected] = React.useState<City | null>(() => readSavedCity());
  const [query, setQuery] = React.useState("");
  const [detecting, setDetecting] = React.useState(false);

  // Load cities
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("coverage_cities")
        .select("id,name,state")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (!mounted) return;
      if (!error && data) setCities(data as City[]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const saveCity = React.useCallback((city: City | null) => {
    setSelected(city);
    try {
      if (city) localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("city:changed", { detail: city }));
  }, []);

  const detect = React.useCallback(
    async (silent = false) => {
      if (cities.length === 0) {
        if (!silent) toast.error("Lista de cidades ainda carregando, tente novamente.");
        return;
      }
      setDetecting(true);
      try {
        const { data, error } = await supabase.functions.invoke("ipinfo");
        if (error) throw error;
        const detectedCity = (data as any)?.city as string | undefined;
        if (!detectedCity) {
          if (!silent) toast.error("Não foi possível detectar sua cidade.");
          return;
        }
        const target = normalize(detectedCity);
        const match = cities.find((c) => normalize(c.name) === target);
        if (match) {
          saveCity(match);
          if (!silent) toast.success(`Cidade definida: ${match.name}`);
          setOpen(false);
        } else {
          if (!silent) {
            toast(`Ainda não temos cobertura em ${detectedCity}`, {
              description:
                "Mas você pode usar nosso Chip 5G — funciona em qualquer lugar do Brasil, com internet rápida e WhatsApp Ilimitado",
              icon: <MapPin className="h-4 w-4 text-accent" />,
              duration: 9000,
            });
          }
        }
      } catch {
        if (!silent) toast.error("Erro ao detectar localização.");
      } finally {
        setDetecting(false);
      }
    },
    [cities, saveCity],
  );

  // Silent auto-detect on first visit
  React.useEffect(() => {
    if (cities.length === 0) return;
    if (selected) return;
    try {
      if (sessionStorage.getItem(AUTO_DETECT_KEY)) return;
      sessionStorage.setItem(AUTO_DETECT_KEY, "1");
    } catch {
      return;
    }
    detect(true);
  }, [cities, selected, detect]);

  // Allow other components (e.g. CityWelcomeStrip) to open this popover
  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("city:open", onOpen);
    return () => window.removeEventListener("city:open", onOpen);
  }, []);

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return cities;
    return cities.filter((c) => normalize(c.name).includes(q));
  }, [cities, query]);

  const triggerLabel = selected ? selected.name : "Selecione sua cidade";

  const triggerClasses =
    variant === "header"
      ? cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap max-w-[180px]",
          isWhite
            ? "text-foreground/80 hover:bg-primary/5 hover:text-primary"
            : "text-primary-foreground/90 hover:bg-white/10",
        )
      : "w-full inline-flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5 transition-colors";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerClasses} aria-label="Selecionar cidade">
          <MapPin className={cn("h-4 w-4 shrink-0", selected && "text-accent")} />
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 overflow-hidden">
        <div className="p-3 border-b border-border/60 space-y-2">
          <Button
            type="button"
            onClick={() => detect(false)}
            disabled={detecting}
            className="w-full justify-start gap-2 h-9"
            variant="secondary"
          >
            {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            {detecting ? "Detectando..." : "Usar minha localização"}
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cidade..."
              className="h-9 pl-8 text-sm"
            />
          </div>
        </div>
        <div
          className="city-scroll h-64 overflow-y-scroll overscroll-contain"
          onWheelCapture={(event) => event.stopPropagation()}
          onTouchMoveCapture={(event) => event.stopPropagation()}
        >
          <ul className="py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhuma cidade encontrada</li>
            ) : (
              filtered.map((city) => {
                const isActive = selected?.id === city.id;
                return (
                  <li key={city.id}>
                    <button
                      type="button"
                      onClick={() => {
                        saveCity(city);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-primary/5 transition-colors",
                        isActive && "bg-primary/10 text-primary font-medium",
                      )}
                    >
                      <span className="truncate">
                        {city.name}
                        <span className="ml-1.5 text-xs text-muted-foreground">{city.state}</span>
                      </span>
                      {isActive ? <Check className="h-4 w-4 text-primary shrink-0" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        {selected ? (
          <div className="border-t border-border/60 p-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full h-9 text-sm text-muted-foreground hover:bg-destructive hover:text-white"
              onClick={() => {
                saveCity(null);
                setOpen(false);
              }}
            >
              Limpar localização
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
