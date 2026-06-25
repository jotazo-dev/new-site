import corpBgAsset from "@/assets/bg-jotazo-corp.webp.asset.json";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { AuthShell } from "@/components/conta/AuthShell";
import { maskCpfCnpj, onlyDigits } from "@/lib/docMask";
import { isValidCpfCnpj } from "@/lib/cpfCnpjValidator";
import { supabase } from "@/integrations/supabase/client";

const phoneMask = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d)/, "($1) $2-$3").trim();
  return d.replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3").trim();
};

// Mask DD/MM/AAAA
const birthMask = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

// "DD/MM/AAAA" -> "YYYY-MM-DD" | null
const parseBirthBR = (v: string): string | null => {
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [_, d, mo, y] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  if (
    dt.getFullYear() !== Number(y) ||
    dt.getMonth() !== Number(mo) - 1 ||
    dt.getDate() !== Number(d)
  ) return null;
  return `${y}-${mo}-${d}`;
};

// Mask helpers (visual only)
const maskName = (name: string) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    const p = parts[0];
    return p.length <= 2 ? p : `${p[0]}${"*".repeat(Math.max(3, p.length - 2))}${p.slice(-1)}`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} ***** ${last}`;
};
const maskEmail = (email: string) => {
  const e = String(email || "").trim();
  const at = e.indexOf("@");
  if (at < 1) return e ? "*****" : "";
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  const tld = dot > 0 ? domain.slice(dot) : "";
  const dHost = dot > 0 ? domain.slice(0, dot) : domain;
  return `${local[0]}****@${dHost[0] || "*"}****${tld}`;
};
const maskPhone = (phone: string) => {
  const d = onlyDigits(phone);
  if (d.length < 4) return d ? "*****" : "";
  const ddd = d.length >= 10 ? d.slice(0, 2) : "";
  const last4 = d.slice(-4);
  return ddd ? `(${ddd}) *****-${last4}` : `*****-${last4}`;
};


type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "not_found" }
  | { kind: "partial"; sources: string[] }
  | { kind: "found"; sources: string[] };

type LookupResult = {
  found: boolean;
  existsInRbx: boolean;
  rbxCodigo: string | null;
  sources: string[];
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  address: any;
};

export default function ContaCadastro() {
  const { signUp } = useCustomerAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    cpfCnpj: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
    birthDate: "", // DD/MM/AAAA
    marketingOptIn: true,
    respCpf: "",
    respName: "",
    respBirth: "",
  });
  const isCnpj = onlyDigits(form.cpfCnpj).length === 14;
  const [lookup, setLookup] = useState<LookupState>({ kind: "idle" });
  const [lookupData, setLookupData] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const lastQueryRef = useRef<string>("");

  // Identity verification (only when lookup finds an existing record)
  type VerifyStatus = "idle" | "pending" | "verified" | "locked";
  const [verification, setVerification] = useState<{
    status: VerifyStatus;
    attempts: number;
    birthInput: string;
    feedback: string | null;
  }>({ status: "idle", attempts: 0, birthInput: "", feedback: null });


  // Debounced lookup whenever CPF/CNPJ becomes a valid document
  useEffect(() => {
    const digits = onlyDigits(form.cpfCnpj);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    // any change to the doc resets verification
    setVerification({ status: "idle", attempts: 0, birthInput: "", feedback: null });

    if (!digits) {
      setLookup({ kind: "idle" });
      setLookupData(null);
      lastQueryRef.current = "";
      return;
    }
    if (digits.length !== 11 && digits.length !== 14) {
      setLookup({ kind: "idle" });
      return;
    }
    if (!isValidCpfCnpj(digits)) {
      setLookup({ kind: "invalid" });
      setLookupData(null);
      return;
    }
    if (digits === lastQueryRef.current) return;

    debounceRef.current = window.setTimeout(async () => {
      lastQueryRef.current = digits;
      setLookup({ kind: "loading" });
      try {
        const { data, error: err } = await supabase.functions.invoke("signup-customer-lookup", {
          body: { document: digits },
        });
        if (err) throw err;
        const r = data as LookupResult;
        if (!r?.found) {
          setLookup({ kind: "not_found" });
          setLookupData(null);
          // For CNPJ without local record, try public Brasil API to prefill razão social
          if (digits.length === 14) {
            try {
              const { data: cnpjData } = await supabase.functions.invoke("search-cnpj", {
                body: { cnpj: digits },
              });
              if (cnpjData?.found && cnpjData?.name) {
                setForm((f) => ({
                  ...f,
                  fullName: f.fullName || String(cnpjData.name),
                  email: f.email || (cnpjData.email ? String(cnpjData.email) : ""),
                  phone: f.phone || (cnpjData.phone ? phoneMask(String(cnpjData.phone)) : ""),
                  respCpf: f.respCpf || (cnpjData.representative?.document
                    ? maskCpfCnpj(String(cnpjData.representative.document))
                    : ""),
                  respName: f.respName || (cnpjData.representative?.name
                    ? String(cnpjData.representative.name)
                    : ""),
                }));
              }
            } catch (e) {
              console.warn("[search-cnpj] failed:", (e as Error).message);
            }
          }
          return;
        }
        setLookupData(r);
        // Do NOT autofill name/email/phone — require birth-date verification first
        const sources = r.sources || [];
        const hasNameAndContact = !!r.name && (!!r.email || !!r.phone);
        setLookup(hasNameAndContact || r.existsInRbx
          ? { kind: "found", sources }
          : { kind: "partial", sources });
        setVerification({ status: "pending", attempts: 0, birthInput: "", feedback: null });
      } catch (e) {
        console.warn("[signup-lookup] failed:", (e as Error).message);
        setLookup({ kind: "not_found" });
      }
    }, 600);

    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [form.cpfCnpj]);

  const handleVerify = () => {
    const iso = parseBirthBR(verification.birthInput);
    if (!iso) {
      setVerification((v) => ({ ...v, feedback: "Informe uma data válida (DD/MM/AAAA)." }));
      return;
    }
    const expected = lookupData?.birthDate || "";
    // If we don't have a birthDate from the lookup, accept any valid date (>= 18 years).
    if (!expected) {
      const age = (Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 3600 * 1000);
      if (age < 18) {
        setVerification((v) => ({ ...v, feedback: "Você precisa ter 18+ para criar conta." }));
        return;
      }
      // Accept and unlock
      setForm((f) => ({
        ...f,
        fullName: f.fullName || lookupData?.name || "",
        email: f.email || lookupData?.email || "",
        phone: f.phone || (lookupData?.phone ? phoneMask(lookupData.phone) : ""),
        birthDate: verification.birthInput,
      }));
      setVerification({ status: "verified", attempts: 0, birthInput: verification.birthInput, feedback: null });
      return;
    }
    if (iso === expected) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || lookupData?.name || "",
        email: f.email || lookupData?.email || "",
        phone: f.phone || (lookupData?.phone ? phoneMask(lookupData.phone) : ""),
        birthDate: verification.birthInput,
      }));
      setVerification({ status: "verified", attempts: 0, birthInput: verification.birthInput, feedback: null });
    } else {
      const next = verification.attempts + 1;
      if (next >= 3) {
        setVerification({ status: "locked", attempts: next, birthInput: "", feedback: "Muitas tentativas. Tente novamente em alguns minutos." });
        setTimeout(() => {
          setVerification((v) => v.status === "locked"
            ? { status: "pending", attempts: 0, birthInput: "", feedback: null }
            : v);
        }, 60_000);
      } else {
        setVerification((v) => ({
          ...v,
          attempts: next,
          feedback: `Data não confere. Tentativa ${next} de 3.`,
        }));
      }
    }
  };

  const validate = () => {
    if (!isValidCpfCnpj(form.cpfCnpj)) return "CPF/CNPJ inválido.";
    if (lookup.kind === "found" || lookup.kind === "partial") {
      if (verification.status !== "verified") {
        return "Confirme sua data de nascimento para continuar.";
      }
    }
    if (form.fullName.trim().split(/\s+/).length < 2) {
      return isCnpj ? "Informe a razão social." : "Informe seu nome completo.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Email inválido.";
    if (form.password.length < 8) return "A senha deve ter ao menos 8 caracteres.";
    if (form.birthDate && !parseBirthBR(form.birthDate)) return "Data de nascimento inválida.";
    if (isCnpj) {
      if (!isValidCpfCnpj(form.respCpf) || onlyDigits(form.respCpf).length !== 11) {
        return "CPF do responsável inválido.";
      }
      if (form.respName.trim().split(/\s+/).length < 2) return "Informe o nome completo do responsável.";
      if (!parseBirthBR(form.respBirth)) return "Data de nascimento do responsável inválida.";
    }
    return null;
  };


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        cpfCnpj: onlyDigits(form.cpfCnpj),
        phone: form.phone ? onlyDigits(form.phone) : undefined,
        birthDate:
          (isCnpj ? parseBirthBR(form.respBirth) : parseBirthBR(form.birthDate)) ||
          lookupData?.birthDate || undefined,
        address: lookupData?.address || null,
        existingRbxCode: lookupData?.rbxCodigo || null,
        marketingOptIn: form.marketingOptIn,
        responsavel: isCnpj
          ? {
              cpf: onlyDigits(form.respCpf),
              name: form.respName.trim(),
              birthDate: parseBirthBR(form.respBirth) || undefined,
            }
          : undefined,
      });
      if (needsConfirmation) {
        toast({
          title: "Confirme seu email",
          description: "Enviamos um link de confirmação para " + form.email,
        });
        navigate("/conta/login", { replace: true });
      } else {
        toast({
          title: lookupData?.existsInRbx ? "Bem-vindo de volta!" : "Conta criada!",
          description: lookupData?.existsInRbx
            ? "Sua conta foi vinculada ao seu cadastro Jotazo."
            : "Sua conta foi criada com sucesso.",
        });
        navigate("/conta", { replace: true });
      }
    } catch (err: any) {
      const msg = err?.message?.includes("already registered") || err?.message?.includes("User already")
        ? "Este email já está cadastrado. Tente entrar."
        : err?.message?.includes("duplicate key") || err?.message?.includes("customer_profiles_cpf_cnpj_key")
        ? "Este CPF/CNPJ já tem uma conta. Tente recuperar sua senha."
        : err?.message?.includes("Password")
        ? "Senha muito fraca. Tente uma combinação mais forte."
        : err?.message || "Não foi possível criar a conta.";
      toast({ title: "Falha no cadastro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const lookupBadge = () => {
    switch (lookup.kind) {
      case "loading":
        return (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Consultando bases…</span>
          </div>
        );
      case "found":
        return (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-emerald-900 dark:text-emerald-100">
                {lookupData?.existsInRbx ? "Cliente Jotazo encontrado!" : "Cadastro encontrado!"}
              </p>
              <p className="text-emerald-700 dark:text-emerald-300">
                Confirme os dados abaixo e crie sua senha.
              </p>
            </div>
          </div>
        );
      case "partial":
        return (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3">
            <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-amber-900 dark:text-amber-100">Dados parciais encontrados</p>
              <p className="text-amber-700 dark:text-amber-300">Complete o que faltar abaixo.</p>
            </div>
          </div>
        );
      case "not_found":
        return (
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border p-3">
            <Sparkles className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium">Novo cadastro</p>
              <p className="text-muted-foreground">Preencha seus dados para continuar.</p>
            </div>
          </div>
        );
      case "invalid":
        return (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>CPF/CNPJ inválido</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AuthShell
      pageTitle="Criar conta"
      title="Criar minha conta Jotazo"
      subtitle="Leva menos de 1 minuto"
      bgImage="/__l5e/assets-v1/a286a64b-eb98-4f55-99c1-6f324fdabb62/bg-cadastro-jotazo.webp"
      bgImageSecondary={corpBgAsset.url}
      activeSecondary={isCnpj}
      brandingTitle={isCnpj ? "Internet corporativa estável, rápida e segura." : undefined}
      brandingSubtitle={isCnpj ? "Conectividade de alta performance com proteção avançada para impulsionar o seu negócio." : undefined}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF ou CNPJ *</Label>
          <Input
            id="cpf"
            inputMode="numeric"
            autoFocus
            required
            maxLength={18}
            value={form.cpfCnpj}
            onChange={(e) => setForm((f) => ({ ...f, cpfCnpj: maskCpfCnpj(e.target.value) }))}
            placeholder="000.000.000-00"
          />
          {lookupBadge()}
        </div>

        {/* Identity verification card — shown when an existing record was found */}
        {lookupData && (verification.status === "pending" || verification.status === "locked") && (
          <div className="space-y-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Encontramos um cadastro. Confirme sua identidade.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Por segurança, mostramos os dados parcialmente ocultos. Informe sua data de nascimento para liberar.
                </p>
              </div>
            </div>

            <ul className="space-y-1 text-xs font-mono bg-background/60 rounded-md border border-amber-200/60 dark:border-amber-900/60 p-3">
              {lookupData.name && (
                <li><span className="text-muted-foreground">Nome: </span><span className="font-semibold">{maskName(lookupData.name)}</span></li>
              )}
              {lookupData.email && (
                <li><span className="text-muted-foreground">Email: </span><span className="font-semibold">{maskEmail(lookupData.email)}</span></li>
              )}
              {lookupData.phone && (
                <li><span className="text-muted-foreground">Telefone: </span><span className="font-semibold">{maskPhone(lookupData.phone)}</span></li>
              )}
            </ul>

            <div className="space-y-1.5">
              <Label htmlFor="verifyBirth" className="text-xs">Data de nascimento *</Label>
              <div className="flex gap-2">
                <Input
                  id="verifyBirth"
                  inputMode="numeric"
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  value={verification.birthInput}
                  disabled={verification.status === "locked"}
                  onChange={(e) =>
                    setVerification((v) => ({ ...v, birthInput: birthMask(e.target.value), feedback: null }))
                  }
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={handleVerify}
                  disabled={verification.status === "locked" || verification.birthInput.length < 10}
                >
                  Validar
                </Button>
              </div>
              {verification.feedback && (
                <p className={`text-xs ${verification.status === "locked" ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}>
                  {verification.feedback}
                </p>
              )}
            </div>
          </div>
        )}

        {verification.status === "verified" && (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
              Identidade confirmada. Confira os dados abaixo e crie sua senha.
            </p>
          </div>
        )}

        {/* Remaining fields — locked while verification is pending */}
        {(() => {
          const gated = lookupData && verification.status !== "verified";
          return (
            <fieldset disabled={!!gated} className={gated ? "opacity-50 pointer-events-none space-y-4" : "space-y-4"}>
              <div className="space-y-2">
                <Label htmlFor="fullName">{isCnpj ? "Razão social *" : "Nome completo *"}</Label>
                <Input
                  id="fullName"
                  autoComplete={isCnpj ? "organization" : "name"}
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder={isCnpj ? "Razão social da empresa" : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: phoneMask(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              {!isCnpj && (
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de nascimento {lookupData ? "*" : "(opcional)"}</Label>
                  <Input
                    id="birthDate"
                    inputMode="numeric"
                    maxLength={10}
                    required={!!lookupData}
                    placeholder="DD/MM/AAAA"
                    value={form.birthDate}
                    onChange={(e) => setForm((f) => ({ ...f, birthDate: birthMask(e.target.value) }))}
                  />
                </div>
              )}

              {isCnpj && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Responsável pela empresa</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="respCpf">CPF do responsável *</Label>
                    <Input
                      id="respCpf"
                      inputMode="numeric"
                      maxLength={14}
                      required
                      placeholder="000.000.000-00"
                      value={form.respCpf}
                      onChange={(e) => setForm((f) => ({ ...f, respCpf: maskCpfCnpj(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="respName">Nome do responsável *</Label>
                    <Input
                      id="respName"
                      autoComplete="name"
                      required
                      value={form.respName}
                      onChange={(e) => setForm((f) => ({ ...f, respName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="respBirth">Data de nascimento *</Label>
                    <Input
                      id="respBirth"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      placeholder="DD/MM/AAAA"
                      value={form.respBirth}
                      onChange={(e) => setForm((f) => ({ ...f, respBirth: birthMask(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">Mínimo 8 caracteres.</p>
              </div>

              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={form.marketingOptIn} onCheckedChange={(c) => setForm((f) => ({ ...f, marketingOptIn: !!c }))} />
                <span className="text-muted-foreground">Quero receber ofertas e novidades da Jotazo.</span>
              </label>
            </fieldset>
          );
        })()}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          type="submit"
          className="w-full h-14 text-lg font-semibold"
          disabled={loading || lookup.kind === "loading" || (!!lookupData && verification.status !== "verified")}
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
          {lookupData?.existsInRbx ? "Criar minha conta de acesso" : "Criar conta"}
        </Button>
      </form>


      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/conta/login" className="text-primary font-medium hover:underline">Entrar</Link>
      </p>
    </AuthShell>
  );
}
