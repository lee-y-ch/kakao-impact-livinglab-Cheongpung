import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { requireParticipant } from "@/lib/auth/current-actor";
import { ActivityCreateSchema } from "@/lib/schemas/activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * 참여자 카드 발급 — POST /api/activities (multipart/form-data).
 *
 * 보안·계약:
 *   - participant 세션 필수 (Supabase Auth)
 *   - Origin 검증 (CSRF)
 *   - idempotency_key 기반 dedup: 같은 user_id + key 조합이 이미 있으면 기존 행 반환
 *   - 사진은 Supabase Storage `activity-photos` 로 업로드 (service role)
 *     → 이후 activities.photo_url 에 public URL 저장
 *   - RLS 우회가 필요한 Storage 업로드 때문에 admin 클라이언트 사용.
 *     DB insert 역시 admin — 단, user_id 는 서버에서 참여자 세션 기반으로 강제 주입 (클라 값 신뢰 X).
 *
 * 실패 정책:
 *   - Zod 실패 → 400
 *   - 사진 업로드 실패 → 500
 *   - DB unique 충돌 (같은 idempotency_key 재시도) → 기존 행 다시 조회해 200 반환
 */

const STORAGE_BUCKET = "activity-photos";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof CsrfError) {
      return NextResponse.json(
        { error: "csrf_failed", message: "요청 출처를 확인하지 못했어요." },
        { status: 403 }
      );
    }
    throw err;
  }

  let actor;
  try {
    actor = await requireParticipant();
  } catch {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "카카오 로그인 후 다시 시도해주세요.",
      },
      { status: 401 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json(
      { error: "unsupported_media_type", message: "잘못된 요청 형식입니다." },
      { status: 415 }
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { error: "invalid_form", message: "폼 데이터를 읽지 못했어요." },
      { status: 400 }
    );
  }

  const parsed = ActivityCreateSchema.safeParse({
    type: form.get("type") ?? undefined,
    body: form.get("body") ?? undefined,
    title: form.get("title") ?? undefined,
    hasPhoto: form.get("hasPhoto") ?? undefined,
    is_public: form.get("is_public") ?? undefined,
    face_consent: form.get("face_consent") ?? undefined,
    shop_id: form.get("shop_id") ?? undefined,
    episode_id: form.get("episode_id") ?? undefined,
    project_id: form.get("project_id") ?? undefined,
    idempotency_key: form.get("idempotency_key") ?? undefined,
  });

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

  // idempotency_key 충돌 — 같은 참여자 + 같은 key 로 이미 저장됐으면 기존 row 반환
  const { data: existing } = await admin
    .from("activities")
    .select("id")
    .eq("user_id", actor.userId)
    .eq("idempotency_key", input.idempotency_key)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, id: existing.id, deduped: true });
  }

  // 사진 업로드 (선택)
  let photoUrl: string | null = null;
  const photoEntry = form.get("photo");

  if (input.hasPhoto) {
    if (!(photoEntry instanceof File) || photoEntry.size === 0) {
      return NextResponse.json(
        {
          error: "photo_missing",
          message: "사진이 첨부되지 않았어요. 다시 선택해주세요.",
        },
        { status: 400 }
      );
    }

    const ext =
      photoEntry.type === "image/png"
        ? "png"
        : photoEntry.type === "image/webp"
          ? "webp"
          : "jpg";
    const objectKey = `${actor.userId}/${randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(objectKey, photoEntry, {
        contentType: photoEntry.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: "upload_failed",
          message: "사진 업로드에 실패했어요. 잠시 후 다시 시도해주세요.",
        },
        { status: 500 }
      );
    }

    const { data: publicUrl } = admin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(objectKey);
    photoUrl = publicUrl.publicUrl;
  }

  const { data: inserted, error: insertError } = await admin
    .from("activities")
    .insert({
      user_id: actor.userId,
      type: input.type,
      body: input.body ?? null,
      title: input.title ?? null,
      photo_url: photoUrl,
      is_public: input.is_public,
      face_consent: input.face_consent,
      shop_id: input.shop_id ?? null,
      episode_id: input.episode_id ?? null,
      project_id: input.project_id ?? null,
      idempotency_key: input.idempotency_key,
    })
    .select("id")
    .single();

  if (insertError) {
    // unique 충돌 (경쟁 조건) → 기존 행을 다시 조회해서 반환
    if (insertError.code === "23505") {
      const { data: rerun } = await admin
        .from("activities")
        .select("id")
        .eq("user_id", actor.userId)
        .eq("idempotency_key", input.idempotency_key)
        .maybeSingle();
      if (rerun) {
        return NextResponse.json({ ok: true, id: rerun.id, deduped: true });
      }
    }
    return NextResponse.json(
      {
        error: "insert_failed",
        message: "카드를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
