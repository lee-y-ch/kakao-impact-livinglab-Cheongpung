import Link from "next/link";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";

/**
 * v2 redesign — `/admin` 운영 홈.
 * 시안: design-v2-reference/강화유니버스_관리자.html.
 *
 * 사이드바 + topbar + 콘텐츠 3 영역. 데이터는 시안 하드코딩.
 * 글로벌 Navbar/Footer 가 root layout 에서 함께 렌더되며, 관리자 콘솔은
 * 그 아래에서 자체 sidebar 로 운영 메뉴를 제공한다.
 */
export default function AdminPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] bg-[#F0F0EC]">
      <Sidebar />
      <div className="ml-0 flex flex-1 flex-col lg:ml-[220px]">
        <Topbar />
        <div className="flex-1 px-6 pb-16 pt-8 lg:px-10">
          <AnimateOnScroll>
            <div className="mb-7">
              <h1 className="mb-1 text-[22px] font-bold tracking-[-0.5px] text-v2-ink">
                오늘 처리할 것들
              </h1>
              <p className="text-[12.5px] font-light text-[#AEAEB2]">
                가장 오래된 검수 · 3일 전 · 긴급 1건 포함
              </p>
            </div>
          </AnimateOnScroll>
          <AlertGrid />
          <TwoColumn />
          <MetricsGrid />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Sidebar ─────────────────────────── */

const SIDEBAR_ITEMS = [
  { icon: "◉", label: "운영 홈", href: "/admin", active: true },
  { icon: "⊞", label: "프로젝트·에피소드", href: "/admin/projects" },
  { icon: "⚑", label: "가게·QR", href: "/admin/shops" },
  { icon: "✓", label: "공개 검수 큐", href: "/admin/review", badge: "7" },
  {
    icon: "!",
    label: "신고 대응",
    href: "/admin/reports",
    badge: "2",
    urgent: true,
  },
  { icon: "◎", label: "참여자", href: "#" },
  { icon: "◈", label: "크루 계정", href: "#" },
];

function Sidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-[220px] flex-shrink-0 flex-col bg-v2-ink lg:flex">
      <div className="border-b border-white/[0.07] px-6 pb-5 pt-7">
        <p className="text-[15px] font-bold text-white/85">강화유니버스</p>
        <p className="mt-0.5 text-[10px] tracking-[1px] text-white/25">
          ADMIN CONSOLE
        </p>
      </div>
      <nav className="flex-1 py-4">
        {SIDEBAR_ITEMS.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            className={`relative flex items-center gap-2.5 px-6 py-2.5 text-[13px] transition-colors ${
              it.active
                ? "bg-white/[0.08] text-white"
                : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
            }`}
          >
            {it.active && (
              <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r bg-[#6BAF8A]" />
            )}
            <span>{it.icon}</span>
            <span>{it.label}</span>
            {it.badge && (
              <span
                className={`ml-auto min-w-[18px] rounded-full px-[7px] py-px text-center text-[10px] font-bold text-white ${
                  it.urgent ? "bg-[#E05555]" : "bg-[#C4956A]"
                }`}
              >
                {it.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/[0.07] px-6 py-5 text-[11px] text-white/20">
        운영자 · 호영
        <br />
        Supabase Auth
      </div>
    </aside>
  );
}

/* ─────────────────────────── Topbar ─────────────────────────── */

function Topbar() {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-v2-rule bg-[#F8F8F6] px-6 py-4 lg:px-10">
      <p className="text-[13px] text-[#AEAEB2]">
        DASHBOARD ·{" "}
        <strong className="font-semibold text-v2-ink">2026.04.24</strong>
      </p>
      <div className="flex gap-2">
        <Link
          href="/impact"
          className="rounded-lg border border-v2-rule bg-white px-[18px] py-2 text-[12.5px] font-medium text-v2-ink transition-colors hover:bg-[#EDECEA]"
        >
          임팩트 페이지 보기
        </Link>
        <button
          type="button"
          className="rounded-lg bg-[#6BAF8A] px-[18px] py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[#5A9B78]"
        >
          + 새 프로젝트
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Alert grid ─────────────────────────── */

const ALERTS = [
  {
    num: "7",
    color: "text-[#6BAF8A]",
    label: "공개 검수 대기",
    sub: "가장 오래된 · 3일 전",
  },
  {
    num: "2",
    color: "text-[#E05555]",
    label: "신고 대기",
    sub: "긴급 1건 포함",
    urgent: true,
  },
  {
    num: "1",
    color: "text-[#C4956A]",
    label: "가게 등록 대기",
    sub: "처리 대기 없음",
  },
  {
    num: "0",
    color: "text-[#888]",
    label: "사장님 코드 재발급",
    sub: "처리 대기 없음",
  },
];

function AlertGrid() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {ALERTS.map((a, i) => (
        <AnimateOnScroll key={a.label} delay={(i + 1) * 0.06}>
          <div
            className={`cursor-pointer rounded-xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] ${
              a.urgent
                ? "border-[rgba(224,85,85,0.3)] bg-[rgba(224,85,85,0.03)]"
                : "border-v2-rule"
            }`}
          >
            <p
              className={`mb-1.5 text-[32px] font-bold leading-none tracking-[-1px] ${a.color}`}
            >
              {a.num}
            </p>
            <p className="mb-[3px] text-[12.5px] font-semibold text-v2-ink">
              {a.label}
            </p>
            <p className="text-[11px] font-light text-[#AEAEB2]">{a.sub}</p>
          </div>
        </AnimateOnScroll>
      ))}
    </div>
  );
}

/* ─────────────────────────── Two column ─────────────────────────── */

function TwoColumn() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <ReviewQueue />
      <EpisodePanel />
    </div>
  );
}

const REVIEW_ITEMS = [
  {
    no: "💌 No.284",
    badge: "네트워크",
    badgeClass: "bg-[rgba(107,175,138,0.12)] text-[#3A7A55]",
    memo: "시부야에서 온 친구들과 갯벌을 함께 걸었다. 말은 잘 안 통해도, 진흙은 만국 공통이었다.",
    date: "2026.04.20 · 시부야 교류 3회차",
  },
  {
    no: "💌 No.281",
    badge: "공유지",
    badgeClass: "bg-[rgba(180,110,40,0.1)] text-[#9B6020]",
    memo: "한달살기 2주차. 옆집 할머니가 쑥 한 바구니 주셨다.",
    date: "2026.04.18 · 한달살기",
  },
  {
    no: "No.279",
    badge: "세계",
    badgeClass: "bg-[rgba(49,130,246,0.1)] text-[#2060C8]",
    memo: "폐교 된 초등학교에서 환대 아카이빙 워크숍. 낡은 책상에 앉아 편지를 썼다.",
    date: "2026.04.14 · 환대 아카이빙",
  },
  {
    no: "💌 No.276",
    badge: "공유지",
    badgeClass: "bg-[rgba(180,110,40,0.1)] text-[#9B6020]",
    memo: "공유 주방에서 다 같이 바지락 칼국수. 재료는 전부 오늘 아침 바다에서.",
    date: "2026.04.12 · 공유 주방",
  },
];

function ReviewQueue() {
  return (
    <AnimateOnScroll delay={0.06}>
      <div className="overflow-hidden rounded-2xl border border-v2-rule bg-white">
        <div className="flex items-center justify-between border-b border-v2-rule px-5 py-4">
          <p className="text-[14px] font-semibold text-v2-ink">
            공개 검수 큐 · 7건
          </p>
          <span className="cursor-pointer text-[12px] text-[#6BAF8A]">
            전체 보기 →
          </span>
        </div>
        {REVIEW_ITEMS.map((r, i) => (
          <div
            key={r.no + i}
            className={`px-5 py-4 transition-colors hover:bg-[#FAFAF8] ${
              i < REVIEW_ITEMS.length - 1 ? "border-b border-[#F0F0EC]" : ""
            }`}
          >
            <div className="mb-1.5 flex items-start justify-between">
              <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
                {r.no} · {r.badge}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[9px] font-semibold ${r.badgeClass}`}
              >
                {r.badge}
              </span>
            </div>
            <p className="mb-2.5 line-clamp-2 text-[12.5px] leading-[1.65] text-v2-ink">
              {r.memo}
            </p>
            <p className="mb-2.5 text-[10.5px] text-[#AEAEB2]">{r.date}</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="flex-1 rounded-md border border-[rgba(107,175,138,0.25)] bg-[rgba(107,175,138,0.1)] py-1.5 text-[12px] font-medium text-[#3A7A55] transition-colors hover:bg-[rgba(107,175,138,0.2)]"
              >
                승인
              </button>
              <button
                type="button"
                className="flex-1 rounded-md border border-[rgba(224,85,85,0.2)] bg-[rgba(224,85,85,0.07)] py-1.5 text-[12px] font-medium text-[#C04040] transition-colors hover:bg-[rgba(224,85,85,0.14)]"
              >
                반려
              </button>
            </div>
          </div>
        ))}
      </div>
    </AnimateOnScroll>
  );
}

const EPISODES = [
  {
    status: "● 진행",
    statusClass: "text-[#3A7A55]",
    title: "시부야 교류 3회차",
    period: "2026.04.20 – 04.24",
  },
  {
    status: "준비",
    statusClass: "text-[#9B6020]",
    title: "한달살기 4월 입주",
    period: "2026.04.25 ~",
  },
  {
    status: "예정",
    statusClass: "text-[#888]",
    title: "공유 주방 7회차",
    period: "2026.04.27",
  },
  {
    status: "● 진행",
    statusClass: "text-[#3A7A55]",
    title: "환대 아카이빙",
    period: "공모 진행",
  },
];

function EpisodePanel() {
  return (
    <AnimateOnScroll delay={0.12}>
      <div className="overflow-hidden rounded-2xl border border-v2-rule bg-white">
        <div className="flex items-center justify-between border-b border-v2-rule px-5 py-4">
          <p className="text-[14px] font-semibold text-v2-ink">
            진행 중 에피소드
          </p>
          <Link
            href="/crew"
            className="cursor-pointer text-[12px] text-[#6BAF8A]"
          >
            크루 업데이트 →
          </Link>
        </div>
        {EPISODES.map((e, i) => (
          <div
            key={e.title}
            className={`px-[18px] py-3.5 ${
              i < EPISODES.length - 1 ? "border-b border-[#F0F0EC]" : ""
            }`}
          >
            <p
              className={`mb-1 text-[10px] font-semibold tracking-[1px] ${e.statusClass}`}
            >
              {e.status}
            </p>
            <p className="mb-0.5 text-[13px] font-semibold text-v2-ink">
              {e.title}
            </p>
            <p className="text-[11px] text-[#AEAEB2]">{e.period}</p>
          </div>
        ))}
      </div>
    </AnimateOnScroll>
  );
}

/* ─────────────────────────── Metrics grid ─────────────────────────── */

const METRICS = [
  { unit: "최근 30일", num: "94", label: "검수 처리율 (%)" },
  { unit: "평균", num: "11", label: "평균 응답 (시간)" },
  { unit: "누적", num: "3", label: "신고 건수" },
  { unit: "이번 달", num: "2", label: "새 가게" },
  { unit: "이번 주", num: "18", label: "크루 활동" },
];

function MetricsGrid() {
  return (
    <AnimateOnScroll delay={0.18}>
      <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-v2-rule bg-white sm:grid-cols-3 lg:grid-cols-5">
        {METRICS.map((m, i) => (
          <div
            key={m.label}
            className={`px-4 py-5 text-center ${
              i < METRICS.length - 1
                ? "border-b border-r border-v2-rule lg:border-b-0"
                : ""
            }`}
          >
            <p className="mb-1 text-[12px] font-medium text-[#6BAF8A]">
              {m.unit}
            </p>
            <p className="mb-1.5 text-[26px] font-bold leading-none tracking-[-0.8px] text-v2-ink">
              {m.num}
            </p>
            <p className="text-[11px] text-[#AEAEB2]">{m.label}</p>
          </div>
        ))}
      </div>
    </AnimateOnScroll>
  );
}
