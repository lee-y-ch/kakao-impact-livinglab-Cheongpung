import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";

/**
 * v2 redesign — `/feed` 공개 피드.
 * 시안: design-v2-reference/강화유니버스_피드.html.
 *
 * 레이아웃: 좌측 사이드바 (카테고리·기간·자주 등장한 장소) + 우측 카드 그리드.
 * 필터·정렬 인터랙션은 시안 기준 정적 노출 (실데이터 연동 시 client 분리).
 */

type FeedCategory = "공유지" | "네트워크" | "세계" | "정책";

type FeedCard = {
  no: string;
  category: FeedCategory;
  project: string;
  memo: string;
  place: string;
  date: string;
  letters: number;
  hifive: number;
};

const CATEGORIES: {
  name: "전체" | FeedCategory;
  count: number;
  dot?: string;
}[] = [
  { name: "전체", count: 9 },
  { name: "공유지", count: 4, dot: "#C4956A" },
  { name: "네트워크", count: 2, dot: "#6BAF8A" },
  { name: "세계", count: 3, dot: "#88AADD" },
  { name: "정책", count: 0, dot: "#A080CC" },
];

const PERIODS = ["전체", "7일", "30일", "90일", "올해"];

const PLACES = [
  { name: "동막해변", pct: 100 },
  { name: "갯벌카페", pct: 75 },
  { name: "전등사", pct: 58 },
  { name: "교동 대룡시장", pct: 50 },
  { name: "해명산", pct: 33 },
];

const FEED_CARDS: FeedCard[] = [
  {
    no: "No.284",
    category: "네트워크",
    project: "시부야 교류 · 3회차",
    memo: "시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도, 진흙은 만국 공통이었다.",
    place: "@ 동막해변",
    date: "2026.04.20",
    letters: 7,
    hifive: 12,
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
  },
  {
    no: "No.261",
    category: "네트워크",
    project: "시부야 교류 · 2회차",
    memo: "Shibuya University 팀과 줌 미팅. 올가을 3회차 방한 확정.",
    place: "@ 책방 국자와 주걱",
    date: "2026.04.02",
    letters: 0,
    hifive: 4,
  },
  {
    no: "No.255",
    category: "세계",
    project: "해녀 학교 · 6회차",
    memo: '해녀 선생님이 "고향이 하나 더 생긴 것 같다"고 했다. 다음 주도 오고 싶다.',
    place: "@ 온수리",
    date: "2026.03.28",
    letters: 4,
    hifive: 9,
  },
  {
    no: "No.249",
    category: "공유지",
    project: "한달살기 · 17회차",
    memo: "전등사 새벽 산행. 안개 속 석탑을 혼자 봤다. 아무도 없었다.",
    place: "@ 전등사",
    date: "2026.03.22",
    letters: 2,
    hifive: 7,
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
  },
  {
    no: "No.238",
    category: "공유지",
    project: "공유 주방 · 6회차",
    memo: "동막해변 일몰. 카메라 없이 그냥 봤다. 그게 더 오래 남았다.",
    place: "@ 동막해변",
    date: "2026.03.14",
    letters: 0,
    hifive: 11,
  },
];

const CATEGORY_BADGE: Record<FeedCategory, string> = {
  공유지: "bg-[rgba(180,110,40,0.1)] text-[#9B6020]",
  네트워크: "bg-[rgba(107,175,138,0.12)] text-[#3A7A55]",
  세계: "bg-[rgba(49,130,246,0.1)] text-[#2060C8]",
  정책: "bg-[rgba(130,90,180,0.1)] text-[#6040A0]",
};

export default function FeedPage() {
  return (
    <>
      <FeedLayout />
      <NoticeStrip />
    </>
  );
}

