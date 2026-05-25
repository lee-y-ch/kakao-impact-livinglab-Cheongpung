import Image from "next/image";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { CountUp } from "@/components/v2/CountUp";
import { FaqAccordion } from "@/components/v2/FaqAccordion";
import { HighlightQuote } from "@/components/v2/HighlightQuote";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — 강화유니버스 메인 (`/`).
 * 시안: design-v2-reference/강화유니버스_랜딩페이지_ver.1_공유패키지 2/
 *       강화유니버스_랜딩페이지_ver.1.html (팀원 ver.1).
 *
 * 섹션:
 *  1. Hero — 전면 사진 배경 + 다크 오버레이 + 흰 텍스트
 *  2. Intro Strip — 다크 가로 스트립 (잠시섬 / 2026 프로젝트)
 *  3. Element 01: 잠시섬 — 사진 + 텍스트 그리드
 *  4. Element 02: 2026 프로젝트 — 2x2 카드 4종 (3D 배치 이미지)
 *  5. Manifesto Collage — 인용 + 12열 인스타 6장
 *  6. Stats — 3 카운터 (시작 연도 / 누적 방문자 / 주민 — 실데이터)
 *  7. FAQ — 4 아코디언
 *  8. CTA
 *
 * 자산은 public/v2/landing/ 에 ASCII 이름으로 정리. Footer 는 root layout 글로벌 사용.
 */
type HeroContent = {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  imageUrl: string;
};

const HERO_DEFAULT: HeroContent = {
  eyebrow: "Ganghwa Universe · 2026",
  title: "환대로\n만들어가는 세계",
  accent: "세계",
  subtitle: "우리가 살고 싶은 세계를\n강화에서 함께 실험해요.",
  imageUrl: "/v2/landing/hero-bg.png",
};

export default async function HomePage() {
  const admin = createAdminClient();

  const [pageViewsRes, usersRes, heroRes] = await Promise.all([
    admin.from("page_views").select("id", { count: "exact", head: true }),
    admin.from("users").select("id", { count: "exact", head: true }),
    admin
      .from("site_settings")
      .select(
        "hero_eyebrow, hero_title, hero_accent, hero_subtitle, hero_image_url"
      )
      .eq("key", "hero")
      .maybeSingle(),
  ]);

  const stats = {
    visitors: pageViewsRes.count ?? 0,
    residents: usersRes.count ?? 0,
  };

  // site_settings 미적용(마이그레이션 전)이거나 행이 없으면 hardcoded 기본값 fallback.
  const heroRow = heroRes.data;
  const hero: HeroContent = {
    eyebrow: heroRow?.hero_eyebrow ?? HERO_DEFAULT.eyebrow,
    title: heroRow?.hero_title ?? HERO_DEFAULT.title,
    accent: heroRow?.hero_accent ?? HERO_DEFAULT.accent,
    subtitle: heroRow?.hero_subtitle ?? HERO_DEFAULT.subtitle,
    imageUrl: heroRow?.hero_image_url ?? HERO_DEFAULT.imageUrl,
  };

  return (
    <>
      <Hero hero={hero} />
      <IntroStrip />
      <Jamsiseom />
      <ProjectsGrid />
      <Manifesto />
      <Stats visitors={stats.visitors} residents={stats.residents} />
      <Faq />
      <CtaSection />
    </>
  );
}

/* ─────────────────────────── 1. Hero ─────────────────────────── */

