import Link from "next/link";
import { notFound } from "next/navigation";

import { GhWordmark } from "@/components/claude/primitives";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { ChapterSection, type Chapter } from "./ChapterSection";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

const CATEGORY_COLOR: Record<string, string> = {
  commons: "var(--cat-commons)",
  network: "var(--cat-network)",
  world: "var(--cat-world)",
  policy: "var(--cat-policy)",
};

const CATEGORY_SOFT: Record<string, string> = {
  commons: "var(--cat-commons-soft)",
  network: "var(--cat-network-soft)",
  world: "var(--cat-world-soft)",
  policy: "var(--cat-policy-soft)",
};

const CATEGORY_EN: Record<string, string> = {
  commons: "commons",
  network: "network",
  world: "world",
  policy: "policy",
};

const HERO_GRADIENT_BY_CAT: Record<string, string> = {
  network:
    "linear-gradient(135deg, oklch(0.30 0.04 230) 0%, oklch(0.46 0.06 220) 55%, oklch(0.68 0.04 200) 100%)",
  commons:
    "linear-gradient(135deg, oklch(0.32 0.05 160) 0%, oklch(0.46 0.07 155) 55%, oklch(0.66 0.06 145) 100%)",
  world:
    "linear-gradient(135deg, oklch(0.32 0.06 50) 0%, oklch(0.48 0.10 45) 55%, oklch(0.70 0.10 55) 100%)",
  policy:
    "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.36 0.03 255) 55%, oklch(0.58 0.04 250) 100%)",
};

/**
 * /projects/[slug] — Claude editorial 톤의 프로젝트 상세.
 *
 * 출처: Claude artifact pages/ProjectDetailDesktop.jsx (2026-04-29).
 * 시각: 시안 그대로 (slim breadcrumb / 64px serif hero / 챕터 stepper / 2-col 본문 / YOUR CONTRIBUTION 밴드)
 * 기능: 우리 episodes·activities·reactions 데이터 그대로. 챕터=에피소드 매핑.
 *
 * 시안의 notices 는 우리 schema 에 없어서 (현 단계엔) 빈 배열로 둠 — 추후
 * episode_archives 또는 별도 notices 테이블에서 끌어올 자리.
 */
