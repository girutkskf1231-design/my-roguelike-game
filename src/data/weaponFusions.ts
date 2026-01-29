import type { Weapon } from '../types/game';

// 무기 조합 결과물 (시너지 무기)
export const FUSION_WEAPONS: Weapon[] = [
  // 원소 조합 - 대립 원소
  {
    id: 'yin_yang_staff',
    name: '☯️ 음양 지팡이',
    description: '화염과 얼음의 조화. 적을 얼리고 태운다',
    type: 'magic',
    damage: 90,
    attackSpeed: 18,
    range: 85,
    projectileSpeed: 15,
    projectileCount: 2,
    special: '화염과 얼음 동시 발사 + 폭발',
    element: 'fire',
    elementalDamage: 80,
    projectileLifetime: 100,
    isEvolved: true,
  },
  {
    id: 'storm_blade',
    name: '⚡🗡️ 폭풍의 검',
    description: '물과 번개의 힘. 빠르고 강력하다',
    type: 'melee',
    damage: 70,
    attackSpeed: 10,
    range: 60,
    special: '번개 충격파 + 빠른 공격',
    element: 'lightning',
    elementalDamage: 50,
    projectileLifetime: 28,
    projectileShape: 'wide',
    isEvolved: true,
  },
  {
    id: 'toxic_flame_staff',
    name: '☠️🔥 맹독 화염 스태프',
    description: '독과 화염의 융합. 지속 피해 극대화',
    type: 'magic',
    damage: 65,
    attackSpeed: 17,
    range: 75,
    projectileSpeed: 13,
    projectileCount: 3,
    special: '화상 + 맹독 동시 적용',
    element: 'poison',
    elementalDamage: 85,
    projectileLifetime: 105,
    isEvolved: true,
  },
  {
    id: 'void_holy_staff',
    name: '✨🌑 허공의 빛 스태프',
    description: '빛과 어둠의 균형. 모든 것을 정화한다',
    type: 'magic',
    damage: 95,
    attackSpeed: 20,
    range: 90,
    projectileSpeed: 16,
    projectileCount: 1,
    special: '신성+암흑 융합 빔 (관통)',
    element: 'holy',
    elementalDamage: 100,
    piercing: true,
    projectileLifetime: 110,
    isEvolved: true,
  },

  // 같은 타입 조합 - 근접 + 근접
  {
    id: 'excalibur',
    name: '⚔️👑 엑스칼리버',
    description: '검과 대검의 완벽한 조화. 전설의 검',
    type: 'melee',
    // 사실상 모든 적을 한 번에 처치하는 즉사급 데미지
    damage: 99999,
    attackSpeed: 15,
    range: 65,
    special: '즉사 공격 + 신성한 빛',
    element: 'holy',
    elementalDamage: 60,
    // 벽과 적을 모두 관통
    piercing: true,
    projectileLifetime: 30,
    projectileShape: 'wide',
    isEvolved: true,
  },
  {
    id: 'demon_twin_blades',
    name: '⚔️⚔️😈 악마의 쌍날',
    description: '쌍검과 단검의 융합. 초고속 난타',
    type: 'melee',
    damage: 40,
    attackSpeed: 5,
    range: 42,
    special: '4연속 공격 + 출혈',
    element: 'dark',
    elementalDamage: 35,
    projectileLifetime: 18,
    isEvolved: true,
  },
  {
    id: 'titan_crusher',
    name: '🔨🪓 타이탄 크러셔',
    description: '망치와 도끼의 파괴력. 모든 것을 분쇄',
    type: 'melee',
    damage: 120,
    attackSpeed: 30,
    range: 55,
    special: '광역 충격파 + 방어 파괴',
    projectileLifetime: 25,
    projectileShape: 'wide',
    isEvolved: true,
  },
  {
    id: 'dragon_spear_katana',
    name: '🔱🗾 용의 창검',
    description: '창과 카타나의 만남. 우아하고 치명적',
    type: 'melee',
    damage: 65,
    attackSpeed: 12,
    range: 75,
    special: '긴 사거리 + 치명타 +25%',
    projectileLifetime: 30,
    projectileShape: 'long',
    isEvolved: true,
  },

  // 같은 타입 조합 - 원거리 + 원거리
  {
    id: 'celestial_artillery',
    name: '🏹⚡💫 천상의 포격',
    description: '활과 석궁의 완벽한 융합. 하늘을 찢는다',
    type: 'ranged',
    damage: 80,
    attackSpeed: 14,
    range: 100,
    projectileSpeed: 25,
    projectileCount: 3,
    special: '유도 화살 + 관통 + 폭발',
    piercing: true,
    element: 'lightning',
    elementalDamage: 50,
    projectileLifetime: 130,
    isEvolved: true,
  },
  {
    id: 'shuriken_storm',
    name: '⭐🌙🌪️ 수리검 폭풍',
    description: '수리검과 부메랑의 조화. 끝없는 회전',
    type: 'ranged',
    damage: 35,
    attackSpeed: 6,
    range: 80,
    projectileSpeed: 18,
    projectileCount: 8,
    special: '8개 회전 투척 + 귀환',
    piercing: true,
    projectileLifetime: 150,
    isEvolved: true,
  },
  {
    id: 'multi_heaven_bow',
    name: '🏹🏹🏹✨ 천상의 다중궁',
    description: '모든 활의 정수. 화살의 향연',
    type: 'ranged',
    damage: 50,
    attackSpeed: 8,
    range: 95,
    projectileSpeed: 22,
    projectileCount: 7,
    special: '7연발 유도 화살',
    element: 'holy',
    elementalDamage: 40,
    projectileLifetime: 125,
    isEvolved: true,
  },

  // 크로스 타입 조합 - 근접 + 원거리
  {
    id: 'sword_bow_hybrid',
    name: '⚔️🏹 검궁사',
    description: '검과 활의 조화. 근거리와 원거리 모두 완벽',
    type: 'melee',
    damage: 55,
    attackSpeed: 14,
    range: 70,
    projectileSpeed: 16,
    projectileCount: 1,
    special: '근접 공격 시 화살 자동 발사',
    projectileLifetime: 90,
    isEvolved: true,
  },
  {
    id: 'spear_crossbow',
    name: '🔱🏹 창석궁',
    description: '창과 석궁의 융합. 압도적 사거리',
    type: 'ranged',
    damage: 70,
    attackSpeed: 16,
    range: 110,
    projectileSpeed: 24,
    projectileCount: 1,
    special: '초장거리 관통 공격',
    piercing: true,
    projectileLifetime: 140,
    isEvolved: true,
  },
  {
    id: 'axe_shuriken',
    name: '🪓⭐ 투척 도끼',
    description: '도끼와 수리검의 만남. 회전하는 파괴',
    type: 'ranged',
    damage: 60,
    attackSpeed: 12,
    range: 70,
    projectileSpeed: 15,
    projectileCount: 4,
    special: '회전 도끼 4개 투척',
    projectileLifetime: 120,
    isEvolved: true,
  },

  // 크로스 타입 조합 - 근접 + 마법
  {
    id: 'magic_knight_blade',
    name: '⚔️🔮 마검사의 검',
    description: '검과 마법의 융합. 마검사의 상징',
    type: 'melee',
    damage: 75,
    attackSpeed: 14,
    range: 55,
    special: '검격 + 마법 폭발 동시 발동',
    element: 'fire',
    elementalDamage: 55,
    projectileLifetime: 28,
    projectileShape: 'wide',
    isEvolved: true,
  },
  {
    id: 'battle_mage_staff',
    name: '🔮⚔️ 전투 마법사의 지팡이',
    description: '전투 지팡이와 마법 지팡이의 융합',
    type: 'melee',
    damage: 65,
    attackSpeed: 13,
    range: 58,
    special: '근접 + 원거리 마법 동시 공격',
    element: 'lightning',
    elementalDamage: 50,
    projectileSpeed: 14,
    projectileCount: 2,
    projectileLifetime: 85,
    isEvolved: true,
  },
  {
    id: 'enchanted_hammer',
    name: '🔨✨ 마법 망치',
    description: '망치와 마법의 융합. 충격과 마법',
    type: 'melee',
    damage: 90,
    attackSpeed: 22,
    range: 50,
    special: '마법 충격파 + 광역 마법',
    element: 'holy',
    elementalDamage: 60,
    projectileLifetime: 22,
    projectileShape: 'wide',
    isEvolved: true,
  },

  // 크로스 타입 조합 - 원거리 + 마법
  {
    id: 'magic_arrow',
    name: '🏹🪄 마법 화살',
    description: '활과 완드의 조화. 마법을 쏘는 활',
    type: 'ranged',
    damage: 60,
    attackSpeed: 11,
    range: 90,
    projectileSpeed: 18,
    projectileCount: 3,
    special: '마법 화살 3발 (유도)',
    element: 'holy',
    elementalDamage: 55,
    projectileLifetime: 115,
    isEvolved: true,
  },
  {
    id: 'elemental_crossbow',
    name: '🏹🔥 원소 석궁',
    description: '석궁과 원소 지팡이의 융합',
    type: 'ranged',
    damage: 75,
    attackSpeed: 17,
    range: 85,
    projectileSpeed: 22,
    projectileCount: 1,
    special: '랜덤 원소 볼트 발사',
    element: 'fire',
    elementalDamage: 65,
    piercing: true,
    projectileLifetime: 105,
    isEvolved: true,
  },

  // 궁극의 조합 - 3원소
  {
    id: 'trinity_staff',
    name: '🔥❄️⚡ 삼위일체 스태프',
    description: '화염, 얼음, 번개의 완벽한 조화',
    type: 'magic',
    damage: 110,
    attackSpeed: 19,
    range: 95,
    projectileSpeed: 17,
    projectileCount: 3,
    special: '화염+얼음+번개 동시 발사',
    element: 'fire',
    elementalDamage: 120,
    projectileLifetime: 105,
    isEvolved: true,
  },
];

