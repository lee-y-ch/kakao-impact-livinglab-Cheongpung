"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type EpisodeStatus = "planned" | "in_progress" | "completed";

type Props = {
  episodeId: string;
  current: EpisodeStatus;
};

const STEPS: { value: EpisodeStatus; label: string }[] = [
  { value: "planned", label: "예정" },
  { value: "in_progress", label: "진행" },
  { value: "completed", label: "완료" },
];

/**
 * /crew 의 status 스텝퍼.
 * 각 스텝 클릭 시 PATCH /api/episodes/[id]/status 호출 후 router.refresh.
 *
 * 시안의 4단계(예정/준비/진행/완료) 는 DB enum (planned/in_progress/completed) 3단계로 정리.
 * '준비' 슬롯은 schema 미지원 → 제거.
 */
export function EpisodeStatusActions({ episodeId, current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<EpisodeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentIdx = STEPS.findIndex((s) => s.value === current);

  async function setStatus(next: EpisodeStatus) {
    if (busy || pending || next === current) return;
    setBusy(next);
    setError(null);

    const res = await fetch(`/api/episodes/${episodeId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message =
        (payload && typeof payload.message === "string" && payload.message) ||
        "상태 변경에 실패했어요.";
      setError(message);
      setBusy(null);
      return;
    }

    setBusy(null);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="mb-4 flex items-center">
        {STEPS.map((step, idx) => {
          const isCurrent = idx === currentIdx;
          const isDone = idx < currentIdx;
          const cls = isCurrent
            ? "bg-v2-ink text-white border-v2-ink"
            : isDone
              ? "bg-[#EDECEA] text-[#888] border-v2-rule"
              : "bg-[#FAFAF8] text-[#AEAEB2] border-v2-rule";
          const radius =
            idx === 0
              ? "rounded-l-lg"
              : idx === STEPS.length - 1
                ? "rounded-r-lg"
                : "";
          const borderLeft = idx > 0 ? "border-l-0" : "";
          const stepBusy = busy === step.value;
          return (
            <button
              key={step.value}
              type="button"
              onClick={() => setStatus(step.value)}
              disabled={busy != null || pending || isCurrent}
              className={`flex-1 cursor-pointer border px-1 py-[7px] text-center text-[11px] font-medium transition-all disabled:cursor-not-allowed ${cls} ${radius} ${borderLeft} ${
                !isCurrent && !isDone
                  ? "hover:bg-[#EDECEA] hover:text-v2-ink"
                  : ""
              }`}
            >
              {stepBusy ? "처리…" : step.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="text-[11px] font-light text-rose-500">{error}</p>
      ) : null}
    </div>
  );
}
