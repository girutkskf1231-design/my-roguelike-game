import { memo } from 'react';
import type { Weapon } from '../types/game';
import { Sword, Crosshair, Wand } from 'lucide-react';

interface WeaponInfoProps {
  weapon: Weapon;
}

const WeaponInfoComponent = ({ weapon }: WeaponInfoProps) => {
  const getWeaponIcon = () => {
    switch (weapon.type) {
      case 'melee':
        return <Sword className="w-5 h-5" />;
      case 'ranged':
        return <Crosshair className="w-5 h-5" />;
      case 'magic':
        return <Wand className="w-5 h-5" />;
    }
  };

  const getTypeColor = () => {
    switch (weapon.type) {
      case 'melee':
        return 'bg-red-600/80';
      case 'ranged':
        return 'bg-green-600/80';
      case 'magic':
        return 'bg-purple-600/80';
    }
  };

  const getTypeName = () => {
    switch (weapon.type) {
      case 'melee':
        return '근접';
      case 'ranged':
        return '원거리';
      case 'magic':
        return '마법';
    }
  };

  return (
    <div className="bg-slate-900/95 rounded-lg p-3 border-2 border-slate-700 shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-600">
        <div className={`${getTypeColor()} rounded p-1.5`}>
          {getWeaponIcon()}
        </div>
        <div className="flex-1">
          <div className="text-white font-bold text-sm">{weapon.name}</div>
          <div className="text-xs text-gray-400">{getTypeName()}</div>
        </div>
      </div>

      {/* 설명 */}
      <div className="text-xs text-gray-300 mb-3">{weapon.description}</div>

      {/* 스탯 */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">⚔️ 데미지</span>
          <span className="text-sm font-bold text-red-400">{weapon.damage}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">⚡ 공격 속도</span>
          <span className="text-sm font-bold text-yellow-400">
            {(60 / weapon.attackSpeed).toFixed(1)}/초
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">📏 사거리</span>
          <span className="text-sm font-bold text-blue-400">{weapon.range}</span>
        </div>
        {weapon.projectileCount && weapon.projectileCount > 1 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">🎯 투사체 수</span>
            <span className="text-sm font-bold text-purple-400">{weapon.projectileCount}</span>
          </div>
        )}
      </div>

      {/* 속성 피해 */}
      {weapon.element && weapon.elementalDamage && (
        <div className="mt-2">
          <div className="text-xs text-gray-400 mb-1">🔮 속성 피해</div>
          <div className="flex justify-between items-center">
            <span className="text-xs">
              {weapon.element === 'fire' && '🔥 화염'}
              {weapon.element === 'ice' && '❄️ 빙결'}
              {weapon.element === 'lightning' && '⚡ 번개'}
              {weapon.element === 'poison' && '☠️ 독'}
              {weapon.element === 'dark' && '🌑 암흑'}
            </span>
            <span className="text-sm font-bold text-purple-400">+{weapon.elementalDamage}</span>
          </div>
        </div>
      )}

      {/* 특수 효과 */}
      {(weapon.special || weapon.piercing) && (
        <div className="mt-3 pt-2 border-t border-slate-600">
          <div className="text-xs text-gray-400 mb-1">✨ 특수 효과</div>
          {weapon.special && (
            <div className="text-xs text-amber-300 bg-amber-950/30 rounded px-2 py-1 border border-amber-800/50 mb-1">
              {weapon.special}
            </div>
          )}
          {weapon.piercing && (
            <div className="text-xs text-cyan-300 bg-cyan-950/30 rounded px-2 py-1 border border-cyan-800/50">
              🧱 벽 관통 (벽을 뚫고 지나갑니다)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 메모이제이션으로 불필요한 리렌더링 방지
export const WeaponInfo = memo(WeaponInfoComponent);
