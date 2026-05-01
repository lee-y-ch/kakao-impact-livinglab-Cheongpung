import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GhBadge, GhButton, GhWordmark } from "@/components/claude/primitives";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { CrewReactionBar } from "./CrewReactionBar";
import { EpisodeStatusControl } from "./EpisodeStatusControl";

export const dynamic = "force-dynamic";

const EPISODE_LIMIT = 20;
const ACTIVITY_LIMIT = 8;

const STATUS_PILL: Record<
  "planned" | "in_progress" | "completed",
  { label: string; color: string; bg: string }
> = {
  planned: {
    label: "예정",
    color: "var(--ink-3)",
    bg: "var(--paper-3)",
  },
  in_progress: {
    label: "진행",
    color: "var(--pine)",
    bg: "var(--pine-soft)",
  },
  completed: {
    label: "완료",
    color: "var(--ink-2)",
    bg: "var(--paper-3)",
  },
};

/**
 * /crew — Claude editorial 톤의 크루 대시보드.
 *
 * 출처: Claude artifact pages/Crew.jsx (2026-04-29).
 * 시각: 시안 그대로 (사이드 레일 220 + 메인 1.4fr/1fr — 이번 주 에피소드 + 오늘 도착한 카드)
 * 기능: 진행/예정 에피소드 status 갱신 + 카드별 hi_five/note 응원 — 기존 그대로.
 */
