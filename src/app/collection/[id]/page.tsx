import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";

/**
 * v2 redesign — `/collection/[id]` 카드 상세.
 * 시안: design-v2-reference/강화유니버스_카드상세.html.
 *
 * 좌: 카드 앞/뒷면 + 메타 테이블 + 인용한 사람
 * 우: 받은 편지 + 하이파이브 리스트
 *
 * 카드 플립은 시안의 click→rotateY 인터랙션이지만 SSR 단계에선 앞/뒷면을 위아래로
 * 같이 펼쳐 보여주는 정적 표현으로 대체. (실데이터 연동 시 client 분리.)
 */
export default function CardDetailPage() {
  return (
    <>
      <Breadcrumb />
      <CardLayout />
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
            href="/collection"
            className="transition-colors hover:text-v2-ink"
          >
            ← 내 도감
          </Link>
          <span className="text-[#D0D0D0]">/</span>
          <span>네트워크</span>
          <span className="text-[#D0D0D0]">/</span>
          <span className="font-medium text-v2-ink3">No.284</span>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

function CardLayout() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-9 lg:px-[60px]">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_360px] lg:gap-[60px]">
        <CardSection />
        <LetterSection />
      </div>
    </div>
  );
}

function CardSection() {
  return (
    <div>
      <AnimateOnScroll>
        <CardFront />
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.08}>
        <CardBack />
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.16}>
        <CardActions />
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.24}>
        <MetaTable />
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.32}>
        <QuotedSection />
      </AnimateOnScroll>
    </div>
  );
}

