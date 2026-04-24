import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";

export default async function AdminHomePage() {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        청풍 운영 홈
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{actor.email}</p>

      <nav className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AdminNavLink
          href="/admin/projects"
          title="프로젝트 · 에피소드"
          description="카테고리별 장기 프로젝트와 진척도 기준을 설정합니다."
          ready
        />
        <AdminNavLink
          href="/admin/shops"
          title="가게 · 사장님 코드"
          description="가게 등록, QR 발급, 사장님 로그인 코드를 관리합니다."
          ready
        />
        <AdminNavLink
          href="#"
          title="공개 검수 큐"
          description="is_public=true 요청 카드를 승인/반려합니다. (준비 중)"
        />
        <AdminNavLink
          href="#"
          title="신고 대응"
          description="신고된 카드·편지를 검토합니다. (준비 중)"
        />
      </nav>
    </main>
  );
}

function AdminNavLink({
  href,
  title,
  description,
  ready = false,
}: {
  href: string;
  title: string;
  description: string;
  ready?: boolean;
}) {
  const common =
    "flex flex-col gap-1 rounded-xl border border-border bg-background p-4 transition";
  if (!ready) {
    return (
      <div className={`${common} cursor-not-allowed opacity-60`}>
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    );
  }
  return (
    <Link href={href} className={`${common} hover:bg-muted/60`}>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </Link>
  );
}
