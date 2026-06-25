import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { AuthShell } from "@/components/conta/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { maskCpfCnpj } from "@/lib/docMask";

export default function ContaLogin() {
  const { signIn } = useCustomerAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [mode, setMode] = useState<"email" | "doc">("email");
  const [email, setEmail] = useState("");
  const [doc, setDoc] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginError = (err: any) => {
    const msg = err?.message?.includes("Invalid login")
      ? "Email/documento ou senha incorretos."
      : err?.message?.includes("Email not confirmed")
      ? "Confirme seu email antes de entrar. Verifique sua caixa de entrada."
      : err?.message || "Não foi possível entrar.";
    toast({ title: "Falha no login", description: msg, variant: "destructive" });
  };

  const finishLogin = () => {
    const redirect = params.get("redirect") || "/conta/painel";
    navigate(decodeURIComponent(redirect), { replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let loginEmail = email.trim();

      if (mode === "doc") {
        const digits = doc.replace(/\D+/g, "");
        if (digits.length !== 11 && digits.length !== 14) {
          toast({ title: "Documento inválido", description: "Informe um CPF (11) ou CNPJ (14) válido.", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke("resolve-login-email", {
          body: { document: digits },
        });
        if (error || !data?.found || !data?.email) {
          toast({
            title: "Documento não encontrado",
            description: "Não localizamos uma conta com esse CPF/CNPJ. Verifique ou crie sua conta.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        loginEmail = data.email;
      }

      await signIn(loginEmail, password);
      finishLogin();
    } catch (err: any) {
      handleLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      pageTitle="Entrar"
      title="Entrar na minha conta"
      subtitle="Acompanhe pedidos, faturas e mais"
      bgImage="/__l5e/assets-v1/c39c4bc2-b191-42a2-8dcc-975dfe2198bf/bg-cadastro.webp"
    >
      <Tabs value={mode} onValueChange={(v) => setMode(v as "email" | "doc")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="doc">CPF / CNPJ</TabsTrigger>
        </TabsList>

        <form onSubmit={submit} className="space-y-4 mt-4">
          <TabsContent value="email" className="mt-0 space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required={mode === "email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="doc" className="mt-0 space-y-2">
            <Label htmlFor="doc">CPF ou CNPJ</Label>
            <Input
              id="doc"
              inputMode="numeric"
              autoComplete="username"
              placeholder="000.000.000-00"
              required={mode === "doc"}
              value={doc}
              onChange={(e) => setDoc(maskCpfCnpj(e.target.value))}
              maxLength={18}
            />
          </TabsContent>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link to="/conta/esqueci-senha" className="text-xs text-primary hover:underline">Esqueci minha senha</Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full h-14 text-lg font-semibold" disabled={loading}>
            {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            Entrar
          </Button>
        </form>
      </Tabs>

      <div className="space-y-3 text-center text-sm">
        <p className="text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/conta/cadastro" className="text-primary font-medium hover:underline">Criar conta</Link>
        </p>
        <div className="pt-3 border-t border-border">
          <Link to="/conta/cadastro" className="text-xs text-muted-foreground hover:text-primary">
            Sou cliente Jotazo e ainda não tenho conta no site →
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
