import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { UuidSchema } from "@/lib/schemas/common";
import { createAdminClient } from "@/lib/supabase/admin";

import { ShopForm } from "../ShopForm";
import { OwnerCodeSection, type OwnerRow } from "./OwnerCodeSection";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function AdminShopEditPage({ params }: Props) {
  const actor = await getCurrentActor();
  if (actor.role !== "admin") redirect("/admin/login");

  const idCheck = UuidSchema.safeParse(params.id);
  if (!idCheck.success) notFound();

  const admin = createAdminClient();

  const [shopRes, ownersRes] = await Promise.all([
    admin
      .from("shops")
      .select(
        "id, name, description, address, lat, lng, is_public, qr_token, updated_at"
      )
      .eq("id", idCheck.data)
      .maybeSingle(),
    admin
      .from("shop_owners")
      .select("id, name, created_at, last_login_at, locked_until")
      .eq("shop_id", idCheck.data)
      .order("created_at", { ascending: true }),
  ]);

  if (!shopRes.data) notFound();

  const s = shopRes.data;
  const initial = {
    id: s.id as string,
    name: s.name as string,
    description: (s.description as string | null) ?? "",
    address: (s.address as string | null) ?? "",
    lat: (s.lat as number | null) ?? null,
    lng: (s.lng as number | null) ?? null,
    is_public: Boolean(s.is_public),
    qr_token: (s.qr_token as string | null) ?? "",
  };

  const owners: OwnerRow[] = (ownersRes.data ?? []).map((o) => ({
    id: o.id as string,
    name: o.name as string,
    created_at: o.created_at as string,
    last_login_at: (o.last_login_at as string | null) ?? null,
    locked_until: (o.locked_until as string | null) ?? null,
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const entryUrl = initial.qr_token
    ? `${siteUrl}/entry/${initial.qr_token}`
    : null;
  const qrDataUrl = entryUrl
    ? await QRCode.toDataURL(entryUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 512,
      })
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/shops"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← 가게 목록
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {initial.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          가게 정보, QR, 사장님 로그인 코드를 이 화면에서 모두 관리합니다.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold">가게 정보</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          qr_token 을 바꾸면 이미 붙인 QR 이 무효가 됩니다.
        </p>
        <div className="mt-4">
          <ShopForm initial={initial} returnTo={`/admin/shops/${initial.id}`} />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold">현장 QR</h2>
        {entryUrl && qrDataUrl ? (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`${initial.name} QR`}
              className="h-40 w-40 shrink-0 rounded-lg border border-border bg-white p-2"
            />
            <div className="flex min-w-0 flex-col gap-2 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  스캔 시 이동하는 주소
                </span>
                <code className="truncate rounded-md bg-muted px-2 py-1 text-xs">
                  {entryUrl}
                </code>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <a
                  href={qrDataUrl}
                  download={`qr-${initial.qr_token}.png`}
                  className="font-medium underline underline-offset-4"
                >
                  PNG 내려받기
                </a>
                <Link
                  href={entryUrl}
                  target="_blank"
                  className="font-medium underline underline-offset-4"
                >
                  미리보기 열기
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                인쇄해서 가게에 부착하면 참여자가 스캔 시 카드 작성 화면으로
                이동합니다.
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            qr_token 이 비어 있어요. 위 폼에서 값을 저장하면 QR 이 생성됩니다.
          </p>
        )}
        {!siteUrl ? (
          <p className="mt-3 text-[11px] text-destructive">
            NEXT_PUBLIC_SITE_URL 환경변수가 비어 있어 링크가 상대 경로로
            생성됐어요. .env 에 설정해주세요.
          </p>
        ) : null}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-background p-5">
        <h2 className="text-base font-semibold">사장님 로그인 코드</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          코드는 발급 순간에만 노출됩니다. 사장님께 직접 전달 후 이 화면에서
          닫아주세요. 분실 시 재발급할 수 있어요.
        </p>
        <div className="mt-4">
          <OwnerCodeSection shopId={initial.id} owners={owners} />
        </div>
      </section>
    </main>
  );
}
