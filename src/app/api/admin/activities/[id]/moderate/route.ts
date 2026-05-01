import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { recordAuthEvent } from "@/lib/auth/audit";
import { requireAdmin } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * POST /api/admin/activities/[id]/moderate — 관리자 검수/신고 조치.
 *
 *   unpublish      : is_public=false (공개 해제, removed_at 는 건드리지 않음)
 *   remove         : is_public=false + removed_at=now (공개 영역 완전 제거, 소프트 삭제)
 *   restore        : removed_at=null (삭제 해제 — is_public 은 그대로 유지)
 *   dismiss_report : reported_at=null (신고 사유가 근거 없다고 판단, 공개 유지)
 *
 * 본인 삭제(DELETE /api/activities/[id]) 와 달리 user_id 체크를 우회하고,
 * auth_events 에 action 과 관리자 id 를 기록한다.
 */
const BodySchema = z.object({
  action: z.enum(["unpublish", "remove", "restore", "dismiss_report"]),
  reason: z.string().trim().max(500).optional(),
});

type Ctx = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof CsrfError) {
      return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
    }
    throw err;
  }

  const idCheck = UuidSchema.safeParse(params.id);
  if (!idCheck.success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let actor;
  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("activities")
    .select("id, user_id, is_public, removed_at, shop_id")
    .eq("id", idCheck.data)
    .maybeSingle();

  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const patch: {
    is_public?: boolean;
    removed_at?: string | null;
    reported_at?: string | null;
  } = {};
  switch (parsed.data.action) {
    case "unpublish":
      patch.is_public = false;
      break;
    case "remove":
      patch.is_public = false;
      patch.removed_at = new Date().toISOString();
      break;
    case "restore":
      patch.removed_at = null;
      break;
    case "dismiss_report":
      patch.reported_at = null;
      break;
  }

  const { error } = await admin
    .from("activities")
    .update(patch)
    .eq("id", idCheck.data);

  if (error) {
    return NextResponse.json(
      { error: "update_failed", message: error.message },
      { status: 500 }
    );
  }

  await recordAuthEvent({
    event_type: "role_change",
    actor_role: "admin",
    subject_key: idCheck.data,
    shop_id: (current.shop_id as string | null) ?? null,
    meta: {
      action: `activity_${parsed.data.action}`,
      moderated_by: actor.supabaseUserId,
      owner_user_id: current.user_id as string,
      reason: parsed.data.reason ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
