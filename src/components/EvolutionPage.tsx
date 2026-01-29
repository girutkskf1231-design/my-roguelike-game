import React, { useState } from 'react';
import { X, Sparkles, Sword } from 'lucide-react';
import type { Weapon, Player } from '../types/game';
import { canEvolveWeapon, evolveWeapon } from '../utils/gameLogic';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface EvolutionPageProps {
  player: Player;
  onClose: () => void;
  onEvolveWeapon: (weapon: Weapon) => void;
  embedded?: boolean;
}

const EvolutionPage: React.FC<EvolutionPageProps> = ({
  player,
  onClose,
  onEvolveWeapon,
  embedded = false,
}) => {
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [previewWeapon, setPreviewWeapon] = useState<Weapon | null>(null);

  const allWeapons = [player.weapon, ...player.weaponInventory];
  const evolvableWeapons = allWeapons.filter(w => canEvolveWeapon(w));

  const isEquipped = (weapon: Weapon) => {
    return weapon.id === player.weapon.id && 
           (weapon.upgradeLevel || 0) === (player.weapon.upgradeLevel || 0);
  };

  const handleWeaponClick = (weapon: Weapon) => {
    if (canEvolveWeapon(weapon)) {
      setSelectedWeapon(weapon);
      const evolved = evolveWeapon(weapon);
      setPreviewWeapon(evolved);
    }
  };

  const handleEvolve = () => {
    if (selectedWeapon) {
      onEvolveWeapon(selectedWeapon);
      setSelectedWeapon(null);
      setPreviewWeapon(null);
    }
  };

  return (
    <div className={embedded ? 'h-full w-full flex flex-col overflow-hidden bg-slate-900' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm'}>
      <div className={embedded ? 'flex-1 min-h-0 flex flex-col overflow-hidden p-2' : 'max-w-7xl w-full h-[90vh] p-4 flex flex-col'}>
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-pink-900/80 to-purple-900/80 rounded-lg p-4 border-2 border-pink-600">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
              무기 진화소
            </h1>
            <p className="text-pink-200 text-sm mt-1">
              🦋 무기를 선택하고 진화시키세요 (+5 이상 강화 필요)
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
                💡 <span className="font-bold">진화 시스템</span>
                <ul className="mt-2 space-y-1 text-xs text-gray-400 ml-4">
                  <li>• 강화 레벨 +5 이상 시 진화 가능</li>
                  <li>• 진화 시 새로운 무기로 변환</li>
                  <li>• 강화 레벨 50% 유지</li>
                  <li>• 원소 속성 및 특수 능력 변경</li>
                </ul>
              </div>
            </div>

            {evolvableWeapons.length === 0 ? (
              <div className="text-center p-8 bg-slate-800/50 rounded-lg border border-slate-600">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg font-bold">진화 가능한 무기가 없습니다</p>
                <p className="text-gray-500 text-sm mt-2">무기를 +5 이상 강화하면 진화할 수 있습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {evolvableWeapons.map((weapon, index) => {
                  const equipped = isEquipped(weapon);
                  const selected = selectedWeapon?.id === weapon.id;
                  const currentLevel = weapon.upgradeLevel || 0;
                  
                  return (
                    <Card
                      key={`${weapon.id}-${index}`}
                      className={`p-4 cursor-pointer transition-all border-2 border-pink-500 bg-pink-900/20 ${
                        equipped ? 'ring-2 ring-green-500' : ''
                      } ${selected ? 'ring-3 ring-pink-400 scale-105 animate-pulse' : ''} 
                      hover:scale-105 hover:shadow-xl`}
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
                        <div className="text-4xl mb-2">{weapon.name.split(' ')[0]}</div>
                        <div className="text-sm font-bold text-white mb-2">
                          {weapon.name.split(' ').slice(1).join(' ')}
                        </div>
                        <div className="bg-pink-600 text-white text-xs px-2 py-1 rounded inline-block mb-2 animate-pulse">
                          ✨ 진화 가능!
                        </div>
                        <div className="text-xs text-yellow-400 mb-2">
                          Lv. +{currentLevel}
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
            )}
          </div>

          {/* 오른쪽: 진화 미리보기 */}
          <div className="w-[450px] bg-gradient-to-b from-slate-900/90 to-pink-900/30 rounded-lg p-6 border-2 border-pink-600">
            {selectedWeapon && previewWeapon ? (
              <div className="space-y-4">
                <div className="text-center border-b-2 border-pink-600 pb-4">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-pink-400 animate-spin" />
                  <h2 className="text-2xl font-bold text-pink-400 mb-2">
                    진화 미리보기
                  </h2>
                  <p className="text-gray-300 text-sm">진화하시겠습니까?</p>
                </div>

                {/* Before -> After 비교 */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="bg-slate-800 rounded-lg p-4 border-2 border-gray-600">
                    <div className="text-center mb-3">
                      <div className="text-gray-400 text-xs mb-2">현재</div>
                      <div className="text-3xl mb-2">{selectedWeapon.name.split(' ')[0]}</div>
                      <div className="text-sm font-bold text-white mb-2">
                        {selectedWeapon.name.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="bg-yellow-600 text-white text-xs px-2 py-1 rounded inline-block">
                        Lv. +{selectedWeapon.upgradeLevel || 0}
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">데미지</span>
                        <span className="text-red-400 font-bold">{selectedWeapon.damage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">공격속도</span>
                        <span className="text-blue-400">{selectedWeapon.attackSpeed}f</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">사거리</span>
                        <span className="text-green-400">{selectedWeapon.range}</span>
                      </div>
                      {selectedWeapon.elementalDamage && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">원소</span>
                          <span className="text-purple-400">{selectedWeapon.elementalDamage}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* After */}
                  <div className="bg-gradient-to-br from-pink-900 to-purple-900 rounded-lg p-4 border-2 border-pink-400 animate-pulse">
                    <div className="text-center mb-3">
                      <div className="text-pink-400 text-xs mb-2">진화 후</div>
                      <div className="text-4xl mb-2">{previewWeapon.name.split(' ')[0]}</div>
                      <div className="text-sm font-bold text-pink-200 mb-2">
                        {previewWeapon.name.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="bg-pink-600 text-white text-xs px-2 py-1 rounded inline-block">
                        Lv. +{previewWeapon.upgradeLevel || 0}
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-pink-200">데미지</span>
                        <span className="text-red-300 font-bold">{previewWeapon.damage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pink-200">공격속도</span>
                        <span className="text-blue-300">{previewWeapon.attackSpeed}f</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pink-200">사거리</span>
                        <span className="text-green-300">{previewWeapon.range}</span>
                      </div>
                      {previewWeapon.elementalDamage && (
                        <div className="flex justify-between">
                          <span className="text-pink-200">원소</span>
                          <span className="text-purple-300">{previewWeapon.elementalDamage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 진화 애니메이션 화살표 */}
                <div className="text-center">
                  <div className="text-5xl animate-bounce">⬇️</div>
                  <div className="text-pink-400 text-sm font-bold mt-2">진화!</div>
                </div>

                {/* 변경 사항 */}
                <div className="bg-slate-800 rounded-lg p-4 border border-pink-600">
                  <div className="text-pink-400 font-bold text-sm mb-3">🦋 변경 사항</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-700 p-2 rounded">
                      <span className="text-gray-300">데미지</span>
                      <span className={previewWeapon.damage > selectedWeapon.damage ? 'text-green-400' : 'text-yellow-400'}>
                        {previewWeapon.damage > selectedWeapon.damage ? '▲' : '→'} {previewWeapon.damage - selectedWeapon.damage >= 0 ? '+' : ''}{previewWeapon.damage - selectedWeapon.damage}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-700 p-2 rounded">
                      <span className="text-gray-300">공격속도</span>
                      <span className={previewWeapon.attackSpeed < selectedWeapon.attackSpeed ? 'text-green-400' : 'text-yellow-400'}>
                        {previewWeapon.attackSpeed < selectedWeapon.attackSpeed ? '▲ 빠름!' : '→ 유지'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-700 p-2 rounded">
                      <span className="text-gray-300">사거리</span>
                      <span className={previewWeapon.range > selectedWeapon.range ? 'text-green-400' : 'text-yellow-400'}>
                        {previewWeapon.range > selectedWeapon.range ? '▲' : '→'} {previewWeapon.range - selectedWeapon.range >= 0 ? '+' : ''}{previewWeapon.range - selectedWeapon.range}
                      </span>
                    </div>
                    {previewWeapon.element !== selectedWeapon.element && (
                      <div className="flex items-center justify-between bg-purple-900/50 p-2 rounded border border-purple-500">
                        <span className="text-purple-300">원소 속성</span>
                        <span className="text-purple-300">
                          {selectedWeapon.element || '없음'} → {previewWeapon.element || '없음'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 특수 능력 */}
                {previewWeapon.special && (
                  <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-3 border border-yellow-600">
                    <div className="text-yellow-400 font-bold text-sm mb-1">
                      ⭐ 새로운 특수 능력
                    </div>
                    <div className="text-yellow-300 text-xs">
                      {previewWeapon.special}
                    </div>
                  </div>
                )}

                {/* 진화 버튼 */}
                <Button
                  onClick={handleEvolve}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 h-14 text-lg font-bold border-2 border-pink-400 shadow-lg animate-pulse"
                >
                  <Sparkles className="w-6 h-6 mr-2 animate-spin" />
                  진화하기!
                </Button>

                {/* 진화 설명 */}
                <div className="bg-pink-900/30 rounded-lg p-3 border border-pink-600">
                  <div className="text-pink-400 text-xs font-bold mb-1">
                    🦋 진화 효과
                  </div>
                  <div className="text-gray-300 text-xs space-y-1">
                    <div>• 새로운 무기로 변환</div>
                    <div>• 강화 레벨 50% 유지</div>
                    <div>• 원소 속성 변경 가능</div>
                    <div>• 특수 능력 업그레이드</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p className="text-lg font-bold">진화할 무기를 선택하세요</p>
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

export default EvolutionPage;
