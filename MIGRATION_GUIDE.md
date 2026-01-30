# 데이터베이스 마이그레이션 가이드

## 개요

게임 인벤토리 시스템을 Supabase에 추가하기 위한 마이그레이션 안내입니다.

- **목적**: 로컬 전용 데이터 → Supabase 저장, 자동 동기화(30초마다), 무제한 무기 저장, 진행 상황 복구
- **파일**: `supabase/migrations/20260130120000_game_inventory_system.sql`
- **내용**: `player_inventory` 테이블, RLS, 자동 업데이트 트리거, 인벤토리 통계 함수

## 적용 방법

### A. Supabase 대시보드

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 → **SQL Editor**
2. `20260130120000_game_inventory_system.sql` 내용 복사 후 붙여넣기 → **Run**

### B. Supabase CLI

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### C. Supabase MCP (Cursor)

`apply_migration` 도구로 해당 SQL 파일 내용 적용.

## 확인

- **Table Editor**에서 `player_inventory` 테이블 생성 여부 확인
- 게임 실행 → 로그인 → 플레이 후 새로고침하여 데이터 유지 확인

## 문제 해결

| 오류 | 조치 |
|------|------|
| relation already exists | 이미 적용됨. 필요 시 `DROP TABLE IF EXISTS public.player_inventory CASCADE;` 후 재실행 |
| permission denied | RLS 정책 확인 후 마이그레이션 재실행 |
| 저장 안 됨 | `.env`(VITE_SUPABASE_URL, ANON_KEY), 로그인 상태, 콘솔 오류 확인 |

## 데이터 구조 (player_inventory)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| current_level, current_experience, current_wave, current_score | int/bigint | 진행 상황 |
| stats, stat_points, class_type | jsonb/int/text | 스탯·직업 |
| equipped_weapon_id, equipped_weapon_upgrade_level | text/int | 장착 무기 |
| weapons, equipped_skills, available_skills, artifacts, equipped_artifacts | jsonb | 인벤토리 |
| difficulty, last_saved_at, created_at, updated_at | text/timestamptz | 메타 |

- RLS: 본인 인벤토리만 조회/수정. 사용자당 1개(UNIQUE).
