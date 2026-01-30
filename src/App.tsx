import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { Difficulty, ClassType } from './types/game';
import { useGame } from './hooks/useGame';
import { GameCanvas } from './components/GameCanvas';
import { RewardChoiceScreen } from './components/RewardChoiceScreen';
import { WaveCompleteNotification } from './components/WaveCompleteNotification';
import ClassSelectionScreen from './components/ClassSelectionScreen';
import InventoryScreen from './components/InventoryScreen';
import { SkillSelectModal } from './components/SkillSelectModal';
import UpgradePage from './components/UpgradePage';
import EvolutionPage from './components/EvolutionPage';
import FusionPage from './components/FusionPage';
import { StatisticsContent } from './components/StatisticsScreen';
import ArtifactScreen from './components/ArtifactScreen';
import { LeaderboardScreen, getStoredPlayerName } from './components/LeaderboardScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { LoginScreen } from './components/LoginScreen';
import { MyInfoScreen } from './components/MyInfoScreen';
import { submitScoreToLeaderboard, updateMobileSettings } from './lib/supabase';
import type { MobileSettings } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { MobileControls } from './components/MobileControls';
import { Button } from './components/ui/button';
import {
  Crown,
  Heart,
  Zap,
  RotateCcw,
  Plus,
  Sparkles,
  Pause,
  Play,
  Package,
  TrendingUp,
  Sword,
  Trophy,
  Clock,
} from 'lucide-react';
import './App.css';

// UI 패널 표시 상태 초기값
const INITIAL_PANEL_STATE = {
  showInventory: false,
  showUpgrade: false,
  showEvolution: false,
  showFusion: false,
  showStatistics: false,
  showArtifacts: false,
  showStats: false,
  showSkillSelect: false,
} as const;

