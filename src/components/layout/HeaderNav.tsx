"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type HeaderNavItem = { href: string; label: string };

/**
 * Header 의 네비 영역 — usePathname 으로 현재 경로 활성 표시.
 * 매칭 규칙: pathname 이 item.href 로 시작하면 활성 (단, "/" 만 정확 매칭).
 */
export function HeaderNav({ items }: { items: HeaderNavItem[] }) {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="flex flex-1 items-center gap-6 overflow-x-auto pl-2 text-[13px]">
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              "relative whitespace-nowrap py-1 transition " +
              (isActive
                ? "font-semibold text-foreground after:absolute after:inset-x-0 after:-bottom-[1px] after:h-[2px] after:bg-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
