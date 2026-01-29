// 게임 타입 정의
export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Stats {
  strength: number;     // 공격력
  vitality: number;     // 체력
  agility: number;      // 속도
  defense: number;      // 방어력
  criticalChance: number; // 치명타 확률 (%)
}

export type ElementType = 'physical' | 'fire' | 'ice' | 'lightning' | 'poison' | 'dark' | 'holy';

/** 패시브 스킬 보너스 (% 단위, 보유 시 항상 적용) */
export interface PassiveSkillEffect {
  damageBonus?: number;
  critChanceBonus?: number;
  healthBonus?: number;
  defenseBonus?: number;
  speedBonus?: number;
  expBonus?: number; // 경험치 증가 %
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'special';
  cooldown: number;
  currentCooldown: number;
  damage?: number;
  duration?: number;
  effect?: string;
  element?: ElementType;
  elementalDamage?: number;
  piercing?: boolean; // 벽 관통 여부
  classRestriction?: ClassType; // 직업 제한 (없으면 공용)
  /** true면 슬롯 장착 없이 보유만으로 항상 적용 */
  isPassive?: boolean;
  passiveEffect?: PassiveSkillEffect;
}

export interface Weapon {
  id: string;
  name: string;
  description: string;
  type: 'melee' | 'ranged' | 'magic';
  damage: number;
  attackSpeed: number;
  range: number;
  special?: string;
  projectileCount?: number;
  projectileSpeed?: number;
  element?: ElementType;
  elementalDamage?: number;
  piercing?: boolean; // 벽 관통 여부
  projectileLifetime?: number; // 투사체 지속시간 (프레임)
  projectileShape?: 'default' | 'crescent' | 'wide' | 'long'; // 투사체 모양
  upgradeLevel?: number; // 강화 레벨 (0 = 기본, 1+ = 강화)
  isEvolved?: boolean; // 진화 여부
  evolutionRequirement?: number; // 진화 필요 강화 레벨
  evolvedFormId?: string; // 진화 후 무기 ID
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  icon: string; // 이모지 아이콘
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effects: {
    expMultiplier?: number; // 경험치 획득량 배율 (예: 1.5 = 50% 증가)
    damageBonus?: number; // 데미지 증가 (%)
    attackSpeedBonus?: number; // 공격속도 증가 (%)
    healthBonus?: number; // 체력 증가 (%)
    critChanceBonus?: number; // 치명타 확률 증가 (%)
    defenseBonus?: number; // 방어력 증가 (%)
    speedBonus?: number; // 이동속도 증가 (%)
    regenPercentPer5Sec?: number; // 5초당 최대 체력의 N% 치유
  };
}

export type RewardOption = 
  | { type: 'skill'; skill: Skill }
  | { type: 'weapon'; weapon: Weapon }
  | { type: 'stat'; statName: keyof Stats; amount: number }
  | { type: 'upgrade'; weapon: Weapon } // 무기 강화 옵션
  | { type: 'evolution'; weapon: Weapon; baseWeapon: Weapon } // 무기 진화 옵션
  | { type: 'fusion'; weapon: Weapon; weapon1: Weapon; weapon2: Weapon } // 무기 합성 옵션
  | { type: 'artifact'; artifact: Artifact }; // 아티펙트 획득 옵션

export interface Player {
  position: Position;
  velocity: Velocity;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  isJumping: boolean;
  isDodging: boolean;
  isAttacking: boolean;
  dodgeCooldown: number;
  attackCooldown: number;
  facingRight: boolean;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  stats: Stats;
  statPoints: number;
  equippedSkills: (Skill | undefined)[]; // 최대 3 슬롯, 빈 슬롯은 undefined
  availableSkills: Skill[];
  activeSkillEffects: string[];
  weapon: Weapon;
  weaponInventory: Weapon[]; // 보유 중인 무기들
  artifacts: Artifact[]; // 보유 중인 아티펙트들
  equippedArtifacts: (Artifact | null)[]; // 장착된 아티펙트 (최대 3개)
  class: ClassType;
}

export interface Boss {
  position: Position;
  velocity: Velocity;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  currentPattern: number;
  patternCooldown: number;
  isAttacking: boolean;
  debuffs: Debuff[];
}

export interface Projectile {
  position: Position;
  velocity: Velocity;
  width: number;
  height: number;
  damage: number;
  fromPlayer: boolean;
  isCritical?: boolean;
  element?: ElementType;
  elementalDamage?: number;
  piercing?: boolean; // 벽 관통 여부
  isTracking?: boolean; // 적 추적 여부
  lifetime?: number; // 투사체 지속시간 (프레임)
  shape?: 'default' | 'crescent' | 'wide' | 'long'; // 투사체 모양
  createdAt?: number; // 생성 시간
  weaponId?: string; // 무기 ID (특수 효과 판별용)
}

export interface Debuff {
  type: ElementType;
  duration: number;
  tickDamage?: number;
  slowAmount?: number;
  stunned?: boolean;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isWall?: boolean; // 벽인지 여부 (true면 투사체 충돌, false면 바닥으로만 작동)
}

export interface DamageText {
  id: string;
  position: Position;
  damage: number;
  isPlayerDamage: boolean; // true면 플레이어가 받은 데미지, false면 보스가 받은 데미지
  opacity: number;
  offsetY: number;
  isCritical?: boolean; // 치명타 여부
  element?: ElementType; // 속성 타입
}

export type Difficulty = 'normal' | 'hard';

export type ClassType = 'warrior' | 'archer' | 'mage' | 'assassin';

export interface ClassInfo {
  id: ClassType;
  name: string;
  description: string;
  emoji: string;
  startingStats: Stats;
  startingWeaponId: string;
  passive: {
    name: string;
    description: string;
    effect: string; // 'damageReduction' | 'critBonus' | 'elementalBonus' | 'attackSpeedBonus'
    value: number;
  };
}

export interface GameState {
  player: Player;
  boss: Boss;
  projectiles: Projectile[];
  platforms: Platform[];
  gameStatus: 'playing' | 'victory' | 'defeat' | 'choosing' | 'menu';
  score: number;
  wave: number;
  isPaused: boolean;
  showRewardScreen: boolean;
  rewardOptions: RewardOption[];
  showWaveComplete: boolean;
  lastExpGained: number;
  damageTexts: DamageText[];
  difficulty: Difficulty;
  pendingLevelUps: number; // 남은 레벨업 횟수
  pendingBonusRewards: number; // 남은 웨이브 보너스 보상 횟수
}

export interface SavedGameData {
  score: number;
  wave: number;
  highScore: number;
  playerHealth: number;
  level: number;
  experience: number;
  stats: Stats;
  statPoints: number;
  equippedSkills: (Skill | undefined)[];
  availableSkills: Skill[];
  weaponId: string;
  weaponInventory?: Weapon[]; // 무기 인벤토리
  class: ClassType;
  artifacts?: Artifact[]; // 보유 아티펙트
  equippedArtifacts?: (Artifact | null)[]; // 장착된 아티펙트
}