export default async function ProjectDetailPage({ params }: Params) {
  const actor = await getCurrentActor();
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select(
      `
      id, slug, title, summary, description, is_public,
      progress_type, progress_target, started_at, ended_at,
      category:category_id (id, slug, name)
    `
    )
    .eq("slug", params.slug)
    .maybeSingle();

  if (!project || !project.is_public) {
    notFound();
  }

  const category = project.category as {
    id: string;
    slug: string;
    name: string;
  } | null;

  const { data: episodes } = await admin
    .from("episodes")
    .select("id, seq, title, summary, session_date, location, status")
    .eq("project_id", project.id as string)
    .eq("is_public", true)
    .order("seq", { ascending: true, nullsFirst: false })
    .order("session_date", { ascending: true, nullsFirst: false });

  const episodeList = episodes ?? [];
  const episodeIds = episodeList.map((e) => e.id as string);

  const orFilter =
    episodeIds.length > 0
      ? `project_id.eq.${project.id},episode_id.in.(${episodeIds.join(",")})`
      : `project_id.eq.${project.id}`;

  const { data: allActivities } = await admin
    .from("activities")
    .select(
      `id, episode_id, project_id, user_id, type, body, photo_url, created_at,
       shop:shop_id (id, name)`
    )
    .or(orFilter)
    .eq("is_public", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  const activities = (allActivities ?? []) as Array<{
    id: string;
    episode_id: string | null;
    project_id: string | null;
    user_id: string | null;
    type: string;
    body: string | null;
    photo_url: string | null;
    created_at: string;
    shop: { id: string; name: string } | null;
  }>;

  // 활동 ID → reactions (kind=letter | hi_five)
  const activityIds = activities.map((a) => a.id);
  const { data: reactions } =
    activityIds.length > 0
      ? await admin
          .from("reactions")
          .select("id, kind, activity_id")
          .in("activity_id", activityIds)
          .in("kind", ["letter", "hi_five"])
      : { data: [] as { id: string; kind: string; activity_id: string }[] };

  const reactionList = (reactions ?? []) as {
    id: string;
    kind: string;
    activity_id: string;
  }[];

  // ─────────────────────────────────────────────────────────────
  // 에피소드별 stats 집계
  // ─────────────────────────────────────────────────────────────
  type EpisodeStats = {
    cards: number;
    letters: number;
    highFives: number;
    people: Set<string>;
  };
  const statsByEpisode = new Map<string, EpisodeStats>();
  for (const eid of episodeIds) {
    statsByEpisode.set(eid, {
      cards: 0,
      letters: 0,
      highFives: 0,
      people: new Set(),
    });
  }

  for (const a of activities) {
    if (!a.episode_id) continue;
    const bucket = statsByEpisode.get(a.episode_id);
    if (!bucket) continue;
    bucket.cards += 1;
    if (a.user_id) bucket.people.add(a.user_id);
  }

  const activityToEpisode = new Map(
    activities.map((a) => [a.id, a.episode_id])
  );
  for (const r of reactionList) {
    const eid = activityToEpisode.get(r.activity_id);
    if (!eid) continue;
    const bucket = statsByEpisode.get(eid);
    if (!bucket) continue;
    if (r.kind === "letter") bucket.letters += 1;
    if (r.kind === "hi_five") bucket.highFives += 1;
  }

  // ─────────────────────────────────────────────────────────────
  // 챕터 구성 — 에피소드 → Claude chapter 매핑
  // ─────────────────────────────────────────────────────────────
  const STATUS_MAP: Record<string, Chapter["status"]> = {
    completed: "done",
    in_progress: "active",
    planned: "planned",
  };
  const STATUS_PHASE: Record<Chapter["status"], string> = {
    done: "마무리됨",
    active: "진행 중",
    planned: "예정",
  };

  const chapters: Chapter[] = episodeList.map((e, i) => {
    const status = STATUS_MAP[(e.status as string) ?? "planned"] ?? "planned";
    const sessionDate = e.session_date as string | null;
    const year = sessionDate ? sessionDate.slice(0, 4) : null;
    const idxLabel =
      e.seq != null
        ? String(e.seq).padStart(2, "0")
        : String(i + 1).padStart(2, "0");
    const stats = statsByEpisode.get(e.id as string);
    return {
      id: e.id as string,
      idx: idxLabel,
      year,
      phase: e.title as string,
      status,
      headline: (e.summary as string | null) ?? (e.title as string),
      summary: (e.summary as string | null) ?? null,
      moments: (e.location as string | null) ?? null,
      stats: stats
        ? {
            cards: stats.cards,
            letters: stats.letters,
            people: stats.people.size,
            highFives: stats.highFives,
            sessionDate,
          }
        : null,
      statusLabel: STATUS_PHASE[status],
    };
  });

  const totalChapters = chapters.length;
  const activeChapterCount = chapters.filter(
    (c) => c.status === "active"
  ).length;
  const doneChapterCount = chapters.filter((c) => c.status === "done").length;
  const inFlightCount = doneChapterCount + activeChapterCount;

  // 첫 chapter 기본값: active 가 있으면 그쪽, 없으면 가장 최근 done, 없으면 첫 챕터
  const initialChapterId =
    chapters.find((c) => c.status === "active")?.id ??
    [...chapters].reverse().find((c) => c.status === "done")?.id ??
    chapters[0]?.id ??
    null;

  // 챕터별 속한 카드 (cardsInChapter용) — 에피소드 ID 기준 group
  const cardsByEpisode = new Map<
    string,
    Array<{
      id: string;
      body: string | null;
      photo_url: string | null;
      created_at: string;
      categorySlug: string | null;
      categoryName: string | null;
      letter: boolean;
      highFiveCount: number;
      place: string;
    }>
  >();

  const lettersByActivity = new Map<string, number>();
  const highFivesByActivity = new Map<string, number>();
  for (const r of reactionList) {
    if (r.kind === "letter") {
      lettersByActivity.set(
        r.activity_id,
        (lettersByActivity.get(r.activity_id) ?? 0) + 1
      );
    } else if (r.kind === "hi_five") {
      highFivesByActivity.set(
        r.activity_id,
        (highFivesByActivity.get(r.activity_id) ?? 0) + 1
      );
    }
  }

  for (const a of activities) {
    if (!a.episode_id) continue;
    const list = cardsByEpisode.get(a.episode_id) ?? [];
    list.push({
      id: a.id,
      body: a.body,
      photo_url: a.photo_url,
      created_at: a.created_at,
      categorySlug: category?.slug ?? null,
      categoryName: category?.name ?? null,
      letter: (lettersByActivity.get(a.id) ?? 0) > 0,
      highFiveCount: highFivesByActivity.get(a.id) ?? 0,
      place: a.shop?.name ?? "강화 어딘가",
    });
    cardsByEpisode.set(a.episode_id, list);
  }

  // ─────────────────────────────────────────────────────────────
  // Bottom band — YOUR CONTRIBUTION (참여자 로그인 시만)
  // ─────────────────────────────────────────────────────────────
  let myContribution: {
    cards: number;
    received: number;
    highFives: number;
    cardSamples: Array<{
      id: string;
      body: string | null;
      photo_url: string | null;
      created_at: string;
    }>;
  } | null = null;

  if (actor.role === "participant") {
    const myActs = activities.filter((a) => a.user_id === actor.userId);
    const myActivityIds = new Set(myActs.map((a) => a.id));
    let receivedLetters = 0;
    let receivedHighFives = 0;
    for (const r of reactionList) {
      if (!myActivityIds.has(r.activity_id)) continue;
      if (r.kind === "letter") receivedLetters += 1;
      if (r.kind === "hi_five") receivedHighFives += 1;
    }
    myContribution = {
      cards: myActs.length,
      received: receivedLetters,
      highFives: receivedHighFives,
      cardSamples: myActs.slice(0, 3).map((a) => ({
        id: a.id,
        body: a.body,
        photo_url: a.photo_url,
        created_at: a.created_at,
      })),
    };
  }

  // 카테고리 시각
  const catSlug = category?.slug ?? "";
  const catColor = CATEGORY_COLOR[catSlug] ?? "var(--ink-2)";
  const catSoft = CATEGORY_SOFT[catSlug] ?? "var(--paper-3)";
  const catEn = CATEGORY_EN[catSlug] ?? "—";
  const heroGradient =
    HERO_GRADIENT_BY_CAT[catSlug] ??
    "linear-gradient(135deg, var(--paper-3), var(--paper-2))";

  const period = formatPeriod(
    project.started_at as string | null,
    project.ended_at as string | null
  );

  return (
    <div
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--ui-font)",
        minHeight: "100vh",
      }}
    >
      {/* Breadcrumb nav */}
      <div
        style={{
          padding: "14px 40px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 12,
            color: "var(--ink-2)",
          }}
        >
          <Link
            href="/projects"
            style={{
              color: "var(--ink-3)",
              fontFamily: "var(--mono-font)",
              fontSize: 11,
              textDecoration: "none",
            }}
          >
            ← 프로젝트 전체
          </Link>
          <span style={{ color: "var(--rule)" }}>/</span>
          <span
            style={{
              fontFamily: "var(--mono-font)",
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
            }}
          >
            {catEn.toUpperCase()} · {project.title as string}
          </span>
        </div>
        <Link href="/" style={{ textDecoration: "none" }}>
          <GhWordmark size={12} mono />
        </Link>
      </div>

      {/* Hero band */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div style={{ padding: "56px 56px 48px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                background: catColor,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {catEn}
              {period ? ` · ${period}` : ""}
            </span>
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 64,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            {project.title as string}
          </h1>
          {project.summary ? (
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.85,
                color: "var(--ink-2)",
                marginTop: 22,
                maxWidth: 520,
                whiteSpace: "pre-line",
              }}
            >
              {project.summary as string}
            </p>
          ) : null}
        </div>
        <div
          style={{
            background: heroGradient,
            position: "relative",
            minHeight: 280,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 30% 80%, oklch(1 0 0 / 0.10), transparent 60%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 24,
              bottom: 18,
              right: 24,
              color: "oklch(1 0 0 / 0.75)",
              fontFamily: "var(--mono-font)",
              fontSize: 11,
              letterSpacing: "0.12em",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              {category?.name ?? "강화"}
              {period ? ` · ${period}` : ""}
            </span>
            <span>ph. crew archive</span>
          </div>
        </div>
      </div>

      {/* Chapter stepper + body (client) */}
      {chapters.length > 0 ? (
        <ChapterSection
          chapters={chapters}
          totalChapters={totalChapters}
          inFlightCount={inFlightCount}
          initialChapterId={initialChapterId ?? chapters[0].id}
          categoryColor={catColor}
          cardsByEpisode={Object.fromEntries(
            Array.from(cardsByEpisode.entries()).map(([k, v]) => [
              k,
              v.slice(0, 4),
            ])
          )}
        />
      ) : (
        <div
          style={{
            padding: "80px 56px",
            textAlign: "center",
            fontFamily: "var(--serif-font)",
            color: "var(--ink-3)",
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          아직 등록된 회차가 없어요.
          <br />첫 회차가 열리면 여기에 챕터로 채워집니다.
        </div>
      )}

      {/* YOUR CONTRIBUTION — 참여자 한정 */}
      {myContribution && myContribution.cards > 0 ? (
        <div
          style={{
            background: "var(--paper-2)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <div
            style={{
              padding: "48px 56px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                  letterSpacing: "0.18em",
                  marginBottom: 14,
                }}
              >
                YOUR CONTRIBUTION — 이 프로젝트에서 나의 기여
              </div>
              <div
                className="serif"
                style={{
                  fontSize: 28,
                  lineHeight: 1.4,
                  letterSpacing: "-0.025em",
                  marginBottom: 24,
                }}
              >
                카드{" "}
                <span style={{ color: catColor, fontWeight: 700 }}>
                  {myContribution.cards}장
                </span>
                을 남겼고,
                <br />
                편지{" "}
                <span style={{ color: catColor, fontWeight: 700 }}>
                  {myContribution.received}통
                </span>
                을 받았습니다.
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  borderTop: "1px solid var(--rule)",
                  borderBottom: "1px solid var(--rule)",
                  marginBottom: 24,
                  maxWidth: 420,
                }}
              >
                {(
                  [
                    ["MY CARDS", myContribution.cards],
                    ["RECEIVED", myContribution.received],
                    ["HIGH★", myContribution.highFives],
                  ] as const
                ).map(([k, v], i) => (
                  <div
                    key={k}
                    style={{
                      padding: "14px 4px",
                      textAlign: "center",
                      borderRight: i < 2 ? "1px solid var(--rule)" : "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9.5,
                        fontFamily: "var(--mono-font)",
                        color: "var(--ink-3)",
                        letterSpacing: "0.12em",
                      }}
                    >
                      {k}
                    </div>
                    <div
                      className="serif"
                      style={{
                        fontSize: 26,
                        fontWeight: 700,
                        letterSpacing: "-0.03em",
                        margin: "2px 0 0",
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/collection"
                style={{
                  padding: 14,
                  background: "var(--paper)",
                  border: "1px solid var(--rule)",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  maxWidth: 420,
                  textDecoration: "none",
                  color: "var(--ink)",
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    background: catSoft,
                    color: catColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--mono-font)",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  ↗
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="serif"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 2,
                    }}
                  >
                    내 도감으로
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-2)",
                      lineHeight: 1.55,
                    }}
                  >
                    이 프로젝트에서 남긴 카드를 한자리에서 봐요
                  </div>
                </div>
              </Link>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                  letterSpacing: "0.18em",
                  marginBottom: 14,
                }}
              >
                MY CARDS IN THIS PROJECT
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {myContribution.cardSamples.length === 0 ? (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                      fontFamily: "var(--serif-font)",
                    }}
                  >
                    아직 등록된 내 카드가 없어요.
                  </p>
                ) : (
                  myContribution.cardSamples.map((c) => (
                    <Link
                      key={c.id}
                      href={`/collection/${c.id}`}
                      style={{
                        textDecoration: "none",
                        color: "var(--ink)",
                      }}
                    >
                      <div
                        style={{
                          width: 120,
                          height: 166,
                          borderRadius: 8,
                          background: c.photo_url
                            ? `oklch(0.82 0.04 60) center/cover no-repeat url(${c.photo_url})`
                            : `linear-gradient(135deg, ${catSoft}, var(--paper-3))`,
                          border: "1px solid var(--rule-2)",
                          padding: 8,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          color: "var(--paper)",
                          textShadow: c.photo_url
                            ? "0 1px 2px rgba(0,0,0,0.5)"
                            : "none",
                        }}
                      >
                        <div
                          className="serif"
                          style={{
                            fontSize: 11,
                            lineHeight: 1.4,
                            color: c.photo_url ? "#fff" : "var(--ink)",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {c.body ?? "—"}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return "";
  const ys = start ? start.slice(0, 4) : "";
  const ye = end ? end.slice(0, 4) : "";
  if (ys && ye) return ys === ye ? ys : `${ys}–${ye}`;
  if (ys) return `${ys}–`;
  return `–${ye}`;
}
