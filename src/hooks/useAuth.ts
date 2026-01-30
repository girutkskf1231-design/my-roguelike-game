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

    let loadingResolved = false;
    const resolveLoading = () => {
      if (!loadingResolved) {
        loadingResolved = true;
        setLoading(false);
      }
    };

    const handleSession = async (s: Session | null) => {
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
      resolveLoading();
    };

    // 자동 로그인: 초기 세션은 onAuthStateChange(INITIAL_SESSION)에서만 적용.
    // getSession()은 스토리지 복원 전에 호출되면 null을 반환해 "내 정보" 등에서 잘못된 비로그인 상태가 될 수 있음.
    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, s) => {
      await handleSession(s ?? null);
    });

    // 리스너가 오래 걸리거나 오류 시에도 loading 해제 (최대 3초)
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

  /** 로그인됐는데 프로필이 없을 때(ensure 실패 등) 한 번 더 프로필 행 생성 후 로드. 내 정보 화면에서 호출 */
  const ensureProfileForCurrentUser = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    const fallback =
      (user.user_metadata?.nickname as string | undefined)?.trim() ||
      (user.email ?? '').split('@')[0]?.trim() ||
      '게스트';
    const ok = await ensureProfile(user.id, fallback);
    if (ok) await loadProfile(user.id);
    else await loadProfile(user.id); // 이미 행이 있으면 ensure 실패해도 재조회
    return ok;
  }, [user?.id, user?.user_metadata?.nickname, user?.email, loadProfile]);

  return { user, session, profile, loading, signIn, signOut, refreshProfile, ensureProfileForCurrentUser };
}
