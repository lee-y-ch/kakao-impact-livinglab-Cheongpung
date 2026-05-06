import Link from "next/link";
import { redirect } from "next/navigation";

import {
  LegacyContainer,
  LegacyHeader,
  LegacyPage,
  LegacyPanel,
} from "@/components/legacy-v2/PageChrome";
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
    <LegacyPage>
      <LegacyContainer className="max-w-[1080px]">
        <LegacyHeader
          eyebrow="Admin Shops"
          title="가게 · 사장님 코드"
          description="가게를 만들면 QR이 생성되고, 사장님 이름별로 로그인 코드를 발급할 수 있습니다. 발급 코드는 한 번만 보이므로 전달 흐름을 염두에 두고 운영합니다."
          backHref="/admin"
          backLabel="← 운영 홈"
        />

        <LegacyPanel>
          <h2 className="text-base font-semibold text-v2-ink">
            새 가게 만들기
          </h2>
          <p className="mt-1 text-xs text-v2-ink3">
            저장하면 편집 화면으로 이동해 QR 과 사장님 코드를 확인합니다.
          </p>
          <div className="mt-4">
            <ShopForm />
          </div>
        </LegacyPanel>

        <section className="mt-10">
          <h2 className="text-base font-semibold text-v2-ink">
            등록된 가게 ({shops.length})
          </h2>
          {error ? (
            <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              목록을 불러오지 못했어요.
            </p>
          ) : shops.length === 0 ? (
            <p className="v2-legacy-empty mt-3">아직 등록된 가게가 없어요.</p>
          ) : (
            <ul className="v2-legacy-panel mt-3 divide-y overflow-hidden">
              {shops.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/admin/shops/${s.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-4 transition hover:bg-black/[0.02]"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-v2-ink">
                        {s.name}
                      </span>
                      <span className="truncate text-xs text-v2-ink3">
                        {s.qr_token ? `/${s.qr_token}` : "(qr_token 없음)"}
                        {s.address ? ` · ${s.address}` : ""}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span className="v2-legacy-pill">
                        {s.is_public ? "공개" : "비공개"}
                      </span>
                      <span className="text-v2-ink3">관리 →</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </LegacyContainer>
    </LegacyPage>
  );
}
