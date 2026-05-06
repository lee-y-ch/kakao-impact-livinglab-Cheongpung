import Link from "next/link";
import { redirect } from "next/navigation";

import {
  LegacyContainer,
  LegacyHeader,
  LegacyPage,
  LegacyPanel,
} from "@/components/legacy-v2/PageChrome";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { ProjectForm } from "./ProjectForm";

export const dynamic = "force-dynamic";

/**
 * /admin/projects — 관리자 프로젝트 CRUD.
 *
 * 상단: 새 프로젝트 생성 폼.
 * 하단: 기존 프로젝트 목록. 행을 누르면 /admin/projects/[id] 편집.
 *
 * Supabase service role(createAdminClient) 로 조회 — 비공개 프로젝트도 모두 보여야 하므로 RLS 우회.
 * 권한은 getCurrentActor() 가 admin 인지로만 게이트한다.
 */
export default async function AdminProjectsPage() {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  const admin = createAdminClient();

  const [categoriesRes, projectsRes] = await Promise.all([
    admin
      .from("categories")
      .select("id, slug, name")
      .order("sort_order", { ascending: true }),
    admin
      .from("projects")
      .select(
        "id, slug, title, is_public, progress_type, category_id, updated_at"
      )
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  const categories =
    (categoriesRes.data ?? []).map((c) => ({
      id: c.id as string,
      slug: c.slug as string,
      name: c.name as string,
    })) ?? [];

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const projects =
    (projectsRes.data ?? []).map((p) => ({
      id: p.id as string,
      slug: p.slug as string,
      title: p.title as string,
      is_public: Boolean(p.is_public),
      progress_type: (p.progress_type as string | null) ?? null,
      category_name: categoryMap.get(p.category_id as string) ?? "—",
      updated_at: p.updated_at as string,
    })) ?? [];

  return (
    <LegacyPage>
      <LegacyContainer className="max-w-[1080px]">
        <LegacyHeader
          eyebrow="Admin Projects"
          title="프로젝트 운영"
          description="카테고리별 장기 프로젝트를 만들고 진척도 기준을 설정합니다. 각 프로젝트 상세에서 에피소드와 공개 상태를 이어서 관리합니다."
          backHref="/admin"
          backLabel="← 운영 홈"
        />

        {categories.length === 0 ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
          >
            카테고리 시드(001_initial.sql) 가 비어있어요. 먼저 4개 카테고리를
            넣어주세요.
          </p>
        ) : (
          <LegacyPanel>
            <h2 className="text-base font-semibold text-v2-ink">
              새 프로젝트 만들기
            </h2>
            <p className="mt-1 text-xs text-v2-ink3">
              저장하면 목록에 바로 반영됩니다.
            </p>
            <div className="mt-4">
              <ProjectForm categories={categories} />
            </div>
          </LegacyPanel>
        )}

        <section className="mt-10">
          <h2 className="text-base font-semibold text-v2-ink">
            등록된 프로젝트 ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <p className="v2-legacy-empty mt-3">
              아직 등록된 프로젝트가 없어요.
            </p>
          ) : (
            <ul className="v2-legacy-panel mt-3 divide-y overflow-hidden">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-4 transition hover:bg-black/[0.02]"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-v2-ink">
                        {p.title}
                      </span>
                      <span className="truncate text-xs text-v2-ink3">
                        {p.category_name} · /{p.slug}
                        {p.progress_type ? ` · ${p.progress_type}` : ""}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="v2-legacy-pill">
                        {p.is_public ? "공개" : "비공개"}
                      </span>
                      <span className="text-v2-ink3">편집 →</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </LegacyContainer>
    </LegacyPage>
  );
}
