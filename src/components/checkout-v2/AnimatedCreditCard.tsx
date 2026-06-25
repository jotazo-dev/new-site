import { Wifi } from "lucide-react";

interface Props {
  number?: string;
  holder?: string;
  expiration?: string;
  cvv?: string;
  brand?: string;
  flipped?: boolean;
}

const BRAND_GRADIENTS: Record<string, string> = {
  Visa: "from-blue-700 via-blue-800 to-indigo-950",
  Master: "from-orange-500 via-red-600 to-red-900",
  Amex: "from-emerald-600 via-teal-700 to-teal-950",
  Elo: "from-slate-700 via-yellow-700 to-slate-950",
  Hipercard: "from-red-600 via-red-800 to-slate-950",
  Hiper: "from-fuchsia-700 via-purple-800 to-slate-950",
};

function formatCardNumber(raw: string): string {
  const d = (raw || "").replace(/\D/g, "").slice(0, 16);
  const groups = [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12), d.slice(12, 16)];
  return groups
    .map((g, i) => (g.length ? g.padEnd(4, "•") : "••••"))
    .join("  ");
}

export function AnimatedCreditCard({
  number = "",
  holder = "",
  expiration = "",
  cvv = "",
  brand = "",
  flipped = false,
}: Props) {
  const gradient = BRAND_GRADIENTS[brand] || "from-slate-800 via-slate-900 to-slate-950";
  const last4 = number.replace(/\D/g, "").slice(-4);

  return (
    <div
      className="mx-auto w-full max-w-[380px] [perspective:1200px]"
      aria-label={last4 ? `Cartão terminado em ${last4}` : "Cartão de crédito"}
    >
      <div
        className={`relative h-[220px] w-full transition-transform duration-700 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* FRENTE */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-2xl [backface-visibility:hidden] overflow-hidden`}
        >
          {/* brilho holográfico */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-2">
              {/* Chip */}
              <div className="h-9 w-12 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner ring-1 ring-yellow-700/40">
                <div className="m-1 h-7 w-10 rounded-sm border border-yellow-700/30 bg-gradient-to-br from-yellow-300/60 to-yellow-500/60" />
              </div>
              <Wifi className="h-5 w-5 rotate-90 text-white/80" />
            </div>
            <div
              key={brand}
              className="rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm animate-fade-in"
            >
              {brand || "Cartão"}
            </div>
          </div>

          <div className="relative mt-7 font-mono text-[1.35rem] tracking-[0.18em] tabular-nums drop-shadow-sm">
            {formatCardNumber(number)}
          </div>

          <div className="relative mt-6 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[9px] uppercase tracking-wider text-white/60">Titular</div>
              <div className="truncate text-[13px] font-semibold uppercase tracking-wide">
                {holder || "NOME COMPLETO"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-white/60">Validade</div>
              <div className="font-mono text-[13px] font-semibold tabular-nums">
                {expiration || "MM/AAAA"}
              </div>
            </div>
          </div>
        </div>

        {/* VERSO */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden`}
        >
          <div className="mt-6 h-12 w-full bg-black/85" />
          <div className="px-5 pt-5">
            <div className="flex h-10 items-center justify-end rounded-md bg-white/95 px-3 text-slate-900">
              <span className="font-mono text-sm tabular-nums tracking-widest">
                {cvv || "•••"}
              </span>
            </div>
            <div className="mt-2 text-right text-[10px] uppercase tracking-wider text-white/70">
              CVV
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
