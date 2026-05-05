import Image from "next/image";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { CountUp } from "@/components/v2/CountUp";
import { FaqAccordion } from "@/components/v2/FaqAccordion";

/**
 * v2 redesign — 강화유니버스 메인 (`/`).
 * 시안: design-v2-reference/index.html.
 *
 * 섹션:
 *  1. Hero — 그라디언트 배경 풀스크린
 *  2. Intro Strip — 다크 가로 스트립
 *  3. Element 01: 잠시섬
 *  4. Element 02: 2026 프로젝트 (4 카드)
 *  5. Manifesto
 *  6. Stats — 3 카운터
 *  7. FAQ — 4 아코디언
 *  8. CTA
 *
 * 데이터는 시안의 하드코딩 카피. Stats 만 추후 Supabase 집계로 교체 예정.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroStrip />
      <Jamsiseom />
      <ProjectsGrid />
      <Manifesto />
      <Stats />
      <Faq />
      <CtaSection />
    </>
  );
}

/* ─────────────────────────── 1. Hero ─────────────────────────── */

function Hero() {
  return (
    <section
      className="relative flex min-h-[680px] items-center"
      style={{
        height: "100vh",
        background:
          "linear-gradient(160deg, #F9FAFB 0%, #F4F5F7 50%, #EDEEF0 100%)",
      }}
    >
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 lg:px-[60px]">
        <p className="mb-7 text-[11px] font-semibold uppercase tracking-[4px] text-v2-brand">
          Ganghwa Universe &nbsp;·&nbsp; 2026
        </p>
        <h1
          className="mb-6 font-bold leading-[1.1] tracking-[-2px] text-v2-ink"
          style={{ fontSize: "clamp(44px, 6.5vw, 80px)" }}
        >
          환대로
          <br />
          만들어가는 <span style={{ color: "#1DB87A" }}>세계</span>
        </h1>
        <p
          className="mb-12 max-w-[420px] font-light leading-[1.75] text-v2-ink3"
          style={{ fontSize: "clamp(15px, 1.8vw, 19px)" }}
        >
          우리가 살고 싶은 세계를
          <br />
          강화에서 함께 실험합니다.
        </p>
        <Link
          href="#jamsiseom"
          className="inline-flex items-center gap-1.5 rounded-full bg-v2-brand px-8 py-3.5 text-[14px] font-medium tracking-[0.2px] text-white transition-all hover:scale-[1.02] hover:bg-v2-brandDeep active:scale-[0.98]"
        >
          시작하기
        </Link>
      </div>
      <div
        className="absolute bottom-11 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 text-[10px] tracking-[3px] sm:flex"
        style={{ color: "rgba(0,0,0,0.25)" }}
      >
        SCROLL
        <div className="h-11 w-px" style={{ background: "rgba(0,0,0,0.15)" }} />
      </div>
    </section>
  );
}

/* ─────────────────────────── 2. Intro Strip ─────────────────────────── */

function IntroStrip() {
  return (
    <div
      className="flex items-center gap-12 overflow-x-auto px-6 py-7 lg:px-[60px]"
      style={{ background: "#1A1A1A" }}
    >
      <strong className="whitespace-nowrap text-[12px] font-medium text-white/70">
        잠시섬
      </strong>
      <IntroDot />
      <span className="whitespace-nowrap text-[12px] tracking-[0.5px] text-white/40">
        베이스캠프 · 체류형 환대 플랫폼
      </span>
      <IntroDot />
      <strong className="whitespace-nowrap text-[12px] font-medium text-white/70">
        2026 프로젝트
      </strong>
      <IntroDot />
      <span className="whitespace-nowrap text-[12px] tracking-[0.5px] text-white/40">
        액티브 라이프 &nbsp;/&nbsp; 로컬 문화 공동 창작 &nbsp;/&nbsp; 글로벌
        네트워크 &nbsp;/&nbsp; 테크 &amp; 솔루션
      </span>
      <IntroDot />
      <span className="whitespace-nowrap text-[12px] tracking-[0.5px] text-white/40">
        소비자에서 시민으로
      </span>
    </div>
  );
}

function IntroDot() {
  return (
    <div className="h-[3px] w-[3px] flex-shrink-0 rounded-full bg-white/20" />
  );
}

/* ─────────────────────────── 3. Element 01: 잠시섬 ─────────────────────────── */