function Hero({ hero }: { hero: HeroContent }) {
  return (
    <section
      id="hero"
      className="relative flex min-h-[680px] items-center bg-cover bg-center bg-no-repeat"
      style={{
        height: "100vh",
        backgroundImage: `url('${hero.imageUrl}')`,
      }}
    >
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: "rgba(0, 0, 0, 0.35)" }}
        aria-hidden
      />
      <div className="relative z-[2] mx-auto w-full max-w-[1200px] px-6 lg:px-[60px]">
        {hero.eyebrow ? (
          <p className="mb-7 text-[11px] font-semibold uppercase tracking-[4px] text-white/70">
            {hero.eyebrow}
          </p>
        ) : null}
        <h1
          className="mb-6 whitespace-pre-line font-bold leading-[1.1] tracking-[-2px] text-white"
          style={{ fontSize: "clamp(44px, 6.5vw, 80px)" }}
        >
          {renderTitleWithAccent(hero.title, hero.accent)}
        </h1>
        {hero.subtitle ? (
          <p
            className="mb-12 max-w-[420px] whitespace-pre-line font-light leading-[1.75] text-white/80"
            style={{ fontSize: "clamp(15px, 1.8vw, 19px)" }}
          >
            {hero.subtitle}
          </p>
        ) : null}
        <Link
          href="#jamsiseom"
          className="inline-flex items-center gap-1.5 rounded-full bg-v2-brand px-8 py-3.5 text-[14px] font-medium tracking-[0.2px] text-white transition-all hover:scale-[1.02] hover:bg-v2-brandDeep active:scale-[0.98]"
        >
          시작하기
        </Link>
      </div>
      <div
        className="absolute bottom-11 left-1/2 z-[2] hidden -translate-x-1/2 flex-col items-center gap-2.5 text-[10px] tracking-[3px] sm:flex"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        SCROLL
        <div
          className="h-11 w-px"
          style={{ background: "rgba(255,255,255,0.3)" }}
        />
      </div>
    </section>
  );
}

/**
 * 제목 안에서 accent 단어를 초록색으로 강조.
 * accent 가 비었거나 title 에 없으면 원문 그대로 (whitespace-pre-line 로 \n 처리).
 */
function renderTitleWithAccent(title: string, accent: string) {
  if (!accent || !title.includes(accent)) return title;
  const parts = title.split(accent);
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 ? (
        <span style={{ color: "#2ECC8E" }}>{accent}</span>
      ) : null}
    </span>
  ));
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
        액티브 라이프 / 로컬 문화 공동 창작 / 글로벌 네트워크 / 테크 & 솔루션
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
    <span
      className="h-[3px] w-[3px] flex-shrink-0 rounded-full"
      style={{ background: "rgba(255,255,255,0.2)" }}
    />
  );
}

/* ─────────────────────────── 3. Element 01: 잠시섬 ─────────────────────────── */

function Jamsiseom() {
  return (
    <section
      id="jamsiseom"
      className="mx-auto max-w-[1200px] px-6 py-[90px] lg:px-[60px] lg:py-[130px]"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[100px]">
        <AnimateOnScroll delay={0.07}>
          <div className="relative aspect-[5/4] overflow-hidden rounded-[4px] bg-[#EDECEA]">
            <Image
              src="/v2/landing/jamsi-hero.jpg"
              alt="잠시섬 — 강화유니버스 베이스캠프"
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover object-bottom transition-transform duration-500 hover:scale-[1.03]"
              priority={false}
            />
          </div>
        </AnimateOnScroll>
        <div>
          <AnimateOnScroll>
            <p className="mb-3.5 text-[13px] font-semibold uppercase tracking-[3.5px] text-[#555]">
              Element 01 &nbsp;·&nbsp; 베이스캠프
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.07}>
            <h2
              className="mb-[22px] font-bold leading-[1.2] tracking-[-1.2px] text-v2-ink"
              style={{ fontSize: "clamp(28px, 3.8vw, 44px)" }}
            >
              강화유니버스의
              <br />
              출입구, 잠시섬
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.14}>
            <p className="mb-9 text-[14.5px] font-light leading-[1.9] text-[#5A5A5A]">
              잠시섬은 모든 여정이 시작되는 곳이에요.
              <br />
              단순한 체류를 넘어, 지역 문화를 함께 만들고
              <br />
              환대의 감각을 확장하는 시민이 되는 경험을
              <br />
              함께 열어가는 환대의 플랫폼이에요.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.21}>
            <div className="flex flex-wrap items-center gap-5">
              <a
                href="https://www.guniverse.net/jamsiisland?reviewPage=1&reviewCategory=null"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border-b border-v2-brand pb-0.5 text-[13px] font-medium text-v2-brand transition-all hover:gap-3.5 hover:opacity-80"
              >
                더 알아보기 →
              </a>
              <a
                href="https://www.guniverse.net/jamsiisland/stay?reviewPage=1&reviewCategory=null"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-v2-brand px-6 py-2.5 text-[13px] font-medium text-white transition-all hover:scale-[1.02] hover:bg-v2-brandDeep active:scale-[0.98]"
              >
                참여하기
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 4. Element 02: 2026 프로젝트 ─────────────────────────── */

