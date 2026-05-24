import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { createAdminClient } from "@/lib/supabase/admin";

import { FeedCardGrid, type FeedCardItem } from "./FeedCardGrid";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/feed` 공개 피드.
 * 시안: design-v2-reference/강화유니버스_피드.html.
 *
 * 공개 페이지 (auth 가드 없음). 시간 역순 공개 카드만, query param 으로
 * 카테고리·기간 필터. 좋아요/팔로우/댓글/랭킹 금지 (CLAUDE.md 게임 규칙 ④).
 *
 * 청풍 피드백 반영:
 *   - 작성자(닉네임·역할) 카드에 노출
 *   - 카드 클릭 시 모달 상세 (FeedCardGrid 클라이언트 컴포넌트로 분리)
 *   - PLACES 가게 등장 순위 섹션 제거 (경쟁 회피)
 */

const FEED_LIMIT = 50;

type CategorySlug = "active_life" | "network" | "local_culture" | "tech";
type CategoryLabel = "라이프" | "네트워크" | "창작" | "테크";

const SLUG_TO_LABEL: Record<CategorySlug, CategoryLabel> = {
  active_life: "라이프",
  network: "네트워크",
  local_culture: "창작",
  tech: "테크",
};

const CATEGORY_DOT: Record<CategoryLabel, string> = {
  라이프: "#C4956A",
  네트워크: "#6BAF8A",
  창작: "#88AADD",
  테크: "#A080CC",
};

const PERIODS: {
  value: "all" | "7d" | "30d" | "90d" | "year";
  label: string;
}[] = [
  { value: "all", label: "전체" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
  { value: "90d", label: "90일" },
  { value: "year", label: "올해" },
];

type Period = (typeof PERIODS)[number]["value"];

type FeedActivity = {
  id: string;
  body: string | null;
  photo_url: string | null;
  created_at: string;
  episode: {
    seq: number | null;
    title: string | null;
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
  author: { nickname: string | null } | null;
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: { cat?: string; period?: string };
}) {
  const admin = createAdminClient();

  const activeCategory = parseCategory(searchParams?.cat);
  const activePeriod = parsePeriod(searchParams?.period);
  const periodCutoff = periodCutoffIso(activePeriod);

  let query = admin
    .from("activities")
    .select(
      `
      id, body, photo_url, created_at,
      episode:episodes (
        seq, title, location,
        project:projects ( title, category:categories ( slug ) )
      ),
      project:projects ( title, category:categories ( slug ) ),
      shop:shops ( name ),
      author:user_id ( nickname )
    `
    )
    .eq("is_public", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  if (periodCutoff) {
    query = query.gte("created_at", periodCutoff);
  }

  const { data: rawActivities } = await query.limit(
    activeCategory ? 500 : FEED_LIMIT
  );
  const allInPeriod = (rawActivities ?? []) as unknown as FeedActivity[];

  const filtered = activeCategory
    ? allInPeriod.filter((a) => labelOf(a) === activeCategory)
    : allInPeriod;
  const visible = filtered.slice(0, FEED_LIMIT);

  // 카테고리별 카운트 (현재 기간 한정)
  const categoryCounts: Record<CategoryLabel, number> = {
    라이프: 0,
    네트워크: 0,
    창작: 0,
    테크: 0,
  };
  for (const a of allInPeriod) {
    const label = labelOf(a);
    if (label) categoryCounts[label] += 1;
  }
  const totalInPeriod = allInPeriod.length;

  const cardItems: FeedCardItem[] = visible.map((a) => ({
    id: a.id,
    body: a.body,
    photoUrl: a.photo_url,
    createdAt: a.created_at,
    categoryLabel: labelOf(a),
    projectLine: projectLine(a),
    place: feedPlace(a),
    authorNickname: a.author?.nickname?.trim() || "강화 여행자",
    // 카드 작성자는 카드 발급 권한상 항상 참여자(participant)임.
    // 청풍 피드백 — "크루/사장님/게스트 누구 중에 쓴지 모르겠다" 의문 해소를 위해 명시.
    authorRoleLabel: "참여자",
  }));

  return (
    <>
      <FeedLayout
        cards={cardItems}
        totalInPeriod={totalInPeriod}
        categoryCounts={categoryCounts}
        activeCategory={activeCategory}
        activePeriod={activePeriod}
      />
      <NoticeStrip />
    </>
  );
}

// ── helpers ────────────────────────────────────────────────────

function parseCategory(cat: string | undefined): CategoryLabel | null {
  if (!cat) return null;
  const allowed: CategoryLabel[] = ["라이프", "네트워크", "창작", "테크"];
  return (allowed as string[]).includes(cat) ? (cat as CategoryLabel) : null;
}

function parsePeriod(p: string | undefined): Period {
  if (!p) return "all";
  return (PERIODS.map((x) => x.value) as string[]).includes(p)
    ? (p as Period)
    : "all";
}

function periodCutoffIso(period: Period): string | null {
  if (period === "all") return null;
  const d = new Date();
  if (period === "year") {
    return new Date(d.getFullYear(), 0, 1).toISOString();
  }
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const cutoff = new Date(d.getTime() - days * 24 * 60 * 60 * 1000);
  return cutoff.toISOString();
}

function labelOf(a: FeedActivity): CategoryLabel | null {
  const slug =
    a.episode?.project?.category?.slug ?? a.project?.category?.slug ?? null;
  if (!slug || !(slug in SLUG_TO_LABEL)) return null;
  return SLUG_TO_LABEL[slug as CategorySlug];
}

function projectLine(a: FeedActivity): string {
  const projectTitle = a.episode?.project?.title ?? a.project?.title ?? "";
  const seq = a.episode?.seq;
  const epTitle = a.episode?.title;
  if (projectTitle && seq != null) return `${projectTitle} · ${seq}회차`;
  if (projectTitle && epTitle) return `${projectTitle} · ${epTitle}`;
  if (projectTitle) return projectTitle;
  return "프로젝트 미연결";
}

function feedPlace(a: FeedActivity): string {
  if (a.shop?.name) return `@ ${a.shop.name}`;
  if (a.episode?.location) return `@ ${a.episode.location}`;
  return "";
}

function buildHref(category: CategoryLabel | null, period: Period): string {
  const params = new URLSearchParams();
  if (category) params.set("cat", category);
  if (period !== "all") params.set("period", period);
  const qs = params.toString();
  return qs ? `/feed?${qs}` : "/feed";
}

// ── presentation ───────────────────────────────────────────────

function FeedLayout({
  cards,
  totalInPeriod,
  categoryCounts,
  activeCategory,
  activePeriod,
}: {
  cards: FeedCardItem[];
  totalInPeriod: number;
  categoryCounts: Record<CategoryLabel, number>;
  activeCategory: CategoryLabel | null;
  activePeriod: Period;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-[100px] lg:px-[60px]">
      <div className="grid items-start gap-8 pt-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        <Sidebar
          totalInPeriod={totalInPeriod}
          categoryCounts={categoryCounts}
          activeCategory={activeCategory}
          activePeriod={activePeriod}
        />
        <Main
          cards={cards}
          activeCategory={activeCategory}
          activePeriod={activePeriod}
        />
      </div>
    </div>
  );
}

function Sidebar({
  totalInPeriod,
  categoryCounts,
  activeCategory,
  activePeriod,
}: {
  totalInPeriod: number;
  categoryCounts: Record<CategoryLabel, number>;
  activeCategory: CategoryLabel | null;
  activePeriod: Period;
}) {
  const allLabels: CategoryLabel[] = ["라이프", "네트워크", "창작", "테크"];

  return (
    <aside className="lg:sticky lg:top-[88px]">
      <AnimateOnScroll>
        <SidebarBlock label="CATEGORY">
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link
                href={buildHref(null, activePeriod)}
                className={`flex select-none items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  !activeCategory
                    ? "bg-v2-ink font-medium text-white"
                    : "text-v2-ink3 hover:bg-[#EDECEA] hover:text-v2-ink"
                }`}
              >
                <span>전체</span>
                <span className="text-[11px] opacity-50">{totalInPeriod}</span>
              </Link>
            </li>
            {allLabels.map((label) => (
              <li key={label}>
                <Link
                  href={buildHref(label, activePeriod)}
                  className={`flex select-none items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    activeCategory === label
                      ? "bg-v2-ink font-medium text-white"
                      : "text-v2-ink3 hover:bg-[#EDECEA] hover:text-v2-ink"
                  }`}
                >
                  <span className="flex items-center">
                    <span
                      className="mr-2 h-[7px] w-[7px] flex-shrink-0 rounded-full"
                      style={{ background: CATEGORY_DOT[label] }}
                    />
                    {label === "라이프" ? "환대의 라이프" : label}
                  </span>
                  <span className="text-[11px] opacity-50">
                    {categoryCounts[label]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SidebarBlock>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.07}>
        <SidebarBlock label="PERIOD">
          <ul className="flex flex-col gap-0.5">
            {PERIODS.map((p) => {
              const active = activePeriod === p.value;
              return (
                <li key={p.value}>
                  <Link
                    href={buildHref(activeCategory, p.value)}
                    className={`block select-none rounded-lg px-3 py-[7px] text-[13px] transition-colors ${
                      active
                        ? "bg-[#EDECEA] font-medium text-v2-ink"
                        : "text-v2-ink3 hover:bg-[#EDECEA] hover:text-v2-ink"
                    }`}
                  >
                    {p.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SidebarBlock>
      </AnimateOnScroll>
    </aside>
  );
}

function SidebarBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-9 last:mb-0">
      <p className="mb-3.5 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
        {label}
      </p>
      {children}
    </div>
  );
}

function Main({
  cards,
  activeCategory,
  activePeriod,
}: {
  cards: FeedCardItem[];
  activeCategory: CategoryLabel | null;
  activePeriod: Period;
}) {
  const periodLabel =
    PERIODS.find((p) => p.value === activePeriod)?.label ?? "전체";

  return (
    <main>
      <AnimateOnScroll>
        <div className="mb-8">
          <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
            PUBLIC FEED · 공개로 표시된 카드만
          </p>
          <h1
            className="mb-2.5 font-bold leading-[1.15] tracking-[-1.2px] text-v2-ink"
            style={{ fontSize: "clamp(28px, 3.5vw, 42px)" }}
          >
            오늘 강화도에서
            <br />
            일어난 순간들
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#AEAEB2]">
            <span>{cards.length}장</span>
            <Dot />
            <span>경쟁 없음</span>
            <Dot />
            <span>좋아요 없음</span>
            <Dot />
            <span>시간순</span>
            {(activeCategory || activePeriod !== "all") && (
              <>
                <Dot />
                <span className="font-medium text-v2-ink3">
                  필터: {activeCategory ?? "전체"}
                  {activePeriod !== "all" ? ` · ${periodLabel}` : ""}
                </span>
              </>
            )}
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.14}>
        <div className="mb-5 flex items-center justify-between border-b border-v2-rule pb-4">
          <span className="text-[12px] text-[#AEAEB2]">
            카드{" "}
            <strong className="font-semibold text-v2-ink">
              {cards.length}
            </strong>
            장
          </span>
          <span className="text-[12px] text-v2-ink3">최근순 ↓</span>
        </div>
      </AnimateOnScroll>

      {cards.length === 0 ? (
        <EmptyState
          activeCategory={activeCategory}
          activePeriod={activePeriod}
        />
      ) : (
        <FeedCardGrid cards={cards} />
      )}

      {cards.length === FEED_LIMIT ? (
        <p className="mt-10 text-center text-[11.5px] font-light text-[#AEAEB2]">
          최근 {FEED_LIMIT}장만 보여드려요. 더 많은 기록은 카테고리·기간 필터로
          좁혀보세요.
        </p>
      ) : null}
    </main>
  );
}

function Dot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-[#D0D0D0]" />;
}

function EmptyState({
  activeCategory,
  activePeriod,
}: {
  activeCategory: CategoryLabel | null;
  activePeriod: Period;
}) {
  const filtered = activeCategory || activePeriod !== "all";
  return (
    <div className="rounded-2xl border border-dashed border-v2-rule bg-white/60 px-8 py-16 text-center">
      <p className="mb-1 text-[13.5px] font-semibold text-v2-ink">
        {filtered
          ? "이 조건에 해당하는 카드가 없어요."
          : "아직 공개된 카드가 없어요."}
      </p>
      <p className="text-[12px] font-light leading-[1.7] text-v2-ink3">
        {filtered ? (
          <>
            <Link href="/feed" className="text-[#6BAF8A] hover:underline">
              필터를 풀고
            </Link>{" "}
            다른 카드를 둘러봐도 좋아요.
          </>
        ) : (
          "첫 공개 카드가 도착하면 여기에서 바로 볼 수 있어요."
        )}
      </p>
    </div>
  );
}

function NoticeStrip() {
  return (
    <div
      className="flex items-center justify-center px-6 py-5 lg:px-[60px]"
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
