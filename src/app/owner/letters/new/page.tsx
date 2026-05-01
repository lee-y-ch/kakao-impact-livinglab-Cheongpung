import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GhWordmark } from "@/components/claude/primitives";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { createAdminClient } from "@/lib/supabase/admin";

import { LetterComposer } from "./LetterComposer";

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

type SearchParams = { activity?: string };

/**
 * /owner/letters/new — Claude editorial 톤의 사장님 편지 작성.
 *
 * 출처: Claude artifact pages/OwnerLetterDesktop.jsx (2026-04-29).
 * 시각: 시안 그대로 (3-col 320 / 1fr / 280 — 좌 받는 사람 컨텍스트 / 중앙 편지지 / 우 ASSIST)
 * 기능: ?activity=UUID 카드 컨텍스트 로드. 본문 작성 → POST /api/reactions
 *      (kind=letter). 사장님 letter 는 이번 PR 에서 reactions API 가
 *      허용하도록 함께 확장됨.
 *
 * AI 단어/첫 문장 후보는 schema-derived (참여자 닉네임 + 자주 등장한 단어)
 * 로 정적 placeholder 처럼 채움. 실제 LLM 호출은 다음 단계 (Phase 4-b).
 */
export default async function OwnerLetterNewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await getCurrentActor();
  if (actor.role !== "owner") {
    redirect("/owner/login?next=/owner/letters/new");
  }

  const idCheck = searchParams.activity
    ? UuidSchema.safeParse(searchParams.activity)
    : null;
  if (!idCheck || !idCheck.success) {
    return <NoActivitySelected />;
  }

  const admin = createAdminClient();

  const { data: activity } = await admin
    .from("activities")
    .select(
      `id, body, photo_url, is_public, created_at, shop_id, user_id,
       author:user_id (id, nickname, profile_image_url, created_at),
       project:project_id (id, title, slug, category_id, category:category_id (id, slug, name)),
       episode:episode_id (id, title, session_date, location)`
    )
    .eq("id", idCheck.data)
    .maybeSingle();

  if (!activity || activity.shop_id !== actor.shopId) {
    notFound();
  }

  const author =
    (activity.author as {
      id: string;
      nickname: string | null;
      profile_image_url: string | null;
      created_at: string;
    } | null) ?? null;

  const proj =
    (activity.project as {
      id: string;
      title: string;
      slug: string;
      category_id: string;
      category: { id: string; slug: string; name: string } | null;
    } | null) ?? null;
  const cat = proj?.category ?? null;

  const ep =
    (activity.episode as {
      id: string;
      title: string;
      session_date: string | null;
      location: string | null;
    } | null) ?? null;

  // 받는 사람 통계 (이 가게에 남긴 카드 + 가입일)
  const [authorCardsRes, shopRes] = await Promise.all([
    author
      ? admin
          .from("activities")
          .select(
            "id, body, created_at, episode:episode_id(id, title, session_date, location)"
          )
          .eq("shop_id", actor.shopId)
          .eq("user_id", author.id)
          .is("removed_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    admin
      .from("shops")
      .select("name, slogan")
      .eq("id", actor.shopId)
      .maybeSingle(),
  ]);

  const authorCards = (authorCardsRes.data ?? []) as Array<{
    id: string;
    body: string | null;
    created_at: string;
    episode: {
      title: string;
      session_date: string | null;
      location: string | null;
    } | null;
  }>;

  const shop = shopRes.data;
  const shopName = (shop?.name as string | undefined) ?? "우리 가게";

  const visits = authorCards.length;
  const authorJoined = author?.created_at
    ? new Date(author.created_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
      })
    : null;

  const lastVisitAt = authorCards[0]?.created_at ?? activity.created_at;
  const lastVisitDate = new Date(lastVisitAt as string).toLocaleDateString(
    "ko-KR",
    { year: "numeric", month: "2-digit", day: "2-digit" }
  );
  const lastVisitLocation =
    authorCards[0]?.episode?.location ?? ep?.location ?? null;
  const lastVisitEpisode = authorCards[0]?.episode?.title ?? ep?.title ?? null;

  const nickname = author?.nickname ?? "이 손님";
  const avatarLetter = nickname.trim().slice(0, 1) || "·";

  // ASSIST 후보 — 정적이지만 컨텍스트(카드 + 가게) 기반으로 한국어로 채워둠.
  const startCandidates = [
    `오늘 ${shopName}에 와 주신 ${nickname}님,`,
    `${nickname}님 일행이 다녀간 자리에 잠깐 더 머물렀어요.`,
    activity.body
      ? `"${truncate(activity.body as string, 26)}" 그 한 줄을 봤어요.`
      : `${nickname}님이 두고 가신 시간이 또렷이 남았어요.`,
  ];

  // 자주 등장한 단어 — 받는 사람의 카드 본문에서 1자 이상 단어 추출.
  const wordSuggestions = pickFrequentWords(
    [activity.body as string | null, ...authorCards.map((c) => c.body)].filter(
      (v): v is string => Boolean(v)
    )
  );

  const catColor = CATEGORY_COLOR[cat?.slug ?? ""] ?? "var(--ink-3)";
  const catEn = CATEGORY_EN[cat?.slug ?? ""] ?? null;

  return (
    <div
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--ui-font)",
        minHeight: "100vh",
      }}
    >
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
          }}
        >
          <Link
            href="/owner"
            style={{
              fontFamily: "var(--mono-font)",
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.1em",
              textDecoration: "none",
            }}
          >
            ← OWNER · {shopName}
          </Link>
          <span style={{ color: "var(--rule)" }}>/</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
            }}
          >
            새 편지 쓰기
          </span>
        </div>
        <Link href="/" style={{ textDecoration: "none" }}>
          <GhWordmark size={12} mono />
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr 280px",
          minHeight: "calc(100vh - 49px)",
        }}
      >
        {/* LEFT — recipient context */}
        <aside
          style={{
            borderRight: "1px solid var(--rule)",
            padding: "48px 32px",
            background: "var(--paper-2)",
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              marginBottom: 14,
            }}
          >
            TO · 받는 사람
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: "var(--mud)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--serif-font)",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {avatarLetter}
            </span>
            <div>
              <div
                className="serif"
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {nickname}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                }}
              >
                {authorJoined
                  ? `JOINED ${authorJoined.replace(". ", ".")}`
                  : "JOINED —"}
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--rule)",
              borderBottom: "1px solid var(--rule)",
              padding: "14px 0",
              marginBottom: 24,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <StatBlock label="VISITS" value={visits} unit="회" />
            <StatBlock label="CARDS" value={visits} unit="장" />
          </div>

          <div
            style={{
              fontSize: 10.5,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              marginBottom: 10,
            }}
          >
            LAST VISIT · 가장 최근 방문
          </div>
          <div
            className="serif"
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "var(--ink-2)",
              marginBottom: 24,
            }}
          >
            <strong style={{ color: "var(--ink)" }}>{lastVisitDate}</strong>
            <br />
            {lastVisitEpisode ?? "현장 방문"}
            {lastVisitLocation ? ` · ${lastVisitLocation}` : ""}
          </div>

          <div
            style={{
              fontSize: 10.5,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              marginBottom: 10,
            }}
          >
            CARD WRITTEN HERE · 이번에 쓴 카드
          </div>
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: "var(--mono-font)",
                color: catColor,
                letterSpacing: "0.12em",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {catEn ?? "—"} · No.
              {(activity.id as string).slice(-3).toUpperCase()}
            </div>
            <div
              className="serif"
              style={{
                fontSize: 12,
                lineHeight: 1.65,
                color: "var(--ink)",
              }}
            >
              {activity.body ? `"${activity.body as string}"` : "(본문 없음)"}
            </div>
          </div>
        </aside>

        {/* CENTER + RIGHT (client) */}
        <LetterComposer
          activityId={activity.id as string}
          recipientName={nickname}
          shopName={shopName}
          startCandidates={startCandidates}
          wordSuggestions={wordSuggestions}
        />
      </div>
    </div>
  );
}

