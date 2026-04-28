/**
 * Claude editorial 디자인 시스템의 공용 primitive.
 * 원본: Claude artifact components/Shared.jsx (브라우저 globals)
 * 우리 코드: React + 인라인 style + globals.css 의 oklch 토큰.
 *
 * 새 페이지 (랜딩 / impact / projects / feed / collection 등) 에서만 사용.
 * 기존 Ink-on-Linen 페이지는 건드리지 않음.
 */

import type { CSSProperties, ReactNode } from "react";

export type CategorySlug = "commons" | "network" | "world" | "policy";

export const GH_CAT: Record<
  CategorySlug,
  { ko: string; en: string; color: string; soft: string }
> = {
  commons: {
    ko: "공유지",
    en: "commons",
    color: "var(--cat-commons)",
    soft: "var(--cat-commons-soft)",
  },
  network: {
    ko: "네트워크",
    en: "network",
    color: "var(--cat-network)",
    soft: "var(--cat-network-soft)",
  },
  world: {
    ko: "세계",
    en: "world",
    color: "var(--cat-world)",
    soft: "var(--cat-world-soft)",
  },
  policy: {
    ko: "정책",
    en: "policy",
    color: "var(--cat-policy)",
    soft: "var(--cat-policy-soft)",
  },
};

export function GhLogo({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "inline-block", verticalAlign: "-3px" }}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
      />
      <circle
        cx="12"
        cy="12"
        r="5.5"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
      />
      <circle cx="12" cy="12" r="1.8" fill={color} />
      <circle cx="3.5" cy="12" r="1.1" fill={color} />
      <circle cx="20.5" cy="12" r="1.1" fill={color} />
      <circle cx="12" cy="3.5" r="1.1" fill={color} />
      <circle cx="12" cy="20.5" r="1.1" fill={color} />
    </svg>
  );
}

export function GhWordmark({
  size = 15,
  mono = false,
}: {
  size?: number;
  mono?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: "var(--ink)",
      }}
    >
      <GhLogo size={size + 3} />
      <span
        style={{
          fontFamily: mono ? "var(--mono-font)" : "var(--serif-font)",
          fontSize: size,
          letterSpacing: "0.02em",
          fontWeight: 700,
        }}
      >
        강화유니버스
      </span>
    </span>
  );
}

export function GhPill({
  children,
  color = "var(--ink-2)",
  bg = "var(--paper-3)",
  dot,
  style,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  dot?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: color,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}

export function GhCategoryDot({
  cat,
  size = 8,
}: {
  cat: CategorySlug;
  size?: number;
}) {
  const c = GH_CAT[cat]?.color ?? "var(--ink-2)";
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 2,
        background: c,
        verticalAlign: "middle",
      }}
      aria-hidden
    />
  );
}

export function GhStat({
  label,
  value,
  unit,
  hint,
  small,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  small?: boolean;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: small ? 2 : 4 }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--ink-3)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontFamily: "var(--mono-font)",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          className="serif"
          style={{
            fontSize: small ? 22 : 34,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </span>
        {unit ? (
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{unit}</span>
        ) : null}
      </div>
      {hint ? (
        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{hint}</div>
      ) : null}
    </div>
  );
}

export function GhProgress({
  value,
  max = 10,
  color = "var(--mud)",
  height = 6,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}
    >
      <div
        style={{
          flex: 1,
          height,
          background: "var(--rule-2)",
          borderRadius: 999,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
      <span
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--ink-2)",
          minWidth: 30,
          textAlign: "right",
        }}
      >
        {value}/{max}
      </span>
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

export function GhButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  style,
  icon,
  block,
  type = "button",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  icon?: ReactNode;
  block?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: {
      background: "var(--ink)",
      color: "var(--paper)",
      border: "1px solid var(--ink)",
    },
    secondary: {
      background: "var(--paper)",
      color: "var(--ink)",
      border: "1px solid var(--rule)",
    },
    ghost: {
      background: "transparent",
      color: "var(--ink-2)",
      border: "1px solid transparent",
    },
    accent: {
      background: "var(--sunset)",
      color: "#fff",
      border: "1px solid var(--sunset)",
    },
  };
  const sizes: Record<ButtonSize, CSSProperties> = {
    sm: { padding: "7px 12px", fontSize: 12, borderRadius: 8 },
    md: { padding: "10px 16px", fontSize: 13, borderRadius: 10 },
    lg: { padding: "14px 20px", fontSize: 14, borderRadius: 12 },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        ...sizes[size],
        display: block ? "flex" : "inline-flex",
        width: block ? "100%" : "auto",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontWeight: 600,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform .1s, box-shadow .1s",
        fontFamily: "var(--ui-font)",
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

export function GhBadge({
  children,
  color = "var(--ink)",
  bg = "var(--paper-3)",
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        color,
        background: bg,
        fontFamily: "var(--mono-font)",
      }}
    >
      {children}
    </span>
  );
}

/** 사진 placeholder (시안용 줄무늬). 실제 이미지가 들어오면 교체. */
export function GhPlaceholder({
  label = "photo",
  w = "100%",
  h = 160,
  color,
  style,
}: {
  label?: string;
  w?: string | number;
  h?: string | number;
  color?: string;
  style?: CSSProperties;
}) {
  const c = color ?? "oklch(0.78 0.03 60)";
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 10,
        backgroundImage: `repeating-linear-gradient(135deg, ${c} 0 6px, transparent 6px 12px)`,
        backgroundColor: "oklch(0.94 0.018 70)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--mono-font)",
        fontSize: 10,
        color: "var(--ink-2)",
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      <span
        style={{
          background: "var(--paper)",
          padding: "3px 8px",
          borderRadius: 4,
          border: "1px solid var(--rule)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
