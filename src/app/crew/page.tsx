import Link from "next/link";
import { redirect } from "next/navigation";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { ArrivalReactionActions } from "./ArrivalReactionActions";
import { EpisodeStatusActions } from "./EpisodeStatusActions";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/crew` 크루 워크스페이스.
 * 시안: design-v2-reference/강화유니버스_크루.html.
 *
 * 시안 markup·디자인 토큰 유지하며 데이터를 service role 로 집계.
 * 크루는 RLS 대상이 아니므로 createAdminClient() 로 진행 중 에피소드와
 * 최근 활동을 가져오고, 상태 변경·응원은 살아있는 API 라우트로 위임한다.
 */

const ARRIVAL_LIMIT = 8;
const EPISODE_LIMIT = 6;

type CategoryLabel = "라이프" | "네트워크" | "창작" | "테크";

const SLUG_TO_LABEL: Record<string, CategoryLabel> = {
  active_life: "라이프",
  network: "네트워크",
  local_culture: "창작",
  tech: "테크",
};

type EpisodeStatus = "planned" | "in_progress" | "completed";

type EpisodeRow = {
  id: string;
  title: string;
  seq: number | null;
  status: EpisodeStatus;
  session_date: string | null;
  location: string | null;
  project: {
    id: string | null;
    title: string | null;
    slug: string | null;
  } | null;
};

type ArrivalRow = {
  id: string;
  body: string | null;
  is_public: boolean;
  created_at: string;
  episode: {
    id: string | null;
    title: string | null;
    location: string | null;
    project: {
      title: string | null;
      category: { slug: string | null } | null;
    } | null;
  } | null;
  project: {
    title: string | null;
    category: { slug: string | null } | null;
  } | null;
  shop: { id: string | null; name: string | null } | null;
};

export default async function CrewPage() {
  const actor = await getCurrentActor();
  if (actor.role !== "crew") {
    redirect("/crew/login");
  }

  const admin = createAdminClient();

  const todayDateOnly = todayIsoDate();
  const startOfDayIso = startOfTodayIso();

  const [
    episodesRes,
    arrivalsRes,
    episodesTodayRes,
    inProgressRes,
    cardsTodayRes,
    archivesTodayRes,
  ] = await Promise.all([
    admin
      .from("episodes")
      .select(
        `id, title, seq, status, session_date, location,
         project:projects ( id, title, slug )`
      )
      .in("status", ["planned", "in_progress"])
      .order("session_date", { ascending: true, nullsFirst: false })
      .limit(EPISODE_LIMIT),
    admin
      .from("activities")
      .select(
        `
        id, body, is_public, created_at,
        episode:episodes (
          id, title, location,
          project:projects ( title, category:categories ( slug ) )
        ),
        project:projects (
          title, category:categories ( slug )
        ),
        shop:shops ( id, name )
      `
      )
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(ARRIVAL_LIMIT),
    admin
      .from("episodes")
      .select("id", { count: "exact", head: true })
      .eq("session_date", todayDateOnly),
    admin
      .from("episodes")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDayIso)
      .is("removed_at", null),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDayIso)
      .in("type", ["archive_link", "artifact"])
      .is("removed_at", null),
  ]);

  const episodes = (episodesRes.data ?? []) as unknown as EpisodeRow[];
  const arrivals = (arrivalsRes.data ?? []) as unknown as ArrivalRow[];

  const summary = [
    {
      num: episodesTodayRes.count ?? 0,
      label: "오늘 에피소드",
      accent: true,
    },
    { num: inProgressRes.count ?? 0, label: "진행 중" },
    { num: cardsTodayRes.count ?? 0, label: "오늘 카드" },
    { num: archivesTodayRes.count ?? 0, label: "오늘 아카이브" },
  ];

  return (
    <>
      <PageHeader />
      <SummaryStrip summary={summary} />
      <CrewLayout episodes={episodes} arrivals={arrivals} />
      <CrewFooterStrip />
    </>
  );
}

// ── helpers ────────────────────────────────────────────────────

function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatHeaderDate(): string {
  const d = new Date();
  const yyyymm = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const week = isoWeekNumber(d);
  return `${yyyymm} ${weekday} · ${week}주차`;
}

function isoWeekNumber(date: Date): number {
  const tmp = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function categoryLabelOf(
  slug: string | null | undefined
): CategoryLabel | null {
  if (!slug) return null;
  return SLUG_TO_LABEL[slug] ?? null;
}

function episodeTitleOf(ep: EpisodeRow): string {
  const projectTitle = ep.project?.title ?? "";
  const seqBit = ep.seq != null ? ` ${ep.seq}회차` : "";
  if (projectTitle) return `${projectTitle}${seqBit}`.trim();
  return ep.title;
}

function episodePeriodOf(ep: EpisodeRow): string {
  return ep.session_date ? formatShortDate(ep.session_date) : "일정 미정";
}

function arrivalNo(id: string): string {
  return `No.${id.slice(0, 4).toUpperCase()}`;
}

function arrivalMeta(row: ArrivalRow): string {
  const place =
    row.shop?.name ?? row.episode?.location ?? row.episode?.title ?? null;
  const categoryLabel = categoryLabelOf(
    row.episode?.project?.category?.slug ?? row.project?.category?.slug
  );
  const placePart = place ? `@ ${place}` : "";
  if (placePart && categoryLabel) return `${placePart} · ${categoryLabel}`;
  if (placePart) return placePart;
  if (categoryLabel) return categoryLabel;
  return "강화 어딘가";
}

const STATUS_BADGE: Record<EpisodeStatus, { label: string; cls: string }> = {
  in_progress: {
    label: "● 진행",
    cls: "bg-[rgba(107,175,138,0.12)] text-[#3A7A55]",
  },
  planned: {
    label: "예정",
    cls: "bg-black/[0.05] text-[#888]",
  },
  completed: {
    label: "완료",
    cls: "bg-[#EDECEA] text-[#888]",
  },
};

// ── presentation ───────────────────────────────────────────────

function PageHeader() {
  return (
    <div
      className="px-6 pb-10 pt-[112px] lg:px-[60px]"
      style={{ background: "#1A1A1A" }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
        <AnimateOnScroll>
          <div>
            <p className="mb-2.5 text-[11px] tracking-[1.5px] text-white/35">
              {formatHeaderDate()}
            </p>
            <h1
              className="mb-1.5 font-bold leading-[1.15] tracking-[-1.2px] text-white"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
            >
              오늘도 강화도를
              <br />
              이어 주세요
            </h1>
            <p className="text-[13px] font-light text-white/40">
              크루 워크스페이스 · 에피소드 상태 업데이트와 응원을 남겨주세요
            </p>
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.08}>
          <div className="flex flex-shrink-0 gap-2">
            <Link
              href="/impact"
              className="rounded-[10px] bg-white px-5 py-2.5 text-[12.5px] font-medium text-v2-ink transition-opacity hover:opacity-85"
            >
              임팩트 보기
            </Link>
            <Link
              href="/projects"
              className="rounded-[10px] bg-[#6BAF8A] px-5 py-2.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-85"
            >
              프로젝트 둘러보기
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

function SummaryStrip({
  summary,
}: {
  summary: { num: number; label: string; accent?: boolean }[];
}) {
  return (
    <div className="border-b border-v2-rule" style={{ background: "#F5F4F1" }}>
      <div className="mx-auto flex max-w-[1280px] px-6 lg:px-[60px]">
        {summary.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-1 flex-col items-center justify-center gap-1 px-5 py-[18px] lg:px-9 ${i < summary.length - 1 ? "border-r border-v2-rule" : ""}`}
          >
            <p
              className={`text-[24px] font-bold leading-none tracking-[-0.8px] ${s.accent ? "text-[#6BAF8A]" : "text-v2-ink"}`}
            >
              {s.num}
            </p>
            <p className="text-[11.5px] font-medium text-[#888]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrewLayout({
  episodes,
  arrivals,
}: {
  episodes: EpisodeRow[];
  arrivals: ArrivalRow[];
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-10 lg:px-[60px]">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_340px]">
        <Episodes episodes={episodes} />
        <Arrivals arrivals={arrivals} />
      </div>
    </div>
  );
}

