import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { ReviewRowActions } from "./ReviewRowActions";

export const dynamic = "force-dynamic";

type SearchProps = {
  searchParams?: { filter?: string };
};

type Filter = "public" | "removed";

const PAGE_SIZE = 30;

/**
 * /admin/review — 공개 검수 큐.
 *
 * 기본: is_public=true AND removed_at IS NULL (외부에 노출 중인 카드)
 * filter=removed : removed_at IS NOT NULL (이미 가린 카드 — 복원 가능)
 *
 * 관리자는 각 카드에서 '비공개 전환 / 공개 영역에서 가리기' 또는 '복원' 을 선택.
 * 신고(reported_at) 대응은 별도 /admin/reports 에서 처리.
 */
export default async function AdminReviewPage({ searchParams }: SearchProps) {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  const filter: Filter =
    searchParams?.filter === "removed" ? "removed" : "public";

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
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (filter === "public") {
    query = query.eq("is_public", true).is("removed_at", null);
  } else {
    query = query.not("removed_at", "is", null);
  }

  const { data: rows, error } = await query;

  const [publicCountRes, removedCountRes] = await Promise.all([
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true)
      .is("removed_at", null),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .not("removed_at", "is", null),
  ]);

  const publicCount = publicCountRes.count ?? 0;
  const removedCount = removedCountRes.count ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← 운영 홈
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          공개 검수 큐
        </h1>
        <p className="text-sm text-muted-foreground">
          공개로 노출 중인 카드를 훑어보고 필요하면 비공개 전환하거나
          가려주세요. 신고 대응은 따로 있어요.
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        <FilterTab
          href="/admin/review"
          label="공개 중"
          count={publicCount}
          active={filter === "public"}
        />
        <FilterTab
          href="/admin/review?filter=removed"
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
        <p className="mt-6 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          {filter === "public"
            ? "지금 공개된 카드가 없어요."
            : "가려진 카드가 없어요."}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {rows.map((r) => {
            const shopName = (r.shop as { name: string } | null)?.name ?? null;
            const episodeTitle =
              (r.episode as { title: string } | null)?.title ?? null;
            const projectTitle =
              (r.project as { title: string } | null)?.title ?? null;
            const authorName =
              (r.author as { nickname: string | null } | null)?.nickname ??
              "(이름 없음)";
            const contextLabel =
              shopName ?? episodeTitle ?? projectTitle ?? "강화 어딘가";

            return (
              <li
                key={r.id as string}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 sm:flex-row"
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
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                      {r.type as string}
                    </span>
                    <span>{contextLabel}</span>
                    <span>·</span>
                    <span>{authorName}</span>
                    <span>·</span>
                    <time dateTime={r.created_at as string}>
                      {new Date(r.created_at as string).toLocaleString("ko-KR")}
                    </time>
                    {r.reported_at ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        신고됨
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
                  <ReviewRowActions
                    activityId={r.id as string}
                    removed={Boolean(r.removed_at)}
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
    </main>
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
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:bg-muted")
      }
    >
      <span>{label}</span>
      <span
        className={
          "rounded-full px-1.5 py-0.5 text-[10px] " +
          (active
            ? "bg-background/20 text-background"
            : "bg-muted text-foreground/70")
        }
      >
        {count}
      </span>
    </Link>
  );
}
