import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SvaRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Shared confirmation dialog for removing the "Serviço Roaming" SVA
 * (combo-bound). Used in both the side cart drawer and the order summary
 * on /personalize-seu-combo, so the rule is enforced in one place.
 */
export function SvaRemoveDialog({ open, onOpenChange, onConfirm }: SvaRemoveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <AlertDialogTitle className="text-lg">Tem certeza que deseja remover?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                Ao remover a <strong className="text-foreground">Serviço de Roaming</strong>, você
                perderá o{" "}
                <strong className="text-destructive">valor especial do combo</strong> no seu plano
                de fibra.
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                ⚠️ O preço da sua internet voltará ao{" "}
                <strong>valor original sem desconto</strong>.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          <AlertDialogCancel className="h-11 w-full border-primary bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:text-primary-foreground">
            ✅ Manter no combo e economizar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="h-9 w-full border-none bg-transparent text-xs font-normal text-muted-foreground underline-offset-2 shadow-none hover:bg-transparent hover:text-destructive hover:underline"
          >
            Remover mesmo assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
