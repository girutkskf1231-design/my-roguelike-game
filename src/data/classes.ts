import type { ClassInfo } from '../types/game';

export const ALL_CLASSES: ClassInfo[] = [
  {
    id: 'warrior',
    name: '⚔️ 전사',
    description: '높은 생존력과 균형잡힌 전투 능력 | 💡 초보자 추천',
    emoji: '⚔️',
    startingStats: {
      strength: 10,
      vitality: 10,
      agility: 10,
      defense: 10,
      criticalChance: 10,
    },
    startingWeaponId: 'sword',
    passive: {
      name: '강철 피부',
      description: '받는 피해 10% 감소',
      effect: 'damageReduction',
      value: 0.1,
    },
  },
  {
    id: 'archer',
    name: '🏹 궁수',
    description: '민첩함과 치명타에 특화',
    emoji: '🏹',
    startingStats: {
      strength: 5,
      vitality: 3,
      agility: 8,
      defense: 3,
      criticalChance: 5,
    },
    startingWeaponId: 'bow',
    passive: {
      name: '예리한 눈',
      description: '치명타 확률 +15%',
      effect: 'critBonus',
      value: 15,
    },
  },
  {
    id: 'mage',
    name: '🔮 마법사',
    description: '강력한 마법 공격력',
    emoji: '🔮',
    startingStats: {
      strength: 10,
      vitality: 3,
      agility: 1,
      defense: 3,
      criticalChance: 5,
    },
    startingWeaponId: 'battle_staff',
    passive: {
      name: '마법 증폭',
      description: '원소 피해 +30%',
      effect: 'elementalBonus',
      value: 0.3,
    },
  },
  {
    id: 'assassin',
    name: '🗡️ 암살자',
    description: '빠른 공격 속도와 치명타',
    emoji: '🗡️',
    startingStats: {
      strength: 8,
      vitality: 4,
      agility: 10,
      defense: 1,
      criticalChance: 5,
    },
    startingWeaponId: 'dagger',
    passive: {
      name: '그림자 은신',
      description: '공격 속도 +20%',
      effect: 'attackSpeedBonus',
      value: 0.2,
    },
  },
];

export function getClassById(classId: string): ClassInfo | undefined {
  return ALL_CLASSES.find(c => c.id === classId);
}

/** 리더보드 등 직업 ID → 표시 이름 (예: warrior → 전사) */
export function getClassDisplayName(classId: string): string {
  const info = getClassById(classId);
  return info ? info.name : classId;
}
