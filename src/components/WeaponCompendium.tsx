import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sword, Target, Flame, MoreHorizontal, Zap, Search } from 'lucide-react';
import { Button } from './ui/button';
import { ALL_WEAPONS } from '../data/weapons';
import { EVOLVED_WEAPONS, EVOLUTION_MAP } from '../data/evolvedWeapons';
import { FUSION_WEAPONS, FUSION_RECIPES } from '../data/weaponFusions';
import type { Weapon, ElementType } from '../types/game';

// 크로스 타입 융합 무기 ID 목록 (기타 카테고리)
const OTHER_FUSION_IDS = new Set([
  'sword_bow_hybrid', 'spear_crossbow', 'axe_shuriken',
  'magic_knight_blade', 'battle_mage_staff', 'enchanted_hammer',
  'magic_arrow', 'elemental_crossbow',
]);

type CompendiumCategory = 'melee' | 'ranged' | 'elemental' | 'other';
type WeaponTier = 'base' | 'evolved' | 'fusion';

interface CompendiumWeapon extends Weapon {
  category: CompendiumCategory;
  tier: WeaponTier;
  evolutionSource?: string;  // 진화 원본 무기 이름
  fusionIngredients?: [string, string]; // 합성 재료 무기 이름 2개
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  physical: '물리',
  fire: '🔥화염',
  ice: '❄️얼음',
  lightning: '⚡번개',
  poison: '☠️독',
  dark: '🌑암흑',
  holy: '✨신성',
};

const ELEMENT_COLORS: Record<ElementType, string> = {
  physical: 'text-slate-300 bg-slate-700/50 border-slate-600/50',
  fire: 'text-orange-300 bg-orange-900/30 border-orange-600/40',
  ice: 'text-cyan-300 bg-cyan-900/30 border-cyan-600/40',
  lightning: 'text-yellow-300 bg-yellow-900/30 border-yellow-600/40',
  poison: 'text-green-300 bg-green-900/30 border-green-600/40',
  dark: 'text-purple-300 bg-purple-900/30 border-purple-600/40',
  holy: 'text-amber-200 bg-amber-900/30 border-amber-500/40',
};

const TIER_BADGE: Record<WeaponTier, { label: string; cls: string }> = {
  base: { label: '기본', cls: 'text-slate-400 bg-slate-700/50 border-slate-600/50' },
  evolved: { label: '진화', cls: 'text-emerald-300 bg-emerald-900/30 border-emerald-600/40' },
  fusion: { label: '합성', cls: 'text-violet-300 bg-violet-900/30 border-violet-600/40' },
};

const CATEGORIES = [
  { id: 'melee' as const, label: '근접 무기', icon: Sword },
  { id: 'ranged' as const, label: '원거리 무기', icon: Target },
  { id: 'elemental' as const, label: '원소 무기', icon: Flame },
  { id: 'other' as const, label: '기타 / 합성', icon: MoreHorizontal },
] as const;

/** 무기 타입에서 카테고리 결정 */
function getCategoryFromWeapon(weapon: Weapon): CompendiumCategory {
  if (OTHER_FUSION_IDS.has(weapon.id)) return 'other';
  if (weapon.type === 'melee') return 'melee';
  if (weapon.type === 'ranged') return 'ranged';
  return 'elemental'; // magic
}

/** 이름 맵 (이모지 포함 전체 이름) */
function buildNameMap(weapons: Weapon[]): Map<string, string> {
  const map = new Map<string, string>();
  weapons.forEach(w => map.set(w.id, w.name));
  return map;
}

