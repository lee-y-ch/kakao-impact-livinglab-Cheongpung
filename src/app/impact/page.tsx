import Link from "next/link";

import type { ActivityCardData } from "@/components/activities/ActivityCard";
import { ActivityGrid } from "@/components/activities/ActivityGrid";
import {
  CategoryProgressGrid,
  type CategoryProgressItem,
} from "@/components/impact/CategoryProgress";
import { ImpactCounter } from "@/components/impact/ImpactCounter";
import {
  ProjectTimelineCard,
  type TimelineProjectItem,
} from "@/components/impact/ProjectTimelineCard";
import { NodeMap } from "@/components/impact/node-map/NodeMap";
import { loadNodeMapData } from "@/components/impact/node-map/server";
import {
  calculateProgress,
  type ProgressResult,
} from "@/lib/progress/calculator";
import type { ProgressType } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * /impact — 공개 임팩트 대시보드.
 *
 *   1) 상단 카운터 5종 (공개 카드·공개 프로젝트·가게·응원·참여자)
 *   2) 4개 카테고리 진척 그리드 (카테고리 내 프로젝트 평균)
 *   3) 진행 중 프로젝트 타임라인 카드 (in_progress 에피소드가 있는 공개 프로젝트)
 *   4) 최근 공개 카드 히어로 8장
 *
 * 데이터는 admin client 로 한 번에 배치 로드하고, 진척도는 앱 레이어에서 계산.
 * 노드맵은 Phase 5-c(연기) 에 붙을 예정이라 이 페이지에는 없음.
 */

const HERO_CARD_LIMIT = 8;
const TIMELINE_LIMIT = 6;

