import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * /shops — 공개 가게 그리드.
 *
 * 공개된 shop 만 노출. 카드 수가 많은 가게를 먼저 (참여자 체류 신호).
 * 비공개 가게는 목록에 노출하지 않음.
 */
export default async function ShopsPage() {
  const admin = createAdminClient();

  const { data: shopsRaw } = await admin
    .from("shops")
    .select("id, name, description, address, slogan")
    .eq("is_public", true)
    .order("updated_at", { ascending: false });
  const shops = shopsRaw ?? [];

  let activityCountByShop = new Map<string, number>();
  if (shops.length > 0) {
    const { data: acts } = await admin
      .from("activities")
      .select("shop_id")
      .in(
        "shop_id",
        shops.map((s) => s.id as string)
      )
      .eq("is_public", true)
      .is("removed_at", null);
    for (const r of acts ?? []) {
      const sid = r.shop_id as string | null;
      if (!sid) continue;
      activityCountByShop.set(sid, (activityCountByShop.get(sid) ?? 0) + 1);
    }
  }

  const sorted = shops
    .map((s) => ({
      ...s,
      cardCount: activityCountByShop.get(s.id as string) ?? 0,
    }))
    .sort((a, b) => b.cardCount - a.cardCount);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          강화유니버스 가게
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          환대가 오래 머무는 자리
        </h1>
        <p className="text-sm text-muted-foreground">
          청풍과 연결된 강화의 가게들. 가게를 누르면 그 공간에서 쌓인 공개
          카드를 볼 수 있어요.
        </p>
      </header>

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          아직 공개된 가게가 없어요.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((s) => (
            <li key={s.id as string}>
              <Link
                href={`/shops/${s.id as string}`}
                className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-background p-5 transition hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="truncate text-base font-semibold">
                      {s.name as string}
                    </h2>
                    {s.address ? (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {s.address as string}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                    카드 {s.cardCount}
                  </span>
                </div>
                {s.slogan ? (
                  <p className="text-xs italic text-muted-foreground">
                    “{s.slogan as string}”
                  </p>
                ) : null}
                {s.description ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {s.description as string}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
