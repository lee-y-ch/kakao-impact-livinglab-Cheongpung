import Link from "next/link";
import { redirect } from "next/navigation";

import type { ActivityCardData } from "@/components/activities/ActivityCard";
import { ActivityGrid } from "@/components/activities/ActivityGrid";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const HERO_CARD_LIMIT = 6;

/**
 * 루트 경로.
 *
 * 로그인 상태면 역할별 홈으로 분기하고, 비로그인이면 공개 랜딩을 렌더.
 * 공개 랜딩은 참여자 카드 히어로 + 임팩트 숫자 요약 + 카테고리 진입점으로 구성.
 */
export default async function HomePage() {
  const actor = await getCurrentActor();

  if (actor.role === "participant") redirect("/collection");
  if (actor.role === "owner") redirect("/owner");
  if (actor.role === "admin") redirect("/admin");
  if (actor.role === "crew") redirect("/crew");

  const admin = createAdminClient();
  const [heroRes, cardCountRes, shopCountRes, reactionCountRes, categoriesRes] =
    await Promise.all([
      admin
        .from("activities")
        .select(
          `
        id, type, body, title, photo_url, is_public, created_at,
        shop:shop_id (id, name),
        episode:episode_id (id, title),
        project:project_id (id, title, slug)
      `
        )
        .eq("is_public", true)
        .is("removed_at", null)
        .order("created_at", { ascending: false })
        .limit(HERO_CARD_LIMIT),
      admin
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("is_public", true)
        .is("removed_at", null),
      admin
        .from("shops")
        .select("id", { count: "exact", head: true })
        .eq("is_public", true),
      admin.from("reactions").select("id", { count: "exact", head: true }),
      admin
        .from("categories")
        .select("id, slug, name, description, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

  const heroCards: ActivityCardData[] = (heroRes.data ?? []).map((a) => ({
    id: a.id as string,
    type: a.type as string,
    body: (a.body as string | null) ?? null,
    title: (a.title as string | null) ?? null,
    photo_url: (a.photo_url as string | null) ?? null,
    is_public: Boolean(a.is_public),
    created_at: a.created_at as string,
    context: {
      shop: a.shop as { id: string; name: string } | null,
      episode: a.episode as { id: string; title: string } | null,
      project: a.project as { id: string; title: string; slug: string } | null,
    },
  }));

  const cardCount = cardCountRes.count ?? 0;
  const shopCount = shopCountRes.count ?? 0;
  const reactionCount = reactionCountRes.count ?? 0;
  const categories = categoriesRes.data ?? [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-14 px-6 py-14">
      <section className="flex flex-col items-center gap-5 text-center">
        <p className="text-xs font-medium tracking-wider text-muted-foreground">
          카카오임팩트 × 협동조합 청풍
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          오늘도 강화도가
          <br />
          조금씩 더 강화됩니다
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          참여자·크루·사장님의 환대 행위가 쌓여 강화의 서사가 되는 관계
          대시보드입니다. 환대로 만들어가는 세계, 강화유니버스.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/impact"
            className="rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            강화의 진척 보기
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:border-foreground"
          >
            참여자로 로그인
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-3 text-center sm:gap-6">
          <SummaryStat label="공개 카드" value={cardCount} />
          <SummaryStat label="가게" value={shopCount} />
          <SummaryStat label="응원" value={reactionCount} />
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">오늘 도착한 환대</h2>
          <Link
            href="/feed"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            피드 전체 →
          </Link>
        </div>
        <ActivityGrid
          cards={heroCards}
          interactive={false}
          empty={
            <p className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              아직 공개된 카드가 없어요. 현장에서 첫 카드가 도착하면 이 자리에
              나타나요.
            </p>
          }
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">환대의 네 갈래</h2>
          <Link
            href="/projects"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            프로젝트 전체 →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <Link
              key={c.id as string}
              href={`/projects?category=${c.slug as string}`}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-background p-5 transition hover:bg-muted/40"
            >
              <span className="eyebrow">카테고리</span>
              <span className="text-lg font-semibold tracking-tight">
                {c.name as string}
              </span>
              {c.description ? (
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {c.description as string}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <HomeFeature
          title="참여자 카드"
          body="오프라인에서 시작된 환대 순간이 카드 한 장으로 남습니다. 같은 자리에 여러 번 와도 카드는 여러 장, 뒷면이 두꺼워집니다."
        />
        <HomeFeature
          title="강화의 진척"
          body="참여자 카드와 크루의 기록이 4개 카테고리로 집계되어 '강화도가 얼마나 강화됐는가'를 누구나 볼 수 있습니다."
        />
        <HomeFeature
          title="편지와 응원"
          body="시간을 건너 도착하는 편지. 가게 사장님의 안부와 크루의 하이파이브가 카드 뒷면을 완성합니다."
        />
      </section>
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="eyebrow">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
        {new Intl.NumberFormat("ko-KR").format(value)}
      </dd>
    </div>
  );
}

function HomeFeature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
