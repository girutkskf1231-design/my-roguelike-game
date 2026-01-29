import React from 'react';
import { X, Trophy, Sword, Target, Clock, TrendingUp, Zap, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface GameStatistics {
  totalGamesPlayed: number;
  totalPlayTime: number; // 초 단위
  highestWave: number;
  highestScore: number;
  totalBossKills: number;
  totalDeaths: number;
  favoriteClass: string;
  classStats: {
    [key: string]: {
      gamesPlayed: number;
      highestWave: number;
      totalKills: number;
    };
  };
  weaponUsage: {
    [key: string]: number; // 무기별 사용 횟수
  };
}

interface StatisticsScreenProps {
  onClose: () => void;
}

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ onClose }) => {
  // localStorage에서 통계 불러오기
  const loadStatistics = (): GameStatistics => {
    const saved = localStorage.getItem('roguelike-statistics');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      totalGamesPlayed: 0,
      totalPlayTime: 0,
      highestWave: 0,
      highestScore: 0,
      totalBossKills: 0,
      totalDeaths: 0,
      favoriteClass: '없음',
      classStats: {},
      weaponUsage: {},
    };
  };

  const stats = loadStatistics();

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    } else {
      return `${secs}초`;
    }
  };

  // 승률 계산
  const winRate = stats.totalGamesPlayed > 0 
    ? ((stats.totalGamesPlayed - stats.totalDeaths) / stats.totalGamesPlayed * 100).toFixed(1)
    : 0;

  // 평균 웨이브
  const averageWave = stats.totalGamesPlayed > 0 
    ? (stats.highestWave / stats.totalGamesPlayed).toFixed(1)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="max-w-5xl w-full h-[90vh] p-4 flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-purple-900/80 to-blue-900/80 rounded-lg p-4 border-2 border-purple-600">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              게임 통계
            </h1>
            <p className="text-purple-200 text-sm mt-1">
              📊 당신의 게임 기록을 확인하세요
            </p>
          </div>
          <Button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 h-10 w-10 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 통계 내용 */}
        <div className="flex-1 overflow-y-auto pr-2">
          {stats.totalGamesPlayed === 0 ? (
            /* 데이터 없음 */
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <TrendingUp className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-400 mb-2">아직 기록이 없습니다</h2>
                <p className="text-gray-500">게임을 플레이하면 통계가 쌓입니다!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 주요 통계 카드 */}
              <div className="grid grid-cols-4 gap-4">
                {/* 총 플레이 횟수 */}
                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-600 p-4">
                  <div className="text-center">
                    <Sword className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <div className="text-blue-200 text-xs mb-1">총 플레이</div>
                    <div className="text-white text-2xl font-bold">{stats.totalGamesPlayed}</div>
                    <div className="text-blue-300 text-xs mt-1">게임</div>
                  </div>
                </Card>

                {/* 최고 웨이브 */}
                <Card className="bg-gradient-to-br from-yellow-900/50 to-orange-800/50 border-yellow-600 p-4">
                  <div className="text-center">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                    <div className="text-yellow-200 text-xs mb-1">최고 웨이브</div>
                    <div className="text-white text-2xl font-bold">{stats.highestWave}</div>
                    <div className="text-yellow-300 text-xs mt-1">/ 100</div>
                  </div>
                </Card>

                {/* 최고 점수 */}
                <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-600 p-4">
                  <div className="text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <div className="text-purple-200 text-xs mb-1">최고 점수</div>
                    <div className="text-white text-2xl font-bold">{stats.highestScore.toLocaleString()}</div>
                    <div className="text-purple-300 text-xs mt-1">점</div>
                  </div>
                </Card>

                {/* 플레이 시간 */}
                <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-600 p-4">
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <div className="text-green-200 text-xs mb-1">총 플레이</div>
                    <div className="text-white text-lg font-bold">{formatTime(stats.totalPlayTime)}</div>
                    <div className="text-green-300 text-xs mt-1">시간</div>
                  </div>
                </Card>
              </div>

              {/* 전투 통계 */}
              <Card className="bg-slate-900/90 border-slate-700 p-4">
                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-400" />
                  전투 통계
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">보스 처치</span>
                      <span className="text-red-400 text-2xl font-bold">{stats.totalBossKills}</span>
                    </div>
                    <div className="text-gray-500 text-xs">총 처치한 보스</div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">사망 횟수</span>
                      <span className="text-gray-400 text-2xl font-bold">{stats.totalDeaths}</span>
                    </div>
                    <div className="text-gray-500 text-xs">Game Over</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">승률</span>
                      <span className="text-green-400 text-2xl font-bold">{winRate}%</span>
                    </div>
                    <div className="text-gray-500 text-xs">승리 / 전체</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">평균 웨이브</span>
                      <span className="text-blue-400 text-2xl font-bold">{averageWave}</span>
                    </div>
                    <div className="text-gray-500 text-xs">게임당 평균</div>
                  </div>
                </div>
              </Card>

              {/* 직업별 통계 */}
              {Object.keys(stats.classStats).length > 0 && (
                <Card className="bg-slate-900/90 border-slate-700 p-4">
                  <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    직업별 통계
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(stats.classStats).map(([className, classData]) => (
                      <div key={className} className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-white font-bold">
                            {className === 'warrior' && '⚔️ 전사'}
                            {className === 'archer' && '🏹 궁수'}
                            {className === 'mage' && '🪄 마법사'}
                            {className === 'assassin' && '🗡️ 암살자'}
                          </div>
                          {stats.favoriteClass === className && (
                            <span className="text-yellow-400 text-xs">⭐ 최애</span>
                          )}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-gray-400">
                            <span>플레이 횟수</span>
                            <span className="text-white">{classData.gamesPlayed}회</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>최고 웨이브</span>
                            <span className="text-white">Wave {classData.highestWave}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>처치 수</span>
                            <span className="text-white">{classData.totalKills}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 무기 사용 통계 */}
              {Object.keys(stats.weaponUsage).length > 0 && (
                <Card className="bg-slate-900/90 border-slate-700 p-4">
                  <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                    <Sword className="w-5 h-5 text-orange-400" />
                    인기 무기 TOP 5
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stats.weaponUsage)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([weaponName, count], index) => (
                        <div key={weaponName} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`text-2xl font-bold ${
                              index === 0 ? 'text-yellow-400' :
                              index === 1 ? 'text-gray-300' :
                              index === 2 ? 'text-orange-600' :
                              'text-gray-500'
                            }`}>
                              #{index + 1}
                            </div>
                            <div className="text-white font-medium">{weaponName}</div>
                          </div>
                          <div className="text-gray-400">
                            <span className="text-white font-bold text-lg">{count}</span>회 사용
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

              {/* 도전과제 (미래 확장용) */}
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-600 p-4">
                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  도전과제
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {/* 첫 승리 */}
                  <div className={`bg-slate-800/50 rounded-lg p-3 text-center ${
                    stats.highestWave >= 100 ? 'border border-yellow-500' : 'opacity-50'
                  }`}>
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="text-xs text-white font-bold">완벽한 승리</div>
                    <div className="text-[10px] text-gray-400 mt-1">Wave 100 클리어</div>
                  </div>

                  {/* 50 웨이브 */}
                  <div className={`bg-slate-800/50 rounded-lg p-3 text-center ${
                    stats.highestWave >= 50 ? 'border border-yellow-500' : 'opacity-50'
                  }`}>
                    <div className="text-2xl mb-1">⚔️</div>
                    <div className="text-xs text-white font-bold">중반 돌파</div>
                    <div className="text-[10px] text-gray-400 mt-1">Wave 50 도달</div>
                  </div>

                  {/* 100회 플레이 */}
                  <div className={`bg-slate-800/50 rounded-lg p-3 text-center ${
                    stats.totalGamesPlayed >= 100 ? 'border border-yellow-500' : 'opacity-50'
                  }`}>
                    <div className="text-2xl mb-1">🎮</div>
                    <div className="text-xs text-white font-bold">열정 게이머</div>
                    <div className="text-[10px] text-gray-400 mt-1">100회 플레이</div>
                  </div>

                  {/* 100 보스 처치 */}
                  <div className={`bg-slate-800/50 rounded-lg p-3 text-center ${
                    stats.totalBossKills >= 100 ? 'border border-yellow-500' : 'opacity-50'
                  }`}>
                    <div className="text-2xl mb-1">👹</div>
                    <div className="text-xs text-white font-bold">보스 헌터</div>
                    <div className="text-[10px] text-gray-400 mt-1">100마리 처치</div>
                  </div>

                  {/* 10시간 플레이 */}
                  <div className={`bg-slate-800/50 rounded-lg p-3 text-center ${
                    stats.totalPlayTime >= 36000 ? 'border border-yellow-500' : 'opacity-50'
                  }`}>
                    <div className="text-2xl mb-1">⏰</div>
                    <div className="text-xs text-white font-bold">시간 여행자</div>
                    <div className="text-[10px] text-gray-400 mt-1">10시간 플레이</div>
                  </div>

                  {/* 모든 직업 플레이 */}
                  <div className={`bg-slate-800/50 rounded-lg p-3 text-center ${
                    Object.keys(stats.classStats).length >= 4 ? 'border border-yellow-500' : 'opacity-50'
                  }`}>
                    <div className="text-2xl mb-1">🎭</div>
                    <div className="text-xs text-white font-bold">만능 플레이어</div>
                    <div className="text-[10px] text-gray-400 mt-1">모든 직업 플레이</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 인라인 확장용 통계 내용 컴포넌트 (헤더/닫기 버튼 없음)
export const StatisticsContent: React.FC = () => {
  // localStorage에서 통계 불러오기
  const loadStatistics = (): GameStatistics => {
    const saved = localStorage.getItem('roguelike-statistics');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      totalGamesPlayed: 0,
      totalPlayTime: 0,
      highestWave: 0,
      highestScore: 0,
      totalBossKills: 0,
      totalDeaths: 0,
      favoriteClass: '없음',
      classStats: {},
      weaponUsage: {},
    };
  };

  const stats = loadStatistics();

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    } else {
      return `${secs}초`;
    }
  };

  // 승률 계산
  const winRate = stats.totalGamesPlayed > 0 
    ? ((stats.totalGamesPlayed - stats.totalDeaths) / stats.totalGamesPlayed * 100).toFixed(1)
    : 0;

  // 평균 웨이브
  const averageWave = stats.totalGamesPlayed > 0 
    ? (stats.highestWave / stats.totalGamesPlayed).toFixed(1)
    : 0;

  return (
    <div className="bg-gradient-to-r from-purple-900/80 to-blue-900/80 rounded-lg p-4 border-2 border-purple-600">
      {/* 헤더 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          게임 통계
        </h2>
        <p className="text-purple-200 text-sm mt-1">
          📊 당신의 게임 기록을 확인하세요
        </p>
      </div>

      {/* 통계 내용 */}
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        {stats.totalGamesPlayed === 0 ? (
          /* 데이터 없음 */
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-3 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-400 mb-1">아직 기록이 없습니다</h3>
              <p className="text-gray-500 text-sm">게임을 플레이하면 통계가 쌓입니다!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 주요 통계 카드 */}
            <div className="grid grid-cols-4 gap-3">
              {/* 총 플레이 횟수 */}
              <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-600 p-3">
                <div className="text-center">
                  <Sword className="w-6 h-6 mx-auto mb-1 text-blue-400" />
                  <div className="text-blue-200 text-xs mb-1">총 플레이</div>
                  <div className="text-white text-xl font-bold">{stats.totalGamesPlayed}</div>
                  <div className="text-blue-300 text-xs mt-0.5">게임</div>
                </div>
              </Card>

              {/* 최고 웨이브 */}
              <Card className="bg-gradient-to-br from-yellow-900/50 to-orange-800/50 border-yellow-600 p-3">
                <div className="text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
                  <div className="text-yellow-200 text-xs mb-1">최고 웨이브</div>
                  <div className="text-white text-xl font-bold">{stats.highestWave}</div>
                  <div className="text-yellow-300 text-xs mt-0.5">/ 100</div>
                </div>
              </Card>

              {/* 최고 점수 */}
              <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-600 p-3">
                <div className="text-center">
                  <Zap className="w-6 h-6 mx-auto mb-1 text-purple-400" />
                  <div className="text-purple-200 text-xs mb-1">최고 점수</div>
                  <div className="text-white text-lg font-bold">{stats.highestScore.toLocaleString()}</div>
                  <div className="text-purple-300 text-xs mt-0.5">점</div>
                </div>
              </Card>

              {/* 플레이 시간 */}
              <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-600 p-3">
                <div className="text-center">
                  <Clock className="w-6 h-6 mx-auto mb-1 text-green-400" />
                  <div className="text-green-200 text-xs mb-1">총 플레이</div>
                  <div className="text-white text-sm font-bold">{formatTime(stats.totalPlayTime)}</div>
                  <div className="text-green-300 text-xs mt-0.5">시간</div>
                </div>
              </Card>
            </div>

            {/* 전투 통계 */}
            <Card className="bg-slate-900/90 border-slate-700 p-3">
              <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-red-400" />
                전투 통계
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-xs">보스 처치</span>
                    <span className="text-red-400 text-xl font-bold">{stats.totalBossKills}</span>
                  </div>
                  <div className="text-gray-500 text-[10px]">총 처치한 보스</div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-xs">사망 횟수</span>
                    <span className="text-gray-400 text-xl font-bold">{stats.totalDeaths}</span>
                  </div>
                  <div className="text-gray-500 text-[10px]">Game Over</div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-xs">승률</span>
                    <span className="text-green-400 text-xl font-bold">{winRate}%</span>
                  </div>
                  <div className="text-gray-500 text-[10px]">승리 / 전체</div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-xs">평균 웨이브</span>
                    <span className="text-blue-400 text-xl font-bold">{averageWave}</span>
                  </div>
                  <div className="text-gray-500 text-[10px]">게임당 평균</div>
                </div>
              </div>
            </Card>

            {/* 직업별 통계 */}
            {Object.keys(stats.classStats).length > 0 && (
              <Card className="bg-slate-900/90 border-slate-700 p-3">
                <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  직업별 통계
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stats.classStats).map(([className, classData]) => (
                    <div key={className} className="bg-slate-800/50 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-white font-bold text-sm">
                          {className === 'warrior' && '⚔️ 전사'}
                          {className === 'archer' && '🏹 궁수'}
                          {className === 'mage' && '🪄 마법사'}
                          {className === 'assassin' && '🗡️ 암살자'}
                        </div>
                        {stats.favoriteClass === className && (
                          <span className="text-yellow-400 text-[10px]">⭐ 최애</span>
                        )}
                      </div>
                      <div className="space-y-0.5 text-[10px]">
                        <div className="flex justify-between text-gray-400">
                          <span>플레이 횟수</span>
                          <span className="text-white">{classData.gamesPlayed}회</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>최고 웨이브</span>
                          <span className="text-white">Wave {classData.highestWave}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>처치 수</span>
                          <span className="text-white">{classData.totalKills}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 무기 사용 통계 */}
            {Object.keys(stats.weaponUsage).length > 0 && (
              <Card className="bg-slate-900/90 border-slate-700 p-3">
                <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                  <Sword className="w-4 h-4 text-orange-400" />
                  인기 무기 TOP 5
                </h3>
                <div className="space-y-1.5">
                  {Object.entries(stats.weaponUsage)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([weaponName, count], index) => (
                      <div key={weaponName} className="bg-slate-800/50 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`text-lg font-bold ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-600' :
                            'text-gray-500'
                          }`}>
                            #{index + 1}
                          </div>
                          <div className="text-white font-medium text-sm">{weaponName}</div>
                        </div>
                        <div className="text-gray-400 text-xs">
                          <span className="text-white font-bold">{count}</span>회 사용
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* 도전과제 */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-600 p-3">
              <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                도전과제
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${
                  stats.highestWave >= 100 ? 'border border-yellow-500' : 'opacity-50'
                }`}>
                  <div className="text-xl mb-0.5">🏆</div>
                  <div className="text-[10px] text-white font-bold">완벽한 승리</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">Wave 100</div>
                </div>

                <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${
                  stats.highestWave >= 50 ? 'border border-yellow-500' : 'opacity-50'
                }`}>
                  <div className="text-xl mb-0.5">⚔️</div>
                  <div className="text-[10px] text-white font-bold">중반 돌파</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">Wave 50</div>
                </div>

                <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${
                  stats.totalGamesPlayed >= 100 ? 'border border-yellow-500' : 'opacity-50'
                }`}>
                  <div className="text-xl mb-0.5">🎮</div>
                  <div className="text-[10px] text-white font-bold">열정 게이머</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">100회 플레이</div>
                </div>

                <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${
                  stats.totalBossKills >= 100 ? 'border border-yellow-500' : 'opacity-50'
                }`}>
                  <div className="text-xl mb-0.5">👹</div>
                  <div className="text-[10px] text-white font-bold">보스 헌터</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">100마리 처치</div>
                </div>

                <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${
                  stats.totalPlayTime >= 36000 ? 'border border-yellow-500' : 'opacity-50'
                }`}>
                  <div className="text-xl mb-0.5">⏰</div>
                  <div className="text-[10px] text-white font-bold">시간 여행자</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">10시간 플레이</div>
                </div>

                <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${
                  Object.keys(stats.classStats).length >= 4 ? 'border border-yellow-500' : 'opacity-50'
                }`}>
                  <div className="text-xl mb-0.5">🎭</div>
                  <div className="text-[10px] text-white font-bold">만능 플레이어</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">모든 직업</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsScreen;
