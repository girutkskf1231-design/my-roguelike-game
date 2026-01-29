# Supabase 설정 (로그인 / 회원가입)

이 프로젝트는 **Supabase**로 로그인·회원가입, 리더보드, 프로필을 사용합니다.

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

## 4. 데이터베이스 (이미 마이그레이션된 경우)

다음은 Supabase MCP 또는 SQL Editor로 적용된 마이그레이션입니다. 새 프로젝트라면 Supabase 대시보드 **SQL Editor**에서 순서대로 실행하세요.

- **profiles** 테이블 (닉네임, 아바타 등)
- **game_scores** 테이블 (리더보드)
- **handle_new_user** 트리거 (가입 시 profiles 자동 생성)
- **nickname_available** RPC (닉네임 중복 확인)
- **profiles.mobile_settings** 컬럼 (모바일 설정)

RLS 정책으로 `profiles`는 본인만, `game_scores`는 인증 사용자만 insert 가능하도록 설정되어 있어야 합니다.

## 5. 동작 확인

- 메인 메뉴에서 **회원가입** → 이메일·닉네임·비밀번호 입력 후 가입
- **로그인** → 이메일·비밀번호로 로그인
- 로그인 후 **내 정보**, 리더보드 점수 제출 등 동작 확인
