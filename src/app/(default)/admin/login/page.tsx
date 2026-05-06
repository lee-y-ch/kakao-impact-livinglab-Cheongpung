import { redirect } from "next/navigation";

import {
  LegacyContainer,
  LegacyHeader,
  LegacyPage,
  LegacyPanel,
} from "@/components/legacy-v2/PageChrome";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const actor = await getCurrentActor();
  if (actor.role === "admin") redirect("/admin");

  return (
    <LegacyPage>
      <LegacyContainer className="max-w-[880px]">
        <LegacyHeader
          eyebrow="Admin Login"
          title="청풍 관리자 로그인"
          description="운영 대시보드와 검수, 신고, 가게·프로젝트 관리 화면은 관리자 계정으로만 접근합니다."
        />
        <LegacyPanel className="mx-auto max-w-[540px]">
          <AdminLoginForm />
        </LegacyPanel>
      </LegacyContainer>
    </LegacyPage>
  );
}
