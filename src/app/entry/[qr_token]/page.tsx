import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";

/**
 * v2 redesign — `/entry/[qr_token]` 카드 작성.
 * 시안: design-v2-reference/강화유니버스_카드작성.html.
 *
 * 좌: 작성 폼 (QR 위치 / 카테고리 / 장소 / 메모 / 함께한 사람 / 공개 토글)
 * 우: 라이브 프리뷰 (카드 앞면 + 뒷면)
 *
 * MVP 단계라 폼 인터랙션은 정적 표현 (실데이터 연동 시 client 분리).
 */
export default function EntryPage() {
  return (
    <>
      <Breadcrumb />
      <EntryLayout />
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
            href="/projects/shibuya-exchange"
            className="transition-colors hover:text-v2-ink"
          >
            ← 시부야 교류
          </Link>
          <span className="text-[#D0D0D0]">/</span>
          <strong className="font-medium text-v2-ink3">카드 작성</strong>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

function EntryLayout() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-8 lg:px-[60px]">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_400px] lg:gap-12">
        <FormSection />
        <PreviewSection />
      </div>
    </div>
  );
}

function FormSection() {
  return (
    <div>
      <AnimateOnScroll>
        <div className="mb-8">
          <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
            ENTRY · 카드 작성
          </p>
          <h1
            className="mb-2 font-bold leading-[1.2] tracking-[-1px] text-v2-ink"
            style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
          >
            오늘, 이곳에서
            <br />
            무엇을 봤나요?
          </h1>
          <p className="text-[13.5px] font-light leading-[1.75] text-v2-ink3">
            한 줄이면 충분합니다. 잘 쓰지 않아도 됩니다.
            <br />
            짧은 메모가 다른 사람의 다음 발걸음이 될 수 있어요.
          </p>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.08}>
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-v2-rule bg-white px-4 py-2 text-[12px] font-medium text-v2-ink">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#6BAF8A" }}
          />
          QR · r7f2a · 갯벌카페
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.08}>
        <FieldGroup label="카테고리 · 어떤 결의 순간인가요">
          <div className="flex flex-wrap gap-2">
            <CatBtn cls="c-commons">공유지</CatBtn>
            <CatBtn cls="c-network" active>
              네트워크
            </CatBtn>
            <CatBtn cls="c-world">세계</CatBtn>
            <CatBtn cls="c-policy">정책</CatBtn>
          </div>
        </FieldGroup>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.16}>
        <FieldGroup label="장소">
          <input
            type="text"
            defaultValue="동막해변"
            placeholder="장소를 입력하세요"
            className="w-full rounded-[10px] border-[1.5px] border-v2-rule bg-white px-4 py-[13px] text-[13.5px] text-v2-ink outline-none transition-colors focus:border-[#6BAF8A]"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["동막해변", "갯벌카페", "전등사", "교동 대룡시장"].map((p) => (
              <span
                key={p}
                className="cursor-pointer rounded-full bg-[#EDECEA] px-3 py-1 text-[11.5px] text-v2-ink3 transition-colors hover:bg-[#6BAF8A] hover:text-white"
              >
                {p}
              </span>
            ))}
          </div>
        </FieldGroup>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.16}>
        <FieldGroup label="메모 · 한 줄">
          <div className="relative">
            <textarea
              maxLength={120}
              placeholder="오늘 이곳에서 일어난 일을 짧게 적어주세요."
              defaultValue="시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도, 진흙은 만국 공통이었다."
              className="h-[120px] w-full resize-none rounded-[10px] border-[1.5px] border-v2-rule bg-white px-4 py-3.5 text-[13.5px] leading-[1.75] text-v2-ink outline-none transition-colors focus:border-[#6BAF8A]"
            />
            <span className="absolute bottom-3 right-3.5 text-[11px] text-[#AEAEB2]">
              88 / 120
            </span>
          </div>
        </FieldGroup>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.24}>
        <FieldGroup label="함께한 사람">
          <div className="flex flex-wrap items-center gap-1.5">
            {["Yui", "Taka", "현주"].map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-full border border-v2-rule bg-[#F5F4F1] px-3 py-1 text-[12px] text-v2-ink"
              >
                {name}{" "}
                <span className="cursor-pointer text-[14px] leading-none text-[#AEAEB2] hover:text-v2-ink">
                  ×
                </span>
              </span>
            ))}
            <button
              type="button"
              className="rounded-full border-[1.5px] border-dashed border-[#C0DED0] bg-transparent px-3 py-1 text-[12px] font-medium text-[#6BAF8A] transition-colors hover:border-[#6BAF8A]"
            >
              + 사람 추가
            </button>
          </div>
        </FieldGroup>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.24}>
        <FieldGroup label="공개 설정">
          <div className="flex items-center justify-between rounded-xl border border-v2-rule bg-white px-5 py-4">
            <div>
              <p className="mb-0.5 text-[13px] font-medium text-v2-ink">
                이 카드를 공개 피드에 보여도 좋습니다
              </p>
              <span className="text-[11.5px] font-light text-[#AEAEB2]">
                언제든지 내 도감에서 변경할 수 있어요
              </span>
            </div>
            <button
              type="button"
              aria-label="공개 토글"
              className="relative h-[26px] w-11 flex-shrink-0 rounded-full border-none transition-colors duration-[250ms]"
              style={{ background: "#6BAF8A" }}
            >
              <span
                className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-transform duration-[250ms]"
                style={{ transform: "translateX(18px)" }}
              />
            </button>
          </div>
        </FieldGroup>
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.24}>
        <button
          type="button"
          className="mt-2 w-full rounded-xl bg-v2-ink px-4 py-4 text-[14px] font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[#333]"
        >
          도감에 저장 →
        </button>
        <p className="mt-2.5 text-center text-[11px] font-light text-[#AEAEB2]">
          카드는 도감에 자동 저장됩니다. 공개 여부는 작성 후 언제든 바꿀 수
          있어요.
        </p>
      </AnimateOnScroll>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[2.5px] text-[#AEAEB2]">
        {label}
      </p>
      {children}
    </div>
  );
}

