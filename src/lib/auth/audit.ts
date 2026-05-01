import type { NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

/**
 * 인증/권한 감사 로그 — auth_events 테이블에 기록.
 *
 * 실패해도 호출자의 main flow 를 깨지 않도록 항상 try/catch 로 감싼다.
 * (로그인/로그아웃 자체가 로그 기록 실패로 차단되면 안 됨.)
 */
export type AuthEventInput = {
  event_type:
    | "login_success"
    | "login_failure"
    | "logout"
    | "lockout"
    | "role_change";
  actor_role: "participant" | "crew" | "owner" | "admin" | "anonymous";
  subject_key?: string | null;
  shop_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  meta?: { [key: string]: Json | undefined };
};

export async function recordAuthEvent(input: AuthEventInput): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("auth_events").insert({
      event_type: input.event_type,
      actor_role: input.actor_role,
      subject_key: input.subject_key ?? null,
      shop_id: input.shop_id ?? null,
      ip_address: input.ip_address ?? null,
      user_agent: input.user_agent ?? null,
      meta: input.meta ?? {},
    });
  } catch (err) {
    console.error("auth_events insert failed", err);
  }
}

export function getRequestIp(request: NextRequest | Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}
