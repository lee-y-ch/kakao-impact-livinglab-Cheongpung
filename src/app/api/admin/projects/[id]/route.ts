import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { ProjectUpdateSchema } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/types";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

/**
 * 관리자 프로젝트 수정 / 삭제.
 *   PATCH  /api/admin/projects/[id] — 부분 수정 (progress_type 바뀌면 target 재검증)
 *   DELETE /api/admin/projects/[id] — 하드 삭제 (episodes cascade)
 */
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

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ProjectUpdateSchema.safeParse(body);
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

  const admin = createAdminClient();
  const input = parsed.data;
  const patch: ProjectUpdate = {};
  if (input.category_id !== undefined) patch.category_id = input.category_id;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.title !== undefined) patch.title = input.title;
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.description !== undefined) patch.description = input.description;
  if (input.is_public !== undefined) patch.is_public = input.is_public;
  if (input.progress_type !== undefined)
    patch.progress_type = input.progress_type;
  if (input.progress_target !== undefined)
    patch.progress_target = input.progress_target as Json;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }
  patch.updated_at = new Date().toISOString();

  const { error } = await admin
    .from("projects")
    .update(patch)
    .eq("id", idCheck.data);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "duplicate_slug", message: "이미 사용 중인 slug 입니다." },
        { status: 409 }
      );
    }
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
    .from("projects")
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
