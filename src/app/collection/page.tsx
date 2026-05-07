import Link from "next/link";
import { redirect } from "next/navigation";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/collection` 내 도감.
 * 시안: design-v2-reference/강화유니버스_도감.html.
 *
 * 시안 markup·디자인 토큰 그대로 유지하며 BOOK_CARDS 하드코딩만
 * 본인 activities Supabase 페치로 교체. 비로그인 시 /login redirect.
 */

type CategorySlug = "active_life" | "network" | "local_culture" | "tech";
type Category = "라이프" | "네트워크" | "창작" | "테크";

const SLUG_TO_LABEL: Record<CategorySlug, Category> = {
  active_life: "라이프",
  network: "네트워크",
  local_culture: "창작",
  tech: "테크",
};

const CATEGORY_ORDER: Category[] = ["라이프", "네트워크", "창작", "테크"];

type CategoryStyle = {
  bg: string;
  badge: string;
  dot: string;
};

const CATEGORY_STYLE: Record<Category, CategoryStyle> = {
  라이프: {
    bg: "linear-gradient(145deg, #C4956A 0%, #A87850 100%)",
    badge: "라이프",
    dot: "#C4956A",
  },
  네트워크: {
    bg: "linear-gradient(145deg, #6BAF8A 0%, #4E9070 100%)",
    badge: "네트워크",
    dot: "#6BAF8A",
  },
  창작: {
    bg: "linear-gradient(145deg, #7BA8D4 0%, #5A88B8 100%)",
    badge: "창작",
    dot: "#88AADD",
  },
  테크: {
    bg: "linear-gradient(145deg, #9A80C8 0%, #7A60A8 100%)",
    badge: "테크",
    dot: "#A080CC",
  },
};

type BookCard = {
  id: string;
  no: string;
  category: Category;
  project: string;
  memo: string;
  place: string;
  date: string;
  letters: number;
  hifive: number;
  isPublic: boolean;
};

type ProgressRow = {
  name: Category;
  current: number;
  total: number;
  pct: number;
};

type NextMoment = {
  title: string;
  project: string;
  dateLabel: string;
  href: string;
};

type ProfileSummary = {
  initial: string;
  nickname: string;
  joinedLabel: string;
  visitsLabel: string;
  totalCards: number;
  totalLetters: number;
  totalHifive: number;
  visitCount: number;
};

type ActivityRow = {
  id: string;
  body: string | null;
  photo_url: string | null;
  is_public: boolean;
  created_at: string;
  type: string;
  episode: {
    id: string | null;
    title: string | null;
    seq: number | null;
    location: string | null;
    project: {
      id: string | null;
      title: string | null;
      slug: string | null;
      category: { slug: string | null; name: string | null } | null;
    } | null;
  } | null;
  project: {
    id: string | null;
    title: string | null;
    slug: string | null;
    category: { slug: string | null; name: string | null } | null;
  } | null;
  shop: {
    id: string | null;
    name: string | null;
    address: string | null;
  } | null;
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams?: { cat?: string };
}) {
  const actor = await getCurrentActor();
  if (actor.role !== "participant") {
    redirect("/login?next=/collection");
  }

  const supabase = createServerSupabase();

  const [activitiesResult, userResult, projectsResult] = await Promise.all([
    supabase
      .from("activities")
      .select(
        `
        id, body, photo_url, is_public, created_at, type,
        episode:episodes (
          id, title, seq, location,
          project:projects (
            id, title, slug,
            category:categories ( slug, name )
          )
        ),
        project:projects (
          id, title, slug,
          category:categories ( slug, name )
        ),
        shop:shops ( id, name, address )
      `
      )
      .eq("user_id", actor.userId)
      .is("removed_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("created_at")
      .eq("id", actor.userId)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id, progress_type, progress_target, category:categories(slug)")
      .eq("is_public", true),
  ]);

  const activities = (activitiesResult.data ?? []) as unknown as ActivityRow[];
  const userRow = userResult.data;
  const rawProjects = projectsResult.data ?? [];

  // reactions on user's activities — fetched in one round-trip, aggregated in JS
  const activityIds = activities.map((a) => a.id);
  const reactionsByActivity = new Map<
    string,
    { letters: number; hifive: number }
  >();
  let totalLetters = 0;
  let totalHifive = 0;

  if (activityIds.length > 0) {
    const { data: rawReactions } = await supabase
      .from("reactions")
      .select("activity_id, kind")
      .in("activity_id", activityIds);

    for (const r of rawReactions ?? []) {
      const m = reactionsByActivity.get(r.activity_id) ?? {
        letters: 0,
        hifive: 0,
      };
      if (r.kind === "letter") {
        m.letters += 1;
        totalLetters += 1;
      } else if (r.kind === "hi_five") {
        m.hifive += 1;
        totalHifive += 1;
      }
      reactionsByActivity.set(r.activity_id, m);
    }
  }

  // 방문 횟수 = distinct created_at 날짜
  const visitDates = new Set<string>();
  for (const a of activities) {
    visitDates.add(a.created_at.slice(0, 10));
  }
  const visitCount = visitDates.size;

  // 카테고리별 카드 수
  const categoryCounts: Record<Category, number> = {
    라이프: 0,
    네트워크: 0,
    창작: 0,
    테크: 0,
  };
  for (const a of activities) {
    const slug = resolveCategorySlug(a);
    if (slug && slug in SLUG_TO_LABEL) {
      categoryCounts[SLUG_TO_LABEL[slug as CategorySlug]] += 1;
    }
  }

  // 카테고리별 목표 카드 수 (progress_target.target_cards 합산)
  const categoryTargets: Record<Category, number> = {
    라이프: 0,
    네트워크: 0,
    창작: 0,
    테크: 0,
  };
  type ProjectProgressRow = {
    progress_type: string | null;
    progress_target: unknown;
    category: { slug: string | null } | null;
  };
  for (const p of rawProjects as unknown as ProjectProgressRow[]) {
    const slug = p.category?.slug;
    if (!slug || !(slug in SLUG_TO_LABEL)) continue;
    const target = (p.progress_target as { target_cards?: unknown } | null)
      ?.target_cards;
    if (typeof target === "number" && Number.isFinite(target)) {
      categoryTargets[SLUG_TO_LABEL[slug as CategorySlug]] += target;
    }
  }

  const progress: ProgressRow[] = CATEGORY_ORDER.map((name) => {
    const current = categoryCounts[name];
    const total = categoryTargets[name];
    const pct =
      total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    return { name, current, total, pct };
  });

  // 다음 회차 — 본인 참여 프로젝트 중 가장 가까운 예정·진행 에피소드
  const userProjectIds = new Set<string>();
  for (const a of activities) {
    const pid = a.episode?.project?.id ?? a.project?.id;
    if (pid) userProjectIds.add(pid);
  }

  let nextEpisode: NextMoment | null = null;
  if (userProjectIds.size > 0) {
    const today = new Date().toISOString().slice(0, 10);
    type NextEpisodeRow = {
      id: string;
      title: string;
      seq: number | null;
      session_date: string | null;
      status: string;
      project: { title: string | null; slug: string | null } | null;
    };
    const { data: nextEps } = await supabase
      .from("episodes")
      .select(
        `id, title, seq, session_date, status,
         project:projects ( title, slug )`
      )
      .in("project_id", [...userProjectIds])
      .in("status", ["planned", "in_progress"])
      .gte("session_date", today)
      .order("session_date", { ascending: true })
      .limit(1);

    const ep = (nextEps as unknown as NextEpisodeRow[] | null)?.[0];
    if (ep) {
      const projectTitle = ep.project?.title ?? "";
      const projectSlug = ep.project?.slug ?? "";
      const projectLine = ep.seq
        ? `${projectTitle} ${ep.seq}회차`
        : projectTitle;
      nextEpisode = {
        title: ep.title,
        project: projectLine,
        dateLabel: ep.session_date ? formatDateRelative(ep.session_date) : "",
        href: projectSlug ? `/projects/${projectSlug}` : "/projects",
      };
    }
  }

  // 카테고리 필터
  const activeFilterLabel = parseCategoryFilter(searchParams?.cat);
  const visibleActivities = activeFilterLabel
    ? activities.filter((a) => {
        const slug = resolveCategorySlug(a);
        return (
          slug != null &&
          slug in SLUG_TO_LABEL &&
          SLUG_TO_LABEL[slug as CategorySlug] === activeFilterLabel
        );
      })
    : activities;

  // BookCard view models — No.XXX 는 user 도감 안에서만 의미 있는 일련번호
  const totalAll = activities.length;
  const indexById = new Map<string, number>();
  activities.forEach((a, i) => indexById.set(a.id, i));

  const cards: BookCard[] = visibleActivities.map((a) => {
    const slug = resolveCategorySlug(a);
    const label =
      slug && slug in SLUG_TO_LABEL
        ? SLUG_TO_LABEL[slug as CategorySlug]
        : "라이프";

    const projectTitle = a.episode?.project?.title ?? a.project?.title ?? "";
    const episodeBit =
      a.episode?.seq != null
        ? `${a.episode.seq}회차`
        : (a.episode?.title ?? "");
    const place = a.shop?.name
      ? `@ ${a.shop.name}`
      : a.episode?.location
        ? `@ ${a.episode.location}`
        : "";
    const reactions = reactionsByActivity.get(a.id) ?? {
      letters: 0,
      hifive: 0,
    };
    const seqInList = totalAll - (indexById.get(a.id) ?? 0);

    return {
      id: a.id,
      no: `No.${String(seqInList).padStart(3, "0")}`,
      category: label,
      project: [projectTitle, episodeBit].filter(Boolean).join(" · ") || "—",
      memo: a.body ?? "",
      place,
      date: formatDate(a.created_at),
      letters: reactions.letters,
      hifive: reactions.hifive,
      isPublic: a.is_public,
    };
  });

  const profile: ProfileSummary = {
    initial: (actor.nickname ?? "여").slice(0, 1),
    nickname: actor.nickname ?? "강화 여행자",
    joinedLabel: userRow?.created_at
      ? `JOINED ${formatJoined(userRow.created_at)}`
      : "JOINED ─",
    visitsLabel: visitCount > 0 ? `강화 ${visitCount}회 방문` : "첫 방문 준비",
    totalCards: activities.length,
    totalLetters,
    totalHifive,
    visitCount,
  };

  return (
    <>
      <CollectionLayout
        profile={profile}
        progress={progress}
        nextEpisode={nextEpisode}
        cards={cards}
        categoryCounts={categoryCounts}
        totalCount={activities.length}
        activeFilter={activeFilterLabel}
      />
      <NoticeStrip />
    </>
  );
}

// ── helpers ────────────────────────────────────────────────────

function resolveCategorySlug(a: ActivityRow): string | null {
  return (
    a.episode?.project?.category?.slug ?? a.project?.category?.slug ?? null
  );
}

function parseCategoryFilter(cat: string | undefined): Category | null {
  const allowed: Category[] = ["라이프", "네트워크", "창작", "테크"];
  if (cat && (allowed as string[]).includes(cat)) return cat as Category;
  return null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

function formatJoined(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "─";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateRelative(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  if (diffDays > 1 && diffDays <= 7) return `${diffDays}일 후`;
  return formatDate(dateStr);
}

// ── presentation (시안 markup 그대로) ─────────────────────────

function CollectionLayout({
  profile,
  progress,
  nextEpisode,
  cards,
  categoryCounts,
  totalCount,
  activeFilter,
}: {
  profile: ProfileSummary;
  progress: ProgressRow[];
  nextEpisode: NextMoment | null;
  cards: BookCard[];
  categoryCounts: Record<Category, number>;
  totalCount: number;
  activeFilter: Category | null;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-[100px] lg:px-[60px]">
      <div className="grid items-start gap-8 pt-8 lg:grid-cols-[260px_1fr] lg:gap-[52px]">
        <Sidebar
          profile={profile}
          progress={progress}
          nextEpisode={nextEpisode}
        />
        <Main
          cards={cards}
          categoryCounts={categoryCounts}
          totalCount={totalCount}
          activeFilter={activeFilter}
        />
      </div>
    </div>
  );
}

function Sidebar({
  profile,
  progress,
  nextEpisode,
}: {
  profile: ProfileSummary;
  progress: ProgressRow[];
  nextEpisode: NextMoment | null;
}) {
  return (
    <aside className="lg:sticky lg:top-[88px]">
      <AnimateOnScroll>
        <ProfileCard profile={profile} />
      </AnimateOnScroll>
      <AnimateOnScroll delay={0.07}>
        <ProgressCard progress={progress} />
      </AnimateOnScroll>
      {nextEpisode && (
        <AnimateOnScroll delay={0.14}>
          <NextMomentCard moment={nextEpisode} />
        </AnimateOnScroll>
      )}
    </aside>
  );
}

function ProfileCard({ profile }: { profile: ProfileSummary }) {
  return (
    <div className="mb-4 rounded-2xl border border-v2-rule bg-white px-6 py-7">
      <div className="mb-1.5 flex items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #6BAF8A, #C4956A)",
          }}
        >
          {profile.initial}
        </div>
        <div>
          <p className="text-[16px] font-bold tracking-[-0.3px]">
            {profile.nickname}
          </p>
          <p className="text-[11.5px] font-light text-[#AEAEB2]">
            {profile.joinedLabel} · {profile.visitsLabel}
          </p>
        </div>
      </div>
      <div className="my-3.5 border-t border-[#F0F0EC] pt-3.5" />
      <div className="grid grid-cols-2 gap-2.5">
        <ProfileStat num={profile.totalCards} label="모은 카드" />
        <ProfileStat num={profile.totalLetters} label="받은 편지" sub="💌" />
        <ProfileStat num={profile.totalHifive} label="하이파이브" sub="★" />
        <ProfileStat num={profile.visitCount} label="방문 횟수" />
      </div>
    </div>
  );
}

function ProfileStat({
  num,
  label,
  sub,
}: {
  num: number;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[10px] bg-[#F8F8F6] px-3.5 py-3">
      <p className="mb-1 text-[22px] font-bold leading-none tracking-[-0.8px] text-v2-ink">
        {num}
      </p>
      <p className="text-[10.5px] font-light text-[#AEAEB2]">{label}</p>
      {sub && (
        <p className="mt-0.5 text-[10px] font-medium text-[#6BAF8A]">{sub}</p>
      )}
    </div>
  );
}

function ProgressCard({ progress }: { progress: ProgressRow[] }) {
  return (
    <div className="mb-4 rounded-2xl border border-v2-rule bg-white px-6 py-5">
      <p className="mb-4 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
        MY PROGRESS
      </p>
      {progress.map((p, i) => {
        const hasTarget = p.total > 0;
        return (
          <div key={p.name} className={i < progress.length - 1 ? "mb-3.5" : ""}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium">
                <span
                  className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                  style={{ background: CATEGORY_STYLE[p.name].dot }}
                />
                {p.name}
              </span>
              <span className="text-[11px] font-light text-[#AEAEB2]">
                {hasTarget ? `${p.current} / ${p.total}` : `${p.current}장`}
              </span>
            </div>
            <div
              className="h-[5px] overflow-hidden rounded-full"
              style={{ background: "#EDECEA" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-[1200ms] ease-out"
                style={{
                  width: `${p.pct}%`,
                  background: CATEGORY_STYLE[p.name].dot,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NextMomentCard({ moment }: { moment: NextMoment }) {
  return (
    <div className="rounded-2xl px-6 py-5" style={{ background: "#1A1A1A" }}>
      <p className="mb-3 text-[9.5px] font-semibold uppercase tracking-[3px] text-white/35">
        NEXT MOMENT
      </p>
      <p className="mb-1 text-[14px] font-semibold leading-[1.5] text-white/85">
        {moment.title}
      </p>
      <p className="mb-4 text-[11.5px] font-light leading-[1.6] text-white/40">
        {[moment.project, moment.dateLabel].filter(Boolean).join(" · ")}
      </p>
      <Link
        href={moment.href}
        className="inline-block rounded-full bg-[#6BAF8A] px-[18px] py-2 text-[12px] font-medium text-v2-ink transition-colors hover:bg-[#5A9B78]"
      >
        자세히 보기 →
      </Link>
    </div>
  );
}

function Main({
  cards,
  categoryCounts,
  totalCount,
  activeFilter,
}: {
  cards: BookCard[];
  categoryCounts: Record<Category, number>;
  totalCount: number;
  activeFilter: Category | null;
}) {
  return (
    <main>
      <AnimateOnScroll>
        <div className="mb-7 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
              MY COLLECTION
            </p>
            <h1
              className="font-bold leading-[1.2] tracking-[-1px] text-v2-ink"
              style={{ fontSize: "clamp(26px, 3vw, 38px)" }}
            >
              내가 강화도에서
              <br />
              모은 순간들
            </h1>
          </div>
          <div className="flex flex-shrink-0 gap-1 rounded-[10px] bg-[#EDECEA] p-1">
            <ViewTab active>⊞ 그리드</ViewTab>
            <ViewTab>☰ 리스트</ViewTab>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.07}>
        <div className="mb-6 flex flex-wrap gap-1.5">
          <CategoryFilter href="/collection" active={!activeFilter}>
            전체 {totalCount}
          </CategoryFilter>
          {CATEGORY_ORDER.map((name) => (
            <CategoryFilter
              key={name}
              href={`/collection?cat=${encodeURIComponent(name)}`}
              active={activeFilter === name}
              dot={CATEGORY_STYLE[name].dot}
            >
              {name} {categoryCounts[name]}
            </CategoryFilter>
          ))}
        </div>
      </AnimateOnScroll>

      {cards.length === 0 ? (
        <EmptyState hasFilter={!!activeFilter} />
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <AnimateOnScroll key={card.id} delay={((i % 3) + 1) * 0.07}>
              <BookCardView card={card} />
            </AnimateOnScroll>
          ))}
        </div>
      )}
    </main>
  );
}

function ViewTab({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 rounded-[7px] px-3.5 py-[7px] text-[12.5px] transition-colors ${
        active
          ? "bg-white font-medium text-v2-ink shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          : "font-normal text-[#888]"
      }`}
    >
      {children}
    </button>
  );
}

