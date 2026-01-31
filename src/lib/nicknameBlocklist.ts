/**
 * DB profiles.nickname CHECK와 동일: 한글·영문·숫자·공백·하이픈(-)·언더스코어(_) 허용.
 * length >= 2 (DB: length(TRIM) >= 2)
 */
const NICKNAME_DB_REGEX = /^[가-힣a-zA-Z0-9 \-_]+$/;

export function isNicknameFormatValid(nickname: string): boolean {
  const s = nickname.trim();
  if (!s || s.length < 2) return false;
  return NICKNAME_DB_REGEX.test(s);
}

/** 허용되지 않은 문자 사용 여부 (이모티콘·일부 특수문자 등, 사용 시 true = 금지) */
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
