import Link from "next/link";

import type { CurrentActor } from "@/lib/auth/current-actor";
import { LogoutButton } from "./LogoutButton";

/**
 * 역할별로 다른 메뉴를 보여주는 공통 헤더.
 *
 * - 비로그인  : 로그인 / 임팩트 / 프로젝트
 * - 참여자    : 내 도감 / 임팩트 / 로그아웃
 * - 사장님    : 우리 가게 / 설정 / 로그아웃
 * - 관리자    : 운영 홈 / 검수 / 신고 / 로그아웃
 * - 크루      : 크루 홈 / 로그아웃 (Phase 3)
 */

type NavItem = { href: string; label: string };

function navForActor(actor: CurrentActor): NavItem[] {
  switch (actor.role) {
    case "participant":
      return [
        { href: "/collection", label: "내 도감" },
        { href: "/impact", label: "강화의 진척" },
        { href: "/feed", label: "둘러보기" },
      ];
    case "owner":
      return [
        { href: "/owner", label: "우리 가게" },
        { href: "/owner/settings", label: "설정" },
      ];
    case "admin":
      return [
        { href: "/admin", label: "운영 홈" },
        { href: "/admin/projects", label: "프로젝트" },
        { href: "/admin/shops", label: "가게" },
        { href: "/admin/review", label: "검수" },
      ];
    case "crew":
      return [{ href: "/crew", label: "크루" }];
    case "anonymous":
    default:
      return [
        { href: "/impact", label: "강화의 진척" },
        { href: "/projects", label: "프로젝트" },
        { href: "/feed", label: "둘러보기" },
      ];
  }
}

export function Header({ actor }: { actor: CurrentActor }) {
  const nav = navForActor(actor);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight sm:text-base"
        >
          강화유니버스
        </Link>

        <nav className="flex flex-1 items-center gap-4 overflow-x-auto pl-2 text-sm text-muted-foreground">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          {actor.role === "anonymous" ? (
            <Link
              href="/login"
              className="rounded-md bg-foreground px-3 py-1.5 text-background transition hover:opacity-90"
            >
              로그인
            </Link>
          ) : (
            <LogoutButton actorRole={actor.role} />
          )}
        </div>
      </div>
    </header>
  );
}