/** 전체 무기 목록 빌드 (base + evolved + fusion) */
function buildCompendiumWeapons(): CompendiumWeapon[] {
  const allNames = buildNameMap([...ALL_WEAPONS, ...EVOLVED_WEAPONS, ...FUSION_WEAPONS]);

  // 진화 역방향 맵: evolvedId → base 무기 이름
  const evolvedFromMap = new Map<string, string>();
  Object.entries(EVOLUTION_MAP).forEach(([baseId, { evolvedId }]) => {
    const baseName = allNames.get(baseId);
    if (baseName) evolvedFromMap.set(evolvedId, baseName);
  });

  // 합성 결과 역방향 맵: resultId → [weapon1Name, weapon2Name] (중복 제거)
  const fusionFromMap = new Map<string, [string, string]>();
  FUSION_RECIPES.forEach(recipe => {
    if (!fusionFromMap.has(recipe.resultId)) {
      const w1 = allNames.get(recipe.weapon1Id) ?? recipe.weapon1Id;
      const w2 = allNames.get(recipe.weapon2Id) ?? recipe.weapon2Id;
      fusionFromMap.set(recipe.resultId, [w1, w2]);
    }
  });

  const results: CompendiumWeapon[] = [];

  // 기본 무기
  ALL_WEAPONS.forEach(w => {
    results.push({
      ...w,
      category: getCategoryFromWeapon(w),
      tier: 'base',
    });
  });

  // 진화 무기
  EVOLVED_WEAPONS.forEach(w => {
    results.push({
      ...w,
      category: getCategoryFromWeapon(w),
      tier: 'evolved',
      evolutionSource: evolvedFromMap.get(w.id),
    });
  });

  // 합성 무기
  FUSION_WEAPONS.forEach(w => {
    results.push({
      ...w,
      category: getCategoryFromWeapon(w),
      tier: 'fusion',
      fusionIngredients: fusionFromMap.get(w.id),
    });
  });

  return results;
}

const ALL_COMPENDIUM_WEAPONS = buildCompendiumWeapons();

/** 공격속도 프레임 → 읽기 쉬운 등급 */
function speedLabel(attackSpeed: number): string {
  if (attackSpeed <= 6) return '극속';
  if (attackSpeed <= 12) return '고속';
  if (attackSpeed <= 20) return '중속';
  if (attackSpeed <= 28) return '저속';
  return '극저';
}

interface WeaponCardProps {
  weapon: CompendiumWeapon;
}

