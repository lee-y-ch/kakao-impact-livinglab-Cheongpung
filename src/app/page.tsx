import Link from "next/link";
import { redirect } from "next/navigation";

import { type CategorySlug, GH_CAT } from "@/components/claude/primitives";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const POPULAR_LIMIT = 6;
const FEED_LIMIT = 4;
const LOG_LIMIT = 8;

/* ─────────────────────────────────────────────────────────────
 * 루트 / — Claude editorial 톤 랜딩.
 *
 * 출처: Claude artifact pages/LandingFigma.jsx (2026-04-29 export).
 * 인라인 oklch 토큰 → globals.css 의 --paper / --ink / 카테고리 매핑으로 치환.
 * mock 데이터 (GH_*) → 실제 Supabase 쿼리로 치환.
 *
 * 로그인 사용자는 역할별 홈으로 redirect, ?present=1 일 땐 분기 우회.
 * ───────────────────────────────────────────────────────────── */

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  category_id: string;
};

type ActivityRow = {
  id: string;
  body: string | null;
  photo_url: string | null;
  created_at: string;
  project: { slug: string; title: string; category_id: string } | null;
  episode: { title: string } | null;
};

const cream = "oklch(0.978 0.012 95)";
const mint = "oklch(0.94 0.025 200)";
const mintSoft = "oklch(0.97 0.012 195)";
const ink = "var(--ink)";
const ink2 = "var(--ink-2)";
const ink3 = "var(--ink-3)";
const rule = "var(--rule)";
const heroPhoto =
  "linear-gradient(180deg, oklch(0.62 0.08 200) 0%, oklch(0.55 0.10 175) 35%, oklch(0.50 0.11 145) 60%, oklch(0.45 0.09 130) 100%)";
const heroSky =
  "radial-gradient(ellipse at 70% 20%, oklch(0.92 0.04 80 / 0.5), transparent 55%)";

