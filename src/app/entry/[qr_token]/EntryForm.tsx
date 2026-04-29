"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ImageProcessError, prepareImage } from "@/lib/utils/image";

/**
 * Claude editorial 톤의 카드 작성 폼.
 *
 * 좌측 패널에 라이브 프리뷰 (앞·뒷면) — 입력 즉시 카드가 그려진다.
 * 우측 패널에 입력 폼.
 *
 * schema 와 차이 (의도적 단순화):
 * - 시안의 CATEGORY 4-button 선택은 우리 모델에선 사용자가 못 정함
 *   (project/episode/shop 으로부터 derive). 따라서 CATEGORY 패널 제거,
 *   페이지에서 받은 가게/에피소드의 컨텍스트 정보를 잠금으로 표시.
 * - WITH (companions) 는 schema 부재 — 제외.
 *
 * 서버 라우트 계약(/api/activities POST multipart/form-data)은
 * 기존 ActivityForm 과 동일.
 */

type Context = {
  shopId?: string;
  episodeId?: string;
  projectId?: string;
  /** 카드 좌측 라이브 프리뷰 + lock 라벨에 보여줄 맥락. */
  label: string;
  /** 카테고리 색용 슬러그 (없으면 기본 ink 처리). */
  categorySlug?: string | null;
  /** 카테고리 한글명 (배지). */
  categoryName?: string | null;
};

const CATEGORY_COLOR: Record<string, string> = {
  commons: "var(--cat-commons)",
  network: "var(--cat-network)",
  world: "var(--cat-world)",
  policy: "var(--cat-policy)",
};

const CATEGORY_EN: Record<string, string> = {
  commons: "commons",
  network: "network",
  world: "world",
  policy: "policy",
};

