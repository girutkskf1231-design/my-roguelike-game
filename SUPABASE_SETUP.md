# Supabase 설정 (로그인 / 회원가입)

이 프로젝트는 **Supabase**로 로그인·회원가입, 리더보드, 프로필을 사용합니다.

## 로그인/회원가입 설정 체크리스트

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

- **profiles**: 닉네임, 아바타, 모바일 설정. RLS로 본인만 조회/수정.
- **game_scores**: 리더보드. 공개 조회, 인증 사용자만 insert.
- **handle_new_user**: 가입 시 profiles 자동 생성 (닉네임 = metadata).
- **nickname_available** RPC: 닉네임 중복 확인.
- **avatars** 버킷: 프로필 사진 업로드 (본인 폴더만).

## 5. 동작 확인

- 메인 메뉴에서 **회원가입** → 이메일·닉네임·비밀번호 입력 → 닉네임 **중복 확인** 후 가입
- 가입 완료 시 **로그인하기** 클릭 → **로그인** 모달에서 이메일·비밀번호로 로그인
- 로그인 후 **내 정보**, 리더보드 점수 제출 등 동작 확인
- 세션은 **localStorage**에 저장되며, 새로고침 후에도 로그인 상태 유지
