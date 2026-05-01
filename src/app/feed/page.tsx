import Image from "next/image";
import Link from "next/link";

import { GhWordmark } from "@/components/claude/primitives";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const FEED_LIMIT = 60;
const TOP_PROJECTS = 4;
const TOP_PLACES = 5;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CATEGORY_COLOR: Record<string, string> = {
  commons: "var(--cat-commons)",
  network: "var(--cat-network)",
  world: "var(--cat-world)",
  policy: "var(--cat-policy)",
};

type SearchParams = {
  category?: string;
  project?: string;
  shop?: string;
};

/**
 * /feed — Claude editorial 톤의 공개 카드 피드.
 *
 * 출처: Claude artifact pages/FeedDesktop.jsx (2026-04-29).
 * 시각: 시안 그대로 (3-col 240/1fr/300 · 좌 필터 · 중앙 그리드 · 우 큐레이션)
 * 기능: 우리 기존 URL 기반 필터 (?category | ?project | ?shop) 그대로 유지.
 *
 * Claude 시안의 useState 필터는 server-side URL 필터로 대체 — share-friendly.
 * THIS WEEK 큐레이션 카피는 schema 데이터로 자동 생성 어려워 정적 placeholder.
 */
export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = createAdminClient();

  const filter = await resolveFilter(admin, searchParams);

  // ─────────────────────────────────────────────────────────────
  // 메인 카드 쿼리 (필터 적용)
  // ─────────────────────────────────────────────────────────────
  let query = admin
    .from("activities")
    .select(
      `id, type, body, title, photo_url, is_public, created_at, shop_id,
       shop:shop_id (id, name),
       episode:episode_id (id, title),
       project:project_id (id, title, slug, category_id)`
    )
    .eq("is_public", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (filter?.kind === "shop") {
    query = query.eq("shop_id", filter.shopId);
  } else if (filter?.kind === "project") {
    if (filter.episodeIds.length > 0) {
      query = query.or(
        `project_id.eq.${filter.projectId},episode_id.in.(${filter.episodeIds.join(",")})`
      );
    } else {
      query = query.eq("project_id", filter.projectId);
    }
  } else if (filter?.kind === "category") {
    const projectClause =
      filter.projectIds.length > 0
        ? `project_id.in.(${filter.projectIds.join(",")})`
        : null;
    const episodeClause =
      filter.episodeIds.length > 0
        ? `episode_id.in.(${filter.episodeIds.join(",")})`
        : null;
    const clauses = [projectClause, episodeClause].filter(
      (c): c is string => c !== null
    );
    if (clauses.length > 0) {
      query = query.or(clauses.join(","));
    } else {
      // 카테고리에 해당 프로젝트·에피소드가 없음 — 빈 결과 강제
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 좌측 패널 카운트 / 우측 큐레이션 데이터
  // ─────────────────────────────────────────────────────────────
  const [
    cardsRes,
    categoriesRes,
    catCountsRes,
    topProjectsRes,
    topShopsRes,
    totalPublicRes,
  ] = await Promise.all([
    query,
    admin
      .from("categories")
      .select("id, slug, name, sort_order")
      .order("sort_order", { ascending: true }),
    // 카테고리별 카드 수: activities.project.category_id 기준
    admin
      .from("activities")
      .select("project:project_id (category_id)")
      .eq("is_public", true)
      .is("removed_at", null),
    // 진행 중 프로젝트 (좌측 BY PROJECT)
    admin
      .from("projects")
      .select(
        "id, slug, title, category_id, progress_type, progress_target, updated_at"
      )
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(TOP_PROJECTS),
    // 가장 카드 많은 가게 — 카드 수 group by 는 client side 에서 집계
    admin
      .from("activities")
      .select("shop_id, shop:shop_id (id, name)")
      .eq("is_public", true)
      .is("removed_at", null)
      .not("shop_id", "is", null),
    // 전체 공개 카드 수
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true)
      .is("removed_at", null),
  ]);

  const categories = categoriesRes.data ?? [];
  const cards = cardsRes.data ?? [];
  const totalPublic = totalPublicRes.count ?? 0;

  // 카테고리별 카드 수
  const catCounts = new Map<string, number>();
  for (const r of catCountsRes.data ?? []) {
    const cat = r.project as { category_id: string } | null;
    if (!cat?.category_id) continue;
    catCounts.set(cat.category_id, (catCounts.get(cat.category_id) ?? 0) + 1);
  }

  // 가게별 카드 수 → 상위 5개
  type ShopRow = {
    shop_id: string | null;
    shop: { id: string; name: string } | null;
  };
  const shopMap = new Map<string, { name: string; count: number }>();
  for (const r of (topShopsRes.data ?? []) as ShopRow[]) {
    if (!r.shop_id || !r.shop) continue;
    const cur = shopMap.get(r.shop_id) ?? { name: r.shop.name, count: 0 };
    cur.count += 1;
    shopMap.set(r.shop_id, cur);
  }
  const topShops = [...shopMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, TOP_PLACES);

  return (
    <div
      className="gh-scroll"
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--ui-font)",
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "240px 1fr 300px",
      }}
    >
      {/* LEFT — filters */}
      <aside
        style={{
          borderRight: "1px solid var(--rule)",
          padding: "40px 28px",
          background: "var(--paper-2)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <GhWordmark size={13} mono />
        </Link>

        <RailLabel style={{ marginTop: 32 }}>CATEGORY</RailLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            marginTop: 14,
          }}
        >
          <FilterRow
            href="/feed"
            label="전체"
            count={totalPublic}
            color="var(--ink-3)"
            active={!filter}
          />
          {categories.map((c) => {
            const active =
              filter?.kind === "category" && filter.slug === c.slug;
            return (
              <FilterRow
                key={c.id as string}
                href={`/feed?category=${c.slug as string}`}
                label={c.name as string}
                count={catCounts.get(c.id as string) ?? 0}
                color={CATEGORY_COLOR[c.slug as string] ?? "var(--ink-3)"}
                active={active}
              />
            );
          })}
        </div>

        <RailLabel style={{ marginTop: 32 }}>BY PROJECT</RailLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 14,
          }}
        >
          {(topProjectsRes.data ?? []).map((p) => {
            const active = filter?.kind === "project" && filter.slug === p.slug;
            return (
              <Link
                key={p.id as string}
                href={`/feed?project=${p.slug as string}`}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px 0",
                  textAlign: "left",
                  fontSize: 12,
                  color: "var(--ink-2)",
                  fontFamily: "var(--ui-font)",
                  textDecoration: "none",
                }}
              >
                <span
                  className="serif"
                  style={{
                    fontWeight: active ? 700 : 600,
                    color: "var(--ink)",
                  }}
                >
                  {p.title as string}
                </span>
              </Link>
            );
          })}
        </div>

        <RailLabel style={{ marginTop: 32 }}>PERIOD</RailLabel>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginTop: 14,
          }}
        >
          {(["전체", "7일", "30일", "90일", "올해"] as const).map((t, i) => (
            <span
              key={t}
              style={{
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: i === 0 ? "var(--ink)" : "var(--ink-3)",
                padding: "4px 8px",
                border: `1px solid ${i === 0 ? "var(--ink)" : "var(--rule)"}`,
                cursor: "default",
              }}
              title="기간 필터는 곧 추가됩니다"
            >
              {t}
            </span>
          ))}
        </div>

        {filter ? (
          <Link
            href="/feed"
            style={{
              display: "inline-block",
              marginTop: 32,
              padding: "8px 12px",
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              fontSize: 11,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-2)",
              textDecoration: "none",
              letterSpacing: "0.06em",
            }}
          >
            필터 지우기 ×
          </Link>
        ) : null}
      </aside>

      {/* CENTER — feed */}
      <main style={{ padding: "40px 56px" }}>
        <div
          style={{
            fontSize: 10.5,
            fontFamily: "var(--mono-font)",
            color: "var(--ink-3)",
            letterSpacing: "0.18em",
            marginBottom: 8,
          }}
        >
          PUBLIC FEED · 공개로 표시된 카드만
        </div>
        <h1
          className="serif"
          style={{
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: "-0.035em",
            margin: "0 0 8px",
            lineHeight: 1.1,
          }}
        >
          {filter ? (
            <>
              {filterTitle(filter)}
              <br />
              에서 모인 환대
            </>
          ) : (
            <>
              오늘 강화도에서
              <br />
              일어난 순간들
            </>
          )}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            color: "var(--ink-3)",
            fontSize: 12,
            marginBottom: 32,
          }}
        >
          <span style={{ fontFamily: "var(--mono-font)" }}>
            {cards.length}장
          </span>
          <span style={{ color: "var(--rule)" }}>·</span>
          <span>경쟁 없음 · 좋아요 없음 · 시간순</span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--mono-font)",
              fontSize: 11,
            }}
          >
            SORT ↓ 최근
          </span>
        </div>

        {cards.length === 0 ? (
          <p
            style={{
              border: "1px dashed var(--rule)",
              padding: "60px 24px",
              textAlign: "center",
              fontSize: 14,
              color: "var(--ink-3)",
              background: "var(--paper-2)",
              fontFamily: "var(--serif-font)",
              lineHeight: 1.7,
            }}
          >
            조건에 맞는 공개 카드가 아직 없어요.
            <br />
            필터를 지우거나 다른 카테고리를 둘러보세요.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {cards.map((c, i) => (
              <FeedCard
                key={c.id as string}
                card={{
                  id: c.id as string,
                  body: (c.body as string | null) ?? null,
                  photo_url: (c.photo_url as string | null) ?? null,
                  created_at: c.created_at as string,
                  shop: c.shop as { id: string; name: string } | null,
                  episode: c.episode as { id: string; title: string } | null,
                  project: c.project as {
                    id: string;
                    title: string;
                    slug: string;
                    category_id: string;
                  } | null,
                }}
                position={i}
                categories={categories.map((cat) => ({
                  id: cat.id as string,
                  slug: cat.slug as string,
                  name: cat.name as string,
                }))}
              />
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 48,
            padding: "18px 24px",
            border: "1px solid var(--rule)",
            textAlign: "center",
            fontSize: 12,
            color: "var(--ink-3)",
            fontFamily: "var(--serif-font)",
            lineHeight: 1.8,
          }}
        >
          여기까지 보고 있다면 — 이 도시의 한 장면을 같이 본 셈입니다.
        </div>
      </main>

      {/* RIGHT — curation */}
      <aside
        style={{
          borderLeft: "1px solid var(--rule)",
          padding: "40px 28px",
          background: "var(--paper-2)",
        }}
      >
        <RailLabel>THIS WEEK · 이번 주 모이는 풍경</RailLabel>
        <div
          style={{
            paddingBottom: 18,
            borderBottom: "1px solid var(--rule)",
            marginTop: 14,
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.4,
              letterSpacing: "-0.015em",
              marginBottom: 8,
            }}
          >
            공개로 모인 카드를
            <br />
            시간순으로 흐르게 두었어요.
          </div>
          <div
            style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.7 }}
          >
            좋아요·랭킹 없이 한 장씩 보세요. 마음에 닿는 카드는 남겨둔 사람이
            언젠가 알게 됩니다.
          </div>
        </div>

        <RailLabel style={{ marginTop: 24 }}>
          PLACES · 자주 등장한 장소
        </RailLabel>
        <div style={{ marginTop: 8 }}>
          {topShops.length === 0 ? (
            <p
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                fontFamily: "var(--serif-font)",
                padding: "10px 0",
              }}
            >
              아직 데이터가 부족해요.
            </p>
          ) : (
            topShops.map(([id, info]) => (
              <Link
                key={id}
                href={`/feed?shop=${id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--rule-2)",
                  textDecoration: "none",
                  color: "var(--ink)",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontFamily: "var(--serif-font)",
                  }}
                >
                  {info.name}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontFamily: "var(--mono-font)",
                    color: "var(--ink-3)",
                  }}
                >
                  {info.count}장
                </span>
              </Link>
            ))
          )}
        </div>

        <div
          style={{
            marginTop: 32,
            padding: 14,
            border: "1px solid var(--ink)",
            fontSize: 11,
            lineHeight: 1.7,
            color: "var(--ink-2)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono-font)",
              fontSize: 10,
              color: "var(--ink)",
              letterSpacing: "0.12em",
              marginBottom: 4,
            }}
          >
            NOTE
          </div>
          좋아요·팔로우·랭킹은 없습니다. 카드는 시간순으로만 흐르고, 공개로
          동의한 글만 보입니다.
        </div>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Filter resolver — URL search params → typed filter
 * ───────────────────────────────────────────────────────────── */

type ResolvedFilter =
  | {
      kind: "category";
      slug: string;
      name: string;
      projectIds: string[];
      episodeIds: string[];
    }
  | {
      kind: "project";
      slug: string;
      title: string;
      projectId: string;
      episodeIds: string[];
    }
  | { kind: "shop"; shopId: string; name: string }
  | null;

async function resolveFilter(
  admin: ReturnType<typeof createAdminClient>,
  params: SearchParams
): Promise<ResolvedFilter> {
  if (params.project) {
    const { data: p } = await admin
      .from("projects")
      .select("id, title, slug, is_public")
      .eq("slug", params.project)
      .maybeSingle();
    if (!p || !p.is_public) return null;
    const { data: eps } = await admin
      .from("episodes")
      .select("id")
      .eq("project_id", p.id as string)
      .eq("is_public", true);
    return {
      kind: "project",
      slug: p.slug as string,
      title: p.title as string,
      projectId: p.id as string,
      episodeIds: (eps ?? []).map((e) => e.id as string),
    };
  }

  if (params.shop && UUID_RE.test(params.shop)) {
    const { data: s } = await admin
      .from("shops")
      .select("id, name, is_public")
      .eq("id", params.shop)
      .maybeSingle();
    if (!s || !s.is_public) return null;
    return { kind: "shop", shopId: s.id as string, name: s.name as string };
  }

  if (params.category) {
    const { data: c } = await admin
      .from("categories")
      .select("id, slug, name")
      .eq("slug", params.category)
      .maybeSingle();
    if (!c) return null;
    const { data: projects } = await admin
      .from("projects")
      .select("id")
      .eq("category_id", c.id as string)
      .eq("is_public", true);
    const projectIds = (projects ?? []).map((p) => p.id as string);
    let episodeIds: string[] = [];
    if (projectIds.length > 0) {
      const { data: eps } = await admin
        .from("episodes")
        .select("id")
        .in("project_id", projectIds)
        .eq("is_public", true);
      episodeIds = (eps ?? []).map((e) => e.id as string);
    }
    return {
      kind: "category",
      slug: c.slug as string,
      name: c.name as string,
      projectIds,
      episodeIds,
    };
  }

  return null;
}

function filterTitle(filter: NonNullable<ResolvedFilter>): string {
  if (filter.kind === "project") return filter.title;
  if (filter.kind === "shop") return filter.name;
  return filter.name;
}

/* ─────────────────────────────────────────────────────────────
 * Sub-components
 * ───────────────────────────────────────────────────────────── */

function RailLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontFamily: "var(--mono-font)",
        color: "var(--ink-3)",
        letterSpacing: "0.18em",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function FilterRow({
  href,
  label,
  count,
  color,
  active,
}: {
  href: string;
  label: string;
  count: number;
  color: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        textDecoration: "none",
        fontSize: 13,
        fontFamily: "var(--serif-font)",
        fontWeight: active ? 700 : 400,
        color: active ? "var(--ink)" : "var(--ink-2)",
        borderBottom: "1px solid var(--rule-2)",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1 }}>{label}</span>
      <span
        style={{
          fontFamily: "var(--mono-font)",
          fontSize: 10,
          color: "var(--ink-3)",
        }}
      >
        {count}
      </span>
    </Link>
  );
}

type FeedCardData = {
  id: string;
  body: string | null;
  photo_url: string | null;
  created_at: string;
  shop: { id: string; name: string } | null;
  episode: { id: string; title: string } | null;
  project: {
    id: string;
    title: string;
    slug: string;
    category_id: string;
  } | null;
};

function FeedCard({
  card,
  position,
  categories,
}: {
  card: FeedCardData;
  position: number;
  categories: Array<{ id: string; slug: string; name: string }>;
}) {
  const cat = card.project
    ? (categories.find((c) => c.id === card.project?.category_id) ?? null)
    : null;
  const color = CATEGORY_COLOR[cat?.slug ?? ""] ?? "var(--ink-2)";
  const dateText = new Date(card.created_at).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  const place =
    card.shop?.name ??
    card.episode?.title ??
    card.project?.title ??
    "강화 어딘가";
  const serial = card.id.slice(-3).toUpperCase();
  const recencyTag = position < 3 ? "오늘" : position < 6 ? "어제" : "이번 주";

  return (
    <div>
      <article
        style={{
          width: "100%",
          aspectRatio: "188/264",
          background: "var(--paper)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--rule)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "52%",
            position: "relative",
            background:
              "linear-gradient(135deg, oklch(0.82 0.04 60), oklch(0.72 0.06 45))",
          }}
        >
          {card.photo_url ? (
            <Image
              src={card.photo_url}
              alt={card.body ?? place}
              fill
              sizes="(max-width: 1100px) 33vw, 188px"
              style={{ objectFit: "cover" }}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "var(--paper)",
              padding: "3px 7px",
              borderRadius: 4,
              fontFamily: "var(--mono-font)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--ink-2)",
              border: "1px solid var(--rule)",
            }}
          >
            No.{serial}
          </div>
          {cat ? (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "var(--paper)",
                padding: "3px 7px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 1,
                  background: color,
                }}
              />
              {cat.name}
            </div>
          ) : null}
        </div>
        <div
          style={{
            padding: "11px 13px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "var(--ink)",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {card.body ?? "—"}
          </div>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9.5,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
            }}
          >
            <span>@ {place}</span>
            <span>{dateText}</span>
          </div>
        </div>
      </article>
      <div
        style={{
          fontSize: 11,
          fontFamily: "var(--mono-font)",
          color: "var(--ink-3)",
          marginTop: 10,
          letterSpacing: "0.05em",
        }}
      >
        No.{serial} · {place} · {recencyTag}
      </div>
    </div>
  );
}
