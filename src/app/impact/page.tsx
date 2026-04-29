import Image from "next/image";
import Link from "next/link";

import { GhButton, GhWordmark } from "@/components/claude/primitives";
import { PublicTopNav } from "@/components/claude/PublicTopNav";
import { NodeMap } from "@/components/impact/node-map/NodeMap";
import { loadNodeMapData } from "@/components/impact/node-map/server";
import { getCurrentActor } from "@/lib/auth/current-actor";
import {
  calculateProgress,
  type ProgressResult,
} from "@/lib/progress/calculator";
import type { ProgressType } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * /impact — Claude editorial 톤의 공개 임팩트 대시보드.
 *
 * 출처: Claude artifact pages/ImpactDesktop.jsx (2026-04-29 export).
 * 시각: Claude 시안 그대로 (paper / ink / serif 78px hero / 6-cell KPI / 4-col 카테고리 표 / 3-col 진행 카드 / 가로 스크롤 카드 / CTA)
 * 기능: 우리 기존 /impact 의 모든 쿼리·진척 계산·NodeMap 인터랙션 유지.
 *
 * 이 페이지는 (default) route group 밖에 위치 → 글로벌 Header/Footer 가 안 입혀짐.
 * 자체 TopNav + Footer 로 editorial 톤을 일관되게 그림.
 */

const HERO_CARD_LIMIT = 8;
const TIMELINE_LIMIT = 6;
const PROJECT_EPOCH = "2024-05-01";

const CATEGORY_COLOR: Record<string, string> = {
  commons: "var(--cat-commons)",
  network: "var(--cat-network)",
  world: "var(--cat-world)",
  policy: "var(--cat-policy)",
};

const CATEGORY_EN: Record<string, string> = {
  commons: "commons",
  network: "network",
  world: "world",
  policy: "policy",
};

