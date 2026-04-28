import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";

export default async function OwnerHomePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "owner") redirect("/owner/login");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        우리 가게
      </h1>
      <p className="mt-6 rounded-md border border-border bg-background p-5 text-sm text-muted-foreground">
        Phase 4 에서 가게에 연결된 카드와 편지 작성이 이 자리에 들어옵니다.
        지금은 로그인 흐름만 확인할 수 있는 자리 표시 화면이에요.
      </p>
    </main>
  );
}
