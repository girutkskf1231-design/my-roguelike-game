import type { Boss, Player, DamageText } from '../types/game';

/** 무기별 데미지 배율 (보스 전용 등) */
export function getDamageMultiplier(weaponId: string | undefined, targetIsBoss: boolean): number {
  if (!weaponId) return 1;
  if (targetIsBoss && weaponId === 'holy_staff') return 1.5;
  if (targetIsBoss && weaponId === 'celestial_staff') return 1.3; // 신성한 빛 (언데드 특효)
  return 1;
}

/** 무기별 방어력 무시 비율 (0~1) */
export function getArmorPenetration(weaponId: string | undefined): number {
  if (!weaponId) return 0;
  if (weaponId === 'axe') return 0.2;
  if (weaponId === 'titan_greatsword') return 0.2;
  if (weaponId === 'titan_crusher') return 0.3; // 방어 파괴
  return 0;
}

/** 무기 공격 시 플레이어 회복량 (holy_sword 등) */
export function getHealOnHit(weaponId: string | undefined): number {
  if (!weaponId) return 0;
  if (weaponId === 'holy_sword') return 5;
  if (weaponId === 'divine_wand') return 3;
  return 0;
}

/** 무기 공격 시 흡혈 비율 (0~1) */
export function getLifestealRate(weaponId: string | undefined): number {
  if (!weaponId) return 0;
  if (weaponId === 'soul_dagger') return 0.15;
  return 0;
}

/** 50% 확률 추가 타격 (shadow_dual_sword) */
export function shouldApplyExtraHit(weaponId: string | undefined): boolean {
  if (!weaponId) return false;
  if (weaponId === 'shadow_dual_sword') return Math.random() < 0.5;
  return false;
}

/** 출혈 데미지 적용 (demon_twin_blades, demon_shuriken) */
export function getBleedDamage(weaponId: string | undefined, baseDamage: number): number {
  if (!weaponId) return 0;
  if (weaponId === 'demon_twin_blades' || weaponId === 'demon_shuriken') {
    return Math.floor(baseDamage * 0.1); // 10% 출혈 틱
  }
  return 0;
}

/** 스턴 적용 (thunder_hammer) */
export function shouldApplyStun(weaponId: string | undefined): boolean {
  if (!weaponId) return false;
  if (weaponId === 'thunder_hammer') return Math.random() < 0.3;
  return false;
}

/** 보스 넉백 (titan_greatsword) - velocity에 반영 */
export function getKnockbackForce(weaponId: string | undefined, facingRight: boolean): { x: number; y: number } | null {
  if (!weaponId) return null;
  if (weaponId === 'titan_greatsword') {
    return { x: facingRight ? 8 : -8, y: -2 };
  }
  return null;
}

/** 속성 디버프 적용 확률 (magic 무기 기본 30%, 일부 무기는 더 높음) */
export function getDebuffChance(weaponId: string | undefined): number {
  if (!weaponId) return 0.3;
  if (weaponId === 'toxic_flame_staff') return 0.8; // 화상+맹독 동시
  if (weaponId === 'plague_staff') return 0.6; // 맹독+독 확산
  if (weaponId === 'absolute_zero_staff') return 0.7; // 동결+둔화
  if (weaponId === 'storm_caller_staff') return 0.5; // 연쇄 번개
  return 0.3;
}

/** 디버프 지속시간 배율 (dark_staff) */
export function getDebuffDurationMultiplier(weaponId: string | undefined): number {
  if (!weaponId) return 1;
  if (weaponId === 'dark_staff') return 1.5;
  return 1;
}

/** 천상의 포격 등 - 폭발 시 추가 데미지 */
export function getExplosionExtraDamage(weaponId: string | undefined, elementalDmg: number): number {
  if (!weaponId) return 0;
  if (weaponId === 'celestial_artillery') return Math.floor(elementalDmg * 0.3);
  if (weaponId === 'inferno_staff') return Math.floor(elementalDmg * 0.2);
  if (weaponId === 'dragon_axe') return Math.floor(elementalDmg * 0.5); // 화염 폭발 광역
  return 0;
}

/** 무기 on-hit 효과 적용 (회복, 흡혈, 디버프 등) */
export function applyWeaponOnHitEffects(
  weaponId: string | undefined,
  totalDamage: number,
  elementalDamage: number,
  boss: Boss,
  player: Player,
  damageTexts: DamageText[]
): { boss: Boss; player: Player; damageTexts: DamageText[] } {
  let newBoss = { ...boss };
  let newPlayer = { ...player };
  const newDamageTexts = [...damageTexts];

  if (!weaponId) return { boss: newBoss, player: newPlayer, damageTexts: newDamageTexts };

  // 체력 회복 (holy_sword, divine_wand)
  const healAmount = getHealOnHit(weaponId);
  if (healAmount > 0) {
    const actualHeal = Math.min(healAmount, newPlayer.maxHealth - newPlayer.health);
    if (actualHeal > 0) {
      newPlayer = { ...newPlayer, health: newPlayer.health + actualHeal };
    }
  }

  // 흡혈 (soul_dagger)
  const lifestealRate = getLifestealRate(weaponId);
  if (lifestealRate > 0) {
    const totalDmg = totalDamage + elementalDamage;
    const lifestealAmount = Math.floor(totalDmg * lifestealRate);
    const actualHeal = Math.min(lifestealAmount, newPlayer.maxHealth - newPlayer.health);
    if (actualHeal > 0) {
      newPlayer = { ...newPlayer, health: newPlayer.health + actualHeal };
    }
  }

  // 출혈 디버프 (demon_twin_blades, demon_shuriken)
  const bleedDmg = getBleedDamage(weaponId, totalDamage + elementalDamage);
  if (bleedDmg > 0) {
    const existingBleed = newBoss.debuffs.find(d => d.type === 'dark' && d.tickDamage);
    if (existingBleed) {
      existingBleed.duration = 180; // 3초
      existingBleed.tickDamage = Math.max(existingBleed.tickDamage ?? 0, Math.floor(bleedDmg / 3));
    } else {
      newBoss.debuffs.push({
        type: 'dark',
        duration: 180,
        tickDamage: Math.floor(bleedDmg / 3),
      });
    }
  }

  // 스턴 (thunder_hammer)
  if (shouldApplyStun(weaponId)) {
    const hasStun = newBoss.debuffs.some(d => d.stunned);
    if (!hasStun) {
      newBoss.debuffs.push({
        type: 'lightning',
        duration: 90, // 1.5초
        stunned: true,
      });
    }
  }

  return { boss: newBoss, player: newPlayer, damageTexts: newDamageTexts };
}