function Jamsiseom() {
  return (
    <section
      id="jamsiseom"
      className="mx-auto max-w-[1200px] px-6 py-[80px] lg:px-[60px] lg:py-[130px]"
    >
      <div className="grid items-center gap-11 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[100px]">
        <AnimateOnScroll delay={0.1}>
          <div className="group relative aspect-[5/4] overflow-hidden rounded">
            <Image
              src="/v2/guniverse_images/guniverse_01.jpg"
              alt="잠시섬 — 강화유니버스 베이스캠프"
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
              priority
            />
            <div
              className="absolute bottom-7 left-7 rounded-md border border-white/40 px-[18px] py-2.5 text-[11px] font-medium tracking-[2px] text-v2-ink"
              style={{
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(8px)",
              }}
            >
              JAMSISEOM
            </div>
          </div>
        </AnimateOnScroll>
        <div>
          <AnimateOnScroll>
            <p className="mb-3.5 text-[10.5px] font-medium uppercase tracking-[3.5px] text-v2-brand">
              Element 01 &nbsp;·&nbsp; 베이스캠프
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.1}>
            <h2
              className="mb-[22px] font-bold leading-[1.2] tracking-[-1.2px] text-v2-ink"
              style={{ fontSize: "clamp(28px, 3.8vw, 44px)" }}
            >
              강화유니버스의
              <br />
              출입구, 잠시섬
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.2}>
            <p className="mb-9 text-[14.5px] font-light leading-[1.9] text-v2-ink2">
              잠시섬은 모든 여정이 시작되는 곳입니다.
              <br />
              단순한 체류를 넘어, 지역 문화를 함께 만들고
              <br />
              환대의 감각을 확장하는 시민이 되는 경험을
              <br />
              제공하는 환대의 플랫폼입니다.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.3}>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                href="#jamsiseom"
                className="inline-flex items-center gap-2 border-b border-v2-brand pb-0.5 text-[13px] font-medium text-v2-brand transition-all hover:gap-3.5 hover:opacity-75"
              >
                더 알아보기 →
              </Link>
              <Link
                href="#cta"
                className="inline-flex items-center gap-1.5 rounded-full bg-v2-brand px-6 py-2.5 text-[13px] font-medium text-white transition-all hover:scale-[1.02] hover:bg-v2-brandDeep active:scale-[0.98]"
              >
                참여하기
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 4. Element 02: 2026 프로젝트 ─────────────────────────── */

type ProjectCard = {
  badge: string;
  title: string;
  desc: React.ReactNode;
  bg: string;
  badgeBg: string;
  badgeColor: string;
  linkColor: string;
  btnBg: string;
  btnColor: string;
};

const PROJECT_CARDS: ProjectCard[] = [
  {
    badge: "클럽형",
    title: "액티브 라이프",
    desc: (
      <>
        강화의 자연 속에서 몸으로 경험하는 활동적 회복.
        <br />
        위캔드 요가 클럽, 강화 팜 라이프 클럽
      </>
    ),
    bg: "#FDF4EC",
    badgeBg: "rgba(180,110,40,0.12)",
    badgeColor: "#9B6020",
    linkColor: "#1A1A1A",
    btnBg: "rgba(180,110,40,0.12)",
    btnColor: "#9B6020",
  },
  {
    badge: "아카이브형",
    title: "로컬 문화 공동 창작",
    desc: (
      <>
        강화의 색깔을 담은 IP를 함께 만드는 프로젝트.
        <br />
        윤슬 앨범 같이 만들기, 강화도 차 만들기
      </>
    ),
    bg: "#EAF5EE",
    badgeBg: "rgba(80,150,100,0.12)",
    badgeColor: "#3A7A55",
    linkColor: "#1A1A1A",
    btnBg: "rgba(80,150,100,0.12)",
    btnColor: "#3A7A55",
  },
  {
    badge: "관계형",
    title: "글로벌 & 로컬 네트워크",
    desc: (
      <>
        강화의 환대를 세계와 연결하는 롱텀 프로젝트.
        <br />
        시부야대학 교류, 가미야마 협력 파트너십
      </>
    ),
    bg: "#EEF3FF",
    badgeBg: "rgba(49,130,246,0.12)",
    badgeColor: "#2060C8",
    linkColor: "#2060C8",
    btnBg: "rgba(49,130,246,0.14)",
    btnColor: "#2060C8",
  },
  {
    badge: "인프라형",
    title: "테크 & 솔루션",
    desc: (
      <>
        세계관을 지속 가능하게 만드는 기술적 시도.
        <br />
        로컬 유니버스 앱, AI Top 100, 테크포임팩트 캠퍼스
      </>
    ),
    bg: "#E8F0F5",
    badgeBg: "rgba(50,100,160,0.12)",
    badgeColor: "#2060A0",
    linkColor: "#2060A0",
    btnBg: "rgba(50,100,160,0.12)",
    btnColor: "#2060A0",
  },
];

