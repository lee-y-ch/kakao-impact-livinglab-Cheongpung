import { redirect } from "next/navigation";

import {
  AdminPageHeader,
  AdminPanel,
  AdminShell,
} from "@/components/admin/AdminShell";
import { fetchAdminSidebarBadges } from "@/lib/admin/badges";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { SiteHeroForm, type HeroInitial } from "./SiteHeroForm";

export const dynamic = "force-dynamic";

/**
 * /admin/site — 메인 화면(hero) 직접 편집.
 *
 * 청풍 피드백: "첫 배너 사진/문구를 직접 수정하고 싶어요."
 * site_settings.key='hero' 행을 읽어 폼 초기값으로 채우고, 저장은
 * POST /api/admin/site 로. 마이그레이션 전이면 hardcoded 기본값으로 fallback.
 */

const HERO_DEFAULT: HeroInitial = {
  hero_eyebrow: "Ganghwa Universe · 2026",
  hero_title: "환대로\n만들어가는 세계",
  hero_accent: "세계",
  hero_subtitle: "우리가 살고 싶은 세계를\n강화에서 함께 실험해요.",
  hero_image_url: "/v2/landing/hero-bg.png",
};

export default async function AdminSitePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  const admin = createAdminClient();

  const [{ data: heroRow }, badges] = await Promise.all([
    admin
      .from("site_settings")
      .select(
        "hero_eyebrow, hero_title, hero_accent, hero_subtitle, hero_image_url"
      )
      .eq("key", "hero")
      .maybeSingle(),
    fetchAdminSidebarBadges(),
  ]);

  const initial: HeroInitial = {
    hero_eyebrow: heroRow?.hero_eyebrow ?? HERO_DEFAULT.hero_eyebrow,
    hero_title: heroRow?.hero_title ?? HERO_DEFAULT.hero_title,
    hero_accent: heroRow?.hero_accent ?? HERO_DEFAULT.hero_accent,
    hero_subtitle: heroRow?.hero_subtitle ?? HERO_DEFAULT.hero_subtitle,
    hero_image_url: heroRow?.hero_image_url ?? HERO_DEFAULT.hero_image_url,
  };

  return (
    <AdminShell
      active="site"
      reviewBadge={badges.reviewBadge}
      reportedBadge={badges.reportedBadge}
      topbarTitle="사이트 설정"
    >
      <AdminPageHeader
        eyebrow="Admin Site"
        title="메인 화면 편집"
        description="홈페이지 첫 배너(hero)의 문구와 배경 이미지를 직접 수정합니다. 저장하면 메인 화면에 바로 반영돼요."
        backHref="/admin"
        backLabel="← 운영 홈"
      />

      <AdminPanel>
        <SiteHeroForm initial={initial} />
      </AdminPanel>
    </AdminShell>
  );
}