function FeedLayout() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-[100px] lg:px-[60px]">
      <div className="grid items-start gap-8 pt-8 lg:grid-cols-[220px_1fr] lg:gap-12">
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
        <SidebarBlock label="CATEGORY">
          <ul className="flex flex-col gap-0.5">
            {CATEGORIES.map((c, i) => (
              <li
                key={c.name}
                className={`flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  i === 0
                    ? "bg-v2-ink font-medium text-white"
                    : "text-v2-ink3 hover:bg-[#EDECEA] hover:text-v2-ink"
                }`}
              >
                <span className="flex items-center">
                  {c.dot && (
                    <span
                      className="mr-2 h-[7px] w-[7px] flex-shrink-0 rounded-full"
                      style={{ background: c.dot }}
                    />
                  )}
                  {c.name === "전체"
                    ? "전체"
                    : c.name === "공유지"
                      ? "환대의 공유지"
                      : c.name}
                </span>
                <span className="text-[11px] opacity-50">{c.count}</span>
              </li>
            ))}
          </ul>
        </SidebarBlock>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.07}>
        <SidebarBlock label="PERIOD">
          <ul className="flex flex-col gap-0.5">
            {PERIODS.map((p, i) => (
              <li
                key={p}
                className={`cursor-pointer select-none rounded-lg px-3 py-[7px] text-[13px] transition-colors ${
                  i === 0
                    ? "bg-[#EDECEA] font-medium text-v2-ink"
                    : "text-v2-ink3 hover:bg-[#EDECEA] hover:text-v2-ink"
                }`}
              >
                {p}
              </li>
            ))}
          </ul>
        </SidebarBlock>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.14}>
        <SidebarBlock label="PLACES">
          <ul className="flex flex-col gap-1.5">
            {PLACES.map((p) => (
              <li
                key={p.name}
                className="flex cursor-pointer items-center justify-between py-1 text-[12.5px] text-v2-ink3 transition-colors hover:text-v2-ink"
              >
                <span>{p.name}</span>
                <div className="ml-2 h-[3px] w-[60px] overflow-hidden rounded-full bg-v2-rule">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.pct}%`, background: "#6BAF8A" }}
                  />
                </div>
              </li>
            ))}
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

function Main() {
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
          <div className="flex items-center gap-3 text-[12px] text-[#AEAEB2]">
            <span>9장</span>
            <Dot />
            <span>경쟁 없음</span>
            <Dot />
            <span>좋아요 없음</span>
            <Dot />
            <span>시간순</span>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.07}>
        <div className="mb-7 flex items-start gap-5 rounded-[14px] border border-v2-rule bg-white px-6 py-5">
          <span className="flex-shrink-0 whitespace-nowrap pt-0.5 text-[9.5px] font-semibold uppercase tracking-[2.5px] text-[#6BAF8A]">
            THIS WEEK
          </span>
          <div>
            <p className="text-[13.5px] leading-[1.75] text-v2-ink">
              <strong className="font-semibold">
                &ldquo;고향이 하나 더 생긴 것 같다&rdquo;
              </strong>
              는 말이 두 번 등장했어요.
            </p>
            <p className="mt-1 text-[12px] leading-[1.6] text-[#AEAEB2]">
              시부야 교류 3회차 · 해녀 학교 6회차에서 동시에 나온 한 줄.
              <br />
              무관한 두 프로젝트가 같은 단어로 만나는 순간을 모았습니다.
            </p>
          </div>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.14}>
        <div className="mb-5 flex items-center justify-between border-b border-v2-rule pb-4">
          <span className="text-[12px] text-[#AEAEB2]">
            카드 <strong className="font-semibold text-v2-ink">9</strong>장
          </span>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-v2-rule bg-transparent px-3 py-1.5 text-[12px] text-v2-ink3 transition-colors hover:bg-[#EDECEA]"
          >
            최근순 ↓
          </button>
        </div>
      </AnimateOnScroll>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {FEED_CARDS.map((card, i) => (
          <AnimateOnScroll key={card.no} delay={((i % 3) + 1) * 0.07}>
            <FeedCardView card={card} />
          </AnimateOnScroll>
        ))}
      </div>

      <AnimateOnScroll>
        <div className="mt-10 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-v2-rule bg-transparent px-8 py-3 text-[13px] font-medium text-v2-ink transition-colors hover:border-[#D0D0C8] hover:bg-[#EDECEA]"
          >
            더 보기 ↓
          </button>
        </div>
      </AnimateOnScroll>
    </main>
  );
}

function Dot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-[#D0D0D0]" />;
}

function FeedCardView({ card }: { card: FeedCard }) {
  return (
    <div className="cursor-pointer overflow-hidden rounded-[14px] border border-black/[0.06] bg-white transition-all duration-[220ms] hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(0,0,0,0.09)]">
      <div className="flex items-center justify-between border-b border-[#F4F4F2] px-4 pb-2.5 pt-3">
        <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
          {card.no}
        </span>
        <span
          className={`rounded px-2 py-[3px] text-[9.5px] font-semibold tracking-[0.5px] ${CATEGORY_BADGE[card.category]}`}
        >
          {card.category}
        </span>
      </div>
      <div className="px-4 pb-3 pt-3.5">
        <p className="mb-2 text-[10.5px] font-normal text-[#AEAEB2]">
          {card.project}
        </p>
        <p className="mb-3.5 line-clamp-3 text-[13px] leading-[1.7] text-v2-ink">
          {card.memo}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-light text-[#AEAEB2]">
            {card.place}
          </span>
          <span className="text-[11px] font-light text-[#AEAEB2]">
            {card.date}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#F4F4F2] bg-[#FAFAF8] px-4 py-[9px]">
        <span className="text-[10px] font-medium text-[#6BAF8A]">
          💌 +{card.letters}
        </span>
        <span className="text-[10px] font-medium text-[#C4956A]">
          ★ {card.hifive}
        </span>
      </div>
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
          좋아요 / 팔로우 / 랭킹은 없습니다.
        </strong>
        &nbsp;카드는 시간순으로만 흐르고, 공개로 동의한 글만 보입니다.
      </p>
    </div>
  );
}
