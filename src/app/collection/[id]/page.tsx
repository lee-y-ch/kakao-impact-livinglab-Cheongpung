import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GhWordmark } from "@/components/claude/primitives";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";
import { UuidSchema } from "@/lib/schemas/common";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

import { CardActions } from "./CardActions";

export const dynamic = "force-dynamic";

const CATEGORY_COLOR: Record<string, string> = {
  commons: "var(--cat-commons)",
  network: "var(--cat-network)",
  world: "var(--cat-world)",
  policy: "var(--cat-policy)",
};

const CATEGORY_EN: Record<string, string> = {
  commons: "commons",
  network: "network",
  world: "world",
  policy: "policy",
};

/**
 * /collection/[id] — Claude editorial 톤의 카드 상세.
 *
 * 출처: Claude artifact pages/CardDetailDesktop.jsx (2026-04-29).
 * 시각: 시안 그대로 (breadcrumb / 1.1fr·1fr split / 좌 카드 앞·뒷면 페어 + FLIP·SHARE / 우 컨텍스트 + 3-cell + LETTER)
 * 기능: 본인 카드만(RLS), is_public 토글 + 삭제 요청 그대로 유지.
 *
 * QUOTED BY 블록은 카드-카드 인용 데이터가 schema 에 없어 비활성.
 */