export default async function ImpactPage() {
  const admin = createAdminClient();
  const nodeMapData = await loadNodeMapData();

  const [
    categoriesRes,
    projectsRes,
    episodesRes,
    publicActivitiesHeroRes,
    publicActivityCountRes,
    shopCountRes,
    reactionCountRes,
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
    admin.from("users").select("id", { count: "exact", head: true }),
  ]);

  const categories = categoriesRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const episodes = episodesRes.data ?? [];

  // 프로젝트별 에피소드 집계
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

  // 프로젝트별 공개 카드 수 — 두 조건(project_id 직접 / episode_id 경유) 각각 집계 후 합산
  const activityCountByProject = new Map<string, number>();
  const recentPhotoByProject = new Map<string, string>();

  if (projects.length > 0) {
    const projectIds = projects.map((p) => p.id as string);
    const allEpisodeIds: string[] = [];
    for (const bucket of episodesByProject.values()) {
      allEpisodeIds.push(...bucket.ids);
    }

    const [directRes, viaEpisodeRes, recentPhotoRes] = await Promise.all([
      admin
        .from("activities")
        .select("project_id")
        .in("project_id", projectIds)
        .eq("is_public", true)
        .is("removed_at", null),
      allEpisodeIds.length > 0
        ? admin
            .from("activities")
            .select("episode_id")
            .in("episode_id", allEpisodeIds)
            .eq("is_public", true)
            .is("removed_at", null)
        : Promise.resolve({ data: [] as { episode_id: string | null }[] }),
      admin
        .from("activities")
        .select("photo_url, project_id, episode_id, created_at")
        .in("project_id", projectIds)
        .eq("is_public", true)
        .is("removed_at", null)
        .not("photo_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

    for (const r of directRes.data ?? []) {
      const pid = r.project_id as string;
      activityCountByProject.set(
        pid,
        (activityCountByProject.get(pid) ?? 0) + 1
      );
    }

    const projectByEpisode = new Map(
      episodes.map((e) => [e.id as string, e.project_id as string])
    );
    for (const r of viaEpisodeRes.data ?? []) {
      const pid = projectByEpisode.get(r.episode_id as string);
      if (!pid) continue;
      activityCountByProject.set(
        pid,
        (activityCountByProject.get(pid) ?? 0) + 1
      );
    }

    for (const r of recentPhotoRes.data ?? []) {
      const pid = r.project_id as string | null;
      if (!pid || recentPhotoByProject.has(pid)) continue;
      if (r.photo_url) {
        recentPhotoByProject.set(pid, r.photo_url as string);
      }
    }
  }

  const categoryById = new Map(
    categories.map((c) => [c.id as string, c as (typeof categories)[number]])
  );

  const projectResults = projects.map((p) => {
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
    });
    return {
      id: p.id as string,
      slug: p.slug as string,
      title: p.title as string,
      summary: (p.summary as string | null) ?? null,
      category_id: p.category_id as string,
      result,
      inProgressEpisodes: bucket.inProgress,
      totalEpisodes: bucket.total,
      activityCount: activityCountByProject.get(p.id as string) ?? 0,
      recentPhotoUrl: recentPhotoByProject.get(p.id as string) ?? null,
    };
  });

  // 카테고리별 평균 진척 — target_missing 인 프로젝트는 제외
  const categoryItems: CategoryProgressItem[] = categories.map((c) => {
    const members = projectResults.filter((pr) => pr.category_id === c.id);
    const scored = members.filter((m) => m.result.note !== "target_missing");
    const avg =
      scored.length > 0
        ? Math.round(
            scored.reduce((s, m) => s + m.result.percent, 0) / scored.length
          )
        : 0;

    const result: ProgressResult =
      scored.length === 0
        ? {
            percent: 0,
            current: 0,
            target: 0,
            label: "기준 설정이 필요해요",
            note: "target_missing",
          }
        : {
            percent: avg,
            current: avg,
            target: 100,
            label: `${members.length}개 프로젝트 평균`,
            note: avg >= 100 ? "completed" : undefined,
          };

    const activitySum = members.reduce((s, m) => s + m.activityCount, 0);

    return {
      categoryId: c.id as string,
      categorySlug: c.slug as string,
      categoryName: c.name as string,
      summary: (c.description as string | null) ?? null,
      result,
      projectCount: members.length,
      activityCount: activitySum,
    };
  });

  const timelineItems: TimelineProjectItem[] = projectResults
    .filter((p) => p.inProgressEpisodes > 0 || p.result.note !== "completed")
    .sort((a, b) => {
      // 진행 중 회차가 있는 쪽 우선, 그 다음 진척도 높은 순
      if (a.inProgressEpisodes !== b.inProgressEpisodes) {
        return b.inProgressEpisodes - a.inProgressEpisodes;
      }
      return b.result.percent - a.result.percent;
    })
    .slice(0, TIMELINE_LIMIT)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      categoryName: (categoryById.get(p.category_id)?.name as string) ?? null,
      result: p.result,
      inProgressEpisodes: p.inProgressEpisodes,
      recentPhotoUrl: p.recentPhotoUrl,
    }));

  const heroCards: ActivityCardData[] = (
    publicActivitiesHeroRes.data ?? []
  ).map((a) => ({
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
      project: a.project as {
        id: string;
        title: string;
        slug: string;
      } | null,
    },
  }));

  const totalPublicCards = publicActivityCountRes.count ?? 0;
  const totalShops = shopCountRes.count ?? 0;
  const totalReactions = reactionCountRes.count ?? 0;
  const totalParticipants = participantCountRes.count ?? 0;
  const totalPublicProjects = projects.length;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          강화유니버스
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          오늘도 강화도가 조금씩 더 강화됩니다.
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          참여자·크루·사장님의 환대 행위가 쌓여 강화도의 서사가 됩니다. 공개로
          선택된 카드와 응원만 이 페이지에 모여요.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ImpactCounter
          value={totalPublicCards}
          label="공개 카드"
          hint="참여자가 공개한 환대의 기록"
          accent
        />
        <ImpactCounter
          value={totalPublicProjects}
          label="진행 프로젝트"
          hint="공개된 장기 프로젝트 수"
        />
        <ImpactCounter
          value={totalShops}
          label="가게"
          hint="청풍과 연결된 강화 가게"
        />
        <ImpactCounter
          value={totalReactions}
          label="응원"
          hint="크루·사장님이 남긴 환대"
        />
        <ImpactCounter
          value={totalParticipants}
          label="참여자"
          hint="로그인한 관계인구"
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">카테고리별 진척</h2>
          <span className="text-xs text-muted-foreground">환대의 네 갈래</span>
        </div>
        <CategoryProgressGrid items={categoryItems} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">지금 굴러가는 프로젝트</h2>
          <Link
            href="/projects"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            전체 보기 →
          </Link>
        </div>
        {timelineItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            지금 진행 중인 공개 프로젝트가 없어요.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {timelineItems.map((item) => (
              <ProjectTimelineCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">환대의 계보도</h2>
            <p className="text-xs text-muted-foreground">
              카테고리 — 프로젝트 — 회차 — 가게. 공개 데이터만으로 그린 강화도의
              관계 지도.
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground">
            스크롤 · 드래그로 탐색
          </span>
        </div>
        <NodeMap data={nodeMapData} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">최근 공개 카드</h2>
          <Link
            href="/feed"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            더 둘러보기 →
          </Link>
        </div>
        <ActivityGrid
          cards={heroCards}
          interactive={false}
          empty={
            <p className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              아직 공개된 카드가 없어요.
            </p>
          }
        />
      </section>
    </main>
  );
}