const WeaponCard: React.FC<WeaponCardProps> = ({ weapon: w }) => {
  const tierBadge = TIER_BADGE[w.tier];

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 hover:border-slate-500/80 rounded-xl p-4 transition-all hover:bg-slate-800/80 flex flex-col gap-2.5">
      {/* 헤더: 이름 + 티어 뱃지 */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-slate-100 text-sm leading-snug">{w.name}</h3>
        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${tierBadge.cls}`}>
          {tierBadge.label}
        </span>
      </div>

      {/* 설명 */}
      <p className="text-xs text-slate-400 leading-relaxed">{w.description}</p>

      {/* 스탯 그리드 */}
      <div className="grid grid-cols-3 gap-1.5">
        <StatBox label="데미지" value={w.damage > 999 ? '즉사' : String(w.damage)} highlight={w.damage > 80} />
        <StatBox label="공격속도" value={`${speedLabel(w.attackSpeed)} (${w.attackSpeed}f)`} />
        <StatBox label="사거리" value={String(w.range)} highlight={w.range >= 80} />
        {w.projectileCount && w.projectileCount > 1 && (
          <StatBox label="투사체" value={`${w.projectileCount}발`} highlight />
        )}
        {w.projectileSpeed && (
          <StatBox label="탄속" value={String(w.projectileSpeed)} />
        )}
        {w.elementalDamage && w.element && (
          <div className={`col-span-1 flex flex-col items-center justify-center rounded-lg px-2 py-1.5 border text-center ${ELEMENT_COLORS[w.element]}`}>
            <span className="text-[9px] opacity-70 mb-0.5">속성피해</span>
            <span className="text-xs font-bold">{ELEMENT_LABELS[w.element]} {w.elementalDamage}</span>
          </div>
        )}
      </div>

      {/* 특수 효과 */}
      {w.special && (
        <div className="flex items-start gap-1.5">
          <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
          <span className="text-xs text-amber-200/90">{w.special}</span>
        </div>
      )}

      {/* 태그 줄 (관통, 판정 형태) */}
      {(w.piercing || w.projectileShape) && (
        <div className="flex flex-wrap gap-1">
          {w.piercing && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900/40 border border-teal-600/40 text-teal-300">관통</span>
          )}
          {w.projectileShape === 'wide' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-600/40 text-blue-300">넓은 판정</span>
          )}
          {w.projectileShape === 'long' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/40 border border-indigo-600/40 text-indigo-300">긴 판정</span>
          )}
          {w.projectileShape === 'crescent' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-900/40 border border-sky-600/40 text-sky-300">초승달 판정</span>
          )}
        </div>
      )}

      {/* 진화 출처 */}
      {w.tier === 'evolved' && w.evolutionSource && (
        <div className="text-[11px] text-emerald-300/80 bg-emerald-950/40 border border-emerald-700/30 rounded-lg px-2.5 py-1.5">
          ✨ 진화: <span className="font-semibold">{w.evolutionSource}</span> +5 강화
        </div>
      )}

      {/* 합성 재료 */}
      {w.tier === 'fusion' && w.fusionIngredients && (
        <div className="text-[11px] text-violet-300/80 bg-violet-950/40 border border-violet-700/30 rounded-lg px-2.5 py-1.5">
          🔗 합성: <span className="font-semibold">{w.fusionIngredients[0]}</span>
          <span className="text-violet-400"> + </span>
          <span className="font-semibold">{w.fusionIngredients[1]}</span>
        </div>
      )}
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`flex flex-col items-center justify-center rounded-lg px-2 py-1.5 border text-center ${
    highlight
      ? 'bg-amber-900/20 border-amber-600/30 text-amber-200'
      : 'bg-slate-700/40 border-slate-600/40 text-slate-300'
  }`}>
    <span className="text-[9px] opacity-60 mb-0.5">{label}</span>
    <span className="text-xs font-semibold leading-tight">{value}</span>
  </div>
);

export const WeaponCompendium: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<CompendiumCategory>('melee');
  const [search, setSearch] = useState('');

  const categoryWeapons = useMemo(() => {
    const base = ALL_COMPENDIUM_WEAPONS.filter(w => w.category === category);
    if (!search.trim()) return base;
    const q = search.trim().toLowerCase();
    return base.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.description.toLowerCase().includes(q) ||
      (w.special ?? '').toLowerCase().includes(q)
    );
  }, [category, search]);

  const counts = useMemo(() => {
    const map: Record<CompendiumCategory, number> = { melee: 0, ranged: 0, elemental: 0, other: 0 };
    ALL_COMPENDIUM_WEAPONS.forEach(w => { map[w.category]++; });
    return map;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* 헤더 */}
      <header className="border-b border-slate-700/50 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack ?? (() => navigate('/'))}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">⚔️ 무기 도감</h1>
            <p className="text-[11px] text-slate-500">총 {ALL_COMPENDIUM_WEAPONS.length}종 · 기본 / 진화 / 합성</p>
          </div>
          {/* 검색 */}
          <div className="relative w-40 sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="무기 검색..."
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-600/60 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* 카테고리 탭 */}
        <nav className="max-w-5xl mx-auto px-4 pb-2.5 flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setCategory(id); setSearch(''); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                category === id
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700/60 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`text-[10px] px-1 rounded ${category === id ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-700 text-slate-500'}`}>
                {counts[id]}
              </span>
            </button>
          ))}
        </nav>
      </header>

      {/* 본문 */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        {/* 티어 범례 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.entries(TIER_BADGE).map(([tier, { label, cls }]) => (
            <span key={tier} className={`text-[10px] px-2 py-1 rounded border font-medium ${cls}`}>
              {label}
            </span>
          ))}
          <span className="text-[10px] text-slate-500 flex items-center">
            · 공격속도: 프레임 수 (낮을수록 빠름)
          </span>
        </div>

        {categoryWeapons.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            {search ? `"${search}" 검색 결과가 없습니다.` : '이 카테고리에 무기가 없습니다.'}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryWeapons.map(w => (
              <WeaponCard key={w.id} weapon={w} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
