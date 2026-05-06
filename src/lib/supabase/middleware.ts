import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * 세션 갱신용 미들웨어 헬퍼.
 * 루트 middleware.ts에서 import해 사용한다.
 *
 * 부수 효과: 서버 컴포넌트가 layout 단계에서 현재 경로를 읽을 수 있도록
 * `x-pathname` 헤더를 forwarded request 에 주입한다. (root layout 이
 * `/admin*` 같은 chrome 미적용 경로에서 Navbar/Footer 를 끄는 데 사용)
 */
export async function updateSession(request: NextRequest) {
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({
    request: { headers: forwardedHeaders },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: forwardedHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (토큰 만료 대응)
  await supabase.auth.getUser();

  return response;
}
