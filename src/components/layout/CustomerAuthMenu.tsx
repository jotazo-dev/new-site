import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Package, FileText, UserCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { cn } from "@/lib/utils";

export function CustomerAuthMenu({ isWhite }: { isWhite: boolean }) {
  const { user, profile, loading, signOut } = useCustomerAuth();
  const navigate = useNavigate();

  if (loading) {
    return <Loader2 className={cn("h-4 w-4 animate-spin", isWhite ? "text-foreground/60" : "text-primary-foreground/70")} />;
  }

  if (!user) {
    return (
      <Link to="/conta/login">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full gap-1.5",
            isWhite ? "text-foreground hover:bg-primary/10 hover:text-primary" : "text-primary-foreground hover:bg-background/10",
          )}
        >
          <User className="h-4 w-4" />
          <span className="hidden md:inline">Entrar</span>
        </Button>
      </Link>
    );
  }

  const displayName = (profile?.full_name || "").trim();
  const label = displayName ? displayName.split(" ")[0] : (user.email || "");
  const initial = (displayName[0] || user.email?.[0] || "?").toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full gap-2 px-2",
            isWhite ? "text-foreground hover:bg-primary/10" : "text-primary-foreground hover:bg-background/10",
          )}
        >
          <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">{initial}</span>
          <span className="hidden md:inline text-sm font-medium max-w-[140px] truncate">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium truncate">{displayName || user.email}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/conta")}>
          <UserCircle className="h-4 w-4 mr-2" /> Minha conta
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/conta/pedidos")}>
          <Package className="h-4 w-4 mr-2" /> Meus pedidos
        </DropdownMenuItem>
        {profile?.rbx_code && (
          <DropdownMenuItem onClick={() => navigate("/conta/faturas")}>
            <FileText className="h-4 w-4 mr-2" /> Minhas faturas
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