function CardFront() {
  return (
    <div className="mb-4 max-w-[480px]">
      <div className="relative flex aspect-[3/2] flex-col overflow-hidden rounded-[20px] border border-black/[0.07] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
        <div className="flex items-center justify-between border-b border-[#F0F0EC] px-[22px] pb-3.5 pt-[18px]">
          <span className="text-[11px] font-semibold tracking-[2px] text-[#AEAEB2]">
            No.284
          </span>
          <span
            className="rounded px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.5px]"
            style={{
              background: "rgba(107,175,138,0.12)",
              color: "#3A7A55",
            }}
          >
            네트워크
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-between px-[22px] pb-[18px] pt-[22px]">
          <p className="text-[15px] leading-[1.8] text-v2-ink">
            시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도, 진흙은
            만국 공통이었다.
          </p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[11.5px] font-light text-[#AEAEB2]">
              @ 동막해변
            </span>
            <span className="text-[11.5px] font-light text-[#AEAEB2]">
              2026.04.20
            </span>
          </div>
        </div>
        <span
          className="absolute bottom-[18px] right-5 rotate-[10deg] rounded border-[1.5px] px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-[1.5px] opacity-70"
          style={{
            color: "#6BAF8A",
            borderColor: "#6BAF8A",
            background: "rgba(107,175,138,0.06)",
          }}
        >
          공개
        </span>
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div className="mb-7 max-w-[480px]">
      <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
        BACK · 뒷면
      </p>
      <div
        className="flex aspect-[3/2] flex-col overflow-hidden rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
        style={{ background: "#1A1A1A" }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-[22px] pb-3.5 pt-[18px]">
          <span className="text-[9.5px] font-semibold uppercase tracking-[2.5px] text-white/35">
            NETWORK · BACK
          </span>
          <span
            className="rounded px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.5px]"
            style={{
              background: "rgba(107,175,138,0.2)",
              color: "#6BAF8A",
            }}
          >
            네트워크
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-between px-[22px] pb-[18px] pt-[22px]">
          <p className="text-[15px] font-light italic leading-[1.8] text-white/85">
            &ldquo;시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도,
            진흙은 만국 공통이었다.&rdquo;
          </p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[11.5px] font-light text-white/30">
              동막해변
            </span>
            <span className="text-[11.5px] font-light text-white/30">
              2026.04.20
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardActions() {
  return (
    <div className="mb-9 flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full bg-v2-ink px-[22px] py-2.5 text-[12.5px] font-medium text-white transition-all hover:scale-[1.02] hover:bg-[#333]"
      >
        뒷면 보기 ↺
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-v2-rule bg-transparent px-[22px] py-2.5 text-[12.5px] font-medium text-v2-ink3 transition-colors hover:border-v2-ink hover:text-v2-ink"
      >
        공개 / 비공개
      </button>
    </div>
  );
}

const META: { key: string; val: string; link?: string }[] = [
  { key: "DATE", val: "2026.04.20" },
  { key: "PLACE", val: "동막해변" },
  {
    key: "PROJECT",
    val: "시부야 교류 3회차",
    link: "/projects/shibuya-exchange",
  },
  { key: "CATEGORY", val: "네트워크" },
];

function MetaTable() {
  return (
    <div className="mb-8 overflow-hidden rounded-[14px] border border-v2-rule bg-white">
      {META.map((row, i) => (
        <div
          key={row.key}
          className={`grid grid-cols-[100px_1fr] items-center px-5 py-3.5 ${i < META.length - 1 ? "border-b border-[#F0F0EC]" : ""}`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[2px] text-[#AEAEB2]">
            {row.key}
          </span>
          <span className="text-[13px] font-normal text-v2-ink">
            {row.link ? (
              <Link
                href={row.link}
                className="border-b border-[rgba(107,175,138,0.3)] text-[#6BAF8A] transition-colors hover:border-[#6BAF8A]"
              >
                {row.val}
              </Link>
            ) : (
              row.val
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function QuotedSection() {
  return (
    <div>
      <p className="mb-3.5 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
        QUOTED BY · 이 카드를 인용한 사람들
      </p>
      <div className="flex items-start gap-3.5 rounded-xl border border-v2-rule bg-white px-5 py-4">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #88AADD, #6BAF8A)",
          }}
        >
          Y
        </div>
        <div>
          <p className="mb-1.5 text-[11.5px] font-semibold text-v2-ink">
            Yui · 시부야{" "}
            <span className="font-light text-[#AEAEB2]">카드 No.291</span>
          </p>
          <p className="text-[13px] font-light italic leading-[1.75] text-v2-ink3">
            &ldquo;한국 친구가 갯벌이 공통이라고 써준 게 자꾸 생각나. 도쿄에
            오면 우리도 비슷한 풍경을 보여주고 싶다.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

function LetterSection() {
  return (
    <div>
      <AnimateOnScroll>
        <p className="mb-4 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
          LETTER · 이 카드와 함께 받은 편지
        </p>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.08}>
        <LetterCard />
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.16}>
        <HiFiveCard />
      </AnimateOnScroll>
    </div>
  );
}

function LetterCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-v2-rule bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3.5 border-b border-[#F0F0EC] px-6 pb-4 pt-5">
        <div
          className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #C4956A, #E8C49A)",
          }}
        >
          갯
        </div>
        <div>
          <p className="mb-0.5 text-[13px] font-semibold text-v2-ink">
            갯벌카페 사장님
          </p>
          <p className="text-[11px] font-light text-[#AEAEB2]">2026.04.22</p>
        </div>
      </div>
      <div className="px-6 pb-5 pt-[22px]">
        <p className="text-[14px] font-light leading-[2] text-[#3A3A3A]">
          풀잎님이 갯벌에서 사진을 찍을 때, 그 모습을 봤어요. 손님이 아니라 자주
          오는 이웃처럼 보여서 반가웠습니다. 다음에 오시면 새로 들여온 차 한잔
          대접할게요.
        </p>
      </div>
      <div className="border-t border-[#F0F0EC] px-6 pb-5 pt-3.5">
        <p className="mb-0.5 text-[13px] font-semibold text-v2-ink">김영주</p>
        <p className="text-[11px] font-light text-[#AEAEB2]">
          갯벌카페에서, 2026.04.22
        </p>
      </div>
      <div className="px-6 pb-5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10.5px] font-medium"
          style={{
            color: "#6BAF8A",
            borderColor: "rgba(107,175,138,0.2)",
            background: "rgba(107,175,138,0.08)",
          }}
        >
          💌 받은 편지 · 카카오 알림으로 도착
        </span>
      </div>
    </div>
  );
}

const HIFIVES = [
  {
    initial: "크",
    name: "크루 · 호영",
    note: "갯벌에서 찍은 사진 봤어요. 진흙 묻은 신발이 제일 좋았습니다.",
    date: "2026.04.21",
  },
  {
    initial: "Y",
    name: "Yui · 시부야",
    note: "진흙은 만국 공통 — 이 말 너무 좋아.",
    date: "2026.04.20",
  },
  {
    initial: "현",
    name: "현주",
    note: "같이 있었는데 이 카드 보고 또 웃었어요.",
    date: "2026.04.20",
  },
];

function HiFiveCard() {
  return (
    <div className="mt-5 rounded-[14px] border border-v2-rule bg-white px-5 py-5">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-v2-ink">
          ★ 하이파이브
        </span>
        <span className="text-[11px] font-semibold text-[#C4956A]">12개</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {HIFIVES.map((h) => (
          <div key={h.name} className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#EDECEA] text-[11px] font-semibold text-[#888]">
              {h.initial}
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-v2-ink">{h.name}</p>
              <p className="text-[12px] font-light leading-[1.65] text-v2-ink3">
                {h.note}
              </p>
              <p className="mt-0.5 text-[10.5px] text-[#AEAEB2]">{h.date}</p>
            </div>
          </div>
        ))}
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
          카드는 기본 비공개입니다.
        </strong>
        &nbsp;공개로 설정한 카드만 피드에 노출되며, 언제든 변경할 수 있습니다.
      </p>
    </div>
  );
}
