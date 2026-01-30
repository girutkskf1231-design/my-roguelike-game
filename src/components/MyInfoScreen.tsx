import { useState, useRef, useEffect } from 'react';
import { supabase, updateProfileNickname, uploadAvatar, checkNicknameAvailable, AVATAR_MAX_BYTES } from '@/lib/supabase';
import { hasNicknameForbiddenChars } from '@/lib/nicknameBlocklist';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { StatisticsContent } from '@/components/StatisticsScreen';
import { Button } from '@/components/ui/button';
import { X, User, Camera, LogOut } from 'lucide-react';

/** 프로필 사진 표시 최대 크기(px). 업로드 제한은 AVATAR_MAX_BYTES(90KB). */
const MAX_AVATAR_PX = 300;

interface MyInfoScreenProps {
  onClose: () => void;
  /** 로그아웃 후 호출 (예: 로그인/회원가입 화면으로 이동) */
  onAfterLogout?: () => void;
}

export function MyInfoScreen({ onClose, onAfterLogout }: MyInfoScreenProps) {
  const { user, profile, loading, refreshProfile, signOut, ensureProfileForCurrentUser } = useAuth();
  const showToast = useToast();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const ensuredOnce = useRef(false);

  useEffect(() => {
    setNickname(profile?.nickname ?? '');
  }, [profile?.nickname]);

  // 로그인됐는데 프로필이 없을 때(자동 로그인/로그인 직후 ensure 실패 등) 한 번 프로필 생성 시도
  useEffect(() => {
    if (!user?.id || profile != null || loading || ensuredOnce.current) return;
    ensuredOnce.current = true;
    ensureProfileForCurrentUser();
  }, [user?.id, profile, loading, ensureProfileForCurrentUser]);
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
    // 프로필 행이 없을 수 있음(자동 로그인/ensure 실패) → 저장 전 한 번 ensure
    if (!profile) await ensureProfileForCurrentUser();
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

  if (!supabase) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 rounded-2xl p-8 border-2 border-slate-600 max-w-md w-full text-center">
          <p className="text-gray-400 mb-4">로그인 후 내 정보를 이용할 수 있습니다.</p>
          <Button onClick={onClose} className="rounded-xl">닫기</Button>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 rounded-2xl p-8 border-2 border-slate-600 max-w-md w-full text-center">
          <p className="text-gray-400 mb-4">로그인 정보를 확인하는 중...</p>
          <Button onClick={onClose} className="rounded-xl" disabled>닫기</Button>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 rounded-2xl p-8 border-2 border-slate-600 max-w-md w-full text-center">
          <p className="text-gray-400 mb-4">로그인 후 내 정보를 이용할 수 있습니다.</p>
          <Button onClick={onClose} className="rounded-xl">닫기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border-4 border-purple-600 shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-600/50 shrink-0">
          <h2 className="text-xl font-bold text-white">내 정보</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 프로필: 사진 + 닉네임 */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              프로필
            </h3>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/50 space-y-4">
              {/* 프로필 사진: 표시 최대 300px, 업로드 최대 90KB(AVATAR_MAX_BYTES) */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div
                    className="w-[120px] h-[120px] rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden flex items-center justify-center"
                    style={{ maxWidth: MAX_AVATAR_PX, maxHeight: MAX_AVATAR_PX }}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="프로필"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-500" />
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
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-slate-600 hover:bg-slate-500"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">프로필 사진 (최대 {AVATAR_MAX_BYTES / 1000}KB)</p>
                  {avatarError && <p className="text-xs text-red-400 mt-1">{avatarError}</p>}
                  {avatarUploading && <p className="text-xs text-cyan-400 mt-1">업로드 중...</p>}
                </div>
              </div>

              {/* 닉네임 수정 (리더보드 등재 닉네임도 함께 수정됨) */}
              {!profile && user && (
                <p className="text-xs text-amber-400/90">프로필을 불러오지 못했습니다. 닉네임을 입력한 뒤 저장해 보세요.</p>
              )}
              <div>
                <label className="text-xs text-gray-400 block mb-1">닉네임 (수정 시 리더보드에 등재된 닉네임도 수정됩니다)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => { setNickname(e.target.value); setNicknameError(null); }}
                    placeholder="닉네임"
                    maxLength={20}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Button
                    onClick={handleSaveNickname}
                    disabled={!nicknameDirty || nicknameInvalid || nicknameSaving}
                  >
                    {nicknameSaving ? '저장 중...' : '저장'}
                  </Button>
                </div>
                {nicknameError && <p className="text-xs text-red-400 mt-1">{nicknameError}</p>}
                {nicknameInvalid && !nicknameError && (
                  <p className="text-xs text-amber-400 mt-1">이모티콘·특수문자 불가, 2자 이상</p>
                )}
              </div>
            </div>
          </section>

          {/* 통계 (localStorage 기반 게임 통계) */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
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
              className="w-full h-12 rounded-xl border-slate-500/50 text-gray-300 hover:bg-slate-800 hover:text-white flex items-center justify-center gap-2"
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
