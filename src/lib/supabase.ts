import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (typeof supabaseUrl === 'string' && typeof supabaseAnonKey === 'string' && supabaseUrl.length > 0 && supabaseAnonKey.length > 0) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch {
  supabaseInstance = null;
}

/** Supabase가 설정되지 않았거나 초기화 실패 시 null (리더보드 비활성화, 서버 오류 노출 방지) */
export const supabase = supabaseInstance;

export interface GameScoreRow {
  id: string;
  player_name: string;
  score: number;
  wave: number;
  difficulty: string;
  class_type: string;
  created_at: string;
  play_duration_seconds: number | null;
}

const TABLE = 'game_scores';

/** 리더보드 상위 N개 조회 - 예외/서버 오류 시 빈 배열 반환 (사용자에게 오류 메시지 노출 안 함) */
export async function fetchLeaderboard(limit = 20): Promise<GameScoreRow[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, player_name, score, wave, difficulty, class_type, created_at, play_duration_seconds')
      .order('score', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as GameScoreRow[];
  } catch {
    return [];
  }
}

/** 점수 제출 (패배/승리 시 호출) - 타이머 정지 시간(초) 포함, 예외/서버 오류 시 false 반환 */
export async function submitScoreToLeaderboard(params: {
  playerName: string;
  score: number;
  wave: number;
  difficulty: string;
  classType: string;
  playDurationSeconds?: number;
}): Promise<boolean> {
  if (!supabase) return false;
  try {
    const sec = params.playDurationSeconds != null ? Math.max(0, Math.floor(params.playDurationSeconds)) : null;
    const { error } = await supabase.from(TABLE).insert({
      player_name: (params.playerName || 'Guest').slice(0, 100),
      score: Number(params.score) || 0,
      wave: Number(params.wave) || 0,
      difficulty: params.difficulty === 'hard' ? 'hard' : 'normal',
      class_type: String(params.classType).slice(0, 50),
      play_duration_seconds: sec,
    });
    return !error;
  } catch {
    return false;
  }
}

// --- 회원가입 / 인증 ---

/** 이메일 중복 여부: 사용 가능하면 true */
export async function checkEmailAvailable(email: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('check_email_available', { e: email.trim().toLowerCase() });
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

/** 닉네임 중복 여부: 사용 가능하면 true */
export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('check_nickname_available', { n: nickname.trim() });
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

/** 회원가입 (이메일·비밀번호) 후 프로필(닉네임) 생성. 성공 시 null, 실패 시 에러 메시지 */
export async function signUpWithEmail(
  email: string,
  password: string,
  nickname: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: '서비스를 사용할 수 없습니다.' };
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (authError) {
      const msg = authError.message || '';
      if (msg.includes('already registered') || msg.includes('already exists')) return { error: '이미 가입된 이메일입니다.' };
      return { error: authError.message || '가입에 실패했습니다.' };
    }
    const uid = authData.user?.id;
    if (!uid) return { error: '가입 처리 중 오류가 발생했습니다.' };
    const { error: profileError } = await supabase.from('profiles').insert({
      id: uid,
      nickname: nickname.trim().slice(0, 50),
    });
    if (profileError) return { error: '프로필 생성에 실패했습니다. 고객센터에 문의하세요.' };
    return { error: null };
  } catch {
    return { error: '가입에 실패했습니다.' };
  }
}
