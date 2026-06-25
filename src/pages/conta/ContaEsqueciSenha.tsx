import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { AuthShell } from "@/components/conta/AuthShell";
import bgSenha from "@/assets/bg-senha-jotazo.webp.asset.json";

export default function ContaEsqueciSenha() {
  const { resetPassword } = useCustomerAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message || "Não foi possível enviar o email.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      pageTitle="Esqueci minha senha"
      title="Recuperar senha"
      subtitle="Enviaremos um link por email"
      bgImage={bgSenha.url}
      brandingTitle="Recupere o acesso à sua conta em segundos"
      brandingSubtitle="Enviamos um link seguro para o seu email para você criar uma nova senha com tranquilidade."
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-sm">Se houver uma conta com <strong>{email}</strong>, você receberá um email com instruções para redefinir sua senha.</p>
          <Link to="/conta/login"><Button variant="outline" className="w-full">Voltar ao login</Button></Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={loading}>
            {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            Enviar link de recuperação
          </Button>
          <Link to="/conta/login" className="block text-center text-sm text-muted-foreground hover:text-primary">Voltar ao login</Link>
        </form>
      )}
    </AuthShell>
  );
}