// 무기 조합 레시피
export interface FusionRecipe {
  weapon1Id: string;
  weapon2Id: string;
  resultId: string;
  description: string;
}

export const FUSION_RECIPES: FusionRecipe[] = [
  // 원소 대립 조합
  {
    weapon1Id: 'fire_staff',
    weapon2Id: 'ice_staff',
    resultId: 'yin_yang_staff',
    description: '화염과 얼음의 조화',
  },
  {
    weapon1Id: 'ice_staff',
    weapon2Id: 'fire_staff',
    resultId: 'yin_yang_staff',
    description: '얼음과 화염의 조화',
  },
  {
    weapon1Id: 'lightning_staff',
    weapon2Id: 'ice_staff',
    resultId: 'storm_blade',
    description: '번개와 얼음의 폭풍',
  },
  {
    weapon1Id: 'fire_staff',
    weapon2Id: 'poison_staff',
    resultId: 'toxic_flame_staff',
    description: '화염과 독의 융합',
  },
  {
    weapon1Id: 'holy_staff',
    weapon2Id: 'dark_staff',
    resultId: 'void_holy_staff',
    description: '빛과 어둠의 균형',
  },
  {
    weapon1Id: 'dark_staff',
    weapon2Id: 'holy_staff',
    resultId: 'void_holy_staff',
    description: '어둠과 빛의 균형',
  },

  // 같은 타입 - 근접
  {
    weapon1Id: 'sword',
    weapon2Id: 'greatsword',
    resultId: 'excalibur',
    description: '검의 완성형',
  },
  {
    weapon1Id: 'greatsword',
    weapon2Id: 'sword',
    resultId: 'excalibur',
    description: '대검과 검의 융합',
  },
  {
    weapon1Id: 'dual_sword',
    weapon2Id: 'dagger',
    resultId: 'demon_twin_blades',
    description: '쌍검의 극한',
  },
  {
    weapon1Id: 'dagger',
    weapon2Id: 'dual_sword',
    resultId: 'demon_twin_blades',
    description: '단검과 쌍검',
  },
  {
    weapon1Id: 'hammer',
    weapon2Id: 'axe',
    resultId: 'titan_crusher',
    description: '파괴의 극한',
  },
  {
    weapon1Id: 'axe',
    weapon2Id: 'hammer',
    resultId: 'titan_crusher',
    description: '도끼와 망치',
  },
  {
    weapon1Id: 'spear',
    weapon2Id: 'katana',
    resultId: 'dragon_spear_katana',
    description: '동양 무기의 조화',
  },
  {
    weapon1Id: 'katana',
    weapon2Id: 'spear',
    resultId: 'dragon_spear_katana',
    description: '카타나와 창',
  },

  // 같은 타입 - 원거리
  {
    weapon1Id: 'bow',
    weapon2Id: 'crossbow',
    resultId: 'celestial_artillery',
    description: '궁수의 완성',
  },
  {
    weapon1Id: 'crossbow',
    weapon2Id: 'bow',
    resultId: 'celestial_artillery',
    description: '석궁과 활',
  },
  {
    weapon1Id: 'shuriken',
    weapon2Id: 'boomerang',
    resultId: 'shuriken_storm',
    description: '투척의 극한',
  },
  {
    weapon1Id: 'boomerang',
    weapon2Id: 'shuriken',
    resultId: 'shuriken_storm',
    description: '부메랑과 수리검',
  },
  {
    weapon1Id: 'double_bow',
    weapon2Id: 'multi_bow',
    resultId: 'multi_heaven_bow',
    description: '다중 활의 정점',
  },
  {
    weapon1Id: 'multi_bow',
    weapon2Id: 'double_bow',
    resultId: 'multi_heaven_bow',
    description: '활들의 융합',
  },

  // 크로스 타입 - 근접 + 원거리
  {
    weapon1Id: 'sword',
    weapon2Id: 'bow',
    resultId: 'sword_bow_hybrid',
    description: '근거리와 원거리',
  },
  {
    weapon1Id: 'bow',
    weapon2Id: 'sword',
    resultId: 'sword_bow_hybrid',
    description: '활과 검',
  },
  {
    weapon1Id: 'spear',
    weapon2Id: 'crossbow',
    resultId: 'spear_crossbow',
    description: '장거리의 극한',
  },
  {
    weapon1Id: 'crossbow',
    weapon2Id: 'spear',
    resultId: 'spear_crossbow',
    description: '석궁과 창',
  },
  {
    weapon1Id: 'axe',
    weapon2Id: 'shuriken',
    resultId: 'axe_shuriken',
    description: '투척 도끼',
  },
  {
    weapon1Id: 'shuriken',
    weapon2Id: 'axe',
    resultId: 'axe_shuriken',
    description: '수리검과 도끼',
  },

  // 크로스 타입 - 근접 + 마법
  {
    weapon1Id: 'sword',
    weapon2Id: 'magic_wand',
    resultId: 'magic_knight_blade',
    description: '마검사의 길',
  },
  {
    weapon1Id: 'magic_wand',
    weapon2Id: 'sword',
    resultId: 'magic_knight_blade',
    description: '완드와 검',
  },
  {
    weapon1Id: 'battle_staff',
    weapon2Id: 'fire_staff',
    resultId: 'battle_mage_staff',
    description: '전투 마법사',
  },
  {
    weapon1Id: 'fire_staff',
    weapon2Id: 'battle_staff',
    resultId: 'battle_mage_staff',
    description: '지팡이들의 융합',
  },
  {
    weapon1Id: 'hammer',
    weapon2Id: 'holy_staff',
    resultId: 'enchanted_hammer',
    description: '신성한 망치',
  },
  {
    weapon1Id: 'holy_staff',
    weapon2Id: 'hammer',
    resultId: 'enchanted_hammer',
    description: '망치와 신성',
  },

  // 크로스 타입 - 원거리 + 마법
  {
    weapon1Id: 'bow',
    weapon2Id: 'magic_wand',
    resultId: 'magic_arrow',
    description: '마법 궁수',
  },
  {
    weapon1Id: 'magic_wand',
    weapon2Id: 'bow',
    resultId: 'magic_arrow',
    description: '완드와 활',
  },
  {
    weapon1Id: 'crossbow',
    weapon2Id: 'lightning_staff',
    resultId: 'elemental_crossbow',
    description: '원소 궁수',
  },
  {
    weapon1Id: 'lightning_staff',
    weapon2Id: 'crossbow',
    resultId: 'elemental_crossbow',
    description: '번개와 석궁',
  },

  // 궁극 조합
  {
    weapon1Id: 'yin_yang_staff',
    weapon2Id: 'lightning_staff',
    resultId: 'trinity_staff',
    description: '3원소의 완성',
  },
  {
    weapon1Id: 'lightning_staff',
    weapon2Id: 'yin_yang_staff',
    resultId: 'trinity_staff',
    description: '삼위일체',
  },
];

