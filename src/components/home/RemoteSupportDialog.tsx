import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoteSupportDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader className="sm:text-center">
          <DialogTitle className="text-xl font-bold text-foreground">
            Suporte remoto
          </DialogTitle>
          <DialogDescription>
            Faça o download do nosso aplicativo de acesso remoto para realizarmos o seu atendimento.
          </DialogDescription>
        </DialogHeader>

        {/* Download icon illustration */}
        <div className="relative mx-auto my-6 flex h-40 w-40 items-center justify-center">
          {/* Gear decorations */}
          <svg className="absolute inset-0 h-full w-full text-muted-foreground/15" viewBox="0 0 160 160" fill="currentColor">
            <circle cx="130" cy="30" r="18" />
            <circle cx="140" cy="60" r="10" />
            <circle cx="25" cy="110" r="14" />
            <circle cx="35" cy="135" r="8" />
            <circle cx="110" cy="130" r="12" />
          </svg>
          {/* Download arrow */}
          <Download className="h-20 w-20 text-accent" strokeWidth={2.5} />
        </div>

        <Button
          size="lg"
          className="w-full max-w-xs mx-auto text-base"
          asChild
        >
          <a
            href="https://download.anydesk.com/AnyDesk.exe"
            target="_blank"
            rel="noopener noreferrer"
          >
            Baixar
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
