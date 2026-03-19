import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  avatar_url: string | null;
  company_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Tentar buscar por user_id primeiro, depois por id (schema legado usa id = auth.uid)
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        const fallback = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        data = fallback.data;
        error = fallback.error;
      }

      if (error || !data) {
        console.warn("[Auth] Profile não encontrado para user:", userId);
        setProfile(null);
        return;
      }

      // Normalizar campos (schema legado usa full_name em vez de nome)
      if (!data.nome && data.full_name) {
        data.nome = data.full_name;
      }
      if (!data.user_id) {
        data.user_id = userId;
      }

      // Auto-provision: se profile existe mas não tem company_id, tentar criar via RPC
      if (!data.company_id) {
        try {
          const { data: newCompanyId } = await supabase.rpc("auto_provision_company");
          if (newCompanyId) {
            data.company_id = newCompanyId;
          }
        } catch (rpcError) {
          console.warn("[Auth] auto_provision_company RPC indisponível:", rpcError);
        }
      }

      setProfile(data);
    } catch (err) {
      console.error("[Auth] Erro ao buscar profile:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;
  return {
    user: null,
    session: null,
    profile: null,
    loading: true,
    signIn: async () => { throw new Error('AuthProvider not found'); },
    signUp: async () => { throw new Error('AuthProvider not found'); },
    signOut: async () => { throw new Error('AuthProvider not found'); },
  } satisfies AuthContextType;
}
