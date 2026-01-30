import { useState } from 'react';
import { supabase, checkNicknameAvailable, signUp } from '@/lib/supabase';
import { isInappropriateNickname, hasNicknameForbiddenChars } from '@/lib/nicknameBlocklist';
import { validatePassword, PASSWORD_HINT } from '@/lib/passwordRules';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { X, Mail, User, Lock, CheckCircle, XCircle, UserPlus, LogIn } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignUpScreenProps {
  onClose: () => void;
  /** 가입 성공 후 로그인 화면으로 넘길 때 호출 (예: 로그인하기 클릭) */
  onSuccess?: () => void;
}

export function SignUpScreen({ onClose, onSuccess }: SignUpScreenProps) {
  const showToast = useToast();
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
      if (result.error === 'email_taken') {
        setSubmitError('이미 가입된 이메일입니다.');
        showToast('이미 가입된 이메일 입니다', 'error');
      } else if (result.error === 'nickname_taken') setSubmitError('이미 사용 중인 닉네임입니다.');
      else setSubmitError(result.error || '가입에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  if (!supabase) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-600 max-w-md w-full text-center shadow-xl">
          <p className="text-slate-400 mb-6">Supabase가 설정되지 않아 회원가입을 사용할 수 없습니다.</p>
          <Button onClick={onClose} className="rounded-xl">닫기</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-600/80 shadow-2xl max-w-md w-full overflow-hidden text-center">
          <div className="p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-9 h-9 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">가입 완료</h2>
            <p className="text-slate-400 text-sm mb-6">이메일 인증 링크가 발송되었을 수 있습니다. 로그인 후 이용해 주세요.</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700/80 hover:text-white"
              >
                닫기
              </Button>
              <Button
                onClick={() => { onSuccess?.(); onClose(); }}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500"
              >
                로그인하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-slate-900 rounded-2xl border border-slate-600/80 shadow-2xl max-w-md w-full my-8 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/80 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">회원가입</h2>
              <p className="text-xs text-slate-400">새 계정 만들기</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 이메일 */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">이메일</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailCheckMessage(null); }}
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  autoComplete="email"
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleEmailCheck} className="shrink-0 rounded-xl h-[42px] px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 border-0">
                중복 확인
              </Button>
            </div>
            {emailCheckMessage && (
              <p className="text-xs text-cyan-400 mt-1.5">{emailCheckMessage}</p>
            )}
            {email && !emailValid && <p className="text-xs text-red-400 mt-1.5">올바른 이메일 형식이 아닙니다.</p>}
          </div>

          {/* 닉네임 */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">닉네임 (2~20자)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => { setNickname(e.target.value); setNicknameCheckMessage(null); }}
                  placeholder="닉네임"
                  maxLength={20}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  autoComplete="username"
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleNicknameCheck} disabled={nicknameCheckMessage === 'checking'} className="shrink-0 rounded-xl h-[42px] px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 border-0">
                {nicknameCheckMessage === 'checking' ? '확인 중...' : '중복 확인'}
              </Button>
            </div>
            {nicknameCheckMessage === 'available' && (
              <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> 사용 가능한 닉네임입니다.</p>
            )}
            {nicknameCheckMessage === 'taken' && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> 이미 사용 중이거나 사용할 수 없는 닉네임입니다.</p>
            )}
            {nicknameForbiddenChars && (
              <p className="text-xs text-red-400 mt-1.5">닉네임에는 이모티콘과 특수문자를 사용할 수 없습니다.</p>
            )}
            {nicknameInappropriate && !nicknameForbiddenChars && (
              <p className="text-xs text-red-400 mt-1.5">부적절한 닉네임은 사용할 수 없습니다.</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">비밀번호 (8자 이상, 영어·특수문자 포함)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={PASSWORD_HINT}
                minLength={8}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                autoComplete="new-password"
              />
            </div>
            {password && (
              <ul className="text-xs mt-2 space-y-1 text-slate-500">
                <li className={pwValidation.minLength ? 'text-emerald-400' : ''}>• 8자 이상</li>
                <li className={pwValidation.hasLetter ? 'text-emerald-400' : ''}>• 영어 포함</li>
                <li className={pwValidation.hasSpecial ? 'text-emerald-400' : ''}>• 특수문자 포함</li>
              </ul>
            )}
          </div>

          {/* 비밀번호 재확인 */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">비밀번호 재확인</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 다시 입력"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                autoComplete="new-password"
              />
            </div>
            {passwordConfirm && !passwordMatch && (
              <p className="text-xs text-red-400 mt-1.5">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {submitError && (
            <div className="rounded-xl bg-red-950/40 border border-red-500/30 px-4 py-3">
              <p className="text-sm text-red-300">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700/80 hover:text-white">
              취소
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
              {submitting ? '가입 중...' : '가입하기'}
            </Button>
          </div>

          <p className="text-center text-sm text-slate-400 pt-2">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => { onSuccess?.(); onClose(); }}
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              로그인
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
