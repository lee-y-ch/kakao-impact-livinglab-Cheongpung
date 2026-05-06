"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Action = "dismiss_report" | "remove" | "restore";

type Props = {
  activityId: string;
  /** true 이면 이미 removed 상태 — 복원만 허용 */
  removed: boolean;
};

const CONFIRMS: Record<Action, string> = {
  dismiss_report:
    "이 신고를 근거 없음으로 처리할까요? 카드는 그대로 공개 유지됩니다.",
  remove:
    "이 카드를 공개 영역에서 가릴까요? 작성자 도감에서도 삭제 처리된 상태로 표시됩니다.",
  restore:
    "삭제 처리된 카드를 복원할까요? (공개 여부는 별도로 조정해야 합니다.)",
};

export function ReportRowActions({ activityId, removed }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
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
          복원
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => run("dismiss_report")}
            className="v2-legacy-button-muted !px-3 !py-2 !text-xs disabled:opacity-60"
          >
            신고 해제
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("remove")}
            className="v2-legacy-button-muted !px-3 !py-2 !text-xs !text-destructive disabled:opacity-60"
          >
            공개 영역에서 가리기
          </button>
        </div>
      )}
      {error ? <span className="text-destructive">{error}</span> : null}
    </div>
  );
}
