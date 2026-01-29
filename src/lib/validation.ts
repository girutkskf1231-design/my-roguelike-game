/**
 * 회원가입·닉네임·비밀번호 검증
 */

/** 이메일 형식 검사 */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}

/** 비밀번호: 8자 이상, 영어 1자 이상, 특수문자 1자 이상 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9\s]).{8,}$/;

export function isValidPassword(value: string): boolean {
  if (value.length < PASSWORD_MIN_LENGTH) return false;
  if (!/[a-zA-Z]/.test(value)) return false;
  if (!/[^a-zA-Z0-9\s]/.test(value)) return false;
  return true;
}

export function getPasswordErrorMessage(value: string): string {
  if (value.length < PASSWORD_MIN_LENGTH) return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  if (!/[a-zA-Z]/.test(value)) return '영어를 1자 이상 포함해 주세요.';
  if (!/[^a-zA-Z0-9\s]/.test(value)) return '특수 문자를 1자 이상 포함해 주세요.';
  return '';
}

/** 닉네임 길이 (2~20자) */
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;

export function isValidNicknameLength(value: string): boolean {
  const len = value.trim().length;
  return len >= NICKNAME_MIN_LENGTH && len <= NICKNAME_MAX_LENGTH;
}

/** 부적절한 닉네임 금지어 (성적·욕설·비하 등, 일부만 포함) */
const BANNED_WORDS = [
  '시발', '씨발', 'ㅅㅂ', 'ㅂㅅ', '개새', '지랄', '닥쳐', '병신', '븅신', '또라이', '한남', '한녀',
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut', 'fag', 'nigger', 'retard',
  'penis', 'vagina', 'anal', 'rape', 'sex',
];

export function isNicknameAppropriate(value: string): { ok: boolean; reason?: string } {
  const lower = value.trim().toLowerCase();
  const normalized = lower.replace(/\s/g, '');
  for (const word of BANNED_WORDS) {
    const w = word.toLowerCase();
    if (lower.includes(w) || normalized.includes(w.replace(/\s/g, ''))) {
      return { ok: false, reason: '부적절한 닉네임입니다. (욕설·비하·성적 표현 불가)' };
    }
  }
  if (!/^[a-zA-Z0-9가-힣_\s]+$/.test(value.trim())) {
    return { ok: false, reason: '닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.' };
  }
  return { ok: true };
}
