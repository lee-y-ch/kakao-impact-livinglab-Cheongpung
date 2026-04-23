import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivityGrid } from "@/components/activities/ActivityGrid";
import type { ActivityCardData } from "@/components/activities/ActivityCard";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * 참여자 도감 — 본인 activities 만 RLS 로 스코프됨.
 * 개인 점수 UI 는 의도적으로 두지 않고, "몇 장·몇 가게·몇 카테고리" 수준의 집계만 표시한다.
 */
export default async function CollectionPage() {
  const actor = await getCurrentActor();
  if (actor.role !== "participant") redirect("/login?next=/collection");

  const supabase = createServerSupabase();

  const { data: rows, error } = await supabase
    .from("activities")
    .select(
      `id, type, body, title, photo_url, is_public, created_at, shop_id, episode_id, project_id,
       shops:shop_id(id, name),
       episodes:episode_id(id, title),
       projects:project_id(id, title, slug)`
    )
    .eq("user_id", actor.userId)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          내 도감
        </h1>
        <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          카드를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
        </p>
      </main>
    );
  }

  const cards: ActivityCardData[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    type: r.type as string,
    body: (r.body as string | null) ?? null,
    title: (r.title as string | null) ?? null,
    photo_url: (r.photo_url as string | null) ?? null,
    is_public: Boolean(r.is_public),
    created_at: r.created_at as string,
    context: {
      shop: r.shops ? { id: r.shops.id, name: r.shops.name } : null,
      episode: r.episodes
        ? { id: r.episodes.id, title: r.episodes.title }
        : null,
      project: r.projects
        ? { id: r.projects.id, title: r.projects.title, slug: r.projects.slug }
        : null,
    },
  }));

  const totalCards = cards.length;
  const publicCards = cards.filter((c) => c.is_public).length;
  const uniqueShops = new Set(
    cards.map((c) => c.context.shop?.id).filter((v): v is string => Boolean(v))
  ).size;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          나의 도감
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {actor.nickname ?? "강화 여행자"}님의 환대 기록
        </h1>
        <p className="text-sm text-muted-foreground">
          쌓여가는 한 장 한 장이 강화도의 서사가 됩니다.
        </p>
      </header>

      <section
        aria-label="누적 요약"
        className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-background p-4"
      >
        <Stat label="카드" value={totalCards} suffix="장" />
        <Stat label="공개 카드" value={publicCards} suffix="장" />
        <Stat label="만난 가게" value={uniqueShops} suffix="곳" />
      </section>

      <section className="mt-8">
        <ActivityGrid
          cards={cards}
          empty={
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                아직 발급된 카드가 없어요. 현장의 QR 을 찍고 첫 카드를
                남겨보세요.
              </p>
              <Link
                href="/"
                className="text-sm font-medium text-foreground underline underline-offset-4"
              >
                공개 피드 둘러보기
              </Link>
            </div>
          }
        />
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">
        {value}
        <span className="ml-0.5 text-sm font-normal text-muted-foreground">
          {suffix}
        </span>
      </span>
    </div>
  );
}
