import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, FileText, User as UserIcon, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { ContaRbxLinkDialog } from "@/components/conta/ContaRbxLinkDialog";

export default function ContaHome() {
  const { profile } = useCustomerAuth();
  const firstName = (profile?.full_name || "").split(" ")[0] || "";
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <>
      <Helmet><title>Minha conta — Jotazo</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Olá, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">Tudo da sua Jotazo num só lugar.</p>
        </header>

        {!profile?.rbx_code ? (
          <Card className="p-5 border-primary/30 bg-primary/5 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Vincule seu CPF ao seu cadastro Jotazo</p>
              <p className="text-sm text-muted-foreground">Para ver faturas, 2ª via e status da sua conexão aqui dentro.</p>
            </div>
            <Button size="sm" onClick={() => setLinkOpen(true)}>Vincular</Button>
          </Card>
        ) : (
          <Card className="p-5 border-green-500/30 bg-green-50/40 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Cadastro Jotazo vinculado</p>
              <p className="text-sm text-muted-foreground">Acesse suas faturas e 2ª via direto por aqui.</p>
            </div>
            <Link to="/conta/faturas"><Button size="sm" variant="outline">Ver faturas</Button></Link>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/conta/pedidos">
            <Card className="p-5 hover:border-primary transition-colors cursor-pointer">
              <Package className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">Meus pedidos</p>
              <p className="text-sm text-muted-foreground">Acompanhe pagamentos e ativação.</p>
            </Card>
          </Link>
          {profile?.rbx_code && (
            <Link to="/conta/faturas">
              <Card className="p-5 hover:border-primary transition-colors cursor-pointer">
                <FileText className="h-6 w-6 text-primary mb-2" />
                <p className="font-medium">Minhas faturas</p>
                <p className="text-sm text-muted-foreground">2ª via, PIX, linha digitável.</p>
              </Card>
            </Link>
          )}
          <Link to="/conta/perfil">
            <Card className="p-5 hover:border-primary transition-colors cursor-pointer">
              <UserIcon className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium">Meu perfil</p>
              <p className="text-sm text-muted-foreground">Dados pessoais e segurança.</p>
            </Card>
          </Link>
        </div>
      </div>

      <ContaRbxLinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        prefillDoc={profile?.cpf_cnpj}
      />
    </>
  );
}
