"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Claude editorial 톤의 카드 액션 묶음.
 *   - SHARE · 공개 / 비공개 (toggle)
 *   - 삭제 요청 (soft, removed_at 세팅)
 *
 * 시각만 시안에 맞추고 로직(API 호출·낙관적 업데이트 없이 router.refresh)은
 * 기존 그대로.
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

  async function togglePublic() {
    if (pending) return;
    const next = !isPublic;
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

  const shareLabel = isPublic ? "공개 중" : "비공개";
  const sharePrimary = isPublic;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button
        type="button"
        disabled={pending}
        onClick={togglePublic}
        style={{
          width: "100%",
          padding: "14px",
          fontSize: 12,
          fontFamily: "var(--mono-font)",
          letterSpacing: "0.1em",
          background: sharePrimary ? "var(--ink)" : "var(--paper)",
          border: "1px solid var(--ink)",
          color: sharePrimary ? "var(--paper)" : "var(--ink)",
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        SHARE · {shareLabel}
      </button>

      <div
        style={{
          fontSize: 11.5,
          color: "var(--ink-3)",
          lineHeight: 1.6,
          fontFamily: "var(--serif-font)",
        }}
      >
        {isPublic
          ? "지금은 공개 피드·가게 페이지에 노출됩니다."
          : "지금은 내 도감에만 남습니다."}
      </div>

      {!faceConsentGranted ? (
        <p
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            lineHeight: 1.6,
            padding: "10px 12px",
            border: "1px dashed var(--rule)",
            background: "var(--paper)",
            fontFamily: "var(--serif-font)",
          }}
        >
          이 카드는 초상권 동의 체크 없이 저장돼서 공개할 수 없어요. 새 카드에서
          동의를 체크한 뒤 다시 발급해주세요.
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={requestDelete}
        style={{
          alignSelf: "flex-start",
          background: "none",
          border: "none",
          padding: 0,
          fontSize: 11,
          fontFamily: "var(--mono-font)",
          letterSpacing: "0.06em",
          color: "oklch(0.45 0.13 30)",
          textDecoration: "underline",
          textUnderlineOffset: 4,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        이 카드 삭제 요청
      </button>

      {error ? (
        <p
          role="alert"
          style={{
            fontSize: 11.5,
            color: "oklch(0.45 0.13 30)",
            fontFamily: "var(--serif-font)",
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
