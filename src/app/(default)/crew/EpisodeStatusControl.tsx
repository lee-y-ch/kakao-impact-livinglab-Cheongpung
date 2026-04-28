"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Status = "planned" | "in_progress" | "completed";

const STATUS_LABEL: Record<Status, string> = {
  planned: "예정",
  in_progress: "진행",
  completed: "완료",
};

const ORDER: Status[] = ["planned", "in_progress", "completed"];

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
    setStatus(next); // optimistic

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
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center overflow-hidden rounded-full border border-border text-xs">
        {ORDER.map((s, idx) => (
          <button
            key={s}
            type="button"
            onClick={() => change(s)}
            disabled={isPending}
            className={
              "px-3 py-1.5 transition disabled:opacity-60 " +
              (status === s
                ? "bg-foreground text-background"
                : "bg-background text-muted-foreground hover:bg-muted") +
              (idx !== 0 ? " border-l border-border" : "")
            }
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {error ? (
        <span className="text-[11px] text-destructive">{error}</span>
      ) : null}
    </div>
  );
}
