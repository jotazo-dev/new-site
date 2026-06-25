import { MapPin } from "lucide-react";
import { useSelectedCity } from "@/hooks/useSelectedCity";

export function CityWelcomeStrip() {
  const { city, label } = useSelectedCity();
  if (!city) return null;

  return (
    <div className="w-full border-b border-border bg-primary/5">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-xs text-foreground/80 sm:text-sm">
        <MapPin className="h-3.5 w-3.5 text-accent" />
        <span>
          Atendendo <strong className="font-semibold text-foreground">{label}</strong>
        </span>
      </div>
    </div>
  );
}
