import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

import { CardActions } from "./CardActions";

export const dynamic = "force-dynamic";

/**
 * 카드 상세 — 본인 것만. 뒷면(reactions) 은 Phase 4 에서 추가.
 * 타인의 공개 카드 열람 URL 은 Phase 6 에서 `/feed/[id]` 형태로 분기.
 */
export default async function CollectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const idCheck = UuidSchema.safeParse(params.id);
  if (!idCheck.success) notFound();

  const actor = await getCurrentActor();
  if (actor.role !== "participant") {
    redirect(`/login?next=/collection/${params.id}`);
  }

  const supabase = createServerSupabase();
  const { data: row } = await supabase
    .from("activities")
    .select(
      `id, type, body, title, photo_url, is_public, face_consent, created_at, removed_at, user_id,
       shops:shop_id(id, name),
       episodes:episode_id(id, title),
       projects:project_id(id, title, slug)`
    )
    .eq("id", idCheck.data)
    .maybeSingle();

  if (!row) notFound();
  if (row.user_id !== actor.userId) notFound(); // 타인 카드는 존재 자체 숨김
  if (row.removed_at) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12 text-center">
        <h1 className="text-xl font-semibold">삭제된 카드예요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          이 카드는 더 이상 도감에 표시되지 않아요.
        </p>
        <Link
          href="/collection"
          className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
        >
          도감으로 돌아가기
        </Link>
      </main>
    );
  }

  const contextLabel =
    row.shops?.name ??
    row.episodes?.title ??
    row.projects?.title ??
    "강화 어딘가";
  const dateText = new Date(row.created_at as string).toLocaleDateString(
    "ko-KR",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-6 py-6">
      <Link
        href="/collection"
        className="self-start text-xs text-muted-foreground hover:text-foreground"
      >
        ← 도감으로
      </Link>

      <article className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        {row.photo_url ? (
          <div className="relative aspect-[4/5] w-full bg-muted">
            <Image
              src={row.photo_url}
              alt={row.body ?? contextLabel}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {contextLabel}
            </span>
            <time dateTime={row.created_at as string}>{dateText}</time>
          </div>

          {row.body ? (
            <p className="text-base leading-relaxed text-foreground">
              {row.body}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              메모 없이 찍은 한 장.
            </p>
          )}
        </div>
      </article>

      <CardActions
        activityId={row.id as string}
        initialIsPublic={Boolean(row.is_public)}
        faceConsentGranted={Boolean(row.face_consent)}
      />

      <section className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
        편지·하이파이브 같은 응원은 다음 단계(Phase 4)에서 이 자리에 붙어요.
      </section>
    </main>
  );
}
