import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 아래 경로 외의 모든 요청에서 세션 갱신:
     * - _next/static, _next/image (정적 자원)
     * - favicon.ico, 아이콘, manifest (PWA 관련)
     * - api/auth/owner 등 자체 쿠키 인증 라우트도 통과시켜서 SSR getUser 토큰 갱신
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
