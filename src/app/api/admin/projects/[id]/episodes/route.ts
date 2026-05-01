import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { EpisodeCreateSchema } from "@/lib/schemas/episode";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * POST /api/admin/projects/[id]/episodes — 새 에피소드 생성.
 * project 가 없으면 400. seq 비우면 null (수시 이벤트).
 */
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

  const projectIdCheck = UuidSchema.safeParse(params.id);
  if (!projectIdCheck.success) {
    return NextResponse.json({ error: "invalid_project_id" }, { status: 400 });
  }

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = EpisodeCreateSchema.safeParse(body);
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

  const { data, error } = await admin
    .from("episodes")
    .insert({
      project_id: projectIdCheck.data,
      seq: input.seq ?? null,
      title: input.title,
      summary: input.summary,
      session_date: input.session_date ?? null,
      location: input.location,
      is_public: input.is_public,
      status: input.status,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "insert_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
