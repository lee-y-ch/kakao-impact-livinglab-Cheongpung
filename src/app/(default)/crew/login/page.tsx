import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";

import { CrewLoginForm } from "./CrewLoginForm";

export const dynamic = "force-dynamic";

export default async function CrewLoginPage() {
  const actor = await getCurrentActor();
  if (actor.role === "crew") redirect("/crew");
  if (actor.role === "admin") redirect("/admin");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          크루 로그인
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          강화 현장 운영을 함께하는 크루용 공용 코드를 입력해 주세요. 코드는
          청풍이 현장에서 전달합니다.
        </p>
      </div>

      <CrewLoginForm />

      <p className="text-xs text-muted-foreground/70">
        코드가 유출되었다고 판단되면 청풍에 알려 주세요. 코드는 주기적으로
        교체됩니다.
      </p>
    </main>
  );
}
