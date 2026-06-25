import * as React from "react";
import { Smartphone } from "lucide-react";

export function Chip5GCelebrationToast({
  title,
  description,
  onClose,
}: {
  title: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto relative w-[min(92vw,420px)] overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-br from-primary via-primary to-accent p-5 text-primary-foreground shadow-2xl shadow-accent/30 animate-scale-in"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/40 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" aria-hidden />

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClose();
        }}
        aria-label="Fechar"
        className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white/90 transition hover:bg-white/25 cursor-pointer"
      >
        <span className="text-xs">✕</span>
      </button>

      <div className="relative flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-white shadow-inner ring-2 ring-white/30 animate-bounce">
          <Smartphone className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1 pr-6">
          <div className="text-lg font-extrabold leading-tight">{title}</div>
          {description && (
            <p className="mt-1.5 text-sm leading-snug text-white/90">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