type ProjectCardSpec = {
  badge: string;
  title: string;
  desc: string;
  bg: string;
  badgeBg: string;
  badgeColor: string;
  linkColor: string;
  btnBg: string;
  btnColor: string;
  imageStyle: "nukki" | "single" | "local";
  image: { src: string; alt: string };
  links: { more: string; join: string };
};

const PROJECT_CARDS: ProjectCardSpec[] = [
  {
    badge: "클럽형",
    title: "액티브 라이프",
    desc: "강화의 자연 속에서 몸으로 경험하는 활동적 회복.\n위캔드 요가 클럽, 강화 팜 라이프 클럽",
    bg: "#FDF4EC",
    badgeBg: "rgba(180,110,40,0.12)",
    badgeColor: "#9B6020",
    linkColor: "#1A1A1A",
    btnBg: "rgba(180,110,40,0.12)",
    btnColor: "#9B6020",
    imageStyle: "nukki",
    image: { src: "/v2/landing/card-active.png", alt: "강화 팜 라이프" },
    links: {
      more: "https://www.guniverse.net/program/all?page=1",
      join: "https://www.guniverse.net/program/all?page=1",
    },
  },
  {
    badge: "아카이브형",
    title: "로컬 문화 공동 창작",
    desc: "강화의 색깔을 담은 IP를 함께 만드는 프로젝트.\n윤슬 앨범 같이 만들기, 강화도 차 만들기",
    bg: "#EAF5EE",
    badgeBg: "rgba(80,150,100,0.12)",
    badgeColor: "#3A7A55",
    linkColor: "#1A1A1A",
    btnBg: "rgba(80,150,100,0.12)",
    btnColor: "#3A7A55",
    imageStyle: "local",
    image: {
      src: "/local/ganghwa/ganghwa-05.jpg",
      alt: "강화도 로컬 문화 공동 창작",
    },
    links: {
      more: "https://www.guniverse.net/program/all?page=1",
      join: "https://www.guniverse.net/program/all?page=1",
    },
  },
  {
    badge: "관계형",
    title: "글로벌 & 로컬 네트워크",
    desc: "강화의 환대를 세계와 연결하는 롱텀 프로젝트.\n시부야대학 교류, 가미야마 협력 파트너십",
    bg: "#EEF3FF",
    badgeBg: "rgba(49,130,246,0.12)",
    badgeColor: "#2060C8",
    linkColor: "#2060C8",
    btnBg: "rgba(49,130,246,0.14)",
    btnColor: "#2060C8",
    imageStyle: "single",
    image: { src: "/local/shibuya/shibuya-05.jpg", alt: "시부야대학 교류" },
    links: {
      more: "https://jindalrae.kr/contact",
      join: "https://jindalrae.kr/contact",
    },
  },
  {
    badge: "인프라형",
    title: "테크 & 솔루션",
    desc: "세계관을 지속 가능하게 만드는 기술적 시도.\n로컬 유니버스 앱, AI Top 100, 테크포임팩트 캠퍼스",
    bg: "#E8F0F5",
    badgeBg: "rgba(50,100,160,0.12)",
    badgeColor: "#2060A0",
    linkColor: "#2060A0",
    btnBg: "rgba(50,100,160,0.12)",
    btnColor: "#2060A0",
    imageStyle: "single",
    image: { src: "/v2/landing/card-tech.png", alt: "로컬 유니버스 앱" },
    links: {
      more: "https://local-universe.framer.website/",
      join: "https://techforimpact.io/",
    },
  },
];

