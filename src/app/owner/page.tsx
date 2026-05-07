import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GhWordmark } from "@/components/claude/primitives";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const RECENT_CARD_LIMIT = 12;

const CATEGORY_COLOR: Record<string, string> = {
  active_life: "var(--cat-active-life)",
  network: "var(--cat-network)",
  local_culture: "var(--cat-local-culture)",
  tech: "var(--cat-tech)",
};

const CATEGORY_EN: Record<string, string> = {
  active_life: "active_life",
  network: "network",
  local_culture: "local_culture",
  tech: "tech",
};

/**
 * /owner — 사장님 홈.
 *
 * Claude 캔버스에 별도 시안 없음 → /owner/letters/new 와 일관된 editorial 톤으로 직접 디자인.
 *
 * 좌 슬림 사이드 (가게 정보 · 메뉴) + 메인 (받은 카드 리스트, 각 카드에 "편지 쓰기" 진입).
 */
export default async function OwnerHomePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "owner") redirect("/owner/login");

  const admin = createAdminClient();

  const [shopRes, cardsRes, letterCountRes, ownerCountRes] = await Promise.all([
    admin
      .from("shops")
      .select("id, name, description, slogan, address, is_public, theme_color")
      .eq("id", actor.shopId)
      .maybeSingle(),
    admin
      .from("activities")
      .select(
        `id, type, body, photo_url, is_public, created_at,
         author:user_id (id, nickname),
         project:project_id (id, title, slug, category_id, category:category_id (id, slug, name)),
         episode:episode_id (id, title)`
      )
      .eq("shop_id", actor.shopId)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(RECENT_CARD_LIMIT),
    admin
      .from("reactions")
      .select("id", { count: "exact", head: true })
      .eq("kind", "letter")
      .eq("author_shop_id", actor.shopId),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", actor.shopId)
      .eq("is_public", true)
      .is("removed_at", null),
  ]);

  const shop = shopRes.data;
  const cards = cardsRes.data ?? [];
  const totalLetters = letterCountRes.count ?? 0;
  const totalPublicCards = ownerCountRes.count ?? 0;
  const totalCards = cards.length;
  const uniqueAuthors = new Set(
    cards
      .map((c) => (c.author as { id: string } | null)?.id)
      .filter((v): v is string => Boolean(v))
  ).size;

  const shopName = (shop?.name as string | undefined) ?? "우리 가게";
  const shopSlogan = (shop?.slogan as string | null) ?? null;
  const shopAddress = (shop?.address as string | null) ?? null;

  return (
    <div
      className="paper-grain"
      style={{
        background: "var(--paper-2)",
        color: "var(--ink)",
        fontFamily: "var(--ui-font)",
        minHeight: "100vh",
        display: "flex",
      }}
    >
      {/* Side rail */}
      <aside
        style={{
          width: 260,
          background: "var(--paper)",
          borderRight: "1px solid var(--rule)",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <GhWordmark size={13} mono />
          </Link>
          <div
            style={{
              fontSize: 10,
              color: "var(--ink-3)",
              marginTop: 6,
              fontFamily: "var(--mono-font)",
              letterSpacing: "0.08em",
            }}
          >
            OWNER · 사장님
          </div>
        </div>

        <div
          style={{
            padding: "16px 14px",
            background: "var(--paper-2)",
            border: "1px solid var(--rule)",
            marginBottom: 14,
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            {shopName}
          </div>
          {shopSlogan ? (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--ink-2)",
                lineHeight: 1.6,
                fontFamily: "var(--serif-font)",
              }}
            >
              {`"${shopSlogan}"`}
            </div>
          ) : null}
          {shopAddress ? (
            <div
              style={{
                fontSize: 10.5,
                color: "var(--ink-3)",
                fontFamily: "var(--mono-font)",
                marginTop: 8,
                letterSpacing: "0.04em",
              }}
            >
              {shopAddress}
            </div>
          ) : null}
        </div>

        {[
          { label: "받은 카드", href: "#cards", badge: totalCards },
          { label: "보낸 편지", href: "#letters", badge: totalLetters },
          { label: "가게 설정", href: "/owner/settings", badge: null },
          { label: "공개 페이지", href: "/impact", badge: null },
        ].map((t, i) => (
          <Link
            key={i}
            href={t.href}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              color: "var(--ink-2)",
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <span>{t.label}</span>
            {t.badge != null ? (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                }}
              >
                {t.badge}
              </span>
            ) : null}
          </Link>
        ))}

        <div
          style={{
            marginTop: "auto",
            padding: "12px 12px",
            fontSize: 10.5,
            color: "var(--ink-3)",
            lineHeight: 1.6,
            borderTop: "1px solid var(--rule)",
            fontFamily: "var(--mono-font)",
          }}
        >
          가게 코드 로그인 · Phase 4
          <br />
          {shopName}
        </div>
      </aside>

      {/* Main */}
      <main className="gh-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            padding: "32px 40px 24px",
            borderBottom: "1px solid var(--rule)",
            background: "var(--paper)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              marginBottom: 8,
            }}
          >
            OWNER · 우리 가게
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {shopName}
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--ink-2)",
              lineHeight: 1.7,
              marginTop: 14,
              maxWidth: 520,
              fontFamily: "var(--serif-font)",
            }}
          >
            오늘 가게에서 만난 손님이 남긴 카드를 봅니다. 손님이 아니라 자주
            오는 이웃이 되어가는 시간을 — 짧은 편지로 한 줄 이어가요.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              marginTop: 24,
              maxWidth: 760,
            }}
          >
            <Stat label="CARDS" value={totalCards} unit="장" />
            <Stat
              label="PUBLIC"
              value={totalPublicCards}
              unit="장"
              hint="공개 노출"
            />
            <Stat
              label="GUESTS"
              value={uniqueAuthors}
              unit="명"
              hint="다녀간 사람"
            />
            <Stat
              label="LETTERS"
              value={totalLetters}
              unit="통"
              hint="내가 보낸 편지"
            />
          </div>
        </div>

        <div style={{ padding: "28px 40px 40px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 16,
            }}
          >
            <div>
              <div
                className="serif"
                style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}
              >
                받은 카드
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  marginTop: 2,
                }}
              >
                각 카드에서 짧은 편지를 시작할 수 있어요.
              </div>
            </div>
            <span
              id="cards"
              style={{
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.06em",
              }}
            >
              최근 {totalCards}건
            </span>
          </div>

          {cards.length === 0 ? (
            <p
              style={{
                border: "1px dashed var(--rule)",
                padding: "40px 24px",
                textAlign: "center",
                fontSize: 13,
                color: "var(--ink-3)",
                background: "var(--paper)",
                borderRadius: 14,
                fontFamily: "var(--serif-font)",
                lineHeight: 1.7,
              }}
            >
              아직 가게에 도착한 카드가 없어요.
              <br />
              현장 QR 을 통해 손님이 카드를 남기면 이 자리에 쌓입니다.
            </p>
          ) : (
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              {cards.map((c) => {
                const proj = c.project as {
                  id: string;
                  title: string;
                  slug: string;
                  category_id: string;
                  category: {
                    id: string;
                    slug: string;
                    name: string;
                  } | null;
                } | null;
                const cat = proj?.category ?? null;
                const color = CATEGORY_COLOR[cat?.slug ?? ""] ?? "var(--ink-3)";
                const en = CATEGORY_EN[cat?.slug ?? ""] ?? cat?.slug ?? "—";
                const authorName =
                  (c.author as { nickname: string | null } | null)?.nickname ??
                  "익명";
                const dateText = new Date(
                  c.created_at as string
                ).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                });
                const serial = (c.id as string).slice(-3).toUpperCase();
                return (
                  <li key={c.id as string}>
                    <article
                      style={{
                        padding: 16,
                        background: "var(--paper)",
                        border: "1px solid var(--rule)",
                        display: "flex",
                        gap: 16,
                        alignItems: "stretch",
                      }}
                    >
                      <div
                        style={{
                          flexShrink: 0,
                          width: 88,
                          height: 120,
                          borderRadius: 8,
                          overflow: "hidden",
                          position: "relative",
                          background:
                            "linear-gradient(135deg, oklch(0.82 0.04 60), oklch(0.72 0.06 45))",
                          border: "1px solid var(--rule-2)",
                        }}
                      >
                        {c.photo_url ? (
                          <Image
                            src={c.photo_url as string}
                            alt={(c.body as string | null) ?? "card"}
                            fill
                            sizes="88px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : null}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "baseline",
                            flexWrap: "wrap",
                            fontSize: 10.5,
                            fontFamily: "var(--mono-font)",
                            color: "var(--ink-3)",
                            letterSpacing: "0.06em",
                          }}
                        >
                          <span>No.{serial}</span>
                          {cat ? (
                            <>
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  background: color,
                                }}
                              />
                              <span style={{ color: "var(--ink-2)" }}>
                                {cat.name}
                              </span>
                            </>
                          ) : null}
                          <span style={{ marginLeft: "auto" }}>
                            {authorName} · {dateText}
                          </span>
                          {!c.is_public ? (
                            <span
                              style={{
                                color: "var(--ink-3)",
                                padding: "1px 6px",
                                border: "1px solid var(--rule)",
                                fontSize: 9.5,
                                marginLeft: 4,
                              }}
                            >
                              비공개
                            </span>
                          ) : null}
                        </div>
                        <p
                          className="serif"
                          style={{
                            fontSize: 13.5,
                            lineHeight: 1.6,
                            color: "var(--ink)",
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {(c.body as string | null) ?? "(본문 없음)"}
                        </p>
                        <div
                          style={{
                            marginTop: "auto",
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Link
                            href={`/owner/letters/new?activity_id=${c.id as string}`}
                            style={{
                              padding: "8px 14px",
                              fontSize: 11.5,
                              fontFamily: "var(--mono-font)",
                              letterSpacing: "0.1em",
                              background: "var(--ink)",
                              color: "var(--paper)",
                              textDecoration: "none",
                            }}
                          >
                            ✎ 편지 쓰기 →
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  hint?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontFamily: "var(--mono-font)",
          color: "var(--ink-3)",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          marginTop: 4,
        }}
      >
        <span
          className="serif"
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{unit}</span>
      </div>
      {hint ? (
        <div
          style={{
            fontSize: 10.5,
            color: "var(--ink-3)",
            marginTop: 2,
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
