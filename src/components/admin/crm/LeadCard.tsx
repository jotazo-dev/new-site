import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Layers, MapPin, MessageCircle, Package, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/data/plans";
import { Badge } from "@/components/ui/badge";
import { initialsOf, nameToHsl } from "@/lib/crmAvatar";
import {
  type CrmContact,
  formatRelative,
  computeAutoTags,
  computeLtvCents,
  LTV_MONTHS,
  AUTO_TAG_META,
} from "./types";

interface LeadCardProps {
  contact: CrmContact;
  onClick: () => void;
  onWhatsApp: (e: React.MouseEvent) => void;
  dragOverlay?: boolean;
}

export function LeadCard({ contact, onClick, onWhatsApp, dragOverlay }: LeadCardProps) {
  const lead = contact.primary;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { stage: lead.stage },
    disabled: dragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !dragOverlay ? 0.3 : 1,
  };

  const itemCount = lead.items.reduce((s, i) => s + (i.qty || 1), 0);
  const isWhats = lead.source === "whatsapp";
  const isRepeat = contact.totalOrders > 1;
  const tags = computeAutoTags(lead, contact.lifetimeTotalCents, contact.totalOrders);
  const avatarColor = nameToHsl(lead.customer_name);
  const initials = initialsOf(lead.customer_name);
  const firstItem = lead.items[0];
  const isStale = tags.includes("stale");
  const isHot = tags.includes("hot");
  const followDue = tags.includes("follow_up_due");

  const phoneDigits = (lead.customer_phone || "").replace(/\D/g, "");

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-kanban-card
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group relative cursor-grab rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing",
        "border-border",
        isRepeat && "ring-1 ring-primary/20",
        isHot && "border-l-4 border-l-orange-500",
        isStale && !isHot && "border-l-4 border-l-amber-500",
        followDue && "border-l-4 border-l-destructive",
      )}
    >
      {isRepeat && (
        <div
          className="absolute -right-2 -top-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-md"
          title={`${contact.totalOrders} pedidos deste contato`}
        >
          <Layers className="h-3 w-3" />
          {contact.totalOrders}x
        </div>
      )}

      <div className="mb-2 flex items-start gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 text-sm font-semibold text-foreground">{lead.customer_name}</h4>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 px-1.5 py-0 text-[9px] font-medium",
                isWhats ? "border-[#25D366]/40 bg-[#25D366]/10 text-[#1DA851]" : "border-primary/30 bg-primary/10 text-primary",
              )}
            >
              {isWhats ? "WhatsApp" : "Site"}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{formatRelative(lead.created_at)}</span>
          </div>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {tags.slice(0, 3).map((t) => {
            const m = AUTO_TAG_META[t];
            return (
              <span
                key={t}
                className={cn("rounded-md border px-1.5 py-0.5 text-[9px] font-semibold", m.className)}
                title={m.label}
              >
                {m.emoji} {m.label}
              </span>
            );
          })}
        </div>
      )}

      {firstItem && (
        <div className="mb-1.5 line-clamp-1 text-[11px] text-muted-foreground">
          📦 {firstItem.plan_name}
          {itemCount > 1 && ` +${itemCount - 1}`}
        </div>
      )}

      {(lead.city || lead.uf) && (
        <div className="mb-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {lead.city}
            {lead.uf && ` - ${lead.uf}`}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
        <div>
          <div className="text-base font-bold text-primary">
            {formatBRL(lead.total_cents)}
            <span className="ml-1 text-[10px] font-medium text-muted-foreground">/mês</span>
          </div>
          {isRepeat && (
            <div
              className="text-[9px] text-muted-foreground"
              title={`LTV estimado: ${LTV_MONTHS} meses × mensalidade do pedido mais recente`}
            >
              LTV {LTV_MONTHS}m {formatBRL(computeLtvCents(lead.total_cents))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {phoneDigits && (
            <a
              href={`tel:+${phoneDigits}`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label="Ligar"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={onWhatsApp}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#25D366] text-white shadow-sm transition-transform hover:scale-110"
            aria-label="Abrir WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1 group-hover:hidden">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{itemCount}</span>
        </div>
      </div>
    </div>
  );
}
