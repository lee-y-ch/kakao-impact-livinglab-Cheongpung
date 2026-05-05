import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { CountUp } from "@/components/v2/CountUp";

/**
 * v2 redesign — `/projects/[slug]` 단일 프로젝트 상세.
 * 시안: design-v2-reference/강화유니버스_프로젝트.html (시부야 교류 예시).
 *
 * 섹션:
 *  1. Breadcrumb
 *  2. ProjectHero — 카테고리 뱃지 / 타이틀 / 4 stat
 *  3. ChapterTimeline — 가로 스크롤 챕터 카드 + 진척바
 *  4. ActiveChapter — 진행 중 챕터 좌측 + 공지 우측
 *  5. ProjectCards — 이 프로젝트의 공개 카드
 *  6. NoticeStrip
 *
 * MVP 단계라 모든 슬러그가 동일한 시안 데이터를 보여주는 정적 페이지.
 */
export default function ProjectDetailPage() {
  return (
    <>
      <Breadcrumb />
      <ProjectHero />
      <Divider />
      <ChapterTimeline />
      <ActiveChapter />
      <ProjectCards />
      <NoticeStrip />
    </>
  );
}

function Breadcrumb() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-[112px] lg:px-[60px]">
      <AnimateOnScroll>
        <div className="flex items-center gap-2 text-[12px] text-[#AEAEB2]">
          <Link
            href="/projects"
            className="transition-colors hover:text-v2-ink"
          >
            ← 프로젝트 전체
          </Link>
          <span className="text-[#D0D0D0]">/</span>
          <span>네트워크</span>
          <span className="text-[#D0D0D0]">/</span>
          <span className="font-medium text-v2-ink3">시부야 교류</span>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

function ProjectHero() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-7 lg:px-[60px]">
      <div className="grid items-end gap-9 lg:grid-cols-[1fr_420px] lg:gap-[60px]">
        <div>
          <AnimateOnScroll>
            <span
              className="mb-[18px] inline-block rounded-full px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[2px]"
              style={{
                background: "rgba(107,175,138,0.12)",
                color: "#3A7A55",
              }}
            >
              NETWORK · 네트워크
            </span>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.08}>
            <p className="mb-2.5 text-[11px] tracking-[1px] text-[#AEAEB2]">
              2024 – 2028
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.16}>
            <h1
              className="mb-5 font-bold leading-[1.1] tracking-[-2px] text-v2-ink"
              style={{ fontSize: "clamp(36px, 4.5vw, 58px)" }}
            >
              시부야 교류
            </h1>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.24}>
            <p className="mb-8 max-w-[480px] text-[14.5px] font-light leading-[1.85] text-v2-ink3">
              강화와 시부야, 두 도시의 사람들이 매년 서로를 방문하며 일상을
              겹쳐갑니다. 손님이 아니라 이웃이 되어가는 과정의 기록입니다.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.32}>
            <div className="flex flex-wrap gap-8">
              <HeroStat num={22} label="카드" accent />
              <HeroStat num={6} label="편지" />
              <HeroStat num={31} label="참여자" />
              <HeroStat num={5} label="진행 일수" />
            </div>
          </AnimateOnScroll>
        </div>
        <AnimateOnScroll delay={0.24}>
          <div className="lg:max-w-[420px]">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#EDECEA]">
              <div
                className="h-full w-full transition-transform duration-[500ms] group-hover:scale-[1.03]"
                style={{
                  background:
                    "linear-gradient(135deg, #C4D4E8 0%, #88AADD 50%, #6BAF8A 100%)",
                }}
              />
              <div
                className="absolute bottom-5 left-5 rounded-md border border-white/40 px-3 py-1.5 text-[10px] font-medium tracking-[1.5px] text-v2-ink"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(6px)",
                }}
              >
                SHIBUYA × GANGHWA
              </div>
            </div>
            <p className="mt-2 block text-[9.5px] font-light tracking-[0.3px] text-[#AEAEB2]">
              시부야대학 교류 현장 · 2026 · ph. crew archive
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

function HeroStat({
  num,
  label,
  accent,
}: {
  num: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={`mb-1 text-[28px] font-bold leading-none tracking-[-1px] ${
          accent ? "text-[#6BAF8A]" : "text-v2-ink"
        }`}
      >
        <CountUp target={num} />
      </p>
      <p className="text-[11px] font-light tracking-[0.5px] text-[#AEAEB2]">
        {label}
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
      <div className="mt-12 border-t border-v2-rule" />
    </div>
  );
}

type ChapterStatus = "done" | "active" | "pending";
type ChapterCard = {
  status: ChapterStatus;
  no: string;
  year: string;
  name: string;
  cards: string;
  people: string;
};

