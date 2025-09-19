import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'admin' | 'member' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Centralized redirect URL to ensure OAuth always returns to GitHub Pages
  const getAuthRedirectUrl = () => {
    const ghBase = 'https://nickchu668.github.io/clever-cat-ai/';
    if (typeof window === 'undefined') return ghBase;
    const origin = window.location.origin;
    const base = import.meta.env.BASE_URL || '/';
    const current = `${origin}${base}`;

    // If running inside Lovable preview or localhost, force redirect to GitHub Pages
    if (origin.includes('lovable.app') || origin.includes('localhost')) return ghBase;

    // If already on GitHub Pages, keep using the GitHub Pages URL
    if (origin.includes('nickchu668.github.io')) return ghBase;

    // Fallback to current origin+base
    return current;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Remove OAuth hash fragments after redirect (GitHub Pages)
        try {
          if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
            const base = import.meta.env.BASE_URL || '/';
            const cleanPath = base.endsWith('/') ? base : `${base}/`;
            window.history.replaceState(null, '', cleanPath);
          }
        } catch {}
        
        if (session?.user) {
          // Defer role fetching to avoid deadlocks and ensure accurate role
          setTimeout(async () => {
            try {
              const { data: roles, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id);

              if (error) throw error;

              const hasAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === 'admin');
              setUserRole(hasAdmin ? 'admin' : 'member');
            } catch (err) {
              console.error('Error fetching user roles:', err);
              setUserRole('member');
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Also fetch roles on initial load
        setTimeout(async () => {
          try {
            const { data: roles, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user!.id);

            if (error) throw error;

            const hasAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === 'admin');
            setUserRole(hasAdmin ? 'admin' : 'member');
          } catch (err) {
            console.error('Error fetching user roles (init):', err);
            setUserRole('member');
          } finally {
            setLoading(false);
          }
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "登入失敗",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "登入成功",
          description: "歡迎回來！",
        });
      }
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = getAuthRedirectUrl();
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: displayName ? { display_name: displayName } : undefined,
        },
      });
      
      if (error) {
        toast({
          title: "註冊失敗",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "註冊成功",
          description: "請檢查您的電子郵件以確認帳戶。",
        });
      }
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = getAuthRedirectUrl();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      if (error) {
        toast({
          title: "Google 登入失敗",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
      toast({
        title: "已登出",
        description: "您已成功登出。",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};