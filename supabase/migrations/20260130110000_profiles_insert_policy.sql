-- 자동 로그인 시 프로필 행이 없을 때 클라이언트에서 생성할 수 있도록 INSERT 정책 추가
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
