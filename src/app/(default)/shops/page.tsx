import Link from "next/link";

import {
  LegacyContainer,
  LegacyHeader,
  LegacyPage,
  LegacyPanel,
} from "@/components/legacy-v2/PageChrome";
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
    <LegacyPage>
      <LegacyContainer>
        <LegacyHeader
          eyebrow="Shops"
          title="환대가 오래 머무는 자리"
          description="청풍과 연결된 강화의 가게들입니다. 각 가게 안에서 쌓인 공개 카드와 분위기를 이어서 살펴볼 수 있습니다."
        />

        {sorted.length === 0 ? (
          <p className="v2-legacy-empty">아직 공개된 가게가 없어요.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((s) => (
              <li key={s.id as string}>
                <Link
                  href={`/shops/${s.id as string}`}
                  className="block h-full"
                >
                  <LegacyPanel className="flex h-full flex-col gap-4 transition hover:-translate-y-[2px]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="v2-legacy-kicker mb-2">Shop</p>
                        <h2 className="truncate text-lg font-semibold tracking-[-0.03em] text-v2-ink">
                          {s.name as string}
                        </h2>
                        {s.address ? (
                          <p className="mt-1 truncate text-[12px] text-v2-ink3">
                            {s.address as string}
                          </p>
                        ) : null}
                      </div>
                      <span className="v2-legacy-pill shrink-0">
                        카드 {s.cardCount}
                      </span>
                    </div>
                    {s.slogan ? (
                      <p className="serif text-sm text-v2-ink2">
                        “{s.slogan as string}”
                      </p>
                    ) : null}
                    {s.description ? (
                      <p className="line-clamp-3 text-sm leading-[1.8] text-v2-ink3">
                        {s.description as string}
                      </p>
                    ) : null}
                  </LegacyPanel>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </LegacyContainer>
    </LegacyPage>
  );
}
