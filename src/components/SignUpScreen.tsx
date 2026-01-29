import { useState, useCallback } from 'react';
import { supabase, checkEmailAvailable, checkNicknameAvailable, signUpWithEmail } from '@/lib/supabase';
import {
  isValidEmail,
  isValidPassword,
  getPasswordErrorMessage,
  isValidNicknameLength,
  NICKNAME_MIN_LENGTH,
  NICKNAME_MAX_LENGTH,
  isNicknameAppropriate,
} from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { X, Mail, User, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface SignUpScreenProps {
  onClose: () => void;
}

export function SignUpScreen({ onClose }: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [emailCheck, setEmailCheck] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const [nickname, setNickname] = useState('');
  const [nicknameCheck, setNicknameCheck] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid' | 'inappropriate'>('idle');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailCheck = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailCheck('invalid');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailCheck('invalid');
      return;
    }
    setEmailCheck('checking');
    setSubmitError('');
    try {
      const available = await checkEmailAvailable(trimmed);
      setEmailCheck(available ? 'ok' : 'taken');
    } catch {
      setEmailCheck('idle');
    }
  }, [email]);

  const handleNicknameCheck = useCallback(async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameCheck('invalid');
      return;
    }
    if (!isValidNicknameLength(trimmed)) {
      setNicknameCheck('invalid');
      return;
    }
    const appropriate = isNicknameAppropriate(trimmed);
    if (!appropriate.ok) {
      setNicknameCheck('inappropriate');
      return;
    }
    setNicknameCheck('checking');
    setSubmitError('');
    try {
      const available = await checkNicknameAvailable(trimmed);
      setNicknameCheck(available ? 'ok' : 'taken');
    } catch {
      setNicknameCheck('idle');
    }
  }, [nickname]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(value ? getPasswordErrorMessage(value) : '');
  };

  const handlePasswordConfirmChange = (value: string) => {
    setPasswordConfirm(value);
    setConfirmError(value && password !== value ? '비밀번호가 일치하지 않습니다.' : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();

    if (!trimmedEmail) {
      setSubmitError('이메일을 입력하세요.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setSubmitError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (emailCheck !== 'ok') {
      setSubmitError('이메일 중복 확인을 완료하세요.');
      return;
    }
    if (!trimmedNickname) {
      setSubmitError('닉네임을 입력하세요.');
      return;
    }
    if (!isValidNicknameLength(trimmedNickname)) {
      setSubmitError(`닉네임은 ${NICKNAME_MIN_LENGTH}~${NICKNAME_MAX_LENGTH}자로 입력하세요.`);
      return;
    }
    const appropriate = isNicknameAppropriate(trimmedNickname);
    if (!appropriate.ok) {
      setSubmitError(appropriate.reason || '부적절한 닉네임입니다.');
      return;
    }
    if (nicknameCheck !== 'ok') {
      setSubmitError('닉네임 중복 확인을 완료하세요.');
      return;
    }
    if (!isValidPassword(password)) {
      setPasswordError(getPasswordErrorMessage(password) || '비밀번호 조건을 확인하세요.');
      setSubmitError('비밀번호는 8자 이상, 영어·특수문자를 포함해야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setConfirmError('비밀번호가 일치하지 않습니다.');
      setSubmitError('비밀번호 재확인을 확인하세요.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signUpWithEmail(trimmedEmail, password, trimmedNickname);
      if (error) {
        setSubmitError(error);
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setSubmitError('가입 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!supabase) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 rounded-2xl p-8 border-2 border-slate-600 max-w-md w-full text-center">
          <p className="text-gray-400 mb-4">회원가입을 사용하려면 Supabase를 설정해 주세요.</p>
          <Button onClick={onClose} variant="secondary">닫기</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 rounded-2xl p-8 border-2 border-green-600 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">가입 완료</h2>
          <p className="text-gray-400 text-sm mb-6">
            입력한 이메일로 인증 메일을 보냈습니다. 메일의 링크를 클릭하면 로그인할 수 있습니다.
          </p>
          <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">닫기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border-4 border-purple-600 shadow-2xl max-w-md w-full my-8">
        <div className="flex items-center justify-between p-4 border-b border-slate-600/50">
          <h2 className="text-xl font-bold text-white">회원가입</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 이메일 */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">이메일</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailCheck('idle'); }}
                  onBlur={() => email.trim() && !isValidEmail(email.trim()) && setEmailCheck('invalid')}
                  placeholder="example@email.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleEmailCheck} disabled={emailCheck === 'checking'} className="shrink-0 bg-slate-700 hover:bg-slate-600">
                {emailCheck === 'checking' ? '확인 중...' : '중복 확인'}
              </Button>
            </div>
            {emailCheck === 'ok' && <p className="text-green-400 text-xs mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 사용 가능한 이메일입니다.</p>}
            {emailCheck === 'taken' && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 이미 가입된 이메일입니다.</p>}
            {emailCheck === 'invalid' && email.trim() && <p className="text-amber-400 text-xs mt-1">올바른 이메일 형식이 아닙니다.</p>}
          </div>

          {/* 닉네임 */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">닉네임 (2~20자, 한글·영문·숫자·밑줄)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => { setNickname(e.target.value.slice(0, NICKNAME_MAX_LENGTH)); setNicknameCheck('idle'); }}
                  placeholder="닉네임"
                  autoComplete="username"
                  maxLength={NICKNAME_MAX_LENGTH}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleNicknameCheck} disabled={nicknameCheck === 'checking'} className="shrink-0 bg-slate-700 hover:bg-slate-600">
                {nicknameCheck === 'checking' ? '확인 중...' : '중복 확인'}
              </Button>
            </div>
            {nicknameCheck === 'ok' && <p className="text-green-400 text-xs mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 사용 가능한 닉네임입니다.</p>}
            {nicknameCheck === 'taken' && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 이미 사용 중인 닉네임입니다.</p>}
            {nicknameCheck === 'invalid' && nickname.trim() && <p className="text-amber-400 text-xs mt-1">닉네임은 2~20자로 입력하세요.</p>}
            {nicknameCheck === 'inappropriate' && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 부적절한 닉네임입니다. (욕설·비하·성적 표현 불가)</p>}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">비밀번호 (8자 이상, 영어·특수문자 포함)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="비밀번호"
                autoComplete="new-password"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {passwordError && <p className="text-amber-400 text-xs mt-1">{passwordError}</p>}
          </div>

          {/* 비밀번호 재확인 */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">비밀번호 재확인</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => handlePasswordConfirmChange(e.target.value)}
                placeholder="비밀번호 다시 입력"
                autoComplete="new-password"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {confirmError && <p className="text-red-400 text-xs mt-1">{confirmError}</p>}
          </div>

          {submitError && (
            <div className="rounded-lg bg-red-950/50 border border-red-600/50 px-3 py-2 text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-700 h-11">
            {submitting ? '가입 처리 중...' : '가입하기'}
          </Button>
        </form>
      </div>
    </div>
  );
}
