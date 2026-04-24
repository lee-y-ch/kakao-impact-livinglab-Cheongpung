import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * /admin — 청풍 운영 홈.
 *
 * 좌측: 액션 아이템 요약(검수 대기, 신고 대기, 잠긴 사장님 계정, 진행 중 에피소드).
 * 우측: 구조적 카운트(프로젝트/가게/카드/사장님).
 * 각 카운트는 드릴다운 링크를 겸한다.
 *
 * "강화도 진척" 은 여기가 아니라 /impact (공개 페이지) — CLAUDE.md 설계.
 */
export default async function AdminHomePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const [
    publicActivitiesRes,
    pendingReportsRes,
    removedActivitiesRes,
    lockedOwnersRes,
    inProgressEpisodesRes,
    totalProjectsRes,
    totalShopsRes,
    totalOwnersRes,
    totalActivitiesRes,
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
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .not("removed_at", "is", null),
    admin
      .from("shop_owners")
      .select("id", { count: "exact", head: true })
      .gt("locked_until", nowIso),
    admin
      .from("episodes")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    admin.from("projects").select("id", { count: "exact", head: true }),
    admin.from("shops").select("id", { count: "exact", head: true }),
    admin.from("shop_owners").select("id", { count: "exact", head: true }),
    admin.from("activities").select("id", { count: "exact", head: true }),
  ]);

  const publicActivities = publicActivitiesRes.count ?? 0;
  const pendingReports = pendingReportsRes.count ?? 0;
  const removedActivities = removedActivitiesRes.count ?? 0;
  const lockedOwners = lockedOwnersRes.count ?? 0;
  const inProgressEpisodes = inProgressEpisodesRes.count ?? 0;
  const totalProjects = totalProjectsRes.count ?? 0;
  const totalShops = totalShopsRes.count ?? 0;
  const totalOwners = totalOwnersRes.count ?? 0;
  const totalActivities = totalActivitiesRes.count ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          관리자
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          청풍 운영 홈
        </h1>
        <p className="text-sm text-muted-foreground">{actor.email}</p>
      </header>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          지금 챙길 것
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            href="/admin/reports"
            title="신고 대응 대기"
            count={pendingReports}
            hint="신고 · 미처리"
            urgent={pendingReports > 0}
          />
          <ActionCard
            href="/admin/review"
            title="공개 검수 큐"
            count={publicActivities}
            hint="공개 중 카드"
          />
          <ActionCard
            href="/admin/shops"
            title="사장님 계정 잠금"
            count={lockedOwners}
            hint="5회 실패 · 1시간 잠금"
            urgent={lockedOwners > 0}
          />
          <ActionCard
            href="/admin/projects"
            title="진행 중 에피소드"
            count={inProgressEpisodes}
            hint="status = in_progress"
          />
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          구조적 카운트
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            href="/admin/projects"
            label="프로젝트"
            value={totalProjects}
          />
          <StatCard href="/admin/shops" label="가게" value={totalShops} />
          <StatCard
            href="/admin/shops"
            label="사장님 계정"
            value={totalOwners}
          />
          <StatCard
            href="/admin/review"
            label="전체 카드"
            value={totalActivities}
            sub={`가려진 ${removedActivities}`}
          />
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          바로가기
        </h2>
        <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AdminNavLink
            href="/admin/projects"
            title="프로젝트 · 에피소드"
            description="카테고리별 장기 프로젝트와 진척도 기준을 설정합니다."
          />
          <AdminNavLink
            href="/admin/shops"
            title="가게 · 사장님 코드"
            description="가게 등록, QR 발급, 사장님 로그인 코드를 관리합니다."
          />
          <AdminNavLink
            href="/admin/review"
            title="공개 검수 큐"
            description="공개 중인 카드를 훑어보고 필요 시 비공개 전환/가리기 조치합니다."
          />
          <AdminNavLink
            href="/admin/reports"
            title="신고 대응"
            description="신고된 카드를 가리거나 신고를 해제합니다."
          />
        </nav>
      </section>
    </main>
  );
}

function ActionCard({
  href,
  title,
  count,
  hint,
  urgent = false,
}: {
  href: string;
  title: string;
  count: number;
  hint: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "flex flex-col gap-2 rounded-xl border p-4 transition hover:bg-muted/40 " +
        (urgent
          ? "border-amber-400 bg-amber-50"
          : "border-border bg-background")
      }
    >
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <span className="text-3xl font-bold tracking-tight">{count}</span>
      <span
        className={
          "text-[11px] " + (urgent ? "text-amber-800" : "text-muted-foreground")
        }
      >
        {hint}
      </span>
    </Link>
  );
}

function StatCard({
  href,
  label,
  value,
  sub,
}: {
  href: string;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-xl border border-border bg-background p-4 transition hover:bg-muted/40"
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
      {sub ? (
        <span className="text-[11px] text-muted-foreground">{sub}</span>
      ) : null}
    </Link>
  );
}

function AdminNavLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-xl border border-border bg-background p-4 transition hover:bg-muted/60"
    >
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </Link>
  );
}
