import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { createAdminClient } from "@/lib/supabase/admin";

import { OwnerSettingsForm } from "./OwnerSettingsForm";

export const dynamic = "force-dynamic";

export default async function OwnerSettingsPage() {
  const actor = await getCurrentActor();
  if (actor.role !== "owner") redirect("/owner/login?next=/owner/settings");

  const admin = createAdminClient();
  const { data: shop } = await admin
    .from("shops")
    .select("name, description, address, slogan, qr_token, is_public")
    .eq("id", actor.shopId)
    .maybeSingle();

  const shopName = (shop?.name as string | undefined) ?? "우리 가게";
  const qrToken = (shop?.qr_token as string | null) ?? null;

  return (
    <main className="min-h-screen bg-[var(--paper-2)] px-5 py-8 text-v2-ink sm:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/owner"
            className="font-mono text-xs uppercase tracking-[0.14em] text-v2-ink3"
          >
            ← OWNER
          </Link>
          <Link
            href="/impact"
            className="font-mono text-xs uppercase tracking-[0.14em] text-v2-ink3"
          >
            공개 임팩트
          </Link>
        </div>

        <header className="border-b border-[var(--rule)] pb-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-v2-ink3">
            OWNER SETTINGS
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
            {shopName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-v2-ink2">
            사장님이 직접 바꿀 수 있는 최소 설정입니다. 가게 소개와 QR 정보는
            관리자 화면에서 수정합니다.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <Info
            label="가게 주소"
            value={(shop?.address as string | null) ?? "-"}
          />
          <Info label="QR token" value={qrToken ?? "-"} mono />
          <Info
            label="한 줄 문장"
            value={(shop?.slogan as string | null) ?? "-"}
          />
          <Info
            label="소개"
            value={(shop?.description as string | null) ?? "-"}
          />
        </section>

        <OwnerSettingsForm initialIsPublic={Boolean(shop?.is_public)} />
      </div>
    </main>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-v2-ink3">
        {label}
      </div>
      <div
        className={[
          "mt-2 text-sm leading-6 text-v2-ink",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