const CHAPTERS: ChapterCard[] = [
  {
    status: "done",
    no: "CH.01",
    year: "2024",
    name: "첫 만남",
    cards: "12",
    people: "12",
  },
  {
    status: "done",
    no: "CH.02",
    year: "2025",
    name: "정기 교환",
    cards: "18",
    people: "19",
  },
  {
    status: "active",
    no: "CH.03",
    year: "2026",
    name: "봄, 지금",
    cards: "22",
    people: "31",
  },
  {
    status: "pending",
    no: "CH.04",
    year: "2026",
    name: "가을 재방문",
    cards: "0",
    people: "14",
  },
  {
    status: "pending",
    no: "CH.05",
    year: "2027",
    name: "마무리",
    cards: "—",
    people: "—",
  },
];

function ChapterTimeline() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-14 lg:px-[60px]">
      <AnimateOnScroll>
        <p className="mb-7 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
          CHAPTERS · 전체 진행 흐름
        </p>
      </AnimateOnScroll>
      <AnimateOnScroll delay={0.08}>
        <div className="mb-5 flex items-center gap-3">
          <span className="whitespace-nowrap text-[12px] text-[#AEAEB2]">
            <strong className="font-semibold text-v2-ink">3</strong> / 5 챕터
            진행 중
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-v2-rule">
            <div
              className="h-full rounded-full transition-[width] duration-[1200ms] ease-out"
              style={{ width: "60%", background: "#6BAF8A" }}
            />
          </div>
        </div>
      </AnimateOnScroll>
      <AnimateOnScroll delay={0.16}>
        <div className="overflow-x-auto pb-3">
          <div className="flex min-w-max gap-2.5 pt-1">
            {CHAPTERS.map((c) => (
              <ChapterCardView key={c.no} chapter={c} />
            ))}
          </div>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

function ChapterCardView({ chapter }: { chapter: ChapterCard }) {
  const isActive = chapter.status === "active";
  const isDone = chapter.status === "done";
  const statusLabel =
    chapter.status === "active"
      ? "● 진행 중"
      : chapter.status === "done"
        ? "완료"
        : "예정";
  const statusColor =
    chapter.status === "active"
      ? "#6BAF8A"
      : chapter.status === "done"
        ? "#AEAEB2"
        : "#C4956A";

  return (
    <div
      className={`relative w-[200px] flex-shrink-0 rounded-[14px] border-[1.5px] p-5 pt-5 transition-all duration-[200ms] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] ${
        isActive
          ? "border-[#6BAF8A] bg-[#F4FAF7] shadow-[0_6px_20px_rgba(107,175,138,0.15)]"
          : isDone
            ? "border-v2-rule bg-[#FAFAF8]"
            : "border-v2-rule bg-white"
      }`}
    >
      <p
        className="mb-2.5 text-[9px] font-semibold uppercase tracking-[1.5px]"
        style={{ color: statusColor }}
      >
        {statusLabel}
      </p>
      <p className="mb-1 text-[10px] tracking-[1px] text-[#AEAEB2]">
        {chapter.no}
      </p>
      <p className="mb-2 text-[10px] text-[#AEAEB2]">{chapter.year}</p>
      <p className="mb-3.5 text-[14px] font-semibold leading-[1.3] tracking-[-0.3px] text-v2-ink">
        {chapter.name}
      </p>
      <div className="flex gap-2.5">
        <span className="flex items-center gap-1 text-[10.5px] text-[#AEAEB2]">
          카드{" "}
          <span className="font-semibold text-v2-ink">{chapter.cards}</span>
        </span>
        <span className="flex items-center gap-1 text-[10.5px] text-[#AEAEB2]">
          참여{" "}
          <span className="font-semibold text-v2-ink">{chapter.people}</span>
        </span>
      </div>
    </div>
  );
}

const NOTICES = [
  {
    type: "진행",
    color: "#C4956A",
    text: "교동 대룡시장 방문 에피소드 내일 오전 10시 출발. 크루 준비물 공지.",
    date: "2026.04.25",
  },
  {
    type: "공지",
    color: "#6BAF8A",
    text: "이번 주 갯벌카페 저녁 자리는 인원 마감. 다음 주 수요일 추가 편성.",
    date: "2026.04.23",
  },
  {
    type: "기록",
    color: "#88AADD",
    text: "시부야 Yui가 남긴 카드 No.291이 공개됐어요.",
    date: "2026.04.22",
  },
];

