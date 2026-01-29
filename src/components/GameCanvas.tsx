import { useEffect, useRef, memo } from 'react';
import type { GameState } from '../types/game';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/gameLogic';

interface GameCanvasProps {
  gameState: GameState;
  /** 제공 시 캔버스는 RAF로 매 프레임 그리기(플레임 상승). 미제공 시 gameState 변경 시에만 그리기. */
  gameStateRef?: React.MutableRefObject<GameState | null>;
}

const GameCanvasComponent = ({ gameState, gameStateRef }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const draw = (state: GameState) => {
    // 배경 그리기 (그라데이션)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(0.5, '#1e1b4b');
    bgGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 별 효과
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 123) % CANVAS_WIDTH;
      const y = (i * 456) % (CANVAS_HEIGHT / 2);
      const size = (i % 3) + 1;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.15;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // 플랫폼 그리기 (돌 질감)
    state.platforms.forEach((platform) => {
      // 플랫폼 그림자
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(platform.x + 3, platform.y + 3, platform.width, platform.height);
      
      // 벽과 일반 플랫폼 색상 구분
      if (platform.isWall) {
        // 벽 (진한 회색, 빨간 테두리)
        const wallGradient = ctx.createLinearGradient(
          platform.x,
          platform.y,
          platform.x,
          platform.y + platform.height
        );
        wallGradient.addColorStop(0, '#52525b');
        wallGradient.addColorStop(1, '#27272a');
        ctx.fillStyle = wallGradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // 벽 균열 패턴 (더 많이)
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1;
        for (let i = 0; i < platform.width / 15; i++) {
          ctx.beginPath();
          ctx.moveTo(platform.x + i * 15 + 5, platform.y);
          ctx.lineTo(platform.x + i * 15 + 8, platform.y + platform.height);
          ctx.stroke();
        }
        
        // 벽 테두리 (빨간색 강조)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
      } else {
        // 일반 플랫폼 (기존 디자인)
        const gradient = ctx.createLinearGradient(
          platform.x,
          platform.y,
          platform.x,
          platform.y + platform.height
        );
        gradient.addColorStop(0, '#4a5568');
        gradient.addColorStop(1, '#2d3748');
        ctx.fillStyle = gradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // 돌 질감 (균열)
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i < platform.width / 30; i++) {
          ctx.beginPath();
          ctx.moveTo(platform.x + i * 30 + 10, platform.y);
          ctx.lineTo(platform.x + i * 30 + 15, platform.y + platform.height);
          ctx.stroke();
        }
        
        // 플랫폼 하이라이트
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(platform.x, platform.y);
        ctx.lineTo(platform.x + platform.width, platform.y);
        ctx.stroke();
        
        // 플랫폼 테두리
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      }
    });

    // 플레이어 그리기 (직업별 스타일)
    const player = state.player;
    const px = player.position.x;
    const py = player.position.y;
    
    // 직업별 색상 정의
    const classColors = {
      warrior: {
        primary: '#3b82f6',    // 파란색 (갑옷)
        secondary: '#1e40af',  // 진한 파란색 (디테일)
        accent: '#60a5fa',     // 밝은 파란색 (팔)
        head: '#1e3a8a',       // 투구
        legs: '#2563eb',       // 다리
        eye: '#60a5fa',        // 눈
        decoration: '#fbbf24', // 금색 장식
      },
      archer: {
        primary: '#059669',    // 녹색 (옷)
        secondary: '#047857',  // 진한 녹색 (디테일)
        accent: '#10b981',     // 밝은 녹색 (팔)
        head: '#92400e',       // 갈색 (모자)
        legs: '#78716c',       // 회갈색 (다리)
        eye: '#34d399',        // 녹색 눈
        decoration: '#a3e635', // 연두색 장식
      },
      mage: {
        primary: '#7c3aed',    // 보라색 (로브)
        secondary: '#5b21b6',  // 진한 보라색 (디테일)
        accent: '#a78bfa',     // 밝은 보라색 (팔)
        head: '#4c1d95',       // 보라색 (모자)
        legs: '#6d28d9',       // 보라색 (다리)
        eye: '#c084fc',        // 연보라색 눈
        decoration: '#fde047', // 황금색 장식 (마법)
      },
      assassin: {
        primary: '#1f2937',    // 검은색 (옷)
        secondary: '#111827',  // 더 진한 검은색 (디테일)
        accent: '#374151',     // 회색 (팔)
        head: '#0f172a',       // 검은색 (두건)
        legs: '#1e293b',       // 검은색 (다리)
        eye: '#dc2626',        // 빨간색 눈
        decoration: '#ef4444', // 빨간색 장식
      },
    };
    
    // 직업/무기 조합에 따른 색상 (엑스칼리버 = 성기사 폼)
    const isExcaliburPaladin =
      player.class === 'warrior' && player.weapon?.id === 'excalibur';

    let colors = classColors[player.class];

    if (isExcaliburPaladin) {
      // 성기사 전용 팔레트 (금색 + 흰색 + 붉은 포인트)
      colors = {
        ...colors,
        primary: '#facc15',      // 황금 갑옷
        secondary: '#eab308',    // 진한 금색 디테일
        accent: '#fee2e2',       // 약간 붉은 톤의 팔/장식
        head: '#fbbf24',         // 금색 투구
        legs: '#e5e7eb',         // 은색/흰색 다리 갑옷
        eye: '#fef9c3',          // 밝은 빛나는 눈
        decoration: '#dc2626',   // 붉은 망토/문장
      };
    }
    
    // 회피 중일 때 잔상 효과
    if (player.isDodging) {
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.1 * (3 - i);
        const offset = i * 5 * (player.facingRight ? -1 : 1);
        
        // 잔상 몸통
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + offset, py + 8, player.width, 22);
        ctx.fillRect(px + offset + 5, py, 20, 35);
      }
    }
    
    ctx.globalAlpha = player.isDodging ? 0.4 : 1;

    // 성기사 전용 망토 (몸 뒤에 먼저 그림)
    if (isExcaliburPaladin) {
      const capeX = px + 4;
      const capeY = py + 10;
      const capeWidth = player.width - 2;
      const capeHeight = 26;

      ctx.fillStyle = 'rgba(127, 29, 29, 0.95)'; // 짙은 붉은색 망토
      ctx.fillRect(capeX, capeY, capeWidth, capeHeight);

      // 망토 하단 금색 테두리
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(capeX, capeY + capeHeight - 2, capeWidth, 2);
    }
    
    // 다리
    ctx.fillStyle = player.isDodging ? '#34d399' : colors.legs;
    ctx.fillRect(px + 8, py + 30, 6, 10);
    ctx.fillRect(px + 16, py + 30, 6, 10);
    
    // 몸통 (갑옷/옷)
    const bodyColor = player.isDodging ? '#10b981' : colors.primary;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(px + 5, py + 10, 20, 22);
    
    // 디테일 (어깨/장식)
    ctx.fillStyle = player.isDodging ? '#059669' : colors.secondary;
    if (player.class === 'warrior') {
      // 전사: 갑옷 어깨
      ctx.fillRect(px + 2, py + 10, 8, 8);
      ctx.fillRect(px + 20, py + 10, 8, 8);

      if (isExcaliburPaladin) {
        // 성기사: 가슴 중앙 붉은 문장과 금색 테두리
        ctx.fillStyle = colors.decoration;
        ctx.fillRect(px + 13, py + 14, 4, 12);
        ctx.fillRect(px + 11, py + 18, 8, 2);

        ctx.strokeStyle = '#fef9c3';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 8, py + 12, 14, 18);
      }
    } else if (player.class === 'mage') {
      // 마법사: 로브 장식
      ctx.fillRect(px + 8, py + 12, 14, 3);
      // 마법 무늬
      ctx.fillStyle = colors.decoration;
      ctx.fillRect(px + 10, py + 18, 2, 2);
      ctx.fillRect(px + 18, py + 18, 2, 2);
      ctx.fillRect(px + 14, py + 22, 2, 2);
    } else if (player.class === 'archer') {
      // 궁수: 가죽 어깨 패드
      ctx.fillRect(px + 3, py + 10, 6, 6);
      ctx.fillRect(px + 21, py + 10, 6, 6);
    } else if (player.class === 'assassin') {
      // 암살자: 날카로운 어깨
      ctx.fillRect(px + 1, py + 10, 5, 5);
      ctx.fillRect(px + 24, py + 10, 5, 5);
    }
    
    // 팔
    ctx.fillStyle = player.isDodging ? '#34d399' : colors.accent;
    if (player.isAttacking) {
      // 공격 중 팔 위치
      const armX = player.facingRight ? px + 22 : px + 2;
      ctx.fillRect(armX, py + 18, 10, 5);
    } else {
      ctx.fillRect(px + 2, py + 18, 5, 12);
      ctx.fillRect(px + 23, py + 18, 5, 12);
    }
    
    // 머리 (투구/모자/두건)
    ctx.fillStyle = player.isDodging ? '#10b981' : colors.head;
    ctx.fillRect(px + 7, py, 16, 12);
    
    // 직업별 머리 장식
    if (player.class === 'warrior') {
      // 전사: 투구 장식
      ctx.fillStyle = colors.decoration;
      ctx.fillRect(px + 13, py - 3, 4, 5);

      if (isExcaliburPaladin) {
        // 성기사: 투구 윗부분에 더 큰 장식
        ctx.fillRect(px + 12, py - 6, 6, 3);
        ctx.fillRect(px + 11, py - 8, 2, 3);
        ctx.fillRect(px + 17, py - 8, 2, 3);
      }
    } else if (player.class === 'mage') {
      // 마법사: 뾰족한 모자
      ctx.fillStyle = colors.head;
      ctx.fillRect(px + 10, py - 4, 10, 5);
      ctx.fillRect(px + 12, py - 8, 6, 5);
      ctx.fillStyle = colors.decoration;
      ctx.fillRect(px + 13, py - 6, 4, 2);
    } else if (player.class === 'archer') {
      // 궁수: 깃털
      ctx.fillStyle = colors.decoration;
      ctx.fillRect(px + 20, py - 2, 3, 8);
    } else if (player.class === 'assassin') {
      // 암살자: 두건 끝
      ctx.fillStyle = colors.decoration;
      ctx.fillRect(px + 20, py + 2, 4, 3);
    }
    
    // 얼굴
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(px + 10, py + 4, 10, 6);
    
    // 눈 (빛나는)
    ctx.fillStyle = player.isDodging ? '#34d399' : colors.eye;
    const eyeX1 = player.facingRight ? px + 16 : px + 11;
    ctx.fillRect(eyeX1, py + 6, 2, 2);
    
    // 직업별 추가 장비
    if (player.class === 'warrior') {
      // 전사: 방패
      const shieldX = player.facingRight ? px - 2 : px + 28;

      if (isExcaliburPaladin) {
        // 성기사 전용 대형 성기사 방패 (금색 + 붉은 문장)
        const width = 10;
        const height = 18;
        const baseY = py + 10;

        // 방패 바탕
        const grad = ctx.createLinearGradient(
          shieldX,
          baseY,
          shieldX,
          baseY + height
        );
        grad.addColorStop(0, '#facc15');
        grad.addColorStop(1, '#eab308');
        ctx.fillStyle = grad;
        ctx.fillRect(shieldX, baseY, width, height);

        // 붉은 방패 중앙 문장
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(shieldX + 3, baseY + 3, width - 6, height - 6);

        // 십자가 형태의 금색 문양
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(shieldX + 4, baseY + 6, 2, height - 10);
        ctx.fillRect(shieldX + 2, baseY + 10, width - 4, 2);

        // 날개 장식 (측면)
        ctx.fillStyle = '#e5e7eb';
        if (player.facingRight) {
          ctx.fillRect(shieldX - 3, baseY + 4, 3, 8);
        } else {
          ctx.fillRect(shieldX + width, baseY + 4, 3, 8);
        }

        // 외곽선
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(shieldX, baseY, width, height);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.fillRect(shieldX, py + 15, 6, 12);
        ctx.strokeRect(shieldX, py + 15, 6, 12);
      }
    } else if (player.class === 'archer') {
      // 궁수: 화살통
      ctx.fillStyle = '#92400e';
      const quiverX = player.facingRight ? px + 26 : px - 2;
      ctx.fillRect(quiverX, py + 12, 4, 14);
      // 화살
      ctx.fillStyle = '#d97706';
      ctx.fillRect(quiverX + 1, py + 10, 2, 4);
    } else if (player.class === 'mage') {
      // 마법사: 떠다니는 마법 구슬
      const orbX = player.facingRight ? px + 28 : px - 4;
      const orbY = py + 8 + Math.sin(Date.now() / 200) * 2;
      ctx.fillStyle = colors.decoration;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(orbX, orbY, 4, 4);
      ctx.globalAlpha = 1;
    } else if (player.class === 'assassin') {
      // 암살자: 허리에 단검
      ctx.fillStyle = '#6b7280';
      const daggerX = player.facingRight ? px + 22 : px + 2;
      ctx.fillRect(daggerX, py + 20, 6, 2);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(daggerX + 4, py + 18, 2, 3);
    }
    
    // 무기 그리기 (장착한 무기 타입에 따라)
    const weapon = player.weapon;
    const weaponX = player.facingRight ? px + player.width + 2 : px - 22;
    const weaponY = py + player.height / 2;
    
    if (weapon.type === 'melee') {
      // 근접 무기 (이름에 맞는 생김새)
      if (player.isAttacking) {
        ctx.globalAlpha = 1;
        const dir = player.facingRight ? 1 : -1;

        if (weapon.id === 'sword') {
          // 기사의 검 - 밝은 금빛 직검
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(weaponX, weaponY - 2, 20 * dir, 4);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(weaponX + 2 * dir, weaponY - 1, 16 * dir, 2);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(weaponX - (dir > 0 ? 5 : -20), weaponY - 3, 5, 6);
        } else if (weapon.id === 'dual_sword') {
          // 쌍검 - 두 자루 나란히
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(weaponX, weaponY - 6, 18 * dir, 3);
          ctx.fillRect(weaponX, weaponY + 3, 18 * dir, 3);
          ctx.fillStyle = '#78350f';
          const handleX = player.facingRight ? weaponX - 4 : weaponX + 4;
          ctx.fillRect(handleX, weaponY - 7, 4, 5);
          ctx.fillRect(handleX, weaponY + 2, 4, 5);
        } else if (weapon.id === 'greatsword' || weapon.id === 'titan_greatsword') {
          // 대검 / 타이탄 대검 - 넓고 긴 검날
          const bladeLen = weapon.id === 'titan_greatsword' ? 32 : 26;
          const bladeW = weapon.id === 'titan_greatsword' ? 6 : 5;
          if (weapon.id === 'titan_greatsword') {
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#eab308';
          }
          ctx.fillStyle = weapon.id === 'titan_greatsword' ? '#94a3b8' : '#e5e7eb';
          ctx.fillRect(weaponX, weaponY - bladeW / 2, bladeLen * dir, bladeW);
          ctx.fillStyle = '#475569';
          ctx.fillRect(weaponX - (dir > 0 ? 6 : -bladeLen - 6), weaponY - 2, 6, 4);
          ctx.shadowBlur = 0;
        } else if (weapon.id === 'axe' || weapon.id === 'dragon_axe') {
          // 전투 도끼 / 드래곤 도끼 - 도끼날 + 자루
          const axW = 14;
          const axH = 12;
          ctx.fillStyle = weapon.id === 'dragon_axe' ? '#dc2626' : '#71717a';
          if (weapon.id === 'dragon_axe') {
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#f97316';
          }
          ctx.beginPath();
          ctx.moveTo(weaponX + (dir > 0 ? axW : 0), weaponY - axH / 2);
          ctx.lineTo(weaponX + (dir > 0 ? axW * 1.2 : -axW * 0.2), weaponY);
          ctx.lineTo(weaponX + (dir > 0 ? axW : 0), weaponY + axH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#78350f';
          ctx.fillRect(weaponX - (dir > 0 ? 8 : -axW - 8), weaponY - 2, (weapon.id === 'dragon_axe' ? 22 : 18) * (dir > 0 ? 1 : -1), 4);
        } else if (weapon.id === 'spear' || weapon.id === 'lance_of_destiny' || weapon.id === 'dragon_spear_katana') {
          // 창 / 운명의 창 - 긴 자루 + 끝 날
          ctx.fillStyle = weapon.id === 'lance_of_destiny' ? '#fef9c3' : '#78350f';
          if (weapon.id === 'lance_of_destiny') ctx.shadowBlur = 10;
          if (weapon.id === 'lance_of_destiny') ctx.shadowColor = '#facc15';
          ctx.fillRect(weaponX, weaponY - 1, (weapon.id === 'lance_of_destiny' ? 32 : 28) * dir, 2);
          ctx.fillStyle = weapon.id === 'lance_of_destiny' ? '#facc15' : '#e5e5e5';
          ctx.fillRect(weaponX + (dir > 0 ? (weapon.id === 'lance_of_destiny' ? 28 : 24) : -(weapon.id === 'lance_of_destiny' ? 32 : 28)), weaponY - 5, 4 * dir, 10);
          ctx.shadowBlur = 0;
        } else if (weapon.id === 'hammer' || weapon.id === 'thunder_hammer' || weapon.id === 'titan_crusher') {
          // 망치 / 천둥 망치 / 타이탄 크러셔
          const size = weapon.id === 'titan_crusher' ? 18 : (weapon.id === 'thunder_hammer' ? 16 : 14);
          ctx.fillStyle = weapon.id === 'thunder_hammer' ? '#fbbf24' : weapon.id === 'titan_crusher' ? '#64748b' : '#71717a';
          if (weapon.id === 'thunder_hammer') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#eab308';
          }
          if (weapon.id === 'titan_crusher') {
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#475569';
          }
          ctx.fillRect(weaponX, weaponY - 7, size * dir, weapon.id === 'titan_crusher' ? 16 : 14);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#78350f';
          ctx.fillRect(weaponX - (dir > 0 ? 6 : -size), weaponY - 2, 10 * dir, 4);
        } else if (weapon.id === 'katana' || weapon.id === 'muramasa') {
          // 카타나 / 무라마사 - 날씬한 일본도
          ctx.fillStyle = weapon.id === 'muramasa' ? '#7f1d1d' : '#38bdf8';
          ctx.fillRect(weaponX, weaponY - 2, 24 * dir, 3);
          ctx.fillStyle = weapon.id === 'muramasa' ? '#450a0a' : '#0c4a6e';
          ctx.fillRect(weaponX + 2 * dir, weaponY - 1, 20 * dir, 1);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(weaponX - (dir > 0 ? 5 : -24), weaponY - 3, 5, 6);
          if (weapon.id === 'muramasa') {
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 1;
            ctx.strokeRect(weaponX, weaponY - 2, 24 * dir, 3);
            ctx.globalAlpha = 1;
          }
        } else if (weapon.id === 'dagger' || weapon.id === 'soul_dagger') {
          // 단검 / 영혼의 단검 - 짧은 검
          ctx.fillStyle = weapon.id === 'soul_dagger' ? '#a78bfa' : '#94a3b8';
          if (weapon.id === 'soul_dagger') ctx.shadowBlur = 8;
          if (weapon.id === 'soul_dagger') ctx.shadowColor = '#7c3aed';
          ctx.fillRect(weaponX, weaponY - 1.5, 14 * dir, 3);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(weaponX - (dir > 0 ? 4 : -14), weaponY - 2, 4, 4);
          ctx.shadowBlur = 0;
        } else if (weapon.id === 'battle_staff' || weapon.id === 'archmage_staff') {
          // 전투 지팡이 / 대마법사의 지팡이 - 짧은 막대 + 끝 장식
          ctx.fillStyle = '#78350f';
          ctx.fillRect(weaponX, weaponY - 1, 22 * dir, 2);
          const gemColors = weapon.id === 'archmage_staff' ? ['#ef4444', '#3b82f6', '#eab308'] : ['#a855f7'];
          for (let i = 0; i < (weapon.id === 'archmage_staff' ? 3 : 1); i++) {
            ctx.fillStyle = gemColors[i];
            if (weapon.id === 'archmage_staff') ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(weaponX + (dir > 0 ? 18 + i * 2 : -18 - i * 2), weaponY - 4, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else if (weapon.id === 'storm_blade') {
          // 폭풍의 검 - 번개 빛 검날
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#eab308';
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(weaponX, weaponY - 2, 22 * dir, 4);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(weaponX + 2 * dir, weaponY - 1, 18 * dir, 2);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(weaponX - (dir > 0 ? 5 : -22), weaponY - 3, 5, 6);
          ctx.shadowBlur = 0;
        } else if (weapon.id === 'holy_sword' || weapon.id === 'excalibur') {
          // 성스러운 검 / 엑스칼리버 - 빛나는 성검
          const bladeLength = 28;
          const bladeWidth = 5;
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#fef9c3';
          ctx.fillRect(weaponX, weaponY - bladeWidth - 2, bladeLength * dir, bladeWidth + 4);
          ctx.globalAlpha = 1;
          const grad = ctx.createLinearGradient(weaponX, weaponY - bladeWidth, weaponX + bladeLength * dir, weaponY + bladeWidth);
          grad.addColorStop(0, '#fefce8');
          grad.addColorStop(0.3, '#facc15');
          grad.addColorStop(1, '#eab308');
          ctx.fillStyle = grad;
          ctx.fillRect(weaponX, weaponY - bladeWidth / 2, bladeLength * dir, bladeWidth);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(weaponX + (dir > 0 ? bladeLength - 2 : -bladeLength), weaponY - bladeWidth / 2, 2 * dir, bladeWidth);
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(weaponX - (dir > 0 ? 2 : 8), weaponY + 1, 10, 3);
          ctx.fillStyle = '#7c2d12';
          ctx.fillRect(weaponX - (dir > 0 ? 4 : 4), weaponY + 3, 4, 7);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(player.facingRight ? px + player.width : px, py + player.height / 2, 30, player.facingRight ? -Math.PI / 3 : (4 * Math.PI) / 5, player.facingRight ? Math.PI / 3 : (6 * Math.PI) / 5);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (weapon.id === 'shadow_dual_sword' || weapon.id === 'demon_twin_blades') {
          // 그림자 쌍검 - 어두운 보라/검정
          ctx.fillStyle = '#4c1d95';
          ctx.fillRect(weaponX, weaponY - 6, 20 * dir, 3);
          ctx.fillRect(weaponX, weaponY + 3, 20 * dir, 3);
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(weaponX - (dir > 0 ? 4 : -20), weaponY - 7, 4, 5);
          ctx.fillRect(weaponX - (dir > 0 ? 4 : -20), weaponY + 2, 4, 5);
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#7c3aed';
          ctx.fillRect(weaponX, weaponY - 6, 20 * dir, 3);
          ctx.fillRect(weaponX, weaponY + 3, 20 * dir, 3);
          ctx.globalAlpha = 1;
        } else {
          // 기본 검
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(weaponX, weaponY - 2, 20 * dir, 4);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(weaponX + 2 * dir, weaponY - 1, 16 * dir, 2);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(weaponX - (dir > 0 ? 5 : -20), weaponY - 3, 5, 6);
        }

        if (weapon.id !== 'holy_sword' && weapon.id !== 'excalibur') {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(player.facingRight ? px + player.width : px, py + player.height / 2, 25, player.facingRight ? -Math.PI / 4 : (3 * Math.PI) / 4, player.facingRight ? Math.PI / 4 : (5 * Math.PI) / 4);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      } else {
        const sheathX = player.facingRight ? px + 20 : px + 5;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sheathX, py + 22, 3, 10);
      }
    } else if (weapon.type === 'ranged') {
      // 원거리 무기 (이름에 맞는 생김새)
      const bowX = player.facingRight ? px + player.width - 5 : px;
      const bowY = py + player.height / 2;
      const dir = player.facingRight ? 1 : -1;

      if (weapon.id === 'gatling_bow') {
        // 개틀링 활 - 회전 총열
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(bowX, bowY - 3, 20 * dir, 6);
        ctx.fillStyle = '#9ca3af';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(bowX + (dir > 0 ? 18 : -20), bowY - 4 + i * 4, 10 * dir, 2);
        }
        ctx.fillStyle = '#111827';
        ctx.fillRect(bowX - (dir > 0 ? 3 : -20), bowY + 2, 4, 6);
      } else if (weapon.id === 'crossbow' || weapon.id === 'heaven_crossbow' || weapon.id === 'celestial_artillery') {
        // 석궁 / 천상의 석궁
        ctx.fillStyle = weapon.id === 'heaven_crossbow' ? '#fef9c3' : '#78716c';
        if (weapon.id === 'heaven_crossbow') ctx.shadowBlur = 8;
        if (weapon.id === 'heaven_crossbow') ctx.shadowColor = '#eab308';
        ctx.fillRect(bowX, bowY - 4, 16 * dir, 8);
        ctx.fillStyle = weapon.id === 'heaven_crossbow' ? '#facc15' : '#44403c';
        ctx.fillRect(bowX + (dir > 0 ? 12 : -14), bowY - 6, 2, 12);
        ctx.shadowBlur = 0;
        if (player.isAttacking) {
          ctx.fillStyle = weapon.id === 'heaven_crossbow' ? '#fef08a' : '#fbbf24';
          ctx.fillRect(bowX + (dir > 0 ? 16 : -16), bowY, 8 * dir, 1);
        }
      } else if (weapon.id === 'double_bow' || weapon.id === 'artemis_double_bow' || weapon.id === 'multi_heaven_bow') {
        // 연발궁 / 아르테미스의 쌍궁 - 두 개의 활대
        for (let o = 0; o < 2; o++) {
          const off = o * 4 - 2;
          ctx.strokeStyle = weapon.id === 'artemis_double_bow' ? '#fef9c3' : '#78350f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(bowX + (dir > 0 ? 10 : -10), bowY + off, 9, player.facingRight ? -Math.PI/2 : Math.PI/2, player.facingRight ? Math.PI/2 : -Math.PI/2);
          ctx.stroke();
        }
        if (player.isAttacking) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bowX + (dir > 0 ? 3 : -3), bowY - 6);
          ctx.lineTo(bowX + (dir > 0 ? 3 : -3), bowY + 6);
          ctx.stroke();
        }
      } else if (weapon.id === 'multi_bow') {
        // 다중궁 - 3방향 느낌 (활대 세 개 겹침)
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        for (let a = -0.15; a <= 0.15; a += 0.15) {
          ctx.beginPath();
          ctx.arc(bowX + (dir > 0 ? 10 : -10), bowY, 10, (player.facingRight ? -Math.PI/2 : Math.PI/2) + a, (player.facingRight ? Math.PI/2 : -Math.PI/2) + a);
          ctx.stroke();
        }
        if (player.isAttacking) {
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(bowX + (dir > 0 ? 12 : -12), bowY - 1, 6 * dir, 2);
        }
      } else if (weapon.id === 'shuriken' || weapon.id === 'demon_shuriken' || weapon.id === 'shuriken_storm') {
        // 수리검 / 악마의 수리검 - 별 모양
        const cx = bowX + (dir > 0 ? 8 : -8);
        const r = 6;
        ctx.fillStyle = weapon.id === 'demon_shuriken' ? '#4c1d95' : '#94a3b8';
        if (weapon.id === 'demon_shuriken') ctx.shadowBlur = 6;
        if (weapon.id === 'demon_shuriken') ctx.shadowColor = '#7c3aed';
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI / 2) * i;
          const x = cx + Math.cos(a) * r;
          const y = bowY + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (weapon.id === 'boomerang' || weapon.id === 'cosmic_boomerang') {
        // 부메랑 / 우주의 부메랑 - V자/반달
        const cx = bowX + (dir > 0 ? 10 : -10);
        ctx.strokeStyle = weapon.id === 'cosmic_boomerang' ? '#fef9c3' : '#78716c';
        ctx.lineWidth = 3;
        if (weapon.id === 'cosmic_boomerang') ctx.shadowBlur = 8;
        if (weapon.id === 'cosmic_boomerang') ctx.shadowColor = '#a78bfa';
        ctx.beginPath();
        ctx.arc(cx, bowY, 8, player.facingRight ? -Math.PI * 0.7 : Math.PI * 0.2, player.facingRight ? Math.PI * 0.2 : -Math.PI * 0.7);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (weapon.id === 'phoenix_bow') {
        // 불사조의 활 - 불꽃 색 활대
        const g = ctx.createLinearGradient(bowX, bowY - 12, bowX, bowY + 12);
        g.addColorStop(0, '#fef3c7');
        g.addColorStop(0.5, '#f97316');
        g.addColorStop(1, '#dc2626');
        ctx.strokeStyle = g as unknown as string;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ef4444';
        ctx.beginPath();
        ctx.arc(bowX + (dir > 0 ? 10 : -10), bowY, 10, player.facingRight ? -Math.PI/2 : Math.PI/2, player.facingRight ? Math.PI/2 : -Math.PI/2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        if (player.isAttacking) {
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(bowX + (dir > 0 ? 12 : -12), bowY - 1, 6 * dir, 2);
        }
      } else {
        // 기본 활 (장궁)
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bowX + (dir > 0 ? 10 : -10), bowY, 10, player.facingRight ? -Math.PI/2 : Math.PI/2, player.facingRight ? Math.PI/2 : -Math.PI/2);
        ctx.stroke();
        if (player.isAttacking) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bowX + (dir > 0 ? 3 : -3), bowY - 8);
          ctx.lineTo(bowX + (dir > 0 ? 3 : -3), bowY + 8);
          ctx.stroke();
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(bowX + (dir > 0 ? 12 : -12), bowY - 1, 6 * dir, 2);
        }
      }
    } else if (weapon.type === 'magic') {
      // 마법 무기 (지팡이) - 이름에 맞는 색/형태
      const staffX = player.facingRight ? px + player.width - 4 : px + 2;
      const staffY = py + 8;
      
      let gemColor = '#a855f7';
      let glowColor = '#9333ea';
      let staffColor = '#78350f';
      
      if (weapon.id.includes('fire') || weapon.id === 'inferno_staff') {
        gemColor = '#ef4444';
        glowColor = '#dc2626';
        if (weapon.id === 'inferno_staff') staffColor = '#7f1d1d';
      } else if (weapon.id.includes('ice') || weapon.id === 'absolute_zero_staff') {
        gemColor = '#3b82f6';
        glowColor = '#2563eb';
        if (weapon.id === 'absolute_zero_staff') staffColor = '#1e3a8a';
      } else if (weapon.id.includes('lightning') || weapon.id === 'storm_caller_staff') {
        gemColor = '#eab308';
        glowColor = '#facc15';
        if (weapon.id === 'storm_caller_staff') staffColor = '#422006';
      } else if (weapon.id.includes('dark') || weapon.id === 'abyss_staff') {
        gemColor = '#4c1d95';
        glowColor = '#6d28d9';
        if (weapon.id === 'abyss_staff') staffColor = '#1e1b4b';
      } else if (weapon.id.includes('poison') || weapon.id === 'plague_staff') {
        gemColor = '#22c55e';
        glowColor = '#16a34a';
        if (weapon.id === 'plague_staff') staffColor = '#14532d';
      } else if (weapon.id.includes('holy') || weapon.id === 'celestial_staff' || weapon.id === 'divine_wand') {
        gemColor = '#fef9c3';
        glowColor = '#facc15';
        if (weapon.id === 'celestial_staff' || weapon.id === 'divine_wand') staffColor = '#422006';
      } else if (weapon.id.includes('chaos') || weapon.id === 'primordial_chaos_staff' || weapon.id === 'trinity_staff') {
        gemColor = '#ec4899';
        glowColor = '#db2777';
        if (weapon.id === 'primordial_chaos_staff' || weapon.id === 'trinity_staff') staffColor = '#4c1d95';
      } else if (weapon.id === 'void_holy_staff') {
        gemColor = '#fef9c3';
        glowColor = '#7c3aed';
        staffColor = '#1e1b4b';
      } else if (weapon.id === 'yin_yang_staff') {
        gemColor = '#fef3c7';
        glowColor = '#1f2937';
        staffColor = '#374151';
      } else if (weapon.id === 'toxic_flame_staff') {
        gemColor = '#22c55e';
        glowColor = '#ef4444';
        staffColor = '#14532d';
      } else if (weapon.id === 'archmage_staff') {
        gemColor = '#a855f7';
        glowColor = '#9333ea';
      }
      
      ctx.fillStyle = staffColor;
      ctx.fillRect(staffX, staffY, 3, 26);
      
      ctx.fillStyle = gemColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = glowColor;
      const gemR = (weapon.id === 'inferno_staff' || weapon.id === 'celestial_staff' || weapon.id === 'primordial_chaos_staff') ? 6 : 5;
      ctx.beginPath();
      ctx.arc(staffX + 1.5, staffY - 4, gemR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      if (weapon.id === 'archmage_staff') {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(staffX + 1.5, staffY - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(staffX + 4, staffY - 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (player.isAttacking) {
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = gemColor;
          ctx.fillRect(staffX - 2 + Math.random() * 6, staffY - 10 - i * 4, 3, 3);
        }
        ctx.globalAlpha = 1;
      }
    }
    
    ctx.globalAlpha = 1;

    // 보스 그리기 (악마 스타일)
    const boss = state.boss;
    const bx = boss.position.x;
    const by = boss.position.y;
    
    // 패턴에 따른 색상 변화
    const patternColors = [
      { body: '#ef4444', dark: '#991b1b', glow: '#fca5a5' }, // 빨강
      { body: '#8b5cf6', dark: '#6d28d9', glow: '#c4b5fd' }, // 보라
      { body: '#f59e0b', dark: '#d97706', glow: '#fcd34d' }, // 주황
      { body: '#10b981', dark: '#047857', glow: '#6ee7b7' }, // 초록
      { body: '#3b82f6', dark: '#1e40af', glow: '#93c5fd' }, // 파랑
      { body: '#ec4899', dark: '#be185d', glow: '#f9a8d4' }, // 핑크
      { body: '#06b6d4', dark: '#0e7490', glow: '#67e8f9' }, // 시안
      { body: '#f43f5e', dark: '#be123c', glow: '#fb7185' }, // 장미
      { body: '#8b5cf6', dark: '#6d28d9', glow: '#c4b5fd' }, // 바이올렛
      { body: '#eab308', dark: '#a16207', glow: '#fde047' }, // 노랑
    ];
    const bossColors = patternColors[boss.currentPattern % patternColors.length];
    
    // 보스 오라 (발광 효과)
    ctx.globalAlpha = 0.3;
    for (let i = 3; i > 0; i--) {
      ctx.fillStyle = bossColors.glow;
      ctx.fillRect(
        bx - i * 3,
        by - i * 3,
        boss.width + i * 6,
        boss.height + i * 6
      );
    }
    ctx.globalAlpha = 1;
    
    // 날개
    ctx.fillStyle = bossColors.dark;
    ctx.beginPath();
    // 왼쪽 날개
    ctx.moveTo(bx, by + 20);
    ctx.lineTo(bx - 20, by + 10);
    ctx.lineTo(bx - 25, by + 30);
    ctx.lineTo(bx - 15, by + 35);
    ctx.lineTo(bx, by + 40);
    ctx.closePath();
    ctx.fill();
    
    // 오른쪽 날개
    ctx.beginPath();
    ctx.moveTo(bx + boss.width, by + 20);
    ctx.lineTo(bx + boss.width + 20, by + 10);
    ctx.lineTo(bx + boss.width + 25, by + 30);
    ctx.lineTo(bx + boss.width + 15, by + 35);
    ctx.lineTo(bx + boss.width, by + 40);
    ctx.closePath();
    ctx.fill();
    
    // 날개 테두리
    ctx.strokeStyle = bossColors.glow;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 다리 (굵은)
    ctx.fillStyle = bossColors.dark;
    ctx.fillRect(bx + 10, by + 60, 15, 20);
    ctx.fillRect(bx + 35, by + 60, 15, 20);
    
    // 발톱
    ctx.fillStyle = '#1f2937';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(bx + 10 + i * 4, by + 78, 3, 4);
      ctx.fillRect(bx + 35 + i * 4, by + 78, 3, 4);
    }
    
    // 몸통
    ctx.fillStyle = bossColors.body;
    ctx.fillRect(bx + 5, by + 25, 50, 40);
    
    // 가슴 갑옷
    ctx.fillStyle = bossColors.dark;
    ctx.fillRect(bx + 15, by + 30, 30, 25);
    
    // 갑옷 디테일
    ctx.strokeStyle = bossColors.glow;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(bx + 20 + i * 5, by + 35);
      ctx.lineTo(bx + 20 + i * 5, by + 50);
      ctx.stroke();
    }
    
    // 팔 (근육질)
    ctx.fillStyle = bossColors.body;
    ctx.fillRect(bx - 5, by + 30, 12, 25);
    ctx.fillRect(bx + 53, by + 30, 12, 25);
    
    // 주먹
    ctx.fillStyle = bossColors.dark;
    ctx.fillRect(bx - 7, by + 53, 10, 10);
    ctx.fillRect(bx + 57, by + 53, 10, 10);
    
    // 머리
    ctx.fillStyle = bossColors.body;
    ctx.fillRect(bx + 15, by, 30, 30);
    
    // 뿔
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    // 왼쪽 뿔
    ctx.moveTo(bx + 15, by + 5);
    ctx.lineTo(bx + 10, by - 10);
    ctx.lineTo(bx + 18, by + 8);
    ctx.closePath();
    ctx.fill();
    
    // 오른쪽 뿔
    ctx.beginPath();
    ctx.moveTo(bx + 45, by + 5);
    ctx.lineTo(bx + 50, by - 10);
    ctx.lineTo(bx + 42, by + 8);
    ctx.closePath();
    ctx.fill();
    
    // 뿔 하이라이트
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(bx + 12, by - 5, 2, 8);
    ctx.fillRect(bx + 46, by - 5, 2, 8);
    
    // 눈 (발광)
    ctx.shadowBlur = 15;
    ctx.shadowColor = bossColors.glow;
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(bx + 20, by + 12, 8, 10);
    ctx.fillRect(bx + 32, by + 12, 8, 10);
    
    // 눈동자 (사악한)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(bx + 22, by + 16, 4, 4);
    ctx.fillRect(bx + 34, by + 16, 4, 4);
    
    ctx.shadowBlur = 0;
    
    // 입 (이빨)
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(bx + 23, by + 24, 14, 4);
    
    // 이빨
    ctx.fillStyle = '#f9fafb';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(bx + 24 + i * 3, by + 24, 2, 3);
    }
    
    // 공격 준비 시 이펙트
    if (boss.patternCooldown < 10) {
      ctx.globalAlpha = 0.5 + (Math.sin(Date.now() / 100) * 0.3);
      ctx.fillStyle = bossColors.glow;
      ctx.beginPath();
      ctx.arc(bx + boss.width / 2, by + boss.height / 2, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    // 몸통 테두리
    ctx.strokeStyle = bossColors.dark;
    ctx.lineWidth = 3;
    ctx.strokeRect(bx + 5, by, 50, 80);

    // 투사체 그리기
    state.projectiles.forEach((proj) => {
      const projCenterX = proj.position.x + proj.width / 2;
      const projCenterY = proj.position.y + proj.height / 2;
      
      if (proj.fromPlayer) {
        // 플레이어 투사체

        // 개틀링 건(개틀링 활)의 총알
        if (proj.weaponId === 'gatling_bow') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#facc15';

          // 궤적 (불빛 줄기)
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#fef3c7';
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(
              proj.position.x - i * 4 * (proj.velocity.x > 0 ? 1 : -1),
              proj.position.y + proj.height / 2 - 1,
              proj.width,
              2
            );
          }
          ctx.globalAlpha = 1;

          // 총알 본체
          ctx.fillStyle = '#fbbf24';
          const bulletLength = proj.width;
          const bulletHeight = 3;
          ctx.fillRect(
            proj.position.x,
            projCenterY - bulletHeight / 2,
            (proj.velocity.x > 0 ? 1 : -1) * bulletLength,
            bulletHeight
          );

          // 탄두
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(
            proj.velocity.x > 0 ? proj.position.x + bulletLength : proj.position.x - bulletLength,
            projCenterY,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();

          ctx.shadowBlur = 0;
          return;
        }

        // 수리검 / 악마의 수리검 - 별 모양
        if (proj.weaponId === 'shuriken' || proj.weaponId === 'demon_shuriken') {
          const mainC = proj.weaponId === 'demon_shuriken' ? '#7c3aed' : '#94a3b8';
          ctx.fillStyle = mainC;
          if (proj.weaponId === 'demon_shuriken') {
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#4c1d95';
          }
          ctx.beginPath();
          const r = Math.min(proj.width, proj.height) / 2;
          for (let i = 0; i < 4; i++) {
            const a = (Math.PI / 2) * i;
            const x = projCenterX + Math.cos(a) * r;
            const y = projCenterY + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          return;
        }

        // 부메랑 / 우주의 부메랑 - 반달형
        if (proj.weaponId === 'boomerang' || proj.weaponId === 'cosmic_boomerang') {
          ctx.strokeStyle = proj.weaponId === 'cosmic_boomerang' ? '#fef9c3' : '#78716c';
          ctx.lineWidth = 4;
          if (proj.weaponId === 'cosmic_boomerang') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#a78bfa';
          }
          ctx.beginPath();
          ctx.arc(projCenterX, projCenterY, Math.min(proj.width, proj.height) / 2, 0, Math.PI);
          ctx.stroke();
          ctx.shadowBlur = 0;
          return;
        }

        // 불사조의 활 - 화염 화살
        if (proj.weaponId === 'phoenix_bow') {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ef4444';
          const g = ctx.createLinearGradient(proj.position.x, proj.position.y, proj.position.x + proj.width, proj.position.y);
          g.addColorStop(0, '#fef3c7');
          g.addColorStop(0.5, '#f97316');
          g.addColorStop(1, '#dc2626');
          ctx.fillStyle = g as unknown as string;
          ctx.fillRect(proj.position.x, proj.position.y, proj.width, proj.height);
          ctx.shadowBlur = 0;
          return;
        }

        // 천상의 석궁 - 번개 볼트
        if (proj.weaponId === 'heaven_crossbow') {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#eab308';
          ctx.fillStyle = '#fef9c3';
          ctx.fillRect(proj.position.x, proj.position.y, proj.width, proj.height);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(projCenterX, projCenterY, proj.width / 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          return;
        }
        
        const isTracking = proj.isTracking;
        // 원소/무기에 맞는 색상
        let mainColor = isTracking ? '#a855f7' : '#fbbf24';
        let lightColor = isTracking ? '#f3e8ff' : '#fef3c7';
        let darkColor = isTracking ? '#7e22ce' : '#f59e0b';
        if (proj.element === 'fire') {
          mainColor = '#ef4444';
          lightColor = '#fef3c7';
          darkColor = '#dc2626';
        } else if (proj.element === 'ice') {
          mainColor = '#3b82f6';
          lightColor = '#dbeafe';
          darkColor = '#2563eb';
        } else if (proj.element === 'lightning') {
          mainColor = '#eab308';
          lightColor = '#fef9c3';
          darkColor = '#ca8a04';
        } else if (proj.element === 'poison') {
          mainColor = '#22c55e';
          lightColor = '#dcfce7';
          darkColor = '#16a34a';
        } else if (proj.element === 'dark') {
          mainColor = '#7c3aed';
          lightColor = '#ede9fe';
          darkColor = '#6d28d9';
        }
        
        // 외부 발광
        ctx.shadowBlur = isTracking ? 25 : 20;
        ctx.shadowColor = mainColor;
        
        // 투사체 모양에 따른 렌더링
        if (proj.shape === 'crescent') {
          // 카타나 - 초승달 모양
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = lightColor;
          // 궤적 효과
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
              projCenterX - i * 8 * (proj.velocity.x > 0 ? 1 : -1),
              projCenterY,
              proj.width / 2,
              (proj.velocity.x > 0 ? -0.5 : 0.5) * Math.PI,
              (proj.velocity.x > 0 ? 0.5 : 1.5) * Math.PI
            );
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          
          // 메인 초승달
          const gradient = ctx.createRadialGradient(
            projCenterX, projCenterY, 0,
            projCenterX, projCenterY, proj.width / 2
          );
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.3, lightColor);
          gradient.addColorStop(0.7, mainColor);
          gradient.addColorStop(1, darkColor);
          ctx.fillStyle = gradient;
          
          ctx.beginPath();
          ctx.arc(
            projCenterX,
            projCenterY,
            proj.width / 2,
            (proj.velocity.x > 0 ? -0.5 : 0.5) * Math.PI,
            (proj.velocity.x > 0 ? 0.5 : 1.5) * Math.PI
          );
          ctx.lineTo(projCenterX, projCenterY);
          ctx.closePath();
          ctx.fill();
          
          // 외곽선
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
        } else if (proj.shape === 'wide') {
          // 망치/대검 - 넓은 공격
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = lightColor;
          // 궤적
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(
              proj.position.x - i * 5 * (proj.velocity.x > 0 ? 1 : -1),
              proj.position.y,
              proj.width,
              proj.height
            );
          }
          ctx.globalAlpha = 1;
          
          // 메인 공격 (사각형)
          const gradient = ctx.createLinearGradient(
            proj.position.x, proj.position.y,
            proj.position.x + proj.width, proj.position.y + proj.height
          );
          gradient.addColorStop(0, lightColor);
          gradient.addColorStop(0.5, mainColor);
          gradient.addColorStop(1, darkColor);
          ctx.fillStyle = gradient;
          ctx.fillRect(proj.position.x, proj.position.y, proj.width, proj.height);
          
          // 테두리
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.strokeRect(proj.position.x, proj.position.y, proj.width, proj.height);
          
        } else if (proj.shape === 'long') {
          // 창 - 얇고 긴 공격
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = lightColor;
          // 궤적
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(
              proj.position.x - i * 6 * (proj.velocity.x > 0 ? 1 : -1),
              proj.position.y,
              proj.width,
              proj.height
            );
          }
          ctx.globalAlpha = 1;
          
          // 메인 창 (긴 직선)
          const gradient = ctx.createLinearGradient(
            proj.position.x, proj.position.y,
            proj.position.x + proj.width, proj.position.y
          );
          gradient.addColorStop(0, darkColor);
          gradient.addColorStop(0.3, mainColor);
          gradient.addColorStop(0.7, lightColor);
          gradient.addColorStop(1, '#ffffff');
          ctx.fillStyle = gradient;
          ctx.fillRect(proj.position.x, proj.position.y, proj.width, proj.height);
          
          // 창끝 강조
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(
            proj.position.x + (proj.velocity.x > 0 ? proj.width - 5 : 0),
            proj.position.y - 1,
            5,
            proj.height + 2
          );
          
        } else {
          // 기본 모양 (원형)
          // 궤적
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = lightColor;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
              projCenterX - i * 5 * (proj.velocity.x > 0 ? 1 : -1),
              projCenterY,
              proj.width / 2 + 2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          
          // 추적 투사체 특수 효과
          if (isTracking) {
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = '#e879f9';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(projCenterX, projCenterY, proj.width / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          
          // 메인 투사체
          const gradient = ctx.createRadialGradient(
            projCenterX, projCenterY, 0,
            projCenterX, projCenterY, proj.width / 2
          );
          gradient.addColorStop(0, lightColor);
          gradient.addColorStop(0.5, mainColor);
          gradient.addColorStop(1, darkColor);
          ctx.fillStyle = gradient;
          
          ctx.beginPath();
          ctx.arc(projCenterX, projCenterY, proj.width / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // 반짝임
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(
            projCenterX - proj.width / 4,
            projCenterY - proj.width / 4,
            proj.width / 6,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        
        ctx.shadowBlur = 0;
      } else {
        // 보스 투사체 (사악한 마법)
        
        // 외부 발광
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#dc2626';
        
        // 궤적
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ef4444';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(
            projCenterX - i * 4 * Math.sign(proj.velocity.x || 1),
            projCenterY - i * 4 * Math.sign(proj.velocity.y || 1),
            proj.width / 2 + 1,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // 메인 투사체 (육각형)
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = projCenterX + Math.cos(angle) * (proj.width / 2);
          const y = projCenterY + Math.sin(angle) * (proj.width / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // 코어
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(projCenterX, projCenterY, proj.width / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 회전하는 테두리
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(projCenterX, projCenterY, proj.width / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
      }
    });

    // 체력바 그리기 (플레이어)
    const playerHealthPercent = (player.health / player.maxHealth) * 100;
    
    // 체력바 배경 (어두운)
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(px - 5, py - 18, player.width + 10, 10);
    
    // 체력바 (그라데이션)
    const healthColor = playerHealthPercent > 50 ? '#10b981' : playerHealthPercent > 25 ? '#f59e0b' : '#ef4444';
    const healthGradient = ctx.createLinearGradient(px - 5, py - 18, px - 5, py - 8);
    healthGradient.addColorStop(0, healthColor);
    healthGradient.addColorStop(1, playerHealthPercent > 50 ? '#059669' : playerHealthPercent > 25 ? '#d97706' : '#dc2626');
    ctx.fillStyle = healthGradient;
    ctx.fillRect(px - 5, py - 18, ((player.width + 10) * playerHealthPercent) / 100, 10);
    
    // 체력바 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(px - 5, py - 18, ((player.width + 10) * playerHealthPercent) / 100, 3);
    
    // 체력바 테두리
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 5, py - 18, player.width + 10, 10);

    // 체력바 그리기 (보스)
    const bossHealthPercent = (boss.health / boss.maxHealth) * 100;
    const bossBarWidth = 220;
    const bossBarHeight = 14;
    const bossBarX = bx + boss.width / 2 - bossBarWidth / 2;
    const bossBarY = by - 35;
    
    // 체력바 배경 (어두운)
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
    
    // 체력바 (그라데이션 - 패턴별 색상)
    const bossHealthGradient = ctx.createLinearGradient(
      bossBarX,
      bossBarY,
      bossBarX,
      bossBarY + bossBarHeight
    );
    bossHealthGradient.addColorStop(0, bossColors.glow);
    bossHealthGradient.addColorStop(1, bossColors.body);
    ctx.fillStyle = bossHealthGradient;
    ctx.fillRect(bossBarX, bossBarY, (bossBarWidth * bossHealthPercent) / 100, bossBarHeight);
    
    // 체력바 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(bossBarX, bossBarY, (bossBarWidth * bossHealthPercent) / 100, 4);
    
    // 체력바 구분선
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const x = bossBarX + (bossBarWidth / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, bossBarY);
      ctx.lineTo(x, bossBarY + bossBarHeight);
      ctx.stroke();
    }
    
    // 체력바 테두리
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
    
    // 보스 이름 표시 (발광 효과)
    ctx.shadowBlur = 10;
    ctx.shadowColor = bossColors.glow;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('👹 BOSS 👹', bx + boss.width / 2, bossBarY - 8);
    ctx.shadowBlur = 0;

    // 보스 디버프 아이콘 표시
    if (boss.debuffs && boss.debuffs.length > 0) {
      boss.debuffs.forEach((debuff, index) => {
        const iconX = bx + 5 + (index * 22);
        const iconY = by - 25;
        const iconSize = 18;
        
        // 디버프 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        // 디버프 아이콘 (속성별)
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '';
        let color = '';
        
        switch (debuff.type) {
          case 'fire':
            icon = '🔥';
            color = '#ef4444';
            break;
          case 'ice':
            icon = '❄️';
            color = '#3b82f6';
            break;
          case 'lightning':
            icon = '⚡';
            color = '#eab308';
            break;
          case 'poison':
            icon = '☠️';
            color = '#22c55e';
            break;
          case 'dark':
            icon = '🌑';
            color = '#7c3aed';
            break;
        }
        
        // 발광 효과
        ctx.shadowBlur = 5;
        ctx.shadowColor = color;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(icon, iconX + iconSize / 2, iconY + iconSize / 2);
        ctx.shadowBlur = 0;
        
        // 디버프 테두리
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, iconSize, iconSize);
        
        // 디버프 지속시간 (작은 바)
        const durationPercent = debuff.duration / 300; // 5초 기준
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(iconX, iconY + iconSize - 2, iconSize * durationPercent, 2);
        ctx.globalAlpha = 1;
      });
    }

    // 데미지 텍스트 그리기
    state.damageTexts.forEach((damageText) => {
      ctx.globalAlpha = damageText.opacity;
      
      const x = damageText.position.x;
      const y = damageText.position.y + damageText.offsetY;
      
      if (damageText.isCritical) {
        // 치명타 데미지 (화려한 효과)
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 치명타 발광 효과 (여러 겹)
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff0000';
        
        // 외곽선 (더 굵게)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeText(`💥 -${damageText.damage} 💥`, x, y);
        
        // 그라데이션 효과
        const gradient = ctx.createLinearGradient(x, y - 20, x, y + 20);
        gradient.addColorStop(0, '#ffff00'); // 노란색
        gradient.addColorStop(0.5, '#ff6600'); // 주황색
        gradient.addColorStop(1, '#ff0000'); // 빨간색
        ctx.fillStyle = gradient;
        ctx.fillText(`💥 -${damageText.damage} 💥`, x, y);
        
        // 추가 발광 레이어
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#ffaa00';
        ctx.fillText(`💥 -${damageText.damage} 💥`, x, y);
        
      } else if (damageText.isPlayerDamage) {
        // 플레이어가 받은 데미지 (빨간색)
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff0000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(`-${damageText.damage}`, x, y);
        ctx.fillStyle = '#ff4444';
        ctx.fillText(`-${damageText.damage}`, x, y);
      } else {
        // 보스가 받은 데미지
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 속성에 따른 색상과 아이콘
        let color = '#ffdd44'; // 기본 노란색
        let shadowColor = '#ffaa00';
        let icon = '';
        
        if (damageText.element) {
          switch (damageText.element) {
            case 'fire':
              color = '#ff6622';
              shadowColor = '#ff0000';
              icon = '🔥';
              break;
            case 'ice':
              color = '#66ccff';
              shadowColor = '#0099ff';
              icon = '❄️';
              break;
            case 'lightning':
              color = '#ffff44';
              shadowColor = '#ffdd00';
              icon = '⚡';
              break;
            case 'poison':
              color = '#66ff66';
              shadowColor = '#00ff00';
              icon = '☠️';
              break;
            case 'dark':
              color = '#9966ff';
              shadowColor = '#6600ff';
              icon = '🌑';
              break;
            case 'physical':
            default:
              color = '#ffdd44';
              shadowColor = '#ffaa00';
              break;
          }
        }
        
        ctx.shadowBlur = damageText.element && damageText.element !== 'physical' ? 12 : 8;
        ctx.shadowColor = shadowColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        
        const displayText = icon ? `${icon}-${damageText.damage}` : `-${damageText.damage}`;
        ctx.strokeText(displayText, x, y);
        ctx.fillStyle = color;
        ctx.fillText(displayText, x, y);
      }
      
      ctx.shadowBlur = 0;
    });
    
    ctx.globalAlpha = 1;
    };

    if (gameStateRef) {
      let rafId: number;
      const loop = () => {
        const s = gameStateRef.current ?? gameState;
        if (s) draw(s);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafId);
    } else {
      draw(gameState);
    }
    // gameStateRef 사용 시: ref만 의존해 플레임마다 ref에서 읽음. 미사용 시: gameState 변경 시에만 그리기.
  }, [gameStateRef ? null : gameState, gameStateRef]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border-4 border-gray-700 rounded-lg shadow-2xl"
    />
  );
};

// 메모이제이션으로 불필요한 리렌더링 방지
export const GameCanvas = memo(GameCanvasComponent);
