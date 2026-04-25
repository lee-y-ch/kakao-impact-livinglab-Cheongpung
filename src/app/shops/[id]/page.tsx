import Link from "next/link";
import { notFound } from "next/navigation";

import type { ActivityCardData } from "@/components/activities/ActivityCard";
import { ActivityGrid } from "@/components/activities/ActivityGrid";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CARD_LIMIT = 24;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = { params: { id: string } };

/**
 * /shops/[id] — 공개 가게 상세.
 *
 * 가게 소개 + 이 가게에 연결된 공개 카드 그리드. 비공개 가게나 존재하지 않는
 * id 는 404. 사장님 설정 (/owner/settings) 에서 가게 공개 OFF 하면 바로 사라진다.
 */
export default async function ShopDetailPage({ params }: Params) {
  if (!UUID_RE.test(params.id)) notFound();

  const admin = createAdminClient();

  const { data: shop } = await admin
    .from("shops")
    .select("id, name, description, address, slogan, is_public")
    .eq("id", params.id)
    .maybeSingle();

  if (!shop || !shop.is_public) notFound();

  const [cardsRes, countRes] = await Promise.all([
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
      .eq("shop_id", shop.id as string)
      .eq("is_public", true)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(CARD_LIMIT),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id as string)
      .eq("is_public", true)
      .is("removed_at", null),
  ]);

  const cards: ActivityCardData[] = (cardsRes.data ?? []).map((a) => ({
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

  const totalCards = countRes.count ?? 0;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/shops" className="hover:text-foreground">
          가게
        </Link>
        <span>·</span>
        <span>{shop.name as string}</span>
      </div>

      <header className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {shop.name as string}
        </h1>
        {shop.slogan ? (
          <p className="text-sm italic text-muted-foreground">
            “{shop.slogan as string}”
          </p>
        ) : null}
        {shop.address ? (
          <p className="text-xs text-muted-foreground">
            {shop.address as string}
          </p>
        ) : null}
        {shop.description ? (
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {shop.description as string}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground/80">
            공개 카드 {totalCards}
          </span>
          <Link
            href={`/feed?shop=${shop.id as string}`}
            className="rounded-full border border-border px-2 py-0.5 transition hover:bg-muted/40"
          >
            피드에서 보기 →
          </Link>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">이 가게에서 쌓인 카드</h2>
          {totalCards > cards.length ? (
            <span className="text-xs text-muted-foreground">
              최근 {cards.length}장 · 총 {totalCards}장
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              총 {totalCards}장
            </span>
          )}
        </div>
        <ActivityGrid
          cards={cards}
          interactive={false}
          empty={
            <p className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              아직 공개된 카드가 없어요.
            </p>
          }
        />
      </section>
    </main>
  );
}
