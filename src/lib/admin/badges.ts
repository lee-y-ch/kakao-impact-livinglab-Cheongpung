import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin sidebar 뱃지에 들어가는 카운트.
 *
 * - reviewBadge: 공개 중인 카드 (검수 큐의 기본 시야)
 * - reportedBadge: 신고된 카드 중 아직 가려지지 않은 건
 *
 * 서브페이지에서도 sidebar 뱃지를 표시하려면 각 페이지 SSR 시점에 한 번 호출.
 */
export async function fetchAdminSidebarBadges(): Promise<{
  reviewBadge: number;
  reportedBadge: number;
}> {
  const admin = createAdminClient();
  const [publicCountRes, reportedCountRes] = await Promise.all([
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
  ]);

  return {
    reviewBadge: publicCountRes.count ?? 0,
    reportedBadge: reportedCountRes.count ?? 0,
  };
}
