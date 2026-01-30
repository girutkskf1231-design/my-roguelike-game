# Supabase 설정 가이드

## 개요

- **회원가입/로그인** (이메일 + 비밀번호), **프로필** (닉네임, 아바타), **리더보드**, **게임 인벤토리 자동 저장** (30초마다·중요 변경 시, 무제한 무기·진행 상황 복구)

## 체크리스트

| 단계 | 작업 | 완료 |
|------|------|------|
| 1 | Supabase 프로젝트 생성 | ☐ |
| 2 | **Settings → API**에서 Project URL, anon key 확인 | ☐ |
| 3 | 프로젝트 루트에 `.env` 생성, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 | ☐ |
| 4 | **Authentication → Providers**에서 Email 활성화 확인 | ☐ |
| 5 | `supabase/migrations/` SQL **순서대로** 실행 (profiles, game_scores, avatars 등) | ☐ |
| 6 | `npm run dev` 재시작 후 메인 메뉴에서 **회원가입** → **로그인** 테스트 | ☐ |

`.env`가 없거나 값이 비어 있으면 **로그인/회원가입**이 비활성화되고, "Supabase가 설정되지 않아..." 메시지가 표시됩니다.

---

## 1. 프로젝트 생성

1. [Supabase](https://supabase.com) 로그인 후 **New project** 생성
2. Organization, 프로젝트 이름, 비밀번호 입력 후 생성 완료 대기

## 2. 환경 변수 설정

1. **Settings → API**에서 다음 값을 확인:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API keys → anon public** → `VITE_SUPABASE_ANON_KEY`

2. 프로젝트 루트에 `.env` 파일 생성 (`.env.example` 복사 후 값 채우기):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. 개발 서버 재시작: `npm run dev`

## 3. 인증(로그인/회원가입) 설정

1. **Authentication → Providers**에서 **Email** 사용 설정 확인 (기본 활성화)
2. (선택) **Authentication → URL Configuration**에서 **Site URL**을 로컬/배포 주소로 설정

이메일·비밀번호 로그인/회원가입은 위 설정만으로 동작합니다.

## 4. 데이터베이스 마이그레이션

마이그레이션 파일은 `supabase/migrations/`에 있으며, **순서대로** 적용해야 합니다.

| 파일 | 내용 |
|------|------|
| `20260130100000_profiles_game_scores_auth.sql` | profiles, game_scores, handle_new_user, nickname_available, RLS, 닉네임 동기화 트리거 |
| `20260130100001_avatars_storage.sql` | avatars 스토리지 버킷(90KB 제한) 및 정책 |

### 방법 A: Supabase 대시보드 SQL Editor

1. **SQL Editor**에서 각 파일 내용을 열어 **순서대로** 실행
2. 에러 없이 완료되면 다음 파일 실행

### 방법 B: Supabase MCP (Cursor)

1. **djwida**에서 Supabase MCP가 연결된 프로젝트 사용 (`.cursor/mcp.json`에 `supabase` 서버 설정됨)
2. MCP **apply_migration**으로 각 마이그레이션 적용:
   - `name`: `profiles_game_scores_auth` / `avatars_storage` (snake_case)
   - `query`: 해당 SQL 파일 전체 내용
3. **list_migrations**로 적용 여부 확인

### 적용 결과

profiles, game_scores, player_inventory(RLS), handle_new_user, nickname_available RPC, get_inventory_stats RPC, avatars 버킷.

## 5. 이메일 rate limit (email rate limit exceeded 시)

기본 Supabase 이메일 발송 한도는 매우 낮아 회원가입/비밀번호 재설정 시 **"email rate limit exceeded"** 가 나올 수 있습니다.

### 방법 A: 스크립트로 상향 (Management API)

1. [Supabase 대시보드 → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)에서 **Personal Access Token** 생성
2. `.env`에 추가: `SUPABASE_ACCESS_TOKEN=발급한_토큰`
3. 터미널에서 실행 (예: 시간당 30통):
   ```bash
   node scripts/update-auth-rate-limit.mjs 30
   ```

### 방법 B: 대시보드에서 수동 변경

1. **Authentication → Rate Limits** 이동  
   `https://supabase.com/dashboard/project/<프로젝트_REF>/auth/rate-limits`
2. **Email sent** 값을 원하는 한도로 변경 (예: 30)

---

## 6. 동작 확인

- 메인 메뉴에서 **회원가입** → 이메일·닉네임·비밀번호 입력 → 닉네임 **중복 확인** 후 가입
- 가입 완료 시 **로그인하기** 클릭 → **로그인** 모달에서 이메일·비밀번호로 로그인
- 로그인 후 **내 정보**, 리더보드 점수 제출 등 동작 확인
- 세션은 **localStorage**에 저장되며, 새로고침 후에도 로그인 상태 유지