import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { FaturasView } from "@/components/minhaconta/FaturasView";
import { ContaRbxLinkDialog } from "@/components/conta/ContaRbxLinkDialog";

const TOKEN_KEY = "minhaconta.token";

export default function ContaFaturas() {
  const { profile, loading } = useCustomerAuth();
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState<boolean>(() => !!sessionStorage.getItem(TOKEN_KEY));
  const [linkOpen, setLinkOpen] = useState(false);

  // refresh hasToken when dialog closes
  useEffect(() => {
    if (!linkOpen) setHasToken(!!sessionStorage.getItem(TOKEN_KEY));
  }, [linkOpen]);

  if (loading) return null;
  if (!profile?.rbx_code) return <Navigate to="/conta" replace />;

  return (
    <>
      <Helmet><title>Minhas faturas — Jotazo</title><meta name="robots" content="noindex,nofollow" /></Helmet>

      {hasToken ? (
        <FaturasView onBack={() => navigate("/conta")} />
      ) : (
        <Card className="p-6 space-y-4 border-amber-500/30 bg-amber-50/40">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Reconecte para ver suas faturas</p>
              <p className="text-sm text-muted-foreground">
                Por segurança, pedimos a confirmação dos seus dados a cada sessão antes de exibir suas faturas.
              </p>
            </div>
          </div>
          <Button onClick={() => setLinkOpen(true)} className="w-full">
            <ShieldCheck className="h-4 w-4 mr-1.5" /> Reconectar agora
          </Button>
        </Card>
      )}

      <ContaRbxLinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        prefillDoc={profile?.cpf_cnpj}
      />
    </>
  );
}
