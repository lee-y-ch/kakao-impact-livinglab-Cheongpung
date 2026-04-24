import { cookies } from "next/headers";

import { createClient as createServerSupabase } from "@/lib/supabase/server";

/**
 * 현재 요청의 actor 를 해석하는 단일 레이어.
 *
 * 혼합 인증(Supabase Auth + 가게 코드 쿠키 + 크루 쿠키)의 복잡도를 이 함수 하나에서 흡수한다.
 * 모든 서버 컴포넌트·route handler 는 `getCurrentActor()` 만 호출할 것.
 *
 * 우선순위:
 *   1. Supabase Auth 세션 존재 → admin (role=admin) 또는 participant
 *   2. owner 쿠키 존재 → owner (DB 검증은 호출 측에서)
 *   3. crew 쿠키 존재 → crew
 *   4. 모두 없음 → anonymous
 */

export type CurrentActor =
  | {
      role: "participant";
      /** public.users.id */
      userId: string;
      /** auth.users.id */
      supabaseUserId: string;
      nickname: string | null;
      profileImageUrl: string | null;
    }
  | {
      role: "crew";
      crewSessionId: string;
    }
  | {
      role: "owner";
      shopOwnerId: string;
      shopId: string;
    }
  | {
      role: "admin";
      supabaseUserId: string;
      email: string | null;
    }
  | { role: "anonymous" };

export const OWNER_COOKIE = "cp_owner_session";
export const CREW_COOKIE = "cp_crew_session";

/** 쿠키 옵션 — httpOnly / SameSite=Lax / prod 에서만 secure. */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * Owner 쿠키 payload. JSON 으로 직렬화해서 httpOnly 쿠키에 저장.
 * 서명은 Supabase Auth 에 비해 약하지만, service role 키가 없으면 DB 에 닿지 못하므로
 * 쿠키 조작만으로는 권한 획득 불가. 추가 서명은 풀버전에서 검토.
 */
export type OwnerSessionPayload = {
  shopOwnerId: string;
  shopId: string;
  issuedAt: number;
};

export type CrewSessionPayload = {
  crewSessionId: string;
  issuedAt: number;
};

function parseJsonCookie<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function getCurrentActor(): Promise<CurrentActor> {
  const supabase = createServerSupabase();
  const cookieStore = cookies();

  // 1. Supabase Auth 먼저 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = (user.app_metadata as { role?: string } | null)?.role;
    if (role === "admin") {
      return {
        role: "admin",
        supabaseUserId: user.id,
        email: user.email ?? null,
      };
    }

    // participant — public.users 행 조회
    const { data: profile } = await supabase
      .from("users")
      .select("id, nickname, profile_image_url")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profile) {
      return {
        role: "participant",
        userId: profile.id as string,
        supabaseUserId: user.id,
        nickname: (profile.nickname as string | null) ?? null,
        profileImageUrl: (profile.profile_image_url as string | null) ?? null,
      };
    }

    // Supabase Auth 는 통과했지만 public.users 행이 없는 상태.
    // 카카오 callback 의 upsert 가 실패한 edge case — 호출자에게 anonymous 로 표시.
    // (callback 재시도 시 복구됨)
  }

  // 2. Owner 쿠키
  const ownerSession = parseJsonCookie<OwnerSessionPayload>(
    cookieStore.get(OWNER_COOKIE)?.value
  );
  if (ownerSession?.shopOwnerId && ownerSession.shopId) {
    return {
      role: "owner",
      shopOwnerId: ownerSession.shopOwnerId,
      shopId: ownerSession.shopId,
    };
  }

  // 3. Crew 쿠키 (Phase 3 에 실제 사용)
  const crewSession = parseJsonCookie<CrewSessionPayload>(
    cookieStore.get(CREW_COOKIE)?.value
  );
  if (crewSession?.crewSessionId) {
    return {
      role: "crew",
      crewSessionId: crewSession.crewSessionId,
    };
  }

  return { role: "anonymous" };
}

/** 참여자만 허용 — 그 외는 throw. route handler 에서 사용. */
export async function requireParticipant(): Promise<
  Extract<CurrentActor, { role: "participant" }>
> {
  const actor = await getCurrentActor();
  if (actor.role !== "participant") {
    throw new Error("unauthorized: participant required");
  }
  return actor;
}

export async function requireOwner(): Promise<
  Extract<CurrentActor, { role: "owner" }>
> {
  const actor = await getCurrentActor();
  if (actor.role !== "owner") {
    throw new Error("unauthorized: owner required");
  }
  return actor;
}

export async function requireAdmin(): Promise<
  Extract<CurrentActor, { role: "admin" }>
> {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") {
    throw new Error("unauthorized: admin required");
  }
  return actor;
}

export async function requireCrew(): Promise<
  Extract<CurrentActor, { role: "crew" }>
> {
  const actor = await getCurrentActor();
  if (actor.role !== "crew") {
    throw new Error("unauthorized: crew required");
  }
  return actor;
}
