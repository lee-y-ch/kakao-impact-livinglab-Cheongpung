import Link from "next/link";

import type { ActivityCardData } from "@/components/activities/ActivityCard";
import { ActivityGrid } from "@/components/activities/ActivityGrid";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = {
  category?: string;
  project?: string;
  shop?: string;
};

const FEED_LIMIT = 60;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /feed — 공개 카드 시간순 그리드.
 *
 * 허용 필터: ?category=SLUG | ?project=SLUG | ?shop=UUID (배타 — 먼저 매칭되는 하나만 적용)
 * 좋아요/팔로우/랭킹 등 게이미피케이션 없음. 필터는 탐색 목적 한정.
 *
 * 카테고리 필터는 해당 카테고리 소속 공개 프로젝트의 project_id 직접 매칭 + 그 프로젝트의
 * 에피소드 id 경유 매칭 두 경로를 or 로 합쳐서 실행한다.
 */
export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = createAdminClient();
  const filter = await resolveFilter(admin, searchParams);

  let query = admin
    .from("activities")
    .select(
      `
      id, type, body, title, photo_url, is_public, created_at,
      shop:shop_id (id, name),
      episode:episode_id (id, title),
      project:project_id (id, title, slug)
    `
    )
    .eq("is_public", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  if (filter?.kind === "shop") {
    query = query.eq("shop_id", filter.shopId);
  } else if (filter?.kind === "project") {
    if (filter.episodeIds.length > 0) {
      query = query.or(
        `project_id.eq.${filter.projectId},episode_id.in.(${filter.episodeIds.join(",")})`
      );
    } else {
      query = query.eq("project_id", filter.projectId);
    }
  } else if (filter?.kind === "category") {
    const projectClause =
      filter.projectIds.length > 0
        ? `project_id.in.(${filter.projectIds.join(",")})`
        : null;
    const episodeClause =
      filter.episodeIds.length > 0
        ? `episode_id.in.(${filter.episodeIds.join(",")})`
        : null;
    const clauses = [projectClause, episodeClause].filter(
      (c): c is string => c !== null
    );
    if (clauses.length === 0) {
      // 카테고리 안에 공개 프로젝트·에피소드가 없어 걸릴 카드가 없음
      return <EmptyFeed filter={filter} title="공개된 카드가 없어요" />;
    }
    query = query.or(clauses.join(","));
  }

  const { data: rows } = await query;

  const cards: ActivityCardData[] = (rows ?? []).map((a) => ({
    id: a.id as string,
    type: a.type as string,
    body: (a.body as string | null) ?? null,
    title: (a.title as string | null) ?? null,
    photo_url: (a.photo_url as string | null) ?? null,
    is_public: Boolean(a.is_public),
    created_at: a.created_at as string,
    context: {
      shop: a.shop as { id: string; name: string } | null,
      episode: a.episode as { id: string; title: string } | null,
      project: a.project as { id: string; title: string; slug: string } | null,
    },
  }));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          공개 피드
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          강화도에서 방금 쌓인 환대
        </h1>
        <p className="text-sm text-muted-foreground">
          참여자가 공개로 선택한 카드만 모여요. 최근 {cards.length}장.
        </p>
      </header>

      <FilterBar filter={filter} />

      <ActivityGrid
        cards={cards}
        interactive={false}
        empty={
          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            조건에 맞는 공개 카드가 아직 없어요.
          </p>
        }
      />
    </main>
  );
}

type ResolvedFilter =
  | {
      kind: "category";
      slug: string;
      name: string;
      projectIds: string[];
      episodeIds: string[];
    }
  | {
      kind: "project";
      slug: string;
      title: string;
      projectId: string;
      episodeIds: string[];
    }
  | { kind: "shop"; shopId: string; name: string }
  | null;

async function resolveFilter(
  admin: ReturnType<typeof createAdminClient>,
  params: SearchParams
): Promise<ResolvedFilter> {
  // 배타 적용 — project > shop > category 순으로 가장 좁은 필터 우선
  if (params.project) {
    const { data: p } = await admin
      .from("projects")
      .select("id, title, slug, is_public")
      .eq("slug", params.project)
      .maybeSingle();
    if (!p || !p.is_public) return null;
    const { data: eps } = await admin
      .from("episodes")
      .select("id")
      .eq("project_id", p.id as string)
      .eq("is_public", true);
    return {
      kind: "project",
      slug: p.slug as string,
      title: p.title as string,
      projectId: p.id as string,
      episodeIds: (eps ?? []).map((e) => e.id as string),
    };
  }

  if (params.shop && UUID_RE.test(params.shop)) {
    const { data: s } = await admin
      .from("shops")
      .select("id, name, is_public")
      .eq("id", params.shop)
      .maybeSingle();
    if (!s || !s.is_public) return null;
    return { kind: "shop", shopId: s.id as string, name: s.name as string };
  }

  if (params.category) {
    const { data: c } = await admin
      .from("categories")
      .select("id, slug, name")
      .eq("slug", params.category)
      .maybeSingle();
    if (!c) return null;
    const { data: projects } = await admin
      .from("projects")
      .select("id")
      .eq("category_id", c.id as string)
      .eq("is_public", true);
    const projectIds = (projects ?? []).map((p) => p.id as string);
    let episodeIds: string[] = [];
    if (projectIds.length > 0) {
      const { data: eps } = await admin
        .from("episodes")
        .select("id")
        .in("project_id", projectIds)
        .eq("is_public", true);
      episodeIds = (eps ?? []).map((e) => e.id as string);
    }
    return {
      kind: "category",
      slug: c.slug as string,
      name: c.name as string,
      projectIds,
      episodeIds,
    };
  }

  return null;
}

function FilterBar({ filter }: { filter: ResolvedFilter }) {
  if (!filter) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>필터 없음 · 최신순</span>
        <Link
          href="/projects"
          className="rounded-full border border-border bg-background px-3 py-1 transition hover:bg-muted/40"
        >
          프로젝트별 보기
        </Link>
        <Link
          href="/shops"
          className="rounded-full border border-border bg-background px-3 py-1 transition hover:bg-muted/40"
        >
          가게별 보기
        </Link>
      </div>
    );
  }

  const label =
    filter.kind === "project"
      ? `프로젝트 · ${filter.title}`
      : filter.kind === "shop"
        ? `가게 · ${filter.name}`
        : `카테고리 · ${filter.name}`;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 font-medium text-background">
        {label}
      </span>
      <Link
        href="/feed"
        className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground transition hover:bg-muted/40"
      >
        필터 지우기 ×
      </Link>
    </div>
  );
}

function EmptyFeed({
  filter,
  title,
}: {
  filter: ResolvedFilter;
  title: string;
}) {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          공개 피드
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
      </header>
      <FilterBar filter={filter} />
      <p className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        이 필터에는 아직 공개된 카드가 없어요. 필터를 지우고 전체 피드를
        둘러보세요.
      </p>
    </main>
  );
}
