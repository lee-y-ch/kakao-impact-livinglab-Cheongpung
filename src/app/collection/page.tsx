import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";

/**
 * v2 redesign — `/collection` 내 도감.
 * 시안: design-v2-reference/강화유니버스_도감.html.
 *
 * 레이아웃: 좌 사이드바(프로필 + 진척 + 다음 회차) + 우 도감 그리드.
 * 책 표지 형태의 4가지 카테고리별 그라디언트 카드.
 */

type Category = "공유지" | "네트워크" | "세계" | "정책";

type BookCard = {
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

type CategoryStyle = {
  bg: string;
  badge: string;
  dot: string;
};

const CATEGORY_STYLE: Record<Category, CategoryStyle> = {
  공유지: {
    bg: "linear-gradient(145deg, #C4956A 0%, #A87850 100%)",
    badge: "공유지",
    dot: "#C4956A",
  },
  네트워크: {
    bg: "linear-gradient(145deg, #6BAF8A 0%, #4E9070 100%)",
    badge: "네트워크",
    dot: "#6BAF8A",
  },
  세계: {
    bg: "linear-gradient(145deg, #7BA8D4 0%, #5A88B8 100%)",
    badge: "세계",
    dot: "#88AADD",
  },
  정책: {
    bg: "linear-gradient(145deg, #9A80C8 0%, #7A60A8 100%)",
    badge: "정책",
    dot: "#A080CC",
  },
};

const PROGRESS = [
  { name: "공유지" as Category, current: 8, total: 12, pct: 67 },
  { name: "네트워크" as Category, current: 5, total: 10, pct: 50 },
  { name: "세계" as Category, current: 3, total: 8, pct: 38 },
  { name: "정책" as Category, current: 2, total: 6, pct: 33 },
];

const BOOK_CARDS: BookCard[] = [
  {
    no: "No.284",
    category: "네트워크",
    project: "시부야 교류 · 3회차",
    memo: "시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도, 진흙은 만국 공통이었다.",
    place: "@ 동막해변",
    date: "2026.04.20",
    letters: 7,
    hifive: 12,
    isPublic: true,
  },
  {
    no: "No.281",
    category: "공유지",
    project: "한달살기 · 18회차",
    memo: "한달살기 2주차. 옆집 할머니가 쑥 한 바구니 주셨다.",
    place: "@ 화도면 사가리",
    date: "2026.04.18",
    letters: 3,
    hifive: 8,
    isPublic: true,
  },
  {
    no: "No.279",
    category: "세계",
    project: "환대 아카이빙 · 12회차",
    memo: "폐교 된 초등학교에서 환대 아카이빙 워크숍. 낡은 책상에 앉아 편지를 썼다.",
    place: "@ 교동 대룡시장",
    date: "2026.04.14",
    letters: 2,
    hifive: 5,
    isPublic: false,
  },
  {
    no: "No.276",
    category: "공유지",
    project: "공유 주방 · 7회차",
    memo: "공유 주방에서 다 같이 바지락 칼국수. 재료는 전부 오늘 아침 바다에서.",
    place: "@ 온수리",
    date: "2026.04.12",
    letters: 1,
    hifive: 6,
    isPublic: true,
  },
  {
    no: "No.270",
    category: "네트워크",
    project: "시부야 교류 · 2회차",
    memo: "Shibuya University 팀과 줌 미팅. 올가을 3회차 방한 확정.",
    place: "@ 화도면 사가리",
    date: "2026.04.08",
    letters: 0,
    hifive: 4,
    isPublic: true,
  },
  {
    no: "No.268",
    category: "정책",
    project: "빈집 정책 연구 · 3회차",
    memo: "군청 담당자 미팅. 빈집 실태조사 데이터 공유 요청. 생각보다 열려 있었다.",
    place: "@ 강화군청",
    date: "2026.04.05",
    letters: 0,
    hifive: 2,
    isPublic: false,
  },
  {
    no: "No.261",
    category: "세계",
    project: "해녀 학교 · 6회차",
    memo: '해녀 선생님이 "고향이 하나 더 생긴 것 같다"고 했다. 다음 주도 오고 싶다.',
    place: "@ 책방 국자와 주걱",
    date: "2026.04.02",
    letters: 4,
    hifive: 9,
    isPublic: true,
  },
  {
    no: "No.255",
    category: "공유지",
    project: "한달살기 · 17회차",
    memo: "전등사 새벽 산행. 안개 속 석탑을 혼자 봤다. 아무도 없었다.",
    place: "@ 전등사",
    date: "2026.03.28",
    letters: 2,
    hifive: 7,
    isPublic: true,
  },
  {
    no: "No.249",
    category: "네트워크",
    project: "시부야 교류 · 1회차",
    memo: "처음 만난 날. 언어가 달라도 밥 먹는 속도는 비슷하다는 걸 알았다.",
    place: "@ 갯벌카페",
    date: "2026.03.22",
    letters: 1,
    hifive: 3,
    isPublic: false,
  },
  {
    no: "No.242",
    category: "세계",
    project: "빈집 정책 연구 · 14회차",
    memo: "빈집 주인 할아버지와 두 시간 대화. 팔기 싫다고 했다. 그 마음이 더 중요했다.",
    place: "@ 해명산",
    date: "2026.03.18",
    letters: 1,
    hifive: 3,
    isPublic: true,
  },
  {
    no: "No.238",
    category: "정책",
    project: "빈집 정책 연구 · 2회차",
    memo: "빈집 현황 지도 작업 시작. 마을 어르신들이 더 잘 알고 있었다.",
    place: "@ 화도면 사가리",
    date: "2026.03.14",
    letters: 0,
    hifive: 1,
    isPublic: false,
  },
  {
    no: "No.231",
    category: "공유지",
    project: "공유 주방 · 6회차",
    memo: "동막해변 일몰. 카메라 없이 그냥 봤다. 그게 더 오래 남았다.",
    place: "@ 동막해변",
    date: "2026.03.10",
    letters: 0,
    hifive: 11,
    isPublic: true,
  },
];

export default function CollectionPage() {
  return (
    <>
      <CollectionLayout />
      <NoticeStrip />
    </>
  );
}

function CollectionLayout() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-[100px] lg:px-[60px]">
      <div className="grid items-start gap-8 pt-8 lg:grid-cols-[260px_1fr] lg:gap-[52px]">
        <Sidebar />
        <Main />
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="lg:sticky lg:top-[88px]">
      <AnimateOnScroll>
        <ProfileCard />
      </AnimateOnScroll>
      <AnimateOnScroll delay={0.07}>
        <ProgressCard />
      </AnimateOnScroll>
      <AnimateOnScroll delay={0.14}>
        <NextMomentCard />
      </AnimateOnScroll>
    </aside>
  );
}

