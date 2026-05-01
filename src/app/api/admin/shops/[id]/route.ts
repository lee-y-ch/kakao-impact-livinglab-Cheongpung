import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { ShopUpdateSchema } from "@/lib/schemas/shop";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * PATCH  /api/admin/shops/[id] — 부분 수정.
 * DELETE /api/admin/shops/[id] — 하드 삭제. shop_owners cascade.
 *
 * activities.shop_id 는 on delete set null 이라 기존 카드의 가게 연결만 끊어지고 카드 자체는 유지.
 */
type Ctx = { params: { id: string } };
type ShopUpdate = Database["public"]["Tables"]["shops"]["Update"];

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
  const parsed = ShopUpdateSchema.safeParse(body);
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
  const patch: ShopUpdate = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.address !== undefined) patch.address = input.address;
  if (input.lat !== undefined) patch.lat = input.lat;
  if (input.lng !== undefined) patch.lng = input.lng;
  if (input.is_public !== undefined) patch.is_public = input.is_public;
  if (input.qr_token !== undefined) patch.qr_token = input.qr_token;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }
  patch.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { error } = await admin
    .from("shops")
    .update(patch)
    .eq("id", idCheck.data);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: "duplicate_qr_token",
          message: "이미 사용 중인 qr_token 입니다.",
        },
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
  const { error } = await admin.from("shops").delete().eq("id", idCheck.data);
  if (error) {
    return NextResponse.json(
      { error: "delete_failed", message: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
