import Link from "next/link";

import { GhWordmark } from "@/components/claude/primitives";
import { PublicTopNav } from "@/components/claude/PublicTopNav";
import { getCurrentActor } from "@/lib/auth/current-actor";
import {
  calculateProgress,
  type ProgressResult,
} from "@/lib/progress/calculator";
import type { ProgressType } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

type SearchParams = { category?: string };

/**
 * /projects — 공개 프로젝트 리스트.
 *
 * Claude 캔버스에는 시안이 없지만 /impact·/projects/[slug] 와 일관된
 * editorial 톤으로 직접 디자인. 카테고리별 그룹 + 카드 그리드.
 *
 * 데이터·진척 계산은 기존 그대로 유지.
 */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await getCurrentActor();
  const admin = createAdminClient();

  const [categoriesRes, projectsRes, episodesRes] = await Promise.all([
    admin
      .from("categories")
      .select("id, slug, name, description, sort_order")
      .order("sort_order", { ascending: true }),
    admin
      .from("projects")
      .select(
        "id, slug, title, summary, category_id, progress_type, progress_target, started_at, ended_at, updated_at"
      )
      .eq("is_public", true)
      .order("updated_at", { ascending: false }),
    admin
      .from("episodes")
      .select("id, project_id, status")
      .eq("is_public", true),
  ]);

  const categories = categoriesRes.data ?? [];
  const allProjects = projectsRes.data ?? [];
  const episodes = episodesRes.data ?? [];

  // 카드/참여자 집계 — /impact·/projects/[slug] 와 동일한 식 — 직결 + 에피소드 경유
  const projectIds = allProjects.map((p) => p.id as string);
  const episodeIds = episodes.map((e) => e.id as string);

  const [directActsRes, viaEpisodeActsRes] = await Promise.all([
    projectIds.length > 0
      ? admin
          .from("activities")
          .select("project_id, user_id")
          .in("project_id", projectIds)
          .eq("is_public", true)
          .is("removed_at", null)
      : Promise.resolve({
          data: [] as { project_id: string | null; user_id: string | null }[],
        }),
    episodeIds.length > 0
      ? admin
          .from("activities")
          .select("episode_id, user_id")
          .in("episode_id", episodeIds)
          .eq("is_public", true)
          .is("removed_at", null)
      : Promise.resolve({
          data: [] as { episode_id: string | null; user_id: string | null }[],
        }),
  ]);

  const projectByEpisode = new Map(
    episodes.map((e) => [e.id as string, e.project_id as string])
  );
  const cardCountByProject = new Map<string, number>();
  const participantSetByProject = new Map<string, Set<string>>();

  function bump(pid: string, uid: string | null) {
    cardCountByProject.set(pid, (cardCountByProject.get(pid) ?? 0) + 1);
    if (uid) {
      const set = participantSetByProject.get(pid) ?? new Set<string>();
      set.add(uid);
      participantSetByProject.set(pid, set);
    }
  }
  for (const r of directActsRes.data ?? []) {
    if (r.project_id) bump(r.project_id, r.user_id ?? null);
  }
  for (const r of viaEpisodeActsRes.data ?? []) {
    const pid = projectByEpisode.get(r.episode_id ?? "");
    if (pid) bump(pid, r.user_id ?? null);
  }

  const episodeStatsByProject = new Map<
    string,
    { total: number; completed: number; inProgress: number }
  >();
  for (const e of episodes) {
    const pid = e.project_id as string;
    const b = episodeStatsByProject.get(pid) ?? {
      total: 0,
      completed: 0,
      inProgress: 0,
    };
    b.total += 1;
    if (e.status === "completed") b.completed += 1;
    if (e.status === "in_progress") b.inProgress += 1;
    episodeStatsByProject.set(pid, b);
  }

  const selectedCategory = searchParams.category
    ? (categories.find((c) => c.slug === searchParams.category) ?? null)
    : null;

  const visibleProjects = selectedCategory
    ? allProjects.filter((p) => p.category_id === selectedCategory.id)
    : allProjects;

  const visibleCategories = selectedCategory
    ? categories.filter((c) => c.id === selectedCategory.id)
    : categories;

  const projectsByCategory = new Map<string, typeof allProjects>();
  for (const p of visibleProjects) {
    const key = p.category_id as string;
    const arr = projectsByCategory.get(key) ?? [];
    arr.push(p);
    projectsByCategory.set(key, arr);
  }

  const totalCount = visibleProjects.length;

  return (
    <div
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--ui-font)",
        minHeight: "100vh",
      }}
    >
      <PublicTopNav actor={actor} active="projects" />

      {/* Hero band */}
      <section
        style={{
          padding: "52px 56px 40px",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono-font)",
            fontSize: 11,
            color: "var(--ink-3)",
            letterSpacing: "0.18em",
            marginBottom: 18,
          }}
        >
          PROJECTS · 환대의 네 갈래
        </div>
        <h1
          className="serif"
          style={{
            fontSize: 60,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "var(--ink)",
          }}
        >
          장기 프로젝트
        </h1>
        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.85,
            color: "var(--ink-2)",
            marginTop: 18,
            maxWidth: 640,
          }}
        >
          청풍이 이끌고 참여자·크루·사장님이 함께 쌓는 공개 프로젝트. 연 단위로
          이어지며 카드와 회차로 점점 두꺼워집니다.
          {selectedCategory ? (
            <>
              {" "}
              지금은 <strong>{selectedCategory.name}</strong> 카테고리만 보고
              있어요.
            </>
          ) : null}
        </p>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 22,
            fontSize: 11,
            color: "var(--ink-3)",
            fontFamily: "var(--mono-font)",
            letterSpacing: "0.08em",
          }}
        >
          <span>{totalCount}개 프로젝트</span>
          <span>·</span>
          <span>
            공개 카드{" "}
            {[...cardCountByProject.values()].reduce((s, n) => s + n, 0)}장
          </span>
        </div>
      </section>

      {/* Category filter chips */}
      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: "20px 56px",
          borderBottom: "1px solid var(--rule)",
          background: "var(--paper-2)",
        }}
      >
        <CategoryChip
          href="/projects"
          label="전체"
          en="ALL"
          color="var(--ink)"
          active={!selectedCategory}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.id as string}
            href={`/projects?category=${c.slug as string}`}
            label={c.name as string}
            en={(CATEGORY_EN[c.slug as string] ?? "—").toUpperCase()}
            color={CATEGORY_COLOR[c.slug as string] ?? "var(--ink-2)"}
            active={selectedCategory?.id === c.id}
          />
        ))}
      </nav>

      {/* Sections per category */}
      {visibleCategories.map((c) => {
        const members = projectsByCategory.get(c.id as string) ?? [];
        const color = CATEGORY_COLOR[c.slug as string] ?? "var(--ink-2)";
        const en = CATEGORY_EN[c.slug as string] ?? "—";
        return (
          <section
            key={c.id as string}
            style={{
              padding: "48px 56px 28px",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
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
                    letterSpacing: "0.18em",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      background: color,
                    }}
                  />
                  {en.toUpperCase()}
                </div>
                <h2
                  className="serif"
                  style={{
                    fontSize: 32,
                    lineHeight: 1.15,
                    letterSpacing: "-0.03em",
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  {c.name as string}
                </h2>
                {c.description ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ink-2)",
                      marginTop: 8,
                      lineHeight: 1.7,
                      maxWidth: 540,
                    }}
                  >
                    {c.description as string}
                  </p>
                ) : null}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                  letterSpacing: "0.05em",
                }}
              >
                {members.length}개 프로젝트
              </span>
            </div>

            {members.length === 0 ? (
              <p
                style={{
                  border: "1px dashed var(--rule)",
                  padding: "32px 24px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--ink-3)",
                  background: "var(--paper-2)",
                  fontFamily: "var(--serif-font)",
                }}
              >
                이 카테고리에는 아직 공개된 프로젝트가 없어요.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 14,
                }}
              >
                {members.map((p) => {
                  const stats = episodeStatsByProject.get(p.id as string) ?? {
                    total: 0,
                    completed: 0,
                    inProgress: 0,
                  };
                  const result = calculateProgress({
                    progress_type: p.progress_type as ProgressType,
                    progress_target:
                      (p.progress_target as Record<string, unknown>) ?? {},
                    completedEpisodes: stats.completed,
                    totalEpisodes: stats.total,
                    publicActivities:
                      cardCountByProject.get(p.id as string) ?? 0,
                    distinctParticipants:
                      participantSetByProject.get(p.id as string)?.size ?? 0,
                  });
                  return (
                    <ProjectListCard
                      key={p.id as string}
                      slug={p.slug as string}
                      title={p.title as string}
                      summary={(p.summary as string | null) ?? null}
                      categoryEn={en}
                      categoryColor={color}
                      period={formatPeriod(
                        p.started_at as string | null,
                        p.ended_at as string | null
                      )}
                      result={result}
                      inProgressEpisodes={stats.inProgress}
                      totalEpisodes={stats.total}
                      cardCount={cardCountByProject.get(p.id as string) ?? 0}
                    />
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

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
        <span>청풍 · 강화도 · {new Date().getFullYear()}</span>
        <span>v0.2 · SERVICE DESIGN PREVIEW</span>
      </footer>
    </div>
  );
}

function CategoryChip({
  href,
  label,
  en,
  color,
  active,
}: {
  href: string;
  label: string;
  en: string;
  color: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        background: active ? "var(--ink)" : "var(--paper)",
        color: active ? "var(--paper)" : "var(--ink-2)",
        border: `1px solid ${active ? "var(--ink)" : "var(--rule)"}`,
        textDecoration: "none",
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          background: active ? "var(--paper)" : color,
        }}
      />
      <span>{label}</span>
      <span
        style={{
          fontFamily: "var(--mono-font)",
          fontSize: 9.5,
          color: active ? "var(--paper)" : "var(--ink-3)",
          letterSpacing: "0.08em",
        }}
      >
        {en}
      </span>
    </Link>
  );
}

