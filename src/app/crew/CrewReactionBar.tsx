"use client";

import { useState } from "react";

/**
 * 크루 응원 UI — 카드 한 장 아래에 붙는 hi_five / note 바.
 *
 * hi_five : body 없이 1 클릭.
 * note    : 짧은 텍스트 (현장 메모). visibility=private (참여자 본인만 확인).
 *
 * 성공하면 "보냈어요" 배지를 남기고 버튼은 비활성. 카운트는 Phase 4 reaction 리스트에서.
 */
export function CrewReactionBar({ activityId }: { activityId: string }) {
  const [state, setState] = useState<"idle" | "note_open" | "sent">("idle");
  const [lastKind, setLastKind] = useState<"hi_five" | "note" | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(kind: "hi_five" | "note", body?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activityId,
          kind,
          body,
          visibility: "private",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "전송 실패");
        return;
      }
      setLastKind(kind);
      setState("sent");
      setNote("");
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  if (state === "sent") {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
        {lastKind === "hi_five" ? "응원 전송 완료" : "메모 전송 완료"} — 참여자
        도감에서 확인됩니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => send("hi_five")}
          disabled={loading}
          className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
        >
          응원 보내기
        </button>
        <button
          type="button"
          onClick={() => setState(state === "note_open" ? "idle" : "note_open")}
          disabled={loading}
          className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
        >
          {state === "note_open" ? "메모 접기" : "메모 남기기"}
        </button>
      </div>

      {state === "note_open" ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="현장에서 느낀 것 / 전하고 싶은 말 (참여자 본인만 보여요)"
            className="rounded-md border border-input px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => send("note", note.trim())}
              disabled={loading || note.trim().length === 0}
              className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "보내는 중…" : "메모 보내기"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
