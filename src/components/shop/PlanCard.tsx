import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Plan } from "@/data/plans";
import { formatBRL } from "@/data/plans";
import { useCart } from "@/cart/CartContext";
import { PlanIncludeIcon } from "@/components/shop/PlanIncludeIcon";
import { cn } from "@/lib/utils";

export function PlanCard({ plan }: { plan: Plan }) {
  const { add, items } = useCart();
  const SINGLE_CATEGORIES = ["fibra", "movel", "tv"];
  const willReplace =
    SINGLE_CATEGORIES.includes(plan.category) &&
    items.some((i) => i.plan.category === plan.category && i.plan.id !== plan.id);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap gap-2 min-h-[28px]">
          {plan.badges?.map((b) => (
            <Badge key={b} variant={b === "Oferta" ? "secondary" : "default"}>
              {b}
            </Badge>
          ))}
        </div>
        <CardTitle className="mt-2 text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {(plan as any).originalPriceCents > 0 && (plan as any).originalPriceCents !== plan.priceCents && (
          <div className="text-sm line-through text-muted-foreground">{formatBRL((plan as any).originalPriceCents)}</div>
        )}
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-semibold tracking-tight">{formatBRL(plan.priceCents)}</div>
          <div className="text-sm text-muted-foreground">/mês</div>
        </div>

        {plan.category === "movel" && ((plan.portabilityGb ?? 0) > 0 || plan.portabilityLabel) && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(142,70%,40%)]/10 px-2.5 py-1 text-xs font-semibold text-[hsl(142,70%,30%)]">
            🎁 {plan.portabilityLabel || `+${plan.portabilityGb}GB na portabilidade`}
          </div>
        )}
        <ul className="space-y-2 text-sm text-muted-foreground">
          {plan.includes.slice(0, 4).map((it, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <PlanIncludeIcon icon={it.icon} className="mt-0.5 text-accent" />
              <span>{it.text}</span>
            </li>
          ))}
        </ul>
        {plan.conditions && (
          <div className="mt-3 space-y-0.5 text-[11px] leading-tight text-muted-foreground/70">
            {plan.conditions.split(/\r?\n/).filter((l) => l.trim().length > 0).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button className="w-full" onClick={() => {
          add(plan);
          if (plan.category === "movel") {
            window.dispatchEvent(new Event("cart:open"));
          }
        }}>
          {willReplace ? "Trocar plano" : "Adicionar ao carrinho"}
        </Button>
      </CardFooter>

      <div
        className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/8 blur-3xl"
        aria-hidden
      />
    </Card>
  );
}
