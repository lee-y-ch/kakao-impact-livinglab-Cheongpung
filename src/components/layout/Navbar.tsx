"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type NavActive =
  | "impact"
  | "projects"
  | "feed"
  | "collection"
  | "crew"
  | "admin"
  | null;

const NAV_ITEMS: ReadonlyArray<{
  key: NonNullable<NavActive>;
  label: string;
  href: string;
}> = [
  { key: "impact", label: "임팩트", href: "/impact" },
  { key: "projects", label: "프로젝트", href: "/projects" },
  { key: "feed", label: "피드", href: "/feed" },
  { key: "collection", label: "내 도감", href: "/collection" },
];

/**
 * v2 redesign — fixed top navigation.
 * 시안: design-v2-reference 의 모든 페이지에서 동일하게 사용.
 * 스크롤 20px 이상이면 .scrolled 상태 (subtle box-shadow).
 */
export function Navbar({ active = null }: { active?: NavActive }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-[100] flex w-full items-center justify-between border-b border-black/[0.06] px-6 py-5 backdrop-blur-md transition-shadow lg:px-[60px] ${
        scrolled ? "shadow-[0_2px_20px_rgba(0,0,0,0.07)]" : ""
      }`}
      style={{ background: "rgba(248, 248, 246, 0.92)" }}
    >
      <Link
        href="/"
        className="text-[17px] font-bold tracking-[-0.5px] text-v2-ink no-underline"
      >
        강화유니버스
      </Link>
      <ul className="hidden items-center gap-9 lg:flex">
        {NAV_ITEMS.map((it) => (
          <li key={it.key}>
            <Link
              href={it.href}
              className={`text-[13.5px] no-underline transition-colors hover:text-v2-ink ${
                active === it.key ? "font-medium text-v2-ink" : "text-v2-ink3"
              }`}
            >
              {it.label}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="#cta"
            className="text-[13px] font-medium text-v2-brand no-underline"
          >
            참여하기 →
          </Link>
        </li>
      </ul>
    </nav>
  );
}
