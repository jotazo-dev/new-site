import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AvatarUpload } from "@/components/admin/AvatarUpload";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

export default function AdminPerfil() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my_profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data || { first_name: "", last_name: "", avatar_url: null }) as {
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
      };
    },
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await (supabase as any)
        .from("profiles")
        .upsert({
          user_id: user.id,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          avatar_url: avatarUrl,
        }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_profile"] });
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      toast({ title: "Perfil atualizado com sucesso" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao salvar perfil", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <AdminPageHeader title="Meu Perfil" subtitle="Atualize suas informações pessoais e foto" />
      <Card className="p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Foto de perfil</Label>
              <AvatarUpload
                userId={user?.id || ""}
                value={avatarUrl}
                onChange={setAvatarUrl}
                fallback={firstName?.[0] || user?.email?.[0] || "?"}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-first">Primeiro nome</Label>
                <Input id="p-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-last">Sobrenome</Label>
                <Input id="p-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={user?.email || ""} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por aqui.</p>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
