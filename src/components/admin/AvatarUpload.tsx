import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X, User as UserIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  /** Auth user id (used as the storage folder prefix; required by RLS). */
  userId: string;
  /** Current avatar URL (or null). */
  value: string | null;
  /** Called with the new signed URL after a successful upload, or null when removed. */
  onChange: (url: string | null) => void;
  /** Fallback initials when no picture is set. */
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

export function AvatarUpload({ userId, value, onChange, fallback, size = "lg" }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const sizeCls = size === "sm" ? "h-12 w-12" : size === "md" ? "h-16 w-16" : "h-24 w-24";

  async function handlePick(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: signed, error: signErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (signErr) throw signErr;

      onChange(signed.signedUrl);
      toast({ title: "Foto atualizada" });
    } catch (e: any) {
      toast({ title: "Falha no upload", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className={sizeCls}>
        {value ? <AvatarImage src={value} alt="Foto" /> : null}
        <AvatarFallback className="bg-muted text-muted-foreground">
          {fallback ? fallback.toUpperCase() : <UserIcon className="h-6 w-6" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
            {value ? "Trocar foto" : "Enviar foto"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onChange(null)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Remover
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">PNG/JPG até 5MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePick(f);
        }}
      />
    </div>
  );
}
