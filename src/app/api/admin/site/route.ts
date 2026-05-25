import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { recordAuthEvent } from "@/lib/auth/audit";
import { requireAdmin } from "@/lib/auth/current-actor";
import { HeroUpdateSchema } from "@/lib/schemas/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * POST /api/admin/site — 관리자 hero 설정 수정 (multipart/form-data).
 *
 * 보안·계약:
 *   - admin 세션 필수 (Supabase Auth role=admin)
 *   - Origin 검증 (CSRF)
 *   - 텍스트 필드는 HeroUpdateSchema 로 검증
 *   - image 파일이 첨부되면 site-assets 버킷에 업로드 후 public URL 을 hero_image_url 에 저장
 *   - 이미지 없이 텍스트만 보내면 텍스트만 갱신 (기존 이미지 유지)
 *   - site_settings.key='hero' 행을 update (없으면 insert)
 */

const STORAGE_BUCKET = "site-assets";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof CsrfError) {
      return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
    }
    throw err;
  }

  let actor;
  try {
    actor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  const parsed = HeroUpdateSchema.safeParse({
    hero_eyebrow: form.get("hero_eyebrow") ?? undefined,
    hero_title: form.get("hero_title") ?? undefined,
    hero_accent: form.get("hero_accent") ?? undefined,
    hero_subtitle: form.get("hero_subtitle") ?? undefined,
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

  const admin = createAdminClient();

  // 이미지 업로드 (선택)
  let imageUrl: string | null = null;
  const imageEntry = form.get("image");
  if (imageEntry instanceof File && imageEntry.size > 0) {
    if (imageEntry.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          error: "image_too_large",
          message: "이미지는 10MB 이하만 올릴 수 있어요.",
        },
        { status: 400 }
      );
    }
    if (!imageEntry.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "invalid_image", message: "이미지 파일만 올릴 수 있어요." },
        { status: 400 }
      );
    }

    const ext =
      imageEntry.type === "image/png"
        ? "png"
        : imageEntry.type === "image/webp"
          ? "webp"
          : "jpg";
    const objectKey = `hero/${randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(objectKey, imageEntry, {
        contentType: imageEntry.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: "upload_failed",
          message:
            "이미지 업로드에 실패했어요. site-assets 버킷이 있는지 확인해주세요.",
        },
        { status: 500 }
      );
    }

    const { data: publicUrl } = admin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(objectKey);
    imageUrl = publicUrl.publicUrl;
  }

  const patch: Record<string, string | null> = {
    hero_eyebrow: parsed.data.hero_eyebrow,
    hero_title: parsed.data.hero_title,
    hero_accent: parsed.data.hero_accent,
    hero_subtitle: parsed.data.hero_subtitle,
    updated_by: actor.supabaseUserId,
  };
  if (imageUrl) {
    patch.hero_image_url = imageUrl;
  }

  // key='hero' 행 upsert — 마이그레이션 시드가 있으면 update, 없으면 insert.
  const { error: upsertError } = await admin
    .from("site_settings")
    .upsert({ key: "hero", ...patch }, { onConflict: "key" });

  if (upsertError) {
    return NextResponse.json(
      { error: "update_failed", message: upsertError.message },
      { status: 500 }
    );
  }

  await recordAuthEvent({
    event_type: "role_change",
    actor_role: "admin",
    subject_key: "site_settings:hero",
    meta: {
      action: "hero_update",
      updated_by: actor.supabaseUserId,
      image_changed: imageUrl != null,
    },
  });

  return NextResponse.json({ ok: true, imageUrl });
}
