"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  activityId: string;
  isPublic: boolean;
  faceConsent: boolean;
};

/**
 * 카드 상세의 공개 토글 / 삭제 버튼.
 * PATCH/DELETE /api/activities/[id] 엔드포인트는 살아있음.
 */
export function CardActionsClient({
  activityId,
  isPublic,
  faceConsent,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleVisibility() {
    if (busy || pending) return;
    setBusy(true);
    setError(null);

    const next = !isPublic;
    const res = await fetch(`/api/activities/${activityId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_public: next }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message =
        (payload && typeof payload.message === "string" && payload.message) ||
        "공개 설정 변경에 실패했어요.";
      setError(message);
      setBusy(false);
      return;
    }

    setBusy(false);
    startTransition(() => router.refresh());
  }

  async function softDelete() {
    if (busy || pending) return;
    if (
      !window.confirm("이 카드를 도감에서 가릴까요? 공개 영역에서도 사라져요.")
    ) {
      return;
    }
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/activities/${activityId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message =
        (payload && typeof payload.message === "string" && payload.message) ||
        "삭제 처리에 실패했어요.";
      setError(message);
      setBusy(false);
      return;
    }

    setBusy(false);
    router.replace("/collection");
    router.refresh();
  }

  const togglingTo = isPublic ? "비공개로" : "공개로";
  const togglingHint =
    !isPublic && !faceConsent
      ? "사람이 함께 나온 사진은 동의를 받은 뒤에만 공개할 수 있어요."
      : null;

  return (
    <div className="mb-9 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || pending}
          onClick={toggleVisibility}
          className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-v2-rule bg-transparent px-[22px] py-2.5 text-[12.5px] font-medium text-v2-ink3 transition-colors hover:border-v2-ink hover:text-v2-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "처리 중…" : isPublic ? "비공개로 전환" : "공개로 전환"}
        </button>
        <button
          type="button"
          disabled={busy || pending}
          onClick={softDelete}
          className="inline-flex items-center gap-1.5 rounded-full px-[18px] py-2.5 text-[12.5px] font-medium text-v2-ink4 transition-colors hover:text-v2-ink3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          삭제 처리
        </button>
      </div>
      {(error || togglingHint) && (
        <p
          className={`text-[11.5px] font-light leading-[1.6] ${
            error ? "text-rose-600" : "text-v2-ink3"
          }`}
        >
          {error ??
            `${togglingHint} (먼저 ${togglingTo} 바꾸려면 face_consent 필요)`}
        </p>
      )}
    </div>
  );
}
