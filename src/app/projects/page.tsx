import Link from "next/link";

import { ProgressBar } from "@/components/projects/ProgressBar";
import {
  calculateProgress,
  type ProgressResult,
} from "@/lib/progress/calculator";
import type { ProgressType } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = { category?: string };

/**
 * /projects — 공개 프로젝트 리스트.
 *
 * 기본은 카테고리 순 → 프로젝트 순. ?category=slug 쿼리로 필터 가능.
 * 각 카드는 진척바(에피소드 완료 수 기반) + 공개 카드 수 요약.
 *
 * `/impact` 와 데이터 로딩이 겹쳐 지루할 수 있지만, 여기는 "카테고리 안에 어떤
 * 장기 프로젝트들이 굴러가고 있나" 를 보여주는 탐색 화면이라 집계 수식이 더 단순하다.
 */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = createAdminClient();

  const [categoriesRes, projectsRes, episodesRes] = await Promise.all([
    admin
      .from("categories")
      .select("id, slug, name, description, sort_order")
      .order("sort_order", { ascending: true }),
    admin
      .from("projects")
      .select(
        "id, slug, title, summary, category_id, progress_type, progress_target, updated_at"
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

  const selectedCategory = searchParams.category
    ? categories.find((c) => c.slug === searchParams.category)
    : null;

  const projects = selectedCategory
    ? allProjects.filter((p) => p.category_id === selectedCategory.id)
    : allProjects;

  // 프로젝트별 에피소드 집계
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

  const projectsByCategory = new Map<string, typeof allProjects>();
  for (const p of projects) {
    const key = p.category_id as string;
    const arr = projectsByCategory.get(key) ?? [];
    arr.push(p);
    projectsByCategory.set(key, arr);
  }

  const visibleCategories = selectedCategory
    ? categories.filter((c) => c.id === selectedCategory.id)
    : categories;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">강화유니버스 프로젝트</span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          장기 프로젝트 · 환대의 네 갈래
        </h1>
        <p className="text-sm text-muted-foreground">
          청풍이 이끌고 참여자·크루·사장님이 쌓는 공개 프로젝트.{" "}
          {selectedCategory
            ? `지금은 "${selectedCategory.name}" 카테고리만 보는 중이에요.`
            : "카테고리를 눌러 좁혀볼 수 있어요."}
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 text-xs">
        <CategoryChip
          href="/projects"
          label="전체"
          active={!selectedCategory}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.id as string}
            href={`/projects?category=${c.slug as string}`}
            label={c.name as string}
            active={selectedCategory?.id === c.id}
          />
        ))}
      </nav>

      {visibleCategories.map((c) => {
        const members = projectsByCategory.get(c.id as string) ?? [];
        return (
          <section key={c.id as string} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">{c.name as string}</h2>
                {c.description ? (
                  <p className="text-xs text-muted-foreground">
                    {c.description as string}
                  </p>
                ) : null}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {members.length}개 프로젝트
              </span>
            </div>

            {members.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                이 카테고리에는 아직 공개된 프로젝트가 없어요.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  });
                  return (
                    <ProjectListCard
                      key={p.id as string}
                      slug={p.slug as string}
                      title={p.title as string}
                      summary={(p.summary as string | null) ?? null}
                      result={result}
                      inProgressEpisodes={stats.inProgress}
                    />
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full px-3 py-1 transition " +
        (active
          ? "bg-foreground text-background"
          : "border border-border bg-background text-muted-foreground hover:bg-muted/40")
      }
    >
      {label}
    </Link>
  );
}

function ProjectListCard({
  slug,
  title,
  summary,
  result,
  inProgressEpisodes,
}: {
  slug: string;
  title: string;
  summary: string | null;
  result: ProgressResult;
  inProgressEpisodes: number;
}) {
  return (
    <Link
      href={`/projects/${slug}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 transition hover:bg-muted/40"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {summary ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {summary}
          </p>
        ) : null}
      </div>
      <ProgressBar result={result} title="진척" variant="compact" />
      <div className="text-[11px] text-muted-foreground">
        {inProgressEpisodes > 0
          ? `지금 ${inProgressEpisodes}개 회차 진행 중`
          : "다음 회차를 기다리는 중"}
      </div>
    </Link>
  );
}
