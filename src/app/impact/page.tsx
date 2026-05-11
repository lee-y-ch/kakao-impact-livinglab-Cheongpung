import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { CountUp } from "@/components/v2/CountUp";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  NodeMapClient,
  type CategoryLabel,
  type CategorySlug,
  type GraphEdge,
  type GraphNode,
  type GraphNodeType,
  type ImpactGraph,
} from "./NodeMapClient";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/impact` 강화도 진척 공개 대시보드.
 * 시안: design-v2-reference/강화유니버스_임팩트.html.
 *
 * 공개 페이지 (auth 가드 없음). 6 stat / 카테고리 진척 / 최근 공개 카드 /
 * 공개 activity 기반 관계 노드맵을 service role 로 집계해 렌더.
 */

const FEED_LIMIT = 4;
const GRAPH_ACTIVITY_LIMIT = 80;
const GRAPH_PROJECT_LIMIT = 10;
const GRAPH_SHOP_LIMIT = 10;
const GRAPH_PARTICIPANT_LIMIT = 14;

const SLUG_TO_LABEL: Record<CategorySlug, CategoryLabel> = {
  active_life: "라이프",
  network: "네트워크",
  local_culture: "창작",
  tech: "테크",
};

type FeedActivity = {
  id: string;
  body: string | null;
  created_at: string;
  episode: {
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
  shop: { name: string | null } | null;
};

type ProjectProgressRow = {
  id: string;
  progress_type: string | null;
  progress_target: unknown;
  category: { slug: string | null } | null;
};

type GraphActivity = {
  id: string;
  body: string | null;
  created_at: string;
  author: { id: string; nickname: string | null } | null;
  shop: { id: string; name: string | null; is_public: boolean | null } | null;
  project: {
    id: string;
    title: string | null;
    category: { id: string; slug: string | null; name: string | null } | null;
  } | null;
  episode: {
    id: string;
    project: {
      id: string;
      title: string | null;
      category: { id: string; slug: string | null; name: string | null } | null;
    } | null;
  } | null;
};

export default async function ImpactPage() {
  const admin = createAdminClient();

  type CategoryActivity = {
    episode: {
      project: { category: { slug: string | null } | null } | null;
    } | null;
    project: { category: { slug: string | null } | null } | null;
  };

  const [
    publicCardsRes,
    publicShopsRes,
    usersRes,
    episodesRes,
    lettersRes,
    hiFiveRes,
    feedRes,
    projectsRes,
    earliestActivityRes,
    publicCardsForCategoryRes,
    graphActivitiesRes,
  ] = await Promise.all([
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true)
      .is("removed_at", null),
    admin
      .from("shops")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true),
    admin.from("users").select("id", { count: "exact", head: true }),
    admin.from("episodes").select("id", { count: "exact", head: true }),
    admin
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .eq("kind", "letter")
      .eq("author_role", "owner"),
    admin
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .eq("kind", "hi_five"),
    admin
      .from("activities")
      .select(
        `
        id, body, created_at,
        episode:episodes (
          location,
          project:projects ( title, category:categories ( slug ) )
        ),
        project:projects ( title, category:categories ( slug ) ),
        shop:shops ( name )
      `
      )
      .eq("is_public", true)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(FEED_LIMIT),
    admin
      .from("projects")
      .select("id, progress_type, progress_target, category:categories(slug)")
      .eq("is_public", true),
    admin
      .from("activities")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin
      .from("activities")
      .select(
        `
        episode:episodes ( project:projects ( category:categories ( slug ) ) ),
        project:projects ( category:categories ( slug ) )
      `
      )
      .eq("is_public", true)
      .is("removed_at", null),
    admin
      .from("activities")
      .select(
        `
        id, body, created_at,
        author:user_id ( id, nickname ),
        shop:shop_id ( id, name, is_public ),
        project:project_id ( id, title, category:categories ( id, slug, name ) ),
        episode:episode_id (
          id,
          project:project_id ( id, title, category:categories ( id, slug, name ) )
        )
      `
      )
      .eq("is_public", true)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(GRAPH_ACTIVITY_LIMIT),
  ]);

  const stats = {
    cards: publicCardsRes.count ?? 0,
    shops: publicShopsRes.count ?? 0,
    users: usersRes.count ?? 0,
    episodes: episodesRes.count ?? 0,
    letters: lettersRes.count ?? 0,
    hiFive: hiFiveRes.count ?? 0,
  };

  const feed = (feedRes.data ?? []) as unknown as FeedActivity[];
  const projects = (projectsRes.data ?? []) as unknown as ProjectProgressRow[];
  const allPublic = (publicCardsForCategoryRes.data ??
    []) as unknown as CategoryActivity[];
  const graph = buildImpactGraph(
    (graphActivitiesRes.data ?? []) as unknown as GraphActivity[]
  );

  // 카테고리 진척 — 한 번의 SELECT 로 가져온 공개 카드를 JS 에서 group-by
  const categoryCounts: Record<CategoryLabel, number> = {
    라이프: 0,
    네트워크: 0,
    창작: 0,
    테크: 0,
  };
  const categoryTargets: Record<CategoryLabel, number> = {
    라이프: 0,
    네트워크: 0,
    창작: 0,
    테크: 0,
  };

  for (const a of allPublic) {
    const slug =
      a.episode?.project?.category?.slug ?? a.project?.category?.slug ?? null;
    if (!slug || !(slug in SLUG_TO_LABEL)) continue;
    categoryCounts[SLUG_TO_LABEL[slug as CategorySlug]] += 1;
  }

  for (const p of projects) {
    const slug = p.category?.slug;
    if (!slug || !(slug in SLUG_TO_LABEL)) continue;
    const target = (p.progress_target as { target_cards?: unknown } | null)
      ?.target_cards;
    if (typeof target === "number" && Number.isFinite(target)) {
      categoryTargets[SLUG_TO_LABEL[slug as CategorySlug]] += target;
    }
  }

  const categoryProgress = (
    ["라이프", "네트워크", "창작", "테크"] as CategoryLabel[]
  ).map((label) => {
    const current = categoryCounts[label];
    const total = categoryTargets[label];
    const pct =
      total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    return {
      name: label === "라이프" ? "환대의 라이프" : label,
      label,
      current,
      total,
      pct,
    };
  });

  const earliestIso =
    (earliestActivityRes.data as { created_at?: string } | null)?.created_at ??
    null;

  return (
    <>
      <PageHeader earliestIso={earliestIso} />
      <StatsStrip stats={stats} />
      <NodeMapSection graph={graph} />
      <ProgressSection rows={categoryProgress} />
      <RecentFeed feed={feed} />
      <NoticeStrip />
    </>
  );
}

// ── helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatYearMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysSince(iso: string): number {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.max(0, Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24)));
}

function feedCategoryLabel(f: FeedActivity): CategoryLabel | null {
  const slug =
    f.episode?.project?.category?.slug ?? f.project?.category?.slug ?? null;
  if (!slug || !(slug in SLUG_TO_LABEL)) return null;
  return SLUG_TO_LABEL[slug as CategorySlug];
}

function feedNo(id: string): string {
  return `No.${id.slice(0, 4).toUpperCase()}`;
}

function feedPlace(f: FeedActivity): string {
  if (f.shop?.name) return `@ ${f.shop.name}`;
  if (f.episode?.location) return `@ ${f.episode.location}`;
  return "";
}

function addPreview(node: GraphNode, body: string | null) {
  if (!body || node.previews.length >= 5) return;
  node.previews.push(body.length > 48 ? `${body.slice(0, 47)}…` : body);
}

function edgeKey(source: string, target: string) {
  return `${source}__${target}`;
}

function distributeY(count: number, top = 72, bottom = 368) {
  if (count <= 1) return [220];
  const step = (bottom - top) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(top + step * i));
}

function nodeSort(a: GraphNode, b: GraphNode) {
  return b.count - a.count || a.label.localeCompare(b.label, "ko");
}

function buildImpactGraph(rows: GraphActivity[]): ImpactGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  function ensureNode(
    id: string,
    rawId: string,
    type: GraphNodeType,
    label: string,
    categorySlug: CategorySlug | null
  ) {
    const existing = nodes.get(id);
    if (existing) return existing;
    const node: GraphNode = {
      id,
      rawId,
      type,
      label,
      count: 0,
      previews: [],
      categorySlug,
      x: 0,
      y: 0,
    };
    nodes.set(id, node);
    return node;
  }

  function connect(source: GraphNode | null, target: GraphNode | null) {
    if (!source || !target) return;
    const id = edgeKey(source.id, target.id);
    const existing = edges.get(id);
    if (existing) {
      existing.count += 1;
      return;
    }
    edges.set(id, {
      id,
      source: source.id,
      target: target.id,
      count: 1,
    });
  }

  for (const row of rows) {
    const project = row.project ?? row.episode?.project ?? null;
    const category = project?.category ?? null;
    const categorySlug =
      category?.slug && category.slug in SLUG_TO_LABEL
        ? (category.slug as CategorySlug)
        : null;

    const categoryNode =
      category && categorySlug
        ? ensureNode(
            `category:${category.id}`,
            category.id,
            "category",
            category.name ?? SLUG_TO_LABEL[categorySlug],
            categorySlug
          )
        : null;
    const projectNode = project
      ? ensureNode(
          `project:${project.id}`,
          project.id,
          "project",
          project.title ?? "이름 없는 프로젝트",
          categorySlug
        )
      : null;
    const shopNode =
      row.shop && row.shop.is_public !== false
        ? ensureNode(
            `shop:${row.shop.id}`,
            row.shop.id,
            "shop",
            row.shop.name ?? "이름 없는 가게",
            categorySlug
          )
        : null;
    const participantNode = row.author
      ? ensureNode(
          `participant:${row.author.id}`,
          row.author.id,
          "participant",
          row.author.nickname ?? "이름 없는 참여자",
          categorySlug
        )
      : null;

    for (const node of [categoryNode, projectNode, shopNode, participantNode]) {
      if (!node) continue;
      node.count += 1;
      addPreview(node, row.body);
    }

    connect(categoryNode, projectNode);
    connect(projectNode, shopNode);
    connect(shopNode, participantNode);
  }

  const categories = [...nodes.values()]
    .filter((n) => n.type === "category")
    .sort((a, b) => {
      const order = Object.keys(SLUG_TO_LABEL);
      return (
        order.indexOf(a.categorySlug ?? "") -
        order.indexOf(b.categorySlug ?? "")
      );
    });
  const projects = [...nodes.values()]
    .filter((n) => n.type === "project")
    .sort(nodeSort)
    .slice(0, GRAPH_PROJECT_LIMIT);
  const shops = [...nodes.values()]
    .filter((n) => n.type === "shop")
    .sort(nodeSort)
    .slice(0, GRAPH_SHOP_LIMIT);
  const participants = [...nodes.values()]
    .filter((n) => n.type === "participant")
    .sort(nodeSort)
    .slice(0, GRAPH_PARTICIPANT_LIMIT);

  const visibleNodes = [...categories, ...projects, ...shops, ...participants];
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const columns: Record<GraphNodeType, { x: number; list: GraphNode[] }> = {
    category: { x: 105, list: categories },
    project: { x: 315, list: projects },
    shop: { x: 565, list: shops },
    participant: { x: 790, list: participants },
  };

  for (const { x, list } of Object.values(columns)) {
    const ys = distributeY(list.length);
    list.forEach((node, index) => {
      node.x = x;
      node.y = ys[index] ?? 220;
    });
  }

  return {
    nodes: visibleNodes,
    edges: [...edges.values()].filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    ),
    stats: {
      activities: rows.length,
      categories: categories.length,
      projects: projects.length,
      shops: shops.length,
      participants: participants.length,
    },
  };
}

const CATEGORY_DOT: Record<CategoryLabel, string> = {
  라이프: "#9B6020",
  네트워크: "#3A7A55",
  창작: "#2060C8",
  테크: "#6040A0",
};
const CATEGORY_FILL: Record<CategoryLabel, string> = {
  라이프: "#C4956A",
  네트워크: "#6BAF8A",
  창작: "#88AADD",
  테크: "#A080CC",
};
const CATEGORY_BADGE: Record<CategoryLabel, string> = {
  라이프: "bg-[rgba(180,110,40,0.1)] text-[#9B6020]",
  네트워크: "bg-[rgba(107,175,138,0.12)] text-[#3A7A55]",
  창작: "bg-[rgba(49,130,246,0.1)] text-[#2060C8]",
  테크: "bg-[rgba(130,90,180,0.1)] text-[#6040A0]",
};

// ── presentation ───────────────────────────────────────────────

function PageHeader({ earliestIso }: { earliestIso: string | null }) {
  const todayStr = formatDate(new Date().toISOString());
  const sinceLabel = earliestIso
    ? `RUNNING SINCE ${formatYearMonth(earliestIso)}`
    : "RUNNING SINCE —";
  const daysLabel = earliestIso ? `${daysSince(earliestIso)} DAYS` : "0 DAYS";

  return (
    <div
      className="pt-[100px]"
      style={{
        background:
          "linear-gradient(160deg, #F8F8F6 0%, #F2F2EF 60%, #EDECEA 100%)",
      }}
    >
      <div className="mx-auto max-w-[1280px] px-6 pt-14 lg:px-[60px]">
        <AnimateOnScroll>
          <p className="mb-4 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
            IMPACT · 공개 — 누구나 볼 수 있음
          </p>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.08}>
          <h1
            className="mb-[18px] font-bold leading-[1.1] tracking-[-2px] text-v2-ink"
            style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
          >
            오늘도 빛나는 강화의 <span style={{ color: "#6BAF8A" }}>별빛</span>
          </h1>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.16}>
          <p className="max-w-[520px] text-[15px] font-light leading-[1.8] text-v2-ink3">
            참여자·크루·사장님의 환대 행위가 쌓여 강화도의 서사가 돼요.
            <br />
            좋아요도 순위도 없이, 관계의 모양 그대로.
          </p>
        </AnimateOnScroll>
      </div>
      <AnimateOnScroll delay={0.24}>
        <div className="mx-auto mt-10 flex max-w-[1280px] items-center px-6 pb-12 lg:px-[60px]">
          <span className="text-[11px] font-semibold tracking-[2px] text-[#6BAF8A]">
            ● LIVE
          </span>
          <DateSep />
          <DateBarItem>{todayStr}</DateBarItem>
          <DateSep />
          <DateBarItem>{sinceLabel}</DateBarItem>
          <DateSep />
          <DateBarItem>{daysLabel}</DateBarItem>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

function DateBarItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-normal tracking-[1.5px] text-black/35">
      {children}
    </span>
  );
}

function DateSep() {
  return <div className="mx-4 h-3 w-px bg-black/15" />;
}

function StatsStrip({
  stats,
}: {
  stats: {
    cards: number;
    shops: number;
    users: number;
    episodes: number;
    letters: number;
    hiFive: number;
  };
}) {
  const cells: {
    num: number;
    label: string;
    accent?: boolean;
    href?: string;
  }[] = [
    { num: stats.cards, label: "누적 환대 카드", accent: true },
    { num: stats.shops, label: "연결된 가게", href: "/shops" },
    { num: stats.users, label: "참여자" },
    { num: stats.episodes, label: "에피소드" },
    { num: stats.letters, label: "사장님 편지" },
    { num: stats.hiFive, label: "하이파이브" },
  ];

  return (
    <div className="border-y border-v2-rule" style={{ background: "#F5F4F1" }}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
        <div className="flex items-stretch overflow-x-auto">
          {cells.map((s, i) => {
            const baseClass = `flex flex-1 flex-col items-center justify-center gap-1.5 px-9 py-5 ${
              i < cells.length - 1 ? "border-r border-v2-rule" : ""
            }`;
            const inner = (
              <>
                <p
                  className={`whitespace-nowrap text-[28px] font-bold leading-none tracking-[-1px] ${
                    s.accent ? "text-[#6BAF8A]" : "text-v2-ink"
                  }`}
                >
                  <CountUp target={s.num} />
                </p>
                <p className="whitespace-nowrap text-[12.5px] font-semibold tracking-[-0.2px] text-v2-ink">
                  {s.label}
                </p>
              </>
            );
            if (s.href) {
              return (
                <Link
                  key={s.label}
                  href={s.href}
                  className={`${baseClass} transition-colors hover:bg-white/70`}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <div key={s.label} className={baseClass}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NodeMapSection({ graph }: { graph: ImpactGraph }) {
  return (
    <div className="py-16 lg:py-20" style={{ background: "#EDECEA" }}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
        <div className="mb-12 flex flex-col items-start justify-between gap-10 lg:flex-row">
          <AnimateOnScroll>
            <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
              SECTION 01 — 관계의 지도
            </p>
            <h2
              className="mb-2.5 font-bold leading-[1.25] tracking-[-1px] text-v2-ink"
              style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
            >
              프로젝트·가게·참여자가
              <br />
              어떻게 엮였는지
            </h2>
            <p className="max-w-[420px] text-[13.5px] font-light leading-[1.8] text-v2-ink3">
              노드 하나하나는 사람이고 장소예요.
              <br />
              선은 그들 사이에 오간 환대예요.
              <br />
              단일 지표가 아닌 형태로 임팩트를 읽어보세요.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.16}>
            <div className="flex flex-shrink-0 flex-col gap-2.5 rounded-xl border border-black/[0.06] bg-white px-6 py-5">
              <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[2.5px] text-[#AEAEB2]">
                LIVE GRAPH
              </p>
              <LegendItem color="#6BAF8A" type="dot">
                카테고리·프로젝트 — 환대가 자라는 축
              </LegendItem>
              <LegendItem color="#C4956A" type="dot">
                가게·장소 — 환대가 머무는 점
              </LegendItem>
              <LegendItem color="#AEAEB2" type="dot">
                참여자 — 환대를 만드는 사람
              </LegendItem>
              <LegendItem color="#6BAF8A" type="line">
                환대 연결
              </LegendItem>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-black/[0.06] pt-3 text-[11px] text-[#999]">
                <span>카드 {graph.stats.activities}장</span>
                <span>프로젝트 {graph.stats.projects}개</span>
                <span>가게 {graph.stats.shops}곳</span>
                <span>참여자 {graph.stats.participants}명</span>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
        <AnimateOnScroll delay={0.08}>
          <div className="relative h-[300px] overflow-hidden rounded-[20px] border border-black/[0.06] bg-white lg:h-[460px]">
            <NodeMapClient graph={graph} />
            <p className="absolute bottom-5 right-5 text-[10.5px] tracking-[1px] text-[#AEAEB2]">
              공개 카드 {graph.stats.activities}장 기준 · 노드 hover 시 카드
              미리보기
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  type,
  children,
}: {
  color: string;
  type: "dot" | "line";
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[12px] text-v2-ink3">
      {type === "dot" ? (
        <div
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ background: color }}
        />
      ) : (
        <div
          className="h-[1.5px] w-6 flex-shrink-0 rounded-sm opacity-50"
          style={{ background: color }}
        />
      )}
      <span>{children}</span>
    </div>
  );
}

function ProgressSection({
  rows,
}: {
  rows: {
    name: string;
    label: CategoryLabel;
    current: number;
    total: number;
    pct: number;
  }[];
}) {
  return (
    <div className="bg-v2-paper py-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
        <AnimateOnScroll>
          <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
                SECTION 02 — 카테고리별 진척
              </p>
              <h2
                className="font-bold tracking-[-0.8px] text-v2-ink"
                style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}
              >
                4개 분류가 얼마나 자랐나
              </h2>
            </div>
            <p className="max-w-[280px] text-left text-[13.5px] font-light leading-[1.7] text-[#999] lg:text-right">
              각 카테고리의 목표와 현재 공개 카드 수를 함께 보여줘요. 목표가
              없을 때는 누적 카드 수만 보여줘요.
            </p>
          </div>
        </AnimateOnScroll>
        <div className="overflow-hidden rounded-2xl border border-v2-rule bg-white">
          {rows.map((c, i) => {
            const dot = CATEGORY_DOT[c.label];
            const fill = CATEGORY_FILL[c.label];
            const hasTarget = c.total > 0;
            return (
              <AnimateOnScroll key={c.label} delay={(i + 1) * 0.08}>
                <div
                  className={`grid grid-cols-[100px_1fr_72px] items-center gap-4 px-5 py-6 transition-colors hover:bg-[#FAFAF8] lg:grid-cols-[180px_1fr_96px] lg:gap-8 lg:px-9 lg:py-7 ${
                    i < rows.length - 1 ? "border-b border-v2-rule" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ background: dot }}
                    />
                    <span className="text-[13.5px] font-medium text-v2-ink">
                      {c.name}
                    </span>
                  </div>
                  <div
                    className="relative h-6 overflow-hidden rounded-full"
                    style={{ background: "#EDECEA" }}
                  >
                    <div
                      className="flex h-full min-w-[38px] items-center justify-end rounded-full pr-2 text-[11px] font-semibold text-white transition-[width] duration-[1200ms] ease-out"
                      style={{
                        width: `${hasTarget ? c.pct : Math.min(100, c.current * 4)}%`,
                        background: fill,
                      }}
                    >
                      {hasTarget ? `${c.pct}%` : `${c.current}장`}
                    </div>
                  </div>
                  <span className="text-right text-[12.5px] font-semibold tracking-[-0.3px] text-v2-ink">
                    {hasTarget ? `${c.current} / ${c.total}` : `${c.current}장`}
                  </span>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RecentFeed({ feed }: { feed: FeedActivity[] }) {
  return (
    <div className="py-20" style={{ background: "#F0F0EC" }}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
        <AnimateOnScroll>
          <div className="mb-9 flex items-end justify-between">
            <div>
              <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
                SECTION 03 — 최근 카드
              </p>
              <h2
                className="font-bold tracking-[-0.8px] text-v2-ink"
                style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}
              >
                오늘 강화도에서
                <br />
                일어난 순간들
              </h2>
            </div>
            <Link
              href="/feed"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6BAF8A] transition-all hover:gap-2.5"
            >
              전체 피드 보기 →
            </Link>
          </div>
        </AnimateOnScroll>
        {feed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-v2-rule bg-white/60 px-8 py-16 text-center">
            <p className="mb-1 text-[13.5px] font-semibold text-v2-ink">
              아직 공개된 카드가 없어요.
            </p>
            <p className="text-[13px] font-light leading-[1.7] text-v2-ink3">
              첫 공개 카드가 도착하면 여기에서 바로 볼 수 있어요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {feed.map((c, i) => (
              <AnimateOnScroll key={c.id} delay={(i + 1) * 0.08}>
                <FeedCardView card={c} />
              </AnimateOnScroll>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedCardView({ card }: { card: FeedActivity }) {
  const label = feedCategoryLabel(card);
  const badge = label ? CATEGORY_BADGE[label] : "bg-[#EDECEA] text-[#888]";

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between border-b border-[#F0F0EC] px-[18px] pb-2.5 pt-3.5">
        <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
          {feedNo(card.id)}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[1px] ${badge}`}
        >
          {label ?? "미분류"}
        </span>
      </div>
      <div className="px-[18px] pb-3.5 pt-4">
        <p className="mb-3.5 line-clamp-3 text-[13px] leading-[1.7] text-v2-ink">
          {card.body || "(메모 없음)"}
        </p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] font-light text-[#AEAEB2]">
            {feedPlace(card)}
          </span>
          <span className="text-[11px] font-light text-[#AEAEB2]">
            {formatDate(card.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

function NoticeStrip() {
  return (
    <div
      className="flex items-center justify-center gap-3 px-6 py-5 lg:px-[60px]"
      style={{ background: "#1A1A1A" }}
    >
      <p className="text-center text-[12px] leading-[1.7] tracking-[0.5px] text-white/50">
        <strong className="font-medium text-white/80">
          좋아요 / 팔로우 / 랭킹은 없어요.
        </strong>
        &nbsp;카드는 시간순으로만 흐르고, 공개에 동의한 글만 보여요.
      </p>
    </div>
  );
}
