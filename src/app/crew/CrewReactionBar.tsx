"use client";

import { useState } from "react";

/**
 * 크루 응원 UI — editorial 톤.
 * hi_five : body 없이 1 클릭. 토글 시 sunset 컬러로 전환.
 * note    : 짧은 텍스트 (현장 메모). visibility=private (참여자 본인만 확인).
 *
 * 시각만 시안 톤으로 갈아엎고 POST /api/reactions 흐름은 기존 그대로.
 */
export function CrewReactionBar({ activityId }: { activityId: string }) {
  const [state, setState] = useState<"idle" | "note_open" | "sent">("idle");
  const [lastKind, setLastKind] = useState<"hi_five" | "note" | null>(null);
  const [hfGiven, setHfGiven] = useState(false);
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
      if (kind === "hi_five") setHfGiven(true);
      setState(kind === "note" ? "sent" : "idle");
      setNote("");
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  if (state === "sent" && lastKind === "note") {
    return (
      <div
        style={{
          padding: "8px 12px",
          border: `1px solid var(--pine)`,
          background: "var(--pine-soft)",
          fontSize: 11,
          color: "var(--pine)",
          fontFamily: "var(--mono-font)",
          letterSpacing: "0.06em",
        }}
      >
        ● NOTE SENT — 참여자 도감에 도착
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => send("hi_five")}
          disabled={loading || hfGiven}
          style={{
            fontSize: 11,
            padding: "5px 10px",
            borderRadius: 999,
            background: hfGiven ? "var(--sunset)" : "var(--paper-2)",
            color: hfGiven ? "#fff" : "var(--ink-2)",
            border: `1px solid ${hfGiven ? "var(--sunset)" : "var(--rule)"}`,
            fontWeight: 600,
            cursor: hfGiven || loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          ✦ 하이파이브{hfGiven ? " 완료" : ""}
        </button>
        <button
          type="button"
          onClick={() => setState(state === "note_open" ? "idle" : "note_open")}
          disabled={loading}
          style={{
            fontSize: 11,
            padding: "5px 10px",
            borderRadius: 999,
            background: "var(--paper-2)",
            border: "1px solid var(--rule)",
            color: "var(--ink-2)",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {state === "note_open" ? "메모 접기" : "짧은 노트"}
        </button>
      </div>

      {state === "note_open" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="현장에서 느낀 것 (참여자 본인만 보여요)"
            style={{
              padding: "10px 12px",
              border: "1px solid var(--rule)",
              background: "var(--paper)",
              fontSize: 12.5,
              fontFamily: "var(--serif-font)",
              color: "var(--ink)",
              lineHeight: 1.7,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => send("note", note.trim())}
              disabled={loading || note.trim().length === 0}
              style={{
                padding: "6px 12px",
                background: "var(--ink)",
                color: "var(--paper)",
                border: "none",
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                letterSpacing: "0.08em",
                cursor:
                  loading || note.trim().length === 0
                    ? "not-allowed"
                    : "pointer",
                opacity: loading || note.trim().length === 0 ? 0.45 : 1,
              }}
            >
              {loading ? "SENDING…" : "SEND →"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p
          style={{
            fontSize: 11,
            color: "oklch(0.45 0.13 30)",
            fontFamily: "var(--serif-font)",
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
