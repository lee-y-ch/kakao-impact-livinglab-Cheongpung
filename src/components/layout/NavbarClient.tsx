"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { CurrentActor } from "@/lib/auth/current-actor";

export type NavActive =
  | "impact"
  | "projects"
  | "feed"
  | "collection"
  | "crew"
  | "admin"
  | null;

type NavItem = {
  key: NonNullable<NavActive>;
  label: string;
  href: string;
};

const BASE_NAV_ITEMS: ReadonlyArray<Omit<NavItem, "href"> & { href: string }> =
  [
    { key: "impact", label: "임팩트", href: "/impact" },
    { key: "projects", label: "프로젝트", href: "/projects" },
    { key: "feed", label: "피드", href: "/feed" },
    { key: "collection", label: "내 도감", href: "/collection" },
  ];

export function NavbarClient({
  active = null,
  actor,
}: {
  active?: NavActive;
  actor: CurrentActor;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const resolvedActive = active ?? activeFromPath(pathname);
  const navItems = useMemo(
    () =>
      BASE_NAV_ITEMS.map((item) =>
        item.key === "collection"
          ? {
              ...item,
              href:
                actor.role === "participant"
                  ? "/collection"
                  : "/login?next=/collection",
            }
          : item
      ),
    [actor.role]
  );
  const cta = ctaForActor(actor);

  async function logout() {
    setLoggingOut(true);
    try {
      if (actor.role === "owner") {
        await fetch("/api/auth/owner", { method: "DELETE" });
      } else if (actor.role === "crew") {
        await fetch("/api/auth/crew", { method: "DELETE" });
      } else {
        await fetch("/api/auth/logout", { method: "POST" });
      }
      router.replace("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <nav
      className={`fixed top-0 z-[100] w-full border-b border-black/[0.06] px-6 py-5 backdrop-blur-md transition-shadow lg:px-[60px] ${
        scrolled ? "shadow-[0_2px_20px_rgba(0,0,0,0.07)]" : ""
      }`}
      style={{ background: "rgba(248, 248, 246, 0.92)" }}
    >
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-[17px] font-bold tracking-[-0.5px] text-v2-ink no-underline"
        >
          강화유니버스
        </Link>
        <ul className="hidden items-center gap-9 lg:flex">
          {navItems.map((it) => (
            <li key={it.key}>
              <NavLink item={it} active={resolvedActive === it.key} />
            </li>
          ))}
          <li>
            <Link
              href={cta.href}
              className="text-[13px] font-medium text-v2-brand no-underline"
            >
              {cta.label}
            </Link>
          </li>
          {actor.role !== "anonymous" ? (
            <li>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                title="로그아웃"
                className="inline-flex h-8 w-8 items-center justify-center text-v2-ink3 transition-colors hover:text-v2-ink disabled:opacity-50"
              >
                <LogOut size={17} strokeWidth={1.8} aria-hidden />
                <span className="sr-only">
                  {loggingOut ? "로그아웃 중" : "로그아웃"}
                </span>
              </button>
            </li>
          ) : null}
        </ul>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          className="inline-flex h-9 w-9 items-center justify-center text-v2-ink lg:hidden"
        >
          {open ? (
            <X size={22} strokeWidth={1.8} aria-hidden />
          ) : (
            <Menu size={22} strokeWidth={1.8} aria-hidden />
          )}
          <span className="sr-only">{open ? "메뉴 닫기" : "메뉴 열기"}</span>
        </button>
      </div>
      {open ? (
        <div className="mt-5 border-t border-black/[0.06] pt-5 lg:hidden">
          <ul className="flex flex-col gap-4">
            {navItems.map((it) => (
              <li key={it.key}>
                <NavLink item={it} active={resolvedActive === it.key} />
              </li>
            ))}
            <li className="pt-1">
              <Link
                href={cta.href}
                className="text-[14px] font-medium text-v2-brand no-underline"
              >
                {cta.label}
              </Link>
            </li>
            {actor.role !== "anonymous" ? (
              <li>
                <button
                  type="button"
                  onClick={logout}
                  disabled={loggingOut}
                  className="inline-flex items-center gap-2 text-[14px] text-v2-ink3 transition-colors hover:text-v2-ink disabled:opacity-50"
                >
                  <LogOut size={16} strokeWidth={1.8} aria-hidden />
                  {loggingOut ? "로그아웃 중" : "로그아웃"}
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`text-[13.5px] no-underline transition-colors hover:text-v2-ink ${
        active ? "font-medium text-v2-ink" : "text-v2-ink3"
      }`}
    >
      {item.label}
    </Link>
  );
}

function activeFromPath(pathname: string | null): NavActive {
  if (!pathname) return null;
  if (pathname.startsWith("/impact")) return "impact";
  if (pathname.startsWith("/projects")) return "projects";
  if (pathname.startsWith("/feed")) return "feed";
  if (pathname.startsWith("/collection")) return "collection";
  if (pathname.startsWith("/crew")) return "crew";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

function ctaForActor(actor: CurrentActor): { label: string; href: string } {
  switch (actor.role) {
    case "participant":
      return {
        label: `${actor.nickname ?? "내"} 도감 →`,
        href: "/collection",
      };
    case "crew":
      return { label: "크루 홈 →", href: "/crew" };
    case "owner":
      return { label: "사장님 홈 →", href: "/owner" };
    case "admin":
      return { label: "관리자 홈 →", href: "/admin" };
    case "anonymous":
    default:
      return { label: "참여하기 →", href: "/login" };
  }
}