export default async function ImpactPage() {
  const actor = await getCurrentActor();
  const admin = createAdminClient();
  const nodeMapData = await loadNodeMapData();

  const [
    categoriesRes,
    projectsRes,
    episodesRes,
    publicActivitiesHeroRes,
    publicActivityCountRes,
    shopCountRes,
    letterCountRes,
    highFiveCountRes,
    participantCountRes,
  ] = await Promise.all([
    admin
      .from("categories")
      .select("id, slug, name, description, sort_order")
      .order("sort_order", { ascending: true }),
    admin
      .from("projects")
      .select(
        "id, slug, title, summary, category_id, is_public, progress_type, progress_target, updated_at"
      )
      .eq("is_public", true)
      .order("updated_at", { ascending: false }),
    admin
      .from("episodes")
      .select("id, project_id, status")
      .eq("is_public", true),
    admin
      .from("activities")
      .select(
        `
        id, type, body, title, photo_url, is_public, created_at, project_id,
        shop:shop_id (id, name),
        episode:episode_id (id, title, project_id),
        project:project_id (id, title, slug, category_id)
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
    admin
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .eq("kind", "letter"),
    admin
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .eq("kind", "hi_five"),
    admin
      .from("activities")
      .select("user_id")
      .eq("is_public", true)
      .is("removed_at", null)
      .not("user_id", "is", null),
  ]);

  const categories = categoriesRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const episodes = episodesRes.data ?? [];

  const episodesByProject = new Map<
    string,
    { total: number; completed: number; inProgress: number; ids: string[] }
  >();
  for (const e of episodes) {
    const pid = e.project_id as string;
    const bucket = episodesByProject.get(pid) ?? {
      total: 0,
      completed: 0,
      inProgress: 0,
      ids: [],
    };
    bucket.total += 1;
    bucket.ids.push(e.id as string);
    if (e.status === "completed") bucket.completed += 1;
    if (e.status === "in_progress") bucket.inProgress += 1;
    episodesByProject.set(pid, bucket);
  }

  const activityCountByProject = new Map<string, number>();
  const participantSetByProject = new Map<string, Set<string>>();
  const recentPhotoByProject = new Map<string, string>();

  if (projects.length > 0) {
    const projectIds = projects.map((p) => p.id as string);
    const allEpisodeIds: string[] = [];
    for (const bucket of episodesByProject.values()) {
      allEpisodeIds.push(...bucket.ids);
    }

    const [directRes, viaEpisodeRes, directPhotoRes, episodePhotoRes] =
      await Promise.all([
        admin
          .from("activities")
          .select("project_id, user_id")
          .in("project_id", projectIds)
          .eq("is_public", true)
          .is("removed_at", null),
        allEpisodeIds.length > 0
          ? admin
              .from("activities")
              .select("episode_id, user_id")
              .in("episode_id", allEpisodeIds)
              .eq("is_public", true)
              .is("removed_at", null)
          : Promise.resolve({
              data: [] as {
                episode_id: string | null;
                user_id: string | null;
              }[],
            }),
        admin
          .from("activities")
          .select("photo_url, project_id, created_at")
          .in("project_id", projectIds)
          .eq("is_public", true)
          .is("removed_at", null)
          .not("photo_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(120),
        allEpisodeIds.length > 0
          ? admin
              .from("activities")
              .select("photo_url, episode_id, created_at")
              .in("episode_id", allEpisodeIds)
              .eq("is_public", true)
              .is("removed_at", null)
              .not("photo_url", "is", null)
              .order("created_at", { ascending: false })
              .limit(120)
          : Promise.resolve({
              data: [] as {
                photo_url: string | null;
                episode_id: string | null;
                created_at: string;
              }[],
            }),
      ]);

    function bumpProject(pid: string, uid: string | null) {
      activityCountByProject.set(
        pid,
        (activityCountByProject.get(pid) ?? 0) + 1
      );
      if (uid) {
        const set = participantSetByProject.get(pid) ?? new Set<string>();
        set.add(uid);
        participantSetByProject.set(pid, set);
      }
    }

    for (const r of directRes.data ?? []) {
      const pid = r.project_id as string;
      bumpProject(pid, (r.user_id as string | null) ?? null);
    }

    const projectByEpisode = new Map(
      episodes.map((e) => [e.id as string, e.project_id as string])
    );
    for (const r of viaEpisodeRes.data ?? []) {
      const pid = projectByEpisode.get(r.episode_id as string);
      if (!pid) continue;
      bumpProject(pid, (r.user_id as string | null) ?? null);
    }

    const candidatePhotos: { pid: string; url: string; ts: string }[] = [];
    for (const r of directPhotoRes.data ?? []) {
      const pid = r.project_id as string | null;
      if (pid && r.photo_url) {
        candidatePhotos.push({
          pid,
          url: r.photo_url as string,
          ts: r.created_at as string,
        });
      }
    }
    for (const r of episodePhotoRes.data ?? []) {
      const pid = projectByEpisode.get(r.episode_id as string);
      if (pid && r.photo_url) {
        candidatePhotos.push({
          pid,
          url: r.photo_url as string,
          ts: r.created_at as string,
        });
      }
    }
    candidatePhotos.sort((a, b) => b.ts.localeCompare(a.ts));
    for (const p of candidatePhotos) {
      if (!recentPhotoByProject.has(p.pid)) {
        recentPhotoByProject.set(p.pid, p.url);
      }
    }
  }

  const categoryById = new Map(
    categories.map((c) => [c.id as string, c as (typeof categories)[number]])
  );

  type ProjectComputed = {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    category_id: string;
    categorySlug: string | null;
    categoryName: string | null;
    result: ProgressResult;
    inProgressEpisodes: number;
    totalEpisodes: number;
    activityCount: number;
    recentPhotoUrl: string | null;
  };

  const projectResults: ProjectComputed[] = projects.map((p) => {
    const bucket = episodesByProject.get(p.id as string) ?? {
      total: 0,
      completed: 0,
      inProgress: 0,
      ids: [],
    };
    const result = calculateProgress({
      progress_type: p.progress_type as ProgressType,
      progress_target: (p.progress_target as Record<string, unknown>) ?? {},
      completedEpisodes: bucket.completed,
      totalEpisodes: bucket.total,
      publicActivities: activityCountByProject.get(p.id as string) ?? 0,
      distinctParticipants:
        participantSetByProject.get(p.id as string)?.size ?? 0,
    });
    const cat = categoryById.get(p.category_id as string);
    return {
      id: p.id as string,
      slug: p.slug as string,
      title: p.title as string,
      summary: (p.summary as string | null) ?? null,
      category_id: p.category_id as string,
      categorySlug: (cat?.slug as string | undefined) ?? null,
      categoryName: (cat?.name as string | undefined) ?? null,
      result,
      inProgressEpisodes: bucket.inProgress,
      totalEpisodes: bucket.total,
      activityCount: activityCountByProject.get(p.id as string) ?? 0,
      recentPhotoUrl: recentPhotoByProject.get(p.id as string) ?? null,
    };
  });

  type CategoryComputed = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    sort_order: number;
    avgPercent: number;
    scoredCount: number;
    memberCount: number;
    activityCount: number;
  };

  const categoryStats: CategoryComputed[] = categories.map((c) => {
    const members = projectResults.filter((pr) => pr.category_id === c.id);
    const scored = members.filter((m) => m.result.note !== "target_missing");
    const avg =
      scored.length > 0
        ? Math.round(
            scored.reduce((s, m) => s + m.result.percent, 0) / scored.length
          )
        : 0;
    return {
      id: c.id as string,
      slug: c.slug as string,
      name: c.name as string,
      description: (c.description as string | null) ?? null,
      sort_order: c.sort_order as number,
      avgPercent: avg,
      scoredCount: scored.length,
      memberCount: members.length,
      activityCount: members.reduce((s, m) => s + m.activityCount, 0),
    };
  });

  const ongoingProjects = projectResults
    .filter((p) => p.inProgressEpisodes > 0)
    .sort(
      (a, b) =>
        b.inProgressEpisodes - a.inProgressEpisodes ||
        b.result.percent - a.result.percent
    )
    .slice(0, TIMELINE_LIMIT);

  const heroCards = (publicActivitiesHeroRes.data ?? []).map((a) => {
    const proj = a.project as {
      id: string;
      title: string;
      slug: string;
      category_id: string;
    } | null;
    const cat = proj ? categoryById.get(proj.category_id) : null;
    return {
      id: a.id as string,
      body: (a.body as string | null) ?? null,
      photo_url: (a.photo_url as string | null) ?? null,
      created_at: a.created_at as string,
      shop: a.shop as { id: string; name: string } | null,
      episode: a.episode as { id: string; title: string } | null,
      project: proj
        ? { id: proj.id, title: proj.title, slug: proj.slug }
        : null,
      categorySlug: (cat?.slug as string | undefined) ?? null,
      categoryName: (cat?.name as string | undefined) ?? null,
    };
  });

  const totalPublicCards = publicActivityCountRes.count ?? 0;
  const totalShops = shopCountRes.count ?? 0;
  const totalLetters = letterCountRes.count ?? 0;
  const totalHighFives = highFiveCountRes.count ?? 0;
  const totalEpisodes = episodes.length;
  const totalParticipants = new Set(
    (participantCountRes.data ?? [])
      .map((r) => r.user_id as string | null)
      .filter((v): v is string => Boolean(v))
  ).size;

  const today = new Date();
  const epochDate = new Date(PROJECT_EPOCH);
  const daysSinceEpoch = Math.max(
    0,
    Math.floor((today.getTime() - epochDate.getTime()) / 86_400_000)
  );
  const issueNumber = Math.max(1, Math.floor(daysSinceEpoch / 7) + 1);
  const todayLabel = today
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\.\s?/g, ".")
    .replace(/\.$/, "");

  return (
    <div
      className="paper-grain"
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--ui-font)",
        minHeight: "100vh",
      }}
    >
      <PublicTopNav
        actor={actor}
        active="impact"
        rightMeta={
          <span
            style={{
              fontSize: 10.5,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.1em",
            }}
          >
            {todayLabel} · ISSUE {String(issueNumber).padStart(2, "0")}
          </span>
        }
      />

      {/* Hero */}
      <section
        style={{
          padding: "52px 56px 44px",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 56,
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--mono-font)",
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              marginBottom: 22,
            }}
          >
            IMPACT · 공개 — 누구나 볼 수 있음
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 78,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              margin: 0,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            오늘도 강화도가
            <br />
            조금씩 <span style={{ color: "var(--sea)" }}>더 강화됩니다.</span>
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.85,
              color: "var(--ink-2)",
              marginTop: 28,
              maxWidth: 520,
            }}
          >
            참여자·크루·사장님의 환대 행위가 쌓여 강화도의 서사가 됩니다. 여기는
            그 서사가 자라는 모습을 누구나 지켜볼 수 있는 곳이에요. 좋아요도
            순위도 없이, 관계의 모양 그대로.
          </p>
          <div
            style={{
              marginTop: 32,
              display: "flex",
              gap: 22,
              fontSize: 11,
              color: "var(--ink-3)",
              fontFamily: "var(--mono-font)",
              letterSpacing: "0.08em",
            }}
          >
            <span>TODAY · {todayLabel}</span>
            <span>·</span>
            <span>RUNNING SINCE 2024.05 · {daysSinceEpoch} DAYS</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              border: "1px solid var(--ink)",
              background: "var(--paper)",
            }}
          >
            {(
              [
                ["CARDS", totalPublicCards, "누적 환대 카드"],
                ["PLACES", totalShops, "연결된 가게"],
                ["PEOPLE", totalParticipants, "참여자"],
                ["EPISODES", totalEpisodes, "프로젝트 에피소드"],
                ["LETTERS", totalLetters, "사장님 편지"],
                ["HIGH★", totalHighFives, "크루 하이파이브"],
              ] as const
            ).map(([k, v, d], i) => (
              <div
                key={k}
                style={{
                  padding: "18px 18px",
                  borderRight: i % 2 === 0 ? "1px solid var(--rule)" : "none",
                  borderBottom: i < 4 ? "1px solid var(--rule)" : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "var(--mono-font)",
                    color: "var(--ink-3)",
                    letterSpacing: "0.14em",
                  }}
                >
                  {k}
                </div>
                <div
                  className="serif"
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    color: "var(--ink)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    marginTop: 4,
                  }}
                >
                  {new Intl.NumberFormat("ko-KR").format(v)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-3)",
                    marginTop: 2,
                  }}
                >
                  {d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 01 — 관계의 지도 */}
      <section style={{ padding: "48px 56px 28px" }}>
        <SectionHeader
          number="01"
          eyebrow="관계의 지도"
          title={
            <>
              프로젝트·가게·참여자가
              <br />
              어떻게 엮였는지
            </>
          }
          aside={
            <>
              노드 하나하나는 사람이고 장소입니다. 선은 그들 사이에 오간
              환대입니다. 단일 지표가 아닌 형태로 임팩트를 읽어보세요.
            </>
          }
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 260px",
            border: "1px solid var(--rule)",
            background: "var(--paper)",
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 20,
              minHeight: 600,
              borderRight: "1px solid var(--rule)",
            }}
          >
            <NodeMap data={nodeMapData} />
          </div>
          <div
            style={{
              padding: "28px 24px 24px",
              background: "var(--paper-2)",
            }}
          >
            <RailLabel>LEGEND</RailLabel>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 24,
                marginTop: 14,
              }}
            >
              <LegendRow
                label="프로젝트"
                sub="환대가 자라는 축"
                marker={
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      background: "var(--pine)",
                    }}
                  />
                }
              />
              <LegendRow
                label="가게·장소"
                sub="환대가 머무는 점"
                marker={
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: "var(--paper)",
                      border: "2px solid var(--ink-2)",
                    }}
                  />
                }
              />
              <LegendRow
                label="참여자"
                sub="환대가 흐르는 사람"
                marker={
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: "var(--ink-2)",
                      marginLeft: 4,
                      marginRight: 4,
                    }}
                  />
                }
              />
            </div>
            <RailLabel>CATEGORY</RailLabel>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
                marginBottom: 24,
                marginTop: 10,
              }}
            >
              {categories.map((c) => (
                <div
                  key={c.id as string}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 11.5,
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      background:
                        CATEGORY_COLOR[c.slug as string] ?? "var(--ink-2)",
                    }}
                  />
                  <span className="serif" style={{ fontWeight: 600 }}>
                    {c.name as string}
                  </span>
                </div>
              ))}
            </div>
            <RailLabel>NOTE</RailLabel>
            <div
              style={{
                fontSize: 11,
                lineHeight: 1.75,
                color: "var(--ink-2)",
                fontFamily: "var(--serif-font)",
                marginTop: 8,
              }}
            >
              공개로 표시된 카드만 지도에 나타납니다. 비공개 기록은 당사자에게만
              보여요.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 02 — 카테고리별 진척 */}
      <section style={{ padding: "48px 56px 28px" }}>
        <SectionHeader
          number="02"
          eyebrow="네 갈래의 환대"
          title="카테고리별 진척"
          aside={
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                fontFamily: "var(--mono-font)",
                letterSpacing: "0.08em",
              }}
            >
              기준 {today.getFullYear()}년 · 100% 만점
            </span>
          }
          asideAlign="bottom"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "1px solid var(--ink)",
            borderBottom: "1px solid var(--ink)",
          }}
        >
          {categoryStats.map((c, i) => {
            const color = CATEGORY_COLOR[c.slug] ?? "var(--ink-2)";
            return (
              <div
                key={c.id}
                style={{
                  padding: "28px 22px 26px",
                  borderRight: i < 3 ? "1px solid var(--rule)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mono-font)",
                      color: "var(--ink-3)",
                      letterSpacing: "0.12em",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      background: color,
                    }}
                  />
                </div>
                <div>
                  <div
                    className="serif"
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontFamily: "var(--mono-font)",
                      color: "var(--ink-3)",
                      letterSpacing: "0.1em",
                      marginTop: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    {CATEGORY_EN[c.slug] ?? "—"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                  }}
                >
                  <span
                    className="serif"
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      letterSpacing: "-0.03em",
                      color,
                      lineHeight: 1,
                    }}
                  >
                    {c.avgPercent}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--ink-3)",
                      fontFamily: "var(--mono-font)",
                    }}
                  >
                    / 100
                  </span>
                </div>
                <ProgressBar value={c.avgPercent} max={100} color={color} />
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ink-2)",
                    lineHeight: 1.65,
                  }}
                >
                  {c.description ?? "—"}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontFamily: "var(--mono-font)",
                    color: "var(--ink-3)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {c.scoredCount}/{c.memberCount} 프로젝트 · 카드{" "}
                  {c.activityCount}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 03 — 진행 중 프로젝트 */}
      <section style={{ padding: "48px 56px 28px" }}>
        <SectionHeader
          number="03"
          eyebrow="지금 일어나는 일"
          title="진행 중 프로젝트"
          aside={
            <Link
              href="/projects"
              style={{
                fontSize: 12,
                color: "var(--ink-2)",
                fontFamily: "var(--mono-font)",
                textDecoration: "none",
              }}
            >
              전체 프로젝트 보기 →
            </Link>
          }
          asideAlign="bottom"
        />
        {ongoingProjects.length === 0 ? (
          <p
            style={{
              border: "1px dashed var(--rule)",
              padding: "32px 24px",
              textAlign: "center",
              fontSize: 13,
              color: "var(--ink-3)",
              background: "var(--paper-2)",
            }}
          >
            지금 진행 중인 공개 프로젝트가 없어요.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
            }}
          >
            {ongoingProjects.map((p) => {
              const color =
                CATEGORY_COLOR[p.categorySlug ?? ""] ?? "var(--ink-2)";
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  style={{
                    padding: "22px 22px 20px",
                    border: "1px solid var(--rule)",
                    background: "var(--paper)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    minHeight: 200,
                    textDecoration: "none",
                    color: "var(--ink)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: color,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--mono-font)",
                        color: "var(--ink-3)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      {CATEGORY_EN[p.categorySlug ?? ""] ?? "—"}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        fontFamily: "var(--mono-font)",
                        color,
                        fontWeight: 600,
                      }}
                    >
                      ● 진행 {p.inProgressEpisodes}회차
                    </span>
                  </div>
                  <div>
                    <div
                      className="serif"
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.25,
                      }}
                    >
                      {p.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--ink-3)",
                        marginTop: 4,
                        fontFamily: "var(--mono-font)",
                      }}
                    >
                      {p.totalEpisodes}회차 · 카드 {p.activityCount}장
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-2)",
                      lineHeight: 1.65,
                      flex: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {p.summary ?? "—"}
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10.5,
                        fontFamily: "var(--mono-font)",
                        color: "var(--ink-3)",
                        marginBottom: 5,
                      }}
                    >
                      <span>{p.result.label}</span>
                      <span>{p.result.percent}%</span>
                    </div>
                    <ProgressBar
                      value={p.result.percent}
                      max={100}
                      color={color}
                      height={3}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 04 — 이번 주의 카드 */}
      <section style={{ padding: "48px 0 28px" }}>
        <div style={{ padding: "0 56px" }}>
          <SectionHeader
            number="04"
            eyebrow="최근 공개된 환대"
            title="이번 주의 카드"
            aside={
              <Link
                href="/feed"
                style={{
                  fontSize: 12,
                  color: "var(--ink-2)",
                  fontFamily: "var(--mono-font)",
                  textDecoration: "none",
                }}
              >
                피드로 →
              </Link>
            }
            asideAlign="bottom"
          />
        </div>
        {heroCards.length === 0 ? (
          <div style={{ padding: "0 56px" }}>
            <p
              style={{
                border: "1px dashed var(--rule)",
                padding: "32px 24px",
                textAlign: "center",
                fontSize: 13,
                color: "var(--ink-3)",
                background: "var(--paper-2)",
              }}
            >
              아직 공개된 카드가 없어요.
            </p>
          </div>
        ) : (
          <div
            className="gh-scroll"
            style={{
              display: "flex",
              gap: 16,
              padding: "4px 56px 8px",
              overflowX: "auto",
            }}
          >
            {heroCards.map((c) => (
              <CardFront key={c.id} card={c} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "72px 56px",
          textAlign: "center",
          background: "var(--paper-2)",
          borderTop: "1px solid var(--rule)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono-font)",
            fontSize: 10.5,
            color: "var(--ink-3)",
            letterSpacing: "0.18em",
            marginBottom: 20,
          }}
        >
          당신도 이 서사의 일부가 될 수 있어요
        </div>
        <h2
          className="serif"
          style={{
            fontSize: 48,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            margin: "0 auto",
            fontWeight: 700,
            maxWidth: 720,
          }}
        >
          강화도 어딘가에서 QR을 찍는 순간,
          <br />
          당신의 카드가 한 장 늘어납니다.
        </h2>
        <div
          style={{
            marginTop: 30,
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {actor.role === "anonymous" ? (
            <Link href="/login" style={{ textDecoration: "none" }}>
              <GhButton variant="primary" size="lg">
                카카오로 시작하기
              </GhButton>
            </Link>
          ) : (
            <Link href="/collection" style={{ textDecoration: "none" }}>
              <GhButton variant="primary" size="lg">
                내 도감 열기
              </GhButton>
            </Link>
          )}
          <Link href="/projects" style={{ textDecoration: "none" }}>
            <GhButton variant="ghost" size="lg">
              프로젝트 둘러보기
            </GhButton>
          </Link>
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-3)",
            marginTop: 14,
          }}
        >
          비공개가 기본값이에요. 내 기록은 내가 정해요.
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "28px 56px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--mono-font)",
          fontSize: 11,
          color: "var(--ink-3)",
          letterSpacing: "0.08em",
        }}
      >
        <GhWordmark size={13} mono />
        <span>청풍 · 강화도 · {today.getFullYear()}</span>
        <span>v0.2 · SERVICE DESIGN PREVIEW</span>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Sub-components (page-scoped)
 * ───────────────────────────────────────────────────────────── */

function SectionHeader({
  number,
  eyebrow,
  title,
  aside,
  asideAlign = "side",
}: {
  number: string;
  eyebrow: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
  asideAlign?: "side" | "bottom";
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: asideAlign === "bottom" ? "flex-end" : "flex-start",
        marginBottom: 24,
        gap: 24,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--mono-font)",
            fontSize: 10.5,
            color: "var(--ink-3)",
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          SECTION {number} — {eyebrow}
        </div>
        <h2
          className="serif"
          style={{
            fontSize: 38,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            margin: 0,
            fontWeight: 700,
          }}
        >
          {title}
        </h2>
      </div>
      {aside ? (
        asideAlign === "side" ? (
          <div
            style={{
              maxWidth: 340,
              fontSize: 12.5,
              lineHeight: 1.7,
              color: "var(--ink-2)",
              paddingLeft: 20,
              borderLeft: "1px solid var(--rule)",
            }}
          >
            {aside}
          </div>
        ) : (
          <div>{aside}</div>
        )
      ) : null}
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
        letterSpacing: "0.12em",
      }}
    >
      {children}
    </div>
  );
}

function LegendRow({
  label,
  sub,
  marker,
}: {
  label: string;
  sub: string;
  marker: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {marker}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{sub}</div>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  max,
  color,
  height = 5,
}: {
  value: number;
  max: number;
  color: string;
  height?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      style={{
        height,
        background: "var(--rule-2)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
        }}
      />
    </div>
  );
}

type HeroCard = {
  id: string;
  body: string | null;
  photo_url: string | null;
  created_at: string;
  shop: { id: string; name: string } | null;
  episode: { id: string; title: string } | null;
  project: { id: string; title: string; slug: string } | null;
  categorySlug: string | null;
  categoryName: string | null;
};

function CardFront({ card }: { card: HeroCard }) {
  const color = CATEGORY_COLOR[card.categorySlug ?? ""] ?? "var(--ink-2)";
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
    <article
      style={{
        flexShrink: 0,
        width: 220,
        height: 320,
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
          backgroundImage: card.photo_url
            ? undefined
            : "repeating-linear-gradient(135deg, oklch(0.65 0.06 45 / 0.4) 0 4px, transparent 4px 9px)",
        }}
      >
        {card.photo_url ? (
          <Image
            src={card.photo_url}
            alt={card.body ?? place}
            fill
            sizes="220px"
            style={{ objectFit: "cover" }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
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
        {card.categoryName ? (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "var(--paper)",
              padding: "3px 8px",
              borderRadius: 4,
              fontSize: 10,
              color: "var(--ink)",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 2,
                background: color,
              }}
            />
            {card.categoryName}
          </div>
        ) : null}
      </div>
      <div
        style={{
          padding: "12px 14px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          className="serif"
          style={{
            fontSize: 13.5,
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
            alignItems: "flex-end",
            fontSize: 10,
            color: "var(--ink-3)",
            fontFamily: "var(--mono-font)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span>@ {place}</span>
            <span>{dateText}</span>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "52%",
          height: 1,
          backgroundImage:
            "linear-gradient(90deg, var(--rule) 50%, transparent 50%)",
          backgroundSize: "6px 1px",
        }}
      />
    </article>
  );
}
