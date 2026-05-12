"use client";

import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
  badge: number | null;
};

const itemStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  color: "var(--ink-2)",
  fontSize: 13,
  fontWeight: 500,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  textDecoration: "none",
  background: "none",
  border: "none",
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
};

const badgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontFamily: "var(--mono-font)",
  color: "var(--ink-3)",
};

export function OwnerSidebarNav({ items }: { items: NavItem[] }) {
  function scrollTo(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {items.map((t, i) =>
        t.href.startsWith("#") ? (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(t.href.slice(1))}
            style={itemStyle}
          >
            <span>{t.label}</span>
            {t.badge != null ? <span style={badgeStyle}>{t.badge}</span> : null}
          </button>
        ) : (
          <Link key={i} href={t.href} style={itemStyle}>
            <span>{t.label}</span>
            {t.badge != null ? <span style={badgeStyle}>{t.badge}</span> : null}
          </Link>
        )
      )}
    </>
  );
}
