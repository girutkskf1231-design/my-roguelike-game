# 🎮 DJWIDA - 2D 플랫폼 액션 RPG

React + TypeScript + Vite로 제작된 2D 픽셀 아트 스타일의 플랫폼 액션 RPG 게임입니다.

## ✨ 주요 기능

### 게임 시스템
- 🎯 **4가지 직업** (전사, 궁수, 마법사, 암살자)
- ⚔️ **다양한 무기** (근접, 원거리, 마법 - 총 20+ 종류)
- 🔮 **무기 시스템**
  - 강화: 무기 스탯 증가
  - 진화: 새로운 무기로 변환
  - 합성: 두 무기를 융합하여 강력한 무기 생성
- 💎 **아티팩트 시스템** (경험치, 데미지, 속도 등 보너스)
- 🌊 **웨이브 시스템** (보스 전투)
- 📊 **스탯 시스템** (힘, 체력, 민첩, 방어력, 치명타)

### 온라인 기능 (Supabase)
- 🔐 **회원가입/로그인**
- 👤 **프로필 관리** (닉네임, 아바타)
- 🏆 **리더보드** (점수, 웨이브, 난이도별 순위)
- 💾 **게임 인벤토리 자동 저장**
  - ✅ 무제한 무기 저장
  - ✅ 자동 저장 (30초마다)
  - ✅ 클라우드 동기화
  - ✅ 진행 상황 복구

## 🔧 기술 스택

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, Lucide React
- **Backend**: Supabase (인증, 데이터베이스, 스토리지)

## 🚀 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 Supabase 정보를 입력합니다:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

자세한 설정 방법은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참고하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## 📦 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── GameCanvas.tsx   # 메인 게임 캔버스
│   ├── InventoryScreen.tsx  # 인벤토리 화면
│   ├── UpgradePage.tsx  # 무기 강화
│   ├── EvolutionPage.tsx  # 무기 진화
│   ├── FusionPage.tsx   # 무기 합성
│   └── ...
├── data/                # 게임 데이터
│   ├── weapons.ts       # 무기 데이터
│   ├── skills.ts        # 스킬 데이터
│   ├── artifacts.ts     # 아티팩트 데이터
│   └── ...
├── hooks/               # 커스텀 훅
│   ├── useGame.ts       # 게임 로직 훅
│   ├── useAuth.ts       # 인증 훅
│   └── useInventorySync.ts  # 인벤토리 동기화 훅
├── lib/                 # 유틸리티
│   ├── supabase.ts      # Supabase 클라이언트
│   └── utils.ts
├── types/               # TypeScript 타입
│   └── game.ts
└── utils/               # 게임 유틸리티
    ├── gameLogic.ts
    └── statistics.ts
```

## 🎮 게임 조작법

### 키보드
- `A/D`: 이동
- `Space/W`: 점프
- `Shift`: 회피
- `J`: 공격
- `1/2/3`: 스킬 사용
- `ESC`: 일시정지
- `I`: 인벤토리
- `U`: 아티팩트

### 모바일
- 터치 컨트롤 지원 (화면에 버튼 표시)

## 🐛 문제 해결 (2026-01-30)

### 발견된 문제점
1. ❌ **인벤토리 용량 표시 오류**: "280/200"과 같이 잘못된 숫자 표시
2. ❌ **데이터 동기화 부재**: 게임 데이터가 로컬에만 저장
3. ❌ **UI 텍스트 불명확**: 의미 불명확한 텍스트 표시

### 해결 방법
1. ✅ **인벤토리 UI 개선**
   - "무제한 저장 가능" 명확히 표시
   - 보유 무기 개수만 표시 (용량 제한 없음)
   - 타입별 필터링 개선

2. ✅ **Supabase 인벤토리 시스템 구축**
   - `player_inventory` 테이블 생성
   - 자동 저장 기능 (30초마다)
   - 클라우드 동기화
   - 진행 상황 복구

3. ✅ **데이터 구조 개선**
   - 무기 인벤토리: 무제한 저장
   - 스킬, 아티팩트 관리
   - 게임 진행 상황 (레벨, 경험치, 웨이브 등)

### 적용된 파일
- `src/components/InventoryScreen.tsx` - UI 개선
- `src/lib/supabase.ts` - 인벤토리 API 추가
- `src/hooks/useInventorySync.ts` - 자동 동기화 훅
- `supabase/migrations/20260130120000_game_inventory_system.sql` - DB 마이그레이션

## 📚 추가 문서

- [Supabase 설정 가이드](./SUPABASE_SETUP.md)
- [에이전트 가이드](./AGENTS.md)

## 🤝 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!

## 📄 라이선스

MIT License
