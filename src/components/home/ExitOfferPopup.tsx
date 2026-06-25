import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, MessageCircle, Gift, Clock } from "lucide-react";
import { AnimatedHeroBg } from "@/components/common/AnimatedHeroBg";
import { WHATSAPP } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getActiveCouponFor, type CouponDef } from "@/lib/coupons";

const STORAGE_KEY = "exit-offer-seen";
const POPUP_ID = "exit-offer-r30";
const FALLBACK_COUPON: CouponDef = { code: "PRIMEIRA30", discountCents: 3000, label: "R$30 OFF na 1ª mensalidade" };
const TIMER_MS = 60_000;

function track(event: "view" | "click") {
  try {
    let sid = sessionStorage.getItem("popup_session_id");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("popup_session_id", sid);
    }
    supabase
      .from("popup_stats" as any)
      .insert({ popup_id: POPUP_ID, event_type: event, page_path: "/", session_id: sid } as any)
      .then();
  } catch {}
}

function buildWaUrl(coupon: CouponDef): string {
  const number = WHATSAPP.number.replace(/\D/g, "");
  const text = encodeURIComponent(
    `🎁 *Olá! Vi a oferta ${coupon.label}* (cupom *${coupon.code}*) e quero contratar a Jotazo.`
  );
  return `https://api.whatsapp.com/send?phone=${number}&text=${text}`;
}

export function ExitOfferPopup() {
  const [open, setOpen] = React.useState(false);
  const [coupon, setCoupon] = React.useState<CouponDef>(FALLBACK_COUPON);
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    getActiveCouponFor("exit_popup").then((c) => { if (c) setCoupon(c); }).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const fire = () => {
      if (firedRef.current) return;
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      firedRef.current = true;
      sessionStorage.setItem(STORAGE_KEY, "1");
      setOpen(true);
      track("view");
    };

    const timer = window.setTimeout(fire, TIMER_MS);

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) fire();
    };
    document.documentElement.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.clearTimeout(timer);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast.success("Cupom copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleWa = () => {
    track("click");
    window.open(buildWaUrl(coupon), "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleSeePlans = () => {
    setOpen(false);
    setTimeout(() => {
      const el = document.getElementById("planos");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 border-0 rounded-[20px]">
        {/* Header com gradiente + animação */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-[hsl(218,80%,28%)] text-white overflow-hidden px-6 pt-7 pb-7">
          <AnimatedHeroBg />
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            {/* Badge urgência */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/30">
              <Clock className="h-3 w-3" />
              Oferta válida só hoje
            </div>

            {/* Ícone presente */}
            <div className="mt-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 shadow-xl">
              <Gift className="h-7 w-7 text-accent drop-shadow-[0_2px_8px_hsl(var(--accent)/0.6)]" />
            </div>

            {/* Kicker */}
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Espera! Antes de sair…
            </p>

            {/* Headline R$30 OFF */}
            <DialogTitle asChild>
              <h2
                className="mt-1 flex items-baseline gap-1 text-6xl font-bold tracking-tight text-accent drop-shadow-[0_2px_16px_hsl(var(--accent)/0.55)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span className="text-3xl font-semibold">R$</span>
                30
                <span className="ml-1 text-2xl font-bold tracking-wider">OFF</span>
              </h2>
            </DialogTitle>

            {/* Linha decorativa */}
            <div className="mt-2 h-px w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <DialogDescription className="mt-2 text-sm font-medium text-white/95">
              Na sua <span className="font-bold text-white">1ª mensalidade</span> Jotazo Fibra
            </DialogDescription>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-5 bg-card">
          {/* Cupom ticket */}
          <button
            type="button"
            onClick={handleCopy}
            className="group w-full flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 hover:border-primary hover:bg-primary/10 transition"
          >
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cupom</p>
              <p
                className="text-xl font-bold text-primary tracking-wider"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {coupon.code}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary group-hover:underline">
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </span>
          </button>

          {/* Bullets */}
          <ul className="space-y-2">
            {["Instalação rápida", "Wi-Fi 6 incluso", "Sem fidelidade"].map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366]/15">
                  <Check className="h-3 w-3 text-[#25D366]" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={handleWa}
              className="w-full h-11 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Quero meu desconto no WhatsApp
            </Button>
            <Button variant="ghost" onClick={handleSeePlans} className="w-full h-9 text-sm text-muted-foreground">
              Ver planos primeiro
            </Button>
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            Válido para novas contratações via WhatsApp. Sujeito à cobertura.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
