import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/current-actor";
import { ProjectCreateSchema } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * 관리자 프로젝트 생성.
 * 필드 검증은 Zod + progress_type 별 progress_target 구조 점검.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof CsrfError) {
      return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
    }
    throw err;
  }

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ProjectCreateSchema.safeParse(body);
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
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("projects")
    .insert({
      category_id: input.category_id,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      description: input.description,
      is_public: input.is_public,
      progress_type: input.progress_type,
      progress_target: input.progress_target as Json,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: "duplicate_slug",
          message: "이미 사용 중인 slug 입니다.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "insert_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
