# 🔄 데이터베이스 마이그레이션 가이드

## 📋 개요

이 가이드는 Supabase 데이터베이스에 게임 인벤토리 시스템을 추가하는 방법을 설명합니다.

## 🎯 마이그레이션 목적

### 문제점
- ❌ 게임 데이터가 로컬에만 저장되어 브라우저 캐시 삭제 시 손실
- ❌ 여러 기기에서 게임 진행 상황 공유 불가
- ❌ 인벤토리 용량 표시 오류 ("280/200" 등)

### 해결 방법
- ✅ Supabase에 게임 인벤토리 저장
- ✅ 자동 동기화 (30초마다)
- ✅ 무제한 무기 저장
- ✅ 진행 상황 복구

## 📦 마이그레이션 파일

### 1. `20260130120000_game_inventory_system.sql`

**위치**: `supabase/migrations/20260130120000_game_inventory_system.sql`

**내용**:
- `player_inventory` 테이블 생성
- RLS (Row Level Security) 정책 설정
- 자동 업데이트 트리거
- 인벤토리 통계 조회 함수

**저장되는 데이터**:
- 플레이어 레벨, 경험치, 스탯
- 보유 무기 목록 (강화 레벨 포함)
- 장착된 무기, 스킬, 아티팩트
- 현재 웨이브, 점수, 난이도

## 🚀 마이그레이션 적용 방법

### 방법 A: Supabase 대시보드 (권장)

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **SQL Editor** 메뉴 클릭
4. **New query** 클릭
5. `supabase/migrations/20260130120000_game_inventory_system.sql` 파일 내용 복사
6. SQL Editor에 붙여넣기
7. **Run** 버튼 클릭
8. 에러 없이 완료되면 성공!

### 방법 B: Supabase CLI

```bash
# Supabase CLI 설치 (없는 경우)
npm install -g supabase

# 프로젝트 링크
supabase link --project-ref your-project-ref

# 마이그레이션 적용
supabase db push
```

### 방법 C: Supabase MCP (Cursor)

1. Cursor에서 프로젝트 열기
2. AI에게 다음과 같이 요청:

```
@djwida 폴더의 supabase/migrations/20260130120000_game_inventory_system.sql 파일을 
Supabase MCP의 apply_migration 도구를 사용하여 적용해줘
```

## ✅ 마이그레이션 확인

### 1. 테이블 확인

Supabase 대시보드에서:
1. **Table Editor** 메뉴 클릭
2. `player_inventory` 테이블이 생성되었는지 확인

### 2. SQL로 확인

```sql
-- 테이블 존재 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'player_inventory'
);

-- 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'player_inventory';

-- RLS 정책 확인
SELECT * FROM pg_policies 
WHERE tablename = 'player_inventory';
```

### 3. 게임에서 확인

1. 게임 실행
2. 로그인
3. 게임 플레이 (무기 획득, 레벨업 등)
4. 브라우저 콘솔에서 저장 로그 확인:
   - `✅ 인벤토리 저장 완료`
5. 브라우저 새로고침 후 데이터 유지 확인

## 🔧 문제 해결

### 오류: "relation already exists"

이미 테이블이 존재하는 경우입니다. 다음 중 하나를 선택:

1. **기존 테이블 삭제 후 재생성** (데이터 손실 주의!)
```sql
DROP TABLE IF EXISTS public.player_inventory CASCADE;
```
그 후 마이그레이션 다시 실행

2. **기존 테이블 유지**
이미 적용되었으므로 추가 작업 불필요

### 오류: "permission denied"

RLS 정책 문제일 수 있습니다:

```sql
-- RLS 정책 재설정
DROP POLICY IF EXISTS "Users can read own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.player_inventory;
```

그 후 마이그레이션 다시 실행

### 게임에서 저장이 안 됨

1. `.env` 파일에 Supabase 설정 확인
2. 로그인 상태 확인
3. 브라우저 콘솔에서 오류 메시지 확인
4. Supabase 대시보드에서 RLS 정책 확인

## 📊 데이터 구조

### player_inventory 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | 기본 키 |
| user_id | uuid | 사용자 ID (외래 키) |
| current_level | int | 현재 레벨 |
| current_experience | bigint | 현재 경험치 |
| current_wave | int | 현재 웨이브 |
| current_score | bigint | 현재 점수 |
| current_health | int | 현재 체력 |
| max_health | int | 최대 체력 |
| stats | jsonb | 스탯 (힘, 체력, 민첩 등) |
| stat_points | int | 사용 가능한 스탯 포인트 |
| class_type | text | 직업 |
| equipped_weapon_id | text | 장착된 무기 ID |
| equipped_weapon_upgrade_level | int | 장착된 무기 강화 레벨 |
| weapons | jsonb | 보유 무기 목록 |
| equipped_skills | jsonb | 장착된 스킬 (최대 3개) |
| available_skills | jsonb | 보유 스킬 목록 |
| artifacts | jsonb | 보유 아티팩트 목록 |
| equipped_artifacts | jsonb | 장착된 아티팩트 (최대 3개) |
| difficulty | text | 난이도 |
| last_saved_at | timestamptz | 마지막 저장 시간 |
| created_at | timestamptz | 생성 시간 |
| updated_at | timestamptz | 업데이트 시간 |

## 🔐 보안

- **RLS (Row Level Security)** 활성화
- 사용자는 자신의 인벤토리만 조회/수정 가능
- 인증되지 않은 사용자는 접근 불가

## 📝 참고사항

- 사용자당 하나의 인벤토리만 존재 (`UNIQUE` 제약)
- `updated_at`은 자동으로 갱신됨 (트리거)
- JSONB 타입 사용으로 유연한 데이터 구조
- 인덱스 최적화로 빠른 조회

## 🆘 추가 도움

문제가 계속되면:
1. [Supabase 문서](https://supabase.com/docs) 참고
2. [Supabase Discord](https://discord.supabase.com) 커뮤니티 문의
3. GitHub 이슈 생성
