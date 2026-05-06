import { redirect } from "next/navigation";

import {
  LegacyContainer,
  LegacyHeader,
  LegacyPage,
  LegacyPanel,
} from "@/components/legacy-v2/PageChrome";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { OwnerLoginForm } from "./OwnerLoginForm";

export default async function OwnerLoginPage() {
  const actor = await getCurrentActor();
  if (actor.role === "owner") redirect("/owner");
  if (actor.role === "admin") redirect("/admin");

  return (
    <LegacyPage>
      <LegacyContainer className="max-w-[880px]">
        <LegacyHeader
          eyebrow="Owner Login"
          title="가게 사장님 로그인"
          description="관리자가 발급한 가게 주소와 8자리 코드로 접속합니다. 발급된 코드는 사장님 전용 홈과 편지 작성 화면으로 이어집니다."
        />
        <LegacyPanel className="mx-auto max-w-[540px]">
          <div className="space-y-6">
            <OwnerLoginForm />
            <p className="v2-legacy-copy !text-sm">
              코드를 잊으셨다면 청풍에 재발급을 요청해 주세요. 5회 연속 오입력
              시 1시간 동안 잠깁니다.
            </p>
          </div>
        </LegacyPanel>
      </LegacyContainer>
    </LegacyPage>
  );
}
