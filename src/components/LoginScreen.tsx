import { useState } from 'react';
import { supabase, signIn } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X, Mail, Lock, LogIn } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginScreenProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginScreen({ onClose, onSuccess }: LoginScreenProps) {
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
        <div className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-2xl p-8 border-2 border-purple-500/50 max-w-md w-full text-center shadow-2xl shadow-purple-950/50">
          <p className="text-slate-400 mb-6">Supabase가 설정되지 않아 로그인을 사용할 수 없습니다.</p>
          <Button onClick={onClose} className="rounded-xl bg-purple-600 hover:bg-purple-500">닫기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/40 to-slate-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl shadow-purple-950/50 max-w-md w-full overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-purple-900/70 to-slate-800/80 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg">
              <LogIn className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">로그인</h2>
              <p className="text-xs text-slate-400 mt-0.5">계정으로 접속하기</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-600/50">
            세션은 브라우저에 저장되어 다음 방문 시 자동 로그인됩니다.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="example@email.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/90 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                autoComplete="email"
              />
            </div>
            {email.trim() && !emailValid && (
              <p className="text-xs text-red-400">올바른 이메일 형식이 아닙니다.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="비밀번호"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/90 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-950/50 border border-red-500/40 px-4 py-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-2 border-slate-500/50 text-slate-300 hover:bg-slate-700/80 hover:text-white hover:border-slate-500"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={submitting || !emailValid || !password}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-950/50"
            >
              {submitting ? '로그인 중...' : '로그인'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
