import { redirect } from "next/navigation";

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          강화유니버스에 어서오세요
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          카카오 계정으로 로그인하면 오늘 남긴 환대의 흔적이 카드로 쌓입니다.
        </p>
      </div>

      {searchParams.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          로그인 중 문제가 발생했습니다. 다시 시도해 주세요.
        </p>
      ) : null}

      <KakaoLoginButton next={next} />

      {process.env.NODE_ENV !== "production" ? (
        <DevLoginButton next={next} />
      ) : null}

      <p className="text-center text-xs text-muted-foreground/70">
        로그인 시 닉네임·프로필 사진이 도감 표시에 사용됩니다.
        <br />
        공개 범위는 카드별로 직접 선택합니다.
      </p>
    </main>
  );
}

/** `next` 파라미터는 내부 경로만 허용. 외부 URL 로의 open redirect 방지. */
function sanitizeNext(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;
  return value;
}
