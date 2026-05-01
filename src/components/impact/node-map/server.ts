import {
  calculateProgress,
  type ProgressResult,
} from "@/lib/progress/calculator";
import type { ProgressType } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  accentForSlug,
  type CategoryDatum,
  type EpisodeDatum,
  type LineageEdgeDatum,
  type NodeMapData,
  type ProjectDatum,
  type ShopDatum,
} from "./types";

/**
 * /impact 노드맵용 데이터 로더.
 *
 * 공개(is_public=true, removed_at IS NULL) 엔티티만 모아 4-level 계보도 형태로 정리.
 * admin client 로 RLS 우회 — 대신 각 쿼리에서 공개 필터를 명시해 공개 영역 일관성 유지.
 */
export async function loadNodeMapData(): Promise<NodeMapData> {
  const admin = createAdminClient();

  const [categoriesRes, projectsRes, episodesRes, shopsRes, activitiesRes] =
    await Promise.all([
      admin
        .from("categories")
        .select("id, slug, name, description, sort_order")
        .order("sort_order", { ascending: true }),
      admin
        .from("projects")
        .select(
          "id, slug, title, summary, category_id, progress_type, progress_target"
        )
        .eq("is_public", true),
      admin
        .from("episodes")
        .select("id, title, project_id, status, seq, session_date")
        .eq("is_public", true)
        .order("seq", { ascending: true, nullsFirst: false })
        .order("session_date", { ascending: true, nullsFirst: false }),
      admin
        .from("shops")
        .select("id, name, address")
        .eq("is_public", true)
        .order("name", { ascending: true }),
      // 노드맵 엣지 가중치 산정용 공개 activity 링키지
      admin
        .from("activities")
        .select("id, project_id, episode_id, shop_id")
        .eq("is_public", true)
        .is("removed_at", null),
    ]);

  const categoriesRaw = categoriesRes.data ?? [];
  const projectsRaw = projectsRes.data ?? [];
  const episodesRaw = episodesRes.data ?? [];
  const shopsRaw = shopsRes.data ?? [];
  const activities = activitiesRes.data ?? [];

  const episodeById = new Map<
    string,
    { id: string; project_id: string | null }
  >();
  for (const e of episodesRaw) {
    episodeById.set(e.id as string, {
      id: e.id as string,
      project_id: (e.project_id as string | null) ?? null,
    });
  }

  // 엣지 가중치 집계
  const projectCards = new Map<string, number>();
  const episodeCards = new Map<string, number>();
  const shopCards = new Map<string, number>();
  // project -> shop (episode 가 없는 activity 에서 연결되는 경우)
  const projectShopWeight = new Map<string, number>();
  // episode -> shop
  const episodeShopWeight = new Map<string, number>();

  for (const a of activities) {
    const eid = a.episode_id as string | null;
    const pid = a.project_id as string | null;
    const sid = a.shop_id as string | null;

    const projectFromEpisode = eid
      ? (episodeById.get(eid)?.project_id ?? null)
      : null;
    const effectiveProject = pid ?? projectFromEpisode;

    if (effectiveProject) {
      projectCards.set(
        effectiveProject,
        (projectCards.get(effectiveProject) ?? 0) + 1
      );
    }
    if (eid) {
      episodeCards.set(eid, (episodeCards.get(eid) ?? 0) + 1);
    }
    if (sid) {
      shopCards.set(sid, (shopCards.get(sid) ?? 0) + 1);
    }

    if (sid) {
      if (eid) {
        const key = `${eid}::${sid}`;
        episodeShopWeight.set(key, (episodeShopWeight.get(key) ?? 0) + 1);
      } else if (effectiveProject) {
        const key = `${effectiveProject}::${sid}`;
        projectShopWeight.set(key, (projectShopWeight.get(key) ?? 0) + 1);
      }
    }
  }

  // 카테고리
  const categoryProjectCount = new Map<string, number>();
  const categoryCardCount = new Map<string, number>();
  for (const p of projectsRaw) {
    const cid = p.category_id as string;
    categoryProjectCount.set(cid, (categoryProjectCount.get(cid) ?? 0) + 1);
    const cards = projectCards.get(p.id as string) ?? 0;
    categoryCardCount.set(cid, (categoryCardCount.get(cid) ?? 0) + cards);
  }

  const categories: CategoryDatum[] = categoriesRaw.map((c) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
    description: (c.description as string | null) ?? null,
    accent: accentForSlug(c.slug as string),
    projectCount: categoryProjectCount.get(c.id as string) ?? 0,
    publicCardCount: categoryCardCount.get(c.id as string) ?? 0,
  }));

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // 프로젝트
  const episodesByProject = new Map<
    string,
    { total: number; completed: number; inProgress: number }
  >();
  for (const e of episodesRaw) {
    const pid = e.project_id as string;
    const b = episodesByProject.get(pid) ?? {
      total: 0,
      completed: 0,
      inProgress: 0,
    };
    b.total += 1;
    if (e.status === "completed") b.completed += 1;
    if (e.status === "in_progress") b.inProgress += 1;
    episodesByProject.set(pid, b);
  }

  const projects: ProjectDatum[] = projectsRaw.map((p) => {
    const bucket = episodesByProject.get(p.id as string) ?? {
      total: 0,
      completed: 0,
      inProgress: 0,
    };
    const progress: ProgressResult = calculateProgress({
      progress_type: p.progress_type as ProgressType,
      progress_target: (p.progress_target as Record<string, unknown>) ?? {},
      completedEpisodes: bucket.completed,
      totalEpisodes: bucket.total,
      publicActivities: projectCards.get(p.id as string) ?? 0,
    });
    const accent = categoryById.get(p.category_id as string)?.accent ?? "sage";
    return {
      id: p.id as string,
      slug: p.slug as string,
      title: p.title as string,
      summary: (p.summary as string | null) ?? null,
      categoryId: p.category_id as string,
      categoryAccent: accent,
      percent: progress.percent,
      percentLabel: progress.label,
      publicCardCount: projectCards.get(p.id as string) ?? 0,
      inProgressEpisodes: bucket.inProgress,
    };
  });

  const projectById = new Map(projects.map((p) => [p.id, p]));

  // 에피소드
  const episodes: EpisodeDatum[] = episodesRaw.map((e) => {
    const parent = projectById.get(e.project_id as string);
    return {
      id: e.id as string,
      title: e.title as string,
      projectId: e.project_id as string,
      categoryAccent: parent?.categoryAccent ?? "sage",
      status:
        (e.status as "planned" | "in_progress" | "completed" | null) ??
        "planned",
      seq: (e.seq as number | null) ?? null,
      sessionDate: (e.session_date as string | null) ?? null,
      publicCardCount: episodeCards.get(e.id as string) ?? 0,
    };
  });

  // 가게 — 공개 카드가 하나라도 있는 가게만 지도에 노출
  const shops: ShopDatum[] = shopsRaw
    .map((s) => ({
      id: s.id as string,
      name: s.name as string,
      address: (s.address as string | null) ?? null,
      publicCardCount: shopCards.get(s.id as string) ?? 0,
    }))
    .filter((s) => s.publicCardCount > 0);

  // 엣지 구성
  const edges: LineageEdgeDatum[] = [];

  // 카테고리 → 프로젝트
  for (const p of projects) {
    edges.push({
      id: `e-cp-${p.id}`,
      source: `cat-${p.categoryId}`,
      target: `prj-${p.id}`,
      weight: Math.max(1, p.publicCardCount),
      accent: p.categoryAccent,
    });
  }

  // 프로젝트 → 에피소드
  for (const ep of episodes) {
    edges.push({
      id: `e-pe-${ep.id}`,
      source: `prj-${ep.projectId}`,
      target: `epi-${ep.id}`,
      weight: Math.max(1, ep.publicCardCount),
      accent: ep.categoryAccent,
    });
  }

  // 에피소드 → 가게 / 프로젝트 → 가게
  const shopSet = new Set(shops.map((s) => s.id));
  for (const [key, weight] of episodeShopWeight) {
    const [eid, sid] = key.split("::");
    if (!shopSet.has(sid)) continue;
    const ep = episodes.find((e) => e.id === eid);
    if (!ep) continue;
    edges.push({
      id: `e-es-${eid}-${sid}`,
      source: `epi-${eid}`,
      target: `shp-${sid}`,
      weight,
      accent: ep.categoryAccent,
    });
  }
  for (const [key, weight] of projectShopWeight) {
    const [pid, sid] = key.split("::");
    if (!shopSet.has(sid)) continue;
    const prj = projectById.get(pid);
    if (!prj) continue;
    edges.push({
      id: `e-ps-${pid}-${sid}`,
      source: `prj-${pid}`,
      target: `shp-${sid}`,
      weight,
      accent: prj.categoryAccent,
    });
  }

  return { categories, projects, episodes, shops, edges };
}
