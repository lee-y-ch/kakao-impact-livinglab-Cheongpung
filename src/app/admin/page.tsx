import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminReviewActions } from "./AdminReviewActions";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/admin` 운영 홈.
 * 시안: design-v2-reference/강화유니버스_관리자.html.
 *
 * sidebar + topbar 셸은 src/components/admin/AdminShell.tsx 로 분리됨.
 * /admin/projects, /admin/shops 등 서브페이지도 같은 셸을 공유한다.
 */

const REVIEW_QUEUE_LIMIT = 6;
const EPISODE_PANEL_LIMIT = 5;

type CategoryLabel = "라이프" | "네트워크" | "창작" | "테크";

const SLUG_TO_LABEL: Record<string, CategoryLabel> = {
  active_life: "라이프",
  network: "네트워크",
  local_culture: "창작",
  tech: "테크",
};

const BADGE_CLASS: Record<CategoryLabel, string> = {
  라이프: "bg-[rgba(180,110,40,0.1)] text-[#9B6020]",
  네트워크: "bg-[rgba(107,175,138,0.12)] text-[#3A7A55]",
  창작: "bg-[rgba(49,130,246,0.1)] text-[#2060C8]",
  테크: "bg-[rgba(160,128,204,0.14)] text-[#5A3A88]",
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  in_progress: { label: "● 진행", cls: "text-[#3A7A55]" },
  planned: { label: "예정", cls: "text-[#888]" },
  completed: { label: "완료", cls: "text-[#AEAEB2]" },
};

type ReviewRow = {
  id: string;
  body: string | null;
  title: string | null;
  reported_at: string | null;
  created_at: string;
  episode: {
    title: string | null;
    seq: number | null;
    project: {
      title: string | null;
      category: { slug: string | null } | null;
    } | null;
  } | null;
  project: {
    title: string | null;
    category: { slug: string | null } | null;
  } | null;
};

type EpisodeRow = {
  id: string;
  title: string;
  seq: number | null;
  status: string;
  session_date: string | null;
  project: { title: string | null } | null;
};

export default async function AdminPage() {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") {
    redirect("/admin/login");
  }

  const admin = createAdminClient();
  const startOfMonth = monthStartIso();

  const [
    publicCountRes,
    reportedCountRes,
    shopsCountRes,
    shopsThisMonthRes,
    episodeInProgressRes,
    totalCardsRes,
  ] = await Promise.all([
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true)
      .is("removed_at", null),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .not("reported_at", "is", null)
      .is("removed_at", null),
    admin.from("shops").select("id", { count: "exact", head: true }),
    admin
      .from("shops")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth),
    admin
      .from("episodes")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    admin.from("activities").select("id", { count: "exact", head: true }),
  ]);

  const publicCount = publicCountRes.count ?? 0;
  const reportedCount = reportedCountRes.count ?? 0;
  const shopsCount = shopsCountRes.count ?? 0;
  const shopsThisMonth = shopsThisMonthRes.count ?? 0;
  const episodeInProgress = episodeInProgressRes.count ?? 0;
  const totalCards = totalCardsRes.count ?? 0;

  // 검수 큐 — 가장 오래된 공개 카드 N건 (행위 큐: 위에서부터 처리)
  const { data: reviewRowsRaw } = await admin
    .from("activities")
    .select(
      `
      id, body, title, reported_at, created_at,
      episode:episodes (
        title, seq,
        project:projects ( title, category:categories ( slug ) )
      ),
      project:projects (
        title, category:categories ( slug )
      )
    `
    )
    .eq("is_public", true)
    .is("removed_at", null)
    .order("created_at", { ascending: true })
    .limit(REVIEW_QUEUE_LIMIT);

  const reviewRows = (reviewRowsRaw ?? []) as unknown as ReviewRow[];
  const oldestReview = reviewRows[0];
  const oldestReviewDays = oldestReview
    ? daysSince(oldestReview.created_at)
    : null;

  // 에피소드 패널 — 진행 중·예정만
  const { data: episodeRowsRaw } = await admin
    .from("episodes")
    .select(
      `id, title, seq, status, session_date,
       project:projects ( title )`
    )
    .in("status", ["in_progress", "planned"])
    .order("session_date", { ascending: true, nullsFirst: false })
    .limit(EPISODE_PANEL_LIMIT);

  const episodeRows = (episodeRowsRaw ?? []) as unknown as EpisodeRow[];

  return (
    <AdminShell
      active="home"
      reviewBadge={publicCount}
      reportedBadge={reportedCount}
    >
      <AnimateOnScroll>
        <div className="mb-7">
          <h1 className="mb-1 text-[22px] font-bold tracking-[-0.5px] text-v2-ink">
            오늘 처리할 것들
          </h1>
          <p className="text-[12.5px] font-light text-[#AEAEB2]">
            {summarySubtext({
              oldestReviewDays,
              reportedCount,
              publicCount,
            })}
          </p>
        </div>
      </AnimateOnScroll>

      <AlertGrid
        publicCount={publicCount}
        reportedCount={reportedCount}
        oldestReviewDays={oldestReviewDays}
        shopsThisMonth={shopsThisMonth}
      />

      <TwoColumn rows={reviewRows} episodes={episodeRows} />

      <MetricsGrid
        publicCount={publicCount}
        totalCards={totalCards}
        shopsCount={shopsCount}
        shopsThisMonth={shopsThisMonth}
        episodeInProgress={episodeInProgress}
      />
    </AdminShell>
  );
}

// ── helpers ────────────────────────────────────────────────────

function monthStartIso(): string {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  ).toISOString();
}

function daysSince(iso: string): number {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return 0;
  const diff = Date.now() - created;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function categoryLabel(row: ReviewRow): CategoryLabel | null {
  const slug =
    row.episode?.project?.category?.slug ?? row.project?.category?.slug ?? null;
  if (!slug) return null;
  return SLUG_TO_LABEL[slug] ?? null;
}

function projectLine(row: ReviewRow): string {
  const projectTitle =
    row.episode?.project?.title ?? row.project?.title ?? null;
  const seq = row.episode?.seq;
  if (projectTitle && seq != null) return `${projectTitle} ${seq}회차`;
  if (projectTitle) return projectTitle;
  return "프로젝트 미연결";
}

function episodeLine(ep: EpisodeRow): string {
  const projectTitle = ep.project?.title ?? "";
  const seq = ep.seq != null ? ` ${ep.seq}회차` : "";
  if (projectTitle) return `${projectTitle}${seq}`.trim();
  return ep.title;
}

function episodePeriod(ep: EpisodeRow): string {
  return ep.session_date ? shortDate(ep.session_date) : "일정 미정";
}

function summarySubtext({
  oldestReviewDays,
  reportedCount,
  publicCount,
}: {
  oldestReviewDays: number | null;
  reportedCount: number;
  publicCount: number;
}): string {
  if (publicCount === 0) {
    return "검수할 공개 카드가 없어요. 잠시 한 숨 돌리셔도 됩니다.";
  }
  const oldestText =
    oldestReviewDays == null
      ? "가장 오래된 검수 · 오늘"
      : oldestReviewDays === 0
        ? "가장 오래된 검수 · 오늘"
        : `가장 오래된 검수 · ${oldestReviewDays}일 전`;
  const reportedText = reportedCount > 0 ? ` · 신고 ${reportedCount}건` : "";
  return `${oldestText}${reportedText}`;
}

// ── Alert grid ────────────────────────────────────────────────

function AlertGrid({
  publicCount,
  reportedCount,
  oldestReviewDays,
  shopsThisMonth,
}: {
  publicCount: number;
  reportedCount: number;
  oldestReviewDays: number | null;
  shopsThisMonth: number;
}) {
  const cells: {
    num: number;
    color: string;
    label: string;
    sub: string;
    urgent?: boolean;
  }[] = [
    {
      num: publicCount,
      color: "text-[#6BAF8A]",
      label: "공개 검수 대기",
      sub:
        publicCount === 0
          ? "처리할 카드 없음"
          : oldestReviewDays != null && oldestReviewDays > 0
            ? `가장 오래된 · ${oldestReviewDays}일 전`
            : "오늘 들어온 카드",
    },
    {
      num: reportedCount,
      color: reportedCount > 0 ? "text-[#E05555]" : "text-[#888]",
      label: "신고 대기",
      sub: reportedCount > 0 ? "지금 처리 필요" : "처리 대기 없음",
      urgent: reportedCount > 0,
    },
    {
      num: shopsThisMonth,
      color: shopsThisMonth > 0 ? "text-[#C4956A]" : "text-[#888]",
      label: "이번 달 새 가게",
      sub: shopsThisMonth > 0 ? "QR · 사장님 코드 점검" : "신규 등록 없음",
    },
    {
      num: 0,
      color: "text-[#888]",
      label: "사장님 코드 재발급",
      sub: "수동 요청 기준 (자동 큐 미구현)",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {cells.map((a, i) => (
        <AnimateOnScroll key={a.label} delay={(i + 1) * 0.06}>
          <div
            className={`rounded-xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] ${
              a.urgent
                ? "border-[rgba(224,85,85,0.3)] bg-[rgba(224,85,85,0.03)]"
                : "border-v2-rule"
            }`}
          >
            <p
              className={`mb-1.5 text-[32px] font-bold leading-none tracking-[-1px] ${a.color}`}
            >
              {a.num}
            </p>
            <p className="mb-[3px] text-[12.5px] font-semibold text-v2-ink">
              {a.label}
            </p>
            <p className="text-[11px] font-light text-[#AEAEB2]">{a.sub}</p>
          </div>
        </AnimateOnScroll>
      ))}
    </div>
  );
}

// ── Two column ────────────────────────────────────────────────

function TwoColumn({
  rows,
  episodes,
}: {
  rows: ReviewRow[];
  episodes: EpisodeRow[];
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <ReviewQueue rows={rows} />
      <EpisodePanel episodes={episodes} />
    </div>
  );
}

function ReviewQueue({ rows }: { rows: ReviewRow[] }) {
  return (
    <AnimateOnScroll delay={0.06}>
      <div className="overflow-hidden rounded-2xl border border-v2-rule bg-white">
        <div className="flex items-center justify-between border-b border-v2-rule px-5 py-4">
          <p className="text-[14px] font-semibold text-v2-ink">
            공개 검수 큐 · 최신 {rows.length}건
          </p>
          <Link
            href="/admin/review"
            className="text-[12px] text-[#6BAF8A] transition-colors hover:underline"
          >
            전체 보기 →
          </Link>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="mb-1 text-[13px] font-semibold text-v2-ink">
              검수할 카드가 없어요.
            </p>
            <p className="text-[11.5px] font-light text-[#AEAEB2]">
              새 공개 카드가 생기면 여기 자동으로 모입니다.
            </p>
          </div>
        ) : (
          rows.map((r, i) => {
            const label = categoryLabel(r);
            const badgeCls = label
              ? BADGE_CLASS[label]
              : "bg-[#EDECEA] text-[#888]";
            const noLabel = `No.${r.id.slice(0, 4).toUpperCase()}`;
            return (
              <div
                key={r.id}
                className={`px-5 py-4 transition-colors hover:bg-[#FAFAF8] ${
                  i < rows.length - 1 ? "border-b border-[#F0F0EC]" : ""
                }`}
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
                    {r.reported_at ? "⚠ " : ""}
                    {noLabel} · {label ?? "—"}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[9px] font-semibold ${badgeCls}`}
                  >
                    {label ?? "미분류"}
                  </span>
                </div>
                <p className="mb-2.5 line-clamp-2 text-[12.5px] leading-[1.65] text-v2-ink">
                  {r.body || r.title || "(본문 없음)"}
                </p>
                <p className="mb-2.5 text-[10.5px] text-[#AEAEB2]">
                  {shortDate(r.created_at)} · {projectLine(r)}
                </p>
                <AdminReviewActions
                  activityId={r.id}
                  reported={r.reported_at != null}
                />
              </div>
            );
          })
        )}
      </div>
    </AnimateOnScroll>
  );
}