// 무기 조합 가능 여부 확인
export const canFuseWeapons = (weapon1: Weapon, weapon2: Weapon): FusionRecipe | null => {
  // 같은 무기끼리는 합성 불가
  if (weapon1.id === weapon2.id) return null;
  
  // 이미 진화한 무기는 기본적으로 합성 불가 (특수 케이스 제외)
  if (weapon1.isEvolved && weapon2.isEvolved) {
    // 음양 지팡이 + 번개 = 삼위일체는 가능
    const recipe = FUSION_RECIPES.find(
      r => (r.weapon1Id === weapon1.id && r.weapon2Id === weapon2.id) ||
           (r.weapon1Id === weapon2.id && r.weapon2Id === weapon1.id)
    );
    return recipe || null;
  }
  
  // 일반 레시피 검색
  const recipe = FUSION_RECIPES.find(
    r => (r.weapon1Id === weapon1.id && r.weapon2Id === weapon2.id) ||
         (r.weapon1Id === weapon2.id && r.weapon2Id === weapon1.id)
  );
  
  return recipe || null;
};

// 무기 합성 실행
export const fuseWeapons = (weapon1: Weapon, weapon2: Weapon): Weapon | null => {
  const recipe = canFuseWeapons(weapon1, weapon2);
  if (!recipe) return null;
  
  const fusedWeapon = FUSION_WEAPONS.find(w => w.id === recipe.resultId);
  if (!fusedWeapon) return null;
  
  // 두 무기의 강화 레벨 평균 계승 (70%)
  const avgLevel = Math.floor(((weapon1.upgradeLevel || 0) + (weapon2.upgradeLevel || 0)) / 2);
  const transferredLevel = Math.floor(avgLevel * 0.7);
  
  let finalWeapon = { ...fusedWeapon, upgradeLevel: transferredLevel };
  
  // 이전 강화 레벨 적용
  if (transferredLevel > 0) {
    const upgradeMultiplier = 1 + (transferredLevel * 0.1);
    finalWeapon = {
      ...finalWeapon,
      damage: Math.floor(fusedWeapon.damage * upgradeMultiplier),
      attackSpeed: Math.max(1, Math.floor(fusedWeapon.attackSpeed * Math.pow(0.95, transferredLevel))),
      range: Math.floor(fusedWeapon.range * (1 + transferredLevel * 0.05)),
      elementalDamage: fusedWeapon.elementalDamage ? Math.floor(fusedWeapon.elementalDamage * upgradeMultiplier) : undefined,
    };
  }
  
  return finalWeapon;
};
