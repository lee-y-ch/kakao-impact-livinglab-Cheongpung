import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  CREW_COOKIE,
  OWNER_COOKIE,
  sessionCookieOptions,
  type OwnerSessionPayload,
} from "@/lib/auth/current-actor";
import { getRequestIp, recordAuthEvent } from "@/lib/auth/audit";
import { OwnerLoginSchema } from "@/lib/schemas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 60;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12시간

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof CsrfError) {
      return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
    }
    throw err;
  }

  const body = await request.json().catch(() => null);
  const parsed = OwnerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.format() },
      { status: 400 }
    );
  }
  const { shopSlug, code } = parsed.data;

  const admin = createAdminClient();

  // shops.slug 로 가게 식별 — 001 스키마엔 slug 가 없어서 name 매칭은 위험하니
  // qr_token 을 "쇼트 슬러그" 로 겸용. 관리자 UI 에서 발급.
  // 존재하지 않아도 응답은 균일하게 (타이밍 차이 최소화).
  const { data: shop } = await admin
    .from("shops")
    .select("id")
    .eq("qr_token", shopSlug)
    .maybeSingle();

  if (!shop) {
    await recordAuthEvent({
      event_type: "login_failure",
      actor_role: "owner",
      subject_key: null,
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent"),
      meta: { reason: "shop_not_found", shop_slug: shopSlug },
    });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const shopId = shop.id as string;

  const { data: owner } = await admin
    .from("shop_owners")
    .select("id, owner_code_hash, failed_attempts, locked_until")
    .eq("shop_id", shopId)
    .maybeSingle();

  if (!owner) {
    await recordAuthEvent({
      event_type: "login_failure",
      actor_role: "owner",
      subject_key: null,
      shop_id: shopId,
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent"),
      meta: { reason: "owner_not_registered" },
    });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const ownerId = owner.id as string;
  const lockedUntilRaw = owner.locked_until as string | null;
  const lockedUntil = lockedUntilRaw ? new Date(lockedUntilRaw) : null;

  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return NextResponse.json(
      {
        error: "locked",
        until: lockedUntil.toISOString(),
      },
      { status: 423 }
    );
  }

  const ok = await bcrypt.compare(code, owner.owner_code_hash as string);
  if (!ok) {
    const nextAttempts = ((owner.failed_attempts as number) ?? 0) + 1;
    const shouldLock = nextAttempts >= MAX_FAILED_ATTEMPTS;
    const newLockedUntil = shouldLock
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
      : null;

    await admin
      .from("shop_owners")
      .update({
        failed_attempts: shouldLock ? 0 : nextAttempts,
        locked_until: newLockedUntil,
      })
      .eq("id", ownerId);

    await recordAuthEvent({
      event_type: shouldLock ? "lockout" : "login_failure",
      actor_role: "owner",
      subject_key: ownerId,
      shop_id: shopId,
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent"),
      meta: { attempts: nextAttempts, locked: shouldLock },
    });

    return NextResponse.json(
      shouldLock
        ? { error: "locked", until: newLockedUntil }
        : { error: "invalid_credentials" },
      { status: shouldLock ? 423 : 401 }
    );
  }

  // 성공: 잠금 해제 + 타임스탬프 갱신
  await admin
    .from("shop_owners")
    .update({
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    })
    .eq("id", ownerId);

  const payload: OwnerSessionPayload = {
    shopOwnerId: ownerId,
    shopId,
    issuedAt: Date.now(),
  };
  const supabase = createServerSupabase();
  await supabase.auth.signOut();

  const cookieStore = cookies();
  cookieStore.set(CREW_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  cookieStore.set(
    OWNER_COOKIE,
    JSON.stringify(payload),
    sessionCookieOptions(SESSION_MAX_AGE_SECONDS)
  );

  await recordAuthEvent({
    event_type: "login_success",
    actor_role: "owner",
    subject_key: ownerId,
    shop_id: shopId,
    ip_address: getRequestIp(request),
    user_agent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  // 로그아웃 — Origin 검증 유지
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
  }

  const cookieStore = cookies();
  const raw = cookieStore.get(OWNER_COOKIE)?.value;
  let ownerId: string | null = null;
  let shopId: string | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as OwnerSessionPayload;
      ownerId = parsed.shopOwnerId;
      shopId = parsed.shopId;
    } catch {
      // ignore
    }
  }

  cookieStore.set(OWNER_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });

  await recordAuthEvent({
    event_type: "logout",
    actor_role: "owner",
    subject_key: ownerId,
    shop_id: shopId,
    ip_address: getRequestIp(request),
    user_agent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
