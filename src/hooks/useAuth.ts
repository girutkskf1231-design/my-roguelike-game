import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, signIn as authSignIn, signOut as authSignOut, getProfile, ensureProfile, type AuthProfile } from '@/lib/supabase';

/** 로그인 상태: 세션·프로필·자동 로그인(세션 유지) */
export function useAuth() {
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
    const init = async () => {
      const { data } = await client.auth.getSession();
      const s = data?.session ?? null;
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
          p = await loadProfile(s.user.id);
        }
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, s) => {
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
    });
    return () => subscription.unsubscribe();
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

  return { user, session, profile, loading, signIn, signOut, refreshProfile };
}
