import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function PainelPlaceholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{desc}</p>
      </header>
      <Card className="p-10 rounded-2xl text-center space-y-3">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Construction className="h-7 w-7" />
        </div>
        <p className="font-semibold">Em breve</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Esta seção do painel está sendo construída. Em breve você terá tudo aqui.
        </p>
      </Card>
    </div>
  );
}

export const ConexaoPlaceholder = () => (
  <PainelPlaceholder title="Conexão" desc="Status do seu link, velocidade contratada e roteador." />
);
export const PlanoPlaceholder = () => (
  <PainelPlaceholder title="Meu plano" desc="Detalhes do seu plano atual e opções de upgrade." />
);
export const SuportePlaceholder = () => (
  <PainelPlaceholder title="Suporte" desc="Abra chamados e fale com nossa equipe técnica." />
);