export default async function CollectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const idCheck = UuidSchema.safeParse(params.id);
  if (!idCheck.success) notFound();

  const actor = await getCurrentActor();
  if (actor.role !== "participant") {
    redirect(`/login?next=/collection/${params.id}`);
  }

  const supabase = createServerSupabase();
  const admin = createAdminClient();

  const { data: row } = await supabase
    .from("activities")
    .select(
      `id, type, body, title, photo_url, is_public, face_consent, created_at, removed_at, user_id, episode_id,
       shops:shop_id(id, name),
       episodes:episode_id(id, title, seq, session_date),
       projects:project_id(id, title, slug, category_id)`
    )
    .eq("id", idCheck.data)
    .maybeSingle();

  if (!row) notFound();
  if (row.user_id !== actor.userId) notFound();
  if (row.removed_at) {
    return <RemovedView />;
  }

  // 카테고리 + 받은 편지·하이파이브 (이 카드에 달린 reactions)
  const categoryId =
    (row.projects as { category_id?: string } | null)?.category_id ?? null;
  const [categoryRes, reactionsRes] = await Promise.all([
    categoryId
      ? admin
          .from("categories")
          .select("id, slug, name")
          .eq("id", categoryId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("reactions")
      .select(
        "id, kind, body, llm_draft, sent_at, author_role, author_label, author_shop_id, shop:author_shop_id(id, name)"
      )
      .eq("activity_id", idCheck.data)
      .order("sent_at", { ascending: false }),
  ]);

  const cat = categoryRes.data ?? null;
  const catSlug = (cat?.slug as string | undefined) ?? null;
  const catName = (cat?.name as string | undefined) ?? null;
  const catColor = CATEGORY_COLOR[catSlug ?? ""] ?? "var(--ink-2)";
  const catEn = CATEGORY_EN[catSlug ?? ""] ?? "—";

  const reactions = (reactionsRes.data ?? []) as Array<{
    id: string;
    kind: string;
    body: string | null;
    llm_draft: string | null;
    sent_at: string;
    author_role: string;
    author_label: string | null;
    author_shop_id: string | null;
    shop: { id: string; name: string } | null;
  }>;

  const letters = reactions.filter((r) => r.kind === "letter");
  const highFiveCount = reactions.filter((r) => r.kind === "hi_five").length;

  const place =
    row.shops?.name ??
    row.episodes?.title ??
    row.projects?.title ??
    "강화 어딘가";

  const serial = (row.id as string).slice(-3).toUpperCase();
  const dateText = new Date(row.created_at as string).toLocaleDateString(
    "ko-KR",
    { year: "numeric", month: "2-digit", day: "2-digit" }
  );

  const projectTitle = row.projects?.title ?? null;
  const projectSlug = row.projects?.slug ?? null;
  const episodeSeq = (row.episodes as { seq?: number } | null)?.seq;
  const episodeLabel =
    typeof episodeSeq === "number" ? `${episodeSeq}회차` : null;

  return (
    <div
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--ui-font)",
        minHeight: "100vh",
      }}
    >
      {/* Breadcrumb nav */}
      <div
        style={{
          padding: "14px 40px",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 12,
            color: "var(--ink-2)",
          }}
        >
          <Link
            href="/collection"
            style={{
              color: "var(--ink-3)",
              fontFamily: "var(--mono-font)",
              fontSize: 11,
              textDecoration: "none",
            }}
          >
            ← 내 도감
          </Link>
          <span style={{ color: "var(--rule)" }}>/</span>
          <span
            style={{
              fontFamily: "var(--mono-font)",
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
            }}
          >
            {catEn.toUpperCase()} · No.{serial}
          </span>
        </div>
        <Link href="/" style={{ textDecoration: "none" }}>
          <GhWordmark size={12} mono />
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          minHeight: "calc(100vh - 49px)",
        }}
      >
        {/* LEFT — card pair */}
        <section
          style={{
            background: "var(--paper-2)",
            padding: "56px 56px",
            borderRight: "1px solid var(--rule)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              marginBottom: 20,
              alignSelf: "flex-start",
            }}
          >
            CARD · No.{serial}
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <CardFront
              card={{
                id: row.id as string,
                body: (row.body as string | null) ?? null,
                photo_url: (row.photo_url as string | null) ?? null,
                created_at: row.created_at as string,
                serial,
                place,
                catColor,
                catName,
              }}
            />
            <CardBack
              card={{
                body: (row.body as string | null) ?? null,
                created_at: row.created_at as string,
                place,
                catColor,
                catEn,
                letterCount: letters.length,
                highFiveCount,
              }}
            />
          </div>

          <div
            style={{
              marginTop: 36,
              alignSelf: "stretch",
            }}
          >
            <CardActions
              activityId={row.id as string}
              initialIsPublic={Boolean(row.is_public)}
              faceConsentGranted={Boolean(row.face_consent)}
            />
          </div>
        </section>

        {/* RIGHT — context */}
        <section style={{ padding: "56px 56px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                background: catColor,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {catEn}
            </span>
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              margin: "0 0 16px",
              whiteSpace: "pre-line",
            }}
          >
            {row.body ?? "메모 없는 한 장"}
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.85,
              color: "var(--ink-2)",
              marginBottom: 32,
              maxWidth: 480,
            }}
          >
            {projectTitle
              ? `${projectTitle}${episodeLabel ? ` ${episodeLabel}` : ""} 의 카드로 등록되었습니다. 같은 자리에 다시 와도 카드가 또 한 장 쌓여요.`
              : "이 카드는 도감에 단독으로 묶여있어요. 같은 자리에 다시 와도 카드가 또 한 장 쌓여요."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              borderTop: "1px solid var(--rule)",
              borderBottom: "1px solid var(--rule)",
              marginBottom: 32,
            }}
          >
            <StatCell label="DATE" value={dateText} />
            <StatCell label="PLACE" value={place} hasBorder />
            <StatCell
              label="PROJECT"
              value={projectTitle ?? "—"}
              sub={episodeLabel}
              link={projectSlug ? `/projects/${projectSlug}` : null}
            />
          </div>

          {/* LETTER */}
          <div
            style={{
              fontSize: 10.5,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              marginBottom: 14,
            }}
          >
            LETTER · 이 카드와 함께 받은 편지
          </div>
          {letters.length === 0 ? (
            <div
              style={{
                padding: 18,
                border: "1px dashed var(--rule)",
                background: "var(--paper-2)",
                fontSize: 12.5,
                color: "var(--ink-3)",
                fontFamily: "var(--serif-font)",
                lineHeight: 1.7,
              }}
            >
              아직 도착한 편지가 없어요. 가게 사장님·크루의 편지가 도착하면 이
              자리에 쌓입니다.
            </div>
          ) : (
            letters.map((letter) => (
              <LetterBlock
                key={letter.id}
                from={
                  letter.author_label ??
                  letter.shop?.name ??
                  authorRoleLabel(letter.author_role)
                }
                date={letter.sent_at}
                body={letter.body ?? letter.llm_draft ?? "—"}
              />
            ))
          )}

          {highFiveCount > 0 ? (
            <div
              style={{
                marginTop: 24,
                padding: "12px 14px",
                border: "1px solid var(--rule)",
                background: "var(--paper)",
                fontSize: 12,
                color: "var(--ink-2)",
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono-font)",
                  fontSize: 10,
                  color: "var(--ink-3)",
                  letterSpacing: "0.12em",
                  marginRight: 8,
                }}
              >
                HIGH★
              </span>
              <span style={{ fontFamily: "var(--serif-font)" }}>
                크루·동료가 남긴 하이파이브 {highFiveCount}회.
              </span>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Subcomponents
 * ───────────────────────────────────────────────────────────── */

function CardFront({
  card,
}: {
  card: {
    id: string;
    body: string | null;
    photo_url: string | null;
    created_at: string;
    serial: string;
    place: string;
    catColor: string;
    catName: string | null;
  };
}) {
  const dateText = new Date(card.created_at).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  return (
    <div>
      <article
        style={{
          width: 232,
          height: 326,
          background: "var(--paper)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(20,22,28,0.08)",
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
              priority
              sizes="232px"
              style={{ objectFit: "cover" }}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "var(--paper)",
              padding: "3px 7px",
              borderRadius: 4,
              fontFamily: "var(--mono-font)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--ink-2)",
              border: "1px solid var(--rule)",
            }}
          >
            No.{card.serial}
          </div>
          {card.catName ? (
            <div
              style={{
                position: "absolute",
                bottom: 10,
                left: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "var(--paper)",
                padding: "3px 8px",
                borderRadius: 4,
                fontSize: 10,
                color: "var(--ink)",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 2,
                  background: card.catColor,
                }}
              />
              {card.catName}
            </div>
          ) : null}
        </div>
        <div
          style={{
            padding: "12px 14px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            className="serif"
            style={{
              fontSize: 13.5,
              lineHeight: 1.5,
              color: "var(--ink)",
              display: "-webkit-box",
              WebkitLineClamp: 4,
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
              alignItems: "flex-end",
              fontSize: 10,
              color: "var(--ink-3)",
              fontFamily: "var(--mono-font)",
            }}
          >
            <span>@ {card.place}</span>
            <span>{dateText}</span>
          </div>
        </div>
      </article>
      <div
        style={{
          fontSize: 10,
          fontFamily: "var(--mono-font)",
          color: "var(--ink-3)",
          marginTop: 10,
          textAlign: "center",
          letterSpacing: "0.1em",
        }}
      >
        FRONT · 앞면
      </div>
    </div>
  );
}

function CardBack({
  card,
}: {
  card: {
    body: string | null;
    created_at: string;
    place: string;
    catColor: string;
    catEn: string;
    letterCount: number;
    highFiveCount: number;
  };
}) {
  const dateText = new Date(card.created_at).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  return (
    <div>
      <div
        style={{
          width: 232,
          height: 326,
          background: "var(--paper)",
          border: `1px solid ${card.catColor}`,
          padding: 18,
          position: "relative",
          boxShadow: "0 8px 24px rgba(20,22,28,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontFamily: "var(--mono-font)",
            color: card.catColor,
            letterSpacing: "0.18em",
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          {card.catEn} · BACK
        </div>
        <div
          className="serif"
          style={{
            fontSize: 13.5,
            lineHeight: 1.7,
            color: "var(--ink)",
            display: "-webkit-box",
            WebkitLineClamp: 9,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {card.body ? `"${card.body}"` : "—"}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 18,
            right: 18,
            fontSize: 10,
            fontFamily: "var(--mono-font)",
            color: "var(--ink-3)",
            letterSpacing: "0.06em",
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid var(--rule-2)",
            paddingTop: 8,
          }}
        >
          <span>{card.place}</span>
          <span>{dateText}</span>
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          fontFamily: "var(--mono-font)",
          color: "var(--ink-3)",
          marginTop: 10,
          textAlign: "center",
          letterSpacing: "0.1em",
        }}
      >
        BACK · 뒷면 · 편지 {card.letterCount} · 하이파이브 {card.highFiveCount}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
  hasBorder,
  link,
}: {
  label: string;
  value: string;
  sub?: string | null;
  hasBorder?: boolean;
  link?: string | null;
}) {
  const inner = (
    <div
      style={{
        padding: "14px 6px",
        borderRight: hasBorder ? "1px solid var(--rule)" : "none",
      }}
    >
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
        className="serif"
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            fontSize: 10.5,
            color: "var(--ink-3)",
            fontFamily: "var(--mono-font)",
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
  if (link) {
    return (
      <Link
        href={link}
        style={{
          color: "var(--ink)",
          textDecoration: "none",
          borderRight: "none",
        }}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function LetterBlock({
  from,
  date,
  body,
}: {
  from: string;
  date: string;
  body: string;
}) {
  const d = new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return (
    <div
      style={{
        padding: 18,
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontFamily: "var(--mono-font)",
          color: "var(--ink-3)",
          letterSpacing: "0.05em",
          marginBottom: 10,
        }}
      >
        FROM {from} · {d}
      </div>
      <div
        className="serif"
        style={{
          fontSize: 13.5,
          lineHeight: 1.85,
          color: "var(--ink-2)",
          whiteSpace: "pre-line",
        }}
      >
        {body}
      </div>
    </div>
  );
}

function authorRoleLabel(role: string): string {
  if (role === "owner") return "사장님";
  if (role === "crew") return "크루";
  if (role === "admin") return "운영자";
  if (role === "participant") return "동료 참여자";
  return "알 수 없음";
}

function RemovedView() {
  return (
    <div
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--ui-font)",
        minHeight: "100vh",
        padding: "120px 56px",
        textAlign: "center",
      }}
    >
      <h1
        className="serif"
        style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          margin: 0,
          marginBottom: 12,
        }}
      >
        삭제된 카드예요
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-3)",
          fontFamily: "var(--serif-font)",
          marginBottom: 32,
        }}
      >
        이 카드는 더 이상 도감에 표시되지 않아요.
      </p>
      <Link
        href="/collection"
        style={{
          padding: "10px 16px",
          background: "var(--ink)",
          color: "var(--paper)",
          fontSize: 12,
          fontFamily: "var(--mono-font)",
          letterSpacing: "0.08em",
          textDecoration: "none",
        }}
      >
        ← 도감으로 돌아가기
      </Link>
    </div>
  );
}
