import Link from "next/link";

import { GhButton, GhWordmark } from "@/components/claude/primitives";
import type { CurrentActor } from "@/lib/auth/current-actor";

/**
 * Claude editorial 톤의 공용 top nav.
 * /impact, /projects (list), /feed (이중 nav 가 어색해 별도 사용 안 함) 등
 * 풀-블리드가 아닌 평범한 페이지에서 공통 사용.
 *
 * - 좌: 강화유니버스 wordmark + 4-link nav (임팩트 / 프로젝트 / 피드 / 소개)
 * - 우: 페이지 고유 메타(rightMeta) + 역할별 우측 버튼 (로그인 / 내 도감 / 운영 홈)
 */

export type PublicNavActive = "impact" | "projects" | "feed" | "about" | null;

const NAV_ITEMS: ReadonlyArray<{
  key: PublicNavActive;
  label: string;
  href: string;
}> = [
  { key: "impact", label: "임팩트", href: "/impact" },
  { key: "projects", label: "프로젝트", href: "/projects" },
  { key: "feed", label: "피드", href: "/feed" },
  { key: "about", label: "소개", href: "/" },
];

export function PublicTopNav({
  actor,
  active,
  rightMeta,
}: {
  actor: CurrentActor;
  active: PublicNavActive;
  rightMeta?: React.ReactNode;
}) {
  return (
    <header
      style={{
        padding: "20px 56px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--ink)",
        background: "var(--paper)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <GhWordmark size={17} />
        </Link>
        <nav
          style={{
            display: "flex",
            gap: 22,
            fontSize: 12.5,
          }}
        >
          {NAV_ITEMS.map((it) => {
            const isActive = active === it.key;
            return (
              <Link
                key={it.key ?? "_"}
                href={it.href}
                style={{
                  color: isActive ? "var(--ink)" : "var(--ink-2)",
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {rightMeta}
        {actor.role === "anonymous" ? (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <GhButton variant="primary" size="sm">
              카카오 로그인
            </GhButton>
          </Link>
        ) : actor.role === "participant" ? (
          <Link href="/collection" style={{ textDecoration: "none" }}>
            <GhButton variant="secondary" size="sm">
              내 도감
            </GhButton>
          </Link>
        ) : (
          <Link
            href={
              actor.role === "admin"
                ? "/admin"
                : actor.role === "owner"
                  ? "/owner"
                  : "/crew"
            }
            style={{ textDecoration: "none" }}
          >
            <GhButton variant="secondary" size="sm">
              운영 홈
            </GhButton>
          </Link>
        )}
      </div>
    </header>
  );
}
