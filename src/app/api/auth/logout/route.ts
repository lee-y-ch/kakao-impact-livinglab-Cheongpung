import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { getRequestIp, recordAuthEvent } from "@/lib/auth/audit";
import {
  CREW_COOKIE,
  OWNER_COOKIE,
  getCurrentActor,
  sessionCookieOptions,
} from "@/lib/auth/current-actor";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/** 현재 브라우저에 남은 인증 세션을 정리한다. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof CsrfError) {
      return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
    }
    throw err;
  }

  const actor = await getCurrentActor();
  const supabase = createServerSupabase();
  await supabase.auth.signOut();

  const cookieStore = cookies();
  cookieStore.set(OWNER_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  cookieStore.set(CREW_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });

  if (actor.role === "participant" || actor.role === "admin") {
    await recordAuthEvent({
      event_type: "logout",
      actor_role: actor.role,
      subject_key: actor.supabaseUserId,
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent"),
    });
  }

  return NextResponse.json({ ok: true });
}
