import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo-agenda-login.png";
import { useMinhaContaAuth, type AuthOption, type AuthCustomer } from "@/hooks/useMinhaContaAuth";
import { IdentificacaoStep } from "@/components/minhaconta/IdentificacaoStep";
import { ConfirmacaoStep } from "@/components/minhaconta/ConfirmacaoStep";
import { RevisaoStep } from "@/components/minhaconta/RevisaoStep";
import { MinhaContaShell } from "@/components/minhaconta/MinhaContaShell";
import { registerMinhaContaSW } from "@/minhaconta/registerSW";
import { UpdatePrompt } from "@/components/minhaconta/UpdatePrompt";

type Step =
  | { name: "ident" }
  | { name: "confirm"; sessionId: string; options: AuthOption[]; doc: string }
  | { name: "review"; customer: AuthCustomer; accessToken: string };

export default function MinhaContaPage() {
  const { customer, bootLoading, lookup, confirm, commit, logout } = useMinhaContaAuth();
  const [step, setStep] = useState<Step>({ name: "ident" });

  useEffect(() => {
    registerMinhaContaSW();
  }, []);

  if (bootLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (customer) {
    return (
      <>
        <Helmet>
          <title>Minha Conta — Jotazo</title>
          <meta name="robots" content="noindex,nofollow" />
          <link rel="manifest" href="/minhaconta.webmanifest" />
          <meta name="theme-color" content="#00358f" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Jotazo" />
          <link rel="apple-touch-icon" href="/minhaconta-apple-touch-180.png" />
        </Helmet>
        <UpdatePrompt />
        <MinhaContaShell customer={customer} onLogout={() => { logout(); setStep({ name: "ident" }); }} />
      </>
    );
  }

  const subtitle =
    step.name === "ident" ? "Acesse com seu CPF ou CNPJ"
    : step.name === "confirm" ? "Confirmação de identidade"
    : "Revise seus dados";

  return (
    <>
      <Helmet>
        <title>Minha Conta — Jotazo</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="manifest" href="/minhaconta.webmanifest" />
        <meta name="theme-color" content="#00358f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Jotazo" />
        <link rel="apple-touch-icon" href="/minhaconta-apple-touch-180.png" />
      </Helmet>
      <UpdatePrompt />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-md p-8 mt-4 space-y-6 shadow-xl">
          <div className="flex flex-col items-center gap-3">
            <img src={logo} alt="Jotazo" className="h-16 w-auto" />
            <div className="text-center space-y-1">
              <h1 className="text-xl font-semibold">Minha Conta</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {step.name === "ident" && (
            <IdentificacaoStep
              lookup={lookup}
              onSuccess={(sessionId, options, doc) => setStep({ name: "confirm", sessionId, options, doc })}
            />
          )}

          {step.name === "confirm" && (
            <ConfirmacaoStep
              sessionId={step.sessionId}
              options={step.options}
              confirm={confirm}
              onSuccess={(c, accessToken) => setStep({ name: "review", customer: c, accessToken })}
              onBack={() => setStep({ name: "ident" })}
            />
          )}

          {step.name === "review" && (
            <RevisaoStep
              customer={step.customer}
              onConfirm={() => commit(step.accessToken, step.customer)}
              onReject={() => { logout(); setStep({ name: "ident" }); }}
            />
          )}
        </Card>
      </div>
    </>
  );
}
