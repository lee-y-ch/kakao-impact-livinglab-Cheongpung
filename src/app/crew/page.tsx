import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";

/**
 * v2 redesign — `/crew` 크루 워크스페이스.
 * 시안: design-v2-reference/강화유니버스_크루.html.
 *
 * 구성:
 *  1. 다크 PageHeader (날짜 / 타이틀 / 빠른 버튼)
 *  2. 요약 4 카운터
 *  3. 좌: 진행 중 에피소드 카드 (status 스텝퍼 + 현장 메모)
 *     우: 도착 카드 리스트 (하이파이브 / 노트 액션)
 *  4. 다크 푸터 strip
 */
export default function CrewPage() {
  return (
    <>
      <PageHeader />
      <SummaryStrip />
      <CrewLayout />
      <CrewFooterStrip />
    </>
  );
}

function PageHeader() {
  return (
    <div
      className="px-6 pb-10 pt-[112px] lg:px-[60px]"
      style={{ background: "#1A1A1A" }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
        <AnimateOnScroll>
          <div>
            <p className="mb-2.5 text-[11px] tracking-[1.5px] text-white/35">
              2026.04.24 금 · 17주차
            </p>
            <h1
              className="mb-1.5 font-bold leading-[1.15] tracking-[-1.2px] text-white"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
            >
              오늘도 강화도를
              <br />
              이어 주세요
            </h1>
            <p className="text-[13px] font-light text-white/40">
              크루 워크스페이스 · 임팩트 페이지 + 아카이브 등록
            </p>
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.08}>
          <div className="flex flex-shrink-0 gap-2">
            <Link
              href="/impact"
              className="rounded-[10px] bg-white px-5 py-2.5 text-[12.5px] font-medium text-v2-ink transition-opacity hover:opacity-85"
            >
              임팩트 보기
            </Link>
            <button
              type="button"
              className="rounded-[10px] bg-[#6BAF8A] px-5 py-2.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-85"
            >
              + 아카이브 등록
            </button>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

const SUMMARY = [
  { num: 3, label: "오늘 에피소드", accent: true },
  { num: 2, label: "진행 중" },
  { num: 12, label: "참여자 카드" },
  { num: 1, label: "아카이브 등록" },
];

function SummaryStrip() {
  return (
    <div className="border-b border-v2-rule" style={{ background: "#F5F4F1" }}>
      <div className="mx-auto flex max-w-[1280px] px-6 lg:px-[60px]">
        {SUMMARY.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-1 flex-col items-center justify-center gap-1 px-5 py-[18px] lg:px-9 ${i < SUMMARY.length - 1 ? "border-r border-v2-rule" : ""}`}
          >
            <p
              className={`text-[24px] font-bold leading-none tracking-[-0.8px] ${s.accent ? "text-[#6BAF8A]" : "text-v2-ink"}`}
            >
              {s.num}
            </p>
            <p className="text-[11.5px] font-medium text-[#888]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrewLayout() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-10 lg:px-[60px]">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_340px]">
        <Episodes />
        <Arrivals />
      </div>
    </div>
  );
}

type EpisodeStatus = "active" | "ready" | "planned";
type Episode = {
  status: EpisodeStatus;
  period: string;
  title: string;
  place: string;
  people: string;
  current: number; // 0=예정, 1=준비, 2=진행, 3=완료
  note: string;
};

const EPISODES: Episode[] = [
  {
    status: "active",
    period: "2026.04.20 – 04.24",
    title: "시부야 교류 3회차",
    place: "📍 갯벌카페 · 동막해변",
    people: "14",
    current: 2,
    note: "날씨 좋음. 갯벌 물때 2시",
  },
  {
    status: "ready",
    period: "2026.04.25 시작",
    title: "한달살기 4월 입주",
    place: "📍 화도면 사가리",
    people: "3",
    current: 1,
    note: "",
  },
  {
    status: "planned",
    period: "2026.04.27",
    title: "공유 주방 7회차",
    place: "📍 온돌 공유주방",
    people: "—",
    current: 0,
    note: "",
  },
];

function Episodes() {
  return (
    <div>
      <AnimateOnScroll>
        <div className="mb-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
            진행 중 에피소드
          </p>
          <h2 className="text-[18px] font-bold leading-[1.4] tracking-[-0.5px]">
            크루가 상태를 올려주면
            <br />
            임팩트 페이지에 즉시 반영돼요
          </h2>
        </div>
      </AnimateOnScroll>

      {EPISODES.map((e, i) => (
        <AnimateOnScroll key={e.title} delay={(i + 1) * 0.08}>
          <EpisodeCard episode={e} />
        </AnimateOnScroll>
      ))}
    </div>
  );
}

const STEPS = ["예정", "준비", "진행", "완료"];

function EpisodeCard({ episode }: { episode: Episode }) {
  const statusLabel =
    episode.status === "active"
      ? "● 진행"
      : episode.status === "ready"
        ? "준비"
        : "예정";
  const statusClass =
    episode.status === "active"
      ? "bg-[rgba(107,175,138,0.12)] text-[#3A7A55]"
      : episode.status === "ready"
        ? "bg-[rgba(196,149,106,0.12)] text-[#9B6020]"
        : "bg-black/[0.05] text-[#888]";

  return (
    <div className="mb-2.5 rounded-[14px] border border-v2-rule bg-white px-6 py-[22px] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="mb-3.5 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-[3px] text-[10px] font-semibold tracking-[1.5px] ${statusClass}`}
            >
              {statusLabel}
            </span>
            <span className="text-[11px] font-light text-[#AEAEB2]">
              {episode.period}
            </span>
          </div>
          <p className="mb-1 text-[16px] font-semibold tracking-[-0.3px]">
            {episode.title}
          </p>
          <p className="text-[12px] font-light text-[#AEAEB2]">
            {episode.place}
          </p>
        </div>
        <div className="flex-shrink-0">
          <p className="text-[12px] text-[#888]">
            참여자{" "}
            <strong className="font-bold text-v2-ink">{episode.people}</strong>
            명
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center">
        {STEPS.map((step, idx) => {
          const isCurrent = idx === episode.current;
          const isDone = idx < episode.current;
          const cls = isCurrent
            ? "bg-v2-ink text-white border-v2-ink"
            : isDone
              ? "bg-[#EDECEA] text-[#888] border-v2-rule"
              : "bg-[#FAFAF8] text-[#AEAEB2] border-v2-rule";
          const radius =
            idx === 0
              ? "rounded-l-lg"
              : idx === STEPS.length - 1
                ? "rounded-r-lg"
                : "";
          const borderLeft = idx > 0 ? "border-l-0" : "";
          return (
            <div
              key={step}
              className={`flex-1 cursor-pointer border px-1 py-[7px] text-center text-[11px] font-medium transition-all ${cls} ${radius} ${borderLeft}`}
            >
              {step}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="text"
          defaultValue={episode.note}
          placeholder="현장 메모 한 줄..."
          className="flex-1 rounded-lg border border-v2-rule bg-[#F8F8F6] px-3.5 py-2.5 text-[12.5px] text-v2-ink outline-none transition-all focus:border-[#6BAF8A] focus:bg-white"
        />
        <button
          type="button"
          className="whitespace-nowrap rounded-lg border-none bg-v2-ink px-4 py-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#333]"
        >
          저장
        </button>
      </div>
    </div>
  );
}

type Arrival = {
  no: string;
  date: string;
  withLetter: boolean;
  isPublic: boolean;
  memo: string;
  meta: string;
};

const ARRIVALS: Arrival[] = [
  {
    no: "No.284",
    date: "2026.04.20",
    withLetter: true,
    isPublic: true,
    memo: "시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도, 진흙은 만국 공통이었다.",
    meta: "@ 동막해변 · 네트워크",
  },
  {
    no: "No.281",
    date: "2026.04.18",
    withLetter: true,
    isPublic: true,
    memo: "한달살기 2주차. 옆집 할머니가 쑥 한 바구니 주셨다.",
    meta: "@ 화도면 사가리 · 공유지",
  },
  {
    no: "No.279",
    date: "2026.04.14",
    withLetter: false,
    isPublic: false,
    memo: "폐교 된 초등학교에서 환대 아카이빙 워크숍. 낡은 책상에 앉아 편지를 썼다.",
    meta: "@ 교동 대룡시장 · 세계",
  },
  {
    no: "No.276",
    date: "2026.04.12",
    withLetter: true,
    isPublic: true,
    memo: "공유 주방에서 다 같이 바지락 칼국수. 재료는 전부 오늘 아침 바다에서.",
    meta: "@ 온수리 · 공유지",
  },
];

function Arrivals() {
  return (
    <div>
      <AnimateOnScroll>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
          오늘 도착한 카드
        </p>
        <h2 className="mb-4 text-[18px] font-bold tracking-[-0.5px]">
          참여자가 남긴 기록
        </h2>
      </AnimateOnScroll>
      {ARRIVALS.map((a, i) => (
        <AnimateOnScroll key={a.no} delay={(i + 1) * 0.08}>
          <ArrivalCard arrival={a} />
        </AnimateOnScroll>
      ))}
    </div>
  );
}

function ArrivalCard({ arrival }: { arrival: Arrival }) {
  return (
    <div className="mb-2 rounded-xl border border-v2-rule bg-white px-[18px] py-4 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
          {arrival.withLetter && "💌 "}
          {arrival.no} · {arrival.date}
        </span>
        {arrival.isPublic ? (
          <span
            className="rounded border px-[7px] py-[2px] text-[9px] font-semibold tracking-[1px]"
            style={{
              color: "#6BAF8A",
              borderColor: "rgba(107,175,138,0.3)",
            }}
          >
            공개
          </span>
        ) : (
          <span className="rounded border border-v2-rule px-[7px] py-[2px] text-[9px] text-[#AEAEB2]">
            비공개
          </span>
        )}
      </div>
      <p className="mb-2.5 line-clamp-2 text-[12.5px] leading-[1.65] text-v2-ink">
        {arrival.memo}
      </p>
      <p className="mb-2.5 text-[10.5px] text-[#AEAEB2]">{arrival.meta}</p>
      <div className="flex gap-1.5">
        <button
          type="button"
          className="flex-1 rounded-[7px] border px-2.5 py-[7px] text-[12px] font-medium transition-colors"
          style={{
            background: "rgba(196,149,106,0.1)",
            color: "#9B6020",
            borderColor: "rgba(196,149,106,0.2)",
          }}
        >
          ★ 하이파이브
        </button>
        <button
          type="button"
          className="flex-[2] rounded-[7px] border border-v2-rule bg-[#F5F4F1] px-2.5 py-[7px] text-[12px] font-medium text-v2-ink3 transition-colors hover:bg-[#EDECEA]"
        >
          짧은 노트 달기
        </button>
      </div>
    </div>
  );
}

function CrewFooterStrip() {
  return (
    <div
      className="flex items-center justify-between px-6 py-5 lg:px-[60px]"
      style={{ background: "#1A1A1A" }}
    >
      <span className="text-[11.5px] text-white/30">
        공용 계정 · Phase 3 · crew@chungpung
      </span>
      <span className="text-[11.5px] text-white/20">
        © 2026 Ganghwa Universe
      </span>
    </div>
  );
}
