"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Status = "planned" | "in_progress" | "completed";

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string }
> = {
  planned: {
    label: "예정",
    color: "var(--ink-3)",
    bg: "var(--paper-3)",
  },
  in_progress: {
    label: "진행",
    color: "var(--pine)",
    bg: "var(--pine-soft)",
  },
  completed: {
    label: "완료",
    color: "var(--ink-2)",
    bg: "var(--paper-3)",
  },
};

const ORDER: Status[] = ["planned", "in_progress", "completed"];

/**
 * 크루 에피소드 상태 stepper (editorial 톤).
 * 시각만 시안 그대로 (3단계 stepper + 상태 pill), 기존 PATCH /api/episodes/[id]/status
 * 호출 + 낙관적 업데이트 + 실패 시 롤백 그대로.
 */
export function EpisodeStatusControl({
  episodeId,
  initialStatus,
}: {
  episodeId: string;
  initialStatus: Status;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function change(next: Status) {
    if (next === status || isPending) return;
    setError(null);

    const previous = status;
    setStatus(next);

    try {
      const res = await fetch(`/api/episodes/${episodeId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setStatus(previous);
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "업데이트 실패");
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setStatus(previous);
      setError("네트워크 오류");
    }
  }

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {ORDER.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const active = status === s;
        return (
          <button
            key={s}
            type="button"
            disabled={isPending}
            onClick={() => change(s)}
            title={error ?? undefined}
            style={{
              flex: 1,
              padding: "8px 10px",
              background: active ? cfg.color : "var(--paper-2)",
              color: active ? "#fff" : "var(--ink-3)",
              border: "none",
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: "var(--ui-font)",
              cursor: isPending ? "wait" : "pointer",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {i + 1}. {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
