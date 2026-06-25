import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  canAccessAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthCtx | undefined>(undefined);

async function checkRoles(uid: string): Promise<{ isAdmin: boolean; canAccessAdmin: boolean }> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, role_slug")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) {
      console.error("checkRoles error:", error.message);
      return { isAdmin: false, canAccessAdmin: false };
    }
    if (!data) return { isAdmin: false, canAccessAdmin: false };
    const slug = (data as any).role_slug || (data as any).role;
    const isAdmin = (data as any).role === "admin";
    // Any user with a user_roles entry (admin, moderator, or custom role) can access the panel
    return { isAdmin, canAccessAdmin: !!slug };
  } catch (e) {
    console.error("checkRoles exception:", e);
    return { isAdmin: false, canAccessAdmin: false };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [canAccessAdmin, setCanAccessAdmin] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelled) return;
      setSession(s);
      if (s?.user) {
        const r = await checkRoles(s.user.id);
        if (!cancelled) { setIsAdmin(r.isAdmin); setCanAccessAdmin(r.canAccessAdmin); }
      }
      if (!cancelled) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        if (cancelled) return;
        setSession(sess);
        if (!sess?.user) {
          setIsAdmin(false);
          setCanAccessAdmin(false);
          setLoading(false);
          return;
        }
        setTimeout(async () => {
          if (cancelled) return;
          const r = await checkRoles(sess.user.id);
          if (!cancelled) {
            setIsAdmin(r.isAdmin);
            setCanAccessAdmin(r.canAccessAdmin);
            setLoading(false);
          }
        }, 0);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setCanAccessAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, isAdmin, canAccessAdmin, signIn, signOut }}>

      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
