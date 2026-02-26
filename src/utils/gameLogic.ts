import type { GameState, Player, Boss, Projectile, Platform, SavedGameData, Stats, Skill, Weapon, RewardOption, ClassType, PassiveSkillEffect } from '../types/game';
import { STARTER_SKILLS, ALL_SKILLS } from '../data/skills';
import { DEFAULT_WEAPON, ALL_WEAPONS } from '../data/weapons';
import { getClassById } from '../data/classes';
import { EVOLVED_WEAPONS, EVOLUTION_MAP } from '../data/evolvedWeapons';
import { canFuseWeapons, fuseWeapons } from '../data/weaponFusions';
import { ALL_ARTIFACTS, selectRandomArtifactByRarity } from '../data/artifacts';

// 게임 상수
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const GRAVITY = 0.5;
export const PLAYER_SPEED = 5;
export const PLAYER_JUMP_FORCE = 14;
export const DODGE_DURATION = 30;
export const DODGE_COOLDOWN = 60;

// 맵 1: 분리된 바닥 (어려움)
const createMap1 = (): Platform[] => {
  return [
    // 바닥 (더 좁게)
    { x: 0, y: CANVAS_HEIGHT - 40, width: 250, height: 40 },
    { x: 550, y: CANVAS_HEIGHT - 40, width: 250, height: 40 },
    
    // 낮은 플랫폼 (작고 멀리)
    { x: 80, y: CANVAS_HEIGHT - 140, width: 100, height: 15 },
    { x: 620, y: CANVAS_HEIGHT - 140, width: 100, height: 15 },
    
    // 중간 높이 플랫폼 (더 작고 간격 넓게)
    { x: 200, y: CANVAS_HEIGHT - 250, width: 80, height: 15 },
    { x: 520, y: CANVAS_HEIGHT - 250, width: 80, height: 15 },
    
    // 높은 플랫폼 (중앙 하나만, 매우 작음)
    { x: 360, y: CANVAS_HEIGHT - 380, width: 80, height: 15 },
    
    // 최상단 플랫폼 (양쪽 끝, 작음)
    { x: 50, y: CANVAS_HEIGHT - 480, width: 70, height: 15 },
    { x: 680, y: CANVAS_HEIGHT - 480, width: 70, height: 15 },
  ];
};

// 맵 2: 계단식 (중간)
const createMap2 = (): Platform[] => {
  return [
    // 바닥 전체
    { x: 0, y: CANVAS_HEIGHT - 40, width: CANVAS_WIDTH, height: 40 },
    
    // 왼쪽 계단
    { x: 50, y: CANVAS_HEIGHT - 140, width: 120, height: 15 },
    { x: 80, y: CANVAS_HEIGHT - 220, width: 120, height: 15 },
    { x: 110, y: CANVAS_HEIGHT - 300, width: 120, height: 15 },
    
    // 중앙 플랫폼
    { x: 340, y: CANVAS_HEIGHT - 350, width: 120, height: 15 },
    
    // 오른쪽 계단
    { x: 630, y: CANVAS_HEIGHT - 140, width: 120, height: 15 },
    { x: 600, y: CANVAS_HEIGHT - 220, width: 120, height: 15 },
    { x: 570, y: CANVAS_HEIGHT - 300, width: 120, height: 15 },
  ];
};

// 맵 3: 중앙 집중형 (쉬움)
const createMap3 = (): Platform[] => {
  return [
    // 바닥 전체
    { x: 0, y: CANVAS_HEIGHT - 40, width: CANVAS_WIDTH, height: 40 },
    
    // 중앙 타워 형태
    { x: 250, y: CANVAS_HEIGHT - 140, width: 300, height: 15 },
    { x: 280, y: CANVAS_HEIGHT - 220, width: 240, height: 15 },
    { x: 310, y: CANVAS_HEIGHT - 300, width: 180, height: 15 },
    { x: 340, y: CANVAS_HEIGHT - 380, width: 120, height: 15 },
    
    // 양쪽 작은 플랫폼
    { x: 50, y: CANVAS_HEIGHT - 200, width: 100, height: 15 },
    { x: 650, y: CANVAS_HEIGHT - 200, width: 100, height: 15 },
  ];
};

// 맵 4: 지그재그 (어려움)
const createMap4 = (): Platform[] => {
  return [
    // 바닥 (3개 분리)
    { x: 0, y: CANVAS_HEIGHT - 40, width: 180, height: 40 },
    { x: 310, y: CANVAS_HEIGHT - 40, width: 180, height: 40 },
    { x: 620, y: CANVAS_HEIGHT - 40, width: 180, height: 40 },
    
    // 지그재그 형태
    { x: 150, y: CANVAS_HEIGHT - 140, width: 90, height: 15 },
    { x: 560, y: CANVAS_HEIGHT - 160, width: 90, height: 15 },
    { x: 200, y: CANVAS_HEIGHT - 260, width: 90, height: 15 },
    { x: 510, y: CANVAS_HEIGHT - 280, width: 90, height: 15 },
    { x: 350, y: CANVAS_HEIGHT - 380, width: 100, height: 15 },
  ];
};

// 맵 5: 플로팅 아일랜드 (매우 어려움)
const createMap5 = (): Platform[] => {
  return [
    // 작은 바닥들
    { x: 0, y: CANVAS_HEIGHT - 40, width: 150, height: 40 },
    { x: 325, y: CANVAS_HEIGHT - 40, width: 150, height: 40 },
    { x: 650, y: CANVAS_HEIGHT - 40, width: 150, height: 40 },
    
    // 떠있는 작은 섬들
    { x: 100, y: CANVAS_HEIGHT - 160, width: 80, height: 15 },
    { x: 250, y: CANVAS_HEIGHT - 180, width: 80, height: 15 },
    { x: 470, y: CANVAS_HEIGHT - 180, width: 80, height: 15 },
    { x: 620, y: CANVAS_HEIGHT - 160, width: 80, height: 15 },
    
    // 중앙 상단
    { x: 320, y: CANVAS_HEIGHT - 300, width: 90, height: 15 },
    { x: 360, y: CANVAS_HEIGHT - 420, width: 80, height: 15 },
  ];
};

// 맵 6: 미로형 (벽이 많은 맵)
const createMap6 = (): Platform[] => {
  return [
    // 바닥
    { x: 0, y: CANVAS_HEIGHT - 40, width: CANVAS_WIDTH, height: 40, isWall: false },
    
    // 벽들 (세로 방향) - 투사체 충돌
    { x: 150, y: CANVAS_HEIGHT - 300, width: 20, height: 260, isWall: true },
    { x: 350, y: CANVAS_HEIGHT - 240, width: 20, height: 200, isWall: true },
    { x: 550, y: CANVAS_HEIGHT - 300, width: 20, height: 260, isWall: true },
    
    // 벽들 (가로 방향) - 투사체 충돌
    { x: 0, y: CANVAS_HEIGHT - 200, width: 180, height: 20, isWall: true },
    { x: 340, y: CANVAS_HEIGHT - 350, width: 200, height: 20, isWall: true },
    { x: 620, y: CANVAS_HEIGHT - 200, width: 180, height: 20, isWall: true },
    
    // 작은 플랫폼들 (바닥)
    { x: 70, y: CANVAS_HEIGHT - 450, width: 100, height: 15, isWall: false },
    { x: 360, y: CANVAS_HEIGHT - 500, width: 80, height: 15, isWall: false },
    { x: 630, y: CANVAS_HEIGHT - 450, width: 100, height: 15, isWall: false },
  ];
};

// 모든 맵 배열
const ALL_MAPS = [createMap1, createMap2, createMap3, createMap4, createMap5, createMap6];

// 랜덤 맵 선택
export const createPlatforms = (): Platform[] => {
  const randomMap = ALL_MAPS[Math.floor(Math.random() * ALL_MAPS.length)];
  return randomMap();
};

// 초기 스텟
export const createInitialStats = (): Stats => {
  return {
    strength: 5,
    vitality: 5,
    agility: 5,
    defense: 5,
    criticalChance: 1, // 기본 1% 치명타 확률
  };
};

