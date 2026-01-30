-- djwida: 게임 인벤토리 및 진행 상황 저장 시스템
-- 플레이어의 무기, 스킬, 아티팩트, 게임 진행 상황을 저장합니다.

-- player_inventory (플레이어 인벤토리 및 게임 진행 상황)
CREATE TABLE IF NOT EXISTS public.player_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 게임 진행 상황
  current_level int NOT NULL DEFAULT 1,
  current_experience bigint NOT NULL DEFAULT 0,
  current_wave int NOT NULL DEFAULT 1,
  current_score bigint NOT NULL DEFAULT 0,
  current_health int NOT NULL DEFAULT 100,
  max_health int NOT NULL DEFAULT 100,
  
  -- 스탯
  stats jsonb NOT NULL DEFAULT '{
    "strength": 10,
    "vitality": 10,
    "agility": 10,
    "defense": 5,
    "criticalChance": 5
  }'::jsonb,
  stat_points int NOT NULL DEFAULT 0,
  
  -- 직업
  class_type text NOT NULL DEFAULT 'warrior',
  
  -- 장착된 무기 (weapon ID)
  equipped_weapon_id text NOT NULL DEFAULT 'sword',
  equipped_weapon_upgrade_level int NOT NULL DEFAULT 0,
  
  -- 보유 무기 목록 (JSON 배열)
  weapons jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- 장착된 스킬 (최대 3개)
  equipped_skills jsonb NOT NULL DEFAULT '[null, null, null]'::jsonb,
  
  -- 보유 스킬 목록
  available_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- 보유 아티팩트 목록
  artifacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- 장착된 아티팩트 (최대 3개)
  equipped_artifacts jsonb NOT NULL DEFAULT '[null, null, null]'::jsonb,
  
  -- 난이도
  difficulty text NOT NULL DEFAULT 'normal',
  
  -- 메타데이터
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- 사용자당 하나의 인벤토리만 존재
  CONSTRAINT unique_user_inventory UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_player_inventory_user_id ON public.player_inventory (user_id);
CREATE INDEX IF NOT EXISTS idx_player_inventory_updated_at ON public.player_inventory (updated_at DESC);

ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 인벤토리만 읽고 수정 가능
CREATE POLICY "Users can read own inventory"
  ON public.player_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON public.player_inventory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON public.player_inventory FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON public.player_inventory FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.player_inventory IS '플레이어 인벤토리 및 게임 진행 상황';

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.update_inventory_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_saved_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_inventory_updated ON public.player_inventory;
CREATE TRIGGER on_inventory_updated
  BEFORE UPDATE ON public.player_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();

-- 인벤토리 통계 조회 함수
CREATE OR REPLACE FUNCTION public.get_inventory_stats(p_user_id uuid)
RETURNS TABLE (
  total_weapons int,
  total_skills int,
  total_artifacts int,
  equipped_weapon_name text,
  player_level int,
  current_wave int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jsonb_array_length(weapons) as total_weapons,
    jsonb_array_length(available_skills) as total_skills,
    jsonb_array_length(artifacts) as total_artifacts,
    equipped_weapon_id as equipped_weapon_name,
    current_level as player_level,
    current_wave
  FROM public.player_inventory
  WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_inventory_stats(uuid) IS '플레이어 인벤토리 통계 조회';