export function EntryForm({ context }: { context: Context }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [faceConsent, setFaceConsent] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(rawFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [rawFile]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    setRawFile(file);
  }

  function clearPhoto() {
    setRawFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const trimmedBody = body.trim();
    if (!rawFile && trimmedBody.length === 0) {
      setError("사진 또는 메모 중 하나는 꼭 필요해요.");
      return;
    }
    if (rawFile && !faceConsent) {
      setError("사진에 사람이 찍혔다면 초상권 동의 체크가 필요해요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.set("idempotency_key", idempotencyKey);
      fd.set("type", rawFile ? "photo" : "memo");
      fd.set("hasPhoto", rawFile ? "true" : "false");
      fd.set("is_public", isPublic ? "true" : "false");
      fd.set("face_consent", faceConsent ? "true" : "false");
      if (trimmedBody.length > 0) fd.set("body", trimmedBody);
      if (context.shopId) fd.set("shop_id", context.shopId);
      if (context.episodeId) fd.set("episode_id", context.episodeId);
      if (context.projectId) fd.set("project_id", context.projectId);

      if (rawFile) {
        const prepared = await prepareImage(rawFile);
        fd.set(
          "photo",
          new File([prepared.blob], `photo.${prepared.extension}`, {
            type: prepared.blob.type,
          })
        );
      }

      const res = await fetch("/api/activities", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message =
          (payload && typeof payload.message === "string" && payload.message) ||
          "카드를 저장하지 못했어요. 잠시 후 다시 시도해주세요.";
        setError(message);
        setSubmitting(false);
        return;
      }

      router.replace("/collection");
      router.refresh();
    } catch (err) {
      if (err instanceof ImageProcessError) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했어요. 다시 시도해주세요.");
      }
      setSubmitting(false);
    }
  }

  // Live preview values
  const today = new Date();
  const dateLabel = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
  const previewSerial = idempotencyKey
    .replace(/-/g, "")
    .slice(-3)
    .toUpperCase();
  const place = context.label;
  const catColor = CATEGORY_COLOR[context.categorySlug ?? ""] ?? "var(--ink-2)";
  const catEn = CATEGORY_EN[context.categorySlug ?? ""] ?? null;
  const catName = context.categoryName ?? null;
  const previewBody = body.trim() || "여기에 한 줄이 보일 거예요";

  const charCount = body.length;
  const charCap = 2000;
  const canSubmit =
    !submitting &&
    (rawFile != null || body.trim().length > 0) &&
    (!rawFile || faceConsent);

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "calc(100vh - 49px)",
      }}
    >
      {/* LEFT — live preview */}
      <section
        style={{
          background: "var(--paper-2)",
          padding: "56px",
          borderRight: "1px solid var(--rule)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            alignSelf: "flex-start",
            fontSize: 10.5,
            fontFamily: "var(--mono-font)",
            color: "var(--ink-3)",
            letterSpacing: "0.18em",
            marginBottom: 24,
          }}
        >
          LIVE PREVIEW · 적는 동안 카드가 그려집니다
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* FRONT */}
          <div>
            <article
              style={{
                width: 228,
                height: 320,
                background: "var(--paper)",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(20,22,28,0.08)",
                border: "1px solid var(--rule)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "52%",
                  position: "relative",
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.04 60), oklch(0.72 0.06 45))",
                }}
              >
                {previewUrl ? (
                  // blob URL — next/image 안 쓰고 native img 사용
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="미리보기"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "var(--paper)",
                    padding: "3px 7px",
                    borderRadius: 4,
                    fontFamily: "var(--mono-font)",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: "var(--ink-2)",
                    border: "1px solid var(--rule)",
                  }}
                >
                  No.{previewSerial}
                </div>
                {catName ? (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 10,
                      left: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "var(--paper)",
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      color: "var(--ink)",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 2,
                        background: catColor,
                      }}
                    />
                    {catName}
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  padding: "12px 14px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  className="serif"
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: body.trim() ? "var(--ink)" : "var(--ink-3)",
                    fontStyle: body.trim() ? "normal" : "italic",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {previewBody}
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    fontSize: 10,
                    color: "var(--ink-3)",
                    fontFamily: "var(--mono-font)",
                  }}
                >
                  <span>@ {place}</span>
                  <span>{dateLabel}</span>
                </div>
              </div>
            </article>
            <div
              style={{
                fontSize: 10,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                marginTop: 10,
                textAlign: "center",
                letterSpacing: "0.1em",
              }}
            >
              FRONT · 앞면
            </div>
          </div>

          {/* BACK */}
          <div>
            <div
              style={{
                width: 228,
                height: 320,
                background: "var(--paper)",
                border: `1px solid ${catColor}`,
                padding: 18,
                position: "relative",
                boxShadow: "0 8px 24px rgba(20,22,28,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontFamily: "var(--mono-font)",
                  color: catColor,
                  letterSpacing: "0.18em",
                  marginBottom: 10,
                  textTransform: "uppercase",
                }}
              >
                {catEn ?? "—"} · BACK
              </div>
              <div
                className="serif"
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  color: body.trim() ? "var(--ink)" : "var(--ink-3)",
                  fontStyle: body.trim() ? "normal" : "italic",
                  display: "-webkit-box",
                  WebkitLineClamp: 8,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {body.trim() ? `"${body}"` : `"${previewBody}"`}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 18,
                  left: 18,
                  right: 18,
                  fontSize: 10,
                  fontFamily: "var(--mono-font)",
                  color: "var(--ink-3)",
                  letterSpacing: "0.06em",
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--rule-2)",
                  paddingTop: 8,
                }}
              >
                <span>{place}</span>
                <span>{dateLabel}</span>
              </div>
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                marginTop: 10,
                textAlign: "center",
                letterSpacing: "0.1em",
              }}
            >
              BACK · 뒷면
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 11.5,
            fontFamily: "var(--serif-font)",
            color: "var(--ink-3)",
            textAlign: "center",
            maxWidth: 360,
            lineHeight: 1.7,
          }}
        >
          카드는 도감에 자동 저장됩니다. 공개 여부는 작성 후 언제든 바꿀 수
          있어요.
        </div>
      </section>

      {/* RIGHT — form */}
      <section style={{ padding: "56px" }}>
        <div
          style={{
            fontSize: 10.5,
            fontFamily: "var(--mono-font)",
            color: "var(--ink-3)",
            letterSpacing: "0.18em",
            marginBottom: 8,
          }}
        >
          ENTRY · 카드 작성
        </div>
        <h1
          className="serif"
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: "0 0 8px",
            lineHeight: 1.15,
          }}
        >
          오늘, 이곳에서 무엇을 봤나요?
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--ink-2)",
            lineHeight: 1.7,
            marginBottom: 36,
            maxWidth: 520,
          }}
        >
          한 줄이면 충분합니다. 잘 쓰지 않아도 됩니다. 짧은 메모가 다른 사람의
          다음 발걸음이 될 수 있어요.
        </p>

        {/* PLACE (locked) */}
        <FieldHeader>PLACE · QR 로 잠긴 자리</FieldHeader>
        <div
          style={{
            padding: "12px 14px",
            border: "1px solid var(--rule)",
            background: "var(--paper-2)",
            fontSize: 14,
            color: "var(--ink)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span className="serif" style={{ fontWeight: 700 }}>
            {place}
          </span>
          {catName ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-3)",
                letterSpacing: "0.1em",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: catColor,
                }}
              />
              {(catEn ?? catName).toUpperCase()}
            </span>
          ) : null}
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontFamily: "var(--mono-font)",
            color: "var(--ink-3)",
            marginBottom: 24,
          }}
        >
          QR 토큰으로 자동 채워집니다. 다른 자리는 다른 QR 에서.
        </div>

        {/* PHOTO */}
        <FieldHeader>PHOTO · 사진 (선택)</FieldHeader>
        {previewUrl ? (
          <div
            style={{
              position: "relative",
              border: "1px solid var(--rule)",
              background: "var(--paper)",
              marginBottom: 6,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="업로드 미리보기"
              style={{
                width: "100%",
                maxHeight: 240,
                objectFit: "cover",
                display: "block",
              }}
            />
            <button
              type="button"
              onClick={clearPhoto}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "var(--paper)",
                border: "1px solid var(--rule)",
                padding: "4px 8px",
                fontSize: 11,
                fontFamily: "var(--mono-font)",
                color: "var(--ink-2)",
                cursor: "pointer",
                letterSpacing: "0.06em",
              }}
            >
              지우기
            </button>
          </div>
        ) : (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 120,
              border: "1px dashed var(--rule)",
              background: "var(--paper-2)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "var(--serif-font)",
              color: "var(--ink-3)",
              marginBottom: 6,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            />
            클릭해서 사진 첨부 / 카메라 촬영
          </label>
        )}
        <div
          style={{
            fontSize: 10.5,
            fontFamily: "var(--mono-font)",
            color: "var(--ink-3)",
            marginBottom: 24,
          }}
        >
          20MB 이하 JPEG·PNG·WebP. 업로드 전 1024px 로 자동 압축.
        </div>

        {/* MEMO */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <FieldHeader>MEMO · 한 줄 메모</FieldHeader>
          <span
            style={{
              fontSize: 10.5,
              fontFamily: "var(--mono-font)",
              color:
                charCount > charCap ? "oklch(0.45 0.13 30)" : "var(--ink-3)",
            }}
          >
            {charCount} / {charCap}
          </span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={charCap}
          placeholder="강화도에서 어떤 환대를 만났나요?"
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid var(--rule)",
            background: "var(--paper)",
            fontSize: 14,
            fontFamily: "var(--serif-font)",
            color: "var(--ink)",
            boxSizing: "border-box",
            resize: "vertical",
            lineHeight: 1.7,
            marginBottom: 36,
          }}
        />

        {/* face_consent + is_public */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "16px 18px",
            border: "1px solid var(--rule)",
            background: "var(--paper-2)",
            marginBottom: 24,
          }}
        >
          <Toggle
            label="초상권 동의"
            sub="사람이 찍힌 사진은 공개 전 반드시 체크."
            checked={faceConsent}
            onChange={setFaceConsent}
          />
          <Toggle
            label="이 카드를 공개 피드에 보여도 좋습니다"
            sub="꺼두면 내 도감에만 남아요. 작성 후 언제든 바꿀 수 있어요."
            checked={isPublic}
            onChange={setIsPublic}
          />
        </div>

        {error ? (
          <p
            role="alert"
            style={{
              fontSize: 12,
              color: "oklch(0.45 0.13 30)",
              fontFamily: "var(--serif-font)",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        ) : null}

        <div
          style={{
            borderTop: "1px solid var(--rule)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              padding: "14px 28px",
              fontSize: 13,
              fontFamily: "var(--mono-font)",
              letterSpacing: "0.12em",
              background: "var(--ink)",
              color: "var(--paper)",
              border: "none",
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.45,
            }}
          >
            {submitting ? "SAVING…" : "SAVE TO COLLECTION →"}
          </button>
        </div>
      </section>
    </form>
  );
}

function FieldHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontFamily: "var(--mono-font)",
        color: "var(--ink-3)",
        letterSpacing: "0.18em",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Toggle({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          marginTop: 4,
          width: 16,
          height: 16,
          accentColor: "var(--ink)",
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1 }}>
        <span
          style={{
            fontSize: 13,
            fontFamily: "var(--serif-font)",
            fontWeight: 700,
            color: "var(--ink)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 11.5,
            color: "var(--ink-3)",
            marginTop: 2,
            lineHeight: 1.6,
          }}
        >
          {sub}
        </span>
      </span>
    </label>
  );
}
