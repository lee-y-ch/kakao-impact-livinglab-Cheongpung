import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { CountUp } from "@/components/v2/CountUp";

/**
 * v2 redesign — `/impact` 강화도 진척 공개 대시보드.
 * 시안: design-v2-reference/강화유니버스_임팩트.html.
 *
 * 데이터는 시안 하드코딩. 추후 Supabase 집계로 교체.
 */
export default function ImpactPage() {
  return (
    <>
      <PageHeader />
      <StatsStrip />
      <NodeMapSection />
      <ProgressSection />
      <RecentFeed />
      <NoticeStrip />
    </>
  );
}

function PageHeader() {
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
          <DateBarItem>2026.04.24</DateBarItem>
          <DateSep />
          <DateBarItem>RUNNING SINCE 2024.05</DateBarItem>
          <DateSep />
          <DateBarItem>412 DAYS</DateBarItem>
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

const STATS = [
  { num: 284, label: "누적 환대 카드", accent: true },
  { num: 12, label: "연결된 가게" },
  { num: 58, label: "참여자" },
  { num: 22, label: "에피소드" },
  { num: 63, label: "사장님 편지" },
  { num: 97, label: "하이파이브" },
];

function StatsStrip() {
  return (
    <div className="border-y border-v2-rule" style={{ background: "#F5F4F1" }}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
        <div className="flex items-stretch overflow-x-auto">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-1 flex-col items-center justify-center gap-1.5 px-9 py-5 ${
                i < STATS.length - 1 ? "border-r border-v2-rule" : ""
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
              드래그 · 줌으로 탐색
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

const CATEGORY_PROGRESS = [
  { name: "환대의 공유지", dot: "#9B6020", fill: "#C4956A", pct: 67 },
  { name: "네트워크", dot: "#3A7A55", fill: "#6BAF8A", pct: 50 },
  { name: "세계", dot: "#2060C8", fill: "#88AADD", pct: 38 },
  { name: "정책", dot: "#6040A0", fill: "#A080CC", pct: 39 },
];

function ProgressSection() {
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
            <p className="max-w-[220px] text-left text-[13px] font-light leading-[1.7] text-[#999] lg:text-right">
              각 카테고리의 목표 대비 현재 카드 수입니다.
              <br />
              수치는 실시간으로 업데이트됩니다.
            </p>
          </div>
        </AnimateOnScroll>
        <div className="overflow-hidden rounded-2xl border border-v2-rule bg-white">
          {CATEGORY_PROGRESS.map((c, i) => (
            <AnimateOnScroll key={c.name} delay={(i + 1) * 0.08}>
              <div
                className={`grid grid-cols-[100px_1fr_56px] items-center gap-4 px-5 py-6 transition-colors hover:bg-[#FAFAF8] lg:grid-cols-[160px_1fr_80px] lg:gap-8 lg:px-9 lg:py-7 ${
                  i < CATEGORY_PROGRESS.length - 1
                    ? "border-b border-v2-rule"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: c.dot }}
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
                    style={{ width: `${c.pct}%`, background: c.fill }}
                  />
                </div>
                <span className="text-right text-[13px] font-semibold tracking-[-0.3px] text-v2-ink">
                  {c.pct}%
                </span>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </div>
  );
}

type FeedCard = {
  no: string;
  category: "공유지" | "네트워크" | "세계" | "정책";
  memo: string;
  place: string;
  date: string;
  letters: number;
  hifive: number;
};

const FEED_CARDS: FeedCard[] = [
  {
    no: "No.284",
    category: "네트워크",
    memo: "시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도, 진흙은 만국 공통이었다.",
    place: "@ 동막해변",
    date: "2026.04.20",
    letters: 7,
    hifive: 12,
  },
  {
    no: "No.281",
    category: "공유지",
    memo: "한달살기 2주차. 옆집 할머니가 쑥 한 바구니 주셨다.",
    place: "@ 화도면 사가리",
    date: "2026.04.18",
    letters: 3,
    hifive: 8,
  },
  {
    no: "No.279",
    category: "세계",
    memo: "폐교 된 초등학교에서 환대 아카이빙 워크숍. 낡은 책상에 앉아 편지를 썼다.",
    place: "@ 교동 대룡시장",
    date: "2026.04.14",
    letters: 2,
    hifive: 5,
  },
  {
    no: "No.276",
    category: "공유지",
    memo: "공유 주방에서 다 같이 바지락 칼국수. 재료는 전부 오늘 아침 바다에서.",
    place: "@ 온수리",
    date: "2026.04.12",
    letters: 1,
    hifive: 6,
  },
];

const CATEGORY_BADGE: Record<FeedCard["category"], string> = {
  공유지: "bg-[rgba(180,110,40,0.1)] text-[#9B6020]",
  네트워크: "bg-[rgba(107,175,138,0.12)] text-[#3A7A55]",
  세계: "bg-[rgba(49,130,246,0.1)] text-[#2060C8]",
  정책: "bg-[rgba(130,90,180,0.1)] text-[#6040A0]",
};

function RecentFeed() {
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEED_CARDS.map((c, i) => (
            <AnimateOnScroll key={c.no} delay={(i + 1) * 0.08}>
              <FeedCardView card={c} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedCardView({ card }: { card: FeedCard }) {
  return (
    <div className="cursor-pointer overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between border-b border-[#F0F0EC] px-[18px] pb-2.5 pt-3.5">
        <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
          {card.no}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[1px] ${CATEGORY_BADGE[card.category]}`}
        >
          {card.category}
        </span>
      </div>
      <div className="px-[18px] pb-3.5 pt-4">
        <p className="mb-3.5 line-clamp-3 text-[13px] leading-[1.7] text-v2-ink">
          {card.memo}
        </p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] font-light text-[#AEAEB2]">
            {card.place}
          </span>
          <span className="text-[11px] font-light text-[#AEAEB2]">
            {card.date}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#F0F0EC] bg-[#FAFAF8] px-[18px] py-2.5">
        <span className="flex items-center gap-1 text-[10px] font-medium text-[#6BAF8A]">
          💌 편지 +{card.letters}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium text-[#C4956A]">
          ★ 하이파이브 {card.hifive}
        </span>
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