// 초기 플레이어 상태
export const createPlayer = (classType: ClassType, savedData?: SavedGameData | null): Player => {
  const classInfo = getClassById(classType);
  
  // 직업 정보가 있으면 직업 스탯 사용, 없거나 savedData가 있으면 savedData 스탯 사용
  const stats = savedData?.stats || (classInfo ? classInfo.startingStats : createInitialStats());
  let maxHealth = 100 + (stats.vitality * 10);
  
  // 아티펙트 효과: 체력 증가
  const equippedArtifacts = savedData?.equippedArtifacts || [null, null, null];
  let healthBonus = equippedArtifacts.reduce((acc, artifact) => {
    if (!artifact) return acc;
    return acc + (artifact.effects.healthBonus || 0);
  }, 0);
  // 패시브 스킬: 체력 증가
  const availableSkillsForPassive = savedData?.availableSkills || [];
  const passiveHealthBonus = availableSkillsForPassive
    .filter((s): s is Skill => !!s?.isPassive && !!(s.passiveEffect?.healthBonus))
    .reduce((acc, s) => acc + (s.passiveEffect!.healthBonus ?? 0), 0);
  healthBonus += passiveHealthBonus;
  if (healthBonus !== 0) {
    maxHealth = Math.floor(maxHealth * (1 + healthBonus / 100));
  }
  
  // 직업의 시작 무기 또는 저장된 무기
  let weapon: Weapon;
  if (savedData?.weaponId) {
    weapon = ALL_WEAPONS.find(w => w.id === savedData.weaponId) || DEFAULT_WEAPON;
  } else if (classInfo) {
    weapon = ALL_WEAPONS.find(w => w.id === classInfo.startingWeaponId) || DEFAULT_WEAPON;
  } else {
    weapon = DEFAULT_WEAPON;
  }
  
  return {
    position: { x: 100, y: CANVAS_HEIGHT - 100 },
    velocity: { x: 0, y: 0 },
    width: 30,
    height: 40,
    health: savedData?.playerHealth ?? maxHealth,
    maxHealth,
    isJumping: false,
    isDodging: false,
    isAttacking: false,
    dodgeCooldown: 0,
    attackCooldown: 0,
    facingRight: true,
    level: savedData?.level || 1,
    experience: savedData?.experience || 0,
    experienceToNextLevel: 100,
    stats,
    statPoints: savedData?.statPoints || 0,
    equippedSkills: (() => {
      const raw = savedData?.equippedSkills || [...STARTER_SKILLS.map(s => ({ ...s }))];
      return [
        raw[0] ?? undefined,
        raw[1] ?? undefined,
        raw[2] ?? undefined,
      ] as (Skill | undefined)[];
    })(),
    availableSkills: savedData?.availableSkills || [...STARTER_SKILLS.map(s => ({ ...s }))],
    activeSkillEffects: [],
    weapon,
    weaponInventory: savedData?.weaponInventory || [], // 무기 인벤토리
    artifacts: savedData?.artifacts || [], // 보유 아티펙트
    equippedArtifacts: savedData?.equippedArtifacts || [null, null, null], // 장착된 아티펙트 (최대 3개)
    class: savedData?.class || classType,
  };
};

// 게임 상수
export const MAX_WAVE = 100;
export const MAX_WAVE_HELL = 500;

export const getMaxWave = (difficulty: 'normal' | 'hard' | 'hell'): number => {
  return difficulty === 'hell' ? MAX_WAVE_HELL : MAX_WAVE;
};

// 초기 보스 상태
export const createBoss = (wave: number, difficulty: 'normal' | 'hard' | 'hell' = 'normal'): Boss => {
  const phase = Math.floor((wave - 1) / 5) + 1;
  const isHellFinalBoss = difficulty === 'hell' && wave >= MAX_WAVE_HELL;

  let baseHealthMultiplier: number;
  let phaseBonus: number;

  if (difficulty === 'hell') {
    // 헬 모드: 500웨이브까지 완만하게 증가, 최종 보스는 특별 스케일
    baseHealthMultiplier = 1 + (wave - 1) * 0.2;
    phaseBonus = Math.pow(1.2, Math.min(phase - 1, 25));
    if (isHellFinalBoss) {
      baseHealthMultiplier *= 5; // 최종 보스 5배
    }
  } else if (difficulty === 'hard') {
    baseHealthMultiplier = (1 + (wave - 1) * 0.3) * 1.5;
    phaseBonus = Math.pow(1.3, Math.min(phase - 1, 19));
  } else {
    baseHealthMultiplier = 1 + (wave - 1) * 0.3;
    phaseBonus = Math.pow(1.3, Math.min(phase - 1, 19));
  }

  const healthMultiplier = baseHealthMultiplier * phaseBonus;
  const baseHealth = 100;

  return {
    position: { x: CANVAS_WIDTH - 150, y: CANVAS_HEIGHT - 200 },
    velocity: { x: 0, y: 0 },
    width: isHellFinalBoss ? 80 : 60,
    height: isHellFinalBoss ? 100 : 80,
    health: Math.floor(baseHealth * healthMultiplier),
    maxHealth: Math.floor(baseHealth * healthMultiplier),
    currentPattern: 0,
    patternCooldown: difficulty === 'hell' ? 60 : 80,
    isAttacking: false,
    debuffs: [],
  };
};

// 충돌 감지
export const checkCollision = (
  obj1: { position: { x: number; y: number }; width: number; height: number },
  obj2: { position: { x: number; y: number }; width: number; height: number }
): boolean => {
  return (
    obj1.position.x < obj2.position.x + obj2.width &&
    obj1.position.x + obj1.width > obj2.position.x &&
    obj1.position.y < obj2.position.y + obj2.height &&
    obj1.position.y + obj1.height > obj2.position.y
  );
};

// 투사체와 플랫폼 충돌 감지 (플랫폼은 position 없이 x, y 직접 가짐)
export const checkProjectilePlatformCollision = (
  projectile: { position: { x: number; y: number }; width: number; height: number },
  platform: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    projectile.position.x < platform.x + platform.width &&
    projectile.position.x + projectile.width > platform.x &&
    projectile.position.y < platform.y + platform.height &&
    projectile.position.y + projectile.height > platform.y
  );
};

// 플레이어 업데이트
export const updatePlayer = (player: Player, keys: Set<string>, platforms: Platform[]): Player => {
  const newPlayer = { ...player };

  // 스킬 쿨다운 감소 (빈 슬롯은 유지)
  newPlayer.equippedSkills = newPlayer.equippedSkills.map(skill =>
    skill
      ? { ...skill, currentCooldown: Math.max(0, skill.currentCooldown - 1) }
      : undefined
  );

  // 쿨다운 감소
  if (newPlayer.dodgeCooldown > 0) newPlayer.dodgeCooldown--;
  if (newPlayer.attackCooldown > 0) newPlayer.attackCooldown--;
  
  if (newPlayer.isDodging) {
    newPlayer.dodgeCooldown--;
    if (newPlayer.dodgeCooldown <= 0) {
      newPlayer.isDodging = false;
    }
  }

  if (newPlayer.isAttacking) {
    newPlayer.attackCooldown--;
    if (newPlayer.attackCooldown <= 0) {
      newPlayer.isAttacking = false;
    }
  }

  // 속도 보너스
  const speedBonus = 1 + (newPlayer.stats.agility * 0.05);
  const isBerserker = newPlayer.activeSkillEffects.includes('berserker');
  
  // 아티펙트 + 패시브 스킬: 이동속도 증가
  const artifactSpeedBonus = newPlayer.equippedArtifacts.reduce((acc, artifact) => {
    if (!artifact) return acc;
    return acc + (artifact.effects.speedBonus || 0);
  }, 0);
  const passiveEffects = getPassiveEffects(newPlayer);
  const finalSpeed = PLAYER_SPEED * speedBonus * (1 + (artifactSpeedBonus + passiveEffects.speedBonus) / 100) * (isBerserker ? 2 : 1);

  // 좌우 이동
  if (keys.has('a') || keys.has('A')) {
    newPlayer.velocity.x = -finalSpeed;
    newPlayer.facingRight = false;
  } else if (keys.has('d') || keys.has('D')) {
    newPlayer.velocity.x = finalSpeed;
    newPlayer.facingRight = true;
  } else {
    newPlayer.velocity.x = 0;
  }

  // 중력 적용
  newPlayer.velocity.y += GRAVITY;

  // 위치 업데이트
  newPlayer.position.x += newPlayer.velocity.x;
  newPlayer.position.y += newPlayer.velocity.y;

  // 화면 경계
  if (newPlayer.position.x < 0) newPlayer.position.x = 0;
  if (newPlayer.position.x + newPlayer.width > CANVAS_WIDTH) {
    newPlayer.position.x = CANVAS_WIDTH - newPlayer.width;
  }

  // 플랫폼 충돌 (위에서 아래로만 착지 가능, 아래에서 위로는 통과)
  platforms.forEach((platform) => {
    // 좌우로 겹치는지 확인
    const isOverlappingX = 
      newPlayer.position.x < platform.x + platform.width &&
      newPlayer.position.x + newPlayer.width > platform.x;
    
    // 아래로 이동 중이고, 플레이어 발이 플랫폼 안에 있을 때만 착지
    if (isOverlappingX && newPlayer.velocity.y > 0) {
      const playerBottom = newPlayer.position.y + newPlayer.height;
      const playerPrevBottom = newPlayer.position.y + newPlayer.height - newPlayer.velocity.y;
      
      // 이전 프레임에서는 플랫폼 위에 있었고, 현재는 플랫폼을 통과했을 때
      if (playerPrevBottom <= platform.y && playerBottom >= platform.y) {
        newPlayer.position.y = platform.y - newPlayer.height;
        newPlayer.velocity.y = 0;
        newPlayer.isJumping = false;
      }
    }
  });

  return newPlayer;
};