function App() {
  const {
    gameState,
    gameStateRef,
    highScore,
    selectClass,
    restartGame,
    resetGame,
    upgradeStat,
    equipSkill,
    handleRewardSelect,
    togglePause,
    startGame,
    equipWeaponFromInventory,
    upgradeWeaponWithPoints,
    evolveWeaponInInventory,
    fuseWeaponsInInventory,
    equipArtifact,
    unequipArtifact,
    playElapsedSeconds,
    getLastPlayDuration,
    setMovementKeys,
  } = useGame();

  // UI 패널 표시 상태 (초기값: INITIAL_PANEL_STATE)
  const [showInventory, setShowInventory] = useState<boolean>(INITIAL_PANEL_STATE.showInventory);
  const [showUpgrade, setShowUpgrade] = useState<boolean>(INITIAL_PANEL_STATE.showUpgrade);
  const [showEvolution, setShowEvolution] = useState<boolean>(INITIAL_PANEL_STATE.showEvolution);
  const [showFusion, setShowFusion] = useState<boolean>(INITIAL_PANEL_STATE.showFusion);
  const [showStatistics, setShowStatistics] = useState<boolean>(INITIAL_PANEL_STATE.showStatistics);
  const [showArtifacts, setShowArtifacts] = useState<boolean>(INITIAL_PANEL_STATE.showArtifacts);
  const [showStats, setShowStats] = useState<boolean>(INITIAL_PANEL_STATE.showStats);
  const [showSkillSelect, setShowSkillSelect] = useState<boolean>(INITIAL_PANEL_STATE.showSkillSelect);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showSignUp, setShowSignUp] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showMyInfo, setShowMyInfo] = useState<boolean>(false);

  const { user, profile, signOut } = useAuth();

  // 메뉴/선택 상태
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  // 모바일 컨트롤 설정 (로컬 덮어쓰기 → Supabase profile → localStorage)
  const [localMobileSettings, setLocalMobileSettings] = useState<MobileSettings | null>(null);
  const mobileSettings: MobileSettings = useMemo(() => {
    if (localMobileSettings) return localMobileSettings;
    const fromProfile = profile?.mobile_settings;
    if (fromProfile && typeof fromProfile === 'object') return fromProfile;
    try {
      const raw = localStorage.getItem('roguelike-mobile-settings');
      if (raw) return JSON.parse(raw) as MobileSettings;
    } catch {
      /* ignore */
    }
    return { movementOnLeft: true };
  }, [localMobileSettings, profile?.mobile_settings]);

  const handleMobileSettingsChange = useCallback(
    (next: MobileSettings) => {
      setLocalMobileSettings(next);
      try {
        localStorage.setItem('roguelike-mobile-settings', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if (user?.id) {
        updateMobileSettings(user.id, next).catch(() => {});
      }
    },
    [user?.id]
  );

  // 게임 영역 반응형 스케일 (모바일에서 800x600 비율 유지)
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [gameScale, setGameScale] = useState(1);
  useEffect(() => {
    const el = gameContainerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setGameScale(Math.min(1, w / 800, h / 600));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gameState.gameStatus]);

  // 게임 종료 시 리더보드에 점수 제출 (전사는 제외, 한 번만)
  const lastSubmittedRef = useRef<string | null>(null);
  useEffect(() => {
    if (gameState.gameStatus !== 'defeat' && gameState.gameStatus !== 'victory') {
      lastSubmittedRef.current = null;
      return;
    }
    if (gameState.player.class === 'warrior') return; // 전사는 리더보드 등재 안 함
    if (!user) return; // 비로그인 시 리더보드 등재 불가
    const key = `${gameState.score}-${gameState.wave}-${gameState.gameStatus}`;
    if (lastSubmittedRef.current === key) return;
    lastSubmittedRef.current = key;
    void submitScoreToLeaderboard({
      playerName: profile?.nickname ?? getStoredPlayerName() ?? 'Guest',
      score: gameState.score,
      wave: gameState.wave,
      difficulty: gameState.difficulty,
      classType: gameState.player.class,
      playDurationSeconds: getLastPlayDuration(),
      userId: user?.id,
    }).catch(() => {});
  }, [gameState.gameStatus, gameState.score, gameState.wave, gameState.difficulty, gameState.player.class, getLastPlayDuration, profile?.nickname, user, user?.id]);

  // UI에서 자주 쓰는 값 메모이제이션
  const uiData = useMemo(() => {
    const player = gameState.player;
    const healthPercent =
      player.maxHealth > 0 ? (player.health / player.maxHealth) * 100 : 0;
    const expPercent =
      player.experienceToNextLevel > 0
        ? (player.experience / player.experienceToNextLevel) * 100
        : 0;
    const dodgePercent = player.isDodging
      ? 100
      : Math.max(0, 100 - (player.dodgeCooldown / 60) * 100);

    return {
      playerHealthPercent: healthPercent,
      expPercent,
      dodgeCooldownPercent: dodgePercent,
      activeEffects: player.activeSkillEffects,
    };
  }, [
    gameState.player.health,
    gameState.player.maxHealth,
    gameState.player.experience,
    gameState.player.experienceToNextLevel,
    gameState.player.dodgeCooldown,
    gameState.player.isDodging,
    gameState.player.activeSkillEffects,
  ]);

  // 인벤토리 / 아티팩트 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameStatus !== 'playing' || gameState.isPaused) return;

      if (e.key === 'i' || e.key === 'I') {
        setShowInventory(prev => !prev);
      }
      if (e.key === 'u' || e.key === 'U') {
        const active = document.activeElement;
        if (
          active?.tagName !== 'INPUT' &&
          active?.tagName !== 'TEXTAREA'
        ) {
          setShowArtifacts(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameStatus, gameState.isPaused]);

  // 메뉴로 돌아오면 UI 상태 초기화 (INITIAL_PANEL_STATE와 동기화)
  useEffect(() => {
    if (gameState.gameStatus === 'menu') {
      setSelectedDifficulty(null);
      setShowSkillSelect(INITIAL_PANEL_STATE.showSkillSelect);
      setShowInventory(INITIAL_PANEL_STATE.showInventory);
      setShowUpgrade(INITIAL_PANEL_STATE.showUpgrade);
      setShowEvolution(INITIAL_PANEL_STATE.showEvolution);
      setShowFusion(INITIAL_PANEL_STATE.showFusion);
      setShowStatistics(INITIAL_PANEL_STATE.showStatistics);
      setShowArtifacts(INITIAL_PANEL_STATE.showArtifacts);
      setShowStats(INITIAL_PANEL_STATE.showStats);
      setShowLeaderboard(false);
      setShowSignUp(false);
      setShowLogin(false);
      setShowMyInfo(false);
    }
  }, [gameState.gameStatus]);

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleClassSelect = (classType: ClassType) => {
    const difficultyToUse: Difficulty = selectedDifficulty || 'normal';
    selectClass(classType, difficultyToUse);
    startGame(difficultyToUse);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      {/* 메인 메뉴: 난이도 선택 */}
      {gameState.gameStatus === 'menu' && !selectedDifficulty && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-10 border-4 border-purple-600 shadow-2xl max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-bounce">⚔️</div>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-400 mb-2">
                Roguelike Arena
              </div>
              <div className="text-gray-400 text-sm">난이도를 선택하세요</div>
            </div>

            {highScore > 0 && (
              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-3 mb-6 border border-yellow-600/50">
                <div className="text-center">
                  <div className="text-yellow-400 text-xs mb-1">🏆 최고 점수</div>
                  <div className="text-yellow-300 font-bold text-2xl">{highScore}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handleDifficultySelect('normal')}
                className="group relative bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl p-6 border-2 border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
              >
                <div className="text-4xl mb-3">🛡️</div>
                <div className="text-2xl font-bold text-white mb-2">노말</div>
                <div className="text-blue-100 text-sm mb-4">표준 난이도</div>
                <div className="bg-blue-950/50 rounded p-3 text-xs text-blue-200 space-y-1">
                  <div>• 웨이브 1-100</div>
                  <div>• 보스 패턴: 최대 10개</div>
                  <div>• 균형잡힌 난이도</div>
                </div>
              </button>

              <button
                onClick={() => handleDifficultySelect('hard')}
                className="group relative bg-gradient-to-br from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl p-6 border-2 border-red-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50"
              >
                <div className="text-4xl mb-3">🔥</div>
                <div className="text-2xl font-bold text-white mb-2">하드</div>
                <div className="text-red-100 text-sm mb-4">극한의 도전</div>
                <div className="bg-red-950/50 rounded p-3 text-xs text-red-200 space-y-1">
                  <div>• 웨이브 1-100</div>
                  <div>• 보스 패턴: 최대 20개</div>
                  <div>• 웨이브 100 극악 난이도</div>
                </div>
              </button>
            </div>

            <div className="mt-6 text-center text-gray-400 text-xs">
              💡 하드 모드는 웨이브 100에서 압도적인 탄막 패턴이 추가됩니다
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowLeaderboard(true)}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 h-12 text-base font-bold border-2 border-yellow-400"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  🏆 리더보드
                </Button>
                <Button
                  onClick={() => setShowStatistics(prev => !prev)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-base font-bold border-2 border-purple-400"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  📊 통계 보기
                </Button>
              </div>
              <div className="flex gap-3">
                {user ? (
                  <>
                    <Button
                      onClick={() => setShowMyInfo(true)}
                      variant="outline"
                      className="flex-1 h-11 text-base font-bold border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/30"
                    >
                      내 정보
                    </Button>
                    <span className="flex-1 flex items-center justify-center text-cyan-300 text-sm font-medium truncate px-2">
                      {profile?.nickname ?? user.email ?? '로그인됨'}
                    </span>
                    <Button
                      onClick={() => signOut()}
                      variant="outline"
                      className="flex-1 h-11 text-base font-bold border-2 border-slate-500/50 text-gray-300 hover:bg-slate-800"
                    >
                      로그아웃
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setShowLogin(true)}
                      variant="outline"
                      className="flex-1 h-11 text-base font-bold border-2 border-green-500/50 text-green-300 hover:bg-green-900/30"
                    >
                      로그인
                    </Button>
                    <Button
                      onClick={() => setShowSignUp(true)}
                      variant="outline"
                      className="flex-1 h-11 text-base font-bold border-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/30"
                    >
                      회원가입
                    </Button>
                  </>
                )}
              </div>
            </div>

            {showStatistics && (
              <div className="mt-4">
                <StatisticsContent />
              </div>
            )}
            {showLeaderboard && (
              <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />
            )}
            {showSignUp && (
              <SignUpScreen
                onClose={() => setShowSignUp(false)}
                onSuccess={() => {
                  setShowSignUp(false);
                  setShowLogin(true);
                }}
              />
            )}
            {showLogin && (
              <LoginScreen onClose={() => setShowLogin(false)} />
            )}
            {showMyInfo && (
              <MyInfoScreen onClose={() => setShowMyInfo(false)} />
            )}
          </div>
        </div>
      )}

      {/* 난이도 선택 후 직업 선택 (난이도 선택했으면 항상 표시) */}
      {gameState.gameStatus === 'menu' && selectedDifficulty && (
        <ClassSelectionScreen onSelectClass={handleClassSelect} />
      )}

      {/* 웨이브 완료 알림 */}
      {gameState.showWaveComplete && (
        <WaveCompleteNotification
          wave={gameState.wave}
          experienceGained={gameState.lastExpGained}
        />
      )}

      {/* 레벨업 보상 선택 */}
      {gameState.showRewardScreen &&
        gameState.rewardOptions.length > 0 && (
          <RewardChoiceScreen
            wave={gameState.wave}
            options={gameState.rewardOptions}
            onSelect={handleRewardSelect}
            pendingLevelUps={gameState.pendingLevelUps}
            pendingBonusRewards={gameState.pendingBonusRewards}
          />
        )}

      {/* 실제 게임 화면 */}
      {gameState.gameStatus === 'playing' && (
        <div
          className={`flex flex-col md:flex-row items-center md:items-stretch gap-3 ${
            showInventory ||
            showUpgrade ||
            showEvolution ||
            showFusion ||
            showArtifacts
              ? 'md:flex-row'
              : ''
          }`}
        >
          {/* 왼쪽: 게임 캔버스 + 상단/하단 UI (반응형 스케일) */}
          <div
            ref={gameContainerRef}
            className="shrink-0 rounded-lg shadow-2xl border-4 border-slate-700 w-full max-w-[800px] aspect-[8/6] max-h-[80dvh] md:w-[800px] md:h-[600px] md:aspect-auto md:max-h-none flex items-center justify-center overflow-hidden"
            style={
              gameScale < 1
                ? { width: 800 * gameScale, height: 600 * gameScale }
                : undefined
            }
          >
            <div
              className="rounded-lg overflow-hidden bg-slate-900"
              style={{
                width: 800,
                height: 600,
                transform: gameScale < 1 ? `scale(${gameScale})` : undefined,
                transformOrigin: 'top left',
              }}
            >
              <div className="relative w-[800px] h-[600px] bg-slate-900 overflow-hidden">
            {/* 캔버스 */}
            <div className="absolute inset-0">
              <GameCanvas gameState={gameState} gameStateRef={gameState.gameStatus === 'playing' ? gameStateRef : undefined} />
            </div>

            {/* 상단 바 & 스킬 바 */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 상단 바 */}
              <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                <div className="flex items-center justify-between">
                  {/* 왼쪽: 레벨/체력 */}
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900/95 rounded-lg px-4 py-2.5 border border-yellow-500/50 shadow-lg">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-bold text-base">
                          레벨 {gameState.player.level}
                        </span>
                      </div>
                      <div className="w-32 h-2 bg-slate-800 rounded-full border border-yellow-600/50 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                          style={{ width: `${uiData.expPercent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-yellow-200/80 text-center mt-1">
                        {gameState.player.experience} /{' '}
                        {gameState.player.experienceToNextLevel} EXP
                      </div>
                    </div>

                    <div className="bg-slate-900/95 rounded-lg px-4 py-2.5 border border-red-500/50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-white font-bold text-base">
                          {Math.max(0, gameState.player.health)}/
                          {gameState.player.maxHealth}
                        </span>
                      </div>
                      <div className="w-20 h-2 bg-slate-800 rounded-full border border-red-600/50">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${uiData.playerHealthPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 중앙: 웨이브/점수 */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`bg-slate-900/95 rounded-lg px-4 py-2.5 border ${
                        gameState.wave >= 100
                          ? 'border-yellow-500/50 animate-pulse'
                          : 'border-purple-500/50'
                      }`}
                    >
                      <div className="text-center">
                        <div
                          className={`text-[10px] font-semibold mb-1 ${
                            gameState.wave >= 100
                              ? 'text-yellow-400'
                              : 'text-purple-400'
                          }`}
                        >
                          WAVE
                        </div>
                        <div
                          className={`font-bold text-base ${
                            gameState.wave >= 100
                              ? 'text-yellow-300'
                              : 'text-white'
                          }`}
                        >
                          {gameState.wave} / 100
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/95 rounded-lg px-4 py-2.5 border border-cyan-500/50">
                      <div className="text-center">
                        <div className="text-cyan-400 text-[10px] font-semibold mb-1 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          TIME
                        </div>
                        <div className="text-white font-bold text-base tabular-nums">
                          {Math.floor(playElapsedSeconds / 60)}:{(playElapsedSeconds % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/95 rounded-lg px-4 py-2.5 border border-yellow-500/50">
                      <div className="text-center">
                        <div className="text-yellow-400 text-[10px] font-semibold mb-1">
                          SCORE
                        </div>
                        <div className="text-white font-bold text-base">
                          {gameState.score}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 스탯 버튼 / 인벤토리 / 일시정지 / 리셋 */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowStats(prev => !prev)}
                      className={`bg-slate-900/95 rounded-lg px-3 py-2 border transition-all h-auto ${
                        showStats
                          ? 'border-yellow-400 bg-yellow-600/20'
                          : gameState.player.statPoints > 0
                          ? 'border-yellow-400 animate-pulse'
                          : 'border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Zap
                          className={`w-4 h-4 ${
                            gameState.player.statPoints > 0
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                          }`}
                        />
                        <span className="text-white font-bold text-sm">
                          스텟{' '}
                          {gameState.player.statPoints > 0 &&
                            `(${gameState.player.statPoints}P)`}
                        </span>
                      </div>
                    </Button>

                    {/* 스킬 선택 창 열기 버튼 */}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 px-2 bg-purple-700/80 hover:bg-purple-700 border border-purple-500/60 text-xs font-semibold"
                      onClick={() => setShowSkillSelect(true)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      스킬
                    </Button>

                    <Button
                      onClick={() => setShowInventory(true)}
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 bg-cyan-600/80 hover:bg-cyan-700 border border-cyan-500/50"
                      title="인벤토리 (I)"
                    >
                      <Package className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={togglePause}
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 bg-slate-700/80 hover:bg-slate-600 border border-slate-600/50"
                    >
                      {gameState.isPaused ? (
                        <Play className="w-4 h-4" />
                      ) : (
                        <Pause className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      onClick={resetGame}
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0 bg-red-600/80 hover:bg-red-700 border border-red-500/50"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 하단: 스킬/스탯 상세/키 바인딩 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
                <div className="flex flex-col items-center gap-2">
                  {/* 스탯 패널 */}
                  {showStats && (
                    <div className="w-full max-w-2xl pointer-events-auto z-50 mb-2">
                      <div className="bg-slate-900/95 rounded-lg p-3 border-2 border-yellow-400 shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-white font-bold flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            스텟
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                            onClick={() => setShowStats(false)}
                          >
                            ✕
                          </Button>
                        </div>

                        {gameState.player.statPoints > 0 && (
                          <div className="bg-yellow-600/20 rounded-lg px-3 py-2 border border-yellow-400 mb-3">
                            <div className="text-yellow-400 font-bold text-sm text-center">
                              ⚡ 사용 가능한 포인트:{' '}
                              {gameState.player.statPoints}P
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { name: '공격', key: 'strength' as const, icon: '⚔️' },
                            { name: '체력', key: 'vitality' as const, icon: '💚' },
                            { name: '민첩', key: 'agility' as const, icon: '⚡' },
                            { name: '방어', key: 'defense' as const, icon: '🛡️' },
                          ].map(stat => (
                            <div
                              key={stat.key}
                              className="flex items-center justify-between bg-slate-800/50 rounded px-2 py-1.5"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">{stat.icon}</span>
                                <span className="text-white text-xs">
                                  {stat.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-bold text-xs">
                                  {gameState.player.stats[stat.key]}
                                </span>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-5 w-5 p-0"
                                  onClick={() => upgradeStat(stat.key)}
                                  disabled={gameState.player.statPoints <= 0}
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {uiData.activeEffects.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-700">
                            <div className="text-[10px] text-gray-400 mb-1">
                              활성 효과
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {uiData.activeEffects.map((effect, i) => (
                                <div
                                  key={i}
                                  className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded"
                                >
                                  {effect}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 무기 · 스킬 · 아티팩트 요약 */}
                  <div className="w-full max-w-2xl pointer-events-auto z-40 mb-2">
                    <div className="bg-slate-900/95 rounded-lg p-2.5 border border-slate-600/50 shadow-lg">
                      <div className="flex items-stretch gap-4 flex-wrap">
                        {/* 무기 */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Sword className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-400 shrink-0">무기</span>
                          <div className="truncate text-white text-xs font-medium" title={gameState.player.weapon.name}>
                            {gameState.player.weapon.name}
                            {(gameState.player.weapon.upgradeLevel ?? 0) > 0 && (
                              <span className="text-yellow-400 ml-1">+{gameState.player.weapon.upgradeLevel}</span>
                            )}
                          </div>
                          <span className="text-gray-500 text-[10px] shrink-0">
                            {gameState.player.weapon.damage} 공격
                          </span>
                        </div>
                        {/* 스킬 */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] text-gray-400 shrink-0">✨ 스킬</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {[0, 1, 2].map((i) => {
                              const s = gameState.player.equippedSkills[i];
                              return (
                                <span
                                  key={i}
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    s ? 'bg-purple-700/50 text-purple-200' : 'bg-slate-700/50 text-gray-500'
                                  }`}
                                  title={s?.description}
                                >
                                  {s ? s.name.split(' ')[0] : `빈${i + 1}`}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        {/* 아티팩트 */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] text-gray-400 shrink-0">💎 아티팩트</span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => {
                              const a = gameState.player.equippedArtifacts[i];
                              return (
                                <span
                                  key={i}
                                  className="w-7 h-7 rounded border border-slate-600 bg-slate-800/80 flex items-center justify-center text-sm"
                                  title={a ? `${a.name}\n${a.description}` : `빈 슬롯 ${i + 1}`}
                                >
                                  {a ? a.icon : '－'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 키 바인딩 */}
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="bg-slate-900/95 rounded-lg p-2.5 border border-slate-600/50 w-16 h-16 flex flex-col items-center justify-center shadow-lg">
                      <div className="text-white text-sm font-bold mb-0.5">
                        J
                      </div>
                      <div className="text-gray-400 text-[10px]">기본</div>
                    </div>

                    {[0, 1, 2].map(slotIndex => {
                      const skill =
                        gameState.player.equippedSkills[slotIndex];
                      const cooldownPercent = skill
                        ? ((skill.cooldown - skill.currentCooldown) /
                            skill.cooldown) *
                          100
                        : 0;

                      return (
                        <div
                          key={slotIndex}
                          className={`relative bg-slate-900/95 rounded-lg p-2.5 border w-16 h-16 flex flex-col items-center justify-center shadow-lg ${
                            skill
                              ? 'border-purple-500/50'
                              : 'border-slate-600/50'
                          }`}
                        >
                          <div className="text-white text-sm font-bold mb-0.5">
                            {slotIndex + 1}
                          </div>
                          {skill ? (
                            <>
                              <div className="text-[10px] truncate w-full text-center text-purple-300">
                                {skill.name.split(' ')[0]}
                              </div>
                              {skill.currentCooldown > 0 && (
                                <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {Math.ceil(
                                      skill.currentCooldown / 60,
                                    )}
                                  </span>
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700 rounded-b">
                                <div
                                  className="h-full bg-purple-500 rounded-b transition-all"
                                  style={{
                                    width: `${cooldownPercent}%`,
                                  }}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-500 text-[10px]">
                              빈슬롯
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="relative bg-slate-900/95 rounded-lg p-2.5 border border-green-500/50 w-16 h-16 flex flex-col items-center justify-center shadow-lg">
                      <div className="text-white text-sm font-bold mb-0.5">
                        Shift
                      </div>
                      <div className="text-gray-400 text-[10px]">회피</div>
                      {gameState.player.dodgeCooldown > 0 && (
                        <div className="absolute inset-0 bg-black/70 rounded-lg" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700 rounded-b">
                        <div
                          className="h-full bg-green-500 rounded-b transition-all"
                          style={{
                            width: `${uiData.dodgeCooldownPercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 조작법 안내 텍스트 */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <div className="bg-black/60 rounded px-3 py-1 text-[10px] text-gray-400">
                A/D: 이동 | Space/W: 점프 | Shift: 회피 | J: 공격 | 1/2/3: 스킬 | ESC:
                일시정지 | I: 인벤토리 | U: 아티펙트
              </div>
            </div>

            {/* 모바일 터치 컨트롤 (md 이하에서만 표시) */}
            {!gameState.isPaused && (
              <MobileControls
                setMovementKeys={setMovementKeys}
                movementOnLeft={mobileSettings.movementOnLeft ?? true}
                buttonScale={mobileSettings.buttonScale ?? 1}
                onLayoutChange={handleMobileSettingsChange}
              />
            )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 인벤토리 / 강화 / 진화 / 합성 / 아티팩트 패널 */}
          {(showInventory ||
            showUpgrade ||
            showEvolution ||
            showFusion ||
            showArtifacts) && (
            <div className="w-[380px] h-[600px] shrink-0 rounded-lg border-4 border-slate-600 bg-slate-900/95 shadow-xl overflow-hidden flex flex-col">
              {showInventory && (
                <InventoryScreen
                  embedded
                  player={gameState.player}
                  onClose={() => setShowInventory(false)}
                  onEquipWeapon={equipWeaponFromInventory}
                  onOpenUpgrade={() => {
                    setShowInventory(false);
                    setShowUpgrade(true);
                  }}
                  onOpenEvolution={() => {
                    setShowInventory(false);
                    setShowEvolution(true);
                  }}
                  onOpenFusion={() => {
                    setShowInventory(false);
                    setShowFusion(true);
                  }}
                  onOpenArtifacts={() => {
                    setShowInventory(false);
                    setShowArtifacts(true);
                  }}
                />
              )}
              {showUpgrade && (
                <UpgradePage
                  embedded
                  player={gameState.player}
                  onClose={() => setShowUpgrade(false)}
                  onUpgradeWeapon={upgradeWeaponWithPoints}
                />
              )}
              {showEvolution && (
                <EvolutionPage
                  embedded
                  player={gameState.player}
                  onClose={() => setShowEvolution(false)}
                  onEvolveWeapon={evolveWeaponInInventory}
                />
              )}
              {showFusion && (
                <FusionPage
                  embedded
                  player={gameState.player}
                  onClose={() => setShowFusion(false)}
                  onFuseWeapons={fuseWeaponsInInventory}
                />
              )}
              {showArtifacts && (
                <ArtifactScreen
                  embedded
                  player={gameState.player}
                  onClose={() => setShowArtifacts(false)}
                  onEquipArtifact={equipArtifact}
                  onUnequipArtifact={unequipArtifact}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* 일시 정지 화면 - HUD 위에 완전히 덮이도록 z-[100] 사용 */}
      {gameState.isPaused && gameState.gameStatus === 'playing' && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="bg-slate-900/95 rounded-lg p-8 border-4 border-blue-600 text-center shadow-2xl min-w-[320px] max-w-[90vw] flex flex-col items-stretch gap-6">
            <div className="text-6xl shrink-0">⏸️</div>
            <h2 className="text-4xl text-blue-400 font-bold shrink-0 leading-tight">
              일시 정지
            </h2>
            <div className="text-gray-300 flex flex-col gap-2 shrink-0">
              <p className="block">게임이 일시 정지되었습니다</p>
              <p className="text-sm text-gray-400 block whitespace-normal">
                ESC 키를 눌러 계속하기 | I 키로 인벤토리 열기
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Button
                onClick={() => {
                  togglePause();
                  setShowInventory(true);
                }}
                size="lg"
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                <Package className="w-5 h-5 mr-2 shrink-0" />
                <span>인벤토리 열기 (I)</span>
              </Button>
              <Button
                onClick={togglePause}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-5 h-5 mr-2 shrink-0" />
                <span>계속하기</span>
              </Button>
              <Button
                onClick={restartGame}
                size="lg"
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="w-5 h-5 mr-2 shrink-0" />
                <span>재시작</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 승리 화면 */}
      {gameState.gameStatus === 'victory' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-yellow-900 rounded-2xl p-8 border-4 border-yellow-500 shadow-2xl max-w-md w-full">
            <div className="text-8xl mb-4 text-center animate-bounce">🎉</div>
            <div className="text-5xl text-yellow-400 font-bold mb-2 text-center drop-shadow-lg animate-pulse">
              게임 클리어!
            </div>
            <div className="bg-yellow-950/50 border-2 border-yellow-600 rounded-lg p-4 mb-6">
              <div className="text-yellow-300 font-bold text-center mb-2">
                🏆 축하합니다! 🏆
              </div>
              <div className="text-gray-200 text-sm text-center mb-2">
                웨이브 100을 모두 클리어했습니다!
              </div>
              <div className="text-center">
                <span
                  className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                    gameState.difficulty === 'hard'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {gameState.difficulty === 'hard'
                    ? '🔥 하드 모드'
                    : '🛡️ 노말 모드'}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6 space-y-3">
              <div className="text-center text-yellow-400 text-sm mb-3 font-bold">
                🎮 클리어 기록
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded p-2 border border-yellow-600/30">
                  <div className="text-yellow-400 text-xs mb-1">웨이브</div>
                  <div className="text-white font-bold text-xl">
                    {gameState.wave}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded p-2 border border-yellow-600/30">
                  <div className="text-yellow-400 text-xs mb-1">점수</div>
                  <div className="text-white font-bold text-xl">
                    {gameState.score}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded p-2 border border-purple-600/30">
                  <div className="text-purple-400 text-xs mb-1">최종 레벨</div>
                  <div className="text-white font-bold text-xl">
                    {gameState.player.level}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded p-2 border border-blue-600/30">
                  <div className="text-blue-400 text-xs mb-1">획득 스킬</div>
                  <div className="text-white font-bold text-xl">
                    {gameState.player.availableSkills.length}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-600/50 to-orange-600/50 rounded p-4 border-2 border-yellow-500 mt-3">
                <div className="text-yellow-200 text-xs mb-1 text-center">
                  👑 최종 점수
                </div>
                <div className="text-yellow-100 font-bold text-3xl text-center">
                  {highScore}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={restartGame}
                size="lg"
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-lg font-bold py-6"
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                메인 메뉴로
              </Button>

              <div className="text-center text-yellow-200 text-xs">
                다른 난이도를 선택하거나 다시 도전해보세요!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 패배 화면 */}
      {gameState.gameStatus === 'defeat' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="bg-gradient-to-br from-slate-900 to-red-950 rounded-2xl p-8 border-4 border-red-600 shadow-2xl max-w-md w-full">
            <div className="text-8xl mb-4 text-center animate-pulse">💀</div>
            <div className="text-5xl text-red-400 font-bold mb-2 text-center drop-shadow-lg">
              패배!
            </div>

            <div className="bg-red-950/50 border-2 border-red-700 rounded-lg p-4 mb-6">
              <div className="text-center mb-2">
                <span
                  className={`inline-block px-3 py-1 rounded text-xs font-bold mb-2 ${
                    gameState.difficulty === 'hard'
                      ? 'bg-red-700 text-white'
                      : 'bg-blue-700 text-white'
                  }`}
                >
                  {gameState.difficulty === 'hard'
                    ? '🔥 하드 모드'
                    : '🛡️ 노말 모드'}
                </span>
              </div>
              <div className="text-red-300 font-bold text-center mb-2">
                ⚠️ 모든 진행 상황이 초기화됩니다 ⚠️
              </div>
              <div className="text-gray-300 text-sm text-center">
                레벨, 스텟, 스킬, 무기가 처음부터 다시 시작됩니다
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6 space-y-3">
              <div className="text-center text-gray-400 text-sm mb-3">
                최종 기록
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded p-2">
                  <div className="text-yellow-400 text-xs mb-1">웨이브</div>
                  <div className="text-white font-bold text-xl">
                    {gameState.wave}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded p-2">
                  <div className="text-yellow-400 text-xs mb-1">점수</div>
                  <div className="text-white font-bold text-xl">
                    {gameState.score}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded p-2">
                  <div className="text-purple-400 text-xs mb-1">레벨</div>
                  <div className="text-white font-bold text-xl">
                    {gameState.player.level}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded p-2">
                  <div className="text-blue-400 text-xs mb-1">스킬 수</div>
                  <div className="text-white font-bold text-xl">
                    {gameState.player.availableSkills.length}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 rounded p-3 border border-yellow-600/50 mt-3">
                <div className="text-yellow-400 text-xs mb-1 text-center">
                  🏆 최고 점수
                </div>
                <div className="text-yellow-300 font-bold text-2xl text-center">
                  {highScore}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={restartGame}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg font-bold py-6"
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                메인 메뉴로
              </Button>

              <div className="text-center text-gray-400 text-xs">
                난이도를 다시 선택하여 새로운 도전을 시작하세요
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 스킬 선택 모달 */}
      <SkillSelectModal
        open={showSkillSelect}
        onClose={() => setShowSkillSelect(false)}
        player={gameState.player}
        onEquipSkill={equipSkill}
      />
    </div>
  );
}

export default App;