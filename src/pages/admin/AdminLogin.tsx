import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wifi, Lock, Mail, ArrowRight } from "lucide-react";

export default function AdminLogin() {
  const { signIn, canAccessAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && canAccessAdmin) navigate("/admin", { replace: true });
  }, [loading, canAccessAdmin, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Column — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(220,80%,25%)] to-[hsl(240,60%,15%)]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[hsl(var(--primary)/0.4)] blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-[hsl(220,90%,50%)/0.3] blur-[100px] animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-[hsl(var(--accent)/0.2)] blur-[80px] animate-pulse [animation-delay:2s]" />
        </div>
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-md px-12 text-white space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-black/10">
              <Wifi className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Jotazo</h2>
              <p className="text-sm text-white/60 font-medium">Telecom</p>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Painel de
              <br />
              <span className="bg-gradient-to-r from-white via-blue-200 to-blue-300 bg-clip-text text-transparent">
                Administração
              </span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed">
              Gerencie planos, banners, depoimentos, FAQ e todo o conteúdo do
              site em um só lugar.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {["Planos", "Banners", "FAQ", "Blog", "Depoimentos"].map((t) => (
              <span
                key={t}
                className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column — Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background relative">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(var(--primary)/0.03)] blur-[80px]" />
        </div>

        <div className="relative z-10 w-full max-w-sm px-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10 justify-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Wifi className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Jotazo</span>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-muted-foreground">
              Acesse o painel administrativo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                  placeholder="admin@jotazo.com.br"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all group"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Entrar no Painel
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground/50 mt-10">
            Acesso restrito a administradores
          </p>
        </div>
      </div>
    </div>
  );
}
