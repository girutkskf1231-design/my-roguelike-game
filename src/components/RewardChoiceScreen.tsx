import { memo } from 'react';
import type { RewardOption } from '../types/game';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Sparkles, Sword, TrendingUp, Gem } from 'lucide-react';

interface RewardChoiceScreenProps {
  wave: number;
  options: RewardOption[];
  onSelect: (option: RewardOption) => void;
  pendingLevelUps?: number;
  pendingBonusRewards?: number;
}

const RewardChoiceScreenComponent = ({ wave, options, onSelect, pendingLevelUps = 0, pendingBonusRewards = 0 }: RewardChoiceScreenProps) => {
  if (options.length === 0) return null;

  const getOptionIcon = (option: RewardOption) => {
    if (option.type === 'skill') return <Sparkles className="w-12 h-12 text-purple-400" />;
    if (option.type === 'weapon' || option.type === 'upgrade' || option.type === 'evolution' || option.type === 'fusion') return <Sword className="w-12 h-12 text-orange-400" />;
    if (option.type === 'artifact') return <Gem className="w-12 h-12 text-blue-400" />;
    return <TrendingUp className="w-12 h-12 text-green-400" />;
  };

  const getOptionColor = (option: RewardOption) => {
    if (option.type === 'skill') return 'border-purple-500';
    if (option.type === 'weapon') return 'border-orange-500';
    if (option.type === 'upgrade') return 'border-yellow-500';
    if (option.type === 'evolution') return 'border-pink-500 shadow-lg shadow-pink-500/50';
    if (option.type === 'fusion') return 'border-cyan-500 shadow-lg shadow-cyan-500/50';
    if (option.type === 'artifact') {
      const rarity = option.artifact.rarity;
      if (rarity === 'legendary') return 'border-yellow-500 shadow-lg shadow-yellow-500/50';
      if (rarity === 'epic') return 'border-purple-500 shadow-lg shadow-purple-500/50';
      if (rarity === 'rare') return 'border-blue-500';
      return 'border-gray-500';
    }
    return 'border-green-500';
  };

  const getOptionTitle = (option: RewardOption) => {
    if (option.type === 'skill') return option.skill.name;
    if (option.type === 'weapon') return option.weapon.name;
    if (option.type === 'upgrade') {
      const level = option.weapon.upgradeLevel || 0;
      return `${option.weapon.name} +${level}`;
    }
    if (option.type === 'evolution') {
      return `${option.weapon.name}`;
    }
    if (option.type === 'fusion') {
      return `${option.weapon.name}`;
    }
    if (option.type === 'artifact') {
      return option.artifact.name;
    }
    return `${option.statName === 'strength' ? '⚔️ 공격력' : 
             option.statName === 'vitality' ? '💚 체력' :
             option.statName === 'agility' ? '⚡ 민첩' : '🛡️ 방어력'} +${option.amount}`;
  };

  const getOptionDescription = (option: RewardOption) => {
    if (option.type === 'skill') return option.skill.description;
    if (option.type === 'weapon') return option.weapon.description;
    if (option.type === 'upgrade') return '⬆️ 무기를 강화합니다! (데미지/공속/사거리 증가)';
    if (option.type === 'evolution') {
      const baseWeapon = option.baseWeapon;
      const baseLevel = baseWeapon.upgradeLevel || 0;
      return `🦋 [${baseWeapon.name} +${baseLevel}]에서 진화! 완전히 새로운 힘을 얻습니다!`;
    }
    if (option.type === 'fusion') {
      const w1Name = option.weapon1.name;
      const w2Name = option.weapon2.name;
      const w1Level = option.weapon1.upgradeLevel || 0;
      const w2Level = option.weapon2.upgradeLevel || 0;
      return `⚗️ [${w1Name} +${w1Level}] + [${w2Name} +${w2Level}] 시너지 합성!`;
    }
    if (option.type === 'artifact') return option.artifact.description;
    return `${option.statName} 스텟을 ${option.amount} 증가시킵니다`;
  };

  const getOptionDetails = (option: RewardOption) => {
    if (option.type === 'skill') {
      return (
        <div className="space-y-1 text-xs text-gray-400">
          <div>타입: {option.skill.type === 'attack' ? '🔥 공격' : option.skill.type === 'defense' ? '🛡️ 방어' : '✨ 특수'}</div>
          <div>쿨다운: {Math.ceil(option.skill.cooldown / 60)}초</div>
          {option.skill.damage && <div>데미지: {option.skill.damage}</div>}
          {option.skill.duration && <div>지속시간: {Math.ceil(option.skill.duration / 60)}초</div>}
        </div>
      );
    }
    if (option.type === 'weapon') {
      return (
        <div className="space-y-1 text-xs text-gray-400">
          <div>타입: {option.weapon.type === 'melee' ? '⚔️ 근접' : option.weapon.type === 'ranged' ? '🏹 원거리' : '🪄 마법'}</div>
          <div>데미지: {option.weapon.damage}</div>
          <div>공격속도: {option.weapon.attackSpeed}f</div>
          <div>사거리: {option.weapon.range}</div>
          {option.weapon.special && <div className="text-yellow-400">특수: {option.weapon.special}</div>}
        </div>
      );
    }
    if (option.type === 'upgrade') {
      const level = option.weapon.upgradeLevel || 0;
      return (
        <div className="space-y-1 text-xs text-gray-400">
          <div className="text-yellow-400 font-bold">⬆️ 강화 +{level}</div>
          <div>타입: {option.weapon.type === 'melee' ? '⚔️ 근접' : option.weapon.type === 'ranged' ? '🏹 원거리' : '🪄 마법'}</div>
          <div className="text-green-400">데미지: {option.weapon.damage} ↑</div>
          <div className="text-green-400">공격속도: {option.weapon.attackSpeed}f ↑</div>
          <div className="text-green-400">사거리: {option.weapon.range} ↑</div>
          {option.weapon.elementalDamage && <div className="text-purple-400">원소 피해: {option.weapon.elementalDamage} ↑</div>}
          {option.weapon.special && <div className="text-yellow-400">특수: {option.weapon.special}</div>}
        </div>
      );
    }
    if (option.type === 'evolution') {
      const weapon = option.weapon;
      const baseLevel = option.baseWeapon.upgradeLevel || 0;
      const transferredLevel = weapon.upgradeLevel || 0;
      return (
        <div className="space-y-1 text-xs text-gray-400">
          <div className="text-pink-400 font-bold animate-pulse">🦋 진화! (강화 +{baseLevel} → +{transferredLevel})</div>
          <div>타입: {weapon.type === 'melee' ? '⚔️ 근접' : weapon.type === 'ranged' ? '🏹 원거리' : '🪄 마법'}</div>
          <div className="text-pink-400">데미지: {weapon.damage} ★</div>
          <div className="text-pink-400">공격속도: {weapon.attackSpeed}f ★</div>
          <div className="text-pink-400">사거리: {weapon.range} ★</div>
          {weapon.elementalDamage && <div className="text-purple-400">원소 피해: {weapon.elementalDamage} ★</div>}
          {weapon.piercing && <div className="text-cyan-400">🎯 관통 공격</div>}
          {weapon.special && <div className="text-yellow-400 font-bold">✨ {weapon.special}</div>}
        </div>
      );
    }
    if (option.type === 'fusion') {
      const weapon = option.weapon;
      const w1Level = option.weapon1.upgradeLevel || 0;
      const w2Level = option.weapon2.upgradeLevel || 0;
      const avgLevel = Math.floor((w1Level + w2Level) / 2);
      const transferredLevel = weapon.upgradeLevel || 0;
      return (
        <div className="space-y-1 text-xs text-gray-400">
          <div className="text-cyan-400 font-bold animate-pulse">⚗️ 합성! (평균 +{avgLevel} → +{transferredLevel})</div>
          <div>타입: {weapon.type === 'melee' ? '⚔️ 근접' : weapon.type === 'ranged' ? '🏹 원거리' : '🪄 마법'}</div>
          <div className="text-cyan-400">데미지: {weapon.damage} ⚗️</div>
          <div className="text-cyan-400">공격속도: {weapon.attackSpeed}f ⚗️</div>
          <div className="text-cyan-400">사거리: {weapon.range} ⚗️</div>
          {weapon.elementalDamage && <div className="text-purple-400">원소 피해: {weapon.elementalDamage} ⚗️</div>}
          {weapon.piercing && <div className="text-cyan-400">🎯 관통 공격</div>}
          {weapon.projectileCount && weapon.projectileCount > 1 && <div className="text-blue-400">🔢 {weapon.projectileCount}발</div>}
          {weapon.special && <div className="text-yellow-400 font-bold">✨ {weapon.special}</div>}
        </div>
      );
    }
    if (option.type === 'artifact') {
      const artifact = option.artifact;
      const effects = artifact.effects;
      const rarityColors = {
        common: 'text-gray-400',
        rare: 'text-blue-400',
        epic: 'text-purple-400',
        legendary: 'text-yellow-400',
      };
      const rarityLabels = {
        common: '일반',
        rare: '희귀',
        epic: '영웅',
        legendary: '전설',
      };
      return (
        <div className="space-y-1 text-xs text-gray-400">
          <div className={`${rarityColors[artifact.rarity]} font-bold`}>
            {rarityLabels[artifact.rarity]} 등급
          </div>
          {effects.expMultiplier && (
            <div className="text-green-400">
              💎 경험치 획득량: +{Math.round((effects.expMultiplier - 1) * 100)}%
            </div>
          )}
          {effects.damageBonus && (
            <div className="text-red-400">
              ⚔️ 공격력: +{effects.damageBonus}%
            </div>
          )}
          {effects.attackSpeedBonus && (
            <div className="text-orange-400">
              ⚡ 공격속도: +{effects.attackSpeedBonus}%
            </div>
          )}
          {effects.healthBonus && (
            <div className={`${effects.healthBonus > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ❤️ 체력: {effects.healthBonus > 0 ? '+' : ''}{effects.healthBonus}%
            </div>
          )}
          {effects.critChanceBonus && (
            <div className="text-yellow-400">
              🎯 치명타 확률: +{effects.critChanceBonus}%
            </div>
          )}
          {effects.defenseBonus && (
            <div className="text-blue-400">
              🛡️ 방어력: +{effects.defenseBonus}%
            </div>
          )}
          {effects.speedBonus && (
            <div className="text-cyan-400">
              💨 이동속도: +{effects.speedBonus}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="max-w-5xl w-full p-6">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
          </div>
          <h1 className="text-5xl text-yellow-400 font-bold mb-2">
            {pendingBonusRewards > 0 || (pendingLevelUps === 0 && wave % 10 === 0) 
              ? '🎉 웨이브 보너스! 🎉' 
              : '⭐ 레벨 업! ⭐'}
          </h1>
          <p className="text-2xl text-gray-300">
            보상을 선택하세요
          </p>
          {(pendingLevelUps > 0 || pendingBonusRewards > 0) && (
            <div className="mt-4 space-y-2">
              {pendingLevelUps > 0 && (
                <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse">
                  ⭐ 남은 레벨업 보상: {pendingLevelUps}개
                </Badge>
              )}
              {pendingBonusRewards > 0 && (
                <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
                  🎁 남은 웨이브 보너스: {pendingBonusRewards}개
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* 선택지 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((option, index) => {
            const optionKey =
              option.type === 'skill' ? `skill-${option.skill.id}` :
              option.type === 'stat' ? `stat-${option.statName}-${index}` :
              option.type === 'artifact' ? `artifact-${option.artifact.id}` :
              `${option.type}-${option.weapon.id}-${index}`;
            return (
            <Card
              key={optionKey}
              className={`bg-gradient-to-br from-slate-900 to-slate-800 border-4 ${getOptionColor(option)} 
                         hover:scale-105 transition-transform cursor-pointer shadow-2xl`}
              onClick={() => onSelect(option)}
            >
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-4">
                  {getOptionIcon(option)}
                </div>
                <CardTitle className="text-2xl text-white">
                  {getOptionTitle(option)}
                </CardTitle>
                <CardDescription className="text-lg text-gray-300">
                  {getOptionDescription(option)}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {getOptionDetails(option)}
                
                <Button 
                  className={`w-full mt-4 ${
                    option.type === 'skill' ? 'bg-purple-600 hover:bg-purple-700' :
                    option.type === 'weapon' ? 'bg-orange-600 hover:bg-orange-700' :
                    option.type === 'artifact' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-green-600 hover:bg-green-700'
                  }`}
                  size="lg"
                >
                  선택하기
                </Button>
              </CardContent>
            </Card>
            );
          })}
        </div>

        <div className="text-center mt-6 text-gray-400 text-sm">
          선택한 보상은 즉시 적용되며, 다음 웨이브로 진행됩니다
        </div>
      </div>
    </div>
  );
};

// 메모이제이션으로 불필요한 리렌더링 방지
export const RewardChoiceScreen = memo(RewardChoiceScreenComponent);
