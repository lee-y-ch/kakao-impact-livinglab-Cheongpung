import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import type { EpisodeStatus } from "@/lib/schemas/episode";
import type { ProgressType } from "@/lib/schemas/project";
import { createAdminClient } from "@/lib/supabase/admin";

import { ProjectForm } from "../ProjectForm";
import { EpisodeSection, type EpisodeRow } from "./EpisodeSection";

export const dynamic = "force-dynamic";

/**
 * /admin/projects/[id] — 프로젝트 편집.
 * 에피소드 CRUD 는 동일 페이지 하단에 추가(Phase 3 다음 단계).
 */
type Props = { params: { id: string } };

export default async function AdminProjectEditPage({ params }: Props) {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  const idCheck = UuidSchema.safeParse(params.id);
  if (!idCheck.success) notFound();

  const admin = createAdminClient();

  const [categoriesRes, projectRes, episodesRes] = await Promise.all([
    admin
      .from("categories")
      .select("id, slug, name")
      .order("sort_order", { ascending: true }),
    admin
      .from("projects")
      .select(
        "id, category_id, slug, title, summary, description, is_public, progress_type, progress_target"
      )
      .eq("id", idCheck.data)
      .maybeSingle(),
    admin
      .from("episodes")
      .select(
        "id, seq, title, summary, session_date, location, is_public, status"
      )
      .eq("project_id", idCheck.data)
      .order("seq", { ascending: true, nullsFirst: false })
      .order("session_date", { ascending: true, nullsFirst: false }),
  ]);

  if (!projectRes.data) notFound();

  const episodes: EpisodeRow[] = (episodesRes.data ?? []).map((e) => ({
    id: e.id as string,
    seq: (e.seq as number | null) ?? null,
    title: e.title as string,
    summary: (e.summary as string | null) ?? null,
    session_date: (e.session_date as string | null) ?? null,
    location: (e.location as string | null) ?? null,
    is_public: Boolean(e.is_public),
    status: (e.status as EpisodeStatus) ?? "planned",
  }));

  const categories = (categoriesRes.data ?? []).map((c) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as string,
  }));

  const p = projectRes.data;
  const initial = {
    id: p.id as string,
    category_id: p.category_id as string,
    slug: p.slug as string,
    title: p.title as string,
    summary: (p.summary as string | null) ?? "",
    description: (p.description as string | null) ?? "",
    is_public: Boolean(p.is_public),
    progress_type: (p.progress_type as ProgressType | null) ?? "time",
    progress_target:
      (p.progress_target as Record<string, unknown> | null) ?? {},
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/projects"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← 프로젝트 목록
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          프로젝트 편집
        </h1>
        <p className="text-sm text-muted-foreground">
          수정한 값은 저장 즉시 공개/검수 페이지에 반영됩니다.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-border bg-background p-5">
        <ProjectForm categories={categories} initial={initial} />
      </section>

      <section className="mt-10 flex flex-col gap-3">
        <header className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">에피소드(회차)</h2>
          <p className="text-xs text-muted-foreground">
            회차는 크루가 현장에서 상태(예정 → 진행 → 완료) 를 업데이트합니다.
            관리자는 기본 정보와 공개 여부를 조정해요.
          </p>
        </header>
        <EpisodeSection projectId={initial.id} episodes={episodes} />
      </section>
    </main>
  );
}
