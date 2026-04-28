"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * 본인 카드 상세에서 쓰는 액션 묶음.
 *   - 공개 토글 (is_public)
 *   - 삭제 요청 (soft — removed_at)
 *
 * 낙관적 업데이트는 안 씀. 서버 응답 받고 router.refresh() 로 RSC 리렌더.
 */
type Props = {
  activityId: string;
  initialIsPublic: boolean;
  /** face_consent=false 인 카드는 공개 토글 자체를 막음 */
  faceConsentGranted: boolean;
};

export function CardActions({
  activityId,
  initialIsPublic,
  faceConsentGranted,
}: Props) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function togglePublic(next: boolean) {
    if (pending) return;
    if (next && !faceConsentGranted) {
      setError("초상권 동의가 없는 카드는 공개할 수 없어요.");
      return;
    }
    setError(null);

    const res = await fetch(`/api/activities/${activityId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_public: next }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(
        (payload && typeof payload.message === "string" && payload.message) ||
          "공개 상태를 바꾸지 못했어요."
      );
      return;
    }
    setIsPublic(next);
    startTransition(() => router.refresh());
  }

  async function requestDelete() {
    if (pending) return;
    const confirmed = window.confirm(
      "이 카드를 삭제 요청할까요? 공개 영역에서는 즉시 사라지고, 저장된 사진은 운영 정리 때 함께 제거돼요."
    );
    if (!confirmed) return;
    setError(null);

    const res = await fetch(`/api/activities/${activityId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(
        (payload && typeof payload.message === "string" && payload.message) ||
          "삭제 요청을 처리하지 못했어요."
      );
      return;
    }

    router.replace("/collection");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">공개 상태</span>
          <span className="text-xs text-muted-foreground">
            {isPublic
              ? "공개 피드·가게 페이지에 노출됩니다."
              : "내 도감에만 남습니다."}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          disabled={pending}
          onClick={() => togglePublic(!isPublic)}
          className={
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition " +
            (isPublic ? "bg-emerald-500" : "bg-muted")
          }
        >
          <span
            className={
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition " +
              (isPublic ? "translate-x-5" : "translate-x-0.5")
            }
          />
        </button>
      </div>

      {!faceConsentGranted ? (
        <p className="text-[11px] text-muted-foreground">
          이 카드는 초상권 동의 체크 없이 저장돼서 공개할 수 없어요. 새 카드에서
          동의를 체크한 뒤 다시 발급해주세요.
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={requestDelete}
        className="self-start text-xs font-medium text-destructive underline underline-offset-4 hover:opacity-80"
      >
        이 카드 삭제 요청
      </button>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
