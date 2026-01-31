-- 닉네임 CHECK 제약 수정: 하이픈(-), 언더스코어(_) 허용 (UI와 일치)
-- 기존: ^[가-힣a-zA-Z0-9 ]+$ (공백만 허용)
-- 수정: ^[가-힣a-zA-Z0-9 \-_]+$ (-, _ 추가)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_nickname_no_emoji_special;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_nickname_no_emoji_special
  CHECK (length(TRIM(BOTH FROM nickname)) >= 2 AND TRIM(BOTH FROM nickname) ~ '^[가-힣a-zA-Z0-9 \-_]+$');
