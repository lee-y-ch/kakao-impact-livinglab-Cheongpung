import { notFound, redirect } from "next/navigation";

import { ActivityForm } from "@/components/activities/ActivityForm";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

/**
 * QR 진입 — 현장에 설치된 QR 을 찍었을 때 도착하는 페이지.
 *
 * 시나리오:
 *   1. 비로그인 → /login?next=/entry/[qr_token] 으로 튕김 → 카카오 OAuth → 이 페이지로 복귀
 *   2. 참여자 로그인 → 카드 작성 폼
 *   3. 그 외(사장님·크루·관리자) → /collection 은 막혀 있으니 간단 안내만
 *
 * QR 토큰은 public.shops.qr_token 에 저장된 값. 가게 단위 QR 이며 에피소드용 QR 은 풀버전에서.
 */

type Params = { qr_token: string };

export default async function EntryPage({ params }: { params: Params }) {
  const qrToken = decodeURIComponent(params.qr_token);
  const supabase = createServerSupabase();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, is_public")
    .eq("qr_token", qrToken)
    .maybeSingle();

  if (!shop) notFound();

  const actor = await getCurrentActor();

  if (actor.role === "anonymous") {
    redirect(`/login?next=${encodeURIComponent(`/entry/${params.qr_token}`)}`);
  }

  if (actor.role !== "participant") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">
          카드 발급은 참여자 계정에서만 가능해요
        </h1>
        <p className="text-sm text-muted-foreground">
          카카오 계정으로 로그인한 상태에서 다시 QR 을 찍어주세요.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          오늘의 환대
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{shop.name}</h1>
        <p className="text-sm text-muted-foreground">
          사진이든 한 줄 메모든, 오늘의 한 조각을 남겨주세요.
        </p>
      </header>

      <ActivityForm
        context={{
          shopId: shop.id,
          label: shop.name,
        }}
      />
    </main>
  );
}
