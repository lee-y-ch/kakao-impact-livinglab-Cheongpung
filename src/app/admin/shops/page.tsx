import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { ShopForm } from "./ShopForm";

export const dynamic = "force-dynamic";

/**
 * /admin/shops — 관리자 가게 관리.
 *
 * 상단: 새 가게 생성 폼 (qr_token 자동/수동).
 * 하단: 기존 가게 목록 — 클릭 시 /admin/shops/[id] 편집 + QR + 사장님 코드 관리.
 */
export default async function AdminShopsPage() {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("shops")
    .select("id, name, qr_token, is_public, address, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const shops =
    (rows ?? []).map((s) => ({
      id: s.id as string,
      name: s.name as string,
      qr_token: (s.qr_token as string | null) ?? null,
      is_public: Boolean(s.is_public),
      address: (s.address as string | null) ?? null,
    })) ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          관리자 · 가게
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          가게 · 사장님 코드
        </h1>
        <p className="text-sm text-muted-foreground">
          가게를 만들면 QR 이 생성되고, 사장님 이름별로 8자리 로그인 코드를
          발급할 수 있어요. 코드는 발급 순간에만 보이니 꼭 안전한 곳에 전달해
          주세요.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold">새 가게 만들기</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          저장하면 편집 화면으로 이동해 QR 과 사장님 코드를 확인합니다.
        </p>
        <div className="mt-4">
          <ShopForm />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-base font-semibold">
          등록된 가게 ({shops.length})
        </h2>
        {error ? (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            목록을 불러오지 못했어요.
          </p>
        ) : shops.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            아직 등록된 가게가 없어요.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
            {shops.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/shops/${s.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-muted/50"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {s.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {s.qr_token ? `/${s.qr_token}` : "(qr_token 없음)"}
                      {s.address ? ` · ${s.address}` : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span
                      className={
                        s.is_public
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700"
                          : "rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
                      }
                    >
                      {s.is_public ? "공개" : "비공개"}
                    </span>
                    <span className="text-muted-foreground">관리 →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
