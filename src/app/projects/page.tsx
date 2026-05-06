import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { calculateProgress } from "@/lib/progress/calculator";
import type { ProgressType } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/projects` 프로젝트 인덱스.
 * 시안: design-v2-reference/강화유니버스_프로젝트.html (단일 상세) 의 카드 그리드 변형.
 *
 * 공개 페이지 (auth 가드 없음). categories + projects(is_public=true) 를 SELECT 해
 * 카테고리 4종 그리드로 렌더. 진척도 라벨은 calculator 가 progress_type 별로 계산.
 */

type CategoryLabel = "공유지" | "네트워크" | "세계" | "정책";

const CATEGORY_BADGE: Record<CategoryLabel, { bg: string; color: string }> = {
  공유지: { bg: "rgba(180,110,40,0.1)", color: "#9B6020" },
  네트워크: { bg: "rgba(107,175,138,0.12)", color: "#3A7A55" },
  세계: { bg: "rgba(49,130,246,0.1)", color: "#2060C8" },
  정책: { bg: "rgba(130,90,180,0.1)", color: "#6040A0" },
};

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  started_at: string | null;
  ended_at: string | null;
  progress_type: ProgressType;
  progress_target: unknown;
  category: { slug: string | null; name: string | null } | null;
};

type StatRow = {
  cards: number;
  participants: number;
  episodesTotal: number;
  episodesCompleted: number;
};

export default async function ProjectsPage() {
  const admin = createAdminClient();

  const [projectsRes, activitiesRes, episodesRes] = await Promise.all([
    admin
      .from("projects")
      .select(
        `id, slug, title, summary, description, started_at, ended_at,
         progress_type, progress_target,
         category:categories ( slug, name )`
      )
      .eq("is_public", true)
      .order("started_at", { ascending: false, nullsFirst: false }),
    // 모든 프로젝트의 공개 카드 + 작성자 — 인덱스 페이지에서 한 번에 모아서 group-by
    admin
      .from("activities")
      .select("project_id, user_id, episode_id")
      .eq("is_public", true)
      .is("removed_at", null),
    admin.from("episodes").select("id, project_id, status"),
  ]);

  const projects = (projectsRes.data ?? []) as unknown as ProjectRow[];
  const activities = (activitiesRes.data ?? []) as unknown as {
    project_id: string | null;
    user_id: string;
    episode_id: string | null;
  }[];
  const episodes = (episodesRes.data ?? []) as unknown as {
    id: string;
    project_id: string;
    status: string;
  }[];

  // 에피소드 → 프로젝트 매핑 + project_id 별 통계
  const episodeToProject = new Map<string, string>();
  const episodesByProject = new Map<
    string,
    { total: number; completed: number }
  >();
  for (const ep of episodes) {
    episodeToProject.set(ep.id, ep.project_id);
    const m = episodesByProject.get(ep.project_id) ?? {
      total: 0,
      completed: 0,
    };
    m.total += 1;
    if (ep.status === "completed") m.completed += 1;
    episodesByProject.set(ep.project_id, m);
  }

  // 프로젝트별 활동 집계
  const stats = new Map<string, StatRow>();
  const participantsByProject = new Map<string, Set<string>>();
  for (const a of activities) {
    const projectId =
      a.project_id ??
      (a.episode_id ? (episodeToProject.get(a.episode_id) ?? null) : null);
    if (!projectId) continue;
    const s = stats.get(projectId) ?? {
      cards: 0,
      participants: 0,
      episodesTotal: 0,
      episodesCompleted: 0,
    };
    s.cards += 1;
    stats.set(projectId, s);

    const pset = participantsByProject.get(projectId) ?? new Set<string>();
    pset.add(a.user_id);
    participantsByProject.set(projectId, pset);
  }

  // 카테고리별 그룹화
  const grouped = new Map<CategoryLabel, ProjectRow[]>();
  const order: CategoryLabel[] = ["공유지", "네트워크", "세계", "정책"];
  for (const label of order) grouped.set(label, []);
  for (const p of projects) {
    const slug = p.category?.slug;
    const label = labelFromSlug(slug);
    if (!label) continue;
    grouped.get(label)!.push(p);
  }

  return (
    <>
      <PageHeader totalCount={projects.length} />
      <ProjectsGroupedGrid
        grouped={grouped}
        order={order}
        stats={stats}
        episodesByProject={episodesByProject}
        participantsByProject={participantsByProject}
      />
      <NoticeStrip />
    </>
  );
}

// ── helpers ────────────────────────────────────────────────────

function labelFromSlug(slug: string | null | undefined): CategoryLabel | null {
  if (!slug) return null;
  if (slug === "commons") return "공유지";
  if (slug === "network") return "네트워크";
  if (slug === "world") return "세계";
  if (slug === "policy") return "정책";
  return null;
}

function periodLabel(p: ProjectRow): string {
  const start = p.started_at;
  const end = p.ended_at;
  const startYear = start ? new Date(start).getFullYear() : null;
  const endYear = end ? new Date(end).getFullYear() : null;
  if (startYear && endYear) return `${startYear} – ${endYear}`;
  if (startYear) return `${startYear} – 진행 중`;
  return "기간 미정";
}

// ── presentation ───────────────────────────────────────────────

function PageHeader({ totalCount }: { totalCount: number }) {
  return (
    <div
      className="pt-[100px]"
      style={{
        background:
          "linear-gradient(160deg, #F8F8F6 0%, #F2F2EF 60%, #EDECEA 100%)",
      }}
    >
      <div className="mx-auto max-w-[1280px] px-6 pb-14 pt-14 lg:px-[60px]">
        <AnimateOnScroll>
          <p className="mb-4 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
            PROJECTS · 강화유니버스의 장기 프로젝트 {totalCount}개
          </p>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.08}>
          <h1
            className="mb-[18px] font-bold leading-[1.1] tracking-[-2px] text-v2-ink"
            style={{ fontSize: "clamp(36px, 5vw, 60px)" }}
          >
            여러 해에 걸쳐
            <br />
            <span style={{ color: "#6BAF8A" }}>이어지는 실험</span>들
          </h1>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.16}>
          <p className="max-w-[520px] text-[15px] font-light leading-[1.8] text-v2-ink3">
            한 번의 이벤트가 아니라, 챕터로 나누어 매년 돌아오는 환대의 여정.
            <br />
            관심 있는 프로젝트를 골라 카드로 들어가 보세요.
          </p>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

function ProjectsGroupedGrid({
  grouped,
  order,
  stats,
  episodesByProject,
  participantsByProject,
}: {
  grouped: Map<CategoryLabel, ProjectRow[]>;
  order: CategoryLabel[];
  stats: Map<string, StatRow>;
  episodesByProject: Map<string, { total: number; completed: number }>;
  participantsByProject: Map<string, Set<string>>;
}) {
  const allEmpty = order.every((l) => (grouped.get(l) ?? []).length === 0);

  return (
    <div className="bg-v2-paper py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
        {allEmpty ? (
          <div className="rounded-2xl border border-dashed border-v2-rule bg-white/60 px-8 py-16 text-center">
            <p className="mb-1 text-[13.5px] font-semibold text-v2-ink">
              아직 공개된 프로젝트가 없어요.
            </p>
            <p className="text-[12px] font-light leading-[1.7] text-v2-ink3">
              첫 프로젝트가 등록되면 여기에 카테고리별로 모입니다.
            </p>
          </div>
        ) : (
          order.map((label) => {
            const list = grouped.get(label) ?? [];
            if (list.length === 0) return null;
            return (
              <CategorySection
                key={label}
                label={label}
                list={list}
                stats={stats}
                episodesByProject={episodesByProject}
                participantsByProject={participantsByProject}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function CategorySection({
  label,
  list,
  stats,
  episodesByProject,
  participantsByProject,
}: {
  label: CategoryLabel;
  list: ProjectRow[];
  stats: Map<string, StatRow>;
  episodesByProject: Map<string, { total: number; completed: number }>;
  participantsByProject: Map<string, Set<string>>;
}) {
  const badge = CATEGORY_BADGE[label];
  return (
    <div className="mb-12 last:mb-0">
      <AnimateOnScroll>
        <div className="mb-5 flex items-end justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block rounded-full px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[1.5px]"
              style={{ background: badge.bg, color: badge.color }}
            >
              {label}
            </span>
            <span className="text-[12px] font-light text-[#AEAEB2]">
              {list.length}개 프로젝트
            </span>
          </div>
        </div>
      </AnimateOnScroll>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => {
          const s = stats.get(p.id) ?? {
            cards: 0,
            participants: 0,
            episodesTotal: 0,
            episodesCompleted: 0,
          };
          const ep = episodesByProject.get(p.id);
          const participantsCount = participantsByProject.get(p.id)?.size ?? 0;
          const progress = calculateProgress({
            progress_type: p.progress_type,
            progress_target:
              (p.progress_target as Record<string, unknown> | null) ?? {},
            completedEpisodes: ep?.completed ?? 0,
            totalEpisodes: ep?.total ?? 0,
            publicActivities: s.cards,
            distinctParticipants: participantsCount,
          });
          return (
            <AnimateOnScroll key={p.id} delay={(i + 1) * 0.06}>
              <ProjectListCard
                project={p}
                label={label}
                cards={s.cards}
                participants={participantsCount}
                progressLabel={progress.label}
              />
            </AnimateOnScroll>
          );
        })}
      </div>
    </div>
  );
}

function ProjectListCard({
  project,
  label,
  cards,
  participants,
  progressLabel,
}: {
  project: ProjectRow;
  label: CategoryLabel;
  cards: number;
  participants: number;
  progressLabel: string;
}) {
  const badge = CATEGORY_BADGE[label];
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex h-full flex-col rounded-[16px] border border-black/[0.06] bg-white p-6 transition-all duration-[220ms] hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(0,0,0,0.08)]"
    >
      <div className="mb-5 flex items-center justify-between">
        <span
          className="rounded-full px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[1.5px]"
          style={{ background: badge.bg, color: badge.color }}
        >
          {label}
        </span>
        <span className="text-[11px] font-light tracking-[0.5px] text-[#AEAEB2]">
          {periodLabel(project)}
        </span>
      </div>
      <h3
        className="mb-2.5 font-bold tracking-[-0.5px] text-v2-ink"
        style={{ fontSize: "clamp(20px, 2vw, 24px)" }}
      >
        {project.title}
      </h3>
      <p className="mb-7 line-clamp-3 flex-1 text-[13px] font-light leading-[1.75] text-v2-ink3">
        {project.summary || project.description || "프로젝트 소개 준비 중."}
      </p>
      <div className="flex items-center justify-between border-t border-[#F0F0EC] pt-4">
        <div className="flex gap-5">
          <Stat num={cards} label="카드" accent />
          <Stat num={participants} label="참여자" />
        </div>
        <span className="text-[11px] font-light text-[#AEAEB2]">
          {progressLabel}
        </span>
      </div>
    </Link>
  );
}

function Stat({
  num,
  label,
  accent,
}: {
  num: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={`text-[18px] font-bold leading-none tracking-[-0.5px] ${
          accent ? "text-[#6BAF8A]" : "text-v2-ink"
        }`}
      >
        {num}
      </span>
      <span className="text-[10.5px] font-light text-[#AEAEB2]">{label}</span>
    </div>
  );
}

function NoticeStrip() {
  return (
    <div
      className="flex items-center justify-center px-6 py-5 lg:px-[60px]"
      style={{ background: "#1A1A1A" }}
    >
      <p className="text-center text-[12px] leading-[1.7] tracking-[0.5px] text-white/50">
        <strong className="font-medium text-white/80">
          프로젝트는 한 번이 아니라 챕터로 이어집니다.
        </strong>
        &nbsp;각 프로젝트 카드를 눌러 전체 진행 흐름을 확인하세요.
      </p>
    </div>
  );
}
