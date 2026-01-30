import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, signIn as authSignIn, signOut as authSignOut, getProfile, ensureProfile, type AuthProfile } from '@/lib/supabase';

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => ReturnType<typeof authSignIn>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  ensureProfileForCurrentUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 로그인 상태를 앱 전체에서 하나로 공유.
 * - App·MyInfoScreen·LoginScreen 등이 동일한 user/profile을 보도록 함.
 * - 자동 로그인: onAuthStateChange(INITIAL_SESSION)에서만 초기 세션 적용.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string): Promise<AuthProfile | null> => {
    const p = await getProfile(userId);
    setProfile(p);
    return p;
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    let loadingResolved = false;
    const resolveLoading = () => {
      if (!loadingResolved) {
        loadingResolved = true;
        setLoading(false);
      }
    };

    const handleSession = async (s: Session | null) => {
      try {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user?.id) {
          let p = await loadProfile(s.user.id);
          if (!p) {
            const fallback =
              (s.user.user_metadata?.nickname as string | undefined)?.trim() ||
              (s.user.email ?? '').split('@')[0]?.trim() ||
              '게스트';
            await ensureProfile(s.user.id, fallback);
            await loadProfile(s.user.id);
          }
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        resolveLoading();
      }
    };

    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, s) => {
      await handleSession(s ?? null);
    });

    const fallback = setTimeout(resolveLoading, 3000);
    return () => {
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(authSignIn, []);
  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  const ensureProfileForCurrentUser = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    const fallback =
      (user.user_metadata?.nickname as string | undefined)?.trim() ||
      (user.email ?? '').split('@')[0]?.trim() ||
      '게스트';
    const ok = await ensureProfile(user.id, fallback);
    if (ok) await loadProfile(user.id);
    else await loadProfile(user.id);
    return ok;
  }, [user?.id, user?.user_metadata?.nickname, user?.email, loadProfile]);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
    ensureProfileForCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
