import Link from "next/link";

import type { CurrentActor } from "@/lib/auth/current-actor";
import { HeaderNav, type HeaderNavItem } from "./HeaderNav";
import { LogoutButton } from "./LogoutButton";

/**
 * 역할별 네비를 보여주는 공통 헤더.
 *
 * - 비로그인  : 로그인 / 임팩트 / 프로젝트 / 둘러보기
 * - 참여자    : 내 도감 / 임팩트 / 둘러보기
 * - 사장님    : 우리 가게 / 설정
 * - 관리자    : 운영 홈 / 프로젝트 / 가게 / 검수
 * - 크루      : 크루 (Phase 3)
 *
 * 활성 표시는 HeaderNav (client component) 가 usePathname 으로 처리.
 */

function navForActor(actor: CurrentActor): HeaderNavItem[] {
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
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-baseline gap-2 text-foreground">
          <span className="text-base font-bold tracking-tight sm:text-lg">
            강화유니버스
          </span>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            오늘도 강화도가 조금씩 더 강화됩니다
          </span>
        </Link>

        <HeaderNav items={nav} />

        <div className="flex items-center gap-2 text-sm">
          {actor.role === "anonymous" ? (
            <Link
              href="/login"
              className="rounded-md bg-foreground px-3 py-1.5 text-background transition hover:bg-foreground/85"
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