function EpisodePanel({ episodes }: { episodes: EpisodeRow[] }) {
  return (
    <AnimateOnScroll delay={0.12}>
      <div className="overflow-hidden rounded-2xl border border-v2-rule bg-white">
        <div className="flex items-center justify-between border-b border-v2-rule px-5 py-4">
          <p className="text-[14px] font-semibold text-v2-ink">
            진행 중 에피소드
          </p>
          <Link
            href="/crew"
            className="text-[12px] text-[#6BAF8A] transition-colors hover:underline"
          >
            크루 업데이트 →
          </Link>
        </div>
        {episodes.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-[12px] font-light text-[#AEAEB2]">
              진행 중 에피소드가 없어요.
            </p>
          </div>
        ) : (
          episodes.map((ep, i) => {
            const status = STATUS_LABEL[ep.status] ?? {
              label: ep.status,
              cls: "text-[#888]",
            };
            return (
              <div
                key={ep.id}
                className={`px-[18px] py-3.5 ${
                  i < episodes.length - 1 ? "border-b border-[#F0F0EC]" : ""
                }`}
              >
                <p
                  className={`mb-1 text-[10px] font-semibold tracking-[1px] ${status.cls}`}
                >
                  {status.label}
                </p>
                <p className="mb-0.5 text-[13px] font-semibold text-v2-ink">
                  {episodeLine(ep)}
                </p>
                <p className="text-[11px] text-[#AEAEB2]">
                  {episodePeriod(ep)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </AnimateOnScroll>
  );
}

// ── Metrics ────────────────────────────────────────────────────

function MetricsGrid({
  publicCount,
  totalCards,
  shopsCount,
  shopsThisMonth,
  episodeInProgress,
}: {
  publicCount: number;
  totalCards: number;
  shopsCount: number;
  shopsThisMonth: number;
  episodeInProgress: number;
}) {
  const metrics: { unit: string; num: number; label: string }[] = [
    { unit: "누적", num: totalCards, label: "전체 카드" },
    { unit: "지금", num: publicCount, label: "공개 카드" },
    { unit: "누적", num: shopsCount, label: "등록 가게" },
    { unit: "이번 달", num: shopsThisMonth, label: "신규 가게" },
    { unit: "지금", num: episodeInProgress, label: "진행 중 에피소드" },
  ];

  return (
    <AnimateOnScroll delay={0.18}>
      <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-v2-rule bg-white sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`px-4 py-5 text-center ${
              i < metrics.length - 1
                ? "border-b border-r border-v2-rule lg:border-b-0"
                : ""
            }`}
          >
            <p className="mb-1 text-[12px] font-medium text-[#6BAF8A]">
              {m.unit}
            </p>
            <p className="mb-1.5 text-[26px] font-bold leading-none tracking-[-0.8px] text-v2-ink">
              {m.num}
            </p>
            <p className="text-[11px] text-[#AEAEB2]">{m.label}</p>
          </div>
        ))}
      </div>
    </AnimateOnScroll>
  );
}
