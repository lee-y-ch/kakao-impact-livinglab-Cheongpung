import { NextResponse, type NextRequest } from "next/server";

import { getRequestIp, recordAuthEvent } from "@/lib/auth/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

/**
 * 카카오 OAuth 완료 후 Supabase 가 `code` 파라미터와 함께 리다이렉트하는 콜백.
 *
 * 처리 흐름:
 *   1. `exchangeCodeForSession` 으로 세션 쿠키 심기
 *   2. auth.users 행에서 kakao_id / nickname / profile_image_url 추출
 *   3. public.users 를 idempotent 하게 upsert — auth_user_id 를 유일 키로 간주
 *   4. next 파라미터가 유효하면 거기로, 아니면 /collection 으로 이동
 *   5. auth_events 에 login_success 기록 (best-effort — 실패해도 로그인 자체는 통과)
 */

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");
  const next = sanitizeNext(rawNext);

  if (!code) {
    return redirectToLogin(request, "missing_code");
  }

  const supabase = createServerSupabase();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("oauth exchange failed", exchangeError);
    return redirectToLogin(request, "exchange_failed");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return redirectToLogin(request, "no_user");
  }

  // 관리자는 participant upsert 건너뜀
  const role = (user.app_metadata as { role?: string } | null)?.role;
  if (role === "admin") {
    await recordAuthEvent({
      event_type: "login_success",
      actor_role: "admin",
      subject_key: user.id,
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent"),
    });
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 카카오 identity 에서 닉네임·프로필 추출
  const identity = user.identities?.find((i) => i.provider === "kakao");
  const identityData = (identity?.identity_data ?? {}) as Record<
    string,
    unknown
  >;

  const kakaoId =
    typeof identityData["provider_id"] === "string"
      ? (identityData["provider_id"] as string)
      : (identity?.id ?? null);
  const nickname =
    (identityData["user_name_name"] as string | undefined) ??
    (identityData["name"] as string | undefined) ??
    (identityData["nickname"] as string | undefined) ??
    (user.user_metadata?.nickname as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "강화 여행자";
  const profileImageUrl =
    (identityData["avatar_url"] as string | undefined) ??
    (identityData["picture"] as string | undefined) ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    null;

  const admin = createAdminClient();
  const { error: upsertError } = await admin.from("users").upsert(
    {
      auth_user_id: user.id,
      kakao_id: kakaoId,
      nickname,
      profile_image_url: profileImageUrl,
    },
    { onConflict: "auth_user_id" }
  );
  if (upsertError) {
    console.error("users upsert failed", upsertError);
    // 로그인 자체는 성공했지만 프로필이 비어있는 상태 → 재시도 안내
    return redirectToLogin(request, "profile_upsert_failed");
  }

  await recordAuthEvent({
    event_type: "login_success",
    actor_role: "participant",
    subject_key: user.id,
    ip_address: getRequestIp(request),
    user_agent: request.headers.get("user-agent"),
  });

  return NextResponse.redirect(new URL(next ?? "/collection", request.url));
}

function sanitizeNext(value: string | null): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

function redirectToLogin(request: NextRequest, reason: string) {
  const redirect = new URL("/login", request.url);
  redirect.searchParams.set("error", reason);
  return NextResponse.redirect(redirect);
}
