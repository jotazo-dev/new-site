import { CheckCircle2, XCircle, User, FileText, Mail, Phone, BadgeCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthCustomer } from "@/hooks/useMinhaContaAuth";

interface Props {
  customer: AuthCustomer;
  onConfirm: () => void;
  onReject: () => void;
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

export function RevisaoStep({ customer, onConfirm, onReject }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-medium">Confirme se estes dados são seus</p>
        <p className="text-xs text-muted-foreground">
          Verifique com atenção. Se algo estiver errado, clique em "Não, não sou eu".
        </p>
      </div>

      <div className="rounded-lg border bg-card divide-y">
        <div className="p-3">
          <Row icon={User} label="Nome" value={customer.name} />
          <Row icon={FileText} label="Documento" value={customer.documentMasked} />
          <Row icon={Mail} label="E-mail" value={customer.email} />
          <Row icon={Phone} label="Telefone" value={customer.phone} />
          <Row icon={BadgeCheck} label="Situação" value={customer.situacao} />
        </div>
        <div className="p-3">
          <Row icon={MapPin} label="Endereço" value={customer.endereco} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" className="w-full" onClick={onConfirm}>
          <CheckCircle2 className="h-4 w-4 mr-2" /> Sim, sou eu
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onReject}>
          <XCircle className="h-4 w-4 mr-2" /> Não, não sou eu
        </Button>
      </div>
    </div>
  );
}
