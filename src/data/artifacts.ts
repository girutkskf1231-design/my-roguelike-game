import type { Artifact } from '../types/game';

export const ALL_ARTIFACTS: Artifact[] = [
  // 경험치 관련
  {
    id: 'wisdom_crystal',
    name: '💎 지혜의 수정',
    description: '경험치 획득량이 50% 증가합니다. 더 빠른 성장을 위한 필수 아티펙트입니다.',
    icon: '💎',
    rarity: 'epic',
    effects: {
      expMultiplier: 1.5, // 경험치 50% 증가
    },
  },
  
  // 공격력 관련
  {
    id: 'power_ring',
    name: '💍 힘의 반지',
    description: '공격력이 15% 증가합니다. 모든 공격에 추가 데미지를 줍니다.',
    icon: '💍',
    rarity: 'rare',
    effects: {
      damageBonus: 15,
    },
  },
  
  {
    id: 'berserker_amulet',
    name: '⚔️ 광전사의 목걸이',
    description: '공격력이 25% 증가하지만 체력이 10% 감소합니다.',
    icon: '⚔️',
    rarity: 'epic',
    effects: {
      damageBonus: 25,
      healthBonus: -10,
    },
  },
  
  // 공격속도 관련
  {
    id: 'speed_boots',
    name: '👢 신속의 장화',
    description: '공격속도가 20% 증가합니다. 더 빠른 공격이 가능합니다.',
    icon: '👢',
    rarity: 'rare',
    effects: {
      attackSpeedBonus: 20,
    },
  },
  
  {
    id: 'time_accelerator',
    name: '⏰ 시간 가속기',
    description: '공격속도가 30% 증가하고 이동속도가 15% 증가합니다.',
    icon: '⏰',
    rarity: 'epic',
    effects: {
      attackSpeedBonus: 30,
      speedBonus: 15,
    },
  },
  
  // 체력 관련
  {
    id: 'vitality_gem',
    name: '❤️ 생명의 보석',
    description: '최대 체력이 30% 증가합니다. 더 많은 피해를 견딜 수 있습니다.',
    icon: '❤️',
    rarity: 'rare',
    effects: {
      healthBonus: 30,
    },
  },
  
  {
    id: 'immortal_heart',
    name: '🫀 불사의 심장',
    description: '최대 체력 50% 증가, 방어력 10% 증가. 5초당 최대 체력의 10% 치유.',
    icon: '🫀',
    rarity: 'legendary',
    effects: {
      healthBonus: 50,
      defenseBonus: 10,
      regenPercentPer5Sec: 10,
    },
  },
  
  // 치명타 관련
  {
    id: 'critical_eye',
    name: '👁️ 치명의 눈',
    description: '치명타 확률이 20% 증가합니다. 더 자주 치명타를 발동시킵니다.',
    icon: '👁️',
    rarity: 'rare',
    effects: {
      critChanceBonus: 20,
    },
  },
  
  {
    id: 'assassin_blade',
    name: '🗡️ 암살자의 칼날',
    description: '치명타 확률이 35% 증가하고 공격력이 10% 증가합니다.',
    icon: '🗡️',
    rarity: 'epic',
    effects: {
      critChanceBonus: 35,
      damageBonus: 10,
    },
  },
  
  // 방어력 관련
  {
    id: 'steel_plate',
    name: '🛡️ 강철 방패',
    description: '방어력이 20% 증가합니다. 받는 피해가 감소합니다.',
    icon: '🛡️',
    rarity: 'rare',
    effects: {
      defenseBonus: 20,
    },
  },
  
  // 이동속도 관련
  {
    id: 'wind_walker',
    name: '💨 바람의 걸음',
    description: '이동속도가 25% 증가합니다. 더 빠르게 이동할 수 있습니다.',
    icon: '💨',
    rarity: 'common',
    effects: {
      speedBonus: 25,
    },
  },
  
  // 복합 효과
  {
    id: 'balanced_scales',
    name: '⚖️ 균형의 저울',
    description: '모든 스탯이 10% 증가합니다. 균형잡힌 성장을 돕습니다.',
    icon: '⚖️',
    rarity: 'epic',
    effects: {
      damageBonus: 10,
      attackSpeedBonus: 10,
      healthBonus: 10,
      critChanceBonus: 10,
      defenseBonus: 10,
      speedBonus: 10,
    },
  },
  
  {
    id: 'divine_blessing',
    name: '✨ 신의 축복',
    description: '경험치 획득량 100% 증가, 모든 스탯 50% 증가.',
    icon: '✨',
    rarity: 'legendary',
    effects: {
      expMultiplier: 2.0,
      damageBonus: 50,
      attackSpeedBonus: 50,
      healthBonus: 50,
      critChanceBonus: 50,
      defenseBonus: 50,
      speedBonus: 50,
    },
  },
];

export const DEFAULT_ARTIFACTS: Artifact[] = [];

// 등급별 등장 확률 (누적 확률)
export const ARTIFACT_RARITY_WEIGHTS: Record<string, number> = {
  common: 50,    // 50% (0-50)
  rare: 30,      // 30% (50-80)
  epic: 15,      // 15% (80-95)
  legendary: 5, // 5% (95-100)
};

// 등급별 가중치 기반 랜덤 선택 함수
export const selectRandomArtifactByRarity = (availableArtifacts: Artifact[]): Artifact | null => {
  if (availableArtifacts.length === 0) return null;
  
  // 등급별로 아티펙트 분류
  const artifactsByRarity: Record<string, Artifact[]> = {
    common: [],
    rare: [],
    epic: [],
    legendary: [],
  };
  
  availableArtifacts.forEach(artifact => {
    artifactsByRarity[artifact.rarity].push(artifact);
  });
  
  // 확률에 따라 등급 선택
  const roll = Math.random() * 100;
  let selectedRarity: string | null = null;
  
  if (roll < ARTIFACT_RARITY_WEIGHTS.common) {
    selectedRarity = 'common';
  } else if (roll < ARTIFACT_RARITY_WEIGHTS.common + ARTIFACT_RARITY_WEIGHTS.rare) {
    selectedRarity = 'rare';
  } else if (roll < ARTIFACT_RARITY_WEIGHTS.common + ARTIFACT_RARITY_WEIGHTS.rare + ARTIFACT_RARITY_WEIGHTS.epic) {
    selectedRarity = 'epic';
  } else {
    selectedRarity = 'legendary';
  }
  
  // 선택된 등급의 아티펙트가 없으면 다른 등급에서 선택
  if (artifactsByRarity[selectedRarity].length === 0) {
    // 사용 가능한 등급 중에서 선택
    const availableRarities = Object.keys(artifactsByRarity).filter(
      rarity => artifactsByRarity[rarity].length > 0
    );
    if (availableRarities.length === 0) return null;
    selectedRarity = availableRarities[Math.floor(Math.random() * availableRarities.length)];
  }
  
  // 선택된 등급에서 랜덤 아티펙트 선택
  const selectedArtifacts = artifactsByRarity[selectedRarity];
  return selectedArtifacts[Math.floor(Math.random() * selectedArtifacts.length)];
};
