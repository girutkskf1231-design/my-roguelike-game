-- 무기 도감 테이블
CREATE TABLE IF NOT EXISTS weapon_compendium (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  weapon_type TEXT NOT NULL,
  category TEXT NOT NULL,
  special_effect TEXT NOT NULL,
  fusion_formula TEXT,
  sort_order INTEGER DEFAULT 0
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_weapon_compendium_category ON weapon_compendium(category);
CREATE INDEX IF NOT EXISTS idx_weapon_compendium_weapon_type ON weapon_compendium(weapon_type);

-- RLS
ALTER TABLE weapon_compendium ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weapon_compendium_read_all" ON weapon_compendium
  FOR SELECT USING (true);