function ProjectsGrid() {
  return (
    <div id="projects" className="bg-v2-paper">
      <div className="mx-auto max-w-[1200px] px-6 py-[80px] lg:px-[60px] lg:py-[130px]">
        <div className="mb-12 flex flex-col items-start justify-between gap-8 lg:mb-16 lg:flex-row lg:items-end lg:gap-10">
          <div>
            <AnimateOnScroll>
              <p className="mb-3.5 text-[10.5px] font-medium uppercase tracking-[3.5px] text-v2-brand">
                Element 02 &nbsp;·&nbsp; 2026 프로젝트
              </p>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.1}>
              <h2
                className="font-bold leading-[1.2] tracking-[-1.2px] text-v2-ink"
                style={{ fontSize: "clamp(28px, 3.8vw, 44px)" }}
              >
                강화에서 펼치는
                <br />
                작은 실험들
              </h2>
            </AnimateOnScroll>
          </div>
          <AnimateOnScroll delay={0.2}>
            <p className="max-w-[300px] text-left text-[14px] font-light leading-[1.8] text-[#888] lg:text-right">
              정답이 없는 곳에서 시작하는 실험들.
              <br />
              강화의 삶을 함께 만들어갑니다.
            </p>
          </AnimateOnScroll>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {PROJECT_CARDS.map((c, i) => (
            <AnimateOnScroll key={c.title} delay={(i + 1) * 0.1}>
              <ProjectCardView card={c} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectCardView({ card }: { card: ProjectCard }) {
  return (
    <div
      className="group flex min-h-[280px] cursor-default flex-col justify-between overflow-hidden rounded-[20px] p-7 transition-all duration-[250ms] hover:scale-[1.015] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] sm:p-10 lg:min-h-[340px]"
      style={{ background: card.bg }}
    >
      <div className="flex justify-start">
        <span
          className="inline-block rounded-full px-3 py-[5px] text-[10.5px] font-semibold uppercase tracking-[1.5px]"
          style={{ background: card.badgeBg, color: card.badgeColor }}
        >
          {card.badge}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-end pt-6">
        <h3
          className="mb-3 font-bold leading-[1.2] tracking-[-0.8px] text-v2-ink"
          style={{ fontSize: "clamp(22px, 2.8vw, 32px)" }}
        >
          {card.title}
        </h3>
        <p className="mb-7 text-[13px] font-light leading-[1.75] text-v2-ink3">
          {card.desc}
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <Link
            href="#projects"
            className="group/lk relative inline-flex items-center gap-1 text-[13px] font-medium transition-all hover:gap-2"
            style={{ color: card.linkColor }}
          >
            <span>더 알아보기 ›</span>
            <span
              className="absolute -bottom-0.5 left-0 right-0 h-px origin-left scale-x-0 transition-transform group-hover/lk:scale-x-100"
              style={{ background: card.linkColor }}
            />
          </Link>
          <Link
            href="#cta"
            className="inline-flex items-center gap-1 rounded-full px-[18px] py-2 text-[13px] font-medium transition-all hover:scale-[1.02] hover:opacity-85 active:scale-[0.98]"
            style={{ background: card.btnBg, color: card.btnColor }}
          >
            참여하기
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── 5. Manifesto ─────────────────────────── */

function Manifesto() {
  return (
    <div className="bg-v2-paper px-6 py-[80px] text-center lg:py-[120px]">
      <AnimateOnScroll>
        <blockquote
          className="mx-auto mb-7 max-w-[700px] font-bold leading-[1.45] tracking-[-0.8px] text-v2-ink"
          style={{ fontSize: "clamp(22px, 3.5vw, 38px)" }}
        >
          &ldquo;여러분은 어떤 세상에서
          <br />
          살고 싶나요?&rdquo;
        </blockquote>
      </AnimateOnScroll>
      <AnimateOnScroll delay={0.1}>
        <cite
          className="text-[11px] not-italic tracking-[3px]"
          style={{ color: "#AEAEB2" }}
        >
          GANGHWA UNIVERSE &nbsp;·&nbsp; MANIFESTO 2026
        </cite>
      </AnimateOnScroll>
    </div>
  );
}

/* ─────────────────────────── 6. Stats ─────────────────────────── */

function Stats() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-[80px] lg:px-[60px] lg:pb-20 lg:pt-[120px]">
      <AnimateOnScroll>
        <p className="mb-3.5 text-[10.5px] font-medium uppercase tracking-[3.5px] text-v2-brand">
          강화유니버스 현황
        </p>
      </AnimateOnScroll>
      <div className="mt-14 grid grid-cols-1 overflow-hidden rounded-2xl border border-v2-rule lg:grid-cols-3">
        <StatCell delay={0.1}>
          <p className="mb-2.5 text-[52px] font-bold leading-none tracking-[-2px] text-v2-brand">
            <CountUp target={2022} format={false} />
          </p>
          <p className="text-[12.5px] font-light text-v2-ink4">
            잠시섬 시작 연도
          </p>
        </StatCell>
        <StatCell delay={0.2} divider>
          <p className="mb-2.5 text-[52px] font-bold leading-none tracking-[-2px] text-v2-brand">
            <CountUp target={1240} />
            <span className="text-[28px] font-bold text-v2-brand">+</span>
          </p>
          <p className="text-[12.5px] font-light text-v2-ink4">누적 방문자</p>
        </StatCell>
        <StatCell delay={0.3} divider>
          <p className="mb-2.5 text-[52px] font-bold leading-none tracking-[-2px] text-v2-brand">
            <CountUp target={284} />
            <span className="text-[28px] font-bold text-v2-brand">+</span>
          </p>
          <p className="text-[12.5px] font-light text-v2-ink4">
            강화유니버스 주민
          </p>
        </StatCell>
      </div>
    </div>
  );
}

function StatCell({
  children,
  delay,
  divider,
}: {
  children: React.ReactNode;
  delay: number;
  divider?: boolean;
}) {
  return (
    <AnimateOnScroll
      delay={delay}
      className={`px-11 py-[52px] text-center ${
        divider ? "border-t border-v2-rule lg:border-l lg:border-t-0" : ""
      }`}
    >
      {children}
    </AnimateOnScroll>
  );
}

/* ─────────────────────────── 7. FAQ ─────────────────────────── */

const FAQ_ITEMS = [
  {
    q: "강화유니버스는 어떤 곳인가요?",
    a: "강화유니버스는 체류형 관광을 넘어 지역 문화를 함께 만들고 세계관을 공동으로 확장하는 커뮤니티 플랫폼입니다. 여행자가 소비자가 아닌 지역의 시민(Citizen)이 되는 경험을 제공합니다.",
  },
  {
    q: "잠시섬은 무엇인가요?",
    a: "잠시섬은 강화유니버스의 출입구이자 베이스캠프입니다. 기수제로 운영되는 체류형 환대 플랫폼으로, 강화유니버스의 모든 프로젝트가 담기는 그릇이자 OS 역할을 합니다.",
  },
  {
    q: "2026 프로젝트에 참여하려면 어떻게 하나요?",
    a: "액티브 라이프, 로컬 문화 공동 창작, 글로벌 네트워크, 테크 & 솔루션 4개 분류 중 관심 있는 프로젝트에 신청하실 수 있습니다. 하단의 '참여하기' 버튼을 통해 문의해 주세요.",
  },
  {
    q: "강화유니버스는 누구나 참여할 수 있나요?",
    a: "네, 강화에서 새로운 삶을 실험해보고 싶은 분이라면 누구나 참여하실 수 있습니다. 여행자, 창작자, 기술자, 활동가 모두 환영합니다. 환대의 감각을 함께 나눌 수 있는 분이라면 충분합니다.",
  },
];

function Faq() {
  return (
    <div id="faq" className="bg-v2-paper px-6 pb-[80px] pt-20 lg:pb-[130px]">
      <div className="mx-auto max-w-[1200px] lg:px-[60px]">
        <AnimateOnScroll>
          <p className="mb-12 text-[10.5px] font-medium uppercase tracking-[3.5px] text-v2-brand">
            자주 묻는 질문
          </p>
        </AnimateOnScroll>
        <FaqAccordion items={FAQ_ITEMS} />
      </div>
    </div>
  );
}

/* ─────────────────────────── 8. CTA ─────────────────────────── */

function CtaSection() {
  return (
    <div
      id="cta"
      className="px-6 py-[90px] text-center lg:py-[120px]"
      style={{ background: "#1DB87A" }}
    >
      <div className="mx-auto max-w-[700px]">
        <AnimateOnScroll>
          <h2
            className="mb-5 font-bold leading-[1.2] tracking-[-1.5px] text-white"
            style={{ fontSize: "clamp(28px, 4.5vw, 52px)" }}
          >
            여러분의 실험을
            <br />
            강화에서 시작하세요
          </h2>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.1}>
          <p className="mb-11 text-[16px] font-light leading-[1.85] text-white/80">
            강화유니버스에서 함께 실험해요.
            <br />
            작은 시도들이 모여 세계를 만듭니다.
          </p>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.2}>
          <Link
            href="/login"
            className="inline-block rounded-full bg-white px-10 py-4 text-[15px] font-semibold text-[#1DB87A] transition-all hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]"
          >
            강화유니버스 참여하기
          </Link>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