function ActiveChapter() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-12 lg:px-[60px]">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <AnimateOnScroll>
            <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[2px] text-[#6BAF8A]">
              <span
                className="h-[7px] w-[7px] animate-pulse rounded-full"
                style={{ background: "#6BAF8A" }}
              />
              CHAPTER 03 · 2026 봄, 지금
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.08}>
            <h2
              className="mb-3.5 font-bold leading-[1.2] tracking-[-0.8px] text-v2-ink"
              style={{ fontSize: "clamp(22px, 2.8vw, 32px)" }}
            >
              &ldquo;당신은 강화의 일원입니다&rdquo;
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.16}>
            <p className="mb-7 max-w-[500px] text-[14.5px] leading-[1.9] text-[#4A4A4A]">
              3회차가 진행 중입니다. 당신은 이 프로젝트의 22번째 참여자로,
              시부야에서 온 친구들과 동막해변을 걸었고 갯벌카페 사장님의 편지를
              받았습니다.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.24}>
            <div className="flex flex-wrap gap-3">
              <ActiveStat num="22" label="카드" />
              <ActiveStat num="6" label="편지" />
              <ActiveStat num="31" label="참여자" />
              <ActiveStat num="5" label="진행 일수" />
            </div>
          </AnimateOnScroll>
        </div>

        <AnimateOnScroll delay={0.16}>
          <div>
            <p className="mb-3.5 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
              NOTICES — 이 챕터의 소식
            </p>
            <div className="flex flex-col">
              {NOTICES.map((n, i) => (
                <div
                  key={n.text}
                  className={`py-4 ${i < NOTICES.length - 1 ? "border-b border-v2-rule" : ""}`}
                >
                  <p
                    className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[1.5px]"
                    style={{ color: n.color }}
                  >
                    {n.type}
                  </p>
                  <p className="mb-1 text-[12.5px] leading-[1.7] text-v2-ink">
                    {n.text}
                  </p>
                  <p className="text-[10.5px] font-light text-[#AEAEB2]">
                    {n.date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

function ActiveStat({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex min-w-[80px] flex-col items-center rounded-xl border border-v2-rule bg-[#F5F4F1] px-5 py-4">
      <p className="mb-1.5 text-[26px] font-bold leading-none tracking-[-1px] text-v2-ink">
        {num}
      </p>
      <p className="text-[11.5px] font-medium text-[#888]">{label}</p>
    </div>
  );
}

type CardItem = {
  no: string;
  memo: string;
  place: string;
  date: string;
  letters: number;
  hifive: number;
};

const CARDS: CardItem[] = [
  {
    no: "No.284",
    memo: "시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도, 진흙은 만국 공통이었다.",
    place: "@ 동막해변",
    date: "2026.04.20",
    letters: 7,
    hifive: 12,
  },
  {
    no: "No.279",
    memo: 'Yui가 강화 해협을 보면서 "이 바다 건너면 일본이야?"라고 물었다. 아니야, 북한이야.',
    place: "@ 동막해변",
    date: "2026.04.19",
    letters: 3,
    hifive: 8,
  },
  {
    no: "No.261",
    memo: "갯벌카페 사장님이 일본어로 메뉴판을 만들어 오셨다. 일주일 걸렸다고 했다.",
    place: "@ 갯벌카페",
    date: "2026.04.18",
    letters: 5,
    hifive: 14,
  },
  {
    no: "No.255",
    memo: "저녁 식사 후 각자 고향 사진 보여주기. Taka 고향이 바다마을이었다. 달랐지만 닮았다.",
    place: "@ 잠시섬",
    date: "2026.04.17",
    letters: 2,
    hifive: 9,
  },
];

function ProjectCards() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-14 lg:px-[60px]">
      <AnimateOnScroll>
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
              이 프로젝트의 카드들
            </p>
            <h2
              className="font-bold tracking-[-0.8px] text-v2-ink"
              style={{ fontSize: "clamp(20px, 2.5vw, 28px)" }}
            >
              시부야 교류에서
              <br />
              쌓인 순간들
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
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c, i) => (
          <AnimateOnScroll key={c.no} delay={(i + 1) * 0.08}>
            <ProjectCardView card={c} />
          </AnimateOnScroll>
        ))}
      </div>
    </div>
  );
}

function ProjectCardView({ card }: { card: CardItem }) {
  return (
    <div className="cursor-pointer overflow-hidden rounded-[14px] border border-black/[0.06] bg-white transition-all duration-[220ms] hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(0,0,0,0.09)]">
      <div className="flex items-center justify-between border-b border-[#F4F4F2] px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
          {card.no}
        </span>
        <span
          className="rounded px-2 py-[3px] text-[9.5px] font-semibold tracking-[0.5px]"
          style={{ background: "rgba(107,175,138,0.12)", color: "#3A7A55" }}
        >
          네트워크
        </span>
      </div>
      <div className="px-3.5 pb-3 pt-3.5">
        <p className="mb-3 line-clamp-3 text-[12.5px] leading-[1.7] text-v2-ink">
          {card.memo}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-light text-[#AEAEB2]">
            {card.place}
          </span>
          <span className="text-[10.5px] font-light text-[#AEAEB2]">
            {card.date}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#F4F4F2] bg-[#FAFAF8] px-3.5 py-2">
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
          챕터를 클릭하면 해당 시기로 이동합니다.
        </strong>
        &nbsp;진행 중인 에피소드는 크루가 실시간으로 업데이트합니다.
      </p>
    </div>
  );
}
