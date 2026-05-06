import { notFound, redirect } from "next/navigation";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

import { EntryFormClient } from "./EntryFormClient";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/entry/[qr_token]` 카드 작성.
 * 시안: design-v2-reference/강화유니버스_카드작성.html.
 *
 * QR 토큰으로 shops 단건 조회 → 비로그인이면 /login?next= 로 redirect →
 * 참여자 본인 명의로 카드 발급 (POST /api/activities, multipart).
 *
 * 시안 markup·디자인 토큰을 최대한 유지하지만 데이터 모델에 맞춰 정리:
 *   - 카테고리 picker / 장소 자유입력 / 함께한 사람 태그는 schema 미지원 → 제거
 *   - QR 으로 결정된 가게는 readonly chip 으로 노출
 *   - CLAUDE.md 스펙 그대로 사진 + 메모 + face_consent + is_public 4종 입력만
 */

export default async function EntryPage({
  params,
}: {
  params: { qr_token: string };
}) {
  const qrToken = params.qr_token;
  if (!qrToken || qrToken.length < 4 || qrToken.length > 64) {
    notFound();
  }

  const actor = await getCurrentActor();
  if (actor.role !== "participant") {
    redirect(`/login?next=/entry/${encodeURIComponent(qrToken)}`);
  }

  const supabase = createServerSupabase();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, address, theme_color, slogan, is_public")
    .eq("qr_token", qrToken)
    .maybeSingle();

  if (!shop || shop.is_public === false) {
    notFound();
  }

  return (
    <>
      <Breadcrumb shopName={shop.name} />
      <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-8 lg:px-[60px]">
        <EntryFormClient
          shopId={shop.id}
          shopName={shop.name}
          shopAddress={shop.address}
          themeColor={shop.theme_color}
          qrTokenPreview={qrToken.slice(0, 6)}
          nicknameInitial={(actor.nickname ?? "여").slice(0, 1)}
          nickname={actor.nickname ?? "강화 여행자"}
        />
      </div>
      <NoticeStrip />
    </>
  );
}

function Breadcrumb({ shopName }: { shopName: string }) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-[112px] lg:px-[60px]">
      <AnimateOnScroll>
        <div className="flex items-center gap-2 text-[12px] text-[#AEAEB2]">
          <span className="transition-colors">{shopName}</span>
          <span className="text-[#D0D0D0]">/</span>
          <strong className="font-medium text-v2-ink3">카드 작성</strong>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

function NoticeStrip() {
  return (
    <div
      className="flex items-center justify-center px-6 py-5 lg:px-[60px]"
      style={{ background: "#1A1A1A" }}
    >
      <p className="text-center text-[12px] leading-[1.7] tracking-[0.5px] text-white/50">
        <strong className="font-medium text-white/80">
          카드는 기본 비공개입니다.
        </strong>
        &nbsp;공개로 설정한 카드만 피드에 노출됩니다.
      </p>
    </div>
  );
}
