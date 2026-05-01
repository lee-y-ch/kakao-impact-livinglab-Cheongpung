import { NextResponse, type NextRequest } from "next/server";

import { getRequestIp, recordAuthEvent } from "@/lib/auth/audit";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/** Supabase Auth 세션 로그아웃 (참여자 + 관리자 공용). 사장님은 /api/auth/owner DELETE 사용. */
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