function ProfileCard() {
  return (
    <div className="mb-4 rounded-2xl border border-v2-rule bg-white px-6 py-7">
      <div className="mb-1.5 flex items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #6BAF8A, #C4956A)",
          }}
        >
          풀
        </div>
        <div>
          <p className="text-[16px] font-bold tracking-[-0.3px]">풀잎</p>
          <p className="text-[11.5px] font-light text-[#AEAEB2]">
            JOINED 2024.11 · 강화 7회 방문
          </p>
        </div>
      </div>
      <p className="my-3.5 border-t border-[#F0F0EC] pt-3.5 text-[12.5px] font-light leading-[1.75] text-v2-ink3">
        갯벌이 좋아 자주 옵니다.
        <br />
        여행자도, 주민도 아닌 사이로.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <ProfileStat num={12} label="모은 카드" />
        <ProfileStat num={6} label="받은 편지" sub="💌" />
        <ProfileStat num={23} label="하이파이브" sub="★" />
        <ProfileStat num={7} label="방문 횟수" />
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

function ProgressCard() {
  return (
    <div className="mb-4 rounded-2xl border border-v2-rule bg-white px-6 py-5">
      <p className="mb-4 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
        MY PROGRESS
      </p>
      {PROGRESS.map((p, i) => (
        <div key={p.name} className={i < PROGRESS.length - 1 ? "mb-3.5" : ""}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium">
              <span
                className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                style={{ background: CATEGORY_STYLE[p.name].dot }}
              />
              {p.name}
            </span>
            <span className="text-[11px] font-light text-[#AEAEB2]">
              {p.current} / {p.total}
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
      ))}
    </div>
  );
}

function NextMomentCard() {
  return (
    <div className="rounded-2xl px-6 py-5" style={{ background: "#1A1A1A" }}>
      <p className="mb-3 text-[9.5px] font-semibold uppercase tracking-[3px] text-white/35">
        NEXT MOMENT
      </p>
      <p className="mb-1 text-[14px] font-semibold leading-[1.5] text-white/85">
        교동 대룡시장 방문
      </p>
      <p className="mb-4 text-[11.5px] font-light leading-[1.6] text-white/40">
        시부야 교류 3회차 · 내일 오전 10시
      </p>
      <Link
        href="/projects/shibuya-exchange"
        className="inline-block rounded-full bg-[#6BAF8A] px-[18px] py-2 text-[12px] font-medium text-v2-ink transition-colors hover:bg-[#5A9B78]"
      >
        참여 확정 →
      </Link>
    </div>
  );
}

function Main() {
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
          <CategoryFilter active>전체 12</CategoryFilter>
          <CategoryFilter dot="#C4956A">공유지 4</CategoryFilter>
          <CategoryFilter dot="#6BAF8A">네트워크 3</CategoryFilter>
          <CategoryFilter dot="#88AADD">세계 3</CategoryFilter>
          <CategoryFilter dot="#A080CC">정책 2</CategoryFilter>
        </div>
      </AnimateOnScroll>

      <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {BOOK_CARDS.map((card, i) => (
          <AnimateOnScroll key={card.no} delay={((i % 3) + 1) * 0.07}>
            <BookCardView card={card} />
          </AnimateOnScroll>
        ))}
      </div>
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
  active,
  dot,
  children,
}: {
  active?: boolean;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
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
    </button>
  );
}

function BookCardView({ card }: { card: BookCard }) {
  const style = CATEGORY_STYLE[card.category];
  return (
    <Link
      href={`/collection/${card.no.replace("No.", "")}`}
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
            {card.memo}
          </p>
          <div className="flex items-center justify-between border-t border-white/15 pt-3">
            <span className="text-[10.5px] font-light text-white/60">
              {card.place}
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
