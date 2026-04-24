import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { CrewReactionBar } from "./CrewReactionBar";
import { EpisodeStatusControl } from "./EpisodeStatusControl";

export const dynamic = "force-dynamic";

/**
 * /crew — 크루 대시보드.
 *
 * 두 블록:
 *   1) 진행 중/예정 에피소드 — status 를 planned→in_progress→completed 로 갱신
 *   2) 최근 공개 카드 — hi-five 또는 현장 메모 달기
 *
 * 크루는 RLS 대상이 아니라서 admin client (service role) 로 읽는다.
 * 공개/비공개 구분 없이 최근 activities 를 훑을 수 있어야 현장 응원이 의미가 있다.
 */

const EPISODE_LIMIT = 20;
const ACTIVITY_LIMIT = 20;

export default async function CrewHomePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "crew") redirect("/crew/login");

  const admin = createAdminClient();

  const [episodesRes, activitiesRes] = await Promise.all([
    admin
      .from("episodes")
      .select(
        `
        id, title, seq, session_date, location, status, updated_at,
        project:project_id (id, title, slug)
      `
      )
      .in("status", ["planned", "in_progress"])
      .order("session_date", { ascending: true, nullsFirst: false })
      .limit(EPISODE_LIMIT),
    admin
      .from("activities")
      .select(
        `
        id, type, body, photo_url, is_public, created_at,
        shop:shop_id (id, name),
        episode:episode_id (id, title),
        author:user_id (id, nickname)
      `
      )
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LIMIT),
  ]);

  const episodes = episodesRes.data ?? [];
  const activities = activitiesRes.data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          크루
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          크루 대시보드
        </h1>
        <p className="text-sm text-muted-foreground">
          현장에서 에피소드 진행 상태를 갱신하고, 최근 참여자 카드에 응원을
          남겨주세요.
        </p>
      </header>

      <section className="mt-8 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">진행 중 · 예정 에피소드</h2>
          <span className="text-xs text-muted-foreground">
            {episodes.length}건
          </span>
        </div>

        {episodesRes.error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            에피소드를 불러오지 못했어요: {episodesRes.error.message}
          </p>
        ) : episodes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            지금 진행 중이거나 예정된 에피소드가 없어요. 관리자
            (/admin/projects) 에서 에피소드를 먼저 만들어주세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {episodes.map((ep) => {
              const project = ep.project as {
                id: string;
                title: string;
                slug: string;
              } | null;
              return (
                <li
                  key={ep.id as string}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {project ? (
                        <Link
                          href={`/projects/${project.slug}`}
                          className="hover:underline"
                        >
                          {project.title}
                        </Link>
                      ) : (
                        <span>프로젝트 미지정</span>
                      )}
                      {ep.seq ? <span>· {ep.seq}회차</span> : null}
                      {ep.session_date ? (
                        <span>· {ep.session_date as string}</span>
                      ) : null}
                      {ep.location ? (
                        <span>· {ep.location as string}</span>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {ep.title as string}
                    </p>
                  </div>

                  <EpisodeStatusControl
                    episodeId={ep.id as string}
                    initialStatus={
                      ep.status as "planned" | "in_progress" | "completed"
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">최근 참여자 카드</h2>
          <span className="text-xs text-muted-foreground">
            최근 {activities.length}건 (신고/가려진 카드 제외)
          </span>
        </div>

        {activitiesRes.error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            카드를 불러오지 못했어요: {activitiesRes.error.message}
          </p>
        ) : activities.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            최근 카드가 아직 없어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {activities.map((a) => {
              const shopName =
                (a.shop as { name: string } | null)?.name ?? null;
              const episodeTitle =
                (a.episode as { title: string } | null)?.title ?? null;
              const authorName =
                (a.author as { nickname: string | null } | null)?.nickname ??
                "(이름 없음)";
              const contextLabel = shopName ?? episodeTitle ?? "강화 어딘가";

              return (
                <li
                  key={a.id as string}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {a.photo_url ? (
                      <Image
                        src={a.photo_url as string}
                        alt={(a.body as string | null) ?? contextLabel}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        사진 없음
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                        {a.type as string}
                      </span>
                      <span>{contextLabel}</span>
                      <span>·</span>
                      <span>{authorName}</span>
                      <span>·</span>
                      <time dateTime={a.created_at as string}>
                        {new Date(a.created_at as string).toLocaleString(
                          "ko-KR"
                        )}
                      </time>
                      {!a.is_public ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          비공개
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">
                      {(a.body as string | null) ?? "(본문 없음)"}
                    </p>

                    <CrewReactionBar activityId={a.id as string} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
