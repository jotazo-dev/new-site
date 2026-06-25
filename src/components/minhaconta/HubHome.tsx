import { FileDown, Receipt, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function HubHome({ name, code, onSelect }: { name: string; code: string; onSelect: (v: "faturas" | "segunda-via") => void }) {
  const first = (name || "").split(" ")[0] || "cliente";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight truncate">Olá, {first} 👋</h2>
          <p className="text-muted-foreground">Como podemos te ajudar hoje?</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground leading-none">Código</p>
          <p className="text-lg font-mono font-semibold text-primary leading-tight">{code}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <HubCard
          icon={<Receipt className="h-6 w-6 text-primary" />}
          title="Faturas"
          desc="Veja seu histórico: pagas, atual e próximas."
          onClick={() => onSelect("faturas")}
        />
        <HubCard
          icon={<FileDown className="h-6 w-6 text-primary" />}
          title="2ª Via"
          desc="Baixe a fatura mais recente e as vencidas."
          onClick={() => onSelect("segunda-via")}
        />
      </div>
    </div>
  );
}

function HubCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <Card className="p-6 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">{icon}</div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </Card>
    </button>
  );
}
