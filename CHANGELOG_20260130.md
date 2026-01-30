# 변경 사항 (2026-01-30)

## 요약

- 인벤토리 UI: "280/200" 용량 표시 제거 → "무제한 저장 가능" 명시
- Supabase 인벤토리: `player_inventory` 테이블, RLS, 자동 저장(30초)·즉시 저장(중요 변경 시)
- 데이터 손실 방지: 클라우드 저장, 진행 상황 복구

## 구현 내용

### DB

- `supabase/migrations/20260130120000_game_inventory_system.sql`: `player_inventory`, RLS, 트리거, `get_inventory_stats` RPC

### 코드

- `src/lib/supabase.ts`: `getPlayerInventory`, `savePlayerInventory`, `deletePlayerInventory`, `getInventoryStats`
- `src/hooks/useInventorySync.ts`: 30초 자동 저장, 중요 변경 시 5초 후 저장, 게임 시작 시 서버 로드
- `src/components/InventoryScreen.tsx`: 무제한 저장 문구, 보유 무기 개수만 표시

## 파일 목록

- **추가**: `supabase/migrations/20260130120000_game_inventory_system.sql`, `src/hooks/useInventorySync.ts`, `MIGRATION_GUIDE.md`, `CHANGELOG_20260130.md`
- **수정**: `src/lib/supabase.ts`, `src/components/InventoryScreen.tsx`, `SUPABASE_SETUP.md`, `README.md`

## 참고

- 마이그레이션: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- 설정: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