function Episodes({ episodes }: { episodes: EpisodeRow[] }) {
  return (
    <div>
      <AnimateOnScroll>
        <div className="mb-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
            진행 중 에피소드
          </p>
          <h2 className="text-[18px] font-bold leading-[1.4] tracking-[-0.5px]">
            크루가 상태를 올려주면
            <br />
            임팩트 페이지에 즉시 반영돼요
          </h2>
        </div>
      </AnimateOnScroll>

      {episodes.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-v2-rule bg-white/50 px-6 py-12 text-center">
          <p className="mb-1 text-[13px] font-semibold text-v2-ink">
            진행 중·예정 에피소드가 없어요.
          </p>
          <p className="text-[11.5px] font-light text-[#AEAEB2]">
            관리자가 새 에피소드를 만들면 여기 자동으로 모입니다.
          </p>
        </div>
      ) : (
        episodes.map((e, i) => (
          <AnimateOnScroll key={e.id} delay={(i + 1) * 0.08}>
            <EpisodeCard episode={e} />
          </AnimateOnScroll>
        ))
      )}
    </div>
  );
}

function EpisodeCard({ episode }: { episode: EpisodeRow }) {
  const badge = STATUS_BADGE[episode.status];

  return (
    <div className="mb-2.5 rounded-[14px] border border-v2-rule bg-white px-6 py-[22px] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-[3px] text-[10px] font-semibold tracking-[1.5px] ${badge.cls}`}
            >
              {badge.label}
            </span>
            <span className="text-[11px] font-light text-[#AEAEB2]">
              {episodePeriodOf(episode)}
            </span>
          </div>
          <p className="mb-1 text-[16px] font-semibold tracking-[-0.3px]">
            {episodeTitleOf(episode)}
          </p>
          {episode.location ? (
            <p className="text-[12px] font-light text-[#AEAEB2]">
              📍 {episode.location}
            </p>
          ) : null}
        </div>
        {episode.project?.slug ? (
          <Link
            href={`/projects/${episode.project.slug}`}
            className="flex-shrink-0 text-[11px] text-[#6BAF8A] hover:underline"
          >
            프로젝트 →
          </Link>
        ) : null}
      </div>

      <EpisodeStatusActions episodeId={episode.id} current={episode.status} />
    </div>
  );
}