function ProjectListCard({
  slug,
  title,
  summary,
  categoryEn,
  categoryColor,
  period,
  result,
  inProgressEpisodes,
  totalEpisodes,
  cardCount,
}: {
  slug: string;
  title: string;
  summary: string | null;
  categoryEn: string;
  categoryColor: string;
  period: string | null;
  result: ProgressResult;
  inProgressEpisodes: number;
  totalEpisodes: number;
  cardCount: number;
}) {
  return (
    <Link
      href={`/projects/${slug}`}
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
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            background: categoryColor,
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
          {categoryEn}
          {period ? ` · ${period}` : ""}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontFamily: "var(--mono-font)",
            color: inProgressEpisodes > 0 ? categoryColor : "var(--ink-3)",
            fontWeight: 600,
          }}
        >
          {inProgressEpisodes > 0
            ? `● 진행 ${inProgressEpisodes}회차`
            : totalEpisodes > 0
              ? "○ 다음 회차 대기"
              : "○ 준비 중"}
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
          {title}
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
        {summary ?? "—"}
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
          <span>{result.label}</span>
          <span>
            {result.percent}% · 카드 {cardCount}
          </span>
        </div>
        <div
          style={{
            height: 3,
            background: "var(--rule-2)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(0, result.percent))}%`,
              height: "100%",
              background: categoryColor,
              borderRadius: 999,
            }}
          />
        </div>
      </div>
    </Link>
  );
}

function formatPeriod(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const ys = start ? start.slice(0, 4) : "";
  const ye = end ? end.slice(0, 4) : "";
  if (ys && ye) return ys === ye ? ys : `${ys}–${ye}`;
  if (ys) return `${ys}–`;
  return `–${ye}`;
}
