import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";

export const dynamic = "force-dynamic";

/**
 * /crew — 크루 대시보드 (Phase 3-f : 자리 표시 단계).
 *
 * 실제 에피소드 status 업데이트 / 리액션 생성 / 아카이브 등록은 Phase 3-g 에 붙는다.
 * 지금은 로그인 플로우가 끝나는 지점 역할만 한다.
 */
export default async function CrewHomePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "crew") redirect("/crew/login");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          크루
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          크루 대시보드
        </h1>
        <p className="text-sm text-muted-foreground">
          공용 코드로 로그인했습니다. 세션 ID ·{" "}
          {actor.crewSessionId.slice(0, 8)}…
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-border bg-background p-5 text-sm">
        <h2 className="text-sm font-semibold">곧 열릴 기능</h2>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
          <li>진행 중 에피소드 확인 · status 업데이트 (예정 → 진행 → 완료)</li>
          <li>최근 참여자 카드에 응원(hi-five) · 현장 메모 남기기</li>
          <li>아카이브 링크 · 결과물 업로드</li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground/80">
          Phase 3-g 에서 이 자리에 실제 도구가 들어옵니다. 우선 로그인 흐름을
          안정화한 상태입니다.
        </p>
      </section>
    </main>
  );
}
