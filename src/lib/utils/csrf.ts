import type { NextRequest } from "next/server";

/**
 * 상태 변경 POST/PATCH/DELETE 요청에서 Origin / Referer 를 검증한다.
 *
 * SameSite=Lax 쿠키로 1차 방어되지만, 브라우저 / 확장프로그램 예외 대비로
 * 서버측 Origin 재확인을 표준으로 둔다.
 *
 * `NEXT_PUBLIC_SITE_URL` 에 설정된 도메인(+서브경로 무관)과 일치해야 통과.
 * 로컬 개발에선 http://localhost:3001.
 */

function getAllowedOrigins(): string[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origins = new Set<string>();
  if (siteUrl) {
    try {
      origins.add(new URL(siteUrl).origin);
    } catch {
      // invalid URL — 무시 (환경 설정 문제는 배포 전에 걸러야 함)
    }
  }
  // Vercel preview 도메인 패턴은 checkOrigin 안에서 suffix 매칭으로 별도 허용.
  return Array.from(origins);
}

function isVercelPreviewHost(host: string): boolean {
  return host.endsWith(".vercel.app");
}

/**
 * 동일 출처 확인. 실패 시 false 반환.
 * GET/HEAD 등 안전 메서드에 대해서도 호출 가능하지만 일반적으로 상태 변경에서만 사용한다.
 */
export function checkSameOrigin(request: NextRequest | Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // 둘 다 없으면 일반 사용자 브라우저에서 온 상태 변경 요청이 아닐 가능성이 높음 — 거부.
  if (!origin && !referer) return false;

  const allowed = getAllowedOrigins();
  const check = (value: string | null): boolean => {
    if (!value) return false;
    try {
      const u = new URL(value);
      if (allowed.includes(u.origin)) return true;
      if (isVercelPreviewHost(u.host)) return true;
      return false;
    } catch {
      return false;
    }
  };

  if (origin && check(origin)) return true;
  if (referer && check(referer)) return true;
  return false;
}

/**
 * 실패 시 throw 하는 버전. route handler 에서 `assertSameOrigin(req)` 한 줄로 끝낼 용도.
 */
export function assertSameOrigin(request: NextRequest | Request): void {
  if (!checkSameOrigin(request)) {
    throw new CsrfError("Origin check failed");
  }
}

export class CsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsrfError";
  }
}
