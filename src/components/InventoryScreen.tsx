import React, { useState } from 'react';
import { X, Package, TrendingUp, Sparkles, Zap, Sword, Target, Wand2, Gem } from 'lucide-react';
import type { Weapon, Player } from '../types/game';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface InventoryScreenProps {
  player: Player;
  onClose: () => void;
  onEquipWeapon: (weapon: Weapon) => void;
  onOpenUpgrade: () => void;
  onOpenEvolution: () => void;
  onOpenFusion: () => void;
  onOpenArtifacts?: () => void;
  /** true면 전체 화면 대신 오른쪽 사이드 패널로 표시 (게임과 함께) */
  embedded?: boolean;
}

type WeaponType = 'all' | 'melee' | 'ranged' | 'magic';

const InventoryScreen: React.FC<InventoryScreenProps> = ({
  player,
  onClose,
  onEquipWeapon,
  onOpenUpgrade,
  onOpenEvolution,
  onOpenFusion,
  onOpenArtifacts,
  embedded = false,
}) => {
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [selectedTab, setSelectedTab] = useState<WeaponType>('all');
  const [expandedWeapons, setExpandedWeapons] = useState<Set<string>>(new Set());

  // 현재 무기 + 인벤토리 무기 = 전체 무기
  const allWeapons = [player.weapon, ...player.weaponInventory];

  // 타입별로 무기 필터링
  const filteredWeapons = selectedTab === 'all' 
    ? allWeapons 
    : allWeapons.filter(w => w.type === selectedTab);

  // 타입별 개수 계산
  const meleeCount = allWeapons.filter(w => w.type === 'melee').length;
  const rangedCount = allWeapons.filter(w => w.type === 'ranged').length;
  const magicCount = allWeapons.filter(w => w.type === 'magic').length;

  const getWeaponColor = (weapon: Weapon) => {
    if (weapon.isEvolved) return 'border-pink-500 bg-pink-900/20';
    const level = weapon.upgradeLevel || 0;
    if (level >= 10) return 'border-purple-500 bg-purple-900/20';
    if (level >= 5) return 'border-yellow-500 bg-yellow-900/20';
    if (level >= 3) return 'border-blue-500 bg-blue-900/20';
    return 'border-gray-500 bg-gray-900/20';
  };

  const getWeaponName = (weapon: Weapon) => {
    const level = weapon.upgradeLevel || 0;
    return level > 0 ? `${weapon.name} +${level}` : weapon.name;
  };

  const isEquipped = (weapon: Weapon) => {
    return weapon.id === player.weapon.id && 
           (weapon.upgradeLevel || 0) === (player.weapon.upgradeLevel || 0);
  };

  const handleWeaponClick = (weapon: Weapon, event: React.MouseEvent) => {
    const weaponKey = `${weapon.id}-${weapon.upgradeLevel || 0}`;
    
    // 더블클릭 시 설명 토글
    if (event.detail === 2) {
      setExpandedWeapons(prev => {
        const newSet = new Set(prev);
        if (newSet.has(weaponKey)) {
          newSet.delete(weaponKey);
        } else {
          newSet.add(weaponKey);
        }
        return newSet;
      });
      return;
    }
    
    // 싱글클릭 시 선택
    if (selectedWeapon?.id === weapon.id && 
        (selectedWeapon?.upgradeLevel || 0) === (weapon.upgradeLevel || 0)) {
      setSelectedWeapon(null);
    } else {
      setSelectedWeapon(weapon);
    }
  };

  const handleEquip = (weapon: Weapon) => {
    if (!isEquipped(weapon)) {
      onEquipWeapon(weapon);
      setSelectedWeapon(null);
    }
  };

  return (
    <div className={embedded ? 'h-full w-full flex flex-col overflow-hidden bg-slate-900' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm'}>
      <div className={embedded ? 'flex-1 min-h-0 flex flex-col overflow-hidden p-2' : 'max-w-7xl w-full h-[90vh] p-4 flex flex-col'}>
        {/* 헤더: 섹션 구분을 위해 하단 여백·구분선 적용 */}
        <div className={`flex justify-between items-center bg-gradient-to-r from-slate-900/80 to-blue-900/80 rounded-lg border-2 border-slate-600 shrink-0 ${
          embedded ? 'p-3 mb-3 border-b-slate-500' : 'p-4 mb-4'
        }`}>
          <div className="min-w-0 flex-1">
            <h1 className={`font-bold text-white flex items-center gap-2 ${embedded ? 'text-xl' : 'text-3xl'}`}>
              <Package className={embedded ? 'w-6 h-6' : 'w-8 h-8'} />
              무기 저장소
            </h1>
            <p className={`text-gray-300 mt-1 ${embedded ? 'text-xs' : 'text-sm'}`}>
              💼 보유 {allWeapons.length}개 · ⚔️ 장착: {player.weapon.name}
              {player.weapon.upgradeLevel ? ` +${player.weapon.upgradeLevel}` : ''}
            </p>
            <p className="text-blue-400 text-xs mt-0.5 flex items-center gap-1">
              <span>♾️</span>
              <span>무제한 저장 가능</span>
            </p>
          </div>
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 h-10 w-10 p-0 shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 작업장 메뉴: embedded에서는 2열로 정리해 가독성 확보 */}
        <div className={embedded ? 'mb-3' : 'mb-4'}>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
            <div className="text-white font-bold text-sm mb-2 flex items-center gap-2">
              🏭 작업장
            </div>
            <div className={`grid gap-2 ${embedded ? 'grid-cols-2' : 'grid-cols-4 gap-3'}`}>
              <Button
                onClick={onOpenUpgrade}
                className={`bg-gradient-to-br from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 flex flex-col items-center justify-center gap-0.5 border-2 border-yellow-400 shadow-lg ${embedded ? 'h-14 py-2' : 'h-20 gap-1'}`}
              >
                <TrendingUp className={embedded ? 'w-5 h-5' : 'w-8 h-8'} />
                <span className={embedded ? 'text-sm font-bold' : 'text-lg font-bold'}>강화소</span>
                {!embedded && <span className="text-xs opacity-80">무기 강화</span>}
              </Button>
              <Button
                onClick={onOpenEvolution}
                className={`bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 flex flex-col items-center justify-center gap-0.5 border-2 border-pink-400 shadow-lg ${embedded ? 'h-14 py-2' : 'h-20 gap-1'}`}
              >
                <Sparkles className={`${embedded ? 'w-5 h-5' : 'w-8 h-8'} animate-pulse`} />
                <span className={embedded ? 'text-sm font-bold' : 'text-lg font-bold'}>진화소</span>
                {!embedded && <span className="text-xs opacity-80">무기 진화</span>}
              </Button>
              <Button
                onClick={onOpenFusion}
                className={`bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 flex flex-col items-center justify-center gap-0.5 border-2 border-cyan-400 shadow-lg ${embedded ? 'h-14 py-2' : 'h-20 gap-1'}`}
              >
                <Zap className={embedded ? 'w-5 h-5' : 'w-8 h-8'} />
                <span className={embedded ? 'text-sm font-bold' : 'text-lg font-bold'}>합성소</span>
                {!embedded && <span className="text-xs opacity-80">무기 합성</span>}
              </Button>
              {onOpenArtifacts && (
                <Button
                  onClick={onOpenArtifacts}
                  className={`bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex flex-col items-center justify-center gap-0.5 border-2 border-purple-400 shadow-lg ${embedded ? 'h-14 py-2' : 'h-20 gap-1'}`}
                >
                  <Gem className={embedded ? 'w-5 h-5' : 'w-8 h-8'} />
                  <span className={embedded ? 'text-sm font-bold' : 'text-lg font-bold'}>아티펙트</span>
                  {!embedded && <span className="text-xs opacity-80">장착 관리</span>}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* embedded: 세로 배치로 380px에서 오버플로우 방지 / 전체 화면: 가로 배치 */}
        <div className={`flex flex-1 min-h-0 overflow-hidden ${embedded ? 'flex-col gap-3' : 'flex-row gap-4'}`}>
          {/* 무기 목록 */}
          <div className={`flex flex-col overflow-hidden ${embedded ? 'flex-1 min-h-0' : 'flex-1'}`}>
            {/* 타입 탭 */}
            <div className="mb-3 flex gap-2">
              <Button
                onClick={() => setSelectedTab('all')}
                className={`flex-1 h-12 flex flex-col items-center justify-center gap-1 ${
                  selectedTab === 'all'
                    ? 'bg-slate-600 border-2 border-slate-400'
                    : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Package className="w-4 h-4" />
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">전체</span>
                  <span className="text-[10px] text-gray-400">({allWeapons.length})</span>
                </div>
              </Button>
              
              <Button
                onClick={() => setSelectedTab('melee')}
                className={`flex-1 h-12 flex flex-col items-center justify-center gap-1 ${
                  selectedTab === 'melee'
                    ? 'bg-red-600 border-2 border-red-400'
                    : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Sword className="w-4 h-4" />
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">근접</span>
                  <span className="text-[10px] text-gray-400">({meleeCount})</span>
                </div>
              </Button>
              
              <Button
                onClick={() => setSelectedTab('ranged')}
                className={`flex-1 h-12 flex flex-col items-center justify-center gap-1 ${
                  selectedTab === 'ranged'
                    ? 'bg-green-600 border-2 border-green-400'
                    : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Target className="w-4 h-4" />
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">원거리</span>
                  <span className="text-[10px] text-gray-400">({rangedCount})</span>
                </div>
              </Button>
              
              <Button
                onClick={() => setSelectedTab('magic')}
                className={`flex-1 h-12 flex flex-col items-center justify-center gap-1 ${
                  selectedTab === 'magic'
                    ? 'bg-purple-600 border-2 border-purple-400'
                    : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">마법</span>
                  <span className="text-[10px] text-gray-400">({magicCount})</span>
                </div>
              </Button>
            </div>

            {/* 안내 배너 */}
            <div className="mb-3 p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border-2 border-blue-600">
              <div className="flex items-center gap-2">
                <div className="text-2xl">♾️</div>
                <div className="flex-1">
                  <div className="text-blue-400 font-bold text-sm flex items-center justify-between">
                    <span>
                      {selectedTab === 'all' ? '전체 무기' : 
                        selectedTab === 'melee' ? '⚔️ 근접 무기' :
                        selectedTab === 'ranged' ? '🏹 원거리 무기' : '🪄 마법 무기'}
                    </span>
                    <span className="text-green-400 text-xs">
                      {filteredWeapons.length}개 보유
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mt-0.5">
                    💡 무기를 선택하여 장착하거나 작업장에서 관리하세요
                  </div>
                </div>
              </div>
            </div>

            {/* 무기 목록 */}
            <div className="flex-1 overflow-y-auto pr-2">
              {filteredWeapons.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    {selectedTab === 'melee' && <Sword className="w-16 h-16 mx-auto mb-3 opacity-30" />}
                    {selectedTab === 'ranged' && <Target className="w-16 h-16 mx-auto mb-3 opacity-30" />}
                    {selectedTab === 'magic' && <Wand2 className="w-16 h-16 mx-auto mb-3 opacity-30" />}
                    <p className="text-lg font-bold">
                      {selectedTab === 'melee' && '근접 무기가 없습니다'}
                      {selectedTab === 'ranged' && '원거리 무기가 없습니다'}
                      {selectedTab === 'magic' && '마법 무기가 없습니다'}
                    </p>
                    <p className="text-sm mt-2">다른 타입의 무기를 확인해보세요</p>
                  </div>
                </div>
              ) : (
                <div className={`grid gap-2 ${embedded ? 'grid-cols-2' : 'grid-cols-5 gap-3'}`}>
              {filteredWeapons.map((weapon, index) => {
                const equipped = isEquipped(weapon);
                const selected = selectedWeapon?.id === weapon.id && 
                               (selectedWeapon?.upgradeLevel || 0) === (weapon.upgradeLevel || 0);
                const weaponKey = `${weapon.id}-${weapon.upgradeLevel || 0}`;
                const isExpanded = expandedWeapons.has(weaponKey);
                
                return (
                  <Card
                    key={`${weapon.id}-${weapon.upgradeLevel || 0}-${index}`}
                    className={`p-3 cursor-pointer transition-all ${getWeaponColor(weapon)} ${
                      equipped ? 'ring-2 ring-green-500' : ''
                    } ${selected ? 'ring-3 ring-blue-500 scale-105' : ''} 
                    hover:scale-105 hover:shadow-xl border-2`}
                    onClick={(e) => handleWeaponClick(weapon, e)}
                  >
                    <div className="text-center">
                      {equipped && (
                        <div className="mb-1">
                          <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                            ⚔️ 장착
                          </span>
                        </div>
                      )}
                      {/* 무기 아이콘 (이모지) */}
                      <div className="text-3xl mb-2">{weapon.name.split(' ')[0]}</div>
                      {/* 무기 이름 */}
                      <div className="text-xs font-bold text-white mb-1 truncate">
                        {weapon.name.split(' ').slice(1).join(' ')}
                        {weapon.upgradeLevel ? ` +${weapon.upgradeLevel}` : ''}
                      </div>
                      
                      {/* 설명 (더블클릭 시에만 표시) */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <p className="text-[9px] text-gray-400 leading-tight mb-2">
                            {weapon.description}
                          </p>
                          <div className="space-y-0.5 text-[9px]">
                            <div className="text-gray-300 flex justify-center gap-2">
                              <span>💥{weapon.damage}</span>
                              <span>⚡{weapon.attackSpeed}f</span>
                            </div>
                            {weapon.elementalDamage && (
                              <div className="text-purple-400">✨{weapon.elementalDamage}</div>
                            )}
                            {weapon.special && (
                              <div className="text-yellow-400 text-[8px] mt-1">
                                ⭐ {weapon.special}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 더블클릭 안내 (축소 상태일 때만) */}
                      {!isExpanded && (
                        <div className="text-[8px] text-gray-500 mt-1">
                          더블클릭: 설명
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽(또는 아래): 선택된 무기 상세 정보 — embedded에서는 전체 너비 */}
          <div className={`bg-gradient-to-b from-slate-900/90 to-blue-900/30 rounded-lg border-2 border-blue-600 shrink-0 overflow-y-auto ${
            embedded ? 'w-full p-4 max-h-[45%]' : 'w-96 p-6'
          }`}>
            {selectedWeapon ? (
              <div className="space-y-4">
                <div className="text-center border-b-2 border-blue-600 pb-4">
                  <div className="text-5xl mb-3">{selectedWeapon.name.split(' ')[0]}</div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {getWeaponName(selectedWeapon)}
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed">{selectedWeapon.description}</p>
                </div>

                {/* 스탯 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                      <div className="text-gray-400 text-xs mb-1">타입</div>
                      <div className="text-white font-bold text-lg">
                        {selectedWeapon.type === 'melee' ? '⚔️ 근접' : 
                         selectedWeapon.type === 'ranged' ? '🏹 원거리' : '🪄 마법'}
                      </div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                      <div className="text-gray-400 text-xs mb-1">강화 레벨</div>
                      <div className="text-yellow-400 font-bold text-xl">
                        +{selectedWeapon.upgradeLevel || 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-800 p-3 rounded-lg border border-red-600">
                      <div className="text-gray-400 text-[10px] mb-1">데미지</div>
                      <div className="text-red-400 font-bold text-xl">{selectedWeapon.damage}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-blue-600">
                      <div className="text-gray-400 text-[10px] mb-1">속도</div>
                      <div className="text-blue-400 font-bold text-lg">{selectedWeapon.attackSpeed}f</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-green-600">
                      <div className="text-gray-400 text-[10px] mb-1">사거리</div>
                      <div className="text-green-400 font-bold text-lg">{selectedWeapon.range}</div>
                    </div>
                  </div>

                  {selectedWeapon.elementalDamage && (
                    <div className="bg-purple-900/50 p-3 rounded-lg border-2 border-purple-500">
                      <div className="text-purple-400 font-bold text-sm mb-1">
                        ✨ 원소 피해: {selectedWeapon.elementalDamage}
                      </div>
                      <div className="text-xs text-purple-300">
                        {selectedWeapon.element === 'fire' ? '🔥 화염' :
                         selectedWeapon.element === 'ice' ? '❄️ 얼음' :
                         selectedWeapon.element === 'lightning' ? '⚡ 번개' :
                         selectedWeapon.element === 'poison' ? '☠️ 독' :
                         selectedWeapon.element === 'holy' ? '✨ 신성' :
                         selectedWeapon.element === 'dark' ? '🌑 암흑' : ''}
                      </div>
                    </div>
                  )}

                  {selectedWeapon.special && (
                    <div className="bg-yellow-900/50 p-3 rounded-lg border-2 border-yellow-500">
                      <div className="text-yellow-400 font-bold text-sm">
                        ⭐ 특수 능력
                      </div>
                      <div className="text-yellow-300 text-xs mt-1">
                        {selectedWeapon.special}
                      </div>
                    </div>
                  )}
                </div>

                {/* 장착 버튼 */}
                <div className="border-t-2 border-blue-600 pt-4">
                  {!isEquipped(selectedWeapon) ? (
                    <Button
                      onClick={() => handleEquip(selectedWeapon)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-lg font-bold border-2 border-green-400"
                    >
                      <Package className="w-5 h-5 mr-2" />
                      무기 장착
                    </Button>
                  ) : (
                    <div className="bg-green-900/50 rounded-lg p-4 border-2 border-green-600 text-center">
                      <div className="text-green-400 font-bold text-lg">
                        ✅ 현재 장착 중
                      </div>
                    </div>
                  )}
                </div>

                {/* 작업장 안내 */}
                <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-600">
                  <div className="text-blue-400 text-xs font-bold mb-2">
                    🏭 무기 작업
                  </div>
                  <div className="text-gray-300 text-xs space-y-1">
                    <div>• <span className="text-yellow-400">강화소</span>: 무기 스탯 증가</div>
                    <div>• <span className="text-pink-400">진화소</span>: 새로운 무기로 변환</div>
                    <div>• <span className="text-cyan-400">합성소</span>: 두 무기 융합</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Package className="w-20 h-20 mx-auto mb-4 opacity-30" />
                  <p className="text-xl font-bold">무기를 선택하세요</p>
                  <p className="text-sm mt-2">왼쪽 목록에서 무기를 클릭</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryScreen;
