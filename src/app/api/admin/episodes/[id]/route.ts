import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { EpisodeUpdateSchema } from "@/lib/schemas/episode";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * 관리자 에피소드 수정 / 삭제.
 *   PATCH  /api/admin/episodes/[id]
 *   DELETE /api/admin/episodes/[id]
 *
 * 크루가 status 만 바꾸는 엔드포인트는 별도(/api/episodes/[id]/status, Phase 3 후반).
 */
type Ctx = { params: { id: string } };
type EpisodeUpdate = Database["public"]["Tables"]["episodes"]["Update"];

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

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = EpisodeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: "invalid_input",
        message: firstIssue?.message ?? "입력을 확인해주세요.",
        issues: parsed.error.format(),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const patch: EpisodeUpdate = {};
  if (input.seq !== undefined) patch.seq = input.seq;
  if (input.title !== undefined) patch.title = input.title;
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.session_date !== undefined) patch.session_date = input.session_date;
  if (input.location !== undefined) patch.location = input.location;
  if (input.is_public !== undefined) patch.is_public = input.is_public;
  if (input.status !== undefined) patch.status = input.status;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }
  patch.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { error } = await admin
    .from("episodes")
    .update(patch)
    .eq("id", idCheck.data);

  if (error) {
    return NextResponse.json(
      { error: "update_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
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

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("episodes")
    .delete()
    .eq("id", idCheck.data);

  if (error) {
    return NextResponse.json(
      { error: "delete_failed", message: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
