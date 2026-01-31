-- nickname_available RPC 호출 권한 (anon, authenticated)
-- 이 마이그레이션이 없으면 "닉네임 확인 중 오류가 발생했습니다" 발생할 수 있음
GRANT EXECUTE ON FUNCTION public.nickname_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.nickname_available(text) TO authenticated;