// 보스 패턴 업데이트
export const updateBoss = (
  boss: Boss,
  player: Player,
  projectiles: Projectile[],
  wave: number,
  difficulty: 'normal' | 'hard' | 'hell' = 'normal'
): { boss: Boss; projectiles: Projectile[] } => {
  const newBoss = { ...boss };
  const newProjectiles = [...projectiles];

  newBoss.patternCooldown--;

  if (newBoss.patternCooldown <= 0) {
    // 투사체 속도와 개수를 웨이브에 따라 증가하지만 상한선 설정
    const patternSpeed = Math.min(8, 3 + wave * 0.2); // 최대 속도 8
    const projectileCount = Math.min(20, 8 + Math.floor(wave * 0.8)); // 최대 20개

    // 데미지 계산 (웨이브가 높아질수록 증가하지만 완만하게)
    const baseDamage = Math.min(50, 10 + wave * 0.5); // 최대 50
    const mediumDamage = Math.min(45, 8 + wave * 0.4); // 최대 45
    const lowDamage = Math.min(40, 6 + wave * 0.3); // 최대 40
    
    // 웨이브에 따라 사용 가능한 패턴 개수 증가
    // Wave 1-4: 패턴 0-2 (3개)
    // Wave 5-9: 패턴 0-3 (4개)
    // Wave 10-14: 패턴 0-4 (5개)
    // Wave 15-99: 패턴 0-5 (6개)
    // Wave 100 (Normal): 패턴 0-9 (10개)
    // Wave 100 (Hard): 패턴 0-19 (20개)

    if (newBoss.currentPattern === 0) {
      // 패턴 0: 플레이어 조준 연속 발사
      const shotsCount = Math.min(5, 1 + Math.floor(wave / 3));
      for (let i = 0; i < shotsCount; i++) {
        const angle = Math.atan2(
          player.position.y - newBoss.position.y,
          player.position.x - newBoss.position.x
        ) + ((i - Math.floor(shotsCount / 2)) * 0.15);
        
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * patternSpeed, y: Math.sin(angle) * patternSpeed },
          width: 15,
          height: 15,
          damage: baseDamage,
          fromPlayer: false,
        });
      }
      newBoss.patternCooldown = 78; // 고정 쿨다운 (웨이브 1 기준)
      newBoss.currentPattern = 1;
    }
    else if (newBoss.currentPattern === 1) {
      // 패턴 1: 부채꼴 발사
      const directions = Math.min(7, 3 + Math.floor(wave / 4));
      for (let i = 0; i < directions; i++) {
        const angle = Math.atan2(
          player.position.y - newBoss.position.y,
          player.position.x - newBoss.position.x
        ) + ((i - Math.floor(directions / 2)) * Math.PI / 6);
        
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * (patternSpeed - 0.5), y: Math.sin(angle) * (patternSpeed - 0.5) },
          width: 12,
          height: 12,
          damage: mediumDamage,
          fromPlayer: false,
        });
      }
      newBoss.patternCooldown = 98; // 고정 쿨다운 (웨이브 1 기준)
      newBoss.currentPattern = 2;
    }
    else if (newBoss.currentPattern === 2) {
      // 패턴 2: 전방위 원형 발사
      for (let i = 0; i < projectileCount; i++) {
        const angle = (Math.PI * 2 / projectileCount) * i;
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * patternSpeed, y: Math.sin(angle) * patternSpeed },
          width: 10,
          height: 10,
          damage: lowDamage,
          fromPlayer: false,
        });
      }
      newBoss.patternCooldown = 127; // 고정 쿨다운 (웨이브 1 기준)
      newBoss.currentPattern = wave >= 5 ? 3 : 0;
    }
    else if (newBoss.currentPattern === 3 && wave >= 5) {
      // 패턴 3: 나선형 발사 (Wave 5+)
      const spiralCount = Math.min(4, 2 + Math.floor(wave / 10));
      for (let spiral = 0; spiral < spiralCount; spiral++) {
        const baseAngle = (Math.PI * 2 / spiralCount) * spiral;
        for (let i = 0; i < 3; i++) {
          const angle = baseAngle + i * 0.3;
          newProjectiles.push({
            position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
            velocity: { x: Math.cos(angle) * (patternSpeed + i * 0.5), y: Math.sin(angle) * (patternSpeed + i * 0.5) },
            width: 11,
            height: 11,
            damage: mediumDamage + 3,
            fromPlayer: false,
          });
        }
      }
      newBoss.patternCooldown = 108; // 고정 쿨다운 (웨이브 1 기준)
      newBoss.currentPattern = wave >= 10 ? 4 : 0;
    }
    else if (newBoss.currentPattern === 4 && wave >= 10) {
      // 패턴 4: 십자형 + 대각선 복합 발사 (Wave 10+)
      // 십자
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i;
        for (let j = 0; j < 3; j++) {
          newProjectiles.push({
            position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
            velocity: { x: Math.cos(angle) * (patternSpeed + j * 0.8), y: Math.sin(angle) * (patternSpeed + j * 0.8) },
            width: 13,
            height: 13,
            damage: baseDamage + 5,
            fromPlayer: false,
          });
        }
      }
      // 대각선
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i + Math.PI / 4;
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * patternSpeed * 1.2, y: Math.sin(angle) * patternSpeed * 1.2 },
          width: 14,
          height: 14,
          damage: baseDamage + 7,
          fromPlayer: false,
        });
      }
      newBoss.patternCooldown = 118; // 고정 쿨다운 (웨이브 1 기준)
      newBoss.currentPattern = wave >= 15 ? 5 : 0;
    }
    else if (newBoss.currentPattern === 5 && wave >= 15) {
      // 패턴 5: 추적탄 + 랜덤 탄막 (Wave 15+)
      // 추적탄
      for (let i = 0; i < 5; i++) {
        const angle = Math.atan2(
          player.position.y - newBoss.position.y,
          player.position.x - newBoss.position.x
        ) + (Math.random() - 0.5) * 0.4;
        
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * (patternSpeed * 1.3), y: Math.sin(angle) * (patternSpeed * 1.3) },
          width: 16,
          height: 16,
          damage: baseDamage + 10,
          fromPlayer: false,
        });
      }
      // 랜덤 탄막
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * patternSpeed, y: Math.sin(angle) * patternSpeed },
          width: 12,
          height: 12,
          damage: mediumDamage + 5,
          fromPlayer: false,
        });
      }
      newBoss.patternCooldown = 138; // 고정 쿨다운 (웨이브 1 기준)
      newBoss.currentPattern = wave >= 100 ? 6 : 0;
    }
    else if (newBoss.currentPattern === 6 && wave >= 100) {
      // 패턴 6: 회전 레이저 (Wave 100)
      const rayCount = 8;
      const rotationOffset = Date.now() * 0.003; // 회전 효과
      for (let i = 0; i < rayCount; i++) {
        const angle = (Math.PI * 2 / rayCount) * i + rotationOffset;
        for (let j = 0; j < 4; j++) {
          newProjectiles.push({
            position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
            velocity: { x: Math.cos(angle) * (patternSpeed * 1.5 + j * 0.5), y: Math.sin(angle) * (patternSpeed * 1.5 + j * 0.5) },
            width: 15,
            height: 15,
            damage: baseDamage + 12,
            fromPlayer: false,
          });
        }
      }
      newBoss.patternCooldown = 95;
      newBoss.currentPattern = 7;
    }
    else if (newBoss.currentPattern === 7 && wave >= 100) {
      // 패턴 7: 폭발형 탄막 (Wave 100)
      // 중심에서 폭발하듯이 퍼져나가는 패턴
      for (let ring = 0; ring < 3; ring++) {
        const ringShotsCount = 12 + ring * 4;
        for (let i = 0; i < ringShotsCount; i++) {
          const angle = (Math.PI * 2 / ringShotsCount) * i;
          newProjectiles.push({
            position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
            velocity: { 
              x: Math.cos(angle) * (patternSpeed * 0.8 + ring * 1.2), 
              y: Math.sin(angle) * (patternSpeed * 0.8 + ring * 1.2) 
            },
            width: 11 + ring * 2,
            height: 11 + ring * 2,
            damage: baseDamage + 8 + ring * 3,
            fromPlayer: false,
          });
        }
      }
      newBoss.patternCooldown = 110;
      newBoss.currentPattern = 8;
    }
    else if (newBoss.currentPattern === 8 && wave >= 100) {
      // 패턴 8: 지그재그 탄막 (Wave 100)
      const waveCount = 5;
      for (let wave = 0; wave < waveCount; wave++) {
        for (let i = 0; i < 7; i++) {
          const baseAngle = Math.atan2(
            player.position.y - newBoss.position.y,
            player.position.x - newBoss.position.x
          );
          const zigzagOffset = Math.sin(wave * Math.PI / 2) * 0.8;
          const angle = baseAngle + ((i - 3) * 0.25) + zigzagOffset;
          
          newProjectiles.push({
            position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
            velocity: { 
              x: Math.cos(angle) * (patternSpeed + wave * 0.3), 
              y: Math.sin(angle) * (patternSpeed + wave * 0.3) 
            },
            width: 13,
            height: 13,
            damage: baseDamage + 10,
            fromPlayer: false,
          });
        }
      }
      newBoss.patternCooldown = 88;
      newBoss.currentPattern = 9;
    }
    else if (newBoss.currentPattern === 9 && wave >= 100) {
      // 패턴 9: 카오스 스톰 (Wave 100 - 최종 패턴)
      // 모든 방향 + 추적 + 랜덤의 조합
      
      // 1. 전방위 고속 탄막
      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 / 24) * i;
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * patternSpeed * 1.8, y: Math.sin(angle) * patternSpeed * 1.8 },
          width: 14,
          height: 14,
          damage: baseDamage + 15,
          fromPlayer: false,
        });
      }
      
      // 2. 플레이어 집중 추적탄
      for (let i = 0; i < 8; i++) {
        const angle = Math.atan2(
          player.position.y - newBoss.position.y,
          player.position.x - newBoss.position.x
        ) + (Math.random() - 0.5) * 0.6;
        
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * patternSpeed * 2, y: Math.sin(angle) * patternSpeed * 2 },
          width: 18,
          height: 18,
          damage: baseDamage + 20,
          fromPlayer: false,
        });
      }
      
      // 3. 랜덤 폭탄
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = patternSpeed * (0.5 + Math.random() * 1.5);
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          width: 16,
          height: 16,
          damage: baseDamage + 18,
          fromPlayer: false,
        });
      }
      
      newBoss.patternCooldown = 150;
      newBoss.currentPattern = wave >= 100 && difficulty === 'hard' ? 10 : 0;
    }
    // 하드 모드 전용 패턴 (10-19)
    else if (newBoss.currentPattern === 10 && wave >= 100 && difficulty === 'hard') {
      // 패턴 10: 십자 + X자 레이저 (Hard)
      for (let ring = 0; ring < 2; ring++) {
        // 십자
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i;
          for (let j = 0; j < 5; j++) {
            newProjectiles.push({
              position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
              velocity: { x: Math.cos(angle) * (patternSpeed + j * 0.6 + ring * 2), y: Math.sin(angle) * (patternSpeed + j * 0.6 + ring * 2) },
              width: 14,
              height: 14,
              damage: baseDamage + 15,
              fromPlayer: false,
            });
          }
        }
        // X자
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i + Math.PI / 4;
          for (let j = 0; j < 5; j++) {
            newProjectiles.push({
              position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
              velocity: { x: Math.cos(angle) * (patternSpeed + j * 0.6 + ring * 2), y: Math.sin(angle) * (patternSpeed + j * 0.6 + ring * 2) },
              width: 14,
              height: 14,
              damage: baseDamage + 15,
              fromPlayer: false,
            });
          }
        }
      }
      newBoss.patternCooldown = 120;
      newBoss.currentPattern = 11;
    }
    else if (newBoss.currentPattern === 11 && wave >= 100 && difficulty === 'hard') {
      // 패턴 11: 집중 포화 (Hard)
      for (let burst = 0; burst < 5; burst++) {
        const burstAngle = Math.atan2(
          player.position.y - newBoss.position.y,
          player.position.x - newBoss.position.x
        ) + (burst - 2) * 0.3;
        
        for (let i = 0; i < 8; i++) {
          newProjectiles.push({
            position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
            velocity: { x: Math.cos(burstAngle) * (patternSpeed + i * 0.8), y: Math.sin(burstAngle) * (patternSpeed + i * 0.8) },
            width: 17,
            height: 17,
            damage: baseDamage + 25,
            fromPlayer: false,
          });
        }
      }
      newBoss.patternCooldown = 100;
      newBoss.currentPattern = 12;
    }
    else if (newBoss.currentPattern === 12 && wave >= 100 && difficulty === 'hard') {
      // 패턴 12: 트리플 스파이럴 (Hard)
      for (let spiral = 0; spiral < 3; spiral++) {
        const spiralOffset = (Math.PI * 2 / 3) * spiral;
        for (let i = 0; i < 12; i++) {
          const angle = spiralOffset + i * 0.4;
          for (let speed = 0; speed < 3; speed++) {
            newProjectiles.push({
              position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
              velocity: { x: Math.cos(angle) * (patternSpeed + speed * 1.5), y: Math.sin(angle) * (patternSpeed + speed * 1.5) },
              width: 13,
              height: 13,
              damage: baseDamage + 18,
              fromPlayer: false,
            });
          }
        }
      }
      newBoss.patternCooldown = 130;
      newBoss.currentPattern = 13;
    }
    else if (newBoss.currentPattern === 13 && wave >= 100 && difficulty === 'hard') {
      // 패턴 13: 플레이어 덫 (Hard) - 플레이어 위치를 둘러싸듯
      const trapCount = 16;
      for (let i = 0; i < trapCount; i++) {
        const angle = (Math.PI * 2 / trapCount) * i;
        const offsetDistance = 100;
        const trapX = player.position.x + Math.cos(angle) * offsetDistance;
        const trapY = player.position.y + Math.sin(angle) * offsetDistance;
        const angleToCenter = Math.atan2(player.position.y - trapY, player.position.x - trapX);
        
        newProjectiles.push({
          position: { x: trapX, y: trapY },
          velocity: { x: Math.cos(angleToCenter) * patternSpeed * 1.5, y: Math.sin(angleToCenter) * patternSpeed * 1.5 },
          width: 16,
          height: 16,
          damage: baseDamage + 22,
          fromPlayer: false,
        });
      }
      newBoss.patternCooldown = 110;
      newBoss.currentPattern = 14;
    }
    else if (newBoss.currentPattern === 14 && wave >= 100 && difficulty === 'hard') {
      // 패턴 14: 5중 원형 탄막 (Hard)
      for (let ring = 0; ring < 5; ring++) {
        const ringCount = 10 + ring * 3;
        const ringSpeed = patternSpeed * (0.6 + ring * 0.3);
        for (let i = 0; i < ringCount; i++) {
          const angle = (Math.PI * 2 / ringCount) * i;
          newProjectiles.push({
            position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
            velocity: { x: Math.cos(angle) * ringSpeed, y: Math.sin(angle) * ringSpeed },
            width: 12 + ring,
            height: 12 + ring,
            damage: baseDamage + 12 + ring * 3,
            fromPlayer: false,
          });
        }
      }
      newBoss.patternCooldown = 140;
      newBoss.currentPattern = 15;
    }
    else if (newBoss.currentPattern === 15 && wave >= 100 && difficulty === 'hard') {
      // 패턴 15: 랜덤 폭격 (Hard)
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = patternSpeed * (0.3 + Math.random() * 2);
        const size = 12 + Math.floor(Math.random() * 8);
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          width: size,
          height: size,
          damage: baseDamage + 10 + size,
          fromPlayer: false,
        });
      }
      newBoss.patternCooldown = 90;
      newBoss.currentPattern = 16;
    }
    else if (newBoss.currentPattern === 16 && wave >= 100 && difficulty === 'hard') {
      // 패턴 16: 8방향 연속 공격 (Hard)
      for (let direction = 0; direction < 8; direction++) {
        const baseAngle = (Math.PI * 2 / 8) * direction;
        for (let wave = 0; wave < 6; wave++) {
          for (let spread = 0; spread < 3; spread++) {
            const angle = baseAngle + (spread - 1) * 0.2;
            newProjectiles.push({
              position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
              velocity: { x: Math.cos(angle) * (patternSpeed + wave * 0.7), y: Math.sin(angle) * (patternSpeed + wave * 0.7) },
              width: 14,
              height: 14,
              damage: baseDamage + 16,
              fromPlayer: false,
            });
          }
        }
      }
      newBoss.patternCooldown = 125;
      newBoss.currentPattern = 17;
    }
    else if (newBoss.currentPattern === 17 && wave >= 100 && difficulty === 'hard') {
      // 패턴 17: 회오리 (Hard)
      for (let tornado = 0; tornado < 4; tornado++) {
        const tornadoAngle = (Math.PI * 2 / 4) * tornado;
        for (let i = 0; i < 15; i++) {
          const spiralAngle = tornadoAngle + i * 0.5;
          const spiralRadius = i * 0.8;
          newProjectiles.push({
            position: { 
              x: newBoss.position.x + newBoss.width / 2 + Math.cos(spiralAngle) * spiralRadius,
              y: newBoss.position.y + newBoss.height / 2 + Math.sin(spiralAngle) * spiralRadius
            },
            velocity: { x: Math.cos(spiralAngle) * patternSpeed * 1.3, y: Math.sin(spiralAngle) * patternSpeed * 1.3 },
            width: 15,
            height: 15,
            damage: baseDamage + 20,
            fromPlayer: false,
          });
        }
      }
      newBoss.patternCooldown = 115;
      newBoss.currentPattern = 18;
    }
    else if (newBoss.currentPattern === 18 && wave >= 100 && difficulty === 'hard') {
      // 패턴 18: 추적 + 방해 (Hard)
      // 고속 추적탄
      for (let i = 0; i < 12; i++) {
        const angle = Math.atan2(
          player.position.y - newBoss.position.y,
          player.position.x - newBoss.position.x
        ) + (Math.random() - 0.5) * 0.8;
        
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * patternSpeed * 2.2, y: Math.sin(angle) * patternSpeed * 2.2 },
          width: 19,
          height: 19,
          damage: baseDamage + 28,
          fromPlayer: false,
        });
      }
      // 방해 탄막
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * patternSpeed * 0.7, y: Math.sin(angle) * patternSpeed * 0.7 },
          width: 13,
          height: 13,
          damage: baseDamage + 12,
          fromPlayer: false,
        });
      }
      newBoss.patternCooldown = 105;
      newBoss.currentPattern = 19;
    }
    else if (newBoss.currentPattern === 19 && wave >= 100 && difficulty === 'hard') {
      // 패턴 19: 종말 (Hard - 최종 패턴)
      // 1. 전방위 초고속 탄막
      for (let i = 0; i < 36; i++) {
        const angle = (Math.PI * 2 / 36) * i;
        for (let speed = 0; speed < 3; speed++) {
          newProjectiles.push({
            position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
            velocity: { x: Math.cos(angle) * (patternSpeed * 2 + speed), y: Math.sin(angle) * (patternSpeed * 2 + speed) },
            width: 16,
            height: 16,
            damage: baseDamage + 22,
            fromPlayer: false,
          });
        }
      }
      
      // 2. 초강력 추적탄
      for (let i = 0; i < 15; i++) {
        const angle = Math.atan2(
          player.position.y - newBoss.position.y,
          player.position.x - newBoss.position.x
        ) + (Math.random() - 0.5);
        
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * patternSpeed * 2.5, y: Math.sin(angle) * patternSpeed * 2.5 },
          width: 22,
          height: 22,
          damage: baseDamage + 35,
          fromPlayer: false,
        });
      }
      
      // 3. 랜덤 대형 폭탄
      for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = patternSpeed * (Math.random() * 2.5);
        newProjectiles.push({
          position: { x: newBoss.position.x + newBoss.width / 2, y: newBoss.position.y + newBoss.height / 2 },
          velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          width: 20,
          height: 20,
          damage: baseDamage + 30,
          fromPlayer: false,
        });
      }
      
      newBoss.patternCooldown = 180;
      newBoss.currentPattern = 0;
    }
    // ======= 헬 모드 최종 보스 전용 패턴 (20~119) =======
    else if (difficulty === 'hell' && wave >= MAX_WAVE_HELL) {
      const hs = Math.min(22, 8 + wave * 0.02);  // 헬 속도
      const hd = Math.min(300, 25 + wave * 0.55); // 헬 데미지
      const hc = Math.min(50, 20 + Math.floor(wave * 0.06)); // 헬 발사체 수
      const p = newBoss.currentPattern; // 현재 패턴 0~99
      const bx = newBoss.position.x + newBoss.width / 2;
      const by = newBoss.position.y + newBoss.height / 2;
      const aimAngle = Math.atan2(player.position.y - by, player.position.x - bx);

      const push = (angle: number, speed: number, dmg: number, sz: number) => {
        newProjectiles.push({
          position: { x: bx, y: by },
          velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          width: sz, height: sz, damage: dmg, fromPlayer: false,
        });
      };

      const group = Math.floor(p / 5); // 0~19 그룹
      const v = p % 5;                 // 그룹 내 변형 0~4

      if (group === 0) {
        // 0~4: 조준 집중 발사 (퍼짐 정도 변화)
        const spread = 0.1 + v * 0.12;
        for (let i = 0; i < 10 + v * 3; i++) {
          push(aimAngle + (Math.random() - 0.5) * spread * 2, hs * (0.8 + Math.random() * 0.5), hd, 14 + v * 2);
        }
        newBoss.patternCooldown = 55 + v * 5;
      } else if (group === 1) {
        // 5~9: 부채꼴 확산 (방향 수 변화)
        const dirs = 5 + v * 3;
        for (let i = 0; i < dirs; i++) {
          push(aimAngle + (i - Math.floor(dirs / 2)) * (Math.PI / (8 + v)), hs + v * 0.5, hd + v * 10, 15);
        }
        newBoss.patternCooldown = 60 + v * 4;
      } else if (group === 2) {
        // 10~14: 원형 전방위 발사 (링 수 변화)
        const rings = 1 + v;
        for (let r = 0; r < rings; r++) {
          const cnt = hc + r * 4;
          for (let i = 0; i < cnt; i++) {
            const ang = (Math.PI * 2 / cnt) * i + r * 0.15;
            push(ang, hs * (0.7 + r * 0.3), hd + r * 8, 12 + r * 2);
          }
        }
        newBoss.patternCooldown = 80 + v * 10;
      } else if (group === 3) {
        // 15~19: 나선 발사 (팔 수 변화)
        const arms = 2 + v;
        for (let arm = 0; arm < arms; arm++) {
          const base = (Math.PI * 2 / arms) * arm;
          for (let i = 0; i < 6; i++) {
            push(base + i * 0.35, hs * (0.8 + i * 0.15), hd + i * 5, 13);
          }
        }
        newBoss.patternCooldown = 65 + v * 5;
      } else if (group === 4) {
        // 20~24: 십자 + 대각선 복합 (파 수 변화)
        const waves2 = 1 + v;
        for (let w2 = 0; w2 < waves2; w2++) {
          for (let i = 0; i < 8; i++) {
            const ang = (Math.PI / 4) * i;
            for (let j = 0; j < 4; j++) {
              push(ang, hs * (0.8 + j * 0.3 + w2 * 0.2), hd + j * 6 + w2 * 5, 14);
            }
          }
        }
        newBoss.patternCooldown = 90 + v * 8;
      } else if (group === 5) {
        // 25~29: 원형 + 조준 혼합
        for (let i = 0; i < hc; i++) {
          push((Math.PI * 2 / hc) * i, hs, hd, 12);
        }
        for (let i = 0; i < 5 + v * 2; i++) {
          push(aimAngle + (i - (5 + v * 2) / 2) * 0.2, hs * 1.5, hd + 20, 16);
        }
        newBoss.patternCooldown = 100 + v * 5;
      } else if (group === 6) {
        // 30~34: 고속 추적탄 (수 변화)
        const cnt = 6 + v * 4;
        for (let i = 0; i < cnt; i++) {
          push(aimAngle + (Math.random() - 0.5) * (0.3 + v * 0.1), hs * (1.5 + v * 0.2), hd + 15 + v * 8, 18 + v);
        }
        newBoss.patternCooldown = 55 + v * 5;
      } else if (group === 7) {
        // 35~39: 무작위 폭격 (크기/속도 변화)
        const cnt2 = 20 + v * 8;
        for (let i = 0; i < cnt2; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = hs * (0.4 + Math.random() * (1.2 + v * 0.2));
          const sz = 12 + Math.floor(Math.random() * (6 + v * 2));
          push(ang, spd, hd + sz, sz);
        }
        newBoss.patternCooldown = 70 + v * 5;
      } else if (group === 8) {
        // 40~44: 스윕 (좌우 쓸기)
        const sweepCount = 12 + v * 3;
        for (let i = 0; i < sweepCount; i++) {
          const ang = -Math.PI / 2 + (Math.PI / (sweepCount - 1)) * i + v * 0.1;
          push(ang, hs * (1 + v * 0.1), hd + v * 5, 14);
        }
        newBoss.patternCooldown = 60 + v * 5;
      } else if (group === 9) {
        // 45~49: 밀집 집중탄
        for (let i = 0; i < 8 + v * 2; i++) {
          for (let j = 0; j < 4 + v; j++) {
            push(aimAngle + (i - (8 + v * 2) / 2) * 0.15, hs * (0.8 + j * 0.35), hd + j * 8 + i * 2, 13 + v);
          }
        }
        newBoss.patternCooldown = 110 + v * 8;
      } else if (group === 10) {
        // 50~54: 회전 레이저 패턴
        const rotOff = Date.now() * (0.003 + v * 0.001);
        const rayCount = 6 + v * 2;
        for (let i = 0; i < rayCount; i++) {
          const ang = (Math.PI * 2 / rayCount) * i + rotOff;
          for (let j = 0; j < 5; j++) {
            push(ang, hs * (1.2 + j * 0.3), hd + j * 6, 14 + j);
          }
        }
        newBoss.patternCooldown = 75 + v * 5;
      } else if (group === 11) {
        // 55~59: 포위 덫 (플레이어 주변에서 안쪽으로)
        const trapN = 12 + v * 4;
        const dist = 120 + v * 20;
        for (let i = 0; i < trapN; i++) {
          const ang = (Math.PI * 2 / trapN) * i;
          const tx = player.position.x + Math.cos(ang) * dist;
          const ty = player.position.y + Math.sin(ang) * dist;
          const toCenter = Math.atan2(player.position.y - ty, player.position.x - tx);
          newProjectiles.push({
            position: { x: tx, y: ty },
            velocity: { x: Math.cos(toCenter) * hs * 1.2, y: Math.sin(toCenter) * hs * 1.2 },
            width: 14 + v, height: 14 + v, damage: hd + 20 + v * 5, fromPlayer: false,
          });
        }
        newBoss.patternCooldown = 85 + v * 8;
      } else if (group === 12) {
        // 60~64: 다방향 동시 폭발
        const dirs2 = 3 + v;
        for (let d = 0; d < dirs2; d++) {
          const baseAng = (Math.PI * 2 / dirs2) * d + aimAngle;
          for (let i = 0; i < 8; i++) {
            push(baseAng + (i - 3.5) * 0.2, hs * (0.9 + i * 0.15), hd + i * 4, 13 + d);
          }
        }
        newBoss.patternCooldown = 80 + v * 6;
      } else if (group === 13) {
        // 65~69: 펄스 패턴 (빠른 연속 원형)
        const pulses = 2 + v;
        for (let pu = 0; pu < pulses; pu++) {
          const cnt3 = 16 + pu * 4;
          for (let i = 0; i < cnt3; i++) {
            const ang = (Math.PI * 2 / cnt3) * i + pu * 0.2;
            push(ang, hs * (0.6 + pu * 0.4), hd + pu * 12, 11 + pu * 2);
          }
        }
        newBoss.patternCooldown = 90 + v * 5;
      } else if (group === 14) {
        // 70~74: 화면 가장자리에서 수렴
        const edges = 16 + v * 4;
        for (let i = 0; i < edges; i++) {
          const frac = i / edges;
          let ex: number, ey: number;
          if (frac < 0.25) { ex = CANVAS_WIDTH * frac * 4; ey = 0; }
          else if (frac < 0.5) { ex = CANVAS_WIDTH; ey = CANVAS_HEIGHT * (frac - 0.25) * 4; }
          else if (frac < 0.75) { ex = CANVAS_WIDTH * (1 - (frac - 0.5) * 4); ey = CANVAS_HEIGHT; }
          else { ex = 0; ey = CANVAS_HEIGHT * (1 - (frac - 0.75) * 4); }
          const toPx = Math.atan2(player.position.y - ey, player.position.x - ex);
          newProjectiles.push({
            position: { x: ex, y: ey },
            velocity: { x: Math.cos(toPx) * hs, y: Math.sin(toPx) * hs },
            width: 13 + v, height: 13 + v, damage: hd + 15, fromPlayer: false,
          });
        }
        newBoss.patternCooldown = 95 + v * 5;
      } else if (group === 15) {
        // 75~79: 다층 동심원 발사
        const layers = 2 + v;
        for (let l = 0; l < layers; l++) {
          const cnt4 = 10 + l * 5 + v * 2;
          for (let i = 0; i < cnt4; i++) {
            const ang = (Math.PI * 2 / cnt4) * i + l * (Math.PI / cnt4);
            push(ang, hs * (0.5 + l * 0.4), hd + l * 10 + v * 5, 12 + l * 2);
          }
        }
        newBoss.patternCooldown = 105 + v * 8;
      } else if (group === 16) {
        // 80~84: 폭발 확산 (여러 중심점)
        const centers = 2 + v;
        for (let c = 0; c < centers; c++) {
          const cx = bx + Math.cos((Math.PI * 2 / centers) * c) * 50;
          const cy = by + Math.sin((Math.PI * 2 / centers) * c) * 50;
          const cnt5 = 10 + v * 3;
          for (let i = 0; i < cnt5; i++) {
            const ang = (Math.PI * 2 / cnt5) * i;
            newProjectiles.push({
              position: { x: cx, y: cy },
              velocity: { x: Math.cos(ang) * hs * 1.2, y: Math.sin(ang) * hs * 1.2 },
              width: 14, height: 14, damage: hd + c * 8 + v * 5, fromPlayer: false,
            });
          }
        }
        newBoss.patternCooldown = 100 + v * 5;
      } else if (group === 17) {
        // 85~89: 쇄도 폭격 (연속 원형 조합)
        for (let burst = 0; burst < 3 + v; burst++) {
          const cnt6 = 8 + burst * 4;
          for (let i = 0; i < cnt6; i++) {
            const ang = (Math.PI * 2 / cnt6) * i + burst * 0.3;
            push(ang, hs * (0.8 + burst * 0.25), hd + burst * 10 + v * 5, 12 + burst * 2);
          }
        }
        newBoss.patternCooldown = 120 + v * 5;
      } else if (group === 18) {
        // 90~94: 폭풍 (조준 + 원형 + 랜덤 동시)
        // 조준
        for (let i = 0; i < 6 + v * 2; i++) {
          push(aimAngle + (Math.random() - 0.5) * 0.5, hs * 2, hd + 30, 18);
        }
        // 원형
        for (let i = 0; i < 20 + v * 4; i++) {
          push((Math.PI * 2 / (20 + v * 4)) * i, hs, hd, 11);
        }
        // 랜덤
        for (let i = 0; i < 10 + v * 3; i++) {
          push(Math.random() * Math.PI * 2, hs * (0.5 + Math.random() * 1.5), hd + 15, 13);
        }
        newBoss.patternCooldown = 140 + v * 10;
      } else {
        // 95~99: 종말의 폭풍 (최대 밀도)
        // 1. 초고속 조준 집중탄
        for (let i = 0; i < 20 + v * 4; i++) {
          push(aimAngle + (Math.random() - 0.5) * (0.2 + v * 0.1), hs * 2.5, hd + 40 + v * 10, 20);
        }
        // 2. 삼중 원형
        for (let r = 0; r < 3; r++) {
          const rCnt = 18 + r * 6 + v * 3;
          for (let i = 0; i < rCnt; i++) {
            push((Math.PI * 2 / rCnt) * i + r * 0.15, hs * (0.8 + r * 0.4), hd + r * 15 + v * 8, 12 + r * 2);
          }
        }
        // 3. 전방위 대형탄
        for (let i = 0; i < 36; i++) {
          push((Math.PI * 2 / 36) * i, hs * 1.5, hd + 25 + v * 6, 16);
        }
        newBoss.patternCooldown = 160 + v * 12;
      }

      newBoss.currentPattern = (p + 1) % 100;
    }
    else {
      // 패턴이 범위를 벗어난 경우 0으로 리셋
      newBoss.currentPattern = 0;
    }
  }

  // 디버프 체크 (스턴, 둔화)
  const isStunned = newBoss.debuffs.some(d => d.stunned);
  const slowDebuff = newBoss.debuffs.find(d => d.slowAmount);
  const slowMultiplier = slowDebuff ? (1 - (slowDebuff.slowAmount ?? 0)) : 1;

  // 보스 이동 (좌우 + 상하) - 스턴되지 않았을 때만
  if (!isStunned) {
    const moveChance = 0.02 + wave * 0.005;
    if (Math.random() < moveChance) {
      newBoss.velocity.x = (Math.random() - 0.5) * (2 + wave * 0.2) * slowMultiplier;
    }
    
    // 상하 이동 추가
    if (Math.random() < moveChance * 0.8) {
      newBoss.velocity.y = (Math.random() - 0.5) * (1.5 + wave * 0.15) * slowMultiplier;
    }

    newBoss.position.x += newBoss.velocity.x;
    newBoss.position.y += newBoss.velocity.y;
  } else {
    // 스턴 상태에서는 속도를 0으로
    newBoss.velocity.x = 0;
    newBoss.velocity.y = 0;
  }

  // 보스 좌우 경계
  if (newBoss.position.x < CANVAS_WIDTH / 2) {
    newBoss.position.x = CANVAS_WIDTH / 2;
    newBoss.velocity.x = Math.abs(newBoss.velocity.x);
  }
  if (newBoss.position.x + newBoss.width > CANVAS_WIDTH) {
    newBoss.position.x = CANVAS_WIDTH - newBoss.width;
    newBoss.velocity.x = -Math.abs(newBoss.velocity.x);
  }
  
  // 보스 상하 경계
  if (newBoss.position.y < 50) {
    newBoss.position.y = 50;
    newBoss.velocity.y = Math.abs(newBoss.velocity.y);
  }
  if (newBoss.position.y + newBoss.height > CANVAS_HEIGHT - 100) {
    newBoss.position.y = CANVAS_HEIGHT - 100 - newBoss.height;
    newBoss.velocity.y = -Math.abs(newBoss.velocity.y);
  }

  return { boss: newBoss, projectiles: newProjectiles };
};

