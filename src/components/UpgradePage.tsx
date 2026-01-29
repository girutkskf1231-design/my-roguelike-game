import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Zap } from 'lucide-react';
import type { Weapon, Player } from '../types/game';
import { upgradeWeapon } from '../utils/gameLogic';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface UpgradePageProps {
  player: Player;
  onClose: () => void;
  onUpgradeWeapon: (weapon: Weapon, mode: 'single' | 'bulk10') => void;
  embedded?: boolean;
}

const UpgradePage: React.FC<UpgradePageProps> = ({
  player,
  onClose,
  onUpgradeWeapon,
  embedded = false,
}) => {
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [previewWeapon, setPreviewWeapon] = useState<Weapon | null>(null);
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);

  const allWeapons = [player.weapon, ...player.weaponInventory];

  // 선택된 무기가 강화되면 자동으로 업데이트 (무한 루프 방지를 위해 최소 변경만 반영)
  useEffect(() => {
    if (!selectedWeaponId) return;

    const all = [player.weapon, ...player.weaponInventory];
    const sameIdWeapons = all.filter(w => w.id === selectedWeaponId);
    if (sameIdWeapons.length === 0) return;

    // 같은 ID 중 가장 높은 강화 레벨 무기 찾기
    const highestLevelWeapon = sameIdWeapons.reduce((prev, current) => 
      (current.upgradeLevel || 0) > (prev.upgradeLevel || 0) ? current : prev
    );

    // 이미 동일한 무기가 선택되어 있다면 상태 갱신하지 않음
    if (
      selectedWeapon &&
      selectedWeapon.id === highestLevelWeapon.id &&
      (selectedWeapon.upgradeLevel || 0) === (highestLevelWeapon.upgradeLevel || 0)
    ) {
      return;
    }
    
    setSelectedWeapon(highestLevelWeapon);
    setPreviewWeapon(upgradeWeapon(highestLevelWeapon));
  }, [selectedWeaponId, player.weapon, player.weaponInventory, selectedWeapon]);

  const getWeaponColor = (weapon: Weapon) => {
    const level = weapon.upgradeLevel || 0;
    if (level >= 10) return 'border-purple-500 bg-purple-900/20';
    if (level >= 5) return 'border-yellow-500 bg-yellow-900/20';
    if (level >= 3) return 'border-blue-500 bg-blue-900/20';
    return 'border-gray-500 bg-gray-900/20';
  };

  const isEquipped = (weapon: Weapon) => {
    return weapon.id === player.weapon.id && 
           (weapon.upgradeLevel || 0) === (player.weapon.upgradeLevel || 0);
  };

  const handleWeaponClick = (weapon: Weapon) => {
    setSelectedWeaponId(weapon.id);
    setSelectedWeapon(weapon);
    setPreviewWeapon(upgradeWeapon(weapon));
  };

  const handleUpgrade = () => {
    if (selectedWeapon) {
      onUpgradeWeapon(selectedWeapon, 'single');
      // selectedWeaponId가 유지되므로 useEffect가 자동으로 강화된 무기를 선택
    }
  };

  const handleBulkUpgrade = () => {
    if (selectedWeapon) {
      onUpgradeWeapon(selectedWeapon, 'bulk10');
      // 성공/실패 여부와 관계없이 선택 무기는 useEffect로 다시 동기화
    }
  };

  return (
    <div className={embedded ? 'h-full w-full flex flex-col overflow-hidden bg-slate-900' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm'}>
      <div className={embedded ? 'flex-1 min-h-0 flex flex-col overflow-hidden p-2' : 'max-w-7xl w-full h-[90vh] p-4 flex flex-col'}>
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-yellow-900/80 to-orange-900/80 rounded-lg p-4 border-2 border-yellow-600">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
              무기 강화소
            </h1>
            <p className="text-yellow-200 text-sm mt-1">
              ⬆️ 무기를 선택하고 강화하세요 (공격력 +10%, 공격속도 +5%)
            </p>
          </div>
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 h-10 w-10 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* 왼쪽: 무기 목록 */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-sm text-gray-300">
                💡 <span className="font-bold">강화 시스템</span>
                <ul className="mt-2 space-y-1 text-xs text-gray-400 ml-4">
                  <li>• 공격력: 레벨당 +10% 증가</li>
                  <li>• 공격속도: 5% 증가 (쿨다운 감소)</li>
                  <li>• 사거리와 원소 데미지는 강화되지 않음</li>
                  <li>• 강화 제한 없음 (무한 강화 가능)</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {allWeapons.map((weapon, index) => {
                const equipped = isEquipped(weapon);
                const selected = selectedWeapon?.id === weapon.id;
                const currentLevel = weapon.upgradeLevel || 0;
                
                return (
                  <Card
                    key={`${weapon.id}-${index}`}
                    className={`p-4 cursor-pointer transition-all ${getWeaponColor(weapon)} ${
                      equipped ? 'ring-2 ring-green-500' : ''
                    } ${selected ? 'ring-3 ring-yellow-500 scale-105' : ''} 
                    hover:scale-105 hover:shadow-xl border-2`}
                    onClick={() => handleWeaponClick(weapon)}
                  >
                    <div className="text-center">
                      {equipped && (
                        <div className="mb-2">
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                            ⚔️ 장착중
                          </span>
                        </div>
                      )}
                      <div className="text-3xl mb-2">{weapon.name.split(' ')[0]}</div>
                      <div className="text-sm font-bold text-white mb-2">
                        {weapon.name.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="bg-yellow-600 text-white text-xs px-2 py-1 rounded inline-block mb-2">
                        Lv. {currentLevel}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="text-red-400 font-bold">💥 {weapon.damage}</div>
                        <div className="text-blue-400">⚡ {weapon.attackSpeed}f</div>
                        {weapon.elementalDamage && (
                          <div className="text-purple-400">✨ {weapon.elementalDamage}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 오른쪽: 강화 미리보기 */}
          <div className="w-96 bg-gradient-to-b from-slate-900/90 to-yellow-900/30 rounded-lg p-6 border-2 border-yellow-600">
            {selectedWeapon && previewWeapon ? (
              <div className="space-y-4">
                <div className="text-center border-b-2 border-yellow-600 pb-4">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-yellow-400 animate-pulse" />
                  <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                    강화 미리보기
                  </h2>
                  <p className="text-gray-300 text-sm">강화하시겠습니까?</p>
                </div>

                {/* 무기 정보 */}
                <div className="text-center bg-slate-800 rounded-lg p-4 border border-slate-600">
                  <div className="text-4xl mb-2">{selectedWeapon.name.split(' ')[0]}</div>
                  <div className="text-lg font-bold text-white">
                    {selectedWeapon.name.split(' ').slice(1).join(' ')}
                  </div>
                </div>

                {/* Before -> After */}
                <div className="space-y-3">
                  {/* 레벨 */}
                  <div className="bg-slate-800 rounded-lg p-3 border border-slate-600">
                    <div className="text-center">
                      <div className="text-gray-400 text-xs mb-2">레벨</div>
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-xl font-bold text-yellow-400">
                          +{selectedWeapon.upgradeLevel || 0}
                        </div>
                        <div className="text-2xl">→</div>
                        <div className="text-2xl font-bold text-yellow-300 animate-pulse">
                          +{(selectedWeapon.upgradeLevel || 0) + 1}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 데미지 */}
                  <div className="bg-slate-800 rounded-lg p-3 border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        <div className="text-gray-400 text-xs mb-1">현재</div>
                        <div className="text-red-400 font-bold text-lg">
                          💥 {selectedWeapon.damage}
                        </div>
                      </div>
                      <Zap className="w-6 h-6 text-yellow-400" />
                      <div className="flex-1 text-center">
                        <div className="text-gray-400 text-xs mb-1">강화 후</div>
                        <div className="text-red-300 font-bold text-xl animate-pulse">
                          💥 {previewWeapon.damage}
                        </div>
                        <div className="text-green-400 text-xs">
                          +{previewWeapon.damage - selectedWeapon.damage}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 공격속도 */}
                  <div className="bg-slate-800 rounded-lg p-3 border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        <div className="text-gray-400 text-xs mb-1">현재</div>
                        <div className="text-blue-400 font-bold">
                          ⚡ {selectedWeapon.attackSpeed}f
                        </div>
                      </div>
                      <Zap className="w-6 h-6 text-yellow-400" />
                      <div className="flex-1 text-center">
                        <div className="text-gray-400 text-xs mb-1">강화 후</div>
                        <div className="text-blue-300 font-bold animate-pulse">
                          ⚡ {previewWeapon.attackSpeed}f
                        </div>
                        <div className="text-green-400 text-xs">
                          {previewWeapon.attackSpeed - selectedWeapon.attackSpeed < 0 ? '더 빠름!' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 사거리 (변경 없음) */}
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        <div className="text-gray-400 text-xs mb-1">사거리</div>
                        <div className="text-green-400 font-bold">
                          🎯 {selectedWeapon.range}
                        </div>
                      </div>
                      <div className="text-gray-500 text-xs">변경 없음</div>
                      <div className="flex-1 text-center">
                        <div className="text-gray-400 text-xs mb-1">강화 후</div>
                        <div className="text-green-400 font-bold">
                          🎯 {previewWeapon.range}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 원소 데미지 (변경 없음) */}
                  {selectedWeapon.elementalDamage && (
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-600 opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-center">
                          <div className="text-gray-400 text-xs mb-1">원소 데미지</div>
                          <div className="text-purple-400 font-bold">
                            ✨ {selectedWeapon.elementalDamage}
                          </div>
                        </div>
                        <div className="text-gray-500 text-xs">변경 없음</div>
                        <div className="flex-1 text-center">
                          <div className="text-gray-400 text-xs mb-1">강화 후</div>
                          <div className="text-purple-400 font-bold">
                            ✨ {selectedWeapon.elementalDamage}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 강화 버튼들 */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 h-14 text-sm font-bold border-2 border-yellow-400 shadow-lg"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    3포인트로 1회 강화
                  </Button>
                  <Button
                    onClick={handleBulkUpgrade}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-14 text-sm font-bold border-2 border-purple-400 shadow-lg"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    9포인트로 10회 (50%)
                  </Button>
                </div>

                {/* 강화 설명 */}
                <div className="bg-yellow-900/30 rounded-lg p-3 border border-yellow-600 mt-2">
                  <div className="text-yellow-400 text-xs font-bold mb-1">
                    ⚡ 강화 규칙
                  </div>
                  <div className="text-gray-300 text-xs space-y-1">
                    <div>• 3 포인트: 공격력 +10%, 공격속도 +5% (1회 강화)</div>
                    <div>• 9 포인트: 50% 확률로 10회 연속 강화</div>
                    <div>• 실패 시: 포인트만 소모되고 강화되지 않음</div>
                    <div>• 사거리/원소 데미지는 강화되지 않음</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">강화할 무기를 선택하세요</p>
                  <p className="text-sm mt-2">왼쪽에서 무기를 클릭해주세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