function Arrivals({ arrivals }: { arrivals: ArrivalRow[] }) {
  return (
    <div>
      <AnimateOnScroll>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
          최근 도착한 카드
        </p>
        <h2 className="mb-4 text-[18px] font-bold tracking-[-0.5px]">
          참여자가 남긴 기록
        </h2>
      </AnimateOnScroll>

      {arrivals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-v2-rule bg-white/50 px-5 py-10 text-center">
          <p className="mb-1 text-[12.5px] font-semibold text-v2-ink">
            아직 도착한 카드가 없어요.
          </p>
          <p className="text-[11px] font-light text-[#AEAEB2]">
            QR 스캔이 시작되면 여기 모입니다.
          </p>
        </div>
      ) : (
        arrivals.map((a, i) => (
          <AnimateOnScroll key={a.id} delay={(i + 1) * 0.06}>
            <ArrivalCard arrival={a} />
          </AnimateOnScroll>
        ))
      )}
    </div>
  );
}

function ArrivalCard({ arrival }: { arrival: ArrivalRow }) {
  return (
    <div className="mb-2 rounded-xl border border-v2-rule bg-white px-[18px] py-4 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
          {arrivalNo(arrival.id)} · {formatShortDate(arrival.created_at)}
        </span>
        {arrival.is_public ? (
          <span
            className="rounded border px-[7px] py-[2px] text-[9px] font-semibold tracking-[1px]"
            style={{
              color: "#6BAF8A",
              borderColor: "rgba(107,175,138,0.3)",
            }}
          >
            공개
          </span>
        ) : (
          <span className="rounded border border-v2-rule px-[7px] py-[2px] text-[9px] text-[#AEAEB2]">
            비공개
          </span>
        )}
      </div>
      <p className="mb-2.5 line-clamp-2 text-[12.5px] leading-[1.65] text-v2-ink">
        {arrival.body || "(메모 없음)"}
      </p>
      <p className="mb-2.5 text-[10.5px] text-[#AEAEB2]">
        {arrivalMeta(arrival)}
      </p>
      <ArrivalReactionActions activityId={arrival.id} />
    </div>
  );
}

function CrewFooterStrip() {
  return (
    <div
      className="flex items-center justify-between px-6 py-5 lg:px-[60px]"
      style={{ background: "#1A1A1A" }}
    >
      <span className="text-[11.5px] text-white/30">
        크루 워크스페이스 · 청풍 공용 계정
      </span>
      <span className="text-[11.5px] text-white/20">
        © 2026 Ganghwa Universe
      </span>
    </div>
  );
}
