import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";

/**
 * 루트 경로 분기.
 * - 참여자  : /collection
 * - 크루    : /crew  (Phase 3 에 실제 페이지 등장. 그 전엔 /login)
 * - 사장님  : /owner
 * - 관리자  : /admin
 * - 비로그인: 공개 랜딩 (여기 남음)
 */
export default async function HomePage() {
  const actor = await getCurrentActor();

  if (actor.role === "participant") redirect("/collection");
  if (actor.role === "owner") redirect("/owner");
  if (actor.role === "admin") redirect("/admin");
  if (actor.role === "crew") redirect("/crew");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <section className="flex flex-col items-center gap-5 text-center">
        <p className="text-xs font-medium tracking-wider text-muted-foreground">
          카카오임팩트 × 협동조합 청풍
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          오늘도 강화도가
          <br />
          조금씩 더 강화됩니다
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          참여자·크루·사장님의 환대 행위가 쌓여 강화의 서사가 되는 관계
          대시보드입니다. 환대로 만들어가는 세계, 강화유니버스.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/impact"
            className="rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            강화의 진척 보기
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground transition hover:border-foreground"
          >
            참여자로 로그인
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <HomeFeature
          title="참여자 카드"
          body="오프라인에서 시작된 환대 순간이 카드 한 장으로 남습니다. 같은 자리에 여러 번 와도 카드는 여러 장, 뒷면이 두꺼워집니다."
        />
        <HomeFeature
          title="강화의 진척"
          body="참여자 카드와 크루의 기록이 4개 카테고리로 집계되어 '강화도가 얼마나 강화됐는가'를 누구나 볼 수 있습니다."
        />
        <HomeFeature
          title="편지와 응원"
          body="시간을 건너 도착하는 편지. 가게 사장님의 안부와 크루의 하이파이브가 카드 뒷면을 완성합니다."
        />
      </section>

      <p className="text-center text-xs text-muted-foreground/70">
        Phase 1 · 인증 · 카카오 로그인 / 사장님 코드 / 관리자 Supabase Auth
      </p>
    </main>
  );
}

function HomeFeature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
