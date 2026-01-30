import { useEffect, useCallback, useRef } from 'react';
import type { Player } from '../types/game';
import { 
  getPlayerInventory, 
  savePlayerInventory, 
  type PlayerInventoryData 
} from '../lib/supabase';

interface UseInventorySyncProps {
  userId: string | null;
  player: Player;
  wave: number;
  score: number;
  difficulty: 'normal' | 'hard';
  enabled: boolean; // 로그인 상태일 때만 동기화
}

/**
 * 플레이어 인벤토리를 Supabase와 자동 동기화하는 훅
 * - 게임 시작 시 서버에서 데이터 로드
 * - 주기적으로 서버에 자동 저장
 * - 무기/스킬/아티팩트 변경 시 즉시 저장
 */
export function useInventorySync({
  userId,
  player,
  wave,
  score,
  difficulty,
  enabled,
}: UseInventorySyncProps) {
  const lastSaveRef = useRef<number>(0);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // 플레이어 데이터를 인벤토리 형식으로 변환
  const convertToInventoryData = useCallback((): PlayerInventoryData | null => {
    if (!userId) return null;

    return {
      user_id: userId,
      current_level: player.level,
      current_experience: player.experience,
      current_wave: wave,
      current_score: score,
      current_health: player.health,
      max_health: player.maxHealth,
      stats: player.stats,
      stat_points: player.statPoints,
      class_type: player.class,
      equipped_weapon_id: player.weapon.id,
      equipped_weapon_upgrade_level: player.weapon.upgradeLevel || 0,
      weapons: player.weaponInventory.map(w => ({
        id: w.id,
        upgradeLevel: w.upgradeLevel,
        isEvolved: w.isEvolved,
      })),
      equipped_skills: player.equippedSkills.map(s => s?.id || null),
      available_skills: player.availableSkills.map(s => s.id),
      artifacts: player.artifacts.map(a => a.id),
      equipped_artifacts: player.equippedArtifacts.map(a => a?.id || null),
      difficulty,
    };
  }, [userId, player, wave, score, difficulty]);

  // 서버에 저장
  const saveToServer = useCallback(async () => {
    if (!enabled || !userId || isSavingRef.current) return;

    const inventoryData = convertToInventoryData();
    if (!inventoryData) return;

    isSavingRef.current = true;
    try {
      const result = await savePlayerInventory(inventoryData);
      if (result.ok) {
        lastSaveRef.current = Date.now();
        console.log('✅ 인벤토리 저장 완료');
      } else {
        console.error('❌ 인벤토리 저장 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 인벤토리 저장 예외:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [enabled, userId, convertToInventoryData]);

  // 서버에서 로드
  const loadFromServer = useCallback(async (): Promise<PlayerInventoryData | null> => {
    if (!enabled || !userId) return null;

    try {
      const data = await getPlayerInventory(userId);
      if (data) {
        console.log('✅ 인벤토리 로드 완료:', data);
        return data;
      }
      console.log('ℹ️ 저장된 인벤토리 없음 (첫 게임)');
      return null;
    } catch (error) {
      console.error('❌ 인벤토리 로드 예외:', error);
      return null;
    }
  }, [enabled, userId]);

  // 자동 저장 (30초마다)
  useEffect(() => {
    if (!enabled || !userId) return;

    saveIntervalRef.current = setInterval(() => {
      const now = Date.now();
      // 마지막 저장으로부터 30초 이상 경과했으면 저장
      if (now - lastSaveRef.current >= 30000) {
        saveToServer();
      }
    }, 30000); // 30초마다 체크

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [enabled, userId, saveToServer]);

  // 중요한 변경사항 발생 시 즉시 저장
  useEffect(() => {
    if (!enabled || !userId) return;

    const now = Date.now();
    // 마지막 저장으로부터 5초 이상 경과했으면 저장
    if (now - lastSaveRef.current >= 5000) {
      saveToServer();
    }
  }, [
    enabled,
    userId,
    player.weaponInventory.length,
    player.availableSkills.length,
    player.artifacts.length,
    player.level,
    saveToServer,
  ]);

  return {
    saveToServer,
    loadFromServer,
    lastSaveTime: lastSaveRef.current,
  };
}
