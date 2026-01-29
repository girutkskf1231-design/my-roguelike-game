import React, { useState } from 'react';
import { X, Zap, Sparkles } from 'lucide-react';
import type { Weapon, Player } from '../types/game';
import { canFuseWeapons, fuseWeapons, FUSION_RECIPES } from '../data/weaponFusions';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface FusionPageProps {
  player: Player;
  onClose: () => void;
  onFuseWeapons: (weapon1: Weapon, weapon2: Weapon) => void;
  embedded?: boolean;
}

const FusionPage: React.FC<FusionPageProps> = ({
  player,
  onClose,
  onFuseWeapons,
  embedded = false,
}) => {
  const [firstWeapon, setFirstWeapon] = useState<Weapon | null>(null);
  const [secondWeapon, setSecondWeapon] = useState<Weapon | null>(null);
  const [previewWeapon, setPreviewWeapon] = useState<Weapon | null>(null);

  const allWeapons = [player.weapon, ...player.weaponInventory];

  const getWeaponColor = (weapon: Weapon) => {
    if (weapon.isEvolved) return 'border-pink-500 bg-pink-900/20';
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
    // 첫 번째 무기 선택
    if (!firstWeapon) {
      setFirstWeapon(weapon);
      setSecondWeapon(null);
      setPreviewWeapon(null);
      return;
    }

    // 같은 무기 클릭 시 선택 해제
    if (firstWeapon.id === weapon.id && 
        (firstWeapon.upgradeLevel || 0) === (weapon.upgradeLevel || 0)) {
      setFirstWeapon(null);
      setSecondWeapon(null);
      setPreviewWeapon(null);
      return;
    }

    // 두 번째 무기 선택
    const recipe = canFuseWeapons(firstWeapon, weapon);
    // 엑스칼리버는 전사만 합성 가능
    const canMakeForClass =
      recipe && (recipe.resultId !== 'excalibur' || player.class === 'warrior');

    if (canMakeForClass) {
      setSecondWeapon(weapon);
      const fused = fuseWeapons(firstWeapon, weapon);
      setPreviewWeapon(fused || null);
    } else {
      setSecondWeapon(null);
      setPreviewWeapon(null);
    }
  };

  const handleFuse = () => {
    if (firstWeapon && secondWeapon) {
      onFuseWeapons(firstWeapon, secondWeapon);
      setFirstWeapon(null);
      setSecondWeapon(null);
      setPreviewWeapon(null);
    }
  };

  const handleReset = () => {
    setFirstWeapon(null);
    setSecondWeapon(null);
    setPreviewWeapon(null);
  };

  // 선택 가능한 무기 필터링
  const isWeaponSelectable = (weapon: Weapon) => {
    if (!firstWeapon) return true;
    if (
      firstWeapon.id === weapon.id &&
      (firstWeapon.upgradeLevel || 0) === (weapon.upgradeLevel || 0)
    ) {
      return true;
    }

    const recipe = canFuseWeapons(firstWeapon, weapon);
    if (!recipe) return false;

    // 엑스칼리버는 전사만 합성 가능
    if (recipe.resultId === 'excalibur' && player.class !== 'warrior') {
      return false;
    }

    return true;
  };

  // 합성 레시피 찾기
  const findRecipe = () => {
    if (!firstWeapon || !secondWeapon) return null;
    return FUSION_RECIPES.find(recipe => 
      (recipe.weapon1Id === firstWeapon.id && recipe.weapon2Id === secondWeapon.id) ||
      (recipe.weapon1Id === secondWeapon.id && recipe.weapon2Id === firstWeapon.id)
    );
  };

  const currentRecipe = findRecipe();

  return (
    <div className={embedded ? 'h-full w-full flex flex-col overflow-hidden bg-slate-900' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm'}>
      <div className={embedded ? 'flex-1 min-h-0 flex flex-col overflow-hidden p-2' : 'max-w-7xl w-full h-[90vh] p-4 flex flex-col'}>
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 rounded-lg p-4 border-2 border-cyan-600">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
              무기 합성소
            </h1>
            <p className="text-cyan-200 text-sm mt-1">
              ⚗️ 두 개의 무기를 선택하고 합성하세요
            </p>
          </div>
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 h-10 w-10 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 선택 상태 표시 */}
        {firstWeapon && (
          <div className="mb-3 p-3 bg-cyan-900/50 border-2 border-cyan-500 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* 첫 번째 무기 */}
                <div className="flex items-center gap-2">
                  <div className="text-2xl">{firstWeapon.name.split(' ')[0]}</div>
                  <div className="text-cyan-400 font-bold text-sm">
                    {firstWeapon.name.split(' ').slice(1).join(' ')}
                  </div>
                </div>

                {secondWeapon ? (
                  <>
                    <div className="text-3xl text-cyan-400 animate-pulse">+</div>
                    {/* 두 번째 무기 */}
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">{secondWeapon.name.split(' ')[0]}</div>
                      <div className="text-cyan-400 font-bold text-sm">
                        {secondWeapon.name.split(' ').slice(1).join(' ')}
                      </div>
                    </div>
                    <div className="text-3xl text-cyan-400 animate-pulse">=</div>
                    <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" />
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">
                    ← 두 번째 무기를 선택하세요
                  </div>
                )}
              </div>
              <Button
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-700 h-8 text-xs px-3"
              >
                초기화
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* 왼쪽: 무기 목록 */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-sm text-gray-300">
                💡 <span className="font-bold">합성 시스템</span>
                <ul className="mt-2 space-y-1 text-xs text-gray-400 ml-4">
                  <li>• 서로 다른 두 무기를 선택하여 합성</li>
                  <li>• 궁합이 맞는 무기만 합성 가능</li>
                  <li>• 강화 레벨 평균 70% 유지</li>
                  <li>• 새로운 강력한 무기 획득</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {allWeapons.map((weapon, index) => {
                const equipped = isEquipped(weapon);
                const isFirst = firstWeapon?.id === weapon.id && 
                               (firstWeapon?.upgradeLevel || 0) === (weapon.upgradeLevel || 0);
                const isSecond = secondWeapon?.id === weapon.id && 
                                (secondWeapon?.upgradeLevel || 0) === (weapon.upgradeLevel || 0);
                const selectable = isWeaponSelectable(weapon);
                
                return (
                  <Card
                    key={`${weapon.id}-${index}`}
                    className={`p-3 cursor-pointer transition-all ${getWeaponColor(weapon)} ${
                      !selectable ? 'opacity-30 cursor-not-allowed' : ''
                    } ${equipped ? 'ring-2 ring-green-500' : ''} ${
                      isFirst ? 'ring-3 ring-cyan-500 scale-105' : ''
                    } ${isSecond ? 'ring-3 ring-blue-500 scale-105' : ''} 
                    hover:scale-105 hover:shadow-xl border-2`}
                    onClick={() => selectable && handleWeaponClick(weapon)}
                  >
                    <div className="text-center">
                      {equipped && (
                        <div className="mb-1">
                          <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                            ⚔️ 장착
                          </span>
                        </div>
                      )}
                      {isFirst && (
                        <div className="mb-1">
                          <span className="bg-cyan-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                            1️⃣ 선택
                          </span>
                        </div>
                      )}
                      {isSecond && (
                        <div className="mb-1">
                          <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                            2️⃣ 선택
                          </span>
                        </div>
                      )}
                      <div className="text-2xl mb-1">{weapon.name.split(' ')[0]}</div>
                      <div className="text-xs font-bold text-white mb-1 truncate">
                        {weapon.name.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="space-y-0.5 text-[10px]">
                        <div className="text-gray-300 flex justify-center gap-2">
                          <span>💥{weapon.damage}</span>
                          <span>⚡{weapon.attackSpeed}f</span>
                        </div>
                        {weapon.elementalDamage && (
                          <div className="text-purple-400">✨{weapon.elementalDamage}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 오른쪽: 합성 미리보기 */}
          <div className="w-[450px] bg-gradient-to-b from-slate-900/90 to-cyan-900/30 rounded-lg p-6 border-2 border-cyan-600">
            {firstWeapon && secondWeapon && previewWeapon ? (
              <div className="space-y-4">
                <div className="text-center border-b-2 border-cyan-600 pb-4">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-cyan-400 animate-spin" />
                  <h2 className="text-2xl font-bold text-cyan-400 mb-2">
                    합성 미리보기
                  </h2>
                  <p className="text-gray-300 text-sm">두 무기를 합성하시겠습니까?</p>
                </div>

                {/* 합성 레시피 */}
                {currentRecipe && (
                  <div className="bg-cyan-900/50 rounded-lg p-3 border border-cyan-600">
                    <div className="text-cyan-400 font-bold text-sm mb-1">
                      ⚗️ {currentRecipe.description}
                    </div>
                  </div>
                )}

                {/* 재료 무기들 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 rounded-lg p-3 border border-cyan-600">
                    <div className="text-center">
                      <div className="text-cyan-400 text-xs mb-2">재료 1</div>
                      <div className="text-2xl mb-1">{firstWeapon.name.split(' ')[0]}</div>
                      <div className="text-xs font-bold text-white mb-2">
                        {firstWeapon.name.split(' ').slice(1).join(' ')}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-3 border border-blue-600">
                    <div className="text-center">
                      <div className="text-blue-400 text-xs mb-2">재료 2</div>
                      <div className="text-2xl mb-1">{secondWeapon.name.split(' ')[0]}</div>
                      <div className="text-xs font-bold text-white mb-2">
                        {secondWeapon.name.split(' ').slice(1).join(' ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 합성 화살표 */}
                <div className="text-center">
                  <div className="text-5xl animate-bounce">⬇️</div>
                  <div className="text-cyan-400 text-sm font-bold mt-2">합성!</div>
                </div>

                {/* 결과 무기 */}
                <div className="bg-gradient-to-br from-cyan-900 to-purple-900 rounded-lg p-4 border-2 border-cyan-400 animate-pulse">
                  <div className="text-center mb-3">
                    <div className="text-cyan-400 text-sm font-bold mb-2">🎉 합성 결과</div>
                    <div className="text-4xl mb-2">{previewWeapon.name.split(' ')[0]}</div>
                    <div className="text-lg font-bold text-cyan-200 mb-2">
                      {previewWeapon.name.split(' ').slice(1).join(' ')}
                    </div>
                    <div className="bg-yellow-600 text-white text-xs px-2 py-1 rounded inline-block">
                      Lv. +{previewWeapon.upgradeLevel || 0}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between bg-slate-800/50 p-2 rounded">
                      <span className="text-gray-300">데미지</span>
                      <span className="text-red-400 font-bold">{previewWeapon.damage}</span>
                    </div>
                    <div className="flex justify-between bg-slate-800/50 p-2 rounded">
                      <span className="text-gray-300">공격속도</span>
                      <span className="text-blue-400 font-bold">{previewWeapon.attackSpeed}f</span>
                    </div>
                    <div className="flex justify-between bg-slate-800/50 p-2 rounded">
                      <span className="text-gray-300">사거리</span>
                      <span className="text-green-400 font-bold">{previewWeapon.range}</span>
                    </div>
                    {previewWeapon.elementalDamage && (
                      <div className="flex justify-between bg-purple-900/50 p-2 rounded border border-purple-500">
                        <span className="text-purple-300">원소 데미지</span>
                        <span className="text-purple-300 font-bold">{previewWeapon.elementalDamage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 특수 능력 */}
                {previewWeapon.special && (
                  <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-3 border border-yellow-600">
                    <div className="text-yellow-400 font-bold text-sm mb-1">
                      ⭐ 특수 능력
                    </div>
                    <div className="text-yellow-300 text-xs">
                      {previewWeapon.special}
                    </div>
                  </div>
                )}

                {/* 합성 버튼 */}
                <Button
                  onClick={handleFuse}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 h-14 text-lg font-bold border-2 border-cyan-400 shadow-lg"
                >
                  <Zap className="w-6 h-6 mr-2 animate-pulse" />
                  합성하기!
                </Button>

                {/* 합성 경고 */}
                <div className="bg-red-900/30 rounded-lg p-3 border border-red-600">
                  <div className="text-red-400 text-xs font-bold mb-1">
                    ⚠️ 주의
                  </div>
                  <div className="text-gray-300 text-xs">
                    합성 시 재료 무기 2개가 사라지고 새로운 무기 1개를 획득합니다.
                  </div>
                </div>
              </div>
            ) : firstWeapon ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Zap className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p className="text-lg font-bold">두 번째 무기를 선택하세요</p>
                  <p className="text-sm mt-2">궁합이 맞는 무기만 합성 가능합니다</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">합성할 무기를 선택하세요</p>
                  <p className="text-sm mt-2">왼쪽에서 첫 번째 무기를 클릭해주세요</p>
                  
                  {/* 합성 가능한 조합 힌트 */}
                  <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-600 max-h-64 overflow-y-auto">
                    <div className="text-cyan-400 text-sm font-bold mb-3">
                      ⚗️ 합성 가능한 조합 (일부)
                    </div>
                    <div className="space-y-2 text-xs text-left">
                      {FUSION_RECIPES.slice(0, 8).map((recipe, idx) => (
                        <div key={idx} className="text-gray-300 bg-slate-700 p-2 rounded">
                          • {recipe.description}
                        </div>
                      ))}
                      {FUSION_RECIPES.length > 8 && (
                        <div className="text-gray-500 text-center">
                          ... 외 {FUSION_RECIPES.length - 8}개
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FusionPage;
