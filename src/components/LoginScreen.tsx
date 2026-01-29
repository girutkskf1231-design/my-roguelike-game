import { useState } from 'react';
import { supabase, signIn } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X, Mail, Lock } from 'lucide-react';

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
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 rounded-2xl p-8 border-2 border-slate-600 max-w-md w-full text-center">
          <p className="text-gray-400 mb-4">Supabase가 설정되지 않아 로그인을 사용할 수 없습니다.</p>
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border-4 border-purple-600 shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-600/50">
          <h2 className="text-xl font-bold text-white">로그인</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-gray-400">세션은 브라우저에 저장되어 다음 방문 시 자동 로그인됩니다.</p>

          <div>
            <label className="text-sm text-gray-400 block mb-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="example@email.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoComplete="email"
              />
            </div>
            {email.trim() && !emailValid && (
              <p className="text-xs text-red-400 mt-1">올바른 이메일 형식이 아닙니다.</p>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="비밀번호"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/50 rounded-lg p-2">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={submitting || !emailValid || !password} className="flex-1">
              {submitting ? '로그인 중...' : '로그인'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
