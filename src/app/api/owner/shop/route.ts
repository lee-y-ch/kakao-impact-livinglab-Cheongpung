import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireOwner } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, CsrfError } from "@/lib/utils/csrf";

const OwnerShopUpdateSchema = z.object({
  is_public: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (err) {
    if (err instanceof CsrfError) {
      return NextResponse.json({ error: "csrf_failed" }, { status: 403 });
    }
    throw err;
  }

  let actor: Awaited<ReturnType<typeof requireOwner>>;
  try {
    actor = await requireOwner();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = OwnerShopUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("shops")
    .update({
      is_public: parsed.data.is_public,
      updated_at: new Date().toISOString(),
    })
    .eq("id", actor.shopId);

  if (error) {
    return NextResponse.json(
      { error: "update_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
