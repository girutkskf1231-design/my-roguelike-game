-- djwida: profiles, game_scores, 인증 트리거, RLS
-- 적용: Supabase 대시보드 SQL Editor 또는 Supabase MCP (apply_migration) 로 실행.
-- MCP: list_tables로 스키마 확인, execute_sql로 조회/검증 가능.

-- profiles (닉네임, 아바타, 모바일 설정)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL DEFAULT '',
  avatar_url text,
  mobile_settings jsonb
);

CREATE INDEX IF NOT EXISTS idx_profiles_nickname_lower ON public.profiles (lower(nickname));
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMENT ON TABLE public.profiles IS '사용자 프로필 (닉네임, 아바타, 모바일 설정)';

-- 가입 시 profiles 자동 생성 (nickname = raw_user_meta_data.nickname)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(TRIM(NEW.raw_user_meta_data->>'nickname'), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- game_scores (리더보드)
CREATE TABLE IF NOT EXISTS public.game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  player_name text NOT NULL DEFAULT 'Guest',
  score bigint NOT NULL DEFAULT 0,
  wave int NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'normal',
  class_type text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  play_duration_seconds int
);

CREATE INDEX IF NOT EXISTS idx_game_scores_score ON public.game_scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON public.game_scores (user_id);
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard"
  ON public.game_scores FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert scores"
  ON public.game_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.game_scores IS '리더보드 점수';

-- 닉네임 수정 시 game_scores.player_name 동기화
CREATE OR REPLACE FUNCTION public.sync_nickname_to_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.nickname IS DISTINCT FROM NEW.nickname THEN
    UPDATE public.game_scores
    SET player_name = NEW.nickname
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_nickname_updated ON public.profiles;
CREATE TRIGGER on_profile_nickname_updated
  AFTER UPDATE OF nickname ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_nickname_to_scores();

-- RPC: 닉네임 사용 가능 여부 (중복·공백 제외)
CREATE OR REPLACE FUNCTION public.nickname_available(n text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE length(trim(n)) >= 1
      AND lower(nickname) = lower(trim(n))
  );
$$;

COMMENT ON FUNCTION public.nickname_available(text) IS '닉네임 중복 여부: 사용 가능이면 true';
