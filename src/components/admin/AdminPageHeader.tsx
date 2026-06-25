import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  onNew?: () => void;
  newLabel?: string;
  extraActions?: React.ReactNode;
}

export function AdminPageHeader({ title, subtitle, onNew, newLabel = "Novo", extraActions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,40%)] bg-clip-text text-transparent"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {(onNew || extraActions) && (
        <div className="flex gap-2">
          {extraActions}
          {onNew && (
            <Button
              onClick={onNew}
              className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] hover:from-[hsl(218,90%,32%)] hover:to-[hsl(218,80%,28%)] shadow-lg shadow-primary/25 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> {newLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