// 투사체 업데이트
export const updateProjectiles = (projectiles: Projectile[], hasSlowEffect: boolean): Projectile[] => {
  const slowMultiplier = hasSlowEffect ? 0.3 : 1;
  
  return projectiles
    .map((proj) => ({
      ...proj,
      position: {
        x: proj.position.x + proj.velocity.x * (proj.fromPlayer ? 1 : slowMultiplier),
        y: proj.position.y + proj.velocity.y * (proj.fromPlayer ? 1 : slowMultiplier),
      },
    }))
    .filter(
      (proj) =>
        proj.position.x > -50 &&
        proj.position.x < CANVAS_WIDTH + 50 &&
        proj.position.y > -50 &&
        proj.position.y < CANVAS_HEIGHT + 50
    );
};

/** 패시브 스킬 효과 합산 (보유 중인 패시브 스킬만) */
export const getPassiveEffects = (player: Player): Required<PassiveSkillEffect> => {
  const init: Required<PassiveSkillEffect> = {
    damageBonus: 0,
    critChanceBonus: 0,
    healthBonus: 0,
    defenseBonus: 0,
    speedBonus: 0,
    expBonus: 0,
  };
  return (player.availableSkills || [])
    .filter((s): s is Skill => !!s?.isPassive && !!s.passiveEffect)
    .reduce((acc, s) => {
      const e = s.passiveEffect!;
      return {
        damageBonus: acc.damageBonus + (e.damageBonus ?? 0),
        critChanceBonus: acc.critChanceBonus + (e.critChanceBonus ?? 0),
        healthBonus: acc.healthBonus + (e.healthBonus ?? 0),
        defenseBonus: acc.defenseBonus + (e.defenseBonus ?? 0),
        speedBonus: acc.speedBonus + (e.speedBonus ?? 0),
        expBonus: acc.expBonus + (e.expBonus ?? 0),
      };
    }, init);
};

