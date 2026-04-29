import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GhWordmark } from "@/components/claude/primitives";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

import { EntryForm } from "./EntryForm";

export const dynamic = "force-dynamic";

/**
 * /entry/[qr_token] — Claude editorial 톤의 카드 작성.
 *
 * 출처: Claude artifact pages/EntryDesktop.jsx (2026-04-29).
 * 시각: 시안 그대로 (breadcrumb · 1fr/1fr split · 좌 라이브 프리뷰 · 우 폼)
 * 기능: 기존 ActivityForm 의 사진/메모/face_consent/is_public/idempotency
 *      흐름 그대로 EntryForm 으로 이전.
 *
 * 시안의 CATEGORY 4-button / WITH companions 는 schema 부재로 제외.
 * 카테고리는 가게가 가장 최근 참여한 프로젝트의 카테고리를 가져와 프리뷰
 * 색상으로만 사용 (mock 이라도 시안의 색감 살리기 위해).
 */

type Params = { qr_token: string };

export default async function EntryPage({ params }: { params: Params }) {
  const qrToken = decodeURIComponent(params.qr_token);
  const supabase = createServerSupabase();
  const admin = createAdminClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, is_public")
    .eq("qr_token", qrToken)
    .maybeSingle();

  if (!shop) notFound();

  const actor = await getCurrentActor();

  if (actor.role === "anonymous") {
    redirect(`/login?next=${encodeURIComponent(`/entry/${params.qr_token}`)}`);
  }

  if (actor.role !== "participant") {
    return <ParticipantOnlyView shopName={shop.name as string} />;
  }

  // 카테고리 derive: 이 가게에서 가장 최근 활동의 프로젝트 카테고리
  const { data: hint } = await admin
    .from("activities")
    .select(
      "id, project:project_id (id, category_id, category:category_id (id, slug, name))"
    )
    .eq("shop_id", shop.id as string)
    .not("project_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cat =
    (
      hint?.project as {
        category: { slug: string; name: string } | null;
      } | null
    )?.category ?? null;

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
          <span
            style={{
              fontFamily: "var(--mono-font)",
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.1em",
            }}
          >
            QR · {qrToken} · {shop.name as string}
          </span>
          <span style={{ color: "var(--rule)" }}>/</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
            }}
          >
            NEW CARD
          </span>
        </div>
        <Link href="/" style={{ textDecoration: "none" }}>
          <GhWordmark size={12} mono />
        </Link>
      </div>

      <EntryForm
        context={{
          shopId: shop.id as string,
          label: shop.name as string,
          categorySlug: cat?.slug ?? null,
          categoryName: cat?.name ?? null,
        }}
      />
    </div>
  );
}

function ParticipantOnlyView({ shopName }: { shopName: string }) {
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
        PARTICIPANT ONLY
      </div>
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
        {shopName} — 카드 발급은 참여자 계정에서만
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-3)",
          fontFamily: "var(--serif-font)",
          marginBottom: 32,
          maxWidth: 480,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.7,
        }}
      >
        지금은 사장님·크루·운영 계정으로 들어와 있어요. 카카오 계정으로 로그인한
        뒤 같은 QR 을 다시 찍어주세요.
      </p>
      <Link
        href="/"
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
        ← 홈으로
      </Link>
    </div>
  );
}
