import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { maskCpfCnpjDisplay } from "@/lib/cpfCnpjValidator";
import { onlyDigits } from "@/lib/docMask";

const phoneMask = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d)/, "($1) $2-$3").trim();
  return d.replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3").trim();
};

export default function PainelPerfil() {
  const { user, profile, refresh, signOut } = useCustomerAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone ? phoneMask(profile.phone) : "");
      setOptIn(profile.marketing_opt_in);
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("customer_profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone ? onlyDigits(phone) : null,
        marketing_opt_in: optIn,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
    toast({ title: "Perfil atualizado" });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  if (!profile) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <>
      <Helmet><title>Meu perfil — Painel Jotazo</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 grid place-items-center text-primary">
            <UserIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Meu perfil</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </header>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CPF/CNPJ</Label>
            <Input value={maskCpfCnpjDisplay(profile.cpf_cnpj)} disabled />
            <p className="text-[11px] text-muted-foreground">Para alterar o CPF/CNPJ, fale com nosso atendimento.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(phoneMask(e.target.value))} placeholder="(00) 00000-0000" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={optIn} onCheckedChange={(c) => setOptIn(!!c)} />
            <span className="text-muted-foreground">Quero receber ofertas e novidades da Jotazo por email.</span>
          </label>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar alterações
          </Button>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">Segurança</h2>
          <Button variant="outline" onClick={() => navigate("/conta/esqueci-senha")}>
            Alterar senha
          </Button>
        </Card>

        <Card className="p-6 space-y-3 border-destructive/30">
          <h2 className="font-semibold text-destructive">Sair</h2>
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sair da conta
          </Button>
        </Card>
      </div>
    </>
  );
}
