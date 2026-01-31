import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (typeof supabaseUrl === 'string' && typeof supabaseAnonKey === 'string' && supabaseUrl.length > 0 && supabaseAnonKey.length > 0) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
} catch {
  supabaseInstance = null;
}

/** Supabase가 설정되지 않았거나 초기화 실패 시 null (리더보드 비활성화, 서버 오류 노출 방지) */
export const supabase = supabaseInstance;

/** Supabase/서버 측 일반 오류 메시지를 사용자용 한글 메시지로 변환 */
function normalizeErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes('unexpected error occurred') ||
    m.includes('please try again') ||
    m.includes('contact support') ||
    m.includes('internal server error') ||
    m.includes('service temporarily unavailable')
  ) {
    return '일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. 계속되면 문의해 주세요.';
  }
  return message;
}

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

/** 점수 제출 (패배/승리 시 호출). 비동기·논블로킹 — 게임 프레임에 영향 없음. Supabase game_scores 테이블 사용. */
export async function submitScoreToLeaderboard(params: {
  playerName: string;
  score: number;
  wave: number;
  difficulty: string;
  classType: string;
  playDurationSeconds?: number;
  userId?: string;
}): Promise<boolean> {
  if (!supabase) return false;
  try {
    const sec = params.playDurationSeconds != null ? Math.max(0, Math.floor(params.playDurationSeconds)) : null;
    const row: Record<string, unknown> = {
      player_name: (params.playerName || 'Guest').slice(0, 100),
      score: Number(params.score) || 0,
      wave: Number(params.wave) || 0,
      difficulty: params.difficulty === 'hard' ? 'hard' : 'normal',
      class_type: String(params.classType).slice(0, 50),
      play_duration_seconds: sec,
    };
    if (params.userId) row.user_id = params.userId;
    const { error } = await supabase.from(TABLE).insert(row);
    return !error;
  } catch {
    return false;
  }
}

// --- 회원가입 / 인증 ---

export interface NicknameCheckResult {
  available: boolean;
  /** RPC/네트워크 오류 시 메시지 (available이 false인데 error가 있으면 중복이 아닌 오류) */
  error?: string;
}

/** 닉네임 사용 가능 여부 (중복·공백 제외) - RPC nickname_available 호출 */
export async function checkNicknameAvailable(nickname: string): Promise<NicknameCheckResult> {
  if (!supabase) return { available: false, error: '네트워크 오류' };
  try {
    const n = String(nickname).trim();
    if (!n) return { available: false };
    if (n.length < 2) return { available: false, error: '닉네임은 2자 이상 입력해 주세요.' };
    const { data, error } = await supabase.rpc('nickname_available', { n });
    if (error) return { available: false, error: '닉네임 확인 중 오류가 발생했습니다.' };
    return { available: data === true };
  } catch {
    return { available: false, error: '닉네임 확인 중 오류가 발생했습니다.' };
  }
}

export interface SignUpResult {
  ok: boolean;
  error?: 'email_taken' | 'nickname_taken' | 'network' | string;
}

/** 회원가입: 이메일·비밀번호로 가입, 닉네임은 metadata로 전달 후 DB 트리거가 profiles에 저장 */
export async function signUp(params: {
  email: string;
  password: string;
  nickname: string;
}): Promise<SignUpResult> {
  if (!supabase) return { ok: false, error: 'network' };
  try {
    const nickname = params.nickname.trim().slice(0, 50);
    const check = await checkNicknameAvailable(nickname);
    if (!check.available) return { ok: false, error: check.error ?? 'nickname_taken' };
    const { error: authError } = await supabase.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        data: { nickname },
        emailRedirectTo: undefined,
      },
    });
    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return { ok: false, error: 'email_taken' };
      }
      return { ok: false, error: normalizeErrorMessage(authError.message) };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'network' };
  }
}

// --- 로그인 / 세션 (자동 로그인 = Supabase 기본 localStorage 세션 유지) ---

export interface MobileSettings {
  /** 좌측(true) / 우측(false) 이동·점프 배치 */
  movementOnLeft?: boolean;
  /** 버튼 크기 배율 (0.8 ~ 1.5) */
  buttonScale?: number;
}

export interface AuthProfile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  mobile_settings?: MobileSettings | null;
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

/** 로그인: 이메일·비밀번호 검증 후 signInWithPassword */
export async function signIn(email: string, password: string): Promise<LoginResult> {
  if (!supabase) return { ok: false, error: '서비스를 사용할 수 없습니다.' };
  try {
    const e = String(email).trim();
    const p = String(password);
    if (!e) return { ok: false, error: '이메일을 입력해 주세요.' };
    if (!p) return { ok: false, error: '비밀번호를 입력해 주세요.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) {
      if (error.message.includes('Invalid login')) return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
      return { ok: false, error: normalizeErrorMessage(error.message) };
    }
    return data?.session ? { ok: true } : { ok: false, error: '로그인에 실패했습니다.' };
  } catch {
    return { ok: false, error: '네트워크 오류가 발생했습니다.' };
  }
}

