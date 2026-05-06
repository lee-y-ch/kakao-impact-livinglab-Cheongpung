import { redirect } from "next/navigation";

import {
  LegacyContainer,
  LegacyHeader,
  LegacyPage,
  LegacyPanel,
} from "@/components/legacy-v2/PageChrome";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { DevLoginButton } from "./DevLoginButton";
import { KakaoLoginButton } from "./KakaoLoginButton";

type SearchParams = {
  next?: string;
  error?: string;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await getCurrentActor();
  const next = sanitizeNext(searchParams.next);

  // 이미 로그인된 참여자 / 관리자 / 사장님은 로그인 페이지 재진입 차단
  if (actor.role === "participant") redirect(next ?? "/collection");
  if (actor.role === "admin") redirect("/admin");
  if (actor.role === "owner") redirect("/owner");

  return (
    <LegacyPage>
      <LegacyContainer className="max-w-[880px]">
        <LegacyHeader
          eyebrow="Participant Login"
          title={
            <>
              오늘의 환대를
              <br />
              <span className="serif">내 도감으로</span> 남깁니다
            </>
          }
          description="카카오 계정으로 로그인하면 카드 작성, 내 도감, 공개 여부 관리가 한 흐름으로 이어집니다."
        />
        <LegacyPanel className="mx-auto max-w-[540px]">
          <div className="space-y-6">
            {searchParams.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                로그인 중 문제가 발생했습니다. 다시 시도해 주세요.
              </p>
            ) : null}

            <KakaoLoginButton next={next} />

            {process.env.NODE_ENV !== "production" ? (
              <DevLoginButton next={next} />
            ) : null}

            <p className="v2-legacy-copy text-center !text-sm">
              로그인 시 닉네임과 프로필 이미지가 도감 표시에 사용됩니다. 공개
              범위는 카드마다 따로 선택할 수 있습니다.
            </p>
          </div>
        </LegacyPanel>
      </LegacyContainer>
    </LegacyPage>
  );
}

/** `next` 파라미터는 내부 경로만 허용. 외부 URL 로의 open redirect 방지. */
function sanitizeNext(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;
  return value;
}
