import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { getRequestIp, recordAuthEvent } from "@/lib/auth/audit";
import {
  CREW_COOKIE,
  sessionCookieOptions,
  type CrewSessionPayload,
} from "@/lib/auth/current-actor";
import { CrewLoginSchema } from "@/lib/schemas/auth";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * POST /api/auth/crew — 크루 공용 코드 로그인.
 *
 * env 에 저장된 CREW_ACCESS_CODE 와 constant-time 비교.
 * 실패 잠금은 없다 — 코드가 유출되면 env 를 갈아서 재배포 하는 것이 방어.
 * 개별 계정은 Phase 7.
 */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12시간

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof CsrfError) {
      return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
    }
    throw err;
  }

  const expected = process.env.CREW_ACCESS_CODE;
  if (!expected || expected.length < 6) {
    // env 가 비어 있으면 로그인 자체가 비활성 — 운영 실수 방지.
    return NextResponse.json({ error: "crew_login_disabled" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CrewLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const ok = constantTimeEqual(parsed.data.code, expected);
  if (!ok) {
    await recordAuthEvent({
      event_type: "login_failure",
      actor_role: "crew",
      subject_key: null,
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent"),
      meta: { reason: "invalid_code" },
    });
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }

  const crewSessionId = crypto.randomUUID();
  const payload: CrewSessionPayload = {
    crewSessionId,
    issuedAt: Date.now(),
  };
  const cookieStore = cookies();
  cookieStore.set(
    CREW_COOKIE,
    JSON.stringify(payload),
    sessionCookieOptions(SESSION_MAX_AGE_SECONDS)
  );

  await recordAuthEvent({
    event_type: "login_success",
    actor_role: "crew",
    subject_key: crewSessionId,
    ip_address: getRequestIp(request),
    user_agent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
  }

  const cookieStore = cookies();
  const raw = cookieStore.get(CREW_COOKIE)?.value;
  let crewSessionId: string | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CrewSessionPayload;
      crewSessionId = parsed.crewSessionId;
    } catch {
      // ignore
    }
  }

  cookieStore.set(CREW_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });

  await recordAuthEvent({
    event_type: "logout",
    actor_role: "crew",
    subject_key: crewSessionId,
    ip_address: getRequestIp(request),
    user_agent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
