import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GhButton, GhLogo, GhStat } from "@/components/claude/primitives";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PROJECT_EPOCH = "2024-05-01";

const RECENT_DAYS = 30;

const STATUS_COLOR: Record<"planned" | "in_progress" | "completed", string> = {
  planned: "var(--ink-3)",
  in_progress: "var(--pine)",
  completed: "var(--ink-2)",
};
const STATUS_LABEL: Record<"planned" | "in_progress" | "completed", string> = {
  planned: "예정",
  in_progress: "진행",
  completed: "완료",
};

const CATEGORY_COLOR: Record<string, string> = {
  commons: "var(--cat-commons)",
  network: "var(--cat-network)",
  world: "var(--cat-world)",
  policy: "var(--cat-policy)",
};

/**
 * /admin — Claude editorial 톤의 운영 홈.
 *
 * 출처: Claude artifact pages/Admin.jsx (2026-04-29).
 * 시각: 시안 그대로 (다크 ink 사이드바 + 메인: 4 큐 카드 + 검수 큐 미리보기 + 진행 에피소드 패널 + 운영 지표 strip)
 * 기능: 기존 카운트 쿼리 그대로 유지. 신규 카운트만 추가.
 */
export default async function AdminHomePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  const admin = createAdminClient();
  const today = new Date();
  const nowIso = today.toISOString();
  const recentSince = new Date(
    today.getTime() - RECENT_DAYS * 86_400_000
  ).toISOString();

  const [
    publicActivitiesRes,
    pendingReportsRes,
    removedActivitiesRes,
    lockedOwnersRes,
    inProgressEpisodesRes,
    totalProjectsRes,
    totalShopsRes,
    totalOwnersRes,
    totalActivitiesRes,
    reviewQueueRes,
    inProgressEpisodesListRes,
    recentNewShopsRes,
    recentRemovedRes,
  ] = await Promise.all([
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true)
      .is("removed_at", null),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .not("reported_at", "is", null)
      .is("removed_at", null),
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .not("removed_at", "is", null),
    admin
      .from("shop_owners")
      .select("id", { count: "exact", head: true })
      .gt("locked_until", nowIso),
    admin
      .from("episodes")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    admin.from("projects").select("id", { count: "exact", head: true }),
    admin.from("shops").select("id", { count: "exact", head: true }),
    admin.from("shop_owners").select("id", { count: "exact", head: true }),
    admin.from("activities").select("id", { count: "exact", head: true }),
    // 검수 큐 미리보기 (최근 공개 카드 4건)
    admin
      .from("activities")
      .select(
        `id, body, photo_url, created_at,
         project:project_id (id, title, slug, category_id, category:category_id (id, slug, name))`
      )
      .eq("is_public", true)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(4),
    // 진행 중 에피소드 4건
    admin
      .from("episodes")
      .select(
        `id, title, status, session_date,
         project:project_id (id, title, slug)`
      )
      .in("status", ["in_progress", "planned"])
      .order("session_date", { ascending: true, nullsFirst: false })
      .limit(4),
    // 최근 30일 새 가게
    admin
      .from("shops")
      .select("id", { count: "exact", head: true })
      .gte("created_at", recentSince),
    // 최근 30일 가려진 카드
    admin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .gte("removed_at", recentSince),
  ]);

  const publicActivities = publicActivitiesRes.count ?? 0;
  const pendingReports = pendingReportsRes.count ?? 0;
  const removedActivities = removedActivitiesRes.count ?? 0;
  const lockedOwners = lockedOwnersRes.count ?? 0;
  const inProgressEpisodes = inProgressEpisodesRes.count ?? 0;
  const totalProjects = totalProjectsRes.count ?? 0;
  const totalShops = totalShopsRes.count ?? 0;
  const totalOwners = totalOwnersRes.count ?? 0;
  const totalActivities = totalActivitiesRes.count ?? 0;
  const recentNewShops = recentNewShopsRes.count ?? 0;
  const recentRemoved = recentRemovedRes.count ?? 0;

  const reviewQueue = reviewQueueRes.data ?? [];
  const ongoingEpisodes = inProgressEpisodesListRes.data ?? [];

  const todayLabel = today
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\.\s?/g, ".")
    .replace(/\.$/, "");

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
      {/* Sidebar (dark) */}
      <aside
        style={{
          width: 220,
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "22px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 22, padding: "0 4px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--paper)",
              textDecoration: "none",
            }}
          >
            <GhLogo size={18} color="currentColor" />
            <span
              style={{
                fontFamily: "var(--serif-font)",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              강화유니버스
            </span>
          </Link>
          <div
            style={{
              fontSize: 10,
              color: "oklch(0.7 0.01 250)",
              marginTop: 6,
              fontFamily: "var(--mono-font)",
              letterSpacing: "0.08em",
            }}
          >
            ADMIN CONSOLE
          </div>
        </div>

        {[
          { label: "운영 홈", href: "/admin", active: true, icon: "◉" },
          {
            label: "프로젝트·에피소드",
            href: "/admin/projects",
            icon: "⊞",
          },
          { label: "가게·QR", href: "/admin/shops", icon: "⚑" },
          {
            label: "공개 검수 큐",
            href: "/admin/review",
            icon: "✓",
            badge: publicActivities,
          },
          {
            label: "신고 대응",
            href: "/admin/reports",
            icon: "!",
            badge: pendingReports > 0 ? pendingReports : null,
            warn: pendingReports > 0,
          },
          { label: "임팩트 페이지", href: "/impact", icon: "◎" },
          { label: "크루 대시보드", href: "/crew", icon: "◈" },
        ].map((t, i) => (
          <Link
            key={i}
            href={t.href}
            style={{
              padding: "9px 12px",
              borderRadius: 6,
              background: t.active ? "oklch(0.3 0.012 260)" : "transparent",
              color: t.active ? "var(--paper)" : "oklch(0.75 0.01 250)",
              fontSize: 12.5,
              fontWeight: t.active ? 600 : 500,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <span>
              <span
                style={{
                  marginRight: 8,
                  opacity: 0.7,
                  fontFamily: "var(--mono-font)",
                }}
              >
                {t.icon}
              </span>
              {t.label}
            </span>
            {t.badge != null ? (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: t.warn ? "var(--sunset)" : "oklch(0.4 0.015 260)",
                  color: t.warn ? "#fff" : "oklch(0.85 0.01 250)",
                  fontFamily: "var(--mono-font)",
                  fontWeight: 700,
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
            padding: 12,
            fontSize: 10.5,
            color: "oklch(0.65 0.01 250)",
            borderTop: "1px solid oklch(0.3 0.012 260)",
            fontFamily: "var(--mono-font)",
          }}
        >
          {actor.email}
          <br />
          Supabase Auth
        </div>
      </aside>

      {/* Main */}
      <main className="gh-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            padding: "26px 36px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: "1px solid var(--rule)",
            background: "var(--paper)",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.08em",
              }}
            >
              DASHBOARD · {todayLabel}
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 28,
                fontWeight: 700,
                margin: "4px 0 0",
                letterSpacing: "-0.02em",
              }}
            >
              오늘 처리할 것들
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/impact" style={{ textDecoration: "none" }}>
              <GhButton variant="secondary">임팩트 페이지 보기</GhButton>
            </Link>
            <Link href="/admin/projects" style={{ textDecoration: "none" }}>
              <GhButton variant="primary">＋ 새 프로젝트</GhButton>
            </Link>
          </div>
        </div>

        <div
          style={{
            padding: "24px 36px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Queue cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
            }}
          >
            <QueueCard
              href="/admin/review"
              label="공개 검수 큐"
              value={publicActivities}
              unit="건"
              tone="mud"
              hint={publicActivities === 0 ? "처리 대기 없음" : "공개 중 카드"}
            />
            <QueueCard
              href="/admin/reports"
              label="신고 대기"
              value={pendingReports}
              unit="건"
              tone="sunset"
              hint={pendingReports === 0 ? "신고 없음" : "긴급 우선 처리"}
              urgent={pendingReports > 0}
            />
            <QueueCard
              href="/admin/shops"
              label="가게 등록 (최근 30일)"
              value={recentNewShops}
              unit="건"
              tone="sea"
              hint={recentNewShops === 0 ? "최근 등록 없음" : "QR 발급 진행"}
            />
            <QueueCard
              href="/admin/shops"
              label="사장님 코드 잠금"
              value={lockedOwners}
              unit="건"
              tone="pine"
              hint={lockedOwners === 0 ? "잠금 없음" : "5회 실패 · 1시간 잠금"}
              urgent={lockedOwners > 0}
            />
          </div>

          {/* Review queue + ongoing episodes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 20,
            }}
          >
            <div
              style={{
                background: "var(--paper)",
                borderRadius: 12,
                border: "1px solid var(--rule)",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--rule)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  className="serif"
                  style={{ fontSize: 15, fontWeight: 700 }}
                >
                  공개 카드 미리보기 · {publicActivities}건 중 최근 4건
                </div>
                <Link
                  href="/admin/review"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-3)",
                    fontFamily: "var(--mono-font)",
                    textDecoration: "none",
                  }}
                >
                  전체 보기 →
                </Link>
              </div>
              {reviewQueue.length === 0 ? (
                <p
                  style={{
                    padding: "32px 18px",
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--ink-3)",
                    fontFamily: "var(--serif-font)",
                  }}
                >
                  공개 카드가 아직 없어요.
                </p>
              ) : (
                <div>
                  {reviewQueue.map((c, i) => {
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
                    const color =
                      CATEGORY_COLOR[cat?.slug ?? ""] ?? "var(--ink-3)";
                    const dateText = new Date(
                      c.created_at as string
                    ).toLocaleDateString("ko-KR");
                    const serial = (c.id as string).slice(-3).toUpperCase();
                    return (
                      <div
                        key={c.id as string}
                        style={{
                          padding: 14,
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                          borderBottom:
                            i < reviewQueue.length - 1
                              ? "1px solid var(--rule-2)"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            width: 54,
                            height: 74,
                            borderRadius: 6,
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
                              sizes="54px"
                              style={{ objectFit: "cover" }}
                            />
                          ) : null}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "baseline",
                              marginBottom: 3,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10.5,
                                fontFamily: "var(--mono-font)",
                                color: "var(--ink-3)",
                              }}
                            >
                              No.{serial}
                            </span>
                            {cat ? (
                              <>
                                <span
                                  style={{
                                    width: 8,
                                    height: 8,
                                    background: color,
                                    display: "inline-block",
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    color: "var(--ink-2)",
                                  }}
                                >
                                  {cat.name}
                                </span>
                              </>
                            ) : null}
                            <span
                              style={{
                                fontSize: 10.5,
                                color: "var(--ink-3)",
                                marginLeft: "auto",
                                fontFamily: "var(--mono-font)",
                              }}
                            >
                              {dateText}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12.5,
                              color: "var(--ink)",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              fontFamily: "var(--serif-font)",
                            }}
                          >
                            {(c.body as string | null) ?? "(본문 없음)"}
                          </div>
                        </div>
                        <Link
                          href={`/admin/review`}
                          style={{
                            padding: "6px 12px",
                            background: "var(--paper-2)",
                            color: "var(--ink-2)",
                            border: "1px solid var(--rule)",
                            fontSize: 11.5,
                            fontWeight: 600,
                            textDecoration: "none",
                            flexShrink: 0,
                          }}
                        >
                          검토
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active episodes panel */}
            <div
              style={{
                background: "var(--paper)",
                borderRadius: 12,
                border: "1px solid var(--rule)",
              }}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                <div
                  className="serif"
                  style={{ fontSize: 15, fontWeight: 700 }}
                >
                  진행 중 에피소드
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-3)",
                    marginTop: 2,
                  }}
                >
                  크루 업데이트 반영 · 진행 {inProgressEpisodes}건
                </div>
              </div>
              {ongoingEpisodes.length === 0 ? (
                <p
                  style={{
                    padding: "32px 18px",
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--ink-3)",
                    fontFamily: "var(--serif-font)",
                  }}
                >
                  진행/예정 에피소드가 없어요.
                </p>
              ) : (
                <div style={{ padding: "8px 0" }}>
                  {ongoingEpisodes.map((e, i) => {
                    const proj = e.project as {
                      id: string;
                      title: string;
                      slug: string;
                    } | null;
                    const status =
                      (e.status as "planned" | "in_progress" | "completed") ??
                      "planned";
                    const color = STATUS_COLOR[status];
                    const label = STATUS_LABEL[status];
                    const dateText = (e.session_date as string | null) ?? "—";
                    return (
                      <div
                        key={e.id as string}
                        style={{
                          padding: "10px 18px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom:
                            i < ongoingEpisodes.length - 1
                              ? "1px solid var(--rule-2)"
                              : "none",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {e.title as string}
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              fontFamily: "var(--mono-font)",
                              color: "var(--ink-3)",
                              marginTop: 2,
                            }}
                          >
                            {proj?.title ?? "프로젝트 미지정"} · {dateText}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: "var(--paper-2)",
                            color,
                            fontFamily: "var(--mono-font)",
                            flexShrink: 0,
                            marginLeft: 12,
                          }}
                        >
                          ● {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom: ops metrics */}
          <div
            style={{
              background: "var(--paper)",
              borderRadius: 12,
              border: "1px solid var(--rule)",
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  className="serif"
                  style={{ fontSize: 15, fontWeight: 700 }}
                >
                  운영 지표{" "}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ink-3)",
                      fontWeight: 400,
                    }}
                  >
                    (공개 노출 ✕)
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-3)",
                    marginTop: 2,
                  }}
                >
                  최근 30일 · 베이스 {PROJECT_EPOCH} 부터
                </div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 20,
              }}
            >
              <GhStat
                label="전체 카드"
                value={totalActivities}
                unit="장"
                hint={`가려진 ${removedActivities}건`}
                small
              />
              <GhStat
                label="가려진 (30일)"
                value={recentRemoved}
                unit="건"
                hint="신고/요청 처리"
                small
              />
              <GhStat
                label="새 가게 (30일)"
                value={recentNewShops}
                unit="곳"
                hint="QR 발급 완료"
                small
              />
              <GhStat
                label="진행 에피소드"
                value={inProgressEpisodes}
                hint="크루 업데이트 중"
                small
              />
              <GhStat
                label="사장님 계정"
                value={totalOwners}
                hint={`잠금 ${lockedOwners}건`}
                small
              />
            </div>
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid var(--rule-2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: 11.5,
                color: "var(--ink-3)",
                fontFamily: "var(--mono-font)",
              }}
            >
              <span>
                전체 프로젝트 {totalProjects} · 가게 {totalShops}
              </span>
              <span>강화도가 작동 중 ✓</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function QueueCard({
  href,
  label,
  value,
  unit,
  tone,
  hint,
  urgent = false,
}: {
  href: string;
  label: string;
  value: number;
  unit: string;
  tone: "mud" | "sunset" | "sea" | "pine";
  hint: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: 18,
        borderRadius: 12,
        background: "var(--paper)",
        border: `1px solid ${urgent ? "var(--sunset)" : "var(--rule)"}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
        textDecoration: "none",
        color: "var(--ink)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 3,
          background: `var(--${tone})`,
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: "var(--ink-3)",
          fontFamily: "var(--mono-font)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          className="serif"
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{unit}</span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: urgent ? "var(--sunset)" : "var(--ink-2)",
        }}
      >
        {hint}
      </div>
    </Link>
  );
}
