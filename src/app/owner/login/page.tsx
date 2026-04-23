import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { OwnerLoginForm } from "./OwnerLoginForm";

export default async function OwnerLoginPage() {
  const actor = await getCurrentActor();
  if (actor.role === "owner") redirect("/owner");
  if (actor.role === "admin") redirect("/admin");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          가게 사장님 로그인
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          가게 코드는 관리자(청풍)가 발급한 8자리 코드를 사용합니다.
          <br />
          가게 고유 주소(영문/숫자)와 함께 입력해 주세요.
        </p>
      </div>

      <OwnerLoginForm />

      <p className="text-xs text-muted-foreground/70">
        코드를 잊으셨다면 청풍에 재발급 요청해 주세요. 5회 연속 오입력 시 1시간
        잠금됩니다.
      </p>
    </main>
  );
}
