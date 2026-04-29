import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GhWordmark } from "@/components/claude/primitives";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CATEGORY_COLOR: Record<string, string> = {
  commons: "var(--cat-commons)",
  network: "var(--cat-network)",
  world: "var(--cat-world)",
  policy: "var(--cat-policy)",
};

const CATEGORY_LABEL: Record<string, string> = {
  commons: "공유지",
  network: "네트워크",
  world: "세계",
  policy: "정책",
};

type SearchParams = { category?: string };

/**
 * /collection — Claude editorial 톤의 내 도감.
 *
 * 출처: Claude artifact pages/CollectionDesktop.jsx (2026-04-29).
 * 시각: 시안 그대로 (3-col 320 / 1fr / 280)
 *   좌: 정체성 + CARDS COLLECTED + BY CATEGORY 필터
 *   중앙: 카드 그리드 (4-col, 146×206)
 *   우: MY PROGRESS (4 카테고리 막대) + NEXT MOMENT
 *
 * 기능: 본인 cards (RLS) + reactions (편지·하이파이브) + upcoming episode 유지.
 */
export default async function CollectionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await getCurrentActor();
  if (actor.role !== "participant") redirect("/login?next=/collection");

  const supabase = createServerSupabase();
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  // RLS 적용된 본인 카드
  const { data: rows } = await supabase
    .from("activities")
    .select(
      `id, type, body, photo_url, is_public, created_at, shop_id,
       shops:shop_id(id, name),
       episodes:episode_id(id, title),
       projects:project_id(id, title, slug, category_id)`
    )
    .eq("user_id", actor.userId)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(120);

  const cards = (rows ?? []).map((r) => ({
    id: r.id as string,
    body: (r.body as string | null) ?? null,
    photo_url: (r.photo_url as string | null) ?? null,
    is_public: Boolean(r.is_public),
    created_at: r.created_at as string,
    shop: r.shops
      ? { id: r.shops.id as string, name: r.shops.name as string }
      : null,
    episode: r.episodes
      ? { id: r.episodes.id as string, title: r.episodes.title as string }
      : null,
    project: r.projects
      ? {
          id: r.projects.id as string,
          title: r.projects.title as string,
          slug: r.projects.slug as string,
          category_id: r.projects.category_id as string,
        }
      : null,
  }));

  const cardIds = cards.map((c) => c.id);
  const myProjectIds = Array.from(
    new Set(
      cards.map((c) => c.project?.id).filter((v): v is string => Boolean(v))
    )
  );

  const [categoriesRes, reactionsRes, userProfileRes, nextEpisodeRes] =
    await Promise.all([
      admin
        .from("categories")
        .select("id, slug, name, sort_order")
        .order("sort_order", { ascending: true }),
      cardIds.length > 0
        ? admin
            .from("reactions")
            .select("id, kind, activity_id")
            .in("activity_id", cardIds)
            .in("kind", ["letter", "hi_five"])
        : Promise.resolve({
            data: [] as Array<{
              id: string;
              kind: string;
              activity_id: string;
            }>,
          }),
      admin
        .from("users")
        .select("id, nickname, profile_image_url, created_at")
        .eq("id", actor.userId)
        .maybeSingle(),
      myProjectIds.length > 0
        ? admin
            .from("episodes")
            .select(
              "id, title, session_date, location, status, project:project_id (id, title, slug)"
            )
            .in("project_id", myProjectIds)
            .gte("session_date", today)
            .neq("status", "completed")
            .eq("is_public", true)
            .order("session_date", { ascending: true, nullsFirst: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const categories = categoriesRes.data ?? [];
  const reactions = reactionsRes.data ?? [];
  const userProfile = userProfileRes.data ?? null;
  const nextEpisode = nextEpisodeRes.data ?? null;

  const totalCards = cards.length;
  const publicCards = cards.filter((c) => c.is_public).length;
  const uniqueShops = new Set(
    cards.map((c) => c.shop?.id).filter((v): v is string => Boolean(v))
  ).size;
  const totalLetters = reactions.filter((r) => r.kind === "letter").length;
  const totalHighFives = reactions.filter((r) => r.kind === "hi_five").length;

  // 카테고리별 내 카드 수
  const myCountByCategory = new Map<string, number>();
  for (const c of cards) {
    if (!c.project?.category_id) continue;
    myCountByCategory.set(
      c.project.category_id,
      (myCountByCategory.get(c.project.category_id) ?? 0) + 1
    );
  }
  const maxCategoryCount = Math.max(
    1,
    ...Array.from(myCountByCategory.values())
  );

  const selectedCategory =
    searchParams.category != null
      ? (categories.find((c) => c.slug === searchParams.category) ?? null)
      : null;

  const visibleCards = selectedCategory
    ? cards.filter((c) => c.project?.category_id === selectedCategory.id)
    : cards;

  const nicknameForAvatar =
    (userProfile?.nickname as string | null) ?? actor.nickname ?? "강";
  const avatarLetter = nicknameForAvatar.trim().slice(0, 1) || "강";
  const avatarUrl = (userProfile?.profile_image_url as string | null) ?? null;

  const joinedAt = userProfile?.created_at as string | null;
  const joinedLabel = joinedAt
    ? new Date(joinedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
      })
    : null;

  return (
    <div
      className="gh-scroll"
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--ui-font)",
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "320px 1fr 280px",
      }}
    >
      {/* LEFT — identity */}
      <aside
        style={{
          borderRight: "1px solid var(--rule)",
          padding: "48px 32px",
          background: "var(--paper-2)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <GhWordmark size={13} mono />
        </Link>

        <div style={{ marginTop: 36 }}>
          <RailLabel>MY COLLECTION</RailLabel>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 14,
              marginBottom: 20,
            }}
          >
            {avatarUrl ? (
              <span
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  overflow: "hidden",
                  position: "relative",
                  background: "var(--mud)",
                }}
              >
                <Image
                  src={avatarUrl}
                  alt={nicknameForAvatar}
                  fill
                  sizes="56px"
                  style={{ objectFit: "cover" }}
                />
              </span>
            ) : (
              <span
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: "var(--mud)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--serif-font)",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {avatarLetter}
              </span>
            )}
            <div>
              <div
                className="serif"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {nicknameForAvatar}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                  letterSpacing: "0.05em",
                  marginTop: 2,
                }}
              >
                {joinedLabel
                  ? `JOINED ${joinedLabel.replace(". ", ".")}`
                  : "JOINED —"}
                {uniqueShops > 0 ? ` · 강화 ${uniqueShops}곳 방문` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* big number */}
        <div
          style={{
            borderTop: "1px solid var(--rule)",
            borderBottom: "1px solid var(--rule)",
            padding: "20px 0",
            marginBottom: 24,
          }}
        >
          <RailLabel>CARDS COLLECTED</RailLabel>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginTop: 6,
            }}
          >
            <span
              className="serif"
              style={{
                fontSize: 64,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              {totalCards}
            </span>
            <span style={{ fontSize: 13, color: "var(--ink-3)" }}>장</span>
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              marginTop: 10,
            }}
          >
            편지 받음 {totalLetters} · 하이파이브 {totalHighFives} · 공개{" "}
            {publicCards}
          </div>
        </div>

        {/* category nav */}
        <RailLabel>BY CATEGORY</RailLabel>
        <div style={{ marginTop: 14 }}>
          <CategoryButton
            href="/collection"
            label="전체"
            count={totalCards}
            color="var(--ink-3)"
            active={!selectedCategory}
          />
          {categories.map((c) => {
            const cid = c.id as string;
            const slug = c.slug as string;
            return (
              <CategoryButton
                key={cid}
                href={`/collection?category=${slug}`}
                label={c.name as string}
                count={myCountByCategory.get(cid) ?? 0}
                color={CATEGORY_COLOR[slug] ?? "var(--ink-3)"}
                active={selectedCategory?.id === cid}
              />
            );
          })}
        </div>
      </aside>

      {/* CENTER — grid */}
      <main style={{ padding: "48px 56px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 32,
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10.5,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.18em",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              {selectedCategory
                ? `${CATEGORY_LABEL[selectedCategory.slug as string] ?? selectedCategory.name}`
                : "ALL"}
              {" · "}
              {visibleCards.length}장
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              내가 강화도에서 모은 순간들
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["그리드", "리스트", "지도"] as const).map((v, i) => (
              <span
                key={v}
                style={{
                  fontSize: 11,
                  fontFamily: "var(--mono-font)",
                  letterSpacing: "0.08em",
                  padding: "6px 12px",
                  border: `1px solid ${i === 0 ? "var(--ink)" : "var(--rule)"}`,
                  color: i === 0 ? "var(--ink)" : "var(--ink-3)",
                  cursor: "default",
                }}
                title={i === 0 ? undefined : "리스트·지도 뷰는 곧 추가됩니다"}
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {visibleCards.length === 0 ? (
          <div
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
            {selectedCategory
              ? `${selectedCategory.name} 카테고리에는 아직 카드가 없어요.`
              : "아직 발급된 카드가 없어요. 현장에서 QR을 찍고 첫 카드를 남겨보세요."}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            {visibleCards.map((c) => (
              <CollectionCard key={c.id} card={c} />
            ))}
          </div>
        )}
      </main>

      {/* RIGHT — progress */}
      <aside
        style={{
          borderLeft: "1px solid var(--rule)",
          padding: "48px 28px",
          background: "var(--paper-2)",
        }}
      >
        <RailLabel>MY PROGRESS</RailLabel>
        <div style={{ marginTop: 14 }}>
          {categories.map((c) => {
            const cid = c.id as string;
            const slug = c.slug as string;
            const count = myCountByCategory.get(cid) ?? 0;
            const color = CATEGORY_COLOR[slug] ?? "var(--ink-3)";
            const pct =
              maxCategoryCount > 0 ? (count / maxCategoryCount) * 100 : 0;
            return (
              <div key={cid} style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--serif-font)",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {c.name as string}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--mono-font)",
                      fontSize: 11,
                      color: "var(--ink-3)",
                    }}
                  >
                    {count}장
                  </span>
                </div>
                <div
                  style={{
                    height: 3,
                    background: "var(--rule-2)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${pct}%`,
                      background: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 32 }}>
          <RailLabel>NEXT MOMENT</RailLabel>
          {nextEpisode ? (
            <NextMomentBox
              title={(nextEpisode.title as string) ?? "다음 회차"}
              projectTitle={
                (nextEpisode.project as { title?: string } | null)?.title ?? ""
              }
              projectSlug={
                (nextEpisode.project as { slug?: string } | null)?.slug ?? null
              }
              sessionDate={nextEpisode.session_date as string | null}
              location={(nextEpisode.location as string | null) ?? null}
            />
          ) : (
            <p
              style={{
                marginTop: 14,
                padding: 14,
                border: "1px solid var(--rule)",
                background: "var(--paper)",
                fontSize: 12,
                color: "var(--ink-3)",
                fontFamily: "var(--serif-font)",
                lineHeight: 1.7,
              }}
            >
              참여 중인 프로젝트의 다음 회차가 잡히면 이 자리에 알려드릴게요.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontFamily: "var(--mono-font)",
        color: "var(--ink-3)",
        letterSpacing: "0.18em",
      }}
    >
      {children}
    </div>
  );
}

function CategoryButton({
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
        padding: "10px 0",
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

function NextMomentBox({
  title,
  projectTitle,
  projectSlug,
  sessionDate,
  location,
}: {
  title: string;
  projectTitle: string;
  projectSlug: string | null;
  sessionDate: string | null;
  location: string | null;
}) {
  const dateLabel = sessionDate
    ? new Date(sessionDate).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : null;
  return (
    <div
      style={{
        marginTop: 14,
        padding: 14,
        border: "1px solid var(--rule)",
        background: "var(--paper)",
      }}
    >
      <div
        className="serif"
        style={{
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.5,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: "var(--ink-2)",
          lineHeight: 1.6,
          marginBottom: 8,
        }}
      >
        {projectTitle}
        {dateLabel ? ` · ${dateLabel}` : ""}
        {location ? ` · ${location}` : ""}
      </div>
      {projectSlug ? (
        <Link
          href={`/projects/${projectSlug}`}
          style={{
            display: "inline-block",
            fontSize: 11,
            fontFamily: "var(--mono-font)",
            letterSpacing: "0.08em",
            padding: "6px 10px",
            background: "var(--ink)",
            color: "var(--paper)",
            border: "none",
            textDecoration: "none",
          }}
        >
          프로젝트 열기 →
        </Link>
      ) : null}
    </div>
  );
}

type CollectionCardData = {
  id: string;
  body: string | null;
  photo_url: string | null;
  is_public: boolean;
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

function CollectionCard({ card }: { card: CollectionCardData }) {
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
  return (
    <Link
      href={`/collection/${card.id}`}
      style={{ textDecoration: "none", color: "var(--ink)" }}
    >
      <article
        style={{
          width: "100%",
          aspectRatio: "146/206",
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
              sizes="(max-width: 1100px) 25vw, 146px"
              style={{ objectFit: "cover" }}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "var(--paper)",
              padding: "2px 5px",
              borderRadius: 3,
              fontFamily: "var(--mono-font)",
              fontSize: 8.5,
              fontWeight: 600,
              color: "var(--ink-2)",
              border: "1px solid var(--rule)",
              letterSpacing: "0.06em",
            }}
          >
            No.{serial}
          </div>
          {!card.is_public ? (
            <div
              style={{
                position: "absolute",
                bottom: 6,
                left: 6,
                background: "rgba(20,22,28,0.65)",
                color: "#fff",
                padding: "1px 5px",
                borderRadius: 3,
                fontSize: 8.5,
                fontFamily: "var(--mono-font)",
                letterSpacing: "0.06em",
              }}
            >
              비공개
            </div>
          ) : null}
        </div>
        <div
          style={{
            padding: "9px 11px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 11,
              lineHeight: 1.45,
              color: "var(--ink)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {card.body ?? "—"}
          </div>
          <div
            style={{
              marginTop: "auto",
              fontSize: 9,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "60%",
              }}
            >
              {place}
            </span>
            <span>{dateText}</span>
          </div>
        </div>
      </article>
      <div
        style={{
          fontSize: 10.5,
          fontFamily: "var(--mono-font)",
          color: "var(--ink-3)",
          marginTop: 8,
          letterSpacing: "0.04em",
        }}
      >
        No.{serial} · {dateText}
      </div>
    </Link>
  );
}
