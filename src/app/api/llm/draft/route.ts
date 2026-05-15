import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { draftOwnerLetterIntro } from "@/lib/llm";
import { UuidSchema } from "@/lib/schemas/common";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

const DraftRequestSchema = z.object({
  activityId: UuidSchema,
});

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
  if (actor.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = DraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: activity } = await admin
    .from("activities")
    .select(
      `id, title, body, shop_id, user_id, removed_at,
       author:user_id (id, nickname),
       shop:shop_id (id, name, slogan),
       project:project_id (id, title),
       episode:episode_id (id, title, location)`
    )
    .eq("id", parsed.data.activityId)
    .maybeSingle();

  if (!activity || activity.removed_at) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (activity.shop_id !== actor.shopId) {
    return NextResponse.json({ error: "forbidden_target" }, { status: 403 });
  }

  const author = activity.author as {
    id: string;
    nickname: string | null;
  } | null;
  const shop = activity.shop as {
    name: string | null;
    slogan: string | null;
  } | null;
  const project = activity.project as { title: string | null } | null;
  const episode = activity.episode as {
    title: string | null;
    location: string | null;
  } | null;

  const { data: recentRows } = author
    ? await admin
        .from("activities")
        .select("body")
        .eq("shop_id", actor.shopId)
        .eq("user_id", author.id)
        .is("removed_at", null)
        .order("created_at", { ascending: false })
        .limit(4)
    : { data: [] };

  try {
    const draft = await draftOwnerLetterIntro({
      shopName: shop?.name ?? "우리 가게",
      shopSlogan: shop?.slogan ?? null,
      recipientName: author?.nickname ?? "이 손님",
      activityBody: activity.body as string | null,
      activityTitle: activity.title as string | null,
      projectTitle: project?.title ?? null,
      episodeTitle: episode?.title ?? null,
      episodeLocation: episode?.location ?? null,
      recentBodies: (recentRows ?? [])
        .map((row) => row.body)
        .filter((value): value is string => Boolean(value)),
    });

    return NextResponse.json({ ok: true, draft });
  } catch (err) {
    console.error("[llm/draft] failed", err);

    const message =
      err instanceof Error && err.message.includes("_API_KEY")
        ? "LLM API 키가 설정되지 않았습니다. 직접 작성은 계속할 수 있어요."
        : "AI 초안을 만들지 못했습니다. 직접 작성은 계속할 수 있어요.";

    return NextResponse.json(
      { error: "draft_failed", message },
      { status: 503 }
    );
  }
}
