import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  LegacyContainer,
  LegacyHeader,
  LegacyPage,
  LegacyPanel,
  LegacyStatRow,
} from "@/components/legacy-v2/PageChrome";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * 참여자 프로필 — 닉네임·프로필 이미지·누적 요약·로그아웃.
 * 닉네임/프로필 이미지 편집은 Phase 7 로.
 */
export default async function MePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "participant") redirect("/login?next=/me");

  const supabase = createServerSupabase();
  const { count } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("user_id", actor.userId)
    .is("removed_at", null);

  return (
    <LegacyPage>
      <LegacyContainer className="max-w-[960px]">
        <LegacyHeader
          eyebrow="My Profile"
          title={actor.nickname ?? "강화 여행자"}
          description="참여자의 기본 프로필과 도감 진입, 계정 상태를 한 화면에서 확인합니다."
        />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <LegacyPanel className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[var(--paper-3)]">
                {actor.profileImageUrl ? (
                  <Image
                    src={actor.profileImageUrl}
                    alt={actor.nickname ?? "프로필"}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-v2-ink3">
                    {(actor.nickname ?? "?").slice(0, 1)}
                  </div>
                )}
              </div>
              <div>
                <p className="v2-legacy-kicker mb-2">Participant</p>
                <p className="text-xl font-semibold tracking-[-0.03em] text-v2-ink">
                  {actor.nickname ?? "강화 여행자"}
                </p>
                <p className="mt-1 text-sm text-v2-ink3">
                  카카오 계정으로 로그인되어 있습니다.
                </p>
              </div>
            </div>
            <LegacyStatRow
              items={[
                {
                  label: "누적 카드",
                  value: (
                    <>
                      {count ?? 0}
                      <span className="ml-1 text-base font-normal text-v2-ink3">
                        장
                      </span>
                    </>
                  ),
                },
              ]}
            />
            <div className="flex flex-wrap gap-3">
              <Link href="/collection" className="v2-legacy-button">
                내 도감 보기
              </Link>
            </div>
          </LegacyPanel>

          <LegacyPanel className="flex flex-col gap-4">
            <p className="v2-legacy-kicker">Account</p>
            <p className="v2-legacy-copy !text-sm">
              로그아웃하면 다시 카카오 로그인이 필요합니다.
            </p>
            <div className="self-start">
              <LogoutButton actorRole="participant" />
            </div>
          </LegacyPanel>
        </div>
      </LegacyContainer>
    </LegacyPage>
  );
}
