import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sword, Target, Flame, MoreHorizontal } from 'lucide-react';
import { fetchWeaponCompendium, type WeaponCompendiumEntry } from '../lib/supabase';
import { Button } from './ui/button';
import { Card } from './ui/card';

// 세션 내 카테고리별 캐시
const weaponCache = new Map<string, WeaponCompendiumEntry[]>();

const CATEGORIES = [
  { id: 'melee', label: '근접 무기', icon: Sword },
  { id: 'ranged', label: '원거리 무기', icon: Target },
  { id: 'elemental', label: '원소 무기', icon: Flame },
  { id: 'other', label: '기타 무기', icon: MoreHorizontal },
] as const;

export const WeaponCompendium: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('melee');
  const [weapons, setWeapons] = useState<WeaponCompendiumEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 캐시에 있으면 즉시 표시
    if (weaponCache.has(category)) {
      setWeapons(weaponCache.get(category)!);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchWeaponCompendium(category).then((data) => {
      weaponCache.set(category, data);
      setWeapons(data);
      setLoading(false);
    });
  }, [category]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack ?? (() => navigate('/'))}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">⚔️ 무기 도감</h1>
        </div>
        <nav className="max-w-4xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                category === id
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">불러오는 중...</div>
        ) : weapons.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            이 카테고리에 등록된 무기가 없습니다.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {weapons.map((w) => (
              <Card
                key={w.id}
                className="p-4 bg-slate-800/60 border-slate-700/60 hover:border-slate-600/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-100 truncate">{w.name}</h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{w.description}</p>
                    <div className="mt-2 space-y-1.5">
                      {/* 특수 효과: | 구분자로 분리해 뱃지로 표시 */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {w.special_effect.split('|').map((part, i) => (
                          <span
                            key={i}
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              i === 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-700/60 text-slate-300 border border-slate-600/40'
                            }`}
                          >
                            {part.trim()}
                          </span>
                        ))}
                      </div>
                      {w.fusion_formula && w.fusion_formula !== '없음' && (
                        <div className="text-xs text-emerald-300/80 bg-emerald-900/20 border border-emerald-700/30 rounded px-2 py-1">
                          🔗 {w.fusion_formula}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
