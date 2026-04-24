import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/current-actor";
import { ShopCreateSchema } from "@/lib/schemas/shop";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQrToken } from "@/lib/utils/shop-credentials";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

/**
 * POST /api/admin/shops — 새 가게 생성.
 * qr_token 이 비어 있으면 랜덤 생성. 충돌 시 최대 5회 재시도.
 */
const MAX_QR_RETRIES = 5;

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
  const parsed = ShopCreateSchema.safeParse(body);
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

  let qrToken = input.qr_token ?? generateQrToken();
  let insertedId: string | null = null;

  for (let attempt = 0; attempt < MAX_QR_RETRIES; attempt += 1) {
    const { data, error } = await admin
      .from("shops")
      .insert({
        name: input.name,
        description: input.description,
        address: input.address,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        is_public: input.is_public,
        qr_token: qrToken,
      })
      .select("id")
      .single();

    if (!error && data) {
      insertedId = data.id as string;
      break;
    }

    const isUnique = error?.code === "23505";
    const userProvidedToken = Boolean(input.qr_token);
    if (isUnique && !userProvidedToken) {
      qrToken = generateQrToken();
      continue;
    }

    if (isUnique && userProvidedToken) {
      return NextResponse.json(
        {
          error: "duplicate_qr_token",
          message: "이미 사용 중인 qr_token 입니다.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "insert_failed",
        message: error?.message ?? "가게 생성에 실패했어요.",
      },
      { status: 500 }
    );
  }

  if (!insertedId) {
    return NextResponse.json(
      {
        error: "qr_token_collision",
        message: "qr_token 충돌이 반복돼 저장에 실패했어요. 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: insertedId, qr_token: qrToken });
}
