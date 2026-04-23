import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/layout/LogoutButton";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * 참여자 프로필 — 닉네임·프로필 이미지·누적 요약·로그아웃.
 * 닉네임/프로필 이미지 편집은 Phase 7 로.
 */
export default async function MePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "participant") redirect("/login?next=/me");

  const supabase = createServerSupabase();
  const { count } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("user_id", actor.userId)
    .is("removed_at", null);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-8">
      <section className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
          {actor.profileImageUrl ? (
            <Image
              src={actor.profileImageUrl}
              alt={actor.nickname ?? "프로필"}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
              {(actor.nickname ?? "?").slice(0, 1)}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight">
            {actor.nickname ?? "강화 여행자"}
          </h1>
          <p className="text-xs text-muted-foreground">
            카카오 계정으로 로그인했어요.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">누적 카드</span>
          <span className="text-xl font-semibold tabular-nums">
            {count ?? 0}
            <span className="ml-0.5 text-sm font-normal text-muted-foreground">
              장
            </span>
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-2 text-sm">
        <Link
          href="/collection"
          className="rounded-xl border border-border bg-background px-4 py-3 transition hover:bg-muted/60"
        >
          내 도감 보기 →
        </Link>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
        <h2 className="text-sm font-medium">계정</h2>
        <p className="text-xs text-muted-foreground">
          로그아웃하면 다시 카카오 로그인이 필요해요.
        </p>
        <div className="self-start">
          <LogoutButton actorRole="participant" />
        </div>
      </section>
    </main>
  );
}