// 경험치 계산 (웨이브가 올라갈수록 더 많은 경험치)
export const calculateExperienceReward = (wave: number, player?: Player): number => {
  // 기본 경험치 + (웨이브 * 50) + (웨이브^1.3 * 8)
  const baseExp = 100;
  const linearBonus = wave * 50;
  const exponentialBonus = Math.floor(Math.pow(wave, 1.3) * 8);
  
  let exp = baseExp + linearBonus + exponentialBonus;
  
  // 아티펙트 효과 적용
  if (player?.equippedArtifacts) {
    const expMultiplier = player.equippedArtifacts.reduce((mult, artifact) => {
      if (artifact?.effects.expMultiplier) {
        return mult * artifact.effects.expMultiplier;
      }
      return mult;
    }, 1);
    exp = Math.floor(exp * expMultiplier);
  }
  
  // 패시브 스킬: 경험치 증가
  if (player) {
    const passive = getPassiveEffects(player);
    if (passive.expBonus > 0) {
      exp = Math.floor(exp * (1 + passive.expBonus / 100));
    }
  }
  
  return exp;
};

// 레벨업 체크
export const checkLevelUp = (player: Player): { player: Player; leveledUp: boolean } => {
  if (player.experience >= player.experienceToNextLevel) {
    // 남은 경험치 계산: (현재 경험치) - (필요 경험치)
    const remainingExp = player.experience - player.experienceToNextLevel;
    
    return {
      player: {
        ...player,
        level: player.level + 1,
        experience: remainingExp, // 남은 경험치를 다음 레벨로 이월
        experienceToNextLevel: Math.floor(player.experienceToNextLevel * 1.5),
        statPoints: player.statPoints + 3,
      },
      leveledUp: true,
    };
  }
  return { player, leveledUp: false };
};

