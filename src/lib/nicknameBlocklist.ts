/**
 * 닉네임 형식: 한글·영문·숫자·공백만 허용. 이모티콘·특수문자 금지.
 */
const NICKNAME_ALLOWED = /^[\p{L}\p{N}\s]+$/u;

export function isNicknameFormatValid(nickname: string): boolean {
  const s = nickname.trim();
  if (!s) return false;
  return NICKNAME_ALLOWED.test(s);
}

/** 이모티콘·특수문자 사용 여부 (사용 시 true = 금지) */
export function hasNicknameForbiddenChars(nickname: string): boolean {
  return !isNicknameFormatValid(nickname);
}

/**
 * 부적절한 닉네임 차단 목록 (성적·욕설·비하 등)
 * 소문자/대문자 무관하게 비교합니다.
 */
const BLOCKLIST_RAW = [
  // 욕설·비하 (한글)
  '시발', '씨발', 'ㅅㅂ', 'ㅂㅅ', '개새', '지랄', '닥쳐', '죽어', '병신', '븅신',
  '한남', '한녀', '김치녀', '김치남', '틀딱', '혼술', '혼밥',
  // 욕설·비하 (영어)
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy', 'cunt', 'whore',
  'slut', 'fag', 'nigger', 'nigga', 'retard', 'rape', 'rapist',
  // 성적 표현
  'sex', 'porn', 'xxx', 'nude', 'naked', 'orgasm', 'penis', 'vagina',
  'boob', 'tit', 'horny', 'fetish',
  // 기타 비하
  'kill', 'die', 'hate', 'terror', 'hitler', 'nazi',
];

const BLOCKLIST_LOWER = BLOCKLIST_RAW.map((w) => w.toLowerCase().replace(/\s/g, ''));

/** 부적절한 닉네임 여부 (성적·욕설·비하 등) */
export function isInappropriateNickname(nickname: string): boolean {
  const normalized = nickname.trim().toLowerCase().replace(/\s/g, '');
  if (!normalized) return true;
  for (const word of BLOCKLIST_LOWER) {
    if (word.length >= 2 && normalized.includes(word)) return true;
  }
  return false;
}
