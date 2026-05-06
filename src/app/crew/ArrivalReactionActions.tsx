"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  activityId: string;
};

/**
 * 도착 카드의 하이파이브 / 짧은 노트 액션.
 *
 * - 하이파이브: 1회 클릭 → POST /api/reactions { kind: 'hi_five' }
 * - 짧은 노트: 토글 시 인라인 textarea 노출, 저장하면 POST /api/reactions { kind: 'note', body }
 *
 * visibility 는 'public' 으로 보내 카드 뒷면(공개 카드) 또는 본인 도감(비공개 카드) 에 즉시 노출되게 한다.
 */
export function ArrivalReactionActions({ activityId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"hi_five" | "note" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [hiFived, setHiFived] = useState(false);
  const [noted, setNoted] = useState(false);

  async function sendHiFive() {
    if (busy || pending) return;
    setBusy("hi_five");
    setError(null);

    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        activityId,
        kind: "hi_five",
        visibility: "public",
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message =
        (payload && typeof payload.message === "string" && payload.message) ||
        "하이파이브 전송에 실패했어요.";
      setError(message);
      setBusy(null);
      return;
    }

    setBusy(null);
    setHiFived(true);
    startTransition(() => router.refresh());
  }

  async function sendNote() {
    if (busy || pending) return;
    const trimmed = noteBody.trim();
    if (!trimmed) {
      setError("노트 내용을 입력해주세요.");
      return;
    }
    setBusy("note");
    setError(null);

    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        activityId,
        kind: "note",
        body: trimmed,
        visibility: "public",
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message =
        (payload && typeof payload.message === "string" && payload.message) ||
        "노트 전송에 실패했어요.";
      setError(message);
      setBusy(null);
      return;
    }

    setBusy(null);
    setNoteBody("");
    setNoteOpen(false);
    setNoted(true);
    startTransition(() => router.refresh());
  }

  const disabled = busy != null || pending;

  return (
    <div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={sendHiFive}
          disabled={disabled}
          className="flex-1 rounded-[7px] border px-2.5 py-[7px] text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: hiFived
              ? "rgba(107,175,138,0.18)"
              : "rgba(196,149,106,0.1)",
            color: hiFived ? "#3A7A55" : "#9B6020",
            borderColor: hiFived
              ? "rgba(107,175,138,0.3)"
              : "rgba(196,149,106,0.2)",
          }}
        >
          {busy === "hi_five"
            ? "보내는 중…"
            : hiFived
              ? "★ 하이파이브 보냄"
              : "★ 하이파이브"}
        </button>
        <button
          type="button"
          onClick={() => setNoteOpen((v) => !v)}
          disabled={disabled}
          className="flex-[2] rounded-[7px] border border-v2-rule bg-[#F5F4F1] px-2.5 py-[7px] text-[12px] font-medium text-v2-ink3 transition-colors hover:bg-[#EDECEA] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {noteOpen
            ? "노트 닫기"
            : noted
              ? "노트 추가 보내기"
              : "짧은 노트 달기"}
        </button>
      </div>

      {noteOpen ? (
        <div className="mt-2 rounded-lg border border-v2-rule bg-white p-2.5">
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            maxLength={500}
            placeholder="짧게 한마디. 작성자에게 전달됩니다."
            className="h-[64px] w-full resize-none rounded-md border border-v2-rule bg-white px-2.5 py-2 text-[12.5px] leading-[1.6] text-v2-ink outline-none focus:border-[#6BAF8A]"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[10.5px] text-[#AEAEB2]">
              {noteBody.length} / 500
            </span>
            <button
              type="button"
              onClick={sendNote}
              disabled={disabled || noteBody.trim().length === 0}
              className="rounded-md bg-v2-ink px-3 py-1.5 text-[11.5px] font-medium text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "note" ? "보내는 중…" : "보내기"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-1.5 text-[11px] font-light text-rose-500">{error}</p>
      ) : null}
    </div>
  );
}
