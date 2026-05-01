"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export type Chapter = {
  id: string;
  idx: string;
  year: string | null;
  phase: string;
  status: "done" | "active" | "planned";
  headline: string;
  summary: string | null;
  moments: string | null;
  statusLabel: string;
  stats: {
    cards: number;
    letters: number;
    people: number;
    highFives: number;
    sessionDate: string | null;
  } | null;
};

type EpisodeCard = {
  id: string;
  body: string | null;
  photo_url: string | null;
  created_at: string;
  categorySlug: string | null;
  categoryName: string | null;
  letter: boolean;
  highFiveCount: number;
  place: string;
};

/**
 * Claude editorial 톤의 챕터 섹션 — 5-col stepper + 2-col 본문.
 *
 * 클릭으로 openId 가 바뀌면 좌측 본문(헤드라인·summary·stats·카드들·장소·planned 안내)
 * 과 우측 메타(NOTICES·COMPANIONS) 가 함께 갈아엎힘.
 *
 * notices 는 schema 에 없어서 비워둠 — 추후 episode_archives 등에서 끌어올 자리.
 */
export function ChapterSection({
  chapters,
  totalChapters,
  inFlightCount,
  initialChapterId,
  categoryColor,
  cardsByEpisode,
}: {
  chapters: Chapter[];
  totalChapters: number;
  inFlightCount: number;
  initialChapterId: string;
  categoryColor: string;
  cardsByEpisode: Record<string, EpisodeCard[]>;
}) {
  const [openId, setOpenId] = useState(initialChapterId);
  const ch = chapters.find((c) => c.id === openId) ?? chapters[0];
  const chapterCards = cardsByEpisode[ch.id] ?? [];

  const stepCols =
    chapters.length <= 5
      ? `repeat(${chapters.length}, 1fr)`
      : "repeat(auto-fill, minmax(180px, 1fr))";

  return (
    <>
      {/* Chapter horizontal stepper */}
      <div
        style={{
          padding: "24px 40px 0",
          borderBottom: "1px solid var(--rule)",
          background: "var(--paper-2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10.5,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.18em",
                marginBottom: 6,
              }}
            >
              CHAPTERS · 전체 진행 흐름
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                className="serif"
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {inFlightCount}
              </span>
              <span
                className="serif"
                style={{ fontSize: 16, color: "var(--ink-3)" }}
              >
                / {totalChapters} 챕터 진행
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.05em",
            }}
          >
            챕터를 클릭하면 해당 시기로 이동합니다
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: stepCols,
            gap: 10,
            paddingBottom: 0,
          }}
        >
          {chapters.map((c) => {
            const active = c.id === openId;
            const dotColor =
              c.status === "done" || c.status === "active"
                ? categoryColor
                : "var(--rule)";
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpenId(c.id)}
                style={{
                  textAlign: "left",
                  background: active ? "var(--paper)" : "transparent",
                  border: "none",
                  borderTop: `3px solid ${
                    active ? categoryColor : "var(--rule-2)"
                  }`,
                  padding: "14px 14px 18px",
                  cursor: "pointer",
                  position: "relative",
                  opacity: c.status === "planned" ? 0.55 : 1,
                  fontFamily: "var(--ui-font)",
                  color: "var(--ink)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mono-font)",
                      color: "var(--ink-3)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    CH.{c.idx}
                    {c.year ? ` · ${c.year}` : ""}
                  </span>
                  {c.status === "active" ? (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: dotColor,
                      }}
                    />
                  ) : null}
                </div>
                <div
                  className="serif"
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: active ? "var(--ink)" : "var(--ink-2)",
                    lineHeight: 1.4,
                    letterSpacing: "-0.01em",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {c.phase}
                </div>
                {c.stats ? (
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mono-font)",
                      color: "var(--ink-3)",
                      marginTop: 6,
                      letterSpacing: "0.04em",
                    }}
                  >
                    카드 {c.stats.cards} · 참여 {c.stats.people}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-column body */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 0 }}
      >
        {/* LEFT */}
        <div
          style={{
            padding: "48px 56px",
            borderRight: "1px solid var(--rule)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "var(--mono-font)",
                fontWeight: 700,
                color: ch.status === "active" ? categoryColor : "var(--ink-3)",
                letterSpacing: "0.12em",
                padding: "2px 8px",
                border: `1px solid ${
                  ch.status === "active" ? categoryColor : "var(--rule)"
                }`,
              }}
            >
              {ch.status === "active" ? "● " : ""}
              {ch.statusLabel}
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.1em",
              }}
            >
              CHAPTER {ch.idx}
              {ch.year ? ` · ${ch.year}` : ""} {ch.phase}
            </span>
          </div>
          <h2
            className="serif"
            style={{
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              margin: "0 0 18px",
            }}
          >
            {ch.headline}
          </h2>
          {ch.summary ? (
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.9,
                color: "var(--ink-2)",
                maxWidth: 600,
                margin: "0 0 36px",
                whiteSpace: "pre-line",
              }}
            >
              {ch.summary}
            </p>
          ) : null}

          {/* Stats row */}
          {ch.stats ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                borderTop: "1px solid var(--rule)",
                borderBottom: "1px solid var(--rule)",
                marginBottom: 36,
              }}
            >
              {(
                [
                  ["CARDS", ch.stats.cards],
                  ["LETTERS", ch.stats.letters],
                  ["PEOPLE", ch.stats.people],
                  ["HIGH★", ch.stats.highFives],
                ] as const
              ).map(([k, v], i) => (
                <div
                  key={k}
                  style={{
                    padding: "18px 8px",
                    textAlign: "center",
                    borderRight: i < 3 ? "1px solid var(--rule)" : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mono-font)",
                      color: "var(--ink-3)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {k}
                  </div>
                  <div
                    className="serif"
                    style={{
                      fontSize: 30,
                      fontWeight: 700,
                      letterSpacing: "-0.03em",
                      margin: "4px 0 0",
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Cards in this chapter */}
          {chapterCards.length > 0 ? (
            <>
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                  letterSpacing: "0.18em",
                  marginBottom: 16,
                }}
              >
                CARDS IN THIS CHAPTER
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 14,
                  marginBottom: 36,
                }}
              >
                {chapterCards.map((c) => (
                  <ChapterCard
                    key={c.id}
                    card={c}
                    categoryColor={categoryColor}
                  />
                ))}
              </div>
            </>
          ) : null}

          {/* Places */}
          {ch.moments ? (
            <div
              style={{
                marginBottom: 8,
                paddingTop: 8,
                borderTop: "1px solid var(--rule-2)",
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                  letterSpacing: "0.18em",
                  marginTop: 24,
                  marginBottom: 10,
                }}
              >
                PLACES — 이 챕터의 장소
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--ink-2)",
                  lineHeight: 1.7,
                  fontFamily: "var(--serif-font)",
                }}
              >
                {ch.moments}
              </div>
            </div>
          ) : null}

          {ch.status === "planned" ? (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                fontFamily: "var(--serif-font)",
                color: "var(--ink-3)",
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              아직 시작되지 않은 챕터예요.
              <br />
              열리면 알림으로 알려드릴게요.
            </div>
          ) : null}
        </div>

        {/* RIGHT — meta */}
        <div style={{ padding: "48px 40px", background: "var(--paper-2)" }}>
          {/* Notices: schema 에 없어 비워둠 — 자리는 시안 톤으로 보존 */}
          <div
            style={{
              fontSize: 10.5,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              marginBottom: 14,
            }}
          >
            COMPANIONS — {ch.stats?.people ?? 0}명
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-2)",
              lineHeight: 1.85,
              fontFamily: "var(--serif-font)",
            }}
          >
            이 챕터에 참여한 사람 수입니다. 개별 프로필은 공개하지 않아요 — 그게
            우리 환대의 약속이에요.
          </div>
          {ch.stats ? (
            <div
              style={{
                marginTop: 24,
                padding: "16px 18px",
                background: "var(--paper)",
                border: "1px solid var(--rule)",
                fontSize: 11.5,
                lineHeight: 1.75,
                color: "var(--ink-2)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                  letterSpacing: "0.14em",
                  marginBottom: 8,
                }}
              >
                AT A GLANCE
              </div>
              <div>
                참여자가 남긴 카드 <strong>{ch.stats.cards}장</strong>, 받은
                편지 <strong>{ch.stats.letters}통</strong>, 받은 하이파이브{" "}
                <strong>{ch.stats.highFives}회</strong>.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function ChapterCard({
  card,
  categoryColor,
}: {
  card: EpisodeCard;
  categoryColor: string;
}) {
  const dateText = new Date(card.created_at).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  return (
    <Link
      href={`/feed`}
      style={{
        textDecoration: "none",
        color: "var(--ink)",
      }}
    >
      <article
        style={{
          width: "100%",
          aspectRatio: "148 / 208",
          background: "var(--paper)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--rule)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "52%",
            position: "relative",
            background:
              "linear-gradient(135deg, oklch(0.82 0.04 60), oklch(0.72 0.06 45))",
          }}
        >
          {card.photo_url ? (
            <Image
              src={card.photo_url}
              alt={card.body ?? card.place}
              fill
              sizes="148px"
              style={{ objectFit: "cover" }}
            />
          ) : null}
          {card.categoryName ? (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "var(--paper)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 1,
                  background: categoryColor,
                }}
              />
              {card.categoryName}
            </div>
          ) : null}
        </div>
        <div
          style={{
            padding: "10px 12px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 11.5,
              lineHeight: 1.45,
              color: "var(--ink)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {card.body ?? "—"}
          </div>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
            }}
          >
            <span>{card.place}</span>
            <span>{dateText}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
