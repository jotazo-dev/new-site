import { ArrowLeft, CheckCircle2, Globe, MessageCircle, MapPin, Phone, User as UserIcon, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderSummaryPanel, type SummaryItem } from "@/components/combo/OrderSummaryPanel";
import type { CustomerDetails } from "@/components/combo/CustomerDetailsStep";
import { cn } from "@/lib/utils";

interface CompletionStepProps {
  details: CustomerDetails;
  items: SummaryItem[];
  comboDiscountCents: number;
  onBack: () => void;
  onFinishWebsite: () => void;
  onFinishWhatsApp: () => void;
  className?: string;
  mobileChipType?: "5g" | "black";
  mobileSimFormat?: "fisico" | "esim";
}

export function CompletionStep({
  details,
  items,
  comboDiscountCents,
  onBack,
  onFinishWebsite,
  onFinishWhatsApp,
  className,
  mobileChipType,
  mobileSimFormat,
}: CompletionStepProps) {
  const fullName = `${details.firstName} ${details.lastName}`.trim();
  const address = [
    details.street,
    details.number && `nº ${details.number}`,
    details.complement,
    details.neighborhood,
    details.city && `${details.city} - ${details.uf}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos dados
        </Button>
      </div>

      {/* Sucesso */}
      <section className="rounded-2xl border border-success/30 bg-success/10 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold text-foreground">Tudo pronto, {details.firstName}! 🎉</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Confira o resumo abaixo e escolha como prefere finalizar seu pedido.
            </p>
          </div>
        </div>
      </section>

      {/* Resumo do pedido (mobile mostra também aqui) */}
      <div className="lg:hidden">
        <OrderSummaryPanel
          items={items}
          comboDiscountCents={comboDiscountCents}
          onRemove={() => {}}
          onClear={() => {}}
          onCheckout={() => {}}
          mobileChipType={mobileChipType}
          mobileSimFormat={mobileSimFormat}
        />
      </div>

      {/* Dados do cliente */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
          <UserIcon className="h-5 w-5 text-primary" />
          Seus dados
        </h3>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Nome</dt>
            <dd className="font-medium text-foreground">{fullName}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
              <Mail className="h-3 w-3" /> E-mail
            </dt>
            <dd className="font-medium text-foreground">{details.email}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
              <Phone className="h-3 w-3" /> Telefone
            </dt>
            <dd className="font-medium text-foreground">{details.phone || "—"}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3 w-3" /> Endereço de instalação
            </dt>
            <dd className="font-medium text-foreground">
              {address || "—"} <span className="text-muted-foreground">· CEP {details.cep}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Como deseja finalizar */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-1 font-bold text-foreground">Como deseja finalizar?</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Escolha a forma mais conveniente para concluir sua contratação.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onFinishWebsite}
            className="group flex flex-col items-start gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-left transition-all hover:border-primary hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Globe className="h-6 w-6" />
            </span>
            <div>
              <div className="font-bold text-foreground">Finalizar no site</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirme seu pedido e nossa equipe entrará em contato para agendar a instalação.
              </p>
            </div>
            <span className="mt-1 text-sm font-semibold text-primary group-hover:underline">
              Confirmar pedido →
            </span>
          </button>

          <button
            type="button"
            onClick={onFinishWhatsApp}
            className="group flex flex-col items-start gap-3 rounded-xl border-2 border-[#25D366]/30 bg-[#25D366]/5 p-5 text-left transition-all hover:border-[#25D366] hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366] text-white">
              <MessageCircle className="h-6 w-6" />
            </span>
            <div>
              <div className="font-bold text-foreground">Finalizar pelo WhatsApp</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Envie seu pedido direto para um atendente e finalize em uma conversa rápida.
              </p>
            </div>
            <span className="mt-1 text-sm font-semibold text-[#1DA851] group-hover:underline">
              Abrir WhatsApp →
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
