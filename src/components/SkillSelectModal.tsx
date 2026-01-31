import React from 'react';
import type { Player, Skill } from '../types/game';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sparkles, Zap } from 'lucide-react';

interface SkillSelectModalProps {
  open: boolean;
  onClose: () => void;
  player: Player;
  onEquipSkill: (skill: Skill, slotIndex: number) => void;
}

export const SkillSelectModal: React.FC<SkillSelectModalProps> = ({
  open,
  onClose,
  player,
  onEquipSkill,
}) => {
  if (!open) return null;

  const { availableSkills, equippedSkills } = player;

  const handleEquip = (skill: Skill, slotIndex: number) => {
    onEquipSkill(skill, slotIndex);
  };

  const getSlotLabel = (index: number) => `${index + 1}번 슬롯`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-4xl w-full mx-4 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-purple-900/80 via-slate-900 to-blue-900/80">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Sparkles className="w-7 h-7 text-purple-300 animate-pulse shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-bold text-white truncate">
                스킬 선택
              </div>
              <div className="text-xs text-gray-300 break-words">
                보유 중인 스킬을 슬롯에 장착합니다 (최대 3개)
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-slate-800/80"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>

        {/* 내용 */}
        <div className="p-4 space-y-4">
          {/* 현재 장착 스킬 요약 */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap className="w-4 h-4 text-yellow-400" />
                현재 장착 스킬
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((slotIndex) => {
                const skill = equippedSkills[slotIndex];
                return (
                  <div
                    key={slotIndex}
                    className="flex flex-col justify-between rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs min-h-[52px]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-400">
                        {getSlotLabel(slotIndex)}
                      </span>
                      {skill && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-700/60 text-purple-100">
                          {skill.type === 'attack'
                            ? '공격'
                            : skill.type === 'defense'
                            ? '방어'
                            : '특수'}
                        </span>
                      )}
                    </div>
                    {skill ? (
                      <div className="text-white font-semibold truncate">
                        {skill.name}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">비어 있음</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 패시브 스킬 (보유 시 항상 적용) */}
          {(() => {
            const passiveSkills = availableSkills.filter((s) => s.isPassive);
            if (passiveSkills.length === 0) return null;
            return (
              <div className="bg-slate-900/80 rounded-xl border border-amber-700/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-400 text-sm">✨</span>
                  <div className="text-sm font-bold text-white">
                    패시브 스킬 ({passiveSkills.length}개)
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 mb-2">
                  보유만 해도 항상 적용됩니다. 슬롯 장착 불필요.
                </div>
                <div className="flex flex-wrap gap-2">
                  {passiveSkills.map((skill, idx) => (
                    <div
                      key={`${skill.id}-${idx}`}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-900/30 border border-amber-600/40 text-xs text-amber-100"
                      title={skill.description}
                    >
                      {skill.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 보유 스킬 목록 (활동 스킬만 슬롯 장착) */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="text-sm font-bold text-white flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
                <span className="truncate">보유 스킬 ({availableSkills.filter((s) => !s.isPassive).length}개)</span>
              </div>
              <div className="text-[11px] text-gray-400 shrink-0">
                스킬을 선택하고 장착할 슬롯을 고르세요
              </div>
            </div>

            {availableSkills.filter((s) => !s.isPassive).length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                보유 중인 스킬이 없습니다.
                <br />
                웨이브를 클리어하여 새로운 스킬을 획득하세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {availableSkills
                  .filter((s) => !s.isPassive)
                  .map((skill, index) => {
                  const isEquipped = equippedSkills.some(
                    (s) => s && s.id === skill.id,
                  );

                  return (
                    <Card
                      key={`${skill.id}-${index}`}
                      className={`p-3 border ${
                        isEquipped
                          ? 'border-green-500/70 bg-slate-900/90'
                          : 'border-slate-700 bg-slate-900/80 hover:border-purple-500'
                      } transition-colors`}
                    >
                      <div className="flex flex-col gap-2">
                        {/* 제목 */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-white">
                              {skill.name}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                              {skill.description}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                skill.type === 'attack'
                                  ? 'bg-red-700/60 text-red-100'
                                  : skill.type === 'defense'
                                  ? 'bg-blue-700/60 text-blue-100'
                                  : 'bg-purple-700/60 text-purple-100'
                              }`}
                            >
                              {skill.type === 'attack'
                                ? '공격'
                                : skill.type === 'defense'
                                ? '방어'
                                : '특수'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              쿨다운: {Math.ceil(skill.cooldown / 60)}초
                            </span>
                          </div>
                        </div>

                        {/* 장착 버튼들 */}
                        <div className="grid grid-cols-3 gap-1 mt-1">
                          {[0, 1, 2].map((slotIndex) => {
                            const slotSkill = equippedSkills[slotIndex];
                            const isSame = slotSkill?.id === skill.id;

                            return (
                              <Button
                                key={slotIndex}
                                size="sm"
                                variant={isSame ? 'secondary' : 'outline'}
                                className={`h-7 text-[10px] px-1 py-0 ${
                                  isSame
                                    ? 'border-green-400 text-green-200 bg-green-900/40'
                                    : 'border-slate-600 text-gray-200 hover:border-purple-400'
                                }`}
                                onClick={() => handleEquip(skill, slotIndex)}
                              >
                                {slotIndex + 1}번
                              </Button>
                            );
                          })}
                        </div>

                        {isEquipped && (
                          <div className="text-[10px] text-green-400 mt-1">
                            이 스킬은 이미 장착 중입니다.
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
      </div>
    </div>
  );
};

