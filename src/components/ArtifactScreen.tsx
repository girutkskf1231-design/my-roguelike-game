import { useState } from 'react';
import type { Player, Artifact } from '../types/game';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { X, Gem, ArrowLeft } from 'lucide-react';

interface ArtifactScreenProps {
  player: Player;
  onClose: () => void;
  onEquipArtifact: (artifact: Artifact, slotIndex: number) => void;
  onUnequipArtifact: (slotIndex: number) => void;
  onBackToInventory?: () => void;
  embedded?: boolean;
}

const ArtifactScreen = ({ player, onClose, onEquipArtifact, onUnequipArtifact, onBackToInventory, embedded = false }: ArtifactScreenProps) => {
  const [expandedArtifacts, setExpandedArtifacts] = useState<Set<string>>(new Set());
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const handleArtifactClick = (artifact: Artifact) => {
    const key = artifact.id;
    if (expandedArtifacts.has(key)) {
      setExpandedArtifacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    } else {
      setExpandedArtifacts(prev => new Set(prev).add(key));
    }
    setSelectedArtifact(artifact);
  };

  const handleSlotClick = (slotIndex: number) => {
    if (selectedArtifact) {
      onEquipArtifact(selectedArtifact, slotIndex);
      setSelectedArtifact(null);
    }
  };

  const getRarityColor = (rarity: Artifact['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-500';
      case 'rare': return 'text-blue-400 border-blue-500';
      case 'epic': return 'text-purple-400 border-purple-500';
      case 'legendary': return 'text-yellow-400 border-yellow-500';
    }
  };

  const getRarityLabel = (rarity: Artifact['rarity']) => {
    switch (rarity) {
      case 'common': return '일반';
      case 'rare': return '희귀';
      case 'epic': return '영웅';
      case 'legendary': return '전설';
    }
  };

  return (
    <div className={embedded ? 'h-full w-full flex flex-col overflow-hidden bg-slate-900' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm'}>
      <div className={embedded ? 'flex-1 min-h-0 flex flex-col overflow-y-auto p-2' : 'max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto'}>
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-purple-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-3xl text-white flex items-center gap-2">
                <Gem className="w-8 h-8 text-purple-400" />
                아티펙트 장착
              </CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                아티펙트를 클릭하면 설명이 나타납니다. 설명을 본 후 슬롯을 클릭하여 장착하세요.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onBackToInventory && (
                <Button
                  onClick={onBackToInventory}
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 border-slate-500 h-10 px-3"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  뒤로가기
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-600 h-10 w-10"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 장착 슬롯 */}
            <div>
              <h3 className="text-xl font-bold text-white mb-3">장착 슬롯 (최대 3개)</h3>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((slotIndex) => {
                  const equipped = player.equippedArtifacts[slotIndex];
                  return (
                    <Card
                      key={slotIndex}
                      className={`bg-slate-800 border-2 ${
                        selectedArtifact ? 'border-green-500 cursor-pointer hover:bg-slate-700' : 'border-gray-600'
                      }`}
                      onClick={() => selectedArtifact && handleSlotClick(slotIndex)}
                    >
                      <CardContent className="p-4 text-center min-h-[120px] flex flex-col items-center justify-center">
                        {equipped ? (
                          <>
                            <div className="text-4xl mb-2">{equipped.icon}</div>
                            <div className="text-white font-bold text-sm">{equipped.name}</div>
                            <Badge className={`mt-2 ${getRarityColor(equipped.rarity)}`}>
                              {getRarityLabel(equipped.rarity)}
                            </Badge>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUnequipArtifact(slotIndex);
                              }}
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-red-400 hover:text-red-300"
                            >
                              해제
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-500 text-4xl mb-2">⚪</div>
                            <div className="text-gray-500 text-sm">
                              {selectedArtifact ? '클릭하여 장착' : '빈 슬롯'}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 보유 아티펙트 목록 */}
            <div>
              <h3 className="text-xl font-bold text-white mb-3">
                보유 아티펙트 ({player.artifacts.length}개)
              </h3>
              {player.artifacts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  보유한 아티펙트가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {player.artifacts.map((artifact, index) => {
                    const isEquipped = player.equippedArtifacts.some(
                      eq => eq && eq.id === artifact.id
                    );
                    const isExpanded = expandedArtifacts.has(artifact.id);
                    const isSelected = selectedArtifact?.id === artifact.id;

                    return (
                      <Card
                        key={`${artifact.id}-${index}`}
                        className={`bg-slate-800 border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 ring-2 ring-green-500'
                            : isEquipped
                            ? 'border-blue-500'
                            : getRarityColor(artifact.rarity)
                        } hover:scale-105`}
                        onClick={() => handleArtifactClick(artifact)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-3xl">{artifact.icon}</div>
                            <div className="flex-1">
                              <div className="text-white font-bold text-sm">{artifact.name}</div>
                              <Badge className={`text-xs ${getRarityColor(artifact.rarity)}`}>
                                {getRarityLabel(artifact.rarity)}
                              </Badge>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className="space-y-1 text-xs text-gray-300 mt-2">
                              <div className="text-gray-400 mb-2">{artifact.description}</div>
                              <div className="space-y-1">
                                {artifact.effects.expMultiplier && (
                                  <div className="text-green-400">
                                    💎 경험치: +{Math.round((artifact.effects.expMultiplier - 1) * 100)}%
                                  </div>
                                )}
                                {artifact.effects.damageBonus && (
                                  <div className="text-red-400">⚔️ 공격력: +{artifact.effects.damageBonus}%</div>
                                )}
                                {artifact.effects.attackSpeedBonus && (
                                  <div className="text-orange-400">⚡ 공속: +{artifact.effects.attackSpeedBonus}%</div>
                                )}
                                {artifact.effects.healthBonus && (
                                  <div className={artifact.effects.healthBonus > 0 ? 'text-green-400' : 'text-red-400'}>
                                    ❤️ 체력: {artifact.effects.healthBonus > 0 ? '+' : ''}{artifact.effects.healthBonus}%
                                  </div>
                                )}
                                {artifact.effects.critChanceBonus && (
                                  <div className="text-yellow-400">🎯 치명타: +{artifact.effects.critChanceBonus}%</div>
                                )}
                                {artifact.effects.defenseBonus && (
                                  <div className="text-blue-400">🛡️ 방어력: +{artifact.effects.defenseBonus}%</div>
                                )}
                                {artifact.effects.speedBonus && (
                                  <div className="text-cyan-400">💨 이동속도: +{artifact.effects.speedBonus}%</div>
                                )}
                              </div>
                              {isEquipped && (
                                <div className="text-blue-400 text-xs mt-2">✓ 장착 중</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs mt-2">더블클릭: 설명 보기</div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 선택된 아티펙트 정보 */}
            {selectedArtifact && (
              <div className="mt-4 p-4 bg-slate-800 rounded-lg border-2 border-green-500">
                <div className="text-white font-bold text-lg mb-2">
                  선택됨: {selectedArtifact.name}
                </div>
                <div className="text-gray-300 text-sm">
                  위의 슬롯을 클릭하여 장착하세요
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArtifactScreen;
