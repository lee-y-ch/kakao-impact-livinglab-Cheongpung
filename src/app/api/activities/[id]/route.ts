import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireParticipant } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * 참여자 본인 카드의 수정 / 삭제 엔드포인트.
 *
 *   PATCH  /api/activities/[id]   — 공개 토글 (is_public)
 *   DELETE /api/activities/[id]   — 삭제 요청 (soft: removed_at)
 *
 * 공통:
 *   - CSRF (Origin) + participant 세션 필요
 *   - activity.user_id 가 actor.userId 와 일치할 때만 허용
 *   - Storage 파일 실제 정리는 Phase 7 배치로 미룸 (soft delete 이후에도 공개 영역에서는 제외됨)
 *
 * PATCH 규칙:
 *   - is_public=true 로 바꾸려면 face_consent=true 여야 함
 *     (게임 규칙 ⑤ — 사진에 사람이 있어도 공개 가능 조건)
 */

const PatchSchema = z.object({
  is_public: z.boolean(),
});

type Context = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Context) {
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
  const activityId = idCheck.data;

  let actor;
  try {
    actor = await requireParticipant();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: current, error: fetchError } = await admin
    .from("activities")
    .select("id, user_id, face_consent, removed_at")
    .eq("id", activityId)
    .maybeSingle();

  if (fetchError || !current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (current.user_id !== actor.userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (current.removed_at) {
    return NextResponse.json(
      { error: "gone", message: "이미 삭제된 카드입니다." },
      { status: 410 }
    );
  }
  if (parsed.data.is_public && !current.face_consent) {
    return NextResponse.json(
      {
        error: "face_consent_required",
        message: "사람이 함께 나온 사진은 동의를 받은 뒤에만 공개할 수 있어요.",
      },
      { status: 400 }
    );
  }

  const { error: updateError } = await admin
    .from("activities")
    .update({ is_public: parsed.data.is_public })
    .eq("id", activityId);

  if (updateError) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, is_public: parsed.data.is_public });
}

export async function DELETE(request: NextRequest, { params }: Context) {
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
  const activityId = idCheck.data;

  let actor;
  try {
    actor = await requireParticipant();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("activities")
    .select("id, user_id, removed_at")
    .eq("id", activityId)
    .maybeSingle();

  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (current.user_id !== actor.userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (current.removed_at) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  const { error } = await admin
    .from("activities")
    .update({
      removed_at: new Date().toISOString(),
      is_public: false,
    })
    .eq("id", activityId);

  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
