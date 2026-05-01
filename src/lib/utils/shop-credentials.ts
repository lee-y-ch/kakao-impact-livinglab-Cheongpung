import { randomBytes } from "node:crypto";

/**
 * 가게·사장님 자격 생성 유틸.
 *
 * - qr_token: URL 친화적인 짧은 슬러그 (소문자 + 숫자, 10자 정도). 관리자가 원하면 수정 가능.
 * - owner_code: 사장님 로그인용 8자리. 혼동되기 쉬운 문자 제외한 커스텀 알파벳.
 *
 * 모두 `crypto.randomBytes` 기반이라 예측 불가. 고유성은 DB unique 제약으로 보장하고,
 * 충돌 시 호출 측에서 재시도한다.
 */

const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
// 0/O, 1/I/l 등 혼동 문자 제거
const OWNER_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomString(length: number, alphabet: string): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/** 10자리 슬러그 (충돌 확률 극히 낮음). */
export function generateQrToken(): string {
  return randomString(10, TOKEN_ALPHABET);
}

/** 8자리 사장님 코드 — 응답에 평문으로 한 번만 돌려주고 DB 는 bcrypt 해시만 저장. */
export function generateOwnerCode(): string {
  return randomString(8, OWNER_CODE_ALPHABET);
}
