import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MapPin } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoresMapDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="p-6 pb-3">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Nossas lojas
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              Lojas, quiosques e escritórios
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src="https://www.google.com/maps/d/embed?mid=139LCRqbj5gGyAB_y9cGyQnPQ2LRLft0&ehbc=2E312F"
              className="h-[400px] w-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de lojas Jotazo Telecom"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
