import { NextResponse, type NextRequest } from "next/server";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { ReactionCreateSchema } from "@/lib/schemas/reaction";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * POST /api/reactions — 크루/사장님/관리자의 응원·편지 생성.
 *
 * 역할별 허용:
 *   - 크루   : hi_five / note
 *   - 관리자 : hi_five / note
 *   - 사장님 : letter (자기 가게의 카드에만)  — Phase 4 진입
 *   - 참여자 : 상호 응원 미지원 (중독 설계 금지)
 *
 * author_role 은 서버에서 결정 — 클라이언트 입력을 신뢰하지 않음.
 * 사장님 letter 는 author_shop_id 도 actor.shopId 에서 자동 주입.
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
  if (
    actor.role !== "crew" &&
    actor.role !== "admin" &&
    actor.role !== "owner"
  ) {
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

  // 역할별 kind 게이트
  if (
    (actor.role === "crew" || actor.role === "admin") &&
    parsed.data.kind === "letter"
  ) {
    return NextResponse.json(
      { error: "forbidden_kind", message: "편지는 사장님 전용입니다." },
      { status: 403 }
    );
  }
  if (actor.role === "owner" && parsed.data.kind !== "letter") {
    return NextResponse.json(
      {
        error: "forbidden_kind",
        message: "사장님은 편지(letter) 만 보낼 수 있어요.",
      },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // activity 존재 + 가려지지 않았는지 확인 — 신고/삭제된 카드에 응원 불가.
  // 사장님은 자기 가게에 연결된 카드만 응원할 수 있음.
  const { data: activity } = await admin
    .from("activities")
    .select("id, removed_at, shop_id")
    .eq("id", parsed.data.activityId)
    .maybeSingle();

  if (!activity || activity.removed_at) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (actor.role === "owner" && activity.shop_id !== actor.shopId) {
    return NextResponse.json(
      {
        error: "forbidden_target",
        message: "본인 가게에 연결된 카드에만 편지를 보낼 수 있어요.",
      },
      { status: 403 }
    );
  }

  // author_shop_id 는 owner 일 때만 주입. 가게명은 별도 조회로 author_label 채움.
  let authorShopId: string | null = null;
  let authorLabel: string;
  if (actor.role === "crew") {
    authorLabel = "크루";
  } else if (actor.role === "admin") {
    authorLabel = "청풍";
  } else {
    // owner
    authorShopId = actor.shopId;
    const { data: shopRow } = await admin
      .from("shops")
      .select("name")
      .eq("id", actor.shopId)
      .maybeSingle();
    authorLabel = (shopRow?.name as string | undefined) ?? "사장님";
  }

  // visibility 는 schema default("private") 또는 클라이언트 명시 값 그대로 사용.
  // 사장님이 편지를 공개로 도감 뒷면에 노출하고 싶으면 폼에서 visibility="public" 보내야 함.
  const insert: ReactionInsert = {
    activity_id: parsed.data.activityId,
    author_role: actor.role,
    author_label: authorLabel,
    author_shop_id: authorShopId,
    kind: parsed.data.kind,
    body: parsed.data.body,
    llm_draft: actor.role === "owner" ? parsed.data.llmDraft : null,
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