// 무기 강화 함수 (공격력과 공격속도만 강화)
export const upgradeWeapon = (weapon: Weapon): Weapon => {
  const currentLevel = weapon.upgradeLevel || 0;
  const newLevel = currentLevel + 1;
  
  // 공격력 강화 배율 (레벨당 10% 증가)
  const damageMultiplier = 1 + (newLevel * 0.1);
  
  // 공격속도 강화 (5% 증가, 쿨다운 숫자는 감소)
  const attackSpeedMultiplier = 0.95;
  
  return {
    ...weapon,
    upgradeLevel: newLevel,
    damage: Math.floor(weapon.damage * damageMultiplier), // 공격력만 강화
    attackSpeed: Math.max(1, Math.floor(weapon.attackSpeed * attackSpeedMultiplier)), // 공격속도만 강화
    // range와 elementalDamage는 강화하지 않음
  };
};

// 무기 진화 가능 여부 확인
export const canEvolveWeapon = (weapon: Weapon): boolean => {
  if (weapon.isEvolved) return false; // 이미 진화한 무기는 불가
  const evolutionInfo = EVOLUTION_MAP[weapon.id];
  if (!evolutionInfo) return false; // 진화 정보가 없는 무기
  const currentLevel = weapon.upgradeLevel || 0;
  return currentLevel >= evolutionInfo.requiredLevel;
};

