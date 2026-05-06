"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  activityId: string;
  /** 신고 플래그가 켜져있는지 — true 면 승인 클릭 시 신고 해제까지 같이 처리 */
  reported: boolean;
};

/**
 * /admin 운영 홈 검수 큐 행의 승인 / 반려 버튼.
 *
 * - 승인 = `dismiss_report` (신고가 있으면 해제, 공개 유지). 신고 없는 카드는
 *   API 호출 자체가 no-op 이지만 호출 후 router.refresh 로 큐 갱신.
 * - 반려 = `unpublish` (is_public=false 로 내림). 큐에서 빠짐.
 *
 * 진짜 "검수 완료" 마킹은 schema 에 `moderation_status` 가 없어서 이번 단계에선
 * 표현 못 함. 추후 컬럼 추가 시 승인 의미가 더 또렷해진다.
 */
export function AdminReviewActions({ activityId, reported }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function moderate(action: "dismiss_report" | "unpublish") {
    if (busy || pending) return;
    if (
      action === "unpublish" &&
      !window.confirm("이 카드를 비공개로 내릴까요?")
    ) {
      return;
    }
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/admin/activities/${activityId}/moderate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message =
        (payload && typeof payload.message === "string" && payload.message) ||
        "처리에 실패했어요.";
      setError(message);
      setBusy(false);
      return;
    }

    setBusy(false);
    startTransition(() => router.refresh());
  }

  const disabled = busy || pending;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => moderate("dismiss_report")}
          disabled={disabled}
          className="flex-1 rounded-md border border-[rgba(107,175,138,0.25)] bg-[rgba(107,175,138,0.1)] py-1.5 text-[12px] font-medium text-[#3A7A55] transition-colors hover:bg-[rgba(107,175,138,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {reported ? "신고 해제" : "승인"}
        </button>
        <button
          type="button"
          onClick={() => moderate("unpublish")}
          disabled={disabled}
          className="flex-1 rounded-md border border-[rgba(224,85,85,0.2)] bg-[rgba(224,85,85,0.07)] py-1.5 text-[12px] font-medium text-[#C04040] transition-colors hover:bg-[rgba(224,85,85,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          반려 · 비공개
        </button>
      </div>
      {error ? (
        <p className="text-[10.5px] font-light text-rose-500">{error}</p>
      ) : null}
    </div>
  );
}
