"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OwnerSettingsForm({
  initialIsPublic,
}: {
  initialIsPublic: boolean;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(nextValue: boolean) {
    setIsPublic(nextValue);
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/owner/shop", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_public: nextValue }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setIsPublic(!nextValue);
        setError(data.message ?? "가게 공개 설정을 저장하지 못했어요.");
        return;
      }
      setMessage(
        nextValue ? "가게를 공개했습니다." : "가게를 비공개로 전환했습니다."
      );
      router.refresh();
    } catch {
      setIsPublic(!nextValue);
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-v2-ink">가게 공개</div>
          <p className="mt-1 max-w-xl text-sm leading-6 text-v2-ink2">
            OFF로 바꾸면 가게 페이지와 이 가게에 연결된 공개 카드가 외부
            둘러보기에서 보이지 않습니다.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => save(!isPublic)}
          className={[
            "h-11 min-w-28 rounded-md px-4 text-sm font-semibold transition",
            isPublic
              ? "bg-v2-ink text-v2-paper"
              : "border border-v2-rule bg-v2-paper2 text-v2-ink",
            saving ? "cursor-wait opacity-70" : "",
          ].join(" ")}
        >
          {saving ? "저장 중" : isPublic ? "공개 ON" : "공개 OFF"}
        </button>
      </div>
      {message ? <p className="mt-4 text-sm text-v2-ink2">{message}</p> : null}
      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
