import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/current-actor";
import { recordAuthEvent } from "@/lib/auth/audit";
import { UuidSchema } from "@/lib/schemas/common";
import { ShopOwnerCreateSchema } from "@/lib/schemas/shop";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOwnerCode } from "@/lib/utils/shop-credentials";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * POST /api/admin/shops/[id]/owners — 사장님 추가 + 8자리 코드 발급.
 *
 * 응답에만 평문 코드를 돌려주고 DB 는 bcrypt 해시만 보관한다.
 * 관리자 UI 는 이 값을 한 번만 보여주고 저장은 사용자 몫 — CLAUDE.md 의 "코드 재발급" 원칙.
 *
 * 재발급은 기존 owner 의 code_hash 를 갱신하는 대신 새 row 를 만들거나,
 * "리셋 버튼" 으로 같은 row 를 update. 여기선 새 사장님 추가만 지원 (재발급은 별도 라우트에서 처리 예정).
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

  const shopIdCheck = UuidSchema.safeParse(params.id);
  if (!shopIdCheck.success) {
    return NextResponse.json({ error: "invalid_shop_id" }, { status: 400 });
  }

  let adminActor;
  try {
    adminActor = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ShopOwnerCreateSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: "invalid_input",
        message: firstIssue?.message ?? "사장님 이름을 확인해주세요.",
        issues: parsed.error.format(),
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 가게 존재 확인
  const { data: shop, error: shopErr } = await admin
    .from("shops")
    .select("id")
    .eq("id", shopIdCheck.data)
    .maybeSingle();
  if (shopErr) {
    return NextResponse.json(
      { error: "lookup_failed", message: shopErr.message },
      { status: 500 }
    );
  }
  if (!shop) {
    return NextResponse.json({ error: "shop_not_found" }, { status: 404 });
  }

  const code = generateOwnerCode();
  const hash = await bcrypt.hash(code, 10);

  const { data, error } = await admin
    .from("shop_owners")
    .insert({
      shop_id: shopIdCheck.data,
      name: parsed.data.name,
      owner_code_hash: hash,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "insert_failed", message: error?.message ?? "발급 실패" },
      { status: 500 }
    );
  }

  await recordAuthEvent({
    event_type: "role_change",
    actor_role: "admin",
    subject_key: data.id as string,
    shop_id: shopIdCheck.data,
    meta: {
      action: "owner_code_issued",
      issued_by: adminActor.supabaseUserId,
      owner_name: parsed.data.name,
    },
  });

  return NextResponse.json({
    ok: true,
    owner_id: data.id,
    code, // 평문 — 한 번만 노출
  });
}