const headingStyle = {
  fontFamily: "var(--ui-font)",
  fontWeight: 800,
  color: ink,
  letterSpacing: "-0.025em",
} as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { present?: string };
}) {
  const actor = await getCurrentActor();
  const presentMode =
    searchParams?.present === "1" || searchParams?.present === "true";

  if (!presentMode) {
    if (actor.role === "participant") redirect("/collection");
    if (actor.role === "owner") redirect("/owner");
    if (actor.role === "admin") redirect("/admin");
    if (actor.role === "crew") redirect("/crew");
  }

  const today = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();

  const [
    categoriesRes,
    heroProjectRes,
    popularRes,
    participantCountRes,
    cardCountRes,
    shopCountRes,
    feedRes,
    logRes,
  ] = await Promise.all([
    admin
      .from("categories")
      .select("id, slug, name, description, sort_order")
      .order("sort_order"),
    admin
      .from("projects")
      .select(
        "id, slug, title, summary, cover_url, started_at, ended_at, category_id"
      )
      .eq("is_public", true)
      .or(`ended_at.is.null,ended_at.gte.${today}`)
      .order("started_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("projects")
      .select(
        "id, slug, title, summary, cover_url, started_at, ended_at, category_id"
      )
      .eq("is_public", true)
      .order("started_at", { ascending: false, nullsFirst: false })
      .limit(POPULAR_LIMIT),
    admin.from("users").select("id", { count: "exact", head: true }),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true)
      .is("removed_at", null),
    admin
      .from("shops")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true),
    admin
      .from("activities")
      .select(
        `id, body, photo_url, created_at,
         project:project_id (slug, title, category_id),
         episode:episode_id (title)`
      )
      .eq("is_public", true)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(FEED_LIMIT),
    admin
      .from("activities")
      .select(
        `id, body, photo_url, created_at,
         project:project_id (slug, title, category_id),
         episode:episode_id (title)`
      )
      .eq("is_public", true)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .range(FEED_LIMIT, FEED_LIMIT + LOG_LIMIT - 1),
  ]);

  const categories = (categoriesRes.data ?? []) as CategoryRow[];
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const heroProject = (heroProjectRes.data ?? null) as ProjectRow | null;
  const popular = (popularRes.data ?? []) as ProjectRow[];
  const participantCount = participantCountRes.count ?? 0;
  const cardCount = cardCountRes.count ?? 0;
  const shopCount = shopCountRes.count ?? 0;
  const feedCards = (feedRes.data ?? []) as unknown as ActivityRow[];
  const logCards = (logRes.data ?? []) as unknown as ActivityRow[];

  const heroCategorySlug = heroProject
    ? (categoryById.get(heroProject.category_id)?.slug ?? null)
    : null;
  const heroDateText = formatDateRange(
    heroProject?.started_at ?? null,
    heroProject?.ended_at ?? null
  );

  /* category chips — 우리 4개 + 회고/굿즈로 6개 */
  const chips: Array<{
    label: string;
    en: string;
    icon: string;
    bg: string;
    href: string;
  }> = [
    {
      label: "공유지",
      en: "COMMONS",
      icon: "◆",
      bg: "oklch(0.94 0.04 160)",
      href: "/projects?category=commons",
    },
    {
      label: "네트워크",
      en: "NETWORK",
      icon: "◉",
      bg: "oklch(0.93 0.04 230)",
      href: "/projects?category=network",
    },
    {
      label: "세계",
      en: "WORLD",
      icon: "◐",
      bg: "oklch(0.95 0.05 60)",
      href: "/projects?category=world",
    },
    {
      label: "정책",
      en: "POLICY",
      icon: "▣",
      bg: "oklch(0.94 0.04 320)",
      href: "/projects?category=policy",
    },
    {
      label: "회고",
      en: "JOURNAL",
      icon: "◇",
      bg: "oklch(0.95 0.02 90)",
      href: "/feed",
    },
    {
      label: "임팩트",
      en: "IMPACT",
      icon: "✦",
      bg: "oklch(0.94 0.03 30)",
      href: "/impact",
    },
  ];

  return (
    <div
      style={{
        background: cream,
        fontFamily: "var(--ui-font)",
        color: ink,
        minHeight: "100vh",
      }}
    >
      {/* Top nav */}
      <div
        style={{
          padding: "22px 56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${rule}`,
          background: cream,
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "baseline",
            gap: 2,
            color: ink,
            textDecoration: "none",
          }}
        >
          강화유니버스
          <span style={{ color: "oklch(0.55 0.13 175)", fontSize: 22 }}>.</span>
        </Link>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            fontSize: 13,
            fontWeight: 600,
            color: ink2,
          }}
        >
          <Link href="/projects" style={{ color: ink, textDecoration: "none" }}>
            프로그램
          </Link>
          <Link
            href="/projects"
            style={{ color: ink2, textDecoration: "none" }}
          >
            프로젝트
          </Link>
          <Link href="/feed" style={{ color: ink2, textDecoration: "none" }}>
            로그
          </Link>
          <Link href="/shops" style={{ color: ink2, textDecoration: "none" }}>
            가게
          </Link>
          <Link href="/impact" style={{ color: ink2, textDecoration: "none" }}>
            소개
          </Link>
          <Link
            href="/login"
            style={{
              padding: "6px 14px",
              background: ink,
              color: cream,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              textDecoration: "none",
            }}
          >
            로그인
          </Link>
        </div>
      </div>

      {/* HERO — full bleed photo with overlaid card */}
      <div style={{ padding: "24px 56px 56px" }}>
        <div
          style={{
            position: "relative",
            height: 340,
            borderRadius: 18,
            overflow: "hidden",
            background: heroPhoto,
          }}
        >
          <div
            style={{ position: "absolute", inset: 0, background: heroSky }}
          />
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 340"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            <path
              d="M0,210 L180,150 L320,180 L480,120 L640,160 L820,130 L1000,170 L1200,140 L1200,340 L0,340 Z"
              fill="oklch(0.42 0.07 145)"
              opacity="0.82"
            />
            <path
              d="M0,260 L160,230 L320,250 L520,210 L720,240 L900,220 L1100,245 L1200,225 L1200,340 L0,340 Z"
              fill="oklch(0.36 0.08 135)"
            />
            <path
              d="M0,300 L200,290 L420,300 L640,288 L880,295 L1100,288 L1200,292 L1200,340 L0,340 Z"
              fill="oklch(0.30 0.06 130)"
            />
          </svg>

          <div
            style={{
              position: "absolute",
              left: 40,
              top: 48,
              width: 320,
              background: mint,
              borderRadius: 18,
              padding: "26px 28px 24px",
              boxShadow: "0 12px 30px rgba(20,30,40,0.18)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "oklch(0.45 0.10 175)",
                letterSpacing: "0.08em",
                marginBottom: 10,
                fontFamily: "var(--mono-font)",
              }}
            >
              {heroProject
                ? "MODOJI · 모이는 중"
                : "WELCOME · 환대로 잇는 강화"}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                lineHeight: 1.18,
                letterSpacing: "-0.025em",
                color: ink,
              }}
            >
              {heroProject ? (
                heroProject.title
              ) : (
                <>
                  오늘도 강화도가
                  <br />
                  조금씩 더<br />
                  강화됩니다
                </>
              )}
            </div>
            <Link
              href={heroProject ? `/projects/${heroProject.slug}` : "/impact"}
              style={{
                marginTop: 18,
                padding: "12px 22px",
                borderRadius: 999,
                background: ink,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "oklch(0.85 0.18 80)",
                }}
              />
              {heroProject ? "자세히 보기" : "강화의 진척 보기"} →
            </Link>
          </div>

          <div
            style={{
              position: "absolute",
              right: 24,
              bottom: 18,
              fontSize: 11,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.05em",
              fontFamily: "var(--mono-font)",
            }}
          >
            {heroDateText ? `${heroDateText} · 강화도` : "동막해변 · 강화도"}
          </div>
        </div>
      </div>

      {/* CATEGORY CHIPS */}
      <div style={{ padding: "8px 56px 56px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <h2 style={{ ...headingStyle, fontSize: 28, margin: 0 }}>
            강화유니버스 프로그램
          </h2>
          <Link
            href="/projects"
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: ink2,
              padding: "7px 14px",
              background: cream,
              border: `1px solid ${rule}`,
              borderRadius: 999,
              textDecoration: "none",
            }}
          >
            모든 프로그램 보기 →
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 14,
          }}
        >
          {chips.map((c, i) => (
            <Link
              key={i}
              href={c.href}
              style={{ textAlign: "center", textDecoration: "none" }}
            >
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 999,
                  background: c.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                  fontSize: 30,
                  color: ink,
                  border: `1px solid ${rule}`,
                }}
                aria-hidden
              >
                {c.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: ink }}>
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "var(--mono-font)",
                  color: ink3,
                  letterSpacing: "0.1em",
                  marginTop: 2,
                }}
              >
                {c.en}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* POPULAR PROJECTS */}
      {popular.length > 0 ? (
        <div style={{ padding: "24px 56px 64px" }}>
          <h2
            style={{
              ...headingStyle,
              fontSize: 28,
              textAlign: "center",
              margin: "0 0 28px",
            }}
          >
            지금 진행 중인 프로젝트
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {popular.map((p) => {
              const cat = categoryById.get(p.category_id);
              const slug = (cat?.slug ?? null) as CategorySlug | null;
              const visual = slug
                ? GH_CAT[slug]
                : { color: "var(--ink-2)", soft: "var(--paper-2)", en: "—" };
              const dateText = formatDateRange(p.started_at, p.ended_at);
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  style={{
                    background: mintSoft,
                    borderRadius: 14,
                    padding: 14,
                    border: `1px solid ${rule}`,
                    textDecoration: "none",
                    color: ink,
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      height: 140,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: `linear-gradient(135deg, ${visual.soft}, oklch(0.85 0.02 200))`,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(circle at 70% 30%, ${visual.color} 0%, transparent 35%), radial-gradient(circle at 20% 80%, ${visual.color} 0%, transparent 30%)`,
                        opacity: 0.18,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "oklch(0.65 0.18 30)",
                      }}
                    >
                      ★
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: 12,
                        bottom: 10,
                        fontSize: 9.5,
                        fontFamily: "var(--mono-font)",
                        color: "#fff",
                        letterSpacing: "0.08em",
                        background: "rgba(20,22,28,0.5)",
                        padding: "3px 8px",
                        borderRadius: 4,
                      }}
                    >
                      {(visual.en ?? "—").toUpperCase()}
                      {dateText ? ` · ${dateText}` : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 15.5,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      marginBottom: 6,
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 11,
                      color: ink3,
                      fontFamily: "var(--mono-font)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        background: visual.color,
                      }}
                    />
                    <span>{cat?.name ?? "강화"}</span>
                    {p.summary ? (
                      <span
                        style={{
                          marginLeft: "auto",
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.summary}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* STATS */}
      <div style={{ padding: "48px 56px 64px" }}>
        <h2
          style={{
            ...headingStyle,
            fontSize: 24,
            textAlign: "center",
            margin: "0 0 36px",
          }}
        >
          올해 강화유니버스에 모인 사람들
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            maxWidth: 880,
            margin: "0 auto",
          }}
        >
          {[
            [koCount(participantCount, "명"), "참여자"],
            [koCount(cardCount, "장"), "쌓인 카드"],
            [koCount(shopCount, "곳"), "강화의 동행 가게"],
          ].map(([v, k], i) => (
            <div key={i} style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "oklch(0.45 0.13 175)",
                  lineHeight: 1,
                  fontFamily: "var(--serif-font)",
                }}
              >
                {v}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: ink2,
                  marginTop: 12,
                }}
              >
                {k}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEED PEEK */}
      {feedCards.length > 0 ? (
        <div style={{ padding: "48px 56px 64px", background: mintSoft }}>
          <h2
            style={{
              ...headingStyle,
              fontSize: 24,
              textAlign: "center",
              margin: "0 0 8px",
            }}
          >
            공개로 모인 카드를 살짝 들여다보세요
          </h2>
          <div
            style={{
              fontSize: 13,
              textAlign: "center",
              color: ink3,
              marginBottom: 28,
            }}
          >
            좋아요·팔로우 없이, 시간순으로만 흐릅니다
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              marginBottom: 28,
            }}
          >
            {feedCards.map((c) => {
              const cat = c.project
                ? categoryById.get(c.project.category_id)
                : null;
              const slug = (cat?.slug ?? null) as CategorySlug | null;
              const visual = slug
                ? GH_CAT[slug]
                : { color: "var(--ink-2)", en: "—" };
              return (
                <article
                  key={c.id}
                  style={{
                    aspectRatio: "1/1",
                    background: "#fff",
                    border: `1px solid ${rule}`,
                    borderRadius: 8,
                    padding: 14,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 9.5,
                      fontFamily: "var(--mono-font)",
                      letterSpacing: "0.1em",
                      color: visual.color,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        background: visual.color,
                      }}
                    />
                    {(visual.en ?? "—").toUpperCase()} · No.
                    {c.id.slice(-4).toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--serif-font)",
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: ink,
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
                    {c.body ? `"${c.body}"` : "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mono-font)",
                      color: ink3,
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {c.project?.title ?? c.episode?.title ?? "강화도"}
                    </span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                </article>
              );
            })}
          </div>
          <div style={{ textAlign: "center" }}>
            <Link
              href="/feed"
              style={{
                padding: "12px 22px",
                borderRadius: 999,
                background: ink,
                color: cream,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              전체 피드 보기 →
            </Link>
          </div>
        </div>
      ) : null}

      {/* LOG ARCHIVE — 4×2 */}
      {logCards.length > 0 ? (
        <div style={{ padding: "56px 56px 56px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <h2 style={{ ...headingStyle, fontSize: 28, margin: 0 }}>
              강화유니버스 로그
            </h2>
            <span style={{ fontSize: 12, color: ink3 }}>
              크루가 기록한 현장의 글
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
            }}
          >
            {logCards.map((c, i) => {
              const cat = c.project
                ? categoryById.get(c.project.category_id)
                : null;
              const slug = (cat?.slug ?? null) as CategorySlug | null;
              const visual = slug ? GH_CAT[slug] : null;
              const tagText = `CH.${String(i + 1).padStart(2, "0")}`;
              const gradient = visual
                ? `linear-gradient(135deg, ${visual.soft}, oklch(0.55 0.05 200))`
                : "linear-gradient(135deg, oklch(0.85 0.02 90), oklch(0.55 0.05 200))";
              return (
                <Link
                  key={c.id}
                  href="/feed"
                  style={{ textDecoration: "none", color: ink }}
                >
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: "4/3",
                      borderRadius: 8,
                      background: gradient,
                      marginBottom: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "oklch(0.62 0.20 25)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 10,
                        bottom: 8,
                        fontSize: 9.5,
                        fontFamily: "var(--mono-font)",
                        color: "#fff",
                        letterSpacing: "0.08em",
                        background: "rgba(20,22,28,0.4)",
                        padding: "2px 7px",
                        borderRadius: 4,
                      }}
                    >
                      {tagText}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      lineHeight: 1.5,
                      marginBottom: 4,
                      color: ink,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {c.body ?? c.project?.title ?? "강화 어딘가"}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontFamily: "var(--mono-font)",
                      color: ink3,
                    }}
                  >
                    {formatDate(c.created_at)}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* SUBSCRIBE CTA */}
      <div style={{ padding: "24px 56px 64px" }}>
        <div
          style={{
            background: mint,
            borderRadius: 18,
            padding: "52px 40px",
            textAlign: "center",
          }}
        >
          <h2 style={{ ...headingStyle, fontSize: 32, margin: "0 0 12px" }}>
            강화유니버스에 합류하세요
          </h2>
          <p
            style={{
              fontSize: 14,
              color: ink2,
              lineHeight: 1.7,
              maxWidth: 520,
              margin: "0 auto 24px",
            }}
          >
            카카오로 로그인하면 현장에서 받은 QR로 카드를 발급할 수 있어요. 같은
            자리에 여러 번 와도 카드가 여러 장 쌓입니다.
          </p>
          <div
            style={{
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/login"
              style={{
                padding: "12px 22px",
                borderRadius: 999,
                background: ink,
                color: cream,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              카카오로 시작하기 →
            </Link>
            <Link
              href="/impact"
              style={{
                padding: "12px 22px",
                borderRadius: 999,
                background: "#fff",
                color: ink,
                fontSize: 13,
                fontWeight: 700,
                border: `1px solid ${rule}`,
                textDecoration: "none",
              }}
            >
              강화의 진척 보기
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          background: ink,
          color: "oklch(0.7 0.005 250)",
          padding: "40px 56px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 32,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
                marginBottom: 8,
                display: "flex",
                alignItems: "baseline",
                gap: 2,
              }}
            >
              강화유니버스
              <span style={{ color: "oklch(0.65 0.13 175)", fontSize: 22 }}>
                .
              </span>
            </div>
            <div
              style={{
                fontSize: 11.5,
                lineHeight: 1.7,
                color: "oklch(0.6 0.005 250)",
                maxWidth: 360,
              }}
            >
              청풍이 운영하는 강화도 환대 커뮤니티 대시보드. 카카오임팩트
              지원사업 참여작.
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, auto)",
              gap: 48,
              fontSize: 12,
              lineHeight: 2,
            }}
          >
            <FooterColumn
              title="프로그램"
              items={[
                ["진행 중인 프로젝트", "/projects"],
                ["강화의 진척", "/impact"],
              ]}
            />
            <FooterColumn
              title="커뮤니티"
              items={[
                ["참여자 도감", "/collection"],
                ["로그", "/feed"],
              ]}
            />
            <FooterColumn
              title="청풍"
              items={[
                ["사장님 로그인", "/owner/login"],
                ["관리자 로그인", "/admin/login"],
              ]}
            />
            <FooterColumn title="가게" items={[["가게 둘러보기", "/shops"]]} />
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid oklch(0.25 0.006 250)",
            paddingTop: 18,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10.5,
            fontFamily: "var(--mono-font)",
            color: "oklch(0.55 0.005 250)",
            letterSpacing: "0.05em",
          }}
        >
          <span>© 2026 협동조합 청풍 · 카카오임팩트 리빙랩</span>
          <span>이용약관 · 개인정보처리방침</span>
        </div>
      </div>
    </div>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <div>
      <div style={{ color: "#fff", fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>
      {items.map(([label, href]) => (
        <div key={href}>
          <Link
            href={href}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {label}
          </Link>
        </div>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateRange(
  start: string | null,
  end: string | null
): string | null {
  if (!start && !end) return null;
  const fmt = (s: string) => {
    const d = new Date(s);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  };
  if (start && end) return `${fmt(start)} ~ ${fmt(end)}`;
  if (start) return `${fmt(start)} ~`;
  return `~ ${fmt(end!)}`;
}

function koCount(n: number, unit: string): string {
  return `${new Intl.NumberFormat("ko-KR").format(n)}${unit}`;
}
