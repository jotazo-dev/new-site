import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { IdentificacaoStep } from "@/components/minhaconta/IdentificacaoStep";
import { ConfirmacaoStep } from "@/components/minhaconta/ConfirmacaoStep";
import { useMinhaContaAuth, type AuthOption, type AuthCustomer } from "@/hooks/useMinhaContaAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Stage = "doc" | "challenge" | "success";

export function ContaRbxLinkDialog({
  open,
  onOpenChange,
  prefillDoc,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefillDoc?: string;
}) {
  const { lookup, confirm, commit } = useMinhaContaAuth();
  const { user, refresh } = useCustomerAuth();
  const [stage, setStage] = useState<Stage>("doc");
  const [sessionId, setSessionId] = useState("");
  const [options, setOptions] = useState<AuthOption[]>([]);
  const [customer, setCustomer] = useState<AuthCustomer | null>(null);

  const reset = () => {
    setStage("doc");
    setSessionId("");
    setOptions([]);
    setCustomer(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleChallengeSuccess = async (c: AuthCustomer, token: string) => {
    // Save sessionStorage token (used by FaturasView / useMinhaContaInvoices)
    commit(token, c);
    setCustomer(c);

    // Persist rbx_code on customer_profiles
    if (user) {
      const { error } = await supabase
        .from("customer_profiles")
        .update({ rbx_code: c.code, rbx_linked_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) {
        toast.error("Vinculação salva apenas para esta sessão", { description: error.message });
      } else {
        await refresh();
      }
    }
    setStage("success");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Vincular seu cadastro Jotazo
          </DialogTitle>
          <DialogDescription>
            Para ver faturas, 2ª via e status da sua conexão por aqui.
          </DialogDescription>
        </DialogHeader>

        {stage === "doc" && (
          <IdentificacaoStep
            lookup={lookup}
            onSuccess={(sid, opts) => {
              setSessionId(sid);
              setOptions(opts);
              setStage("challenge");
            }}
          />
        )}

        {stage === "challenge" && (
          <ConfirmacaoStep
            sessionId={sessionId}
            options={options}
            confirm={confirm}
            onBack={() => setStage("doc")}
            onSuccess={handleChallengeSuccess}
          />
        )}

        {stage === "success" && (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <p className="font-semibold">Tudo certo, {customer?.name?.split(" ")[0]}!</p>
              <p className="text-sm text-muted-foreground">Seu cadastro Jotazo foi vinculado à sua conta do site.</p>
            </div>
            <Button className="w-full" onClick={() => handleClose(false)}>Continuar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