/** 로그아웃 (로컬 세션 및 저장소 정리) */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    /* ignore */
  }
}

/** 현재 세션 조회 (자동 로그인 시 복원용) */
export async function getSession() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  } catch {
    return null;
  }
}

const PROFILES_TABLE = 'profiles';
const AVATAR_BUCKET = 'avatars';
const AVATAR_MAX_BYTES = 90000; // 90KB (90000px → 90KB로 해석)

/** 로그인한 사용자의 프로필(닉네임·아바타·모바일 설정) 조회 */
export async function getProfile(userId: string): Promise<AuthProfile | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(PROFILES_TABLE).select('id, nickname, avatar_url, mobile_settings').eq('id', userId).single();
    if (error || !data) return null;
    return data as AuthProfile;
  } catch {
    return null;
  }
}

/** 자동 로그인 시 프로필 행이 없을 때 생성 (트리거 미실행·마이그레이션 이전 가입자 대응). 기존 행이 있으면 덮어쓰지 않음. */
export async function ensureProfile(userId: string, fallbackNickname: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const nickname = String(fallbackNickname).trim().slice(0, 50) || '게스트';
    const { error } = await supabase.from(PROFILES_TABLE).insert({ id: userId, nickname });
    if (error && error.code !== '23505') return false; // 23505 = unique violation, 이미 행 존재
    return true;
  } catch {
    return false;
  }
}

/** 모바일 컨트롤 설정 저장 (Supabase profiles.mobile_settings) */
export async function updateMobileSettings(userId: string, settings: MobileSettings): Promise<UpdateProfileResult> {
  if (!supabase) return { ok: false, error: '네트워크 오류' };
  try {
    const payload: MobileSettings = {};
    if (typeof settings.movementOnLeft === 'boolean') payload.movementOnLeft = settings.movementOnLeft;
    if (typeof settings.buttonScale === 'number') payload.buttonScale = Math.max(0.8, Math.min(1.5, settings.buttonScale));
    const { error } = await supabase.from(PROFILES_TABLE).update({ mobile_settings: payload }).eq('id', userId);
    if (error) return { ok: false, error: normalizeErrorMessage(error.message) };
    return { ok: true };
  } catch {
    return { ok: false, error: '네트워크 오류' };
  }
}

export { AVATAR_MAX_BYTES };

export interface UpdateProfileResult {
  ok: boolean;
  error?: string;
}

/** 프로필 닉네임 수정 (DB 트리거가 game_scores.player_name 동기화). 행이 없으면 INSERT, 있으면 UPDATE. */
export async function updateProfileNickname(userId: string, nickname: string): Promise<UpdateProfileResult> {
  if (!supabase) return { ok: false, error: '네트워크 오류' };
  try {
    const n = String(nickname).trim().slice(0, 50);
    if (!n || n.length < 2) return { ok: false, error: '닉네임은 2자 이상 입력해 주세요.' };

    // 1) UPDATE 시도 (행이 있으면 갱신, .select().single()으로 실제 반영 여부 확인)
    const { data: updated, error: updateError } = await supabase
      .from(PROFILES_TABLE)
      .update({ nickname: n })
      .eq('id', userId)
      .select('id')
      .maybeSingle();

    if (updateError) {
      if (updateError.code === '23505') return { ok: false, error: '이미 사용 중인 닉네임입니다.' };
      return { ok: false, error: normalizeErrorMessage(updateError.message) };
    }

    // 2) UPDATE가 0행이면 프로필 행 없음 → INSERT
    if (!updated) {
      const { error: insertError } = await supabase
        .from(PROFILES_TABLE)
        .insert({ id: userId, nickname: n });
      if (insertError) {
        if (insertError.code === '23505') return { ok: false, error: '이미 사용 중인 닉네임입니다.' };
        return { ok: false, error: normalizeErrorMessage(insertError.message) };
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, error: '네트워크 오류' };
  }
}

/** 프로필 사진 업로드 (최대 90KB), 업로드 후 profiles.avatar_url 갱신 */
export async function uploadAvatar(userId: string, file: File): Promise<UpdateProfileResult> {
  if (!supabase) return { ok: false, error: '네트워크 오류' };
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: `프로필 사진은 ${AVATAR_MAX_BYTES / 1000}KB 이하여야 합니다.` };
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { ok: false, error: 'jpg, png, gif, webp만 가능합니다.' };
  try {
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true });
    if (uploadError) return { ok: false, error: normalizeErrorMessage(uploadError.message) };
    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const { error: updateError } = await supabase.from(PROFILES_TABLE).update({ avatar_url: urlData.publicUrl }).eq('id', userId);
    if (updateError) return { ok: false, error: normalizeErrorMessage(updateError.message) };
    return { ok: true };
  } catch {
    return { ok: false, error: '업로드에 실패했습니다.' };
  }
}

// --- 게임 인벤토리 시스템 ---

const INVENTORY_TABLE = 'player_inventory';

