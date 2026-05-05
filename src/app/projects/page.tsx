import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";

/**
 * v2 redesign — `/projects` 프로젝트 인덱스.
 * 시안에는 단일 프로젝트 상세(`강화유니버스_프로젝트.html`) 만 있어
 * 이 인덱스는 같은 톤의 placeholder 카드 그리드로 구성한다.
 * 카드 클릭 시 `/projects/[slug]` 상세로 이동.
 */
type ProjectListItem = {
  slug: string;
  category: "공유지" | "네트워크" | "세계" | "정책";
  badgeBg: string;
  badgeColor: string;
  period: string;
  title: string;
  desc: string;
  cards: number;
  participants: number;
  chapters: string;
};

const PROJECTS: ProjectListItem[] = [
  {
    slug: "shibuya-exchange",
    category: "네트워크",
    badgeBg: "rgba(107,175,138,0.12)",
    badgeColor: "#3A7A55",
    period: "2024 – 2028",
    title: "시부야 교류",
    desc: "강화와 시부야, 두 도시의 사람들이 매년 서로를 방문하며 일상을 겹쳐갑니다.",
    cards: 22,
    participants: 31,
    chapters: "3 / 5",
  },
  {
    slug: "monthly-life",
    category: "공유지",
    badgeBg: "rgba(180,110,40,0.1)",
    badgeColor: "#9B6020",
    period: "2024 – 진행 중",
    title: "한달살기",
    desc: "한 달 동안 강화에 머물며 옆집 할머니의 쑥 한 바구니까지 이웃이 되어가는 과정.",
    cards: 18,
    participants: 22,
    chapters: "18회차 진행",
  },
  {
    slug: "haenyeo-school",
    category: "세계",
    badgeBg: "rgba(49,130,246,0.1)",
    badgeColor: "#2060C8",
    period: "2025 – 2027",
    title: "해녀 학교",
    desc: '"고향이 하나 더 생긴 것 같다"는 한 줄을 만든 6회차의 기록.',
    cards: 14,
    participants: 18,
    chapters: "6 / 10",
  },
  {
    slug: "shared-kitchen",
    category: "공유지",
    badgeBg: "rgba(180,110,40,0.1)",
    badgeColor: "#9B6020",
    period: "2024 – 진행 중",
    title: "공유 주방",
    desc: "오늘 아침 바다에서 온 재료로 다 같이 칼국수를 끓여 먹는 동네 부엌.",
    cards: 11,
    participants: 24,
    chapters: "7회차",
  },
  {
    slug: "empty-house-policy",
    category: "정책",
    badgeBg: "rgba(130,90,180,0.1)",
    badgeColor: "#6040A0",
    period: "2025 – 2028",
    title: "빈집 정책 연구",
    desc: "빈집 주인 할아버지의 마음과 군청 데이터를 함께 모아 만드는 정책 제안.",
    cards: 9,
    participants: 7,
    chapters: "14회차",
  },
  {
    slug: "hospitality-archive",
    category: "세계",
    badgeBg: "rgba(49,130,246,0.1)",
    badgeColor: "#2060C8",
    period: "2024 – 진행 중",
    title: "환대 아카이빙",
    desc: "폐교의 책상 위에 쓴 편지처럼, 강화의 환대를 기록으로 남기는 워크숍.",
    cards: 16,
    participants: 28,
    chapters: "12회차",
  },
];

export default function ProjectsPage() {
  return (
    <>
      <PageHeader />
      <ProjectsGrid />
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
      <div className="mx-auto max-w-[1280px] px-6 pb-14 pt-14 lg:px-[60px]">
        <AnimateOnScroll>
          <p className="mb-4 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
            PROJECTS · 강화유니버스의 장기 프로젝트
          </p>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.08}>
          <h1
            className="mb-[18px] font-bold leading-[1.1] tracking-[-2px] text-v2-ink"
            style={{ fontSize: "clamp(36px, 5vw, 60px)" }}
          >
            여러 해에 걸쳐
            <br />
            <span style={{ color: "#6BAF8A" }}>이어지는 실험</span>들
          </h1>
        </AnimateOnScroll>
        <AnimateOnScroll delay={0.16}>
          <p className="max-w-[520px] text-[15px] font-light leading-[1.8] text-v2-ink3">
            한 번의 이벤트가 아니라, 챕터로 나누어 매년 돌아오는 환대의 여정.
            <br />
            관심 있는 프로젝트를 골라 카드로 들어가 보세요.
          </p>
        </AnimateOnScroll>
      </div>
    </div>
  );
}

function ProjectsGrid() {
  return (
    <div className="bg-v2-paper py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-[60px]">
        <AnimateOnScroll>
          <div className="mb-9 flex items-end justify-between">
            <p className="text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
              ALL PROJECTS · {PROJECTS.length}개
            </p>
            <span className="text-[12px] font-light text-[#AEAEB2]">
              카테고리 4종 · 시간순 표시
            </span>
          </div>
        </AnimateOnScroll>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <AnimateOnScroll key={p.slug} delay={(i + 1) * 0.06}>
              <ProjectListCard project={p} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectListCard({ project }: { project: ProjectListItem }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex h-full flex-col rounded-[16px] border border-black/[0.06] bg-white p-6 transition-all duration-[220ms] hover:-translate-y-[3px] hover:shadow-[0_14px_36px_rgba(0,0,0,0.08)]"
    >
      <div className="mb-5 flex items-center justify-between">
        <span
          className="rounded-full px-3 py-[5px] text-[10px] font-semibold uppercase tracking-[1.5px]"
          style={{ background: project.badgeBg, color: project.badgeColor }}
        >
          {project.category}
        </span>
        <span className="text-[11px] font-light tracking-[0.5px] text-[#AEAEB2]">
          {project.period}
        </span>
      </div>
      <h3
        className="mb-2.5 font-bold tracking-[-0.5px] text-v2-ink"
        style={{ fontSize: "clamp(20px, 2vw, 24px)" }}
      >
        {project.title}
      </h3>
      <p className="mb-7 flex-1 text-[13px] font-light leading-[1.75] text-v2-ink3">
        {project.desc}
      </p>
      <div className="flex items-center justify-between border-t border-[#F0F0EC] pt-4">
        <div className="flex gap-5">
          <Stat num={project.cards} label="카드" accent />
          <Stat num={project.participants} label="참여자" />
        </div>
        <span className="text-[11px] font-light text-[#AEAEB2]">
          {project.chapters}
        </span>
      </div>
    </Link>
  );
}

function Stat({
  num,
  label,
  accent,
}: {
  num: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={`text-[18px] font-bold leading-none tracking-[-0.5px] ${
          accent ? "text-[#6BAF8A]" : "text-v2-ink"
        }`}
      >
        {num}
      </span>
      <span className="text-[10.5px] font-light text-[#AEAEB2]">{label}</span>
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
          프로젝트는 한 번이 아니라 챕터로 이어집니다.
        </strong>
        &nbsp;각 프로젝트 카드를 눌러 전체 진행 흐름을 확인하세요.
      </p>
    </div>
  );
}
