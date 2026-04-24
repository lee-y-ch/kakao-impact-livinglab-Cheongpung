import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/current-actor";
import { recordAuthEvent } from "@/lib/auth/audit";
import { UuidSchema } from "@/lib/schemas/common";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOwnerCode } from "@/lib/utils/shop-credentials";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * POST   /api/admin/shop-owners/[id] — 코드 재발급 (기존 hash 교체, 실패 카운트/잠금 리셋)
 * DELETE /api/admin/shop-owners/[id] — 사장님 계정 삭제 (가게 잔존)
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

  const idCheck = UuidSchema.safeParse(params.id);
  if (!idCheck.success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let adminActor;
  try {
    adminActor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: owner, error: lookupErr } = await admin
    .from("shop_owners")
    .select("id, shop_id")
    .eq("id", idCheck.data)
    .maybeSingle();

  if (lookupErr) {
    return NextResponse.json(
      { error: "lookup_failed", message: lookupErr.message },
      { status: 500 }
    );
  }
  if (!owner) {
    return NextResponse.json({ error: "owner_not_found" }, { status: 404 });
  }

  const code = generateOwnerCode();
  const hash = await bcrypt.hash(code, 10);

  const { error } = await admin
    .from("shop_owners")
    .update({
      owner_code_hash: hash,
      failed_attempts: 0,
      locked_until: null,
    })
    .eq("id", idCheck.data);

  if (error) {
    return NextResponse.json(
      { error: "update_failed", message: error.message },
      { status: 500 }
    );
  }

  await recordAuthEvent({
    event_type: "role_change",
    actor_role: "admin",
    subject_key: idCheck.data,
    shop_id: owner.shop_id as string,
    meta: {
      action: "owner_code_reissued",
      issued_by: adminActor.supabaseUserId,
    },
  });

  return NextResponse.json({ ok: true, code });
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

  let adminActor;
  try {
    adminActor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: owner } = await admin
    .from("shop_owners")
    .select("id, shop_id")
    .eq("id", idCheck.data)
    .maybeSingle();

  const { error } = await admin
    .from("shop_owners")
    .delete()
    .eq("id", idCheck.data);
  if (error) {
    return NextResponse.json(
      { error: "delete_failed", message: error.message },
      { status: 500 }
    );
  }

  if (owner) {
    await recordAuthEvent({
      event_type: "role_change",
      actor_role: "admin",
      subject_key: idCheck.data,
      shop_id: (owner.shop_id as string) ?? null,
      meta: {
        action: "owner_removed",
        issued_by: adminActor.supabaseUserId,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