export interface PlayerInventoryData {
  id?: string;
  user_id: string;
  current_level: number;
  current_experience: number;
  current_wave: number;
  current_score: number;
  current_health: number;
  max_health: number;
  stats: {
    strength: number;
    vitality: number;
    agility: number;
    defense: number;
    criticalChance: number;
  };
  stat_points: number;
  class_type: string;
  equipped_weapon_id: string;
  equipped_weapon_upgrade_level: number;
  weapons: Array<{
    id: string;
    upgradeLevel?: number;
    isEvolved?: boolean;
  }>;
  equipped_skills: Array<string | null>;
  available_skills: string[];
  artifacts: string[];
  equipped_artifacts: Array<string | null>;
  difficulty: string;
  last_saved_at?: string;
  created_at?: string;
  updated_at?: string;
}

/** 플레이어 인벤토리 조회 */
export async function getPlayerInventory(userId: string): Promise<PlayerInventoryData | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // 인벤토리가 없으면 null 반환 (첫 게임 시작 시)
      if (error.code === 'PGRST116') return null;
      console.error('인벤토리 조회 오류:', error);
      return null;
    }
    
    return data as PlayerInventoryData;
  } catch (err) {
    console.error('인벤토리 조회 예외:', err);
    return null;
  }
}

/** 플레이어 인벤토리 저장 (생성 또는 업데이트) */
export async function savePlayerInventory(inventory: PlayerInventoryData): Promise<UpdateProfileResult> {
  if (!supabase) return { ok: false, error: '네트워크 오류' };
  
  try {
    // 기존 인벤토리 확인
    const existing = await getPlayerInventory(inventory.user_id);
    
    const payload = {
      user_id: inventory.user_id,
      current_level: inventory.current_level,
      current_experience: inventory.current_experience,
      current_wave: inventory.current_wave,
      current_score: inventory.current_score,
      current_health: inventory.current_health,
      max_health: inventory.max_health,
      stats: inventory.stats,
      stat_points: inventory.stat_points,
      class_type: inventory.class_type,
      equipped_weapon_id: inventory.equipped_weapon_id,
      equipped_weapon_upgrade_level: inventory.equipped_weapon_upgrade_level,
      weapons: inventory.weapons,
      equipped_skills: inventory.equipped_skills,
      available_skills: inventory.available_skills,
      artifacts: inventory.artifacts,
      equipped_artifacts: inventory.equipped_artifacts,
      difficulty: inventory.difficulty,
    };
    
    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from(INVENTORY_TABLE)
        .update(payload)
        .eq('user_id', inventory.user_id);
      
      if (error) {
        console.error('인벤토리 업데이트 오류:', error);
        return { ok: false, error: normalizeErrorMessage(error.message) };
      }
    } else {
      // 생성
      const { error } = await supabase
        .from(INVENTORY_TABLE)
        .insert(payload);
      
      if (error) {
        console.error('인벤토리 생성 오류:', error);
        return { ok: false, error: normalizeErrorMessage(error.message) };
      }
    }
    
    return { ok: true };
  } catch (err) {
    console.error('인벤토리 저장 예외:', err);
    return { ok: false, error: '인벤토리 저장에 실패했습니다.' };
  }
}

/** 플레이어 인벤토리 삭제 (게임 초기화) */
export async function deletePlayerInventory(userId: string): Promise<UpdateProfileResult> {
  if (!supabase) return { ok: false, error: '네트워크 오류' };
  
  try {
    const { error } = await supabase
      .from(INVENTORY_TABLE)
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('인벤토리 삭제 오류:', error);
      return { ok: false, error: normalizeErrorMessage(error.message) };
    }
    
    return { ok: true };
  } catch (err) {
    console.error('인벤토리 삭제 예외:', err);
    return { ok: false, error: '인벤토리 삭제에 실패했습니다.' };
  }
}

/** get_inventory_stats RPC 응답 타입 */
interface InventoryStatsRpcRow {
  total_weapons: number;
  total_skills: number;
  total_artifacts: number;
  equipped_weapon_name: string;
  player_level: number;
  current_wave: number;
}

/** 인벤토리 통계 조회 */
export async function getInventoryStats(userId: string): Promise<{
  totalWeapons: number;
  totalSkills: number;
  totalArtifacts: number;
  equippedWeaponName: string;
  playerLevel: number;
  currentWave: number;
} | null> {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .rpc('get_inventory_stats', { p_user_id: userId })
      .single();
    
    if (error) {
      console.error('인벤토리 통계 조회 오류:', error);
      return null;
    }
    
    const row = data as InventoryStatsRpcRow;
    return {
      totalWeapons: row.total_weapons,
      totalSkills: row.total_skills,
      totalArtifacts: row.total_artifacts,
      equippedWeaponName: row.equipped_weapon_name,
      playerLevel: row.player_level,
      currentWave: row.current_wave,
    };
  } catch (err) {
    console.error('인벤토리 통계 조회 예외:', err);
    return null;
  }
}
