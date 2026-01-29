/** 비밀번호 규칙: 8자 이상, 영어(대소문자) + 특수문자 포함 */
const MIN_LENGTH = 8;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;

export interface PasswordValidation {
  valid: boolean;
  minLength: boolean;
  hasLetter: boolean;
  hasSpecial: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  const minLength = password.length >= MIN_LENGTH;
  const hasLetter = HAS_LETTER.test(password);
  const hasSpecial = HAS_SPECIAL.test(password);
  return {
    valid: minLength && hasLetter && hasSpecial,
    minLength,
    hasLetter,
    hasSpecial,
  };
}

export const PASSWORD_HINT = '8자 이상, 영어와 특수문자 포함';
