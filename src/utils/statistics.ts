interface GameStatistics {
  totalGamesPlayed: number;
  totalPlayTime: number;
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
    [key: string]: number;
  };
}

// 통계 불러오기
export const loadStatistics = (): GameStatistics => {
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

// 통계 저장
export const saveStatistics = (stats: GameStatistics): void => {
  localStorage.setItem('roguelike-statistics', JSON.stringify(stats));
};

// 게임 시작 시 통계 초기화
export const initGameSession = (): number => {
  return Date.now(); // 시작 시간 반환
};

// 게임 종료 시 통계 업데이트
export const updateStatisticsOnGameEnd = (
  wave: number,
  score: number,
  classType: string,
  weaponName: string,
  startTime: number,
  isDeath: boolean
): void => {
  const stats = loadStatistics();
  const playTime = Math.floor((Date.now() - startTime) / 1000); // 초 단위

  // 기본 통계 업데이트
  stats.totalGamesPlayed++;
  stats.totalPlayTime += playTime;
  stats.highestWave = Math.max(stats.highestWave, wave);
  stats.highestScore = Math.max(stats.highestScore, score);
  
  if (isDeath) {
    stats.totalDeaths++;
  }

  // 직업별 통계
  if (!stats.classStats[classType]) {
    stats.classStats[classType] = {
      gamesPlayed: 0,
      highestWave: 0,
      totalKills: 0,
    };
  }
  stats.classStats[classType].gamesPlayed++;
  stats.classStats[classType].highestWave = Math.max(
    stats.classStats[classType].highestWave,
    wave
  );
  stats.classStats[classType].totalKills += wave; // 웨이브 = 처치한 보스 수

  // 가장 많이 플레이한 직업 찾기
  let maxPlays = 0;
  let favClass = '없음';
  Object.entries(stats.classStats).forEach(([className, classData]) => {
    if (classData.gamesPlayed > maxPlays) {
      maxPlays = classData.gamesPlayed;
      favClass = className;
    }
  });
  stats.favoriteClass = favClass;

  // 무기 사용 통계
  if (!stats.weaponUsage[weaponName]) {
    stats.weaponUsage[weaponName] = 0;
  }
  stats.weaponUsage[weaponName]++;

  // 보스 처치 수 (웨이브 = 보스 처치 수)
  stats.totalBossKills += wave;

  saveStatistics(stats);
};

// 무기 사용 통계 업데이트 (무기 교체 시)
export const updateWeaponUsage = (weaponName: string): void => {
  const stats = loadStatistics();
  
  if (!stats.weaponUsage[weaponName]) {
    stats.weaponUsage[weaponName] = 0;
  }
  stats.weaponUsage[weaponName]++;
  
  saveStatistics(stats);
};