function NoActivitySelected() {
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
      <div
        style={{
          fontSize: 10.5,
          fontFamily: "var(--mono-font)",
          color: "var(--ink-3)",
          letterSpacing: "0.18em",
          marginBottom: 18,
        }}
      >
        OWNER · LETTER
      </div>
      <h1
        className="serif"
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          margin: 0,
          marginBottom: 12,
        }}
      >
        편지를 보낼 카드를 먼저 골라주세요
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-3)",
          fontFamily: "var(--serif-font)",
          marginBottom: 32,
          maxWidth: 440,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.7,
        }}
      >
        가게 홈에서 받은 카드를 클릭하면 그 카드 컨텍스트로 편지가 시작돼요.
      </p>
      <Link
        href="/owner"
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
        ← 우리 가게로
      </Link>
    </div>
  );
}

function StatBlock({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 9.5,
          fontFamily: "var(--mono-font)",
          color: "var(--ink-3)",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      <div
        className="serif"
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
        <span
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            fontWeight: 400,
            marginLeft: 3,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

function pickFrequentWords(bodies: string[]): string[] {
  // 한글 2글자 이상 단어를 단순 분리. 빈도 상위 6개 반환.
  const counts = new Map<string, number>();
  const STOP = new Set([
    "그리고",
    "있어요",
    "있다",
    "있는",
    "그냥",
    "많이",
    "처음",
    "이번",
    "그때",
    "오늘",
    "내일",
  ]);
  for (const body of bodies) {
    const tokens = body
      .replace(/[\.,!?·\n\r"'()…—]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && /[가-힣]/.test(w))
      .filter((w) => !STOP.has(w));
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w);
}
