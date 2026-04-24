import { NextResponse, type NextRequest } from "next/server";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { ReactionCreateSchema } from "@/lib/schemas/reaction";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * POST /api/reactions — 크루/사장님/관리자의 응원·편지 생성.
 *
 * Phase 3-g : 크루 hi_five / note 만 지원.
 *   - 사장님 letter (LLM 초안 포함) 는 Phase 4 에서 확장.
 *   - 참여자 상호 응원은 중독 설계 금지 원칙에 따라 당분간 미지원.
 *
 * author_role 은 서버에서 결정 — 클라이언트 입력을 신뢰하지 않음.
 */
type ReactionInsert = Database["public"]["Tables"]["reactions"]["Insert"];

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
  if (actor.role !== "crew" && actor.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ReactionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  // Phase 3-g : 크루/관리자는 letter 불가 — 사장님 전용.
  if (parsed.data.kind === "letter") {
    return NextResponse.json(
      { error: "forbidden_kind", message: "편지는 사장님 전용입니다." },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // activity 존재 + 가려지지 않았는지 확인 — 신고/삭제된 카드에 응원 불가.
  const { data: activity } = await admin
    .from("activities")
    .select("id, removed_at")
    .eq("id", parsed.data.activityId)
    .maybeSingle();

  if (!activity || activity.removed_at) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const insert: ReactionInsert = {
    activity_id: parsed.data.activityId,
    author_role: actor.role,
    author_label: actor.role === "crew" ? "크루" : "청풍",
    kind: parsed.data.kind,
    body: parsed.data.body,
    visibility: parsed.data.visibility,
  };

  const { data: created, error } = await admin
    .from("reactions")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "insert_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: created.id });
}