function CatBtn({
  cls,
  active,
  children,
}: {
  cls: "c-commons" | "c-network" | "c-world" | "c-policy";
  active?: boolean;
  children: React.ReactNode;
}) {
  const colorMap: Record<typeof cls, string> = {
    "c-commons": "#C4956A",
    "c-network": "#6BAF8A",
    "c-world": "#7BA8D4",
    "c-policy": "#9A80C8",
  };
  if (active) {
    return (
      <button
        type="button"
        className="rounded-full border-[1.5px] px-[18px] py-2 text-[12.5px] font-medium text-white transition-all"
        style={{ background: colorMap[cls], borderColor: colorMap[cls] }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      className="rounded-full border-[1.5px] border-v2-rule bg-white px-[18px] py-2 text-[12.5px] font-medium text-v2-ink3 transition-all hover:border-[#C0C0B8] hover:text-v2-ink"
    >
      {children}
    </button>
  );
}

function PreviewSection() {
  return (
    <div className="lg:sticky lg:top-[88px]">
      <AnimateOnScroll delay={0.16}>
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[2.5px] text-[#AEAEB2]">
          LIVE PREVIEW · 적는 동안 카드가 그려집니다
        </p>

        {/* 앞면 */}
        <div
          className="mb-5 overflow-hidden rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
          style={{
            background: "linear-gradient(145deg, #6BAF8A, #4E9070)",
          }}
        >
          <div className="flex items-center justify-between px-5 pb-2.5 pt-4">
            <span className="text-[10px] font-semibold tracking-[2px] text-white/55">
              No.022
            </span>
            <span className="rounded bg-white/20 px-2 py-[3px] text-[9px] font-semibold tracking-[0.8px] text-white/90">
              네트워크
            </span>
          </div>
          <div className="px-5 pb-5 pt-1.5">
            <p
              className="min-h-[60px] text-[14px] font-medium leading-[1.7] text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
            >
              시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도,
              진흙은 만국 공통이었다.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
              <span className="text-[11px] font-light text-white/60">
                @ 동막해변
              </span>
              <span className="text-[11px] font-light text-white/50">
                2026.04.24
              </span>
            </div>
          </div>
        </div>

        {/* 뒷면 */}
        <div
          className="overflow-hidden rounded-2xl px-5 pb-5 pt-4 shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
          style={{ background: "#1A1A1A" }}
        >
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[2px] text-white/30">
            뒷면 · BACK
          </p>
          <p className="min-h-[48px] text-[13.5px] font-light italic leading-[1.8] text-white/80">
            &ldquo;시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도,
            진흙은 만국 공통이었다.&rdquo;
          </p>
          <div className="mt-4 flex justify-between border-t border-white/[0.08] pt-3 text-[10.5px] text-white/30">
            <span>동막해변</span>
            <span>2026.04.24</span>
          </div>
        </div>
      </AnimateOnScroll>
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
        &nbsp;공개로 설정한 카드만 피드에 노출됩니다.
      </p>
    </div>
  );
}
