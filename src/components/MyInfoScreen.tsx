import { useState, useRef, useEffect } from 'react';
import { supabase, updateProfileNickname, uploadAvatar, checkNicknameAvailable, ensureProfile, AVATAR_MAX_BYTES } from '@/lib/supabase';
import { hasNicknameForbiddenChars, isInappropriateNickname } from '@/lib/nicknameBlocklist';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { StatisticsContent } from '@/components/StatisticsScreen';
import { Button } from '@/components/ui/button';
import { X, User, Camera, LogOut, Pencil } from 'lucide-react';

/** 프로필 사진 표시 최대 크기(px). 업로드 제한은 AVATAR_MAX_BYTES(90KB). */
const MAX_AVATAR_PX = 300;

interface MyInfoScreenProps {
  onClose: () => void;
  /** 로그아웃 후 호출 (예: 로그인/회원가입 화면으로 이동) */
  onAfterLogout?: () => void;
}

/** AbortError 여부 (React StrictMode/탭 전환 등으로 요청 취소 시) */
function isAbortError(e: unknown): boolean {
  return e instanceof Error && (e.name === 'AbortError' || e.message?.includes('aborted'));
}

export function MyInfoScreen({ onClose, onAfterLogout }: MyInfoScreenProps) {
  const { user, profile, loading, refreshProfile, signOut, ensureProfileForCurrentUser } = useAuth();
  const showToast = useToast();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const ensuredOnce = useRef(false);
  const isMountedRef = useRef(true);
  const saveInFlightRef = useRef(false);
  const cancelRequestedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setNickname(profile?.nickname ?? '');
  }, [profile?.nickname]);

  useEffect(() => {
    if (user && !loading) {
      if (profile?.nickname?.trim()) setIsEditingNickname(false);
      else setIsEditingNickname(true);
    }
  }, [user, loading, profile?.nickname]);

  // 로그인됐는데 프로필이 없을 때(자동 로그인/로그인 직후 ensure 실패 등) 한 번 프로필 생성 시도
  useEffect(() => {
    if (!user?.id || profile != null || loading || ensuredOnce.current) return;
    ensuredOnce.current = true;
    ensureProfileForCurrentUser();
  }, [user?.id, profile, loading, ensureProfileForCurrentUser]);
  const hasNoNickname = !profile?.nickname?.trim();
  const [isEditingNickname, setIsEditingNickname] = useState(hasNoNickname);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 파일 하나 검증 후 업로드 (input change / 드래그 드롭 공용) */
  const processAvatarFile = async (file: File | undefined) => {
    if (!file || !user?.id) return;
    setAvatarError(null);
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError(`프로필 사진은 ${AVATAR_MAX_BYTES / 1000}KB 이하여야 합니다.`);
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAvatarError('jpg, png, gif, webp만 업로드할 수 있습니다.');
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

  const trimmedNickname = nickname.trim();
  const currentProfileNickname = (profile?.nickname ?? '').trim();
  const nicknameDirty = trimmedNickname !== currentProfileNickname;
  const nicknameInvalid = trimmedNickname && (hasNicknameForbiddenChars(nickname) || trimmedNickname.length < 2);

  const handleSaveNickname = async () => {
    if (!user?.id) return;
    if (saveInFlightRef.current) return;
    cancelRequestedRef.current = false;

    const n = trimmedNickname;
    if (!n || n.length < 2) {
      setNicknameError('닉네임은 2자 이상 입력해 주세요.');
      return;
    }
    if (hasNicknameForbiddenChars(n)) {
      setNicknameError('한글, 영문, 숫자, 공백, 하이픈(-), 언더스코어(_)만 사용 가능합니다.');
      return;
    }
    if (isInappropriateNickname(n)) {
      setNicknameError('부적절한 닉네임은 사용할 수 없습니다.');
      return;
    }
    if (n === currentProfileNickname) {
      setIsEditingNickname(false);
      return;
    }

    // 닉네임 변경(대소문자만 다른 경우)이면 중복 확인 생략, 아니면 확인
    const skipDuplicateCheck = n.toLowerCase() === currentProfileNickname.toLowerCase();
    if (!skipDuplicateCheck) {
      try {
        const check = await checkNicknameAvailable(n);
        if (!isMountedRef.current) return;
        if (!check.available && !check.error) {
          setNicknameError('이미 사용 중인 닉네임입니다.');
          return;
        }
        if (!check.available && check.error) {
          showToast('닉네임 확인을 건너뛰고 저장합니다.', 'info');
        }
      } catch (e) {
        if (!isMountedRef.current) return;
        if (cancelRequestedRef.current) return;
        setNicknameError(
          isAbortError(e)
            ? '닉네임 확인 중 요청이 취소되었습니다. 다시 시도해 주세요.'
            : '닉네임 확인 중 오류가 발생했습니다. 다시 시도해 주세요.'
        );
        return;
      }
      if (cancelRequestedRef.current) return;
    }
    if (cancelRequestedRef.current) return;

    saveInFlightRef.current = true;
    setNicknameError(null);
    setNicknameSaving(true);

    const performSave = async (retryCount = 0): Promise<void> => {
      if (cancelRequestedRef.current) {
        saveInFlightRef.current = false;
        if (isMountedRef.current) setNicknameSaving(false);
        return;
      }
      try {
        if (!profile) await ensureProfile(user.id, n);
        if (!isMountedRef.current) return;
        const result = await updateProfileNickname(user.id, n);
        if (!isMountedRef.current) return;
        if (result.ok) {
          await refreshProfile();
          if (!isMountedRef.current) return;
          showToast('닉네임이 저장되었습니다.', 'success');
          setIsEditingNickname(false);
        } else {
          setNicknameError(result.error ?? '저장에 실패했습니다.');
        }
      } catch (e) {
        if (!isMountedRef.current) return;
        if (isAbortError(e) && retryCount < 1) {
          await new Promise((r) => setTimeout(r, 300));
          if (!isMountedRef.current) return;
          await performSave(retryCount + 1);
          return;
        }
        const msg = isAbortError(e)
          ? '요청이 취소되었습니다. 다시 시도해 주세요.'
          : '저장 중 오류가 발생했습니다. 다시 시도해 주세요.';
        setNicknameError(msg);
      } finally {
        saveInFlightRef.current = false;
        if (isMountedRef.current) setNicknameSaving(false);
      }
    };

    await performSave();
  };

  const handleCancelNicknameEdit = () => {
    cancelRequestedRef.current = true;
    setNickname(profile?.nickname ?? '');
    setNicknameError(null);
    setIsEditingNickname(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    void processAvatarFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes('Files')) return;
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    void processAvatarFile(file);
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
              {/* 프로필 사진: 표시 최대 300px, 업로드 최대 90KB. 클릭 또는 드래그로 업로드 */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="프로필 사진 업로드 (클릭 또는 사진 드래그)"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`w-[120px] h-[120px] rounded-full bg-slate-700 border-2 overflow-hidden flex items-center justify-center cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                      isDraggingOver ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105' : 'border-slate-600'
                    }`}
                    style={{ maxWidth: MAX_AVATAR_PX, maxHeight: MAX_AVATAR_PX }}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="프로필"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-500 pointer-events-none" />
                    )}
                    {isDraggingOver && (
                      <span className="absolute inset-0 bg-cyan-500/30 rounded-full flex items-center justify-center text-xs font-medium text-white text-center px-2 pointer-events-none">
                        여기에 놓기
                      </span>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={avatarUploading}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">프로필 사진 (최대 {AVATAR_MAX_BYTES / 1000}KB) · 클릭 또는 드래그</p>
                  {avatarError && <p className="text-xs text-red-400 mt-1">{avatarError}</p>}
                  {avatarUploading && <p className="text-xs text-cyan-400 mt-1">업로드 중...</p>}
                </div>
              </div>

              {/* 닉네임: 회원가입 시 입력한 닉네임 표시, 수정 시에만 입력창 + 취소/저장 */}
              {!profile && user && (
                <p className="text-xs text-amber-400/90">프로필을 불러오지 못했습니다. 수정 버튼으로 닉네임을 입력한 뒤 저장해 보세요.</p>
              )}
              <div>
                <label className="text-xs text-gray-400 block mb-1">닉네임 (한글·영문·숫자·공백·-·_ 가능, 2~20자)</label>
                {isEditingNickname ? (
                  <>
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => { setNickname(e.target.value); setNicknameError(null); }}
                        placeholder="닉네임 입력 (2~20자)"
                        maxLength={20}
                        className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex gap-3 shrink-0">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCancelNicknameEdit}
                          disabled={nicknameSaving}
                        >
                          취소
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSaveNickname}
                          disabled={!nicknameDirty || nicknameSaving}
                        >
                          {nicknameSaving ? '저장 중...' : '저장'}
                        </Button>
                      </div>
                    </div>
                    {nicknameError && <p className="text-xs text-red-400 mt-1">{nicknameError}</p>}
                    {nicknameInvalid && !nicknameError && (
                      <p className="text-xs text-amber-400 mt-1">한글, 영문, 숫자, 공백, (-), (_) 가능 · 2자 이상</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium min-h-[40px] flex items-center">
                      {profile?.nickname?.trim() || '닉네임 없음'}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setNickname(profile?.nickname ?? '');
                        setNicknameError(null);
                        setIsEditingNickname(true);
                      }}
                      className="shrink-0 rounded-lg h-9 px-3 flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      수정
                    </Button>
                  </div>
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
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await signOut();
                  showToast('로그아웃되었습니다.', 'success');
                } finally {
                  (onAfterLogout ?? onClose)();
                }
              }}
              className="w-full h-12 rounded-xl border-slate-500/50 text-gray-300 hover:bg-slate-800 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
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