export default async function CrewHomePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "crew") redirect("/crew/login");

  const admin = createAdminClient();
  const today = new Date();

  const [episodesRes, activitiesRes] = await Promise.all([
    admin
      .from("episodes")
      .select(
        `id, title, seq, session_date, location, status, updated_at,
         project:project_id (id, title, slug)`
      )
      .in("status", ["planned", "in_progress"])
      .order("session_date", { ascending: true, nullsFirst: false })
      .limit(EPISODE_LIMIT),
    admin
      .from("activities")
      .select(
        `id, type, body, photo_url, is_public, created_at,
         shop:shop_id (id, name),
         episode:episode_id (id, title),
         author:user_id (id, nickname),
         project:project_id (id, title, slug, category_id)`
      )
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LIMIT),
  ]);

  const episodes = episodesRes.data ?? [];
  const activities = activitiesRes.data ?? [];

  const todayLabel = today
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "narrow",
    })
    .replace(/\.\s?/g, ".")
    .replace(/\.$/, "")
    .replace(/\.([일월화수목금토])$/, " $1");
  const weekNumber =
    Math.floor(
      (today.getTime() - new Date("2024-05-01").getTime()) / 86_400_000 / 7
    ) + 1;

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
          width: 220,
          background: "var(--paper)",
          borderRight: "1px solid var(--rule)",
          padding: "22px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <GhWordmark size={13} />
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
            CREW WORKSPACE
          </div>
        </div>

        {[
          {
            label: "오늘",
            badge: episodes.length,
            href: "#",
            active: true,
          },
          {
            label: "진행 중 에피소드",
            badge: episodes.filter((e) => e.status === "in_progress").length,
            href: "#episodes",
          },
          {
            label: "참여자 카드",
            badge: activities.length,
            href: "#cards",
          },
          { label: "공개 페이지", badge: null, href: "/impact" },
          { label: "프로젝트", badge: null, href: "/projects" },
        ].map((t, i) => (
          <Link
            key={i}
            href={t.href}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              background: t.active ? "var(--paper-3)" : "transparent",
              color: t.active ? "var(--ink)" : "var(--ink-2)",
              fontSize: 13,
              fontWeight: t.active ? 600 : 500,
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
          공용 계정 · Phase 3
          <br />
          crew@chungpung
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto" }} className="gh-scroll">
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.08em",
              }}
            >
              {todayLabel} · {weekNumber}주차
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 26,
                fontWeight: 700,
                margin: "4px 0 0",
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              오늘도 강화도를 이어 주세요
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Link href="/impact" style={{ textDecoration: "none" }}>
              <GhButton variant="secondary" size="sm">
                임팩트 페이지
              </GhButton>
            </Link>
            <Link href="/feed" style={{ textDecoration: "none" }}>
              <GhButton variant="primary" size="sm">
                전체 피드
              </GhButton>
            </Link>
          </div>
        </div>

        <div
          style={{
            padding: "24px 36px 40px",
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 24,
          }}
        >
          {/* Left: episodes */}
          <section id="episodes">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  className="serif"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  이번 주 에피소드
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-3)",
                    marginTop: 2,
                  }}
                >
                  크루가 상태를 올려주면 관리자·임팩트 페이지에 즉시 반영돼요.
                </div>
              </div>
            </div>

            {episodes.length === 0 ? (
              <p
                style={{
                  border: "1px dashed var(--rule)",
                  padding: "32px 24px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--ink-3)",
                  background: "var(--paper)",
                  borderRadius: 14,
                  fontFamily: "var(--serif-font)",
                  lineHeight: 1.7,
                }}
              >
                지금 진행 중이거나 예정된 에피소드가 없어요.
                <br />
                관리자(/admin/projects) 에서 에피소드를 먼저 만들어주세요.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {episodes.map((ep) => {
                  const project = ep.project as {
                    id: string;
                    title: string;
                    slug: string;
                  } | null;
                  const status =
                    (ep.status as "planned" | "in_progress" | "completed") ??
                    "planned";
                  const pill = STATUS_PILL[status];
                  return (
                    <article
                      key={ep.id as string}
                      style={{
                        padding: 20,
                        background: "var(--paper)",
                        borderRadius: 14,
                        border: "1px solid var(--rule)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 14,
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontFamily: "var(--mono-font)",
                              color: "var(--ink-3)",
                            }}
                          >
                            {project ? (
                              <Link
                                href={`/projects/${project.slug}`}
                                style={{
                                  color: "var(--ink-3)",
                                  textDecoration: "none",
                                }}
                              >
                                {project.title}
                              </Link>
                            ) : (
                              "프로젝트 미지정"
                            )}
                            {ep.session_date
                              ? ` · ${ep.session_date as string}`
                              : ""}
                          </div>
                          <div
                            className="serif"
                            style={{
                              fontSize: 17,
                              fontWeight: 700,
                              color: "var(--ink)",
                              marginTop: 2,
                              letterSpacing: "-0.015em",
                            }}
                          >
                            {ep.title as string}
                          </div>
                          {ep.location ? (
                            <div
                              style={{
                                fontSize: 11.5,
                                color: "var(--ink-2)",
                                marginTop: 4,
                              }}
                            >
                              📍 {ep.location as string}
                            </div>
                          ) : null}
                        </div>
                        <span
                          style={{
                            padding: "5px 10px",
                            borderRadius: 6,
                            background: pill.bg,
                            color: pill.color,
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "var(--mono-font)",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          ● {pill.label}
                        </span>
                      </div>

                      <EpisodeStatusControl
                        episodeId={ep.id as string}
                        initialStatus={status}
                      />

                      <div
                        style={{
                          marginTop: 14,
                          fontSize: 11,
                          color: "var(--ink-3)",
                          fontFamily: "var(--mono-font)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {ep.seq != null ? `${ep.seq}회차` : "회차 미지정"}
                        {ep.updated_at
                          ? ` · 최근 업데이트 ${new Date(
                              ep.updated_at as string
                            ).toLocaleDateString("ko-KR")}`
                          : ""}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Archive uploads (placeholder — episode_archives 도입 시 부착) */}
            <div
              style={{
                marginTop: 20,
                padding: 18,
                background: "var(--paper)",
                borderRadius: 14,
                border: "1px dashed var(--rule)",
              }}
            >
              <div
                className="serif"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                아카이브 / 결과물
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--ink-3)",
                  fontFamily: "var(--serif-font)",
                  lineHeight: 1.7,
                }}
              >
                후기·사진·기록 링크를 모으는 자리예요. episode_archives 테이블이
                있어 데이터는 들어와 있지만, UI 는 다음 PR 에서 붙일게요.
              </div>
            </div>
          </section>

          {/* Right: recent cards */}
          <section id="cards">
            <div
              className="serif"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--ink)",
                marginBottom: 4,
              }}
            >
              오늘 도착한 카드
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                marginBottom: 14,
              }}
            >
              참여자가 남긴 기록 · 하이파이브나 짧은 노트를 달아줄 수 있어요.
            </div>
            {activities.length === 0 ? (
              <p
                style={{
                  border: "1px dashed var(--rule)",
                  padding: "32px 24px",
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--ink-3)",
                  background: "var(--paper)",
                  borderRadius: 12,
                  fontFamily: "var(--serif-font)",
                }}
              >
                최근 카드가 아직 없어요.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {activities.map((a) => {
                  const shopName =
                    (a.shop as { name: string } | null)?.name ?? null;
                  const episodeTitle =
                    (a.episode as { title: string } | null)?.title ?? null;
                  const authorName =
                    (a.author as { nickname: string | null } | null)
                      ?.nickname ?? "(이름 없음)";
                  const place = shopName ?? episodeTitle ?? "강화 어딘가";
                  const dateText = new Date(
                    a.created_at as string
                  ).toLocaleDateString("ko-KR");
                  const serial = (a.id as string).slice(-3).toUpperCase();
                  return (
                    <article
                      key={a.id as string}
                      style={{
                        padding: 12,
                        background: "var(--paper)",
                        borderRadius: 12,
                        border: "1px solid var(--rule)",
                        display: "flex",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          flexShrink: 0,
                          width: 72,
                          height: 98,
                          borderRadius: 8,
                          overflow: "hidden",
                          position: "relative",
                          background:
                            "linear-gradient(135deg, oklch(0.82 0.04 60), oklch(0.72 0.06 45))",
                          border: "1px solid var(--rule-2)",
                        }}
                      >
                        {a.photo_url ? (
                          <Image
                            src={a.photo_url as string}
                            alt={(a.body as string | null) ?? place}
                            fill
                            sizes="72px"
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
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10.5,
                              fontFamily: "var(--mono-font)",
                              color: "var(--ink-3)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            No.{serial} · {place} · {authorName} · {dateText}
                          </span>
                          <span style={{ flexShrink: 0 }}>
                            {a.is_public ? (
                              <GhBadge
                                color="var(--pine)"
                                bg="var(--pine-soft)"
                              >
                                공개
                              </GhBadge>
                            ) : (
                              <GhBadge color="var(--ink-3)">비공개</GhBadge>
                            )}
                          </span>
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--serif-font)",
                            fontSize: 12.5,
                            lineHeight: 1.5,
                            color: "var(--ink)",
                            marginTop: 4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {(a.body as string | null) ?? "(본문 없음)"}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <CrewReactionBar activityId={a.id as string} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
