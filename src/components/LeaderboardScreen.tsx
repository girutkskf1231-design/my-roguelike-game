import { useEffect, useState } from 'react';
import { supabase, fetchLeaderboard, type GameScoreRow } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, X } from 'lucide-react';
import { getClassDisplayName } from '@/data/classes';

const NICKNAME_KEY = 'roguelike-player-name';

/** 초 단위를 MM:SS 또는 HH:MM:SS 문자열로 변환 */
function formatPlayDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getStoredPlayerName(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredPlayerName(name: string): void {
  try {
    localStorage.setItem(NICKNAME_KEY, name.trim().slice(0, 20) || '');
  } catch {
    /* ignore */
  }
}

interface LeaderboardScreenProps {
  onClose: () => void;
  embedded?: boolean;
}

export function LeaderboardScreen({ onClose, embedded }: LeaderboardScreenProps) {
  const [scores, setScores] = useState<GameScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [nickname, setNickname] = useState(getStoredPlayerName);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const list = await fetchLeaderboard(30);
      setScores(list);
    } catch {
      setLoadError(true);
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNicknameBlur = () => {
    setStoredPlayerName(nickname);
  };

  return (
    <div
      className={
        embedded
          ? 'flex flex-col h-full bg-slate-900/98 rounded-lg border border-slate-600 overflow-hidden'
          : 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      }
    >
      <div
        className={
          embedded
            ? 'flex flex-col h-full max-h-[600px]'
            : 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border-4 border-purple-600 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col'
        }
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-600/50 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">리더보드</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={load}
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-600/50 shrink-0">
          <label className="text-xs text-gray-400 block mb-1">닉네임 (점수 제출 시 사용)</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onBlur={handleNicknameBlur}
            placeholder="Guest"
            maxLength={20}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!supabase && (
            <div className="text-center text-gray-400 py-8">
              <p className="mb-2">Supabase가 설정되지 않았습니다.</p>
              <p className="text-sm">.env에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 설정하면 리더보드를 사용할 수 있습니다.</p>
            </div>
          )}
          {supabase && loadError && !loading && (
            <div className="text-center text-amber-400/90 py-8">
              <p className="mb-2">리더보드를 일시적으로 불러올 수 없습니다.</p>
              <p className="text-sm text-gray-400">잠시 후 새로고침 버튼을 눌러 주세요. 게임은 그대로 이용할 수 있습니다.</p>
            </div>
          )}
          {supabase && loading && (
            <div className="text-center text-gray-400 py-8">불러오는 중...</div>
          )}
          {supabase && !loading && !loadError && scores.length === 0 && (
            <div className="text-center text-gray-400 py-8">아직 기록이 없습니다. 첫 번째 기록을 남겨보세요!</div>
          )}
          {supabase && !loading && !loadError && scores.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-slate-600/50">
                    <th className="pb-2 pr-2 w-10">#</th>
                    <th className="pb-2 pr-2">닉네임</th>
                    <th className="pb-2 pr-2 whitespace-nowrap">도달 시간</th>
                    <th className="pb-2 pr-2">난이도</th>
                    <th className="pb-2 pr-2">직업</th>
                    <th className="pb-2 pr-2 whitespace-nowrap">플레이 시간</th>
                    <th className="pb-2 text-right">점수</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-700/50 text-gray-300">
                      <td className="py-2 pr-2 font-bold text-yellow-400/90">{i + 1}</td>
                      <td className="py-2 pr-2 font-medium text-white">{row.player_name}</td>
                      <td className="py-2 pr-2 text-gray-400 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2 pr-2">
                        <span
                          className={
                            row.difficulty === 'hard'
                              ? 'text-red-400'
                              : 'text-blue-400'
                          }
                        >
                          {row.difficulty === 'hard' ? '하드' : '노말'}
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-gray-400">
                        {getClassDisplayName(row.class_type)}
                      </td>
                      <td className="py-2 pr-2 text-gray-400 whitespace-nowrap">
                        {formatPlayDuration(row.play_duration_seconds)}
                      </td>
                      <td className="py-2 text-right text-yellow-300 font-medium">
                        {row.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
