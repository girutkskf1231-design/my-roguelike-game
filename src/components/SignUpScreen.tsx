import { useState } from 'react';
import { supabase, checkNicknameAvailable, signUp } from '@/lib/supabase';
import { isInappropriateNickname, hasNicknameForbiddenChars } from '@/lib/nicknameBlocklist';
import { validatePassword, PASSWORD_HINT } from '@/lib/passwordRules';
import { Button } from '@/components/ui/button';
import { X, Mail, User, Lock, CheckCircle, XCircle } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignUpScreenProps {
  onClose: () => void;
}

export function SignUpScreen({ onClose }: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [emailCheckMessage, setEmailCheckMessage] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<'available' | 'taken' | 'checking' | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const pwValidation = validatePassword(password);
  const passwordMatch = !passwordConfirm || password === passwordConfirm;
  const emailValid = !email || EMAIL_REGEX.test(email.trim());
  const nicknameInappropriate = nickname.trim() && isInappropriateNickname(nickname);
  const nicknameForbiddenChars = nickname.trim() && hasNicknameForbiddenChars(nickname);

  const handleEmailCheck = () => {
    if (!email.trim()) {
      setEmailCheckMessage('이메일을 입력해 주세요.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailCheckMessage('올바른 이메일 형식이 아닙니다.');
      return;
    }
    setEmailCheckMessage('이메일 중복은 회원가입 시도 시 자동으로 확인됩니다. 가입하기를 눌러 주세요.');
  };

  const handleNicknameCheck = async () => {
    const n = nickname.trim();
    if (!n) {
      setNicknameCheckMessage(null);
      return;
    }
    if (hasNicknameForbiddenChars(n)) {
      setNicknameCheckMessage('taken');
      return;
    }
    if (isInappropriateNickname(n)) {
      setNicknameCheckMessage('taken');
      return;
    }
    setNicknameCheckMessage('checking');
    const available = await checkNicknameAvailable(n);
    setNicknameCheckMessage(available ? 'available' : 'taken');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const eTrim = email.trim();
    const nTrim = nickname.trim();
    if (!eTrim) {
      setSubmitError('이메일을 입력해 주세요.');
      return;
    }
    if (!EMAIL_REGEX.test(eTrim)) {
      setSubmitError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (!nTrim) {
      setSubmitError('닉네임을 입력해 주세요.');
      return;
    }
    if (nTrim.length < 2 || nTrim.length > 20) {
      setSubmitError('닉네임은 2~20자로 입력해 주세요.');
      return;
    }
    if (hasNicknameForbiddenChars(nTrim)) {
      setSubmitError('닉네임에는 이모티콘과 특수문자를 사용할 수 없습니다.');
      return;
    }
    if (isInappropriateNickname(nTrim)) {
      setSubmitError('부적절한 닉네임은 사용할 수 없습니다.');
      return;
    }
    if (!pwValidation.valid) {
      setSubmitError(PASSWORD_HINT);
      return;
    }
    if (password !== passwordConfirm) {
      setSubmitError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setSubmitting(true);
    const result = await signUp({ email: eTrim, password, nickname: nTrim });
    setSubmitting(false);
    if (result.ok) {
      setSuccess(true);
    } else {
      if (result.error === 'email_taken') setSubmitError('이미 가입된 이메일입니다.');
      else if (result.error === 'nickname_taken') setSubmitError('이미 사용 중인 닉네임입니다.');
      else setSubmitError(result.error || '가입에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  if (!supabase) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 rounded-2xl p-8 border-2 border-slate-600 max-w-md w-full text-center">
          <p className="text-gray-400 mb-4">Supabase가 설정되지 않아 회원가입을 사용할 수 없습니다.</p>
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 rounded-2xl p-8 border-2 border-green-600 max-w-md w-full text-center">
          <div className="text-5xl mb-4 text-green-400">✓</div>
          <h2 className="text-xl font-bold text-white mb-2">가입 완료</h2>
          <p className="text-gray-400 mb-6">이메일 인증 링크가 발송되었을 수 있습니다. 로그인 후 이용해 주세요.</p>
          <Button onClick={onClose} className="w-full">닫기</Button>
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
            <label className="text-sm text-gray-400 block mb-1">이메일</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailCheckMessage(null); }}
                  placeholder="example@email.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoComplete="email"
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleEmailCheck} className="shrink-0">
                중복 확인
              </Button>
            </div>
            {emailCheckMessage && (
              <p className="text-xs text-cyan-400 mt-1">{emailCheckMessage}</p>
            )}
            {email && !emailValid && <p className="text-xs text-red-400 mt-1">올바른 이메일 형식이 아닙니다.</p>}
          </div>

          {/* 닉네임 */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">닉네임 (2~20자)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => { setNickname(e.target.value); setNicknameCheckMessage(null); }}
                  placeholder="닉네임"
                  maxLength={20}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoComplete="username"
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleNicknameCheck} disabled={nicknameCheckMessage === 'checking'} className="shrink-0">
                {nicknameCheckMessage === 'checking' ? '확인 중...' : '중복 확인'}
              </Button>
            </div>
            {nicknameCheckMessage === 'available' && (
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 사용 가능한 닉네임입니다.</p>
            )}
            {nicknameCheckMessage === 'taken' && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> 이미 사용 중이거나 사용할 수 없는 닉네임입니다.</p>
            )}
            {nicknameForbiddenChars && (
              <p className="text-xs text-red-400 mt-1">닉네임에는 이모티콘과 특수문자를 사용할 수 없습니다.</p>
            )}
            {nicknameInappropriate && !nicknameForbiddenChars && (
              <p className="text-xs text-red-400 mt-1">부적절한 닉네임은 사용할 수 없습니다.</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">비밀번호 (8자 이상, 영어·특수문자 포함)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={PASSWORD_HINT}
                minLength={8}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoComplete="new-password"
              />
            </div>
            {password && (
              <ul className="text-xs mt-1 space-y-0.5 text-gray-400">
                <li className={pwValidation.minLength ? 'text-green-400' : ''}>8자 이상</li>
                <li className={pwValidation.hasLetter ? 'text-green-400' : ''}>영어 포함</li>
                <li className={pwValidation.hasSpecial ? 'text-green-400' : ''}>특수문자 포함</li>
              </ul>
            )}
          </div>

          {/* 비밀번호 재확인 */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">비밀번호 재확인</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 다시 입력"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoComplete="new-password"
              />
            </div>
            {passwordConfirm && !passwordMatch && (
              <p className="text-xs text-red-400 mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-400 bg-red-950/50 rounded-lg p-2">{submitError}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? '가입 중...' : '가입하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
