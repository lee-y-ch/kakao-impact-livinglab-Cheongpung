import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityGrid } from "@/components/activities/ActivityGrid";
import type { ActivityCardData } from "@/components/activities/ActivityCard";
import { ProgressBar } from "@/components/projects/ProgressBar";
import {
  calculateProgress,
  type ProgressInputs,
} from "@/lib/progress/calculator";
import type { ProgressType } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

const STATUS_LABEL = {
  planned: "예정",
  in_progress: "진행 중",
  completed: "완료",
} as const;

const STATUS_STYLE = {
  planned: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-700",
} as const;

const ACTIVITY_LIMIT = 12;

/**
 * /projects/[slug] — 공개 프로젝트 상세.
 *
 * 구성:
 *   1) 프로젝트 타이틀 + 카테고리 + 설명
 *   2) ProgressBar (progress_type 기반)
 *   3) 에피소드 타임라인 (seq/session_date 순, status 배지)
 *   4) 공개 활동 카드 그리드
 *
 * admin client 로 RLS 우회 — 단, 렌더링 시 is_public/removed_at 을 직접 필터해
 * 공개 영역으로 노출. 비공개 프로젝트는 notFound.
 */
export default async function ProjectDetailPage({ params }: Params) {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select(
      `
      id, slug, title, summary, description, is_public,
      progress_type, progress_target,
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
    .order("seq", { ascending: true, nullsFirst: false })
    .order("session_date", { ascending: true, nullsFirst: false });

  const episodeList = episodes ?? [];
  const episodeIds = episodeList.map((e) => e.id as string);
  const completedEpisodes = episodeList.filter(
    (e) => e.status === "completed"
  ).length;

  // 프로젝트에 직접 연결됐거나 에피소드 경유로 연결된 공개 카드
  // (schema: activities 는 episode_id 또는 project_id 또는 shop_id 중 하나)
  const orFilter =
    episodeIds.length > 0
      ? `project_id.eq.${project.id},episode_id.in.(${episodeIds.join(",")})`
      : `project_id.eq.${project.id}`;

  const [publicCardsRes, publicCountRes, distinctParticipantsRes] =
    await Promise.all([
      admin
        .from("activities")
        .select(
          `
        id, type, body, title, photo_url, is_public, created_at,
        shop:shop_id (id, name),
        episode:episode_id (id, title),
        project:project_id (id, title, slug)
      `
        )
        .or(orFilter)
        .eq("is_public", true)
        .is("removed_at", null)
        .order("created_at", { ascending: false })
        .limit(ACTIVITY_LIMIT),
      admin
        .from("activities")
        .select("id", { count: "exact", head: true })
        .or(orFilter)
        .eq("is_public", true)
        .is("removed_at", null),
      admin
        .from("activities")
        .select("user_id")
        .or(orFilter)
        .eq("is_public", true)
        .is("removed_at", null),
    ]);

  const publicActivities = publicCountRes.count ?? 0;

  // 고유 참여자 수 — set 으로 중복 제거 (count distinct 는 supabase-js 에서
  // 직접 지원 안 해서 앱 레이어 집계. 카드 수 상한이 크지 않다고 가정).
  const distinctParticipants = new Set(
    (distinctParticipantsRes.data ?? [])
      .map((r) => r.user_id as string | null)
      .filter((v): v is string => Boolean(v))
  ).size;

  const progressInputs: ProgressInputs = {
    progress_type: project.progress_type as ProgressType,
    progress_target: (project.progress_target as Record<string, unknown>) ?? {},
    completedEpisodes,
    totalEpisodes: episodeList.length,
    publicActivities,
    distinctParticipants,
  };
  const progress = calculateProgress(progressInputs);

  const cards: ActivityCardData[] = (publicCardsRes.data ?? []).map((a) => ({
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

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground">
            프로젝트
          </Link>
          <span>·</span>
          {category ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
              {category.name}
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {project.title as string}
        </h1>
        {project.summary ? (
          <p className="text-base text-muted-foreground">
            {project.summary as string}
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-border bg-background p-5">
        <ProgressBar
          result={progress}
          title="진척도"
          subtitle={
            progress.note === "target_missing" ? "기준 미설정" : undefined
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <StatBox label="공개 카드" value={publicActivities} />
          <StatBox label="참여자" value={distinctParticipants} />
          <StatBox label="에피소드" value={episodeList.length} />
          <StatBox label="완료 회차" value={completedEpisodes} />
        </div>
      </section>

      {project.description ? (
        <section className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90">
          {project.description as string}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">에피소드 타임라인</h2>
        {episodeList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            아직 등록된 에피소드가 없어요.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {episodeList.map((ep) => {
              const status =
                (ep.status as "planned" | "in_progress" | "completed") ??
                "planned";
              return (
                <li
                  key={ep.id as string}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {ep.seq ? <span>{ep.seq}회차</span> : null}
                      {ep.session_date ? (
                        <span>{ep.session_date as string}</span>
                      ) : null}
                      {ep.location ? (
                        <span>· {ep.location as string}</span>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {ep.title as string}
                    </p>
                    {ep.summary ? (
                      <p className="text-xs text-muted-foreground">
                        {ep.summary as string}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium " +
                      STATUS_STYLE[status]
                    }
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">참여자 카드</h2>
          <span className="text-xs text-muted-foreground">
            공개 {publicActivities}장 중 최근 {cards.length}장
          </span>
        </div>
        <ActivityGrid
          cards={cards}
          interactive={false}
          empty={
            <p className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              아직 공개된 카드가 없어요. 현장에서 카드를 발급해보세요.
            </p>
          }
        />
      </section>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-lg font-semibold tabular-nums text-foreground">
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
