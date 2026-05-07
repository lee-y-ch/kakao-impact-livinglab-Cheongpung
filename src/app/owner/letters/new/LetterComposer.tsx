"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Claude editorial 톤의 사장님 편지지 + ASSIST.
 *
 * 시각: 시안 그대로 (편지지 line-rule 배경 + 큰 serif textarea + SAVE DRAFT/SEND 버튼,
 * 우측 ASSIST 패널의 첫 문장 후보·자주 쓰인 단어·AVOID·POLICY).
 * 기능: POST /api/reactions {kind:'letter', activityId, body, visibility}
 *      성공 시 /owner 로 라우팅. SAVE DRAFT 는 localStorage 임시 저장.
 *
 * AI 호출은 미구현 (Phase 4-b) — startCandidates 와 wordSuggestions 는 서버에서
 * 카드/카드 본문 기반으로 정적 채워서 props 로 전달.
 */

const DRAFT_KEY_PREFIX = "owner-letter-draft-";

const AVOID_LIST = ["고객님", "감사합니다 ^^", "또 와주세요"];

export function LetterComposer({
  activityId,
  recipientName,
  shopName,
  startCandidates,
  wordSuggestions,
}: {
  activityId: string;
  recipientName: string;
  shopName: string;
  startCandidates: string[];
  wordSuggestions: string[];
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [body, setBody] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmDraft, setLlmDraft] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState(true);

  const draftKey = `${DRAFT_KEY_PREFIX}${activityId}`;

  // mount: localStorage draft 복원
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(draftKey);
      if (stored) {
        setBody(stored);
        setSavedAt("draft loaded");
      }
    } catch {
      /* ignore */
    }
  }, [draftKey]);

  // 자동 저장 (디바운스 1.5s)
  useEffect(() => {
    if (body.length === 0) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, body);
        const now = new Date();
        setSavedAt(
          now.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [body, draftKey]);

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setBody((prev) => (prev.length === 0 ? text : `${prev} ${text}`));
      return;
    }
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function startWith(sentence: string) {
    if (body.trim().length === 0) {
      setBody(sentence + "\n\n");
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        const pos = sentence.length + 2;
        textareaRef.current?.setSelectionRange(pos, pos);
      });
    } else {
      insertAtCursor(sentence);
    }
  }

  async function saveDraft() {
    try {
      window.localStorage.setItem(draftKey, body);
      setSavedAt(
        new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      setError("브라우저 저장 영역에 접근할 수 없어요.");
    }
  }

  async function requestAiDraft() {
    if (drafting) return;
    setDrafting(true);
    setError(null);
    try {
      const res = await fetch("/api/llm/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        draft?: string;
        message?: string;
      };
      if (!res.ok || !data.draft) {
        setError(
          data.message ??
            "AI 초안을 만들지 못했어요. 직접 작성은 계속할 수 있어요."
        );
        return;
      }
      setLlmDraft(data.draft);
      startWith(data.draft);
    } catch {
      setError("AI 초안 요청 중 네트워크 오류가 발생했어요.");
    } finally {
      setDrafting(false);
    }
  }

  async function send() {
    if (submitting) return;
    const trimmed = body.trim();
    if (trimmed.length < 4) {
      setError("편지 본문이 너무 짧아요. 최소 4자 이상.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activityId,
          kind: "letter",
          body: trimmed,
          llmDraft,
          visibility: makePublic ? "public" : "private",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        setError(data.message ?? data.error ?? "편지를 보내지 못했어요.");
        setSubmitting(false);
        return;
      }
      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
      router.replace("/owner");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요.");
      setSubmitting(false);
    }
  }

  const dateLabel = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const charCount = body.length;
  const readSeconds = Math.max(15, Math.round((charCount / 350) * 60));

  return (
    <>
      {/* CENTER — letter paper */}
      <section style={{ padding: "56px 64px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 18,
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10.5,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.18em",
                marginBottom: 6,
              }}
            >
              LETTER · {shopName} → {recipientName}
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              오늘 본 {recipientName}님께
            </h1>
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <span>
              {savedAt ? `자동 저장됨 · ${savedAt}` : "초안 저장 대기"}
            </span>
            <button
              type="button"
              onClick={requestAiDraft}
              disabled={drafting}
              style={{
                padding: "9px 12px",
                cursor: drafting ? "wait" : "pointer",
                background: "var(--ink)",
                color: "var(--paper)",
                border: "none",
                fontSize: 10.5,
                fontFamily: "var(--mono-font)",
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
              }}
            >
              {drafting ? "AI 초안 중…" : "AI 첫 문장 제안"}
            </button>
          </div>
        </div>

        {/* paper */}
        <div
          style={{
            background: "var(--paper-2)",
            border: "1px solid var(--rule)",
            padding: "40px 44px",
            position: "relative",
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, oklch(0.86 0.005 250 / 0.3) 32px)",
            backgroundSize: "100% 32px",
          }}
        >
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            placeholder={`${recipientName}님께 짧은 한 줄을 남겨주세요. 잘 쓰지 않아도 됩니다.`}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--serif-font)",
              fontSize: 16,
              lineHeight: "32px",
              color: "var(--ink)",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: "1px solid var(--rule-2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div
              className="serif"
              style={{ fontSize: 14, color: "var(--ink-2)" }}
            >
              {shopName}에서,{" "}
              <strong style={{ color: "var(--ink)" }}>사장님</strong>
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
              }}
            >
              {dateLabel}
            </div>
          </div>
        </div>

        {/* actions */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              fontFamily: "var(--mono-font)",
              color: "var(--ink-3)",
            }}
          >
            {charCount}자 · 읽기 {readSeconds}초
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <label
              style={{
                fontSize: 11.5,
                color: "var(--ink-2)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontFamily: "var(--serif-font)",
              }}
            >
              <input
                type="checkbox"
                checked={makePublic}
                onChange={(e) => setMakePublic(e.target.checked)}
                style={{
                  width: 14,
                  height: 14,
                  accentColor: "var(--ink)",
                }}
              />
              {recipientName}님 도감 뒷면에 공개
            </label>
            <button
              type="button"
              onClick={saveDraft}
              disabled={submitting || body.length === 0}
              style={{
                padding: "12px 20px",
                fontSize: 12,
                fontFamily: "var(--mono-font)",
                letterSpacing: "0.1em",
                background: "var(--paper)",
                border: "1px solid var(--ink)",
                color: "var(--ink)",
                cursor: submitting ? "wait" : "pointer",
                opacity: body.length === 0 ? 0.45 : 1,
              }}
            >
              SAVE DRAFT
            </button>
            <button
              type="button"
              onClick={send}
              disabled={submitting || body.trim().length < 4}
              style={{
                padding: "12px 24px",
                fontSize: 12,
                fontFamily: "var(--mono-font)",
                letterSpacing: "0.12em",
                background: "var(--ink)",
                color: "var(--paper)",
                border: "none",
                cursor:
                  submitting || body.trim().length < 4
                    ? "not-allowed"
                    : "pointer",
                opacity: body.trim().length < 4 ? 0.45 : 1,
              }}
            >
              {submitting ? "SENDING…" : "SEND →"}
            </button>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "oklch(0.45 0.13 30)",
              fontFamily: "var(--serif-font)",
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
        ) : null}
      </section>

      {/* RIGHT — AI helper */}
      <aside
        style={{
          borderLeft: "1px solid var(--rule)",
          padding: "48px 28px",
          background: "var(--paper-2)",
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontFamily: "var(--mono-font)",
            color: "var(--ink)",
            letterSpacing: "0.18em",
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "var(--sea)",
            }}
          />
          ASSIST · 글쓰기 도움
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-3)",
            marginBottom: 20,
            lineHeight: 1.7,
          }}
        >
          AI 초안은 첫 문장 제안일 뿐입니다. 꼭 사장님 말로 고쳐서 보내주세요.
        </div>

        <button
          type="button"
          onClick={requestAiDraft}
          disabled={drafting}
          style={{
            width: "100%",
            padding: "11px 12px",
            marginBottom: 18,
            cursor: drafting ? "wait" : "pointer",
            background: "var(--ink)",
            color: "var(--paper)",
            border: "none",
            fontSize: 11,
            fontFamily: "var(--mono-font)",
            letterSpacing: "0.1em",
          }}
        >
          {drafting ? "AI 초안 만드는 중…" : "AI 첫 문장 제안"}
        </button>

        {llmDraft ? (
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              border: "1px solid var(--sea)",
              background: "var(--paper)",
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "var(--ink-2)",
              fontFamily: "var(--serif-font)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono-font)",
                fontSize: 9.5,
                color: "var(--ink-3)",
                letterSpacing: "0.12em",
                marginBottom: 6,
              }}
            >
              AI DRAFT · 저장 시 원본 기록
            </div>
            {llmDraft}
          </div>
        ) : null}

        <div
          style={{
            fontSize: 10,
            fontFamily: "var(--mono-font)",
            color: "var(--ink-3)",
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          START · 첫 문장 후보
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 24,
          }}
        >
          {startCandidates.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => startWith(s)}
              style={{
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer",
                background: "var(--paper)",
                border: "1px solid var(--rule)",
                fontSize: 12,
                fontFamily: "var(--serif-font)",
                color: "var(--ink-2)",
                lineHeight: 1.5,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {wordSuggestions.length > 0 ? (
          <>
            <div
              style={{
                fontSize: 10,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.15em",
                marginBottom: 8,
              }}
            >
              WORDS · {recipientName}님 카드에서 자주 쓰인 단어
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              {wordSuggestions.map((w, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => insertAtCursor(w)}
                  style={{
                    fontSize: 11.5,
                    fontFamily: "var(--serif-font)",
                    padding: "4px 10px",
                    border: "1px solid var(--rule)",
                    color: "var(--ink-2)",
                    cursor: "pointer",
                    background: "var(--paper)",
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <div
          style={{
            fontSize: 10,
            fontFamily: "var(--mono-font)",
            color: "var(--ink-3)",
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          AVOID · 피하는 표현
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            lineHeight: 1.7,
            fontFamily: "var(--serif-font)",
          }}
        >
          {AVOID_LIST.map((a) => `"${a}"`).join(" · ")} 같은 매뉴얼 말투는
          가능하면 빼요. 사장님 일상 단어가 더 잘 닿습니다.
        </div>

        <div
          style={{
            marginTop: 32,
            padding: 14,
            border: "1px solid var(--ink)",
            fontSize: 11,
            lineHeight: 1.7,
            color: "var(--ink-2)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono-font)",
              fontSize: 9.5,
              color: "var(--ink)",
              letterSpacing: "0.12em",
              marginBottom: 4,
            }}
          >
            POLICY
          </div>
          AI 초안은 명시적으로 버튼을 누를 때만 만듭니다. 초안은 원본 기록으로
          남기고, 실제로 보내는 글은 사장님이 수정한 본문입니다.
        </div>
      </aside>
    </>
  );
}