// 무기 진화 함수
export const evolveWeapon = (weapon: Weapon): Weapon | null => {
  const evolutionInfo = EVOLUTION_MAP[weapon.id];
  if (!evolutionInfo) return null;
  
  const evolvedWeapon = EVOLVED_WEAPONS.find(w => w.id === evolutionInfo.evolvedId);
  if (!evolvedWeapon) return null;
  
  // 진화된 무기에 현재 강화 레벨을 그대로 적용 (100%)
  const currentLevel = weapon.upgradeLevel || 0;
  const transferredLevel = currentLevel;
  
  let finalWeapon = { ...evolvedWeapon, upgradeLevel: transferredLevel };
  
  // 이전 강화 레벨을 그대로 적용
  if (transferredLevel > 0) {
    const upgradeMultiplier = 1 + (transferredLevel * 0.1);
    finalWeapon = {
      ...finalWeapon,
      damage: Math.floor(evolvedWeapon.damage * upgradeMultiplier),
      attackSpeed: Math.max(1, Math.floor(evolvedWeapon.attackSpeed * Math.pow(0.95, transferredLevel))),
      range: Math.floor(evolvedWeapon.range * (1 + transferredLevel * 0.05)),
      elementalDamage: evolvedWeapon.elementalDamage ? Math.floor(evolvedWeapon.elementalDamage * upgradeMultiplier) : undefined,
    };
  }
  
  return finalWeapon;
};

