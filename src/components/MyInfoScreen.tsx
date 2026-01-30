import { useState, useRef, useEffect } from 'react';
import { supabase, updateProfileNickname, uploadAvatar, checkNicknameAvailable, AVATAR_MAX_BYTES } from '@/lib/supabase';
import { hasNicknameForbiddenChars } from '@/lib/nicknameBlocklist';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { StatisticsContent } from '@/components/StatisticsScreen';
import { Button } from '@/components/ui/button';
import { X, User, Camera, LogOut, TrendingUp } from 'lucide-react';

/** 프로필 사진 표시 최대 크기(px). 업로드 제한은 AVATAR_MAX_BYTES(90KB). */
const MAX_AVATAR_PX = 300;

interface MyInfoScreenProps {
  onClose: () => void;
  /** 로그아웃 후 호출 (예: 로그인/회원가입 화면으로 이동) */
  onAfterLogout?: () => void;
}

export function MyInfoScreen({ onClose, onAfterLogout }: MyInfoScreenProps) {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const showToast = useToast();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  useEffect(() => {
    setNickname(profile?.nickname ?? '');
  }, [profile?.nickname]);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nicknameDirty = nickname.trim() !== (profile?.nickname ?? '');
  const nicknameInvalid = nickname.trim() && (hasNicknameForbiddenChars(nickname) || nickname.trim().length < 2);

  const handleSaveNickname = async () => {
    if (!user?.id || !nicknameDirty) return;
    const n = nickname.trim();
    if (n.length < 2) {
      setNicknameError('닉네임은 2자 이상 입력해 주세요.');
      return;
    }
    if (hasNicknameForbiddenChars(n)) {
      setNicknameError('이모티콘과 특수문자는 사용할 수 없습니다.');
      return;
    }
    const available = await checkNicknameAvailable(n);
    if (!available && n !== profile?.nickname) {
      setNicknameError('이미 사용 중인 닉네임입니다.');
      return;
    }
    setNicknameError(null);
    setNicknameSaving(true);
    const result = await updateProfileNickname(user.id, n);
    setNicknameSaving(false);
    if (result.ok) {
      await refreshProfile();
    } else {
      setNicknameError(result.error ?? '저장에 실패했습니다.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    e.target.value = '';
    setAvatarError(null);
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError(`프로필 사진은 ${AVATAR_MAX_BYTES / 1000}KB 이하여야 합니다.`);
      return;
    }
    setAvatarUploading(true);
    const result = await uploadAvatar(user.id, file);
    setAvatarUploading(false);
    if (result.ok) {
      await refreshProfile();
    } else {
      setAvatarError(result.error ?? '업로드에 실패했습니다.');
    }
  };

  if (!supabase || !user) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900/40 to-slate-900 rounded-2xl p-8 border-2 border-purple-500/50 max-w-md w-full text-center shadow-2xl shadow-purple-950/50">
          <div className="w-16 h-16 rounded-full bg-slate-700/80 border-2 border-slate-600 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 mb-6">로그인 후 내 정보를 이용할 수 있습니다.</p>
          <Button onClick={onClose} className="rounded-xl bg-purple-600 hover:bg-purple-500">닫기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/40 to-slate-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl shadow-purple-950/50 max-w-2xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-purple-900/70 to-slate-800/80 border-b border-purple-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center border border-purple-500/30 shadow-lg">
              <User className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">내 정보</h2>
              <p className="text-xs text-slate-400 mt-0.5">프로필 · 통계 · 로그아웃</p>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 프로필: 사진 + 닉네임 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4" />
              프로필
            </h3>
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-600/50 space-y-5">
              {/* 프로필 사진: 표시 최대 300px, 업로드 최대 90KB(AVATAR_MAX_BYTES) */}
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div
                    className="w-[120px] h-[120px] rounded-full bg-slate-700/80 border-4 border-purple-500/40 overflow-hidden flex items-center justify-center shadow-lg ring-2 ring-slate-600/50"
                    style={{ maxWidth: MAX_AVATAR_PX, maxHeight: MAX_AVATAR_PX }}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="프로필"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-500" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-slate-600 hover:bg-slate-500 border-2 border-slate-500 shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400 mb-1">프로필 사진 (최대 {AVATAR_MAX_BYTES / 1000}KB)</p>
                  {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
                  {avatarUploading && <p className="text-xs text-cyan-400">업로드 중...</p>}
                </div>
              </div>

              {/* 닉네임 수정 (리더보드 등재 닉네임도 함께 수정됨) */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">닉네임 (수정 시 리더보드에 등재된 닉네임도 수정됩니다)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => { setNickname(e.target.value); setNicknameError(null); }}
                    placeholder="닉네임"
                    maxLength={20}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                  <Button
                    onClick={handleSaveNickname}
                    disabled={!nicknameDirty || nicknameInvalid || nicknameSaving}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-purple-950/50 shrink-0"
                  >
                    {nicknameSaving ? '저장 중...' : '저장'}
                  </Button>
                </div>
                {nicknameError && <p className="text-xs text-red-400">{nicknameError}</p>}
                {nicknameInvalid && !nicknameError && (
                  <p className="text-xs text-amber-400">이모티콘·특수문자 불가, 2자 이상</p>
                )}
              </div>
            </div>
          </section>

          {/* 통계 (localStorage 기반 게임 통계) */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              통계
            </h3>
            <StatisticsContent />
          </section>

          {/* 로그아웃 */}
          <section className="pt-2 border-t border-slate-600/50">
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                showToast('로그아웃되었습니다.', 'success');
                (onAfterLogout ?? onClose)();
              }}
              className="w-full h-12 rounded-xl border-2 border-slate-500/50 text-slate-300 hover:bg-slate-700/80 hover:text-white hover:border-slate-500 flex items-center justify-center gap-2 font-semibold"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
