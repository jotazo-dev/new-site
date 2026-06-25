import { Link } from "react-router-dom";
import {
  Receipt,
  Package,
  Wifi,
  Sparkles,
  HeadphonesIcon,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Gauge,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

export default function PainelHome() {
  const { profile, user } = useCustomerAuth();
  const firstName = (profile?.full_name || "").split(" ")[0] || "cliente";
  const linked = !!profile?.rbx_code;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 md:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <p className="text-sm opacity-90">Olá, bem-vindo de volta</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{firstName} 👋</h1>
          <p className="mt-2 text-primary-foreground/85 max-w-xl">
            Acompanhe sua conta, faturas, pedidos e o status da sua conexão Jotazo em um só lugar.
          </p>
          {!linked && (
            <Link to="/conta/painel/perfil">
              <Button variant="secondary" size="sm" className="mt-4 gap-2">
                Vincular meu CPF/CNPJ <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Receipt className="h-5 w-5" />}
          label="Próxima fatura"
          value={linked ? "—" : "Vincule"}
          hint={linked ? "Sem vencimentos" : "Para visualizar"}
          tone="primary"
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Pedidos"
          value="0"
          hint="Nenhum em andamento"
          tone="accent"
        />
        <StatCard
          icon={<Gauge className="h-5 w-5" />}
          label="Velocidade"
          value="—"
          hint="Plano não vinculado"
          tone="primary"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Indique e ganhe"
          value="R$ 50"
          hint="Por amigo ativo"
          tone="accent"
        />
      </div>

      {/* Status card */}
      {linked ? (
        <Card className="p-5 border-green-500/30 bg-green-50/50 dark:bg-green-950/20 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Cadastro Jotazo vinculado</p>
            <p className="text-sm text-muted-foreground">
              Código RBX: <span className="font-mono">{profile?.rbx_code}</span>
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
            Ativo
          </Badge>
        </Card>
      ) : (
        <Card className="p-5 border-primary/30 bg-primary/5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Complete seu acesso</p>
            <p className="text-sm text-muted-foreground">
              Vincule seu CPF/CNPJ para ver faturas, 2ª via e status da sua conexão.
            </p>
          </div>
          <Link to="/conta/painel/perfil">
            <Button size="sm">Vincular</Button>
          </Link>
        </Card>
      )}

      {/* Quick actions */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold">Atalhos</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickCard to="/conta/painel/faturas" icon={Receipt} title="Faturas" desc="2ª via, PIX e linha digitável" />
          <QuickCard to="/conta/painel/pedidos" icon={Package} title="Meus pedidos" desc="Acompanhe pagamento e ativação" />
          <QuickCard to="/conta/painel/conexao" icon={Wifi} title="Conexão" desc="Status do seu link em tempo real" />
          <QuickCard to="/conta/painel/plano" icon={Sparkles} title="Meu plano" desc="Detalhes e upgrade" />
          <QuickCard to="/conta/painel/suporte" icon={HeadphonesIcon} title="Suporte" desc="Fale com nossa equipe" />
          <QuickCard to="/conta/painel/perfil" icon={UserIcon} title="Perfil" desc="Dados pessoais e segurança" />
        </div>
      </section>

      <p className="text-xs text-muted-foreground text-center">
        Logado como <span className="font-medium">{user?.email}</span>
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "accent";
}) {
  const toneCls = tone === "primary" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent";
  return (
    <Card className="p-5 rounded-2xl">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${toneCls}`}>{icon}</div>
      <p className="mt-3 text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1 leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </Card>
  );
}

function QuickCard({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="p-5 rounded-2xl h-full transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>
    </Link>
  );
}