function ProjectsGrid() {
  return (
    <section id="projects" className="bg-v2-paper">
      <div className="mx-auto max-w-[1200px] px-6 py-[90px] lg:px-[60px] lg:py-[130px]">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:mb-16 lg:flex-row lg:items-end">
          <AnimateOnScroll>
            <p className="mb-3.5 text-[13px] font-semibold uppercase tracking-[3.5px] text-[#555]">
              Element 02 &nbsp;·&nbsp; 2026 프로젝트
            </p>
            <h2
              className="font-bold leading-[1.2] tracking-[-1.2px] text-v2-ink"
              style={{ fontSize: "clamp(28px, 3.8vw, 44px)" }}
            >
              강화에서 펼치는
              <br />
              작은 실험들
            </h2>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.14}>
            <p className="max-w-[300px] text-[14px] font-light leading-[1.8] text-[#888] lg:text-right">
              정답이 없는 곳에서 시작하는 실험들.
              <br />
              강화의 삶을 함께 만들어갑니다.
            </p>
          </AnimateOnScroll>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PROJECT_CARDS.map((card, i) => (
            <AnimateOnScroll key={card.title} delay={(i + 1) * 0.08}>
              <ProjectCardView card={card} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCardView({ card }: { card: ProjectCardSpec }) {
  return (
    <div
      className="group relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[20px] p-[36px_36px_32px] transition-all duration-[250ms] hover:scale-[1.015] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] lg:p-[40px_40px_36px]"
      style={{ background: card.bg }}
    >
      <CardImageBackdrop card={card} />

      <div className="relative z-[1] flex justify-start">
        <span
          className="inline-block rounded-full px-3 py-[5px] text-[10.5px] font-semibold uppercase tracking-[1.5px]"
          style={{ background: card.badgeBg, color: card.badgeColor }}
        >
          {card.badge}
        </span>
      </div>

      <div className="relative z-[1] mt-6 flex flex-1 flex-col justify-end">
        <h3
          className="mb-3 font-bold leading-[1.2] tracking-[-0.8px] text-v2-ink"
          style={{ fontSize: "clamp(22px, 2.8vw, 32px)" }}
        >
          {card.title}
        </h3>
        <p className="mb-7 whitespace-pre-line text-[13px] font-light leading-[1.75] text-[#6E6E73]">
          {card.desc}
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <a
            href={card.links.more}
            target="_blank"
            rel="noreferrer"
            className="group/link inline-flex items-center gap-1 text-[13px] font-medium transition-all hover:gap-2"
            style={{ color: card.linkColor }}
          >
            더 알아보기 ›
          </a>
          <a
            href={card.links.join}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full px-[18px] py-2 text-[13px] font-medium transition-all hover:scale-[1.02] hover:opacity-85 active:scale-[0.98]"
            style={{ background: card.btnBg, color: card.btnColor }}
          >
            참여하기
          </a>
        </div>
      </div>
    </div>
  );
}

function CardImageBackdrop({ card }: { card: ProjectCardSpec }) {
  // 시안의 3D 배치 — 스타일별 width/height/transform 다르게.
  // pointer-events:none, z-index 0 으로 텍스트 뒤에 배치.
  if (card.imageStyle === "nukki") {
    return (
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.image.src}
          alt={card.image.alt}
          className="absolute right-0 top-0 opacity-20 transition-opacity duration-300 group-hover:opacity-30"
          style={{
            width: "75%",
            height: "95%",
            objectFit: "contain",
            objectPosition: "top right",
            transform: "perspective(700px) rotateY(-8deg) rotateX(2deg)",
            transformOrigin: "top right",
          }}
        />
      </div>
    );
  }

  if (card.imageStyle === "local") {
    return (
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.image.src}
          alt={card.image.alt}
          className="absolute right-0 top-0 opacity-20 transition-opacity duration-300 group-hover:opacity-30"
          style={{
            width: "65%",
            height: "80%",
            objectFit: "cover",
            objectPosition: "center top",
            borderRadius: "0 20px 0 14px",
            transform: "perspective(600px) rotateY(-10deg) rotateX(3deg)",
            transformOrigin: "top right",
          }}
        />
      </div>
    );
  }

  // single
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.image.src}
        alt={card.image.alt}
        className="absolute right-0 top-0 opacity-20 transition-opacity duration-300 group-hover:opacity-30"
        style={{
          width: "60%",
          height: "75%",
          objectFit: "cover",
          objectPosition: "center",
          borderRadius: "0 20px 0 14px",
          transform: "perspective(600px) rotateY(-14deg) rotateX(5deg)",
          transformOrigin: "top right",
        }}
      />
    </div>
  );
}

/* ─────────────────────────── 5. Manifesto Collage ─────────────────────────── */

type CollageItem = {
  src: string;
  desc: string;
  title: string;
  /** Tailwind grid-column / grid-row utility 인라인 클래스 */
  area: { col: string; row: string };
  imgPosition?: string;
};

