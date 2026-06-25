import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type CustomerProfile = {
  id: string;
  user_id: string;
  full_name: string;
  cpf_cnpj: string;
  phone: string | null;
  birthdate: string | null;
  rbx_code: string | null;
  rbx_linked_at: string | null;
  marketing_opt_in: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

type Ctx = {
  user: User | null;
  session: Session | null;
  profile: CustomerProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    cpfCnpj: string;
    phone?: string;
    birthDate?: string;
    address?: {
      zipCode?: string; street?: string; number?: string;
      complement?: string; neighborhood?: string; city?: string; state?: string;
    } | null;
    existingRbxCode?: string | null;
    marketingOptIn?: boolean;
    responsavel?: { cpf: string; name: string; birthDate?: string };
  }) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const CustomerAuthContext = React.createContext<Ctx | undefined>(undefined);

async function loadProfile(uid: string): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) {
    console.error("[customerAuth] loadProfile error:", error.message);
    return null;
  }
  return (data as CustomerProfile) ?? null;
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<CustomerProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const hydrate = React.useCallback(async (s: Session | null) => {
    if (!s?.user) {
      setProfile(null);
      return;
    }
    const p = await loadProfile(s.user.id);
    setProfile(p);
    // best-effort last_login_at; ignore errors
    if (p) {
      supabase
        .from("customer_profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("user_id", s.user.id)
        .then(() => {});
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (cancelled) return;
      setSession(sess);
      // defer to avoid deadlock
      setTimeout(() => { if (!cancelled) hydrate(sess); }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelled) return;
      setSession(s);
      await hydrate(s);
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [hydrate]);

  const refresh = React.useCallback(async () => {
    if (!session?.user) return;
    const p = await loadProfile(session.user.id);
    setProfile(p);
  }, [session]);

  const signUp: Ctx["signUp"] = async ({
    email, password, fullName, cpfCnpj, phone, birthDate, address,
    existingRbxCode, marketingOptIn, responsavel,
  }) => {
    const redirectUrl = `${window.location.origin}/conta`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          cpf_cnpj: cpfCnpj,
          phone: phone ?? null,
          marketing_opt_in: !!marketingOptIn,
          responsavel: responsavel ?? null,
        },
      },
    });
    if (error) throw error;

    // Se já temos sessão (sem confirmação de email), tentamos vincular/criar no RBX.
    if (data.session) {
      try {
        if (existingRbxCode) {
          await supabase.from("customer_profiles").update({
            rbx_code: existingRbxCode,
            rbx_linked_at: new Date().toISOString(),
            ...(birthDate ? { birthdate: birthDate } : {}),
          }).eq("user_id", data.session.user.id);
        } else {
          supabase.functions.invoke("signup-rbx-create", {
            body: {
              name: fullName, document: cpfCnpj, email,
              phone: phone || null, birthDate: birthDate || null,
              address: address || null,
            },
          }).then(({ error: e }) => { if (e) console.warn("[signup-rbx-create]", e.message); });
          if (birthDate) {
            await supabase.from("customer_profiles").update({ birthdate: birthDate })
              .eq("user_id", data.session.user.id);
          }
        }
      } catch (e) {
        console.warn("[signUp] post-signup link failed:", (e as Error).message);
      }
    }

    return { needsConfirmation: !data.session };
  };

  const signIn: Ctx["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    try { sessionStorage.removeItem("minhaconta.token"); } catch {}
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/conta/reset-password`,
    });
    if (error) throw error;
  };

  const value: Ctx = {
    user: session?.user ?? null,
    session,
    profile,
    loading,
    refresh,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = React.useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
