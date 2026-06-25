import { useState, useMemo } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthCustomer } from "@/hooks/useMinhaContaAuth";
import { HubHome } from "./HubHome";
import { FaturasView } from "./FaturasView";
import { SegundaViaView } from "./SegundaViaView";
import { InstallPWAButton } from "./InstallPWAButton";
import { MobileNav, type NavTab } from "./MobileNav";
import { PerfilView } from "./PerfilView";
import { ConexaoView } from "./ConexaoView";
import logo from "@/assets/minhaconta-logo.png";

type View = "hub" | "faturas" | "segunda-via" | "conexao" | "suporte" | "perfil";

export function MinhaContaShell({ customer, onLogout }: { customer: AuthCustomer; onLogout: () => void }) {
  const [view, setView] = useState<View>("hub");

  const activeNavTab = useMemo((): NavTab => {
    if (view === "hub") return "inicio";
    if (view === "faturas" || view === "segunda-via") return "faturas";
    if (view === "conexao") return "conexao";
    if (view === "suporte") return "suporte";
    if (view === "perfil") return "perfil";
    return "inicio";
  }, [view]);

  const handleNavChange = (tab: NavTab) => {
    if (tab === "inicio") setView("hub");
    else if (tab === "faturas") setView("faturas");
    else if (tab === "conexao") setView("conexao");
    else if (tab === "suporte") setView("suporte");
    else if (tab === "perfil") setView("perfil");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-16 md:pb-0">
      <InstallPWAButton />
      <nav className="sticky top-0 z-50 w-full bg-primary shadow-md">
        <div className="max-w-3xl w-full mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <img src={logo} alt="Jotazo" className="h-10 w-auto shrink-0" />
          <div className="text-right min-w-0">
            <p className="text-sm font-semibold leading-tight text-primary-foreground truncate">{customer.name}</p>
            <p className="text-[11px] font-mono text-primary-foreground/80 truncate">{customer.documentMasked}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl w-full mx-auto pt-4 pb-8 px-5 space-y-6 flex-1">
        {view === "hub" && <HubHome name={customer.name} code={customer.code} onSelect={setView} />}
        {(view === "faturas" || view === "segunda-via") && (
          <div className="space-y-6">
            {view === "faturas" && <FaturasView onBack={() => setView("hub")} />}
            {view === "segunda-via" && <SegundaViaView onBack={() => setView("hub")} />}
          </div>
        )}
        
        {view === "conexao" && <ConexaoView />}

        {view === "suporte" && (
          <div className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-primary">Precisa de ajuda?</h2>
            <p className="text-muted-foreground">Nossa equipe técnica está pronta para te atender.</p>
            <Button 
              className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              onClick={() => window.open("https://wa.me/551535423000", "_blank")}
            >
              Falar no WhatsApp
            </Button>
            <Button onClick={() => setView("hub")} variant="ghost" className="w-full">Voltar</Button>
          </div>
        )}

        {view === "perfil" && (
          <PerfilView customer={customer} onLogout={onLogout} />
        )}
      </div>

      {view !== "perfil" && (
        <footer className="max-w-3xl w-full mx-auto pt-8 pb-5 px-5 hidden md:block">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" /> Finalizar sessão
          </Button>
        </footer>
      )}

      <MobileNav activeTab={activeNavTab} onTabChange={handleNavChange} />
    </div>
  );
}

