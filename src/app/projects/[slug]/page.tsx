import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { CountUp } from "@/components/v2/CountUp";
import { calculateProgress } from "@/lib/progress/calculator";
import type { ProgressType } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/projects/[slug]` 단일 프로젝트 상세.
 * 시안: design-v2-reference/강화유니버스_프로젝트.html.
 *
 * 공개 페이지 (auth 가드 없음). 프로젝트 단건 + 에피소드 타임라인 +
 * 진척바 (calculator 기반) + 해당 프로젝트의 공개 카드 그리드.
 */

type CategoryLabel = "라이프" | "네트워크" | "창작" | "테크";

const CATEGORY_BADGE: Record<
  CategoryLabel,
  { bg: string; color: string; upper: string }
> = {
  라이프: {
    bg: "rgba(180,110,40,0.1)",
    color: "#9B6020",
    upper: "COMMONS · 라이프",
  },
  네트워크: {
    bg: "rgba(107,175,138,0.12)",
    color: "#3A7A55",
    upper: "NETWORK · 네트워크",
  },
  창작: { bg: "rgba(49,130,246,0.1)", color: "#2060C8", upper: "WORLD · 창작" },
  테크: {
    bg: "rgba(130,90,180,0.1)",
    color: "#6040A0",
    upper: "POLICY · 테크",
  },
};

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  started_at: string | null;
  ended_at: string | null;
  cover_url: string | null;
  progress_type: ProgressType;
  progress_target: unknown;
  category: { slug: string | null; name: string | null } | null;
};

type EpisodeRow = {
  id: string;
  title: string;
  seq: number | null;
  summary: string | null;
  status: string;
  session_date: string | null;
  location: string | null;
};

type CardRow = {
  id: string;
  body: string | null;
  photo_url: string | null;
  created_at: string;
  episode: { location: string | null } | null;
  shop: { name: string | null } | null;
};

type EncouragementNote = {
  id: string;
  body: string | null;
  author_role: string;
  author_label: string | null;
  sent_at: string;
};

export default async function ProjectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  if (!params.slug || params.slug.length > 80) {
    notFound();
  }

  const admin = createAdminClient();

  const { data: projectData } = await admin
    .from("projects")
    .select(
      `id, slug, title, summary, description, started_at, ended_at, cover_url,
       progress_type, progress_target,
       category:categories ( slug, name )`
    )
    .eq("slug", params.slug)
    .eq("is_public", true)
    .maybeSingle();

  if (!projectData) {
    notFound();
  }

  const project = projectData as unknown as ProjectRow;

  const [episodesRes, cardsRes, statsActivitiesRes] = await Promise.all([
    admin
      .from("episodes")
      .select("id, title, seq, summary, status, session_date, location")
      .eq("project_id", project.id)
      .order("seq", { ascending: true, nullsFirst: false })
      .order("session_date", { ascending: true, nullsFirst: false }),
    admin
      .from("activities")
      .select(
        `id, body, photo_url, created_at,
         episode:episodes ( location ),
         shop:shops ( name )`
      )
      .eq("project_id", project.id)
      .eq("is_public", true)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    // 진척 계산용 — 프로젝트의 모든 공개 활동 + 참여자
    admin
      .from("activities")
      .select("id, user_id, episode_id")
      .eq("is_public", true)
      .is("removed_at", null)
      .or(
        `project_id.eq.${project.id}` +
          // episode 를 통해 연결된 카드도 포함하려면 별도 쿼리. 일단 직결만.
          ""
      ),
  ]);

  const episodes = (episodesRes.data ?? []) as unknown as EpisodeRow[];
  const directCards = (cardsRes.data ?? []) as unknown as CardRow[];
  const directActivities = (statsActivitiesRes.data ?? []) as unknown as {
    id: string;
    user_id: string;
    episode_id: string | null;
  }[];

  // 에피소드를 통한 카드도 포함시켜 정확히 집계
  let allCardsForStats = directActivities;
  if (episodes.length > 0) {
    const episodeIds = episodes.map((ep) => ep.id);
    const { data: extra } = await admin
      .from("activities")
      .select("id, user_id, episode_id")
      .in("episode_id", episodeIds)
      .eq("is_public", true)
      .is("removed_at", null);
    if (extra) {
      const seen = new Set(directActivities.map((a) => a.id));
      for (const e of extra as unknown as {
        id: string;
        user_id: string;
        episode_id: string | null;
      }[]) {
        if (!seen.has(e.id)) allCardsForStats = [...allCardsForStats, e];
      }
    }
  }

  const cardCount = allCardsForStats.length;
  const participantSet = new Set(allCardsForStats.map((a) => a.user_id));
  const participantCount = participantSet.size;
  const completedEpisodes = episodes.filter(
    (e) => e.status === "completed"
  ).length;
  const inProgressEpisode =
    episodes.find((e) => e.status === "in_progress") ?? null;

  // 이 프로젝트 카드들에 달린 모든 reaction — letter / note / hi_five 집계.
  // 청풍 피드백: 크루가 노트 보내면 프로젝트 진행 화면에서도 보이게.
  let lettersCount = 0;
  let hiFiveCount = 0;
  let recentNotes: EncouragementNote[] = [];
  if (allCardsForStats.length > 0) {
    const ids = allCardsForStats.map((a) => a.id);
    const { data: reactionRows } = await admin
      .from("reactions")
      .select("id, kind, body, author_role, author_label, sent_at")
      .in("activity_id", ids)
      .order("sent_at", { ascending: false });

    type ReactionRow = {
      id: string;
      kind: string;
      body: string | null;
      author_role: string;
      author_label: string | null;
      sent_at: string;
    };

    const allReactions = (reactionRows ?? []) as ReactionRow[];
    for (const r of allReactions) {
      if (r.kind === "letter" && r.author_role === "owner") lettersCount += 1;
      else if (r.kind === "hi_five") hiFiveCount += 1;
    }

    // 받은 격려 섹션 — 크루/관리자 노트 + 사장님 편지(짧은 미리보기) 최근 6건.
    // 카드 작성자 외 응원 행위만 노출 (참여자 본인 reaction 은 미지원).
    recentNotes = allReactions
      .filter(
        (r) =>
          (r.kind === "note" || r.kind === "letter") &&
          (r.body?.trim().length ?? 0) > 0
      )
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        body: r.body,
        author_role: r.author_role,
        author_label: r.author_label,
        sent_at: r.sent_at,
      }));
  }

  const progress = calculateProgress({
    progress_type: project.progress_type,
    progress_target:
      (project.progress_target as Record<string, unknown> | null) ?? {},
    completedEpisodes,
    totalEpisodes: episodes.length,
    publicActivities: cardCount,
    distinctParticipants: participantCount,
  });

  const categoryLabel = labelFromSlug(project.category?.slug);
  const categoryStyle = categoryLabel
    ? CATEGORY_BADGE[categoryLabel]
    : { bg: "#EDECEA", color: "#666", upper: "—" };

  // 진행 일수 (started_at 부터 오늘 또는 ended_at)
  const runningDays = computeRunningDays(project.started_at, project.ended_at);

  return (
    <>
      <Breadcrumb categoryLabel={categoryLabel} title={project.title} />
      <ProjectHero
        project={project}
        categoryLabel={categoryLabel}
        categoryStyle={categoryStyle}
        cardCount={cardCount}
        lettersCount={lettersCount}
        participantCount={participantCount}
        runningDays={runningDays}
      />
      <Divider />
      <ChapterTimeline
        episodes={episodes}
        progressLabel={progress.label}
        progressPct={progress.percent}
      />
      {inProgressEpisode ? (
        <ActiveChapter
          project={project}
          episode={inProgressEpisode}
          cardCount={cardCount}
          lettersCount={lettersCount}
          participantCount={participantCount}
          runningDays={runningDays}
        />
      ) : null}
      <EncouragementSection notes={recentNotes} hiFiveCount={hiFiveCount} />
      <ProjectCards
        cards={directCards}
        categoryLabel={categoryLabel}
        categoryStyle={categoryStyle}
      />
      <NoticeStrip />
    </>
  );
}

// ── helpers ────────────────────────────────────────────────────

function labelFromSlug(slug: string | null | undefined): CategoryLabel | null {
  if (!slug) return null;
  if (slug === "active_life") return "라이프";
  if (slug === "network") return "네트워크";
  if (slug === "local_culture") return "창작";
  if (slug === "tech") return "테크";
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

function computeRunningDays(start: string | null, end: string | null): number {
  if (!start) return 0;
  const startMs = new Date(start).getTime();
  if (Number.isNaN(startMs)) return 0;
  const endMs = end ? new Date(end).getTime() : Date.now();
  if (Number.isNaN(endMs)) return 0;
  return Math.max(0, Math.floor((endMs - startMs) / (24 * 60 * 60 * 1000)));
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function cardNo(id: string): string {
  return `No.${id.slice(0, 4).toUpperCase()}`;
}

function episodeChapterLabel(ep: EpisodeRow): string {
  if (ep.seq != null) return `CH.${String(ep.seq).padStart(2, "0")}`;
  return ep.title.slice(0, 12);
}

function episodeYear(ep: EpisodeRow): string {
  if (!ep.session_date) return "";
  const d = new Date(ep.session_date);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getFullYear());
}

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  in_progress: { label: "● 진행 중", color: "#6BAF8A" },
  planned: { label: "예정", color: "#C4956A" },
  completed: { label: "완료", color: "#AEAEB2" },
};

// ── presentation ───────────────────────────────────────────────

function Breadcrumb({
  categoryLabel,
  title,
}: {
  categoryLabel: CategoryLabel | null;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-[112px] lg:px-[60px]">
      <AnimateOnScroll>
        <div className="flex items-center gap-2 text-[12px] text-[#AEAEB2]">
          <Link
            href="/projects"
            className="transition-colors hover:text-v2-ink"
          >
            ← 프로젝트 전체
          </Link>
          <span className="text-[#D0D0D0]">/</span>
          <span>{categoryLabel ?? "—"}</span>
          <span className="text-[#D0D0D0]">/</span>
          <span className="font-medium text-v2-ink3">{title}</span>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

function ProjectHero({
  project,
  categoryLabel,
  categoryStyle,
  cardCount,
  lettersCount,
  participantCount,
  runningDays,
}: {
  project: ProjectRow;
  categoryLabel: CategoryLabel | null;
  categoryStyle: { bg: string; color: string; upper: string };
  cardCount: number;
  lettersCount: number;
  participantCount: number;
  runningDays: number;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-7 lg:px-[60px]">
      <div className="grid items-end gap-9 lg:grid-cols-[1fr_420px] lg:gap-[60px]">
        <div>
          <AnimateOnScroll>
            <span
              className="mb-[18px] inline-block rounded-full px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[2px]"
              style={{
                background: categoryStyle.bg,
                color: categoryStyle.color,
              }}
            >
              {categoryStyle.upper}
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.08}>
            <p className="mb-2.5 text-[11px] tracking-[1px] text-[#AEAEB2]">
              {periodLabel(project)}
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.16}>
            <h1
              className="mb-5 font-bold leading-[1.1] tracking-[-2px] text-v2-ink"
              style={{ fontSize: "clamp(36px, 4.5vw, 58px)" }}
            >
              {project.title}
            </h1>
          </AnimateOnScroll>
          {project.summary || project.description ? (
            <AnimateOnScroll delay={0.24}>
              <p className="mb-8 max-w-[480px] whitespace-pre-line text-[14.5px] font-light leading-[1.85] text-v2-ink3">
                {project.summary || project.description}
              </p>
            </AnimateOnScroll>
          ) : null}
          <AnimateOnScroll delay={0.32}>
            <div className="flex flex-wrap gap-8">
              <HeroStat num={cardCount} label="공개 카드" accent />
              <HeroStat num={lettersCount} label="편지" />
              <HeroStat num={participantCount} label="참여자" />
              <HeroStat num={runningDays} label="진행 일수" />
            </div>
          </AnimateOnScroll>
        </div>
        <AnimateOnScroll delay={0.24}>
          <div className="lg:max-w-[420px]">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#EDECEA]">
              <div
                className="h-full w-full transition-transform duration-[500ms] group-hover:scale-[1.03]"
                style={{
                  background: project.cover_url
                    ? `url(${project.cover_url}) center/cover`
                    : "linear-gradient(135deg, #C4D4E8 0%, #88AADD 50%, #6BAF8A 100%)",
                }}
              />
              {categoryLabel ? (
                <div
                  className="absolute bottom-5 left-5 rounded-md border border-white/40 px-3 py-1.5 text-[10px] font-medium tracking-[1.5px] text-v2-ink"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {categoryLabel.toUpperCase()} · 강화유니버스
                </div>
              ) : null}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

function HeroStat({
  num,
  label,
  accent,
}: {
  num: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={`mb-1 text-[28px] font-bold leading-none tracking-[-1px] ${
          accent ? "text-[#6BAF8A]" : "text-v2-ink"
        }`}
      >
        <CountUp target={num} />
      </p>
      <p className="text-[11px] font-light tracking-[0.5px] text-[#AEAEB2]">
        {label}
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
      <div className="mt-12 border-t border-v2-rule" />
    </div>
  );
}

function ChapterTimeline({
  episodes,
  progressLabel,
  progressPct,
}: {
  episodes: EpisodeRow[];
  progressLabel: string;
  progressPct: number;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-14 lg:px-[60px]">
      <AnimateOnScroll>
        <p className="mb-7 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
          CHAPTERS · 전체 진행 흐름
        </p>
      </AnimateOnScroll>
      <AnimateOnScroll delay={0.08}>
        <div className="mb-5 flex items-center gap-3">
          <span className="whitespace-nowrap text-[12px] text-[#AEAEB2]">
            <strong className="font-semibold text-v2-ink">
              {progressLabel}
            </strong>
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-v2-rule">
            <div
              className="h-full rounded-full transition-[width] duration-[1200ms] ease-out"
              style={{ width: `${progressPct}%`, background: "#6BAF8A" }}
            />
          </div>
        </div>
      </AnimateOnScroll>
      {episodes.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-v2-rule bg-white/60 px-6 py-10 text-center">
          <p className="mb-1 text-[13px] font-semibold text-v2-ink">
            아직 등록된 챕터가 없어요.
          </p>
          <p className="text-[13px] font-light text-[#AEAEB2]">
            첫 챕터가 만들어지면 여기에 타임라인으로 보여드릴게요.
          </p>
        </div>
      ) : (
        <AnimateOnScroll delay={0.16}>
          <div className="overflow-x-auto pb-3">
            <div className="flex min-w-max gap-2.5 pt-1">
              {episodes.map((ep) => (
                <ChapterCardView key={ep.id} episode={ep} />
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      )}
    </div>
  );
}

function ChapterCardView({ episode }: { episode: EpisodeRow }) {
  const status = STATUS_DISPLAY[episode.status] ?? {
    label: episode.status,
    color: "#888",
  };
  const isActive = episode.status === "in_progress";
  const isDone = episode.status === "completed";
  return (
    <div
      className={`relative w-[200px] flex-shrink-0 rounded-[14px] border-[1.5px] p-5 pt-5 transition-all duration-[200ms] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] ${
        isActive
          ? "border-[#6BAF8A] bg-[#F4FAF7] shadow-[0_6px_20px_rgba(107,175,138,0.15)]"
          : isDone
            ? "border-v2-rule bg-[#FAFAF8]"
            : "border-v2-rule bg-white"
      }`}
    >
      <p
        className="mb-2.5 text-[9px] font-semibold uppercase tracking-[1.5px]"
        style={{ color: status.color }}
      >
        {status.label}
      </p>
      <p className="mb-1 text-[10px] tracking-[1px] text-[#AEAEB2]">
        {episodeChapterLabel(episode)}
      </p>
      <p className="mb-2 text-[10px] text-[#AEAEB2]">{episodeYear(episode)}</p>
      <p className="mb-3.5 line-clamp-2 text-[14px] font-semibold leading-[1.3] tracking-[-0.3px] text-v2-ink">
        {episode.title}
      </p>
      {episode.location ? (
        <p className="text-[10.5px] font-light text-[#AEAEB2]">
          📍 {episode.location}
        </p>
      ) : episode.session_date ? (
        <p className="text-[10.5px] font-light text-[#AEAEB2]">
          {shortDate(episode.session_date)}
        </p>
      ) : null}
    </div>
  );
}

function ActiveChapter({
  project,
  episode,
  cardCount,
  lettersCount,
  participantCount,
  runningDays,
}: {
  project: ProjectRow;
  episode: EpisodeRow;
  cardCount: number;
  lettersCount: number;
  participantCount: number;
  runningDays: number;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-12 lg:px-[60px]">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <AnimateOnScroll>
            <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[2px] text-[#6BAF8A]">
              <span
                className="h-[7px] w-[7px] animate-pulse rounded-full"
                style={{ background: "#6BAF8A" }}
              />
              {episodeChapterLabel(episode)} · {episode.title}
            </p>
          </AnimateOnScroll>
          {episode.summary ? (
            <AnimateOnScroll delay={0.16}>
              <p className="mb-7 max-w-[500px] whitespace-pre-line text-[15px] leading-[1.9] text-[#4A4A4A]">
                {episode.summary}
              </p>
            </AnimateOnScroll>
          ) : (
            <AnimateOnScroll delay={0.16}>
              <p className="mb-7 max-w-[500px] text-[15px] leading-[1.9] text-[#4A4A4A]">
                {project.title}의 진행 챕터예요. 크루가 진행 메모를 올리면
                여기에 함께 보여드릴게요.
              </p>
            </AnimateOnScroll>
          )}
          <AnimateOnScroll delay={0.24}>
            <div className="flex flex-wrap gap-3">
              <ActiveStat num={cardCount} label="카드" />
              <ActiveStat num={lettersCount} label="편지" />
              <ActiveStat num={participantCount} label="참여자" />
              <ActiveStat num={runningDays} label="진행 일수" />
            </div>
          </AnimateOnScroll>
        </div>

        <AnimateOnScroll delay={0.16}>
          <div>
            <p className="mb-3.5 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
              CHAPTER INFO — 이 챕터의 정보
            </p>
            <div className="rounded-xl border border-v2-rule bg-white px-5 py-4 text-[12.5px] leading-[1.7] text-v2-ink3">
              {episode.session_date ? (
                <p>
                  <strong className="text-v2-ink">날짜</strong>{" "}
                  {shortDate(episode.session_date)}
                </p>
              ) : null}
              {episode.location ? (
                <p className="mt-1">
                  <strong className="text-v2-ink">장소</strong>{" "}
                  {episode.location}
                </p>
              ) : null}
              {!episode.session_date && !episode.location ? (
                <p className="text-[12px] text-[#AEAEB2]">
                  아직 일정·장소가 정해지지 않았어요.
                </p>
              ) : null}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

function ActiveStat({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex min-w-[80px] flex-col items-center rounded-xl border border-v2-rule bg-[#F5F4F1] px-5 py-4">
      <p className="mb-1.5 text-[26px] font-bold leading-none tracking-[-1px] text-v2-ink">
        {num}
      </p>
      <p className="text-[11.5px] font-medium text-[#888]">{label}</p>
    </div>
  );
}

function EncouragementSection({
  notes,
  hiFiveCount,
}: {
  notes: EncouragementNote[];
  hiFiveCount: number;
}) {
  if (notes.length === 0 && hiFiveCount === 0) return null;

  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-14 lg:px-[60px]">
      <AnimateOnScroll>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
              ENCOURAGEMENT · 받은 격려
            </p>
            <h2
              className="font-bold tracking-[-0.8px] text-v2-ink"
              style={{ fontSize: "clamp(20px, 2.5vw, 28px)" }}
            >
              크루·사장님이 남긴 응원
            </h2>
          </div>
          {hiFiveCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-v2-rule bg-white px-4 py-1.5 text-[12.5px] font-medium text-v2-ink">
              <span className="text-[#C4956A]">★</span>
              하이파이브 {hiFiveCount}
            </span>
          ) : null}
        </div>
      </AnimateOnScroll>

      {notes.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-v2-rule bg-white/60 px-6 py-8 text-center">
          <p className="text-[12.5px] font-light text-v2-ink3">
            아직 글로 남긴 응원은 없어요. 하이파이브 {hiFiveCount}개가
            도착했어요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n, i) => (
            <AnimateOnScroll key={n.id} delay={(i + 1) * 0.06}>
              <EncouragementCard note={n} />
            </AnimateOnScroll>
          ))}
        </div>
      )}
    </div>
  );
}

function EncouragementCard({ note }: { note: EncouragementNote }) {
  const roleBadge = roleBadgeFor(note.author_role);
  return (
    <div className="flex h-full flex-col rounded-[14px] border border-v2-rule bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold tracking-[0.5px]"
          style={{ background: roleBadge.bg, color: roleBadge.color }}
        >
          {roleBadge.label}
        </span>
        <span className="text-[10.5px] font-light text-[#AEAEB2]">
          {shortDate(note.sent_at)}
        </span>
      </div>
      <p className="mb-3 line-clamp-4 text-[13.5px] leading-[1.7] text-v2-ink">
        {note.body}
      </p>
      <p className="mt-auto text-[11px] font-light text-[#AEAEB2]">
        — {note.author_label ?? roleBadge.label}
      </p>
    </div>
  );
}

function roleBadgeFor(role: string): {
  label: string;
  bg: string;
  color: string;
} {
  if (role === "owner")
    return {
      label: "사장님 편지",
      bg: "rgba(196,149,106,0.14)",
      color: "#9B6020",
    };
  if (role === "crew")
    return {
      label: "크루 노트",
      bg: "rgba(107,175,138,0.14)",
      color: "#3A7A55",
    };
  if (role === "admin")
    return { label: "청풍 노트", bg: "rgba(49,130,246,0.1)", color: "#2060C8" };
  return { label: "응원", bg: "#EDECEA", color: "#666" };
}

function ProjectCards({
  cards,
  categoryLabel,
  categoryStyle,
}: {
  cards: CardRow[];
  categoryLabel: CategoryLabel | null;
  categoryStyle: { bg: string; color: string; upper: string };
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-14 lg:px-[60px]">
      <AnimateOnScroll>
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
              이 프로젝트의 카드들
            </p>
            <h2
              className="font-bold tracking-[-0.8px] text-v2-ink"
              style={{ fontSize: "clamp(20px, 2.5vw, 28px)" }}
            >
              공개로 모인 순간들
            </h2>
          </div>
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6BAF8A] transition-all hover:gap-2.5"
          >
            전체 피드 보기 →
          </Link>
        </div>
      </AnimateOnScroll>
      {cards.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-v2-rule bg-white/60 px-6 py-12 text-center">
          <p className="mb-1 text-[13px] font-semibold text-v2-ink">
            아직 공개된 카드가 없어요.
          </p>
          <p className="text-[11.5px] font-light text-[#AEAEB2]">
            첫 공개 카드가 도착하면 여기에서 바로 볼 수 있어요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <AnimateOnScroll key={c.id} delay={(i + 1) * 0.08}>
              <ProjectCardView
                card={c}
                categoryLabel={categoryLabel}
                categoryStyle={categoryStyle}
              />
            </AnimateOnScroll>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCardView({
  card,
  categoryLabel,
  categoryStyle,
}: {
  card: CardRow;
  categoryLabel: CategoryLabel | null;
  categoryStyle: { bg: string; color: string; upper: string };
}) {
  const place = card.shop?.name
    ? `@ ${card.shop.name}`
    : card.episode?.location
      ? `@ ${card.episode.location}`
      : "";
  return (
    <div className="overflow-hidden rounded-[14px] border border-black/[0.06] bg-white transition-all duration-[220ms] hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(0,0,0,0.09)]">
      <div className="flex items-center justify-between border-b border-[#F4F4F2] px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
          {cardNo(card.id)}
        </span>
        {categoryLabel ? (
          <span
            className="rounded px-2 py-[3px] text-[9.5px] font-semibold tracking-[0.5px]"
            style={{ background: categoryStyle.bg, color: categoryStyle.color }}
          >
            {categoryLabel}
          </span>
        ) : null}
      </div>
      {card.photo_url ? (
        <div className="relative h-[142px] w-full overflow-hidden border-b border-[#F4F4F2] bg-[#F5F4F1]">
          <Image
            src={card.photo_url}
            alt={card.body || place || "프로젝트 공개 카드 사진"}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 260px"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="px-3.5 pb-3 pt-3.5">
        <p className="mb-3 line-clamp-3 text-[14px] leading-[1.7] text-v2-ink">
          {card.body || "(메모 없음)"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-light text-[#AEAEB2]">
            {place}
          </span>
          <span className="text-[10.5px] font-light text-[#AEAEB2]">
            {shortDate(card.created_at)}
          </span>
        </div>
      </div>
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
          챕터를 클릭하면 해당 시기로 이동해요.
        </strong>
        &nbsp;진행 중인 에피소드는 크루가 실시간으로 업데이트해요.
      </p>
    </div>
  );
}
