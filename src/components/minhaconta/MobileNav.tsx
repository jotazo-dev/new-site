import { Home, FileText, Wifi, Headset, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab = "inicio" | "faturas" | "conexao" | "suporte" | "perfil";

interface MobileNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const items = [
    { id: "inicio" as const, label: "Início", icon: Home },
    { id: "faturas" as const, label: "Fatura", icon: FileText },
    { id: "conexao" as const, label: "Conexão", icon: Wifi },
    { id: "suporte" as const, label: "Suporte", icon: Headset },
    { id: "perfil" as const, label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "animate-in zoom-in-75 duration-300")} />
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
