"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InitialValues = {
  id?: string;
  name?: string;
  description?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_public?: boolean;
  qr_token?: string;
};

type Props = {
  initial?: InitialValues;
  returnTo?: string;
};

/**
 * 관리자 가게 생성/수정 폼.
 *
 * qr_token 은 비워두면 서버에서 랜덤 생성. 기존 가게 편집 시에는 수정 가능
 * (URL 이 바뀌므로 이미 붙인 QR 스티커는 무효가 됨 — 경고 문구 표시).
 */
export function ShopForm({ initial, returnTo }: Props) {
  const router = useRouter();
  const editing = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [lat, setLat] = useState<string>(
    initial?.lat === null || initial?.lat === undefined
      ? ""
      : String(initial.lat)
  );
  const [lng, setLng] = useState<string>(
    initial?.lng === null || initial?.lng === undefined
      ? ""
      : String(initial.lng)
  );
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? true);
  const [qrToken, setQrToken] = useState(initial?.qr_token ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      is_public: isPublic,
    };
    if (lat !== "") payload.lat = Number(lat);
    else if (editing) payload.lat = null;
    if (lng !== "") payload.lng = Number(lng);
    else if (editing) payload.lng = null;
    if (qrToken.trim() !== "") payload.qr_token = qrToken.trim();

    const endpoint = editing
      ? `/api/admin/shops/${initial?.id}`
      : "/api/admin/shops";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errPayload = await res.json().catch(() => null);
      setError(
        (errPayload &&
          typeof errPayload.message === "string" &&
          errPayload.message) ||
          "저장에 실패했어요."
      );
      setSubmitting(false);
      return;
    }

    const resJson = (await res.json().catch(() => null)) as {
      id?: string;
    } | null;
    const goto = editing
      ? (returnTo ?? "/admin/shops")
      : resJson?.id
        ? `/admin/shops/${resJson.id}`
        : "/admin/shops";
    router.replace(goto);
    router.refresh();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (
      !window.confirm(
        "이 가게를 삭제할까요? 사장님 계정도 함께 사라지며, 기존 카드의 가게 연결은 해제됩니다."
      )
    )
      return;
    setSubmitting(true);
    const res = await fetch(`/api/admin/shops/${initial.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("삭제에 실패했어요.");
      setSubmitting(false);
      return;
    }
    router.replace("/admin/shops");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <LabeledField label="가게 이름">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </LabeledField>

      <LabeledField label="소개 (선택)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </LabeledField>

      <LabeledField label="주소 (선택)">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="인천 강화군 ..."
          className={inputClass}
        />
      </LabeledField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LabeledField label="위도 (선택)">
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className={inputClass}
          />
        </LabeledField>
        <LabeledField label="경도 (선택)">
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className={inputClass}
          />
        </LabeledField>
      </div>

      <LabeledField label="qr_token (비우면 자동 생성)">
        <input
          value={qrToken}
          onChange={(e) => setQrToken(e.target.value.toLowerCase())}
          placeholder="hospitality-cafe-01"
          className={inputClass}
        />
      </LabeledField>
      {editing ? (
        <p className="-mt-2 text-[11px] text-muted-foreground">
          qr_token 을 바꾸면 이미 붙인 QR 스티커가 무효가 됩니다. 기존 QR 은
          아래에서 다시 내려받아 재부착해주세요.
        </p>
      ) : null}

      <LabeledField label="공개 여부">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          공개 페이지에 노출
        </label>
      </LabeledField>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "저장 중..." : editing ? "수정 저장" : "가게 만들기"}
        </button>
        {editing ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="text-xs font-medium text-destructive underline underline-offset-4"
          >
            이 가게 삭제
          </button>
        ) : null}
      </div>
    </form>
  );
}

const inputClass =
  "rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring w-full";

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
