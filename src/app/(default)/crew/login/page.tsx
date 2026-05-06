import { redirect } from "next/navigation";

import {
  LegacyContainer,
  LegacyHeader,
  LegacyPage,
  LegacyPanel,
} from "@/components/legacy-v2/PageChrome";
import { getCurrentActor } from "@/lib/auth/current-actor";

import { CrewLoginForm } from "./CrewLoginForm";

export const dynamic = "force-dynamic";

export default async function CrewLoginPage() {
  const actor = await getCurrentActor();
  if (actor.role === "crew") redirect("/crew");
  if (actor.role === "admin") redirect("/admin");

  return (
    <LegacyPage>
      <LegacyContainer className="max-w-[880px]">
        <LegacyHeader
          eyebrow="Crew Login"
          title="현장 크루 로그인"
          description="현장 운영용 공용 코드로 접속해 에피소드 상태와 반응, 아카이브 흐름을 관리합니다."
        />
        <LegacyPanel className="mx-auto max-w-[540px]">
          <div className="space-y-6">
            <CrewLoginForm />
            <p className="v2-legacy-copy !text-sm">
              코드 유출이 의심되면 청풍에 바로 알려 주세요. 운영 코드는
              주기적으로 교체됩니다.
            </p>
          </div>
        </LegacyPanel>
      </LegacyContainer>
    </LegacyPage>
  );
}