const COLLAGE_ITEMS: CollageItem[] = [
  {
    src: "/v2/landing/collage-1.jpg",
    desc: "나만의 그림책 만들기",
    title: "<잠시섬>",
    area: { col: "col-start-1 col-end-4", row: "row-start-1 row-end-3" },
  },
  {
    src: "/v2/landing/collage-2.jpg",
    desc: "걱정이들의 백업 토크",
    title: "<잠시섬>",
    area: { col: "col-start-4 col-end-9", row: "row-start-1 row-end-3" },
    imgPosition: "center 55%",
  },
  {
    src: "/v2/landing/collage-4.jpg",
    desc: "자연속 힐링요가",
    title: "<잠시섬>",
    area: { col: "col-start-9 col-end-13", row: "row-start-1 row-end-3" },
    imgPosition: "center 70%",
  },
  {
    src: "/v2/landing/collage-3.jpg",
    desc: "산-뜻 하이킹",
    title: "<잠시섬>",
    area: { col: "col-start-1 col-end-4", row: "row-start-3 row-end-5" },
    imgPosition: "center 70%",
  },
  {
    src: "/v2/landing/collage-6.jpg",
    desc: "차 한잔의 환대",
    title: "<잠시섬>",
    area: { col: "col-start-4 col-end-7", row: "row-start-3 row-end-5" },
    imgPosition: "center 70%",
  },
  {
    src: "/v2/landing/collage-8.jpg",
    desc: "강화 나들길 걷기",
    title: "<잠시섬>",
    area: { col: "col-start-7 col-end-13", row: "row-start-3 row-end-5" },
    imgPosition: "center 70%",
  },
];

