import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { verifyAgendaPassword } from "@/hooks/useRbxAgendaPublic";
import logo from "@/assets/logo-agenda-login.png";

export function AgendaPasswordGate({ onUnlock }: { onUnlock: (pass: string) => void }) {
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pass.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const ok = await verifyAgendaPassword(pass.trim());
      if (!ok) {
        setErr("Senha incorreta");
        setLoading(false);
        return;
      }
      onUnlock(pass.trim());
    } catch {
      setErr("Não foi possível validar a senha. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Jotazo" className="h-16 w-auto" />
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold">Agenda Operacional</h1>
            <p className="text-sm text-muted-foreground">Acesso restrito ao time interno</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="agenda-pass" className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" /> Senha de acesso
            </label>
            <Input
              id="agenda-pass"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Digite a senha"
              maxLength={120}
            />
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
}
