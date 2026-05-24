import Link from "next/link";

/**
 * 관리자 콘솔 공통 sidebar + topbar 셸.
 *
 * /admin (운영 홈) 과 /admin/projects, /admin/shops, /admin/review,
 * /admin/reports 서브페이지가 동일한 sidebar UX 를 공유하도록 추출됨.
 *
 * 사용법:
 *   const badges = await fetchAdminSidebarBadges();
 *   return (
 *     <AdminShell active="projects" {...badges} topbarTitle="프로젝트 운영">
 *       ...content...
 *     </AdminShell>
 *   );
 */

export type AdminSidebarKey =
  | "home"
  | "projects"
  | "shops"
  | "review"
  | "reports";

export function AdminShell({
  active,
  reviewBadge = 0,
  reportedBadge = 0,
  topbarTitle,
  topbarActions,
  children,
}: {
  active: AdminSidebarKey;
  reviewBadge?: number;
  reportedBadge?: number;
  topbarTitle?: React.ReactNode;
  topbarActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F0F0EC]">
      <Sidebar
        active={active}
        reviewBadge={reviewBadge}
        reportedBadge={reportedBadge}
      />
      <div className="ml-0 flex flex-1 flex-col lg:ml-[220px]">
        <Topbar title={topbarTitle} actions={topbarActions} />
        <div className="flex-1 px-6 pb-16 pt-8 lg:px-10">{children}</div>
      </div>
    </div>
  );
}

function Sidebar({
  active,
  reviewBadge,
  reportedBadge,
}: {
  active: AdminSidebarKey;
  reviewBadge: number;
  reportedBadge: number;
}) {
  const items: {
    key: AdminSidebarKey;
    icon: string;
    label: string;
    href: string;
    badge?: number;
    urgent?: boolean;
  }[] = [
    { key: "home", icon: "◉", label: "운영 홈", href: "/admin" },
    {
      key: "projects",
      icon: "⊞",
      label: "프로젝트·에피소드",
      href: "/admin/projects",
    },
    { key: "shops", icon: "⚑", label: "가게·QR", href: "/admin/shops" },
    {
      key: "review",
      icon: "✓",
      label: "공개 검수 큐",
      href: "/admin/review",
      badge: reviewBadge,
    },
    {
      key: "reports",
      icon: "!",
      label: "신고 대응",
      href: "/admin/reports",
      badge: reportedBadge,
      urgent: reportedBadge > 0,
    },
  ];

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-[220px] flex-shrink-0 flex-col bg-v2-ink lg:flex">
      <div className="border-b border-white/[0.07] px-6 pb-5 pt-7">
        <Link href="/admin" className="block">
          <p className="text-[15px] font-bold text-white/85">강화유니버스</p>
          <p className="mt-0.5 text-[10px] tracking-[1px] text-white/25">
            ADMIN CONSOLE
          </p>
        </Link>
      </div>
      <nav className="flex-1 py-4">
        {items.map((it) => {
          const isActive = it.key === active;
          return (
            <Link
              key={it.key}
              href={it.href}
              className={`relative flex items-center gap-2.5 px-6 py-2.5 text-[13px] transition-colors ${
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
              }`}
            >
              {isActive && (
                <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r bg-[#6BAF8A]" />
              )}
              <span>{it.icon}</span>
              <span>{it.label}</span>
              {it.badge && it.badge > 0 ? (
                <span
                  className={`ml-auto min-w-[18px] rounded-full px-[7px] py-px text-center text-[10px] font-bold text-white ${
                    it.urgent ? "bg-[#E05555]" : "bg-[#C4956A]"
                  }`}
                >
                  {it.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/[0.07] px-6 py-5 text-[11px] text-white/20">
        운영자 콘솔
        <br />
        Supabase Auth
      </div>
    </aside>
  );
}

function Topbar({
  title,
  actions,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const today = formatTodayKr();
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-v2-rule bg-[#F8F8F6] px-6 py-4 lg:px-10">
      <p className="text-[13px] text-[#AEAEB2]">
        {title ? (
          <strong className="font-semibold text-v2-ink">{title}</strong>
        ) : (
          <>
            DASHBOARD ·{" "}
            <strong className="font-semibold text-v2-ink">{today}</strong>
          </>
        )}
      </p>
      <div className="flex gap-2">
        {actions ?? (
          <>
            <Link
              href="/impact"
              className="rounded-lg border border-v2-rule bg-white px-[18px] py-2 text-[12.5px] font-medium text-v2-ink transition-colors hover:bg-[#EDECEA]"
            >
              임팩트 페이지 보기
            </Link>
            <Link
              href="/admin/projects"
              className="rounded-lg bg-[#6BAF8A] px-[18px] py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[#5A9B78]"
            >
              + 새 프로젝트
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 페이지 본문 위에 들어가는 표준 헤더 (eyebrow / title / description / back).
 * LegacyHeader 대체용 — v2 톤에 맞춰 정리.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-7">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center text-[12px] text-[#AEAEB2] transition-colors hover:text-v2-ink3"
        >
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[760px]">
          {eyebrow ? (
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[2.5px] text-[#AEAEB2]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-[22px] font-bold tracking-[-0.5px] text-v2-ink">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-[12.5px] font-light leading-[1.7] text-v2-ink3">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

/**
 * 흰 카드 패널 — LegacyPanel 대체 (v2 토큰 적용).
 */
export function AdminPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-v2-rule bg-white p-5 sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function formatTodayKr(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
