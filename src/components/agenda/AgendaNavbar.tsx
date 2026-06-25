import { Link } from "react-router-dom";
import logo from "@/assets/logo-agenda.png";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AgendaNavbar({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/agenda" className="flex items-center gap-3">
          <img src={logo} alt="Jotazo" className="h-8 w-auto" />
          <span className="font-semibold tracking-tight hidden sm:inline">Agenda Operacional</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground gap-1.5"
        >
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </header>
  );
}
