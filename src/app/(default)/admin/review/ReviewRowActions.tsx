"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Action = "unpublish" | "remove" | "restore";

type Props = {
  activityId: string;
  /** 현재 removed 상태면 'restore' 만 노출 */
  removed: boolean;
};

const LABELS: Record<Action, string> = {
  unpublish: "비공개 전환",
  remove: "공개에서 삭제 처리",
  restore: "복원",
};

const CONFIRMS: Record<Action, string> = {
  unpublish:
    "이 카드를 비공개로 돌릴까요? 작성자가 원하면 다시 공개할 수 있어요.",
  remove:
    "이 카드를 공개 영역에서 숨기고 삭제 처리할까요? 작성자도 자기 도감에서 삭제 처리된 상태로 봅니다.",
  restore:
    "삭제 처리된 카드를 복원할까요? (공개 여부는 별도로 조정해야 합니다.)",
};

export function ReviewRowActions({ activityId, removed }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    if (busy || pending) return;
    if (!window.confirm(CONFIRMS[action])) return;
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/admin/activities/${activityId}/moderate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(
        (payload && typeof payload.message === "string" && payload.message) ||
          "처리에 실패했어요."
      );
      setBusy(false);
      return;
    }

    setBusy(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-end gap-1 text-xs">
      {removed ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => run("restore")}
          className="v2-legacy-button-muted !px-3 !py-2 !text-xs !text-emerald-700 disabled:opacity-60"
        >
          {LABELS.restore}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => run("unpublish")}
            className="v2-legacy-button-muted !px-3 !py-2 !text-xs disabled:opacity-60"
          >
            {LABELS.unpublish}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("remove")}
            className="v2-legacy-button-muted !px-3 !py-2 !text-xs !text-destructive disabled:opacity-60"
          >
            {LABELS.remove}
          </button>
        </div>
      )}
      {error ? <span className="text-destructive">{error}</span> : null}
    </div>
  );
}
