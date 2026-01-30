import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LoginResult } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X, Mail, Lock, LogIn } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginScreenProps {
  /** useAuth().signIn 전달 시 로그인·자동 로그인·내 정보 흐름과 동일한 세션 사용 */
  signIn: (email: string, password: string) => Promise<LoginResult>;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginScreen({ signIn, onClose, onSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = !email.trim() || EMAIL_REGEX.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const eTrim = email.trim();
    if (!eTrim) {
      setError('이메일을 입력해 주세요.');
      return;
    }
    if (!EMAIL_REGEX.test(eTrim)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    const result = await signIn(eTrim, password);
    setSubmitting(false);
    if (result.ok) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error ?? '로그인에 실패했습니다.');
    }
  };

  if (!supabase) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-600 max-w-md w-full text-center shadow-xl">
          <p className="text-slate-400 mb-6">Supabase가 설정되지 않아 로그인을 사용할 수 없습니다.</p>
          <Button onClick={onClose} className="rounded-xl">닫기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-600/80 shadow-2xl max-w-md w-full overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/80 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">로그인</h2>
              <p className="text-xs text-slate-400">계정으로 접속하기</p>
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
          <p className="text-xs text-slate-500">세션은 브라우저에 저장되어 다음 방문 시 자동 로그인됩니다.</p>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="example@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                autoComplete="email"
              />
            </div>
            {email.trim() && !emailValid && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">올바른 이메일 형식이 아닙니다.</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="비밀번호"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-950/40 border border-red-500/30 px-4 py-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-slate-600 text-slate-300 hover:bg-slate-700/80 hover:text-white"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={submitting || !emailValid || !password}
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              {submitting ? '로그인 중...' : '로그인'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