// 보상 선택지 생성 (3개)
export const generateRewardOptions = (player: Player, _wave: number): RewardOption[] => {
  const options: RewardOption[] = [];
  
  // 플레이어 직업에 맞는 스킬 필터링
  const unlockedIds = player.availableSkills.map(s => s.id);
  const availableSkills = ALL_SKILLS.filter(s => 
    !unlockedIds.includes(s.id) && 
    (!s.classRestriction || s.classRestriction === player.class) // 공용 또는 해당 직업 전용
  );
  
  // 무기 옵션 추가 헬퍼 함수
  const addWeaponOption = () => {
    const randomWeapon = ALL_WEAPONS[Math.floor(Math.random() * ALL_WEAPONS.length)];
    const weapon = { ...randomWeapon };
    
    // 1순위: 인벤토리에 있는 무기와 합성 가능한지 확인
    if (player.weaponInventory.length > 0) {
      for (const invWeapon of player.weaponInventory) {
        const fusionRecipe = canFuseWeapons(weapon, invWeapon);
        // 엑스칼리버는 전사만 합성 가능
        if (fusionRecipe && (fusionRecipe.resultId !== 'excalibur' || player.class === 'warrior') && Math.random() < 0.6) { // 60% 확률로 합성 옵션 제공
          const fusedWeapon = fuseWeapons(weapon, invWeapon);
          if (fusedWeapon) {
            options.push({ type: 'fusion', weapon: fusedWeapon, weapon1: weapon, weapon2: invWeapon });
            return;
          }
        }
      }
      
      // 현재 무기와 인벤토리 무기 합성 체크
      for (const invWeapon of player.weaponInventory) {
        const fusionRecipe = canFuseWeapons(player.weapon, invWeapon);
        // 엑스칼리버는 전사만 합성 가능
        if (fusionRecipe && (fusionRecipe.resultId !== 'excalibur' || player.class === 'warrior') && Math.random() < 0.4) { // 40% 확률
          const fusedWeapon = fuseWeapons(player.weapon, invWeapon);
          if (fusedWeapon) {
            options.push({ type: 'fusion', weapon: fusedWeapon, weapon1: player.weapon, weapon2: invWeapon });
            return;
          }
        }
      }
    }
    
    // 2순위: 현재 착용 중인 무기와 같은 무기면 강화/진화 옵션으로
    if (weapon.id === player.weapon.id) {
      // 진화 가능한 경우 50% 확률로 진화 옵션 제공
      if (canEvolveWeapon(player.weapon) && Math.random() < 0.5) {
        const evolvedWeapon = evolveWeapon(player.weapon);
        if (evolvedWeapon) {
          options.push({ type: 'evolution', weapon: evolvedWeapon, baseWeapon: player.weapon });
          return;
        }
      }
      // 진화가 안되면 강화 옵션
      const upgradedWeapon = upgradeWeapon(player.weapon);
      options.push({ type: 'upgrade', weapon: upgradedWeapon });
    } else {
      // 3순위: 새 무기 획득 (인벤토리에 추가)
      options.push({ type: 'weapon', weapon });
    }
  };
  
  // 옵션 1: 스킬 또는 무기
  if (Math.random() < 0.6) {
    // 스킬
    if (availableSkills.length > 0) {
      const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
      options.push({ type: 'skill', skill: { ...randomSkill } });
    } else {
      // 스킬이 없으면 무기
      addWeaponOption();
    }
  } else {
    // 무기
    addWeaponOption();
  }
  
  // 옵션 2: 무기 또는 스텟
  if (Math.random() < 0.5) {
    // 무기
    addWeaponOption();
  } else {
    // 스텟
    const stats: (keyof Stats)[] = ['strength', 'vitality', 'agility', 'defense'];
    const randomStat = stats[Math.floor(Math.random() * stats.length)];
    options.push({ type: 'stat', statName: randomStat, amount: 3 });
  }
  
  // 옵션 3: 스텟, 스킬, 또는 아티펙트
  const roll = Math.random();
  if (roll < 0.4) {
    // 스텟
    const stats: (keyof Stats)[] = ['strength', 'vitality', 'agility', 'defense'];
    const randomStat = stats[Math.floor(Math.random() * stats.length)];
    options.push({ type: 'stat', statName: randomStat, amount: 3 });
  } else if (roll < 0.7) {
    // 이미 선택된 스킬 ID를 제외한 나머지 스킬만 후보로
    const usedSkillIds = options.filter(o => o.type === 'skill').map(o => (o as { type: 'skill'; skill: { id: string } }).skill.id);
    const remainingSkills = availableSkills.filter(s => !usedSkillIds.includes(s.id));
    if (remainingSkills.length > 0) {
      const randomSkill = remainingSkills[Math.floor(Math.random() * remainingSkills.length)];
      options.push({ type: 'skill', skill: { ...randomSkill } });
    } else {
      // 스킬이 없으면 스텟
      const stats: (keyof Stats)[] = ['strength', 'vitality', 'agility', 'defense'];
      const randomStat = stats[Math.floor(Math.random() * stats.length)];
      options.push({ type: 'stat', statName: randomStat, amount: 3 });
    }
  } else {
    // 아티펙트 (30% 확률)
    const ownedArtifactIds = player.artifacts.map(a => a.id);
    const availableArtifacts = ALL_ARTIFACTS.filter(a => !ownedArtifactIds.includes(a.id));
    
    if (availableArtifacts.length > 0) {
      // 등급별 확률에 따라 아티펙트 선택
      const selectedArtifact = selectRandomArtifactByRarity(availableArtifacts);
      if (selectedArtifact) {
        options.push({ type: 'artifact', artifact: { ...selectedArtifact } });
      } else {
        // 선택 실패 시 스텟으로 대체
        const stats: (keyof Stats)[] = ['strength', 'vitality', 'agility', 'defense'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        options.push({ type: 'stat', statName: randomStat, amount: 3 });
      }
    } else {
      // 이미 모든 아티펙트를 보유한 경우 스텟으로 대체
      const stats: (keyof Stats)[] = ['strength', 'vitality', 'agility', 'defense'];
      const randomStat = stats[Math.floor(Math.random() * stats.length)];
      options.push({ type: 'stat', statName: randomStat, amount: 3 });
    }
  }
  
  return options;
};

// 로컬 스토리지 저장
export const saveGameData = (data: SavedGameData): void => {
  localStorage.setItem('roguelike-game-data', JSON.stringify(data));
};

// 선택된 직업 저장
export const saveSelectedClass = (classType: ClassType) => {
  localStorage.setItem('roguelike-selected-class', classType);
};

// 선택된 직업 불러오기
export const loadSelectedClass = (): ClassType | null => {
  const classType = localStorage.getItem('roguelike-selected-class');
  return classType as ClassType | null;
};

// 로컬 스토리지 불러오기
export const loadGameData = (): SavedGameData | null => {
  const data = localStorage.getItem('roguelike-game-data');
  if (data) {
    return JSON.parse(data);
  }
  return null;
};

// 초기 게임 상태
export const createInitialGameState = (classType: ClassType, savedData?: SavedGameData | null, difficulty: 'normal' | 'hard' | 'hell' = 'normal'): GameState => {
  return {
    player: createPlayer(classType, savedData),
    boss: createBoss(savedData?.wave ?? 1, difficulty),
    projectiles: [],
    platforms: createPlatforms(),
    gameStatus: savedData ? 'playing' : 'menu',
    score: savedData?.score ?? 0,
    wave: savedData?.wave ?? 1,
    isPaused: false,
    showRewardScreen: false,
    rewardOptions: [],
    showWaveComplete: false,
    lastExpGained: 0,
    damageTexts: [],
    difficulty,
    pendingLevelUps: 0,
    pendingBonusRewards: 0,
  };
};
