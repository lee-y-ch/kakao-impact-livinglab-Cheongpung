import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  LegacyContainer,
  LegacyHeader,
  LegacyPage,
} from "@/components/legacy-v2/PageChrome";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { ReportRowActions } from "./ReportRowActions";

export const dynamic = "force-dynamic";

type SearchProps = {
  searchParams?: { filter?: string };
};

type Filter = "pending" | "removed";

const PAGE_SIZE = 30;

/**
 * /admin/reports — 신고 대응.
 *
 * pending : reported_at IS NOT NULL AND removed_at IS NULL (판단 필요한 신고)
 * removed : removed_at IS NOT NULL (이미 가린 카드 — 복원 가능)
 *
 * 신고 해제(dismiss_report) 시 reported_at 을 null 로 되돌려 공개 유지.
 * 가리기(remove) 시 removed_at 설정 + is_public=false.
 *
 * 참여자 측 신고 엔드포인트는 Phase 4 합류 — 현재는 DB 에 직접 reported_at 을
 * set 해 시연하거나 운영자가 수동 조작한다.
 */
export default async function AdminReportsPage({ searchParams }: SearchProps) {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  const filter: Filter =
    searchParams?.filter === "removed" ? "removed" : "pending";

  const admin = createAdminClient();

  let query = admin
    .from("activities")
    .select(
      `
      id, type, title, body, photo_url, is_public, face_consent,
      reported_at, removed_at, created_at,
      user_id,
      shop:shop_id (id, name),
      episode:episode_id (id, title),
      project:project_id (id, title, slug),
      author:user_id (id, nickname)
    `
    )
    .limit(PAGE_SIZE);

  if (filter === "pending") {
    query = query
      .not("reported_at", "is", null)
      .is("removed_at", null)
      .order("reported_at", { ascending: false });
  } else {
    query = query
      .not("removed_at", "is", null)
      .order("removed_at", { ascending: false });
  }

  const { data: rows, error } = await query;

  const [pendingCountRes, removedCountRes] = await Promise.all([
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .not("reported_at", "is", null)
      .is("removed_at", null),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .not("removed_at", "is", null),
  ]);

  const pendingCount = pendingCountRes.count ?? 0;
  const removedCount = removedCountRes.count ?? 0;

  return (
    <LegacyPage>
      <LegacyContainer className="max-w-[1120px]">
        <LegacyHeader
          eyebrow="Admin Reports"
          title="신고 대응"
          description="신고된 카드를 확인하고 공개 영역에서 가리거나 신고를 해제합니다. 모든 조치는 감사 로그에 기록됩니다."
          backHref="/admin"
          backLabel="← 운영 홈"
        />

        <nav className="mt-2 flex flex-wrap gap-2 text-sm">
          <FilterTab
            href="/admin/reports"
            label="대응 대기"
            count={pendingCount}
            active={filter === "pending"}
          />
          <FilterTab
            href="/admin/reports?filter=removed"
            label="가려진 카드"
            count={removedCount}
            active={filter === "removed"}
          />
        </nav>

        {error ? (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            카드를 불러오지 못했어요: {error.message}
          </p>
        ) : !rows || rows.length === 0 ? (
          <p className="v2-legacy-empty mt-6">
            {filter === "pending"
              ? "대응할 신고가 없어요."
              : "가려진 카드가 없어요."}
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {rows.map((r) => {
              const shopName =
                (r.shop as { name: string } | null)?.name ?? null;
              const episodeTitle =
                (r.episode as { title: string } | null)?.title ?? null;
              const projectTitle =
                (r.project as { title: string } | null)?.title ?? null;
              const authorName =
                (r.author as { nickname: string | null } | null)?.nickname ??
                "(이름 없음)";
              const contextLabel =
                shopName ?? episodeTitle ?? projectTitle ?? "강화 어딘가";
              const reportedAt = r.reported_at as string | null;
              const removedAt = r.removed_at as string | null;

              return (
                <li
                  key={r.id as string}
                  className="v2-legacy-panel flex flex-col gap-4 p-4 sm:flex-row"
                >
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {r.photo_url ? (
                      <Image
                        src={r.photo_url as string}
                        alt={(r.body as string | null) ?? contextLabel}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                        (사진 없음)
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="v2-legacy-pill">{r.type as string}</span>
                      <span>{contextLabel}</span>
                      <span>·</span>
                      <span>{authorName}</span>
                      {reportedAt ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          신고 {new Date(reportedAt).toLocaleString("ko-KR")}
                        </span>
                      ) : null}
                      {removedAt ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                          가림 {new Date(removedAt).toLocaleString("ko-KR")}
                        </span>
                      ) : null}
                      {!r.face_consent ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                          초상권 미동의
                        </span>
                      ) : null}
                    </div>

                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">
                      {(r.body as string | null) ??
                        (r.title as string | null) ??
                        "(본문 없음)"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-between gap-3">
                    <ReportRowActions
                      activityId={r.id as string}
                      removed={Boolean(removedAt)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {rows && rows.length === PAGE_SIZE ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            최근 {PAGE_SIZE} 건만 표시합니다. 더 많은 이력은 Phase 7 이후에
            도입합니다.
          </p>
        ) : null}
      </LegacyContainer>
    </LegacyPage>
  );
}

function FilterTab({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition " +
        (active
          ? "border-v2-ink bg-v2-ink text-white"
          : "border-[var(--rule)] bg-white/70 text-v2-ink3 hover:bg-[var(--paper-2)]")
      }
    >
      <span>{label}</span>
      <span
        className={
          "rounded-full px-1.5 py-0.5 text-[10px] " +
          (active
            ? "bg-white/15 text-white"
            : "bg-[var(--paper-2)] text-v2-ink2")
        }
      >
        {count}
      </span>
    </Link>
  );
}
