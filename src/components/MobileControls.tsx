import { useCallback, useRef } from 'react';
import type { MobileSettings } from '../lib/supabase';
import { ChevronLeft, ChevronRight, ArrowUp, Swords, Sparkles, Shield } from 'lucide-react';

const MOBILE_BUTTON_BASE = 48;
const MOVEMENT_ON_LEFT_DEFAULT = true;

interface MobileControlsProps {
  setMovementKeys: (left: boolean, right: boolean) => void;
  movementOnLeft?: boolean;
  buttonScale?: number;
  onLayoutChange?: (settings: MobileSettings) => void;
}

/** 키보드 이벤트 시뮬레이션 (점프/공격/회피/스킬) */
function dispatchKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

export function MobileControls({
  setMovementKeys,
  movementOnLeft = MOVEMENT_ON_LEFT_DEFAULT,
  buttonScale = 1,
  onLayoutChange,
}: MobileControlsProps) {
  const pointerIds = useRef<{ left?: number; right?: number }>({});

  const scale = Math.max(0.8, Math.min(1.5, buttonScale));
  const size = Math.round(MOBILE_BUTTON_BASE * scale);

  const handlePointerDownLeft = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      pointerIds.current.left = e.pointerId;
      setMovementKeys(true, false);
    },
    [setMovementKeys]
  );
  const handlePointerDownRight = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      pointerIds.current.right = e.pointerId;
      setMovementKeys(false, true);
    },
    [setMovementKeys]
  );
  const handlePointerUpLeft = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIds.current.left !== e.pointerId) return;
      pointerIds.current.left = undefined;
      setMovementKeys(false, false);
    },
    [setMovementKeys]
  );
  const handlePointerUpRight = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIds.current.right !== e.pointerId) return;
      pointerIds.current.right = undefined;
      setMovementKeys(false, false);
    },
    [setMovementKeys]
  );

  const handleJump = useCallback(() => dispatchKey('w'), []);
  const handleAttack = useCallback(() => dispatchKey('j'), []);
  const handleDodge = useCallback(() => dispatchKey('Shift'), []);
  const handleSkill = useCallback((index: 0 | 1 | 2) => () => dispatchKey(String(index + 1)), []);

  const toggleLayout = useCallback(() => {
    const next: MobileSettings = { movementOnLeft: !movementOnLeft };
    onLayoutChange?.(next);
  }, [movementOnLeft, onLayoutChange]);

  const movement = (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="왼쪽 이동"
          className="touch-none select-none rounded-2xl bg-slate-700/90 active:bg-sky-600/90 border-2 border-slate-500/60 flex items-center justify-center text-white shadow-lg"
          style={{ width: size, height: size }}
          onPointerDown={handlePointerDownLeft}
          onPointerUp={handlePointerUpLeft}
          onPointerLeave={handlePointerUpLeft}
          onPointerCancel={handlePointerUpLeft}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <button
          type="button"
          aria-label="점프"
          className="touch-none select-none rounded-2xl bg-emerald-600/90 active:bg-emerald-500 border-2 border-emerald-500/60 flex items-center justify-center text-white shadow-lg"
          style={{ width: size, height: size }}
          onPointerDown={(e) => {
            e.preventDefault();
            handleJump();
          }}
        >
          <ArrowUp className="w-7 h-7" />
        </button>
        <button
          type="button"
          aria-label="오른쪽 이동"
          className="touch-none select-none rounded-2xl bg-slate-700/90 active:bg-sky-600/90 border-2 border-slate-500/60 flex items-center justify-center text-white shadow-lg"
          style={{ width: size, height: size }}
          onPointerDown={handlePointerDownRight}
          onPointerUp={handlePointerUpRight}
          onPointerLeave={handlePointerUpRight}
          onPointerCancel={handlePointerUpRight}
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>
    </div>
  );

  const actions = (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label="공격"
        className="touch-none select-none rounded-2xl bg-rose-600/90 active:bg-rose-500 border-2 border-rose-500/60 flex items-center justify-center text-white shadow-lg"
        style={{ width: size, height: size }}
        onPointerDown={(e) => {
          e.preventDefault();
          handleAttack();
        }}
      >
        <Swords className="w-6 h-6" />
      </button>
      <button
        type="button"
        aria-label="회피"
        className="touch-none select-none rounded-xl bg-amber-600/90 active:bg-amber-500 border-2 border-amber-500/60 flex items-center justify-center text-white shadow-lg"
        style={{ width: size, height: size * 0.8 }}
        onPointerDown={(e) => {
          e.preventDefault();
          handleDodge();
        }}
      >
        <Shield className="w-5 h-5" />
      </button>
      <div className="flex gap-2">
        {([0, 1, 2] as const).map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`스킬 ${i + 1}`}
            className="touch-none select-none rounded-xl bg-violet-600/90 active:bg-violet-500 border-2 border-violet-500/60 flex items-center justify-center text-white shadow-lg text-xs font-bold"
            style={{ width: size * 0.9, height: size * 0.9 }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleSkill(i)();
            }}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mobile-controls pointer-events-auto absolute inset-0 flex items-end justify-between px-3 sm:px-4 pb-4 sm:pb-6 pt-16 gap-3 sm:gap-4 md:hidden">
      <div className="flex flex-col items-start gap-2">
        {movementOnLeft ? movement : actions}
      </div>
      <div className="flex flex-col items-end gap-2">
        {movementOnLeft ? actions : movement}
      </div>
      <button
        type="button"
        aria-label="좌우 레이아웃 전환"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-500 hover:text-slate-400 text-[10px] py-0.5"
        onClick={toggleLayout}
      >
        {movementOnLeft ? '← 이동' : '이동 →'}
      </button>
    </div>
  );
}
