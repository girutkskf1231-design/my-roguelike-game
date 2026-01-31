/**
 * 프레임 안정화 유틸 (최적화·프레임 드랍 안정화)
 * - 고정 타임스텝: 게임 로직을 일정 주기(기본 60 tick/s)로 실행해 기기/탭 FPS와 무관하게 동작 일관성 유지
 * - 스텝 상한: 한 프레임에 실행할 최대 틱 수 제한으로 "spiral of death" 방지
 * - 탭 비가시 시 루프 일시정지 (CPU 절약)
 * - 프레임 드랍 감지 및 적응형 스텝 조절
 */

const DEFAULT_TICKS_PER_SECOND = 60;
const DEFAULT_MAX_STEPS_PER_FRAME = 5;
const LOW_FPS_THRESHOLD = 30;
const CRITICAL_FPS_THRESHOLD = 20;

export interface FrameStabilizerOptions {
  /** 초당 로직 틱 수 (기본 60) */
  ticksPerSecond?: number;
  /** 한 프레임에 실행할 최대 틱 수 (기본 5) */
  maxStepsPerFrame?: number;
}

export interface FrameStabilizerResult {
  /** 이번 프레임에 실행할 로직 틱 수 */
  steps: number;
  /** 다음 프레임을 위해 남겨둔 누적 시간(초) */
  accumulated: number;
}

/**
 * 고정 타임스텝에 따라 이번 프레임에 실행할 로직 스텝 수를 계산하고,
 * 누적 시간을 갱신한다.
 *
 * @param deltaSec - 이번 프레임까지 경과한 시간(초)
 * @param accumulatedRef - 누적 시간(초)을 담는 ref. 이 함수가 갱신함
 * @param options - ticksPerSecond, maxStepsPerFrame
 * @returns steps, newAccumulated
 */
export function getLogicSteps(
  deltaSec: number,
  accumulatedRef: { current: number },
  options: FrameStabilizerOptions = {}
): FrameStabilizerResult {
  const ticksPerSecond = options.ticksPerSecond ?? DEFAULT_TICKS_PER_SECOND;
  const maxStepsPerFrame = options.maxStepsPerFrame ?? DEFAULT_MAX_STEPS_PER_FRAME;
  const fixedStep = 1 / ticksPerSecond;

  let acc = accumulatedRef.current + deltaSec;
  const steps = Math.min(maxStepsPerFrame, Math.floor(acc / fixedStep));
  acc -= steps * fixedStep;
  // 드리프트 방지: 누적값이 한 스텝보다 크게 쌓이지 않도록 상한
  const maxAccumulated = fixedStep * 2;
  if (acc > maxAccumulated) acc = maxAccumulated;
  accumulatedRef.current = acc;

  return { steps, accumulated: acc };
}

/**
 * FPS 측정용: 최근 N프레임의 평균 FPS 계산
 */
const FPS_SAMPLE_COUNT = 30;

export function createFpsCounter() {
  const times: number[] = [];
  let lastTime = 0;

  return {
    tick(): number | null {
      const now = performance.now();
      if (lastTime > 0) {
        times.push(1000 / (now - lastTime));
        if (times.length > FPS_SAMPLE_COUNT) times.shift();
      }
      lastTime = now;
      return times.length >= 5 ? times.reduce((a, b) => a + b, 0) / times.length : null;
    },
    getFps(): number | null {
      if (times.length < 5) return null;
      return times.reduce((a, b) => a + b, 0) / times.length;
    },
    reset() {
      times.length = 0;
      lastTime = 0;
    },
  };
}

/** 탭이 보이는지 (탭 전환 시 게임 루프 일시정지용) */
export function isTabVisible(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'visible';
}

/** FPS에 따른 적응형 maxSteps (프레임 드랍 시 부하 완화) */
export function getAdaptiveMaxSteps(baseMax: number, fps: number | null): number {
  if (fps == null || fps >= 50) return baseMax;
  if (fps < CRITICAL_FPS_THRESHOLD) return Math.max(1, Math.floor(baseMax * 0.4));
  if (fps < LOW_FPS_THRESHOLD) return Math.max(2, Math.floor(baseMax * 0.6));
  return Math.max(2, Math.floor(baseMax * 0.8));
}

/** 프레임 드랍 심각도 (0=정상, 1=낮음, 2=심각) */
export function getFrameDropSeverity(fps: number | null): 0 | 1 | 2 {
  if (fps == null || fps >= LOW_FPS_THRESHOLD) return 0;
  if (fps >= CRITICAL_FPS_THRESHOLD) return 1;
  return 2;
}
