import { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import type { GameState, Projectile, Skill, RewardOption, DamageText, Debuff, ElementType, Difficulty, ClassType, Artifact, Weapon } from '../types/game';
import {
  createInitialGameState,
  updatePlayer,
  updateBoss,
  updateProjectiles,
  checkCollision,
  checkProjectilePlatformCollision,
  saveGameData,
  loadGameData,
  saveSelectedClass,
  loadSelectedClass,
  PLAYER_JUMP_FORCE,
  DODGE_DURATION,
  DODGE_COOLDOWN,
  createBoss,
  checkLevelUp,
  calculateExperienceReward,
  generateRewardOptions,
  getPassiveEffects,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  createPlatforms,
  MAX_WAVE,
  upgradeWeapon,
  evolveWeapon,
} from '../utils/gameLogic';
import { getClassById } from '../data/classes';
import { fuseWeapons } from '../data/weaponFusions';
import { initGameSession, updateStatisticsOnGameEnd } from '../utils/statistics';
import { getLogicSteps, isTabVisible, createFpsCounter, getAdaptiveMaxSteps } from '../utils/frameStabilizer';

const FIXED_TIMESTEP_SEC = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;
const MAX_DAMAGE_TEXTS = 40;

export const useGame = () => {
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(() => loadSelectedClass());
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedData = loadGameData();
    const classType = savedData?.class || loadSelectedClass() || 'warrior';
    return createInitialGameState(classType, savedData);
  });
  
  const [highScore, setHighScore] = useState<number>(() => {
    const savedHighScore = localStorage.getItem('roguelike-highscore');
    if (savedHighScore) {
      return JSON.parse(savedHighScore);
    }
    const savedData = loadGameData();
    return savedData?.highScore ?? 0;
  });

  const [playElapsedSeconds, setPlayElapsedSeconds] = useState(0);

  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameId = useRef<number | undefined>(undefined);
  const gameStartTime = useRef<number>(0);
  const lastPlayDurationRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastRegenFrameRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>(gameState);
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<ReturnType<typeof createFpsCounter> | null>(null);
  if (!fpsCounterRef.current) fpsCounterRef.current = createFpsCounter();

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (gameState.gameStatus === 'defeat' || gameState.gameStatus === 'victory') {
      setPlayElapsedSeconds(lastPlayDurationRef.current);
    }
    if (gameState.gameStatus === 'menu') {
      setPlayElapsedSeconds(0);
    }
  }, [gameState.gameStatus]);

  useEffect(() => {
    if (gameState.gameStatus !== 'playing' || gameState.isPaused) return;
    const interval = setInterval(() => {
      setPlayElapsedSeconds(Math.floor((Date.now() - gameStartTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.gameStatus, gameState.isPaused]);

  const handleRewardSelect = useCallback((option: RewardOption) => {
    setGameState((prev) => {
      let newPlayer = { ...prev.player };

      if (option.type === 'skill') {
        newPlayer.availableSkills.push({ ...option.skill, currentCooldown: 0 });
        if (option.skill.isPassive && option.skill.passiveEffect?.healthBonus) {
          const baseMax = 100 + newPlayer.stats.vitality * 10;
          const artifactHealth = newPlayer.equippedArtifacts.reduce(
            (acc, a) => acc + (a?.effects.healthBonus ?? 0),
            0
          );
          const passiveHealth = getPassiveEffects(newPlayer).healthBonus;
          const newMaxHealth = Math.floor(baseMax * (1 + (artifactHealth + passiveHealth) / 100));
          const diff = newMaxHealth - newPlayer.maxHealth;
          newPlayer.maxHealth = newMaxHealth;
          newPlayer.health = Math.min(newPlayer.maxHealth, newPlayer.health + diff);
        }
      } else if (option.type === 'weapon') {
        newPlayer.weaponInventory = [...newPlayer.weaponInventory, newPlayer.weapon];
        newPlayer.weapon = { ...option.weapon };
        newPlayer.attackCooldown = 0;
      } else if (option.type === 'upgrade') {
        newPlayer.weapon = { ...option.weapon };
        newPlayer.attackCooldown = 0;
      } else if (option.type === 'evolution') {
        newPlayer.weapon = { ...option.weapon };
        newPlayer.attackCooldown = 0;
      } else if (option.type === 'fusion') {
        const weapon1 = option.weapon1;
        const weapon2 = option.weapon2;
        const currentWeapon = newPlayer.weapon;
        
        // weapon1이 현재 장착된 무기인지 확인 (ID와 강화 레벨 모두 확인)
        const weapon1IsEquipped = weapon1.id === currentWeapon.id && 
          (weapon1.upgradeLevel || 0) === (currentWeapon.upgradeLevel || 0);
        
        // weapon2가 현재 장착된 무기인지 확인
        const weapon2IsEquipped = weapon2.id === currentWeapon.id && 
          (weapon2.upgradeLevel || 0) === (currentWeapon.upgradeLevel || 0);
        
        // 합성된 무기로 교체
        newPlayer.weapon = { ...option.weapon };
        newPlayer.attackCooldown = 0;

        if (weapon1IsEquipped) {
          newPlayer.weaponInventory = newPlayer.weaponInventory.filter(
            w => !(w.id === weapon2.id && (w.upgradeLevel || 0) === (weapon2.upgradeLevel || 0))
          );
        } else if (weapon2IsEquipped) {
          // weapon2가 장착 중이면 weapon1만 인벤토리에서 제거 (weapon1은 새로 획득한 무기이므로 인벤토리에 없음)
          // weapon1은 새로 획득한 무기이므로 인벤토리에 없을 수 있음
          newPlayer.weaponInventory = newPlayer.weaponInventory.filter(
            w => !(w.id === weapon1.id && (w.upgradeLevel || 0) === (weapon1.upgradeLevel || 0))
          );
        } else {
          newPlayer.weaponInventory = [
            currentWeapon,
            ...newPlayer.weaponInventory.filter(
              w => !(
                (w.id === weapon1.id && (w.upgradeLevel || 0) === (weapon1.upgradeLevel || 0)) ||
                (w.id === weapon2.id && (w.upgradeLevel || 0) === (weapon2.upgradeLevel || 0))
              )
            )
          ];
        }
      } else if (option.type === 'stat') {
        const newStats = { ...newPlayer.stats };
        newStats[option.statName] += option.amount;
        newPlayer.stats = newStats;
        if (option.statName === 'vitality') {
          const healthIncrease = option.amount * 10;
          newPlayer.maxHealth += healthIncrease;
          newPlayer.health += healthIncrease;
        }
      } else if (option.type === 'artifact') {
        newPlayer.artifacts = [...newPlayer.artifacts, { ...option.artifact }];
      }

      newPlayer.position = { x: 100, y: CANVAS_HEIGHT - 100 };
      newPlayer.velocity = { x: 0, y: 0 };
      newPlayer.isJumping = false;

      const remainingLevelUps = prev.pendingLevelUps;
      const remainingBonusRewards = prev.pendingBonusRewards || 0;
      const totalRemaining = remainingLevelUps + remainingBonusRewards;
      
      let newState;
      if (totalRemaining > 0) {
        const newRewardOptions = generateRewardOptions(newPlayer, prev.wave);
        const newPendingLevelUps = remainingLevelUps > 0 ? remainingLevelUps - 1 : 0;
        const newPendingBonusRewards = remainingLevelUps > 0 ? remainingBonusRewards : Math.max(0, remainingBonusRewards - 1);
        
        newState = {
          ...prev,
          player: newPlayer,
          boss: createBoss(prev.wave),
          platforms: createPlatforms(),
          projectiles: [],
          gameStatus: 'choosing' as const,
          showRewardScreen: true,
          rewardOptions: newRewardOptions,
          pendingLevelUps: newPendingLevelUps,
          pendingBonusRewards: newPendingBonusRewards,
        };
      } else {
        newState = {
          ...prev,
          player: newPlayer,
          boss: createBoss(prev.wave),
          platforms: createPlatforms(),
          projectiles: [],
          gameStatus: 'playing' as const,
          showRewardScreen: false,
          rewardOptions: [],
          pendingLevelUps: 0,
          pendingBonusRewards: 0,
        };
      }

      saveGameData({
        score: newState.score,
        wave: newState.wave,
        highScore: Math.max(prev.score, 0),
        playerHealth: newPlayer.health,
        level: newPlayer.level,
        experience: newPlayer.experience,
        stats: newPlayer.stats,
        statPoints: newPlayer.statPoints,
        equippedSkills: newPlayer.equippedSkills,
        availableSkills: newPlayer.availableSkills,
        weaponId: newPlayer.weapon.id,
        weaponInventory: newPlayer.weaponInventory,
        class: newPlayer.class,
        artifacts: newPlayer.artifacts,
        equippedArtifacts: newPlayer.equippedArtifacts,
      });

      return newState;
    });
  }, []);

  const useSkill = useCallback((skillIndex: number) => {
    setGameState((prev) => {
      if (prev.isPaused || prev.gameStatus !== 'playing') return prev;
      
      const skill = prev.player.equippedSkills[skillIndex];
      if (!skill || skill.currentCooldown > 0) return prev;

      const newPlayer = { ...prev.player };
      const newProjectiles = [...prev.projectiles];
      newPlayer.equippedSkills = newPlayer.equippedSkills.map((s, i) =>
        i === skillIndex && s ? { ...s, currentCooldown: s.cooldown } : s
      );
      const critChance = newPlayer.stats.criticalChance;
      
      switch (skill.id) {
        case 'fireball':
          {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 40) + newPlayer.stats.strength * 2;
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + (newPlayer.facingRight ? newPlayer.width : 0),
                y: newPlayer.position.y + newPlayer.height / 2,
              },
              velocity: {
                x: (newPlayer.facingRight ? 10 : -10),
                y: 0,
              },
              width: 25,
              height: 25,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
            });
          }
          break;

        case 'triple_shot':
          for (let i = -1; i <= 1; i++) {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 15) + newPlayer.stats.strength;
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + (newPlayer.facingRight ? newPlayer.width : 0),
                y: newPlayer.position.y + newPlayer.height / 2,
              },
              velocity: {
                x: (newPlayer.facingRight ? 8 : -8),
                y: i * 3,
              },
              width: 18,
              height: 18,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
            });
          }
          break;

        case 'piercing_arrow':
          {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 50) + newPlayer.stats.strength * 3;
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + (newPlayer.facingRight ? newPlayer.width : 0),
                y: newPlayer.position.y + newPlayer.height / 2,
              },
              velocity: {
                x: (newPlayer.facingRight ? 12 : -12),
                y: 0,
              },
              width: 30,
              height: 10,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
              piercing: skill.piercing,
            });
          }
          break;

        case 'shield':
          if (!newPlayer.activeSkillEffects.includes('shield')) {
            newPlayer.activeSkillEffects.push('shield');
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== 'shield'),
                },
              }));
            }, skill.duration || 3000);
          }
          break;

        case 'heal':
          newPlayer.health = Math.min(
            newPlayer.maxHealth,
            newPlayer.health + (30 + newPlayer.stats.vitality * 2)
          );
          break;

        case 'counter':
          if (!newPlayer.activeSkillEffects.includes('counter')) {
            newPlayer.activeSkillEffects.push('counter');
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== 'counter'),
                },
              }));
            }, skill.duration || 5000);
          }
          break;

        case 'time_slow':
          if (!newPlayer.activeSkillEffects.includes('slow')) {
            newPlayer.activeSkillEffects.push('slow');
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== 'slow'),
                },
              }));
            }, skill.duration || 4000);
          }
          break;

        case 'dash':
          if (!newPlayer.activeSkillEffects.includes('dash')) {
            newPlayer.activeSkillEffects.push('dash');
            newPlayer.velocity.x = (newPlayer.facingRight ? 15 : -15);
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== 'dash'),
                },
              }));
            }, skill.duration || 500);
          }
          break;

        case 'berserker':
          if (!newPlayer.activeSkillEffects.includes('berserker')) {
            newPlayer.activeSkillEffects.push('berserker');
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== 'berserker'),
                },
              }));
            }, skill.duration || 10000);
          }
          break;

        // 새로운 공용 스킬
        case 'meteor_strike':
          for (let i = 0; i < 5; i++) {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 30) + newPlayer.stats.strength * 2;
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                projectiles: [
                  ...s.projectiles,
                  {
                    position: {
                      x: Math.random() * 700 + 50,
                      y: -30,
                    },
                    velocity: { x: 0, y: 12 },
                    width: 30,
                    height: 30,
                    damage: isCritical ? baseDmg * 2 : baseDmg,
                    fromPlayer: true,
                    isCritical,
                  },
                ],
              }));
            }, i * 200);
          }
          break;

        case 'lightning_bolt':
          {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 45) + newPlayer.stats.strength * 2;
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + (newPlayer.facingRight ? newPlayer.width : 0),
                y: newPlayer.position.y + newPlayer.height / 2,
              },
              velocity: {
                x: (newPlayer.facingRight ? 14 : -14),
                y: 0,
              },
              width: 20,
              height: 20,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
              element: skill.element,
              elementalDamage: skill.elementalDamage,
            });
          }
          break;

        case 'iron_skin':
        case 'regeneration':
        case 'focus':
          if (!newPlayer.activeSkillEffects.includes(skill.id)) {
            newPlayer.activeSkillEffects.push(skill.id);
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== skill.id),
                },
              }));
            }, skill.duration || 5000);
          }
          break;
        
        case 'teleport':
          {
            // 랜덤한 안전한 위치로 순간이동
            const safeX = Math.random() * (CANVAS_WIDTH - 100) + 50;
            const safeY = 100; // 공중에서 시작
            newPlayer.position.x = safeX;
            newPlayer.position.y = safeY;
            newPlayer.velocity = { x: 0, y: 0 };
            
            if (!newPlayer.activeSkillEffects.includes('teleport')) {
              newPlayer.activeSkillEffects.push('teleport');
              setTimeout(() => {
                setGameState((s) => ({
                  ...s,
                  player: {
                    ...s.player,
                    activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== 'teleport'),
                  },
                }));
              }, 500); // 짧은 무적 시간
            }
          }
          break;

        // 전사 스킬
        case 'war_cry':
          {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 60) + newPlayer.stats.strength * 3;
            // 주변 충격파
            for (let angle = 0; angle < 360; angle += 45) {
              const rad = (angle * Math.PI) / 180;
              newProjectiles.push({
                position: {
                  x: newPlayer.position.x + newPlayer.width / 2,
                  y: newPlayer.position.y + newPlayer.height / 2,
                },
                velocity: {
                  x: Math.cos(rad) * 8,
                  y: Math.sin(rad) * 8,
                },
                width: 20,
                height: 20,
                damage: isCritical ? baseDmg * 2 : baseDmg,
                fromPlayer: true,
                isCritical,
              });
            }
          }
          break;

        case 'shield_bash':
          {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 45) + newPlayer.stats.strength * 2;
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + (newPlayer.facingRight ? newPlayer.width : -40),
                y: newPlayer.position.y + newPlayer.height / 2 - 20,
              },
              velocity: {
                x: (newPlayer.facingRight ? 10 : -10),
                y: 0,
              },
              width: 40,
              height: 40,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
            });
          }
          break;

        case 'unbreakable':
        case 'last_stand':
          if (!newPlayer.activeSkillEffects.includes(skill.id)) {
            newPlayer.activeSkillEffects.push(skill.id);
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== skill.id),
                },
              }));
            }, skill.duration || 10000);
          }
          break;

        // 궁수 스킬
        case 'multi_arrow':
          for (let i = -2; i <= 2; i++) {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 20) + newPlayer.stats.strength;
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + (newPlayer.facingRight ? newPlayer.width : 0),
                y: newPlayer.position.y + newPlayer.height / 2,
              },
              velocity: {
                x: (newPlayer.facingRight ? 9 : -9),
                y: i * 2.5,
              },
              width: 15,
              height: 15,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
            });
          }
          break;

        case 'poison_arrow':
          {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 25) + newPlayer.stats.strength * 1.5;
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + (newPlayer.facingRight ? newPlayer.width : 0),
                y: newPlayer.position.y + newPlayer.height / 2,
              },
              velocity: {
                x: (newPlayer.facingRight ? 11 : -11),
                y: 0,
              },
              width: 20,
              height: 8,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
              element: skill.element,
              elementalDamage: skill.elementalDamage,
            });
          }
          break;

        case 'eagle_eye':
        case 'rapid_fire':
          if (!newPlayer.activeSkillEffects.includes(skill.id)) {
            newPlayer.activeSkillEffects.push(skill.id);
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== skill.id),
                },
              }));
            }, skill.duration || 8000);
          }
          break;

        // 마법사 스킬
        case 'ice_storm':
          for (let i = 0; i < 8; i++) {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 15) + newPlayer.stats.strength;
            const angle = (i * 360) / 8;
            const rad = (angle * Math.PI) / 180;
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + newPlayer.width / 2,
                y: newPlayer.position.y + newPlayer.height / 2,
              },
              velocity: {
                x: Math.cos(rad) * 7,
                y: Math.sin(rad) * 7,
              },
              width: 18,
              height: 18,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
              element: skill.element,
              elementalDamage: skill.elementalDamage,
            });
          }
          break;

        case 'arcane_blast':
          {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 70) + newPlayer.stats.strength * 3;
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + (newPlayer.facingRight ? newPlayer.width : -45),
                y: newPlayer.position.y + newPlayer.height / 2 - 22,
              },
              velocity: {
                x: (newPlayer.facingRight ? 11 : -11),
                y: 0,
              },
              width: 45,
              height: 45,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
            });
          }
          break;

        case 'mana_shield':
        case 'elemental_mastery':
          if (!newPlayer.activeSkillEffects.includes(skill.id)) {
            newPlayer.activeSkillEffects.push(skill.id);
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== skill.id),
                },
              }));
            }, skill.duration || 7000);
          }
          break;

        // 암살자 스킬
        case 'shadow_strike':
          {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 80) + newPlayer.stats.strength * 3;
            // 순간이동 효과
            newPlayer.position.x += (newPlayer.facingRight ? 100 : -100);
            newProjectiles.push({
              position: {
                x: newPlayer.position.x + (newPlayer.facingRight ? newPlayer.width : -50),
                y: newPlayer.position.y + newPlayer.height / 2 - 25,
              },
              velocity: { x: 0, y: 0 },
              width: 50,
              height: 50,
              damage: isCritical ? baseDmg * 2 : baseDmg,
              fromPlayer: true,
              isCritical,
            });
          }
          break;

        case 'blade_dance':
          for (let i = 0; i < 8; i++) {
            const isCritical = Math.random() * 100 < critChance;
            const baseDmg = (skill.damage || 18) + newPlayer.stats.strength;
            const angle = (i * 360) / 8 + 22.5;
            const rad = (angle * Math.PI) / 180;
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                projectiles: [
                  ...s.projectiles,
                  {
                    position: {
                      x: s.player.position.x + s.player.width / 2,
                      y: s.player.position.y + s.player.height / 2,
                    },
                    velocity: {
                      x: Math.cos(rad) * 9,
                      y: Math.sin(rad) * 9,
                    },
                    width: 16,
                    height: 16,
                    damage: isCritical ? baseDmg * 2 : baseDmg,
                    fromPlayer: true,
                    isCritical,
                  },
                ],
              }));
            }, i * 50);
          }
          break;

        case 'stealth':
        case 'deadly_venom':
          if (!newPlayer.activeSkillEffects.includes(skill.id)) {
            newPlayer.activeSkillEffects.push(skill.id);
            setTimeout(() => {
              setGameState((s) => ({
                ...s,
                player: {
                  ...s.player,
                  activeSkillEffects: s.player.activeSkillEffects.filter((e) => e !== skill.id),
                },
              }));
            }, skill.duration || 6000);
          }
          break;
      }

      return {
        ...prev,
        player: newPlayer,
        projectiles: newProjectiles,
      };
    });
  }, []);

  const togglePause = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const setMovementKeys = useCallback((left: boolean, right: boolean) => {
    if (left) keysPressed.current.add('a');
    else keysPressed.current.delete('a');
    if (right) keysPressed.current.add('d');
    else keysPressed.current.delete('d');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        togglePause();
        return;
      }

      if (e.key != null) keysPressed.current.add(e.key.toLowerCase());

      if ((e.key === ' ' || e.key === 'w' || e.key === 'W') && !gameState.player.isJumping) {
        setGameState((prev) => ({
          ...prev,
          player: {
            ...prev.player,
            velocity: { ...prev.player.velocity, y: -PLAYER_JUMP_FORCE },
            isJumping: true,
          },
        }));
      }

      if ((e.key === 'Shift') && gameState.player.dodgeCooldown <= 0 && !gameState.player.isDodging) {
        setGameState((prev) => ({
          ...prev,
          player: {
            ...prev.player,
            isDodging: true,
            dodgeCooldown: DODGE_DURATION + DODGE_COOLDOWN,
          },
        }));
      }

      if ((e.key === 'j' || e.key === 'J') && gameState.player.attackCooldown <= 0 && !gameState.player.isAttacking) {
        setGameState((prev) => {
          const weapon = prev.player.weapon;
          const artifactEffects = prev.player.equippedArtifacts.reduce((acc, artifact) => {
            if (!artifact) return acc;
            return {
              damageBonus: acc.damageBonus + (artifact.effects.damageBonus || 0),
              critChanceBonus: acc.critChanceBonus + (artifact.effects.critChanceBonus || 0),
              attackSpeedBonus: acc.attackSpeedBonus + (artifact.effects.attackSpeedBonus || 0),
            };
          }, { damageBonus: 0, critChanceBonus: 0, attackSpeedBonus: 0 });
          const passiveEffects = getPassiveEffects(prev.player);
          const totalDamageBonus = artifactEffects.damageBonus + passiveEffects.damageBonus;
          const totalCritBonus = artifactEffects.critChanceBonus + passiveEffects.critChanceBonus;
          
          const baseDamage = Math.floor(
            (weapon.damage + prev.player.stats.strength * 2) * 
            (1 + totalDamageBonus / 100)
          );
          const isBerserker = prev.player.activeSkillEffects.includes('berserker');
          let critChance = prev.player.stats.criticalChance + totalCritBonus;

          if (prev.player.class === 'archer') {
            const classInfo = getClassById('archer');
            if (classInfo && classInfo.passive.effect === 'critBonus') {
              critChance += classInfo.passive.value;
            }
          }
          if (prev.player.activeSkillEffects.includes('eagle_eye')) {
            critChance += 40;
          }
          if (prev.player.activeSkillEffects.includes('focus')) {
            critChance += 30;
          }
          if (prev.player.activeSkillEffects.includes('stealth')) {
            critChance = 100;
          }
          
          if (weapon.id === 'katana') {
            critChance += 30 + (prev.player.stats.agility * 0.5);
          }
          const isCritical = Math.random() * 100 < critChance;
          let finalDamage = isCritical ? baseDamage * 2 : baseDamage;
          let attackDamage = isBerserker ? finalDamage * 2 : finalDamage;
          if (prev.player.activeSkillEffects.includes('last_stand') && prev.player.health <= prev.player.maxHealth * 0.3) {
            attackDamage *= 2;
          }
          if (weapon.id === 'axe') {
            attackDamage = Math.floor(attackDamage * 1.2);
          }
          let weaponDamage = attackDamage;
          let weaponElement = weapon.element;
          let weaponElementalDamage = weapon.elementalDamage;
          
          if (weapon.type === 'magic' && weapon.element && weapon.element !== 'physical') {
            weaponElementalDamage = attackDamage;
            weaponDamage = 0;
          }
          if (weapon.id === 'chaos_staff') {
            const elements: ElementType[] = ['fire', 'ice', 'lightning', 'poison', 'dark'];
            const randomElement = elements[Math.floor(Math.random() * elements.length)];
            weaponElement = randomElement;
            // 기본 공격력을 전부 원소 데미지로 사용
            weaponElementalDamage = (weaponElementalDamage || 0) + attackDamage;
            weaponDamage = 0;
          }

          // 전투 지팡이: 물리 + 마법 혼합 공격
          if (weapon.id === 'battle_staff') {
            // 절반은 물리, 절반은 마법(physical 원소)으로 처리
            const magicPortion = Math.floor(attackDamage * 0.5);
            weaponDamage = attackDamage - magicPortion;
            weaponElement = weaponElement || 'physical';
            weaponElementalDamage = (weaponElementalDamage || 0) + magicPortion;
          }
          if (prev.player.class === 'mage' && weaponElementalDamage) {
            const classInfo = getClassById('mage');
            if (classInfo && classInfo.passive.effect === 'elementalBonus') {
              weaponElementalDamage = Math.floor(weaponElementalDamage * (1 + classInfo.passive.value));
            }
          }
          if (prev.player.activeSkillEffects.includes('elemental_mastery') && weaponElementalDamage) {
            weaponElementalDamage = Math.floor(weaponElementalDamage * 2);
          }
          if (prev.player.activeSkillEffects.includes('deadly_venom')) {
            weaponElement = 'poison';
            weaponElementalDamage = (weaponElementalDamage || 0) + attackDamage * 0.5;
          }
          
          const newProjectiles: Projectile[] = [];
          const currentTime = Date.now();

          if (weapon.type === 'melee') {
            let projWidth = weapon.range;
            let projHeight = 10;
            if (weapon.id === 'hammer' || weapon.id === 'greatsword') {
              projWidth = weapon.range * 1.5;
              projHeight = 25;
            } else if (weapon.id === 'spear') {
              projWidth = weapon.range;
              projHeight = 6;
            } else if (weapon.id === 'katana') {
              projWidth = weapon.range * 1.2;
              projHeight = 12;
            }
            const attackCount = weapon.id === 'dual_sword' ? 2 : 1;
            
            for (let i = 0; i < attackCount; i++) {
              setTimeout(() => {
                setGameState((state) => ({
                  ...state,
                  projectiles: [
                    ...state.projectiles,
                    {
                      position: {
                        x: state.player.position.x + (state.player.facingRight ? state.player.width : -projWidth),
                        y: state.player.position.y + state.player.height / 2 - projHeight / 2,
                      },
                      velocity: {
                        x: state.player.facingRight ? 8 : -8,
                        y: 0,
                      },
                      width: projWidth,
                      height: projHeight,
                      damage: weaponDamage,
                      fromPlayer: true,
                      isCritical,
                      element: weaponElement,
                      elementalDamage: weaponElementalDamage,
                      piercing: weapon.piercing,
                      lifetime: weapon.projectileLifetime || 30,
                      createdAt: Date.now(),
                      shape: weapon.projectileShape || 'default',
                      weaponId: weapon.id,
                    },
                  ],
                }));
              }, i * 100);
            }
            if (weapon.id !== 'dual_sword') {
              newProjectiles.push({
                position: {
                  x: prev.player.position.x + (prev.player.facingRight ? prev.player.width : -projWidth),
                  y: prev.player.position.y + prev.player.height / 2 - projHeight / 2,
                },
                velocity: {
                  x: prev.player.facingRight ? 8 : -8,
                  y: 0,
                },
                width: projWidth,
                height: projHeight,
                damage: weaponDamage,
                fromPlayer: true,
                isCritical,
                element: weaponElement,
                elementalDamage: weaponElementalDamage,
                piercing: weapon.piercing,
                lifetime: weapon.projectileLifetime || 30,
                createdAt: currentTime,
                shape: weapon.projectileShape || 'default',
                weaponId: weapon.id,
              });
            }
          } else {
            const count = weapon.projectileCount || 1;
            const speed = weapon.projectileSpeed || 8;

            for (let i = 0; i < count; i++) {
              const spreadAngle = count > 1 ? (i - (count - 1) / 2) * 0.3 : 0;
              const velocityX = Math.cos(spreadAngle) * speed;
              const velocityY = Math.sin(spreadAngle) * speed;

              newProjectiles.push({
                position: {
                  x: prev.player.position.x + (prev.player.facingRight ? prev.player.width : 0),
                  y: prev.player.position.y + prev.player.height / 2,
                },
                velocity: {
                  x: (prev.player.facingRight ? 1 : -1) * velocityX,
                  y: velocityY,
                },
                width: 20,
                height: 8,
                damage: weaponDamage,
                fromPlayer: true,
                isCritical,
                element: weaponElement,
                elementalDamage: weaponElementalDamage,
                piercing: weapon.piercing,
                isTracking: weapon.special === '적을 추적' || (weapon.special?.includes('유도') ?? false), // 적 추적/유도 무기 (천상의 다중궁 등)
                lifetime: weapon.projectileLifetime || 60,
                createdAt: currentTime,
                shape: 'default',
                weaponId: weapon.id,
              });
            }
          }

          let finalAttackCooldown = weapon.attackSpeed;
          if (prev.player.class === 'assassin') {
            const classInfo = getClassById('assassin');
            if (classInfo && classInfo.passive.effect === 'attackSpeedBonus') {
              finalAttackCooldown = Math.floor(weapon.attackSpeed * (1 - classInfo.passive.value));
            }
          }
          if (artifactEffects.attackSpeedBonus > 0) {
            finalAttackCooldown = Math.floor(
              finalAttackCooldown * (1 - artifactEffects.attackSpeedBonus / 100)
            );
          }
          if (prev.player.activeSkillEffects.includes('rapid_fire')) {
            finalAttackCooldown = Math.floor(finalAttackCooldown * 0.5);
          }
          
          return {
            ...prev,
            player: {
              ...prev.player,
              isAttacking: true,
              attackCooldown: finalAttackCooldown,
            },
            projectiles: [...prev.projectiles, ...newProjectiles],
          };
        });
      }

      if (e.key >= '1' && e.key <= '3') {
        const skillIndex = parseInt(e.key) - 1;
        useSkill(skillIndex);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key != null) keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.player.isJumping, gameState.player.dodgeCooldown, gameState.player.isDodging, gameState.player.attackCooldown, gameState.player.isAttacking, gameState.player.weapon, useSkill, togglePause]);

  useEffect(() => {
    if (gameState.gameStatus !== 'playing' || gameState.isPaused) return;
    fpsCounterRef.current?.reset();

    const gameLoop = () => {
      if (!isTabVisible()) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      }

      const now = performance.now();
      const fps = fpsCounterRef.current?.tick() ?? null;
      const deltaSec = lastFrameTimeRef.current > 0
        ? (now - lastFrameTimeRef.current) / 1000
        : FIXED_TIMESTEP_SEC;
      lastFrameTimeRef.current = now;

      const adaptiveMax = getAdaptiveMaxSteps(MAX_STEPS_PER_FRAME, fps);
      const { steps } = getLogicSteps(deltaSec, accumulatedTimeRef, {
        ticksPerSecond: 60,
        maxStepsPerFrame: adaptiveMax,
      });

      if (steps === 0) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      }

      frameCountRef.current += 1;
      startTransition(() => {
        setGameState((prev) => {
        let newPlayer = updatePlayer(prev.player, keysPressed.current, prev.platforms);
        const regenPercent = newPlayer.equippedArtifacts.reduce(
          (sum, a) => sum + (a?.effects.regenPercentPer5Sec ?? 0),
          0
        );
        if (
          regenPercent > 0 &&
          frameCountRef.current - lastRegenFrameRef.current >= 300
        ) {
          lastRegenFrameRef.current = frameCountRef.current;
          const healAmount = Math.floor(newPlayer.maxHealth * (regenPercent / 100));
          newPlayer = {
            ...newPlayer,
            health: Math.min(newPlayer.maxHealth, newPlayer.health + healAmount),
          };
        }
        let { boss: newBoss, projectiles: newProjectiles } = updateBoss(
          prev.boss,
          newPlayer,
          prev.projectiles,
          prev.wave,
          prev.difficulty
        );
        const newDamageTexts: DamageText[] = [];
        newBoss.debuffs = newBoss.debuffs.filter(debuff => {
          debuff.duration--;
          if (debuff.tickDamage && debuff.duration % 60 === 0) {
            newBoss.health -= debuff.tickDamage;
            newDamageTexts.push({
              id: `${Date.now()}-${Math.random()}-tick`,
              position: {
                x: newBoss.position.x + newBoss.width / 2 + (Math.random() * 20 - 10),
                y: newBoss.position.y + 20,
              },
              damage: debuff.tickDamage,
              isPlayerDamage: false,
              opacity: 0.8,
              offsetY: 0,
              element: debuff.type,
            });
          }
          
          return debuff.duration > 0;
        });
        const hasSlowEffect = newPlayer.activeSkillEffects.includes('slow');
        let updatedProjectiles = updateProjectiles(newProjectiles, hasSlowEffect);
        updatedProjectiles = updatedProjectiles.map((proj) => {
          if (proj.fromPlayer && proj.isTracking) {
            const dx = (newBoss.position.x + newBoss.width / 2) - (proj.position.x + proj.width / 2);
            const dy = (newBoss.position.y + newBoss.height / 2) - (proj.position.y + proj.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
              const currentSpeed = Math.sqrt(proj.velocity.x ** 2 + proj.velocity.y ** 2);
              const trackingStrength = 0.1;
              const targetVx = (dx / distance) * currentSpeed;
              const targetVy = (dy / distance) * currentSpeed;
              
              return {
                ...proj,
                velocity: {
                  x: proj.velocity.x + (targetVx - proj.velocity.x) * trackingStrength,
                  y: proj.velocity.y + (targetVy - proj.velocity.y) * trackingStrength,
                },
              };
            }
          }
          return proj;
        });
        let damageReduction = 1 - (newPlayer.stats.defense * 0.02);
        if (newPlayer.activeSkillEffects.includes('iron_skin')) {
          damageReduction *= 0.5;
        }
        if (newPlayer.activeSkillEffects.includes('unbreakable')) {
          damageReduction *= 0.3;
        }
        const hasManaShield = newPlayer.activeSkillEffects.includes('mana_shield');
        if (newPlayer.activeSkillEffects.includes('regeneration')) {
          newPlayer.health = Math.min(newPlayer.maxHealth, newPlayer.health + 0.5);
        }
        const currentGameTime = Date.now();
        updatedProjectiles = updatedProjectiles.filter((proj) => {
          if (proj.lifetime && proj.createdAt) {
            const elapsed = (currentGameTime - proj.createdAt) / (1000 / 60);
            if (elapsed > proj.lifetime) return false;
          }
          return true;
        });
        updatedProjectiles = updatedProjectiles.filter((proj) => {
          if (!proj.piercing) {
            for (const platform of prev.platforms) {
              if (platform.isWall && checkProjectilePlatformCollision(proj, platform)) return false;
            }
          }
          return true;
        });
        updatedProjectiles = updatedProjectiles.filter((proj) => {
          if (proj.fromPlayer && checkCollision(proj, newBoss)) {
            const holyBonus = proj.weaponId === 'holy_staff' ? 1.5 : 1;
            newBoss.health -= proj.damage * holyBonus;
            
            // 속성 피해 적용
            if (proj.element && proj.elementalDamage) {
              const elementalDmg = proj.elementalDamage * holyBonus;
              newBoss.health -= elementalDmg;
              
              // 지팡이(magic 무기)의 경우 30% 확률로 디버프 적용
              const shouldApplyDebuff = Math.random() < 0.3;
              
              if (shouldApplyDebuff) {
                // 속성 디버프 추가
                const existingDebuff = newBoss.debuffs.find(d => d.type === proj.element);
                if (existingDebuff) {
                  // 기존 디버프 갱신
                  existingDebuff.duration = 300; // 5초
                } else {
                  // 새로운 디버프 추가
                  const newDebuff: Debuff = {
                    type: proj.element,
                    duration: 300, // 5초 (60fps 기준)
                  };
                  
                  switch (proj.element) {
                    case 'fire':
                      newDebuff.tickDamage = Math.floor(elementalDmg / 10); // 초당 틱 피해
                      break;
                    case 'ice':
                      newDebuff.slowAmount = 0.5; // 50% 속도 감소
                      break;
                    case 'lightning':
                      newDebuff.stunned = true;
                      newDebuff.duration = 120; // 2초 스턴
                      break;
                    case 'poison':
                      newDebuff.tickDamage = Math.floor(elementalDmg / 5);
                      break;
                    case 'dark':
                      newDebuff.tickDamage = Math.floor(elementalDmg / 8);
                      break;
                  }
                  
                  newBoss.debuffs.push(newDebuff);
                }
              }

              // 암흑 지팡이: 모든 디버프 지속시간 증가
              if (proj.weaponId === 'dark_staff' && newBoss.debuffs.length > 0) {
                newBoss.debuffs = newBoss.debuffs.map((d) => ({
                  ...d,
                  duration: Math.floor(d.duration * 1.5),
                }));
              }
            }
            
            // 보스 데미지 텍스트 생성
            // 일반 데미지가 있으면 표시
            if (proj.damage > 0) {
              newDamageTexts.push({
                id: `${Date.now()}-${Math.random()}-physical`,
                position: {
                  x: newBoss.position.x + newBoss.width / 2,
                  y: newBoss.position.y,
                },
                damage: Math.floor(proj.damage * holyBonus),
                isPlayerDamage: false,
                opacity: 1,
                offsetY: 0,
                isCritical: proj.isCritical || false,
                element: 'physical',
              });
            }
            
            // 속성 데미지가 있으면 따로 표시
            if (proj.element && proj.elementalDamage && proj.elementalDamage > 0) {
              newDamageTexts.push({
                id: `${Date.now()}-${Math.random()}-elemental`,
                position: {
                  x: newBoss.position.x + newBoss.width / 2 + (Math.random() * 20 - 10),
                  y: newBoss.position.y + (Math.random() * 10 - 5),
                },
                damage: Math.floor(proj.elementalDamage * holyBonus),
                isPlayerDamage: false,
                opacity: 1,
                offsetY: 0,
                isCritical: false,
                element: proj.element,
              });
            }
            
            return false;
          }

          // 보스 투사체와 플레이어 충돌
          const isInvulnerable = newPlayer.isDodging ||
                                  newPlayer.activeSkillEffects.includes('shield') ||
                                  newPlayer.activeSkillEffects.includes('dash') ||
                                  newPlayer.activeSkillEffects.includes('stealth') ||
                                  hasManaShield;
          
          if (!proj.fromPlayer && !isInvulnerable && checkCollision(proj, newPlayer)) {
            let damage = Math.floor(proj.damage * damageReduction);
            
            // 전사 직업 패시브: 받는 피해 10% 감소
            if (newPlayer.class === 'warrior') {
              const classInfo = getClassById('warrior');
              if (classInfo && classInfo.passive.effect === 'damageReduction') {
                damage = Math.floor(damage * (1 - classInfo.passive.value));
              }
            }
            
            // 아티펙트 + 패시브 스킬: 방어력 증가 (받는 피해 감소)
            const artifactDefenseBonus = newPlayer.equippedArtifacts.reduce((acc, artifact) => {
              if (!artifact) return acc;
              return acc + (artifact.effects.defenseBonus || 0);
            }, 0);
            const passiveDefenseBonus = getPassiveEffects(newPlayer).defenseBonus;
            const totalDefenseBonus = artifactDefenseBonus + passiveDefenseBonus;
            if (totalDefenseBonus > 0) {
              damage = Math.floor(damage * (1 - totalDefenseBonus / 100));
            }
            
            newPlayer.health -= damage;
            
            // 플레이어 데미지 텍스트 생성
            newDamageTexts.push({
              id: `${Date.now()}-${Math.random()}`,
              position: {
                x: newPlayer.position.x + newPlayer.width / 2,
                y: newPlayer.position.y,
              },
              damage: damage,
              isPlayerDamage: true,
              opacity: 1,
              offsetY: 0,
              element: proj.element,
            });
            
            // 반격 효과
            if (newPlayer.activeSkillEffects.includes('counter')) {
              const counterDamage = damage * 2;
              newBoss.health -= counterDamage;
              
              // 반격 데미지 텍스트
              newDamageTexts.push({
                id: `${Date.now()}-${Math.random()}-counter`,
                position: {
                  x: newBoss.position.x + newBoss.width / 2,
                  y: newBoss.position.y,
                },
                damage: counterDamage,
                isPlayerDamage: false,
                opacity: 1,
                offsetY: 0,
                element: 'physical',
              });
            }
            
            return false;
          }

          return true;
        });

        // 데미지 텍스트 업데이트 (위로 올라가고 투명해짐). 최대 개수 제한으로 프레임 드랍 방지
        const updatedDamageTexts = [...prev.damageTexts, ...newDamageTexts]
          .slice(-MAX_DAMAGE_TEXTS)
          .map(text => ({
            ...text,
            offsetY: text.offsetY - 2,
            opacity: text.opacity - 0.02,
          }))
          .filter(text => text.opacity > 0);

        // 승리 조건
        let newGameStatus = prev.gameStatus;
        let newScore = prev.score;
        let newWave = prev.wave;
        let showRewardScreen = false;
        let rewardOptions: RewardOption[] = [];

        if (newBoss.health <= 0) {
          const experienceGained = calculateExperienceReward(prev.wave, newPlayer);
          newPlayer.experience += experienceGained;
          
          newScore += 1000 * newWave;
          
          // 웨이브 100 클리어 시 게임 완전 클리어
          if (prev.wave >= MAX_WAVE) {
            newGameStatus = 'victory';
            lastPlayDurationRef.current = Math.floor((Date.now() - gameStartTime.current) / 1000); // 타이머 정지
            const newHighScore = Math.max(highScore, newScore);
            setHighScore(newHighScore);
            localStorage.setItem('roguelike-highscore', JSON.stringify(newHighScore));
            
            // 통계 업데이트 (승리)
            updateStatisticsOnGameEnd(
              prev.wave,
              newScore,
              newPlayer.class,
              newPlayer.weapon.name,
              gameStartTime.current,
              false // 승리
            );
            
            return {
              ...prev,
              player: newPlayer,
              boss: newBoss,
              projectiles: updatedProjectiles,
              gameStatus: 'victory',
              score: newScore,
              wave: prev.wave,
              damageTexts: updatedDamageTexts,
            };
          }
          
          newWave += 1;
          
          // 체력 회복
          newPlayer.health = newPlayer.maxHealth;
          
          // 웨이브 완료 알림 표시
          const showWaveComplete = true;
          const lastExpGained = experienceGained;
          
          // 레벨업 체크 및 보상 - 여러 레벨업을 모두 카운트
          let levelUpCount = 0;
          let checkForLevelUp = true;
          while (checkForLevelUp && newPlayer.experience >= newPlayer.experienceToNextLevel) {
            const { player: leveledPlayer, leveledUp } = checkLevelUp(newPlayer);
            newPlayer = leveledPlayer;
            
            if (leveledUp) {
              levelUpCount++;
            } else {
              checkForLevelUp = false;
            }
          }
          
          // 웨이브 10의 배수일 때 보너스 보상 체크
          const isWaveMilestone = prev.wave % 10 === 0;
          const bonusRewardCount = isWaveMilestone ? 3 : 0;
          
          // 레벨업이 있거나 웨이브 보너스가 있으면 보상 선택지 생성
          if (levelUpCount > 0 || bonusRewardCount > 0) {
            rewardOptions = generateRewardOptions(newPlayer, newWave);
            showRewardScreen = true;
            newGameStatus = 'choosing';
            
            return {
              ...prev,
              player: newPlayer,
              boss: newBoss,
              projectiles: updatedProjectiles,
              gameStatus: newGameStatus,
              score: newScore,
              wave: newWave,
              showRewardScreen,
              rewardOptions,
              showWaveComplete: false,
              lastExpGained,
              damageTexts: updatedDamageTexts,
              pendingLevelUps: levelUpCount > 0 ? levelUpCount - 1 : 0, // 레벨업 보상
              pendingBonusRewards: bonusRewardCount > 0 ? bonusRewardCount - 1 : 0, // 웨이브 보너스 보상
            };
          } else {
            // 레벨업하지 않았을 때만 잠시 후 다음 웨이브로
            setTimeout(() => {
              setGameState(prev => {
                // 보상 선택 중이면 게임을 시작하지 않음
                if (prev.gameStatus === 'choosing' || prev.showRewardScreen) {
                  return prev;
                }
                
                // 플레이어 위치 초기화
                const resetPlayer = {
                  ...prev.player,
                  position: { x: 100, y: CANVAS_HEIGHT - 100 },
                  velocity: { x: 0, y: 0 },
                  isJumping: false,
                };

                const newState = {
                  ...prev,
                  player: resetPlayer,
                  boss: createBoss(prev.wave),
                  platforms: createPlatforms(), // 새로운 맵 생성
                  projectiles: [],
                  gameStatus: 'playing' as const,
                  showWaveComplete: false,
                };

              // 웨이브 진행 시 데이터 저장
              saveGameData({
                score: prev.score,
                wave: prev.wave,
                highScore: Math.max(highScore, prev.score),
                playerHealth: prev.player.health,
                level: prev.player.level,
                experience: prev.player.experience,
                stats: prev.player.stats,
                statPoints: prev.player.statPoints,
                equippedSkills: prev.player.equippedSkills,
                availableSkills: prev.player.availableSkills,
                weaponId: prev.player.weapon.id,
                weaponInventory: prev.player.weaponInventory,
                class: prev.player.class,
                artifacts: prev.player.artifacts,
                equippedArtifacts: prev.player.equippedArtifacts,
              });

                return newState;
              });
            }, 2500);
            
            // 레벨업/보너스 없음: 2.5초 후 다음 웨이브로 진행. 클리어는 웨이브 100에서만.
            return {
              ...prev,
              player: newPlayer,
              boss: newBoss,
              projectiles: updatedProjectiles,
              gameStatus: 'playing',
              score: newScore,
              wave: newWave,
              showWaveComplete,
              lastExpGained,
              damageTexts: updatedDamageTexts,
            };
          }
        }

        // 낙사 체크 (화면 아래로 떨어짐)
        if (newPlayer.position.y > CANVAS_HEIGHT) {
          const fallDamage = Math.floor(newPlayer.maxHealth * 0.1); // 최대 체력의 10%
          newPlayer.health -= fallDamage;
          
          // 낙사 데미지 텍스트
          newDamageTexts.push({
            id: `${Date.now()}-fall`,
            position: {
              x: CANVAS_HEIGHT / 2,
              y: CANVAS_HEIGHT / 2,
            },
            damage: fallDamage,
            isPlayerDamage: true,
            opacity: 1,
            offsetY: 0,
            element: 'physical',
          });
          
          // 안전한 위치로 리스폰 (가장 낮은 플랫폼 중 하나)
          const lowestPlatforms = prev.platforms
            .filter(p => p.y > CANVAS_HEIGHT / 2)
            .sort((a, b) => b.y - a.y);
          
          if (lowestPlatforms.length > 0) {
            const respawnPlatform = lowestPlatforms[0];
            newPlayer.position.x = respawnPlatform.x + respawnPlatform.width / 2 - newPlayer.width / 2;
            newPlayer.position.y = respawnPlatform.y - newPlayer.height - 10;
            newPlayer.velocity.y = 0;
            newPlayer.velocity.x = 0;
          } else {
            // 플랫폼이 없으면 중앙 상단으로
            newPlayer.position.x = CANVAS_HEIGHT / 2;
            newPlayer.position.y = 100;
            newPlayer.velocity.y = 0;
            newPlayer.velocity.x = 0;
          }
        }

        // 패배 조건
        if (newPlayer.health <= 0) {
          newGameStatus = 'defeat';
          lastPlayDurationRef.current = Math.floor((Date.now() - gameStartTime.current) / 1000); // 타이머 정지
          
          // 패배 시 하이스코어만 업데이트하고 저장 데이터는 삭제
          const newHighScore = Math.max(highScore, newScore);
          setHighScore(newHighScore);
          
          // 통계 업데이트
          updateStatisticsOnGameEnd(
            newWave,
            newScore,
            newPlayer.class,
            newPlayer.weapon.name,
            gameStartTime.current,
            true // 사망
          );
          
          // 저장된 게임 데이터 삭제 (초기화)
          localStorage.removeItem('roguelike-game-data');
          
          // 직업 정보도 삭제 (다시 선택하도록)
          localStorage.removeItem('roguelike-selected-class');
          setSelectedClass(null);
          
          // 하이스코어만 별도로 저장
          localStorage.setItem('roguelike-highscore', JSON.stringify(newHighScore));
        }

        // 데이터 저장 (레벨업 보상 선택 시에만)
        if (newGameStatus === 'choosing') {
          const newHighScore = Math.max(highScore, newScore);
          saveGameData({
            score: newScore,
            wave: newWave,
            highScore: newHighScore,
            playerHealth: newPlayer.health,
            level: newPlayer.level,
            experience: newPlayer.experience,
            stats: newPlayer.stats,
            statPoints: newPlayer.statPoints,
            equippedSkills: newPlayer.equippedSkills,
            availableSkills: newPlayer.availableSkills,
            weaponId: newPlayer.weapon.id,
            weaponInventory: newPlayer.weaponInventory,
            class: newPlayer.class,
            artifacts: newPlayer.artifacts,
            equippedArtifacts: newPlayer.equippedArtifacts,
          });
        }

        return {
          ...prev,
          player: newPlayer,
          boss: newBoss,
          projectiles: updatedProjectiles,
          gameStatus: newGameStatus,
          score: newScore,
          wave: newWave,
          showRewardScreen,
          rewardOptions,
          damageTexts: updatedDamageTexts,
        };
      });
      });

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState.gameStatus, gameState.isPaused, highScore]);

  const selectClass = useCallback(
    (classType: ClassType, difficulty: Difficulty = 'normal') => {
      setSelectedClass(classType);
      saveSelectedClass(classType);
      setGameState(createInitialGameState(classType, null, difficulty));
    },
    []
  );

  const restartGame = useCallback(() => {
    localStorage.removeItem('roguelike-game-data');
    const classType = loadSelectedClass() || selectedClass || 'warrior';
    setGameState(createInitialGameState(classType, null, 'normal'));
  }, [selectedClass]);

  const resetGame = useCallback(() => {
    localStorage.removeItem('roguelike-game-data');
    localStorage.removeItem('roguelike-selected-class');
    setSelectedClass(null);
    const classType = selectedClass || 'warrior';
    setGameState(createInitialGameState(classType, null));
    setHighScore(0);
  }, [selectedClass]);

  const upgradeStat = useCallback((statName: 'strength' | 'vitality' | 'agility' | 'defense') => {
    setGameState((prev) => {
      if (prev.player.statPoints <= 0) return prev;
      
      const newStats = { ...prev.player.stats };
      newStats[statName]++;
      
      const newMaxHealth = 100 + (newStats.vitality * 10);
      const healthDiff = newMaxHealth - prev.player.maxHealth;
      
      return {
        ...prev,
        player: {
          ...prev.player,
          stats: newStats,
          statPoints: prev.player.statPoints - 1,
          maxHealth: newMaxHealth,
          health: prev.player.health + healthDiff,
        },
      };
    });
  }, []);

  const equipSkill = useCallback((skill: Skill, slotIndex: number) => {
    setGameState((prev) => {
      const current = prev.player.equippedSkills;
      const slots: (Skill | undefined)[] = [current[0], current[1], current[2]];
      for (let i = 0; i < 3; i++) {
        if (i !== slotIndex && slots[i]?.id === skill.id) slots[i] = undefined;
      }
      slots[slotIndex] = { ...skill, currentCooldown: 0 };
      return {
        ...prev,
        player: {
          ...prev.player,
          equippedSkills: slots,
        },
      };
    });
  }, []);

  const startGame = useCallback((difficulty: Difficulty) => {
    gameStartTime.current = initGameSession(); // 게임 시작 시간 기록
    setGameState(prev => ({
      ...prev,
      gameStatus: 'playing',
      difficulty,
    }));
  }, []);

  const equipWeaponFromInventory = useCallback((weapon: Weapon) => {
    setGameState((prev) => {
      // 현재 장착 중인 무기를 인벤토리에 추가
      const newInventory = [prev.player.weapon, ...prev.player.weaponInventory.filter(w => 
        !(w.id === weapon.id && (w.upgradeLevel || 0) === (weapon.upgradeLevel || 0))
      )];
      
      const newState = {
        ...prev,
        player: {
          ...prev.player,
          weapon: { ...weapon },
          weaponInventory: newInventory,
          attackCooldown: 0,
        },
      };

      // 인벤토리 변경 시 저장
      if (prev.gameStatus === 'playing') {
        saveGameData({
          score: newState.score,
          wave: newState.wave,
          highScore: Math.max(highScore, newState.score),
          playerHealth: newState.player.health,
          level: newState.player.level,
          experience: newState.player.experience,
          stats: newState.player.stats,
          statPoints: newState.player.statPoints,
          equippedSkills: newState.player.equippedSkills,
          availableSkills: newState.player.availableSkills,
          weaponId: newState.player.weapon.id,
          weaponInventory: newState.player.weaponInventory,
          class: newState.player.class,
          artifacts: newState.player.artifacts,
          equippedArtifacts: newState.player.equippedArtifacts,
        });
      }

      return newState;
    });
  }, [highScore]);

  const upgradeWeaponInInventory = useCallback((weapon: Weapon) => {
    setGameState((prev) => {
      const upgraded = upgradeWeapon(weapon);
      
      let newState;
      // 장착 중인 무기인지 확인
      if (weapon.id === prev.player.weapon.id && 
          (weapon.upgradeLevel || 0) === (prev.player.weapon.upgradeLevel || 0)) {
        newState = {
          ...prev,
          player: {
            ...prev.player,
            weapon: upgraded,
          },
        };
      } else {
        // 인벤토리에 있는 무기 강화
        const newInventory = prev.player.weaponInventory.map(w =>
          w.id === weapon.id && (w.upgradeLevel || 0) === (weapon.upgradeLevel || 0) ? upgraded : w
        );
        
        newState = {
          ...prev,
          player: {
            ...prev.player,
            weaponInventory: newInventory,
          },
        };
      }

      // 무기 강화 시 저장
      if (prev.gameStatus === 'playing') {
        saveGameData({
          score: newState.score,
          wave: newState.wave,
          highScore: Math.max(highScore, newState.score),
          playerHealth: newState.player.health,
          level: newState.player.level,
          experience: newState.player.experience,
          stats: newState.player.stats,
          statPoints: newState.player.statPoints,
          equippedSkills: newState.player.equippedSkills,
          availableSkills: newState.player.availableSkills,
          weaponId: newState.player.weapon.id,
          weaponInventory: newState.player.weaponInventory,
          class: newState.player.class,
          artifacts: newState.player.artifacts,
          equippedArtifacts: newState.player.equippedArtifacts,
        });
      }

      return newState;
    });
  }, [highScore]);

  // 포인트를 사용하는 강화 로직
  const upgradeWeaponWithPoints = useCallback((weapon: Weapon, mode: 'single' | 'bulk10') => {
    setGameState((prev) => {
      const cost = mode === 'single' ? 3 : 9;
      if (prev.player.statPoints < cost) {
        // 포인트 부족 시 아무 일도 하지 않음
        return prev;
      }

      const newPlayer = { ...prev.player, statPoints: prev.player.statPoints - cost };

      let newState;
      // 단일 강화 (3포인트로 1회 강화)
      if (mode === 'single') {
        const upgraded = upgradeWeapon(weapon);

        // 장착 중인 무기인지 확인
        if (weapon.id === prev.player.weapon.id && 
            (weapon.upgradeLevel || 0) === (prev.player.weapon.upgradeLevel || 0)) {
          newState = {
            ...prev,
            player: {
              ...newPlayer,
              weapon: upgraded,
            },
          };
        } else {
          // 인벤토리에 있는 무기 강화
          const newInventory = prev.player.weaponInventory.map(w =>
            w.id === weapon.id && (w.upgradeLevel || 0) === (weapon.upgradeLevel || 0) ? upgraded : w
          );

          newState = {
            ...prev,
            player: {
              ...newPlayer,
              weaponInventory: newInventory,
            },
          };
        }
      } else {
        // 9포인트 소비, 50% 확률로 10회 강화
        const success = Math.random() < 0.5;
        if (!success) {
          // 실패: 포인트만 차감, 강화 없음
          newState = {
            ...prev,
            player: newPlayer,
          };
        } else {
          // 성공: 같은 무기에 10회 연속 강화 적용
          let upgradedWeapon = { ...weapon };
          for (let i = 0; i < 10; i++) {
            upgradedWeapon = upgradeWeapon(upgradedWeapon);
          }

          if (weapon.id === prev.player.weapon.id && 
              (weapon.upgradeLevel || 0) === (prev.player.weapon.upgradeLevel || 0)) {
            newState = {
              ...prev,
              player: {
                ...newPlayer,
                weapon: upgradedWeapon,
              },
            };
          } else {
            const newInventory = prev.player.weaponInventory.map(w =>
              w.id === weapon.id && (w.upgradeLevel || 0) === (weapon.upgradeLevel || 0) ? upgradedWeapon : w
            );

            newState = {
              ...prev,
              player: {
                ...newPlayer,
                weaponInventory: newInventory,
              },
            };
          }
        }
      }

      // 무기 강화 시 저장
      if (prev.gameStatus === 'playing') {
        saveGameData({
          score: newState.score,
          wave: newState.wave,
          highScore: Math.max(highScore, newState.score),
          playerHealth: newState.player.health,
          level: newState.player.level,
          experience: newState.player.experience,
          stats: newState.player.stats,
          statPoints: newState.player.statPoints,
          equippedSkills: newState.player.equippedSkills,
          availableSkills: newState.player.availableSkills,
          weaponId: newState.player.weapon.id,
          weaponInventory: newState.player.weaponInventory,
          class: newState.player.class,
          artifacts: newState.player.artifacts,
          equippedArtifacts: newState.player.equippedArtifacts,
        });
      }

      return newState;
    });
  }, [highScore]);

  const evolveWeaponInInventory = useCallback((weapon: Weapon) => {
    setGameState((prev) => {
      const evolved = evolveWeapon(weapon);
      if (!evolved) return prev;
      
      let newState;
      // 장착 중인 무기인지 확인
      if (weapon.id === prev.player.weapon.id && 
          (weapon.upgradeLevel || 0) === (prev.player.weapon.upgradeLevel || 0)) {
        newState = {
          ...prev,
          player: {
            ...prev.player,
            weapon: evolved,
          },
        };
      } else {
        // 인벤토리에 있는 무기 진화
        const newInventory = prev.player.weaponInventory.map(w =>
          w.id === weapon.id && (w.upgradeLevel || 0) === (weapon.upgradeLevel || 0) ? evolved : w
        );
        
        newState = {
          ...prev,
          player: {
            ...prev.player,
            weaponInventory: newInventory,
          },
        };
      }

      // 무기 진화 시 저장
      if (prev.gameStatus === 'playing') {
        saveGameData({
          score: newState.score,
          wave: newState.wave,
          highScore: Math.max(highScore, newState.score),
          playerHealth: newState.player.health,
          level: newState.player.level,
          experience: newState.player.experience,
          stats: newState.player.stats,
          statPoints: newState.player.statPoints,
          equippedSkills: newState.player.equippedSkills,
          availableSkills: newState.player.availableSkills,
          weaponId: newState.player.weapon.id,
          weaponInventory: newState.player.weaponInventory,
          class: newState.player.class,
          artifacts: newState.player.artifacts,
          equippedArtifacts: newState.player.equippedArtifacts,
        });
      }

      return newState;
    });
  }, [highScore]);

  const fuseWeaponsInInventory = useCallback((weapon1: Weapon, weapon2: Weapon) => {
    setGameState((prev) => {
      const fused = fuseWeapons(weapon1, weapon2);
      if (!fused) return prev;
      
      // 두 무기를 인벤토리에서 제거
      let newInventory = [...prev.player.weaponInventory];
      let newWeapon = prev.player.weapon;
      
      // weapon1이 장착 중인 무기인 경우
      if (weapon1.id === prev.player.weapon.id && 
          (weapon1.upgradeLevel || 0) === (prev.player.weapon.upgradeLevel || 0)) {
        newWeapon = fused;
        newInventory = newInventory.filter(w => 
          !(w.id === weapon2.id && (w.upgradeLevel || 0) === (weapon2.upgradeLevel || 0))
        );
      }
      // weapon2가 장착 중인 무기인 경우
      else if (weapon2.id === prev.player.weapon.id && 
               (weapon2.upgradeLevel || 0) === (prev.player.weapon.upgradeLevel || 0)) {
        newWeapon = fused;
        newInventory = newInventory.filter(w => 
          !(w.id === weapon1.id && (w.upgradeLevel || 0) === (weapon1.upgradeLevel || 0))
        );
      }
      // 둘 다 인벤토리에 있는 경우
      else {
        newWeapon = fused; // 합성된 무기 장착
        newInventory = [prev.player.weapon, ...newInventory.filter(w => 
          !(w.id === weapon1.id && (w.upgradeLevel || 0) === (weapon1.upgradeLevel || 0)) &&
          !(w.id === weapon2.id && (w.upgradeLevel || 0) === (weapon2.upgradeLevel || 0))
        )];
      }
      
      const newState = {
        ...prev,
        player: {
          ...prev.player,
          weapon: newWeapon,
          weaponInventory: newInventory,
          attackCooldown: 0,
        },
      };

      // 무기 합성 시 저장
      if (prev.gameStatus === 'playing') {
        saveGameData({
          score: newState.score,
          wave: newState.wave,
          highScore: Math.max(highScore, newState.score),
          playerHealth: newState.player.health,
          level: newState.player.level,
          experience: newState.player.experience,
          stats: newState.player.stats,
          statPoints: newState.player.statPoints,
          equippedSkills: newState.player.equippedSkills,
          availableSkills: newState.player.availableSkills,
          weaponId: newState.player.weapon.id,
          weaponInventory: newState.player.weaponInventory,
          class: newState.player.class,
          artifacts: newState.player.artifacts,
          equippedArtifacts: newState.player.equippedArtifacts,
        });
      }

      return newState;
    });
  }, [highScore]);

  // 아티펙트 장착
  const equipArtifact = useCallback((artifact: Artifact, slotIndex: number) => {
    setGameState((prev) => {
      const newEquippedArtifacts = [...prev.player.equippedArtifacts];
      
      // 이미 다른 슬롯에 장착되어 있는지 확인
      const existingSlot = newEquippedArtifacts.findIndex(
        (eq, idx) => eq && eq.id === artifact.id && idx !== slotIndex
      );
      if (existingSlot !== -1) {
        newEquippedArtifacts[existingSlot] = null;
      }
      
      // 새 슬롯에 장착
      newEquippedArtifacts[slotIndex] = artifact;
      
      // 체력 보너스 재계산
      const healthBonus = newEquippedArtifacts.reduce((acc, art) => {
        if (!art) return acc;
        return acc + (art.effects.healthBonus || 0);
      }, 0);
      
      const baseMaxHealth = 100 + (prev.player.stats.vitality * 10);
      const newMaxHealth = Math.floor(baseMaxHealth * (1 + healthBonus / 100));
      const healthRatio = prev.player.health / prev.player.maxHealth;
      const newHealth = Math.floor(newMaxHealth * healthRatio);
      
      const newState = {
        ...prev,
        player: {
          ...prev.player,
          equippedArtifacts: newEquippedArtifacts,
          maxHealth: newMaxHealth,
          health: Math.min(newHealth, newMaxHealth),
        },
      };

      // 아티펙트 장착 시 저장
      if (prev.gameStatus === 'playing') {
        saveGameData({
          score: newState.score,
          wave: newState.wave,
          highScore: Math.max(highScore, newState.score),
          playerHealth: newState.player.health,
          level: newState.player.level,
          experience: newState.player.experience,
          stats: newState.player.stats,
          statPoints: newState.player.statPoints,
          equippedSkills: newState.player.equippedSkills,
          availableSkills: newState.player.availableSkills,
          weaponId: newState.player.weapon.id,
          weaponInventory: newState.player.weaponInventory,
          class: newState.player.class,
          artifacts: newState.player.artifacts,
          equippedArtifacts: newState.player.equippedArtifacts,
        });
      }

      return newState;
    });
  }, [highScore]);

  // 아티펙트 해제
  const unequipArtifact = useCallback((slotIndex: number) => {
    setGameState((prev) => {
      const newEquippedArtifacts = [...prev.player.equippedArtifacts];
      newEquippedArtifacts[slotIndex] = null;
      
      // 체력 보너스 재계산
      const healthBonus = newEquippedArtifacts.reduce((acc, art) => {
        if (!art) return acc;
        return acc + (art.effects.healthBonus || 0);
      }, 0);
      
      const baseMaxHealth = 100 + (prev.player.stats.vitality * 10);
      const newMaxHealth = Math.floor(baseMaxHealth * (1 + healthBonus / 100));
      const healthRatio = prev.player.health / prev.player.maxHealth;
      const newHealth = Math.floor(newMaxHealth * healthRatio);
      
      const newPlayer = {
        ...prev.player,
        equippedArtifacts: newEquippedArtifacts,
        maxHealth: newMaxHealth,
        health: Math.min(newHealth, newMaxHealth),
      };

      // 아티펙트 변경 시 저장
      if (prev.gameStatus === 'playing') {
        saveGameData({
          score: prev.score,
          wave: prev.wave,
          highScore: Math.max(highScore, prev.score),
          playerHealth: newPlayer.health,
          level: newPlayer.level,
          experience: newPlayer.experience,
          stats: newPlayer.stats,
          statPoints: newPlayer.statPoints,
          equippedSkills: newPlayer.equippedSkills,
          availableSkills: newPlayer.availableSkills,
          weaponId: newPlayer.weapon.id,
          weaponInventory: newPlayer.weaponInventory,
          class: newPlayer.class,
          artifacts: newPlayer.artifacts,
          equippedArtifacts: newPlayer.equippedArtifacts,
        });
      }

      return {
        ...prev,
        player: newPlayer,
      };
    });
  }, [highScore]);

  const getLastPlayDuration = useCallback(() => lastPlayDurationRef.current, []);

  return {
    gameState,
    gameStateRef,
    highScore,
    selectedClass,
    selectClass,
    restartGame,
    resetGame,
    upgradeStat,
    equipSkill,
    useSkill,
    handleRewardSelect,
    togglePause,
    startGame,
    equipWeaponFromInventory,
    upgradeWeaponInInventory,
    upgradeWeaponWithPoints,
    evolveWeaponInInventory,
    fuseWeaponsInInventory,
    equipArtifact,
    unequipArtifact,
    playElapsedSeconds,
    getLastPlayDuration,
    setMovementKeys,
  };
};
