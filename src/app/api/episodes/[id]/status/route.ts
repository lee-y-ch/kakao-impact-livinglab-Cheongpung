import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { EpisodeStatusSchema } from "@/lib/schemas/episode";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * PATCH /api/episodes/[id]/status — 크루/관리자가 에피소드 진행 상태만 변경.
 *
 * 크루는 RLS 대상이 아니므로 route handler 에서 직접 권한 부여.
 * 관리자도 동일 엔드포인트 사용 가능 (별도 admin 라우트 존재하지만 크루 UI 와 공유).
 */
const BodySchema = z.object({
  status: EpisodeStatusSchema,
});

type Ctx = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Ctx) {
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

  const actor = await getCurrentActor();
  if (actor.role !== "crew" && actor.role !== "admin") {
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
  const { data: current, error: readError } = await admin
    .from("episodes")
    .select("id, status")
    .eq("id", idCheck.data)
    .maybeSingle();

  if (readError) {
    return NextResponse.json(
      { error: "read_failed", message: readError.message },
      { status: 500 }
    );
  }
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (current.status === parsed.data.status) {
    return NextResponse.json({ ok: true, noop: true });
  }

  const { error } = await admin
    .from("episodes")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", idCheck.data);

  if (error) {
    return NextResponse.json(
      { error: "update_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
