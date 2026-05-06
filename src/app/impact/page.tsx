import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { CountUp } from "@/components/v2/CountUp";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/impact` 강화도 진척 공개 대시보드.
 * 시안: design-v2-reference/강화유니버스_임팩트.html.
 *
 * 공개 페이지 (auth 가드 없음). 6 stat / 카테고리 진척 / 최근 공개 카드를
 * service role 로 집계해 시연용 노드맵 SVG (정적 좌표) 와 함께 렌더.
 *
 * 노드맵은 D3/React Flow 도입 전까지 시연용 정적 좌표 유지 — 시안 그대로.
 */

const FEED_LIMIT = 4;

type CategorySlug = "commons" | "network" | "world" | "policy";
type CategoryLabel = "공유지" | "네트워크" | "세계" | "정책";

const SLUG_TO_LABEL: Record<CategorySlug, CategoryLabel> = {
  commons: "공유지",
  network: "네트워크",
  world: "세계",
  policy: "정책",
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

  // 카테고리 진척 — 한 번의 SELECT 로 가져온 공개 카드를 JS 에서 group-by
  const categoryCounts: Record<CategoryLabel, number> = {
    공유지: 0,
    네트워크: 0,
    세계: 0,
    정책: 0,
  };
  const categoryTargets: Record<CategoryLabel, number> = {
    공유지: 0,
    네트워크: 0,
    세계: 0,
    정책: 0,
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
    ["공유지", "네트워크", "세계", "정책"] as CategoryLabel[]
  ).map((label) => {
    const current = categoryCounts[label];
    const total = categoryTargets[label];
    const pct =
      total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    return {
      name: label === "공유지" ? "환대의 공유지" : label,
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
      <NodeMapSection />
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

const CATEGORY_DOT: Record<CategoryLabel, string> = {
  공유지: "#9B6020",
  네트워크: "#3A7A55",
  세계: "#2060C8",
  정책: "#6040A0",
};
const CATEGORY_FILL: Record<CategoryLabel, string> = {
  공유지: "#C4956A",
  네트워크: "#6BAF8A",
  세계: "#88AADD",
  정책: "#A080CC",
};
const CATEGORY_BADGE: Record<CategoryLabel, string> = {
  공유지: "bg-[rgba(180,110,40,0.1)] text-[#9B6020]",
  네트워크: "bg-[rgba(107,175,138,0.12)] text-[#3A7A55]",
  세계: "bg-[rgba(49,130,246,0.1)] text-[#2060C8]",
  정책: "bg-[rgba(130,90,180,0.1)] text-[#6040A0]",
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
            참여자·크루·사장님의 환대 행위가 쌓여 강화도의 서사가 됩니다.
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
  const cells: { num: number; label: string; accent?: boolean }[] = [
    { num: stats.cards, label: "누적 환대 카드", accent: true },
    { num: stats.shops, label: "연결된 가게" },
    { num: stats.users, label: "참여자" },
    { num: stats.episodes, label: "에피소드" },
    { num: stats.letters, label: "사장님 편지" },
    { num: stats.hiFive, label: "하이파이브" },
  ];

  return (
    <div className="border-y border-v2-rule" style={{ background: "#F5F4F1" }}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
        <div className="flex items-stretch overflow-x-auto">
          {cells.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-1 flex-col items-center justify-center gap-1.5 px-9 py-5 ${
                i < cells.length - 1 ? "border-r border-v2-rule" : ""
              }`}
            >
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NodeMapSection() {
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
              노드 하나하나는 사람이고 장소입니다.
              <br />
              선은 그들 사이에 오간 환대입니다.
              <br />
              단일 지표가 아닌 형태로 임팩트를 읽어보세요.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.16}>
            <div className="flex flex-shrink-0 flex-col gap-2.5 rounded-xl border border-black/[0.06] bg-white px-6 py-5">
              <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[2.5px] text-[#AEAEB2]">
                LEGEND
              </p>
              <LegendItem color="#6BAF8A" type="dot">
                프로젝트 — 환대가 자라는 축
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
            </div>
          </AnimateOnScroll>
        </div>
        <AnimateOnScroll delay={0.08}>
          <div className="relative h-[300px] overflow-hidden rounded-[20px] border border-black/[0.06] bg-white lg:h-[460px]">
            <NodeMapSvg />
            <p className="absolute bottom-5 right-5 text-[10.5px] tracking-[1px] text-[#AEAEB2]">
              시연용 정적 시각화
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

function NodeMapSvg() {
  return (
    <svg
      viewBox="0 0 900 440"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
    >
      <line
        x1="260"
        y1="180"
        x2="450"
        y2="120"
        stroke="#6BAF8A"
        strokeWidth={2}
        opacity={0.4}
        fill="none"
      />
      <line
        x1="260"
        y1="180"
        x2="640"
        y2="200"
        stroke="#6BAF8A"
        strokeWidth={2}
        opacity={0.4}
        fill="none"
      />
      <line
        x1="450"
        y1="120"
        x2="640"
        y2="200"
        stroke="#6BAF8A"
        strokeWidth={2}
        opacity={0.4}
        fill="none"
      />
      {[
        ["260", "180", "140", "280"],
        ["260", "180", "340", "300"],
        ["450", "120", "560", "60"],
        ["450", "120", "360", "50"],
        ["640", "200", "760", "140"],
        ["640", "200", "740", "310"],
        ["140", "280", "80", "370"],
        ["340", "300", "420", "380"],
        ["740", "310", "820", "380"],
        ["560", "60", "680", "60"],
      ].map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}-${y1}-${x2}-${y2}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={1.5}
          fill="none"
        />
      ))}
      <circle cx="260" cy="180" r="26" fill="#6BAF8A" opacity="0.9" />
      <text
        x="260"
        y="216"
        textAnchor="middle"
        fontSize="11"
        fill="#1A1A1A"
        fontWeight={500}
      >
        시부야 교류
      </text>
      <circle cx="450" cy="120" r="22" fill="#6BAF8A" opacity="0.85" />
      <text
        x="450"
        y="154"
        textAnchor="middle"
        fontSize="11"
        fill="#1A1A1A"
        fontWeight={500}
      >
        해녀 학교
      </text>
      <circle cx="640" cy="200" r="20" fill="#6BAF8A" opacity="0.8" />
      <text
        x="640"
        y="232"
        textAnchor="middle"
        fontSize="11"
        fill="#1A1A1A"
        fontWeight={500}
      >
        한달살기
      </text>
      <circle cx="140" cy="280" r="14" fill="#C4956A" />
      <text
        x="140"
        y="304"
        textAnchor="middle"
        fontSize="10"
        fill="#888"
        fontWeight={300}
      >
        갯벌카페
      </text>
      <circle cx="340" cy="300" r="12" fill="#C4956A" />
      <text
        x="340"
        y="322"
        textAnchor="middle"
        fontSize="10"
        fill="#888"
        fontWeight={300}
      >
        약초당
      </text>
      <circle cx="760" cy="140" r="12" fill="#C4956A" />
      <text
        x="760"
        y="162"
        textAnchor="middle"
        fontSize="10"
        fill="#888"
        fontWeight={300}
      >
        온수리카페
      </text>
      <circle cx="740" cy="310" r="11" fill="#C4956A" />
      <text
        x="740"
        y="332"
        textAnchor="middle"
        fontSize="10"
        fill="#888"
        fontWeight={300}
      >
        공유 주방
      </text>
      <circle cx="80" cy="370" r="8" fill="#B8B8B8" />
      <circle cx="420" cy="380" r="8" fill="#B8B8B8" />
      <circle cx="820" cy="380" r="8" fill="#B8B8B8" />
      <circle cx="560" cy="60" r="8" fill="#B8B8B8" />
      <circle cx="360" cy="50" r="8" fill="#B8B8B8" />
      <circle cx="680" cy="60" r="8" fill="#B8B8B8" />
      <text
        x="80"
        y="394"
        textAnchor="middle"
        fontSize="10"
        fill="#888"
        fontWeight={300}
      >
        풀잎
      </text>
      <text
        x="420"
        y="400"
        textAnchor="middle"
        fontSize="10"
        fill="#888"
        fontWeight={300}
      >
        현주
      </text>
      <text
        x="820"
        y="400"
        textAnchor="middle"
        fontSize="10"
        fill="#888"
        fontWeight={300}
      >
        Yui
      </text>
    </svg>
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
            <p className="max-w-[260px] text-left text-[13px] font-light leading-[1.7] text-[#999] lg:text-right">
              각 카테고리의 목표 대비 현재 공개 카드 수입니다. 목표가 아직
              설정되지 않은 카테고리는 누적 카드 수만 표시됩니다.
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
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: "#EDECEA" }}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-[1200ms] ease-out"
                      style={{
                        width: `${hasTarget ? c.pct : Math.min(100, c.current * 4)}%`,
                        background: fill,
                      }}
                    />
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
            <p className="text-[12px] font-light leading-[1.7] text-v2-ink3">
              첫 공개 카드가 도착하면 여기 자동으로 모입니다.
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
          좋아요 / 팔로우 / 랭킹은 없습니다.
        </strong>
        &nbsp;카드는 시간순으로만 흐르고, 공개로 동의한 글만 보입니다.
      </p>
    </div>
  );
}
