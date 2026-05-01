import { NextResponse, type NextRequest } from "next/server";

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * 개발 환경 전용 — 카카오 OAuth 비즈 앱 전환 전까지만 쓰는 임시 로그인.
 *
 * .env.local:
 *   DEV_USER_EMAIL=dev@cheongpung.local
 *   DEV_USER_PASSWORD=(8자 이상)
 *
 * 전제:
 *   - `node --env-file=.env.local scripts/bootstrap-dev-user.mjs <email> <password>` 로 사용자 준비 완료
 *   - Supabase Dashboard 에서 Email provider 가 켜져 있음 (기본값)
 *
 * 보안:
 *   - NODE_ENV !== "production" 에서만 작동. 프로덕션 배포에선 403.
 *   - Origin/CSRF 체크는 유지.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_available" }, { status: 403 });
  }

  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof CsrfError) {
      return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
    }
    throw err;
  }

  const email = process.env.DEV_USER_EMAIL;
  const password = process.env.DEV_USER_PASSWORD;
  if (!email || !password) {
    return NextResponse.json(
      {
        error: "dev_env_missing",
        message:
          ".env.local 에 DEV_USER_EMAIL / DEV_USER_PASSWORD 를 설정하고 bootstrap-dev-user 실행이 필요합니다.",
      },
      { status: 500 }
    );
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json(
      {
        error: "sign_in_failed",
        message: error.message,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