function CategoryFilter({
  href,
  active,
  dot,
  children,
}: {
  href: string;
  active?: boolean;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] transition-colors ${
        active
          ? "border-v2-ink bg-v2-ink font-medium text-white"
          : "border-v2-rule bg-white text-v2-ink3 hover:bg-[#EDECEA]"
      }`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dot }}
        />
      )}
      {children}
    </Link>
  );
}

function BookCardView({ card }: { card: BookCard }) {
  const style = CATEGORY_STYLE[card.category];
  return (
    <Link
      href={`/collection/${card.id}`}
      className="group relative block cursor-pointer transition-transform duration-[280ms] hover:-translate-y-1.5"
    >
      {/* 뒤에 삐져나온 종이들 */}
      <div className="pointer-events-none absolute inset-x-4 -bottom-0.5 z-0 h-full">
        <div
          className="absolute -left-[7px] -right-[7px] bottom-0 h-full rounded-[3px_3px_6px_6px] border border-black/[0.07]"
          style={{
            background: "#F0EDE8",
            transform: "rotate(-2.5deg)",
            transformOrigin: "bottom center",
          }}
        />
        <div
          className="absolute -left-1 -right-1 bottom-0 h-full rounded-[3px_3px_6px_6px] border border-black/[0.07]"
          style={{
            background: "#F5F3EF",
            transform: "rotate(-1.2deg)",
            transformOrigin: "bottom center",
          }}
        />
        <div
          className="absolute -left-0.5 -right-0.5 bottom-0 h-full rounded-[3px_3px_6px_6px] border border-black/[0.07]"
          style={{
            background: "#FAF9F7",
            transform: "rotate(0.5deg)",
            transformOrigin: "bottom center",
          }}
        />
      </div>

      {/* 책 표지 */}
      <div
        className="relative z-10 overflow-visible rounded-[4px_10px_10px_4px]"
        style={{
          background: style.bg,
          boxShadow:
            "-4px 0 0 0 rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* 책등 */}
        <span
          className="pointer-events-none absolute bottom-0 left-0 top-0 w-3.5 rounded-[4px_0_0_4px]"
          style={{ background: "rgba(0,0,0,0.18)" }}
          aria-hidden
        />

        <div className="flex items-start justify-between px-4 pb-2.5 pl-[22px] pt-4">
          <span className="text-[10px] font-semibold tracking-[2px] text-white/55">
            {card.no}
          </span>
          <span className="inline-block rotate-[8deg] rounded-[3px] border border-white/40 px-1.5 py-0.5 text-[8px] font-bold tracking-[1.2px] text-white/60">
            {card.isPublic ? "공개" : "비공개"}
          </span>
        </div>

        <div className="px-4 pb-3.5 pl-[22px] pt-1">
          <span className="mb-2.5 inline-block rounded-[3px] bg-white/[0.18] px-2 py-[3px] text-[9px] font-semibold tracking-[0.8px] text-white/85">
            {style.badge}
          </span>
          <p className="mb-2 text-[10px] font-normal text-white/50">
            {card.project}
          </p>
          <p
            className="mb-4 line-clamp-3 text-[13px] font-medium leading-[1.65] text-white"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
          >
            {card.memo || "(메모 없음)"}
          </p>
          <div className="flex items-center justify-between border-t border-white/15 pt-3">
            <span className="text-[10.5px] font-light text-white/60">
              {card.place || " "}
            </span>
            <span className="text-[10.5px] font-light text-white/50">
              {card.date}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-4 pb-3.5 pl-[22px] pt-2.5">
          <span className="text-[10.5px] font-normal text-white/70">
            💌 +{card.letters}
          </span>
          <span className="text-[10.5px] font-normal text-white/70">
            ★ {card.hifive}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-v2-rule bg-white/50 px-8 py-16 text-center">
      <p className="mb-2 text-[14px] font-semibold text-v2-ink">
        {hasFilter
          ? "이 카테고리에는 아직 카드가 없어요."
          : "아직 모은 카드가 없어요."}
      </p>
      <p className="text-[12.5px] font-light leading-[1.7] text-v2-ink3">
        {hasFilter
          ? "다른 카테고리를 둘러봐도 좋아요."
          : "강화도 가게에서 QR을 스캔해 첫 카드를 발급해보세요."}
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
          카드는 기본 비공개입니다.
        </strong>
        &nbsp;본인이 공개로 설정한 카드만 피드에 노출됩니다.
      </p>
    </div>
  );
}