function Manifesto() {
  return (
    <section className="bg-v2-paper">
      <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-[60px]">
        <div className="mb-8">
          <AnimateOnScroll>
            <p className="mb-3.5 text-[13px] font-semibold uppercase tracking-[3.5px] text-[#555]">
              Manifesto &nbsp;·&nbsp; 2026
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.08}>
            <HighlightQuote>
              &ldquo;여러분은 어떤 세상에서 살고 싶나요?&rdquo;
            </HighlightQuote>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.16}>
            <cite className="mt-3.5 block text-[10px] not-italic tracking-[3px] text-[#AEAEB2]">
              GANGHWA UNIVERSE &nbsp;·&nbsp; MANIFESTO 2026
            </cite>
          </AnimateOnScroll>
        </div>

        <div
          className="grid gap-[5px]"
          style={{
            gridTemplateColumns: "repeat(12, 1fr)",
            gridTemplateRows: "130px 130px 110px 110px",
          }}
        >
          {COLLAGE_ITEMS.map((item, i) => (
            <AnimateOnScroll
              key={item.src}
              delay={(i + 1) * 0.06}
              className={`${item.area.col} ${item.area.row}`}
            >
              <CollageItemView item={item} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function CollageItemView({ item }: { item: CollageItem }) {
  return (
    <a
      href="https://www.instagram.com/ganghwauniverse/"
      target="_blank"
      rel="noreferrer"
      className="group/collage relative block h-full w-full overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt=""
        className="block h-full w-full object-cover transition-transform duration-300 group-hover/collage:scale-[1.04]"
        style={{
          objectPosition: item.imgPosition ?? "center top",
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/55 p-4 text-center opacity-0 transition-opacity duration-300 group-hover/collage:opacity-100">
        <p className="text-[16px] font-semibold leading-[1.6] text-white">
          {item.desc}
        </p>
        <p className="mt-2 text-[15px] font-light leading-[1.4] tracking-[1px] text-white/85">
          {item.title}
        </p>
      </div>
    </a>
  );
}

/* ─────────────────────────── 6. Stats ─────────────────────────── */

function Stats({
  visitors,
  residents,
}: {
  visitors: number;
  residents: number;
}) {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-20 pt-[120px] lg:px-[60px]">
      <AnimateOnScroll>
        <p className="mb-14 text-[17px] font-semibold tracking-[3.5px] text-[#555]">
          강화유니버스 현황
        </p>
      </AnimateOnScroll>
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-v2-rule sm:grid-cols-3">
        <StatCell
          target={2016}
          format={false}
          label="잠시섬 시작 연도"
          hoverClass="hover:bg-[#C73322]/25"
          hoverTextClass="group-hover/stat:text-[#C73322]"
          showPlus={false}
        />
        <StatCell
          target={visitors}
          format
          label="누적 방문자"
          hoverClass="hover:bg-[#217A43]/25"
          hoverTextClass="group-hover/stat:text-[#217A43]"
          showPlus
        />
        <StatCell
          target={residents}
          format
          label="강화유니버스 주민"
          hoverClass="hover:bg-[#1F55B8]/25"
          hoverTextClass="group-hover/stat:text-[#1F55B8]"
          showPlus
          rightBorder={false}
        />
      </div>
    </section>
  );
}

function StatCell({
  target,
  format,
  label,
  hoverClass,
  hoverTextClass,
  showPlus,
  rightBorder = true,
}: {
  target: number;
  format: boolean;
  label: string;
  hoverClass: string;
  hoverTextClass: string;
  showPlus: boolean;
  rightBorder?: boolean;
}) {
  return (
    <div
      className={`group/stat px-11 py-[52px] text-center transition-colors duration-300 ${hoverClass} ${
        rightBorder
          ? "border-b border-v2-rule sm:border-b-0 sm:border-r"
          : "border-b border-v2-rule sm:border-b-0"
      }`}
    >
      <p
        className={`mb-2.5 text-[52px] font-bold leading-none tracking-[-2px] text-v2-brand transition-colors duration-300 ${hoverTextClass}`}
      >
        <CountUp target={target} format={format} />
        {showPlus ? (
          <span
            className={`text-[28px] font-bold text-v2-brand transition-colors duration-300 ${hoverTextClass}`}
          >
            +
          </span>
        ) : null}
      </p>
      <p
        className={`text-[15px] font-normal text-[#777] transition-colors duration-300 ${hoverTextClass}`}
      >
        {label}
      </p>
    </div>
  );
}

/* ─────────────────────────── 7. FAQ ─────────────────────────── */

const FAQ_ITEMS = [
  {
    q: "강화유니버스는 어떤 곳인가요?",
    a: "강화유니버스는 체류형 관광을 넘어 지역 문화를 함께 만들고 세계관을 공동으로 확장하는 커뮤니티 플랫폼이에요. 여행자가 소비자가 아니라 지역의 시민(Citizen)이 되는 경험을 제안해요.",
  },
  {
    q: "잠시섬은 무엇인가요?",
    a: "잠시섬은 강화유니버스의 출입구이자 베이스캠프예요. 기수제로 운영되는 체류형 환대 플랫폼으로, 강화유니버스의 여러 프로젝트를 담는 그릇이자 OS 역할을 해요.",
  },
  {
    q: "2026 프로젝트에 참여하려면 어떻게 하나요?",
    a: "액티브 라이프, 로컬 문화 공동 창작, 글로벌 네트워크, 테크 & 솔루션 4개 분류 중 관심 있는 프로젝트를 골라 문의할 수 있어요. 하단의 '참여하기' 버튼을 눌러주세요.",
  },
  {
    q: "강화유니버스는 누구나 참여할 수 있나요?",
    a: "네. 강화에서 새로운 삶을 실험해보고 싶은 분이라면 누구나 함께할 수 있어요. 여행자, 창작자, 기술자, 활동가 모두 환영해요. 환대의 감각을 함께 나눌 마음이면 충분해요.",
  },
];

function Faq() {
  return (
    <section id="faq" className="bg-v2-paper py-20 lg:py-[130px]">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-[60px]">
        <AnimateOnScroll>
          <p
            className="mb-12 font-semibold uppercase text-[#555]"
            style={{
              fontSize: "22px",
              letterSpacing: "2px",
            }}
          >
            자주 묻는 질문
          </p>
        </AnimateOnScroll>
        <FaqAccordion items={FAQ_ITEMS} />
      </div>
    </section>
  );
}

/* ─────────────────────────── 8. CTA ─────────────────────────── */

function CtaSection() {
  return (
    <section
      id="cta"
      className="px-6 py-[90px] text-center lg:px-[60px] lg:py-[120px]"
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
        <AnimateOnScroll delay={0.08}>
          <p className="mb-11 text-[16px] font-light leading-[1.85] text-white/80">
            강화유니버스에서 함께 실험해요.
            <br />
            작은 시도들이 모여 세계를 만들어요.
          </p>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.16}>
          <a
            href="https://www.guniverse.net/"
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full bg-white px-10 py-4 text-[15px] font-semibold text-v2-brandDeep transition-all hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]"
          >
            강화유니버스 참여하기
          </a>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
