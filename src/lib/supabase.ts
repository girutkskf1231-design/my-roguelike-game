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
}

const TABLE = 'game_scores';

/** 리더보드 상위 N개 조회 - 예외/서버 오류 시 빈 배열 반환 (사용자에게 오류 메시지 노출 안 함) */
export async function fetchLeaderboard(limit = 20): Promise<GameScoreRow[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, player_name, score, wave, difficulty, class_type, created_at')
      .order('score', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as GameScoreRow[];
  } catch {
    return [];
  }
}

/** 점수 제출 (패배/승리 시 호출) - 예외/서버 오류 시 false 반환, 절대 throw 안 함 */
export async function submitScoreToLeaderboard(params: {
  playerName: string;
  score: number;
  wave: number;
  difficulty: string;
  classType: string;
}): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from(TABLE).insert({
      player_name: (params.playerName || 'Guest').slice(0, 100),
      score: Number(params.score) || 0,
      wave: Number(params.wave) || 0,
      difficulty: params.difficulty === 'hard' ? 'hard' : 'normal',
      class_type: String(params.classType).slice(0, 50),
    });
    return !error;
  } catch {
    return false;
  }
}
