"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ImageProcessError, prepareImage } from "@/lib/utils/image";

/**
 * 카드 발급 폼 (참여자 전용).
 *
 * 서버 라우트와의 계약:
 *   - multipart/form-data
 *   - text: body, is_public, face_consent, idempotency_key, hasPhoto
 *   - context(택1): shop_id | episode_id | project_id
 *   - file: photo (optional, JPEG 압축본)
 *
 * idempotency_key 는 첫 렌더에서 한 번만 생성. 재전송해도 서버가 중복 수락하지 않음.
 * 성공 시 /collection 으로 이동.
 */

type Context = {
  shopId?: string;
  episodeId?: string;
  projectId?: string;
  /** 카드 배경에 보여줄 맥락 이름 (가게/에피소드/프로젝트). */
  label: string;
};

type Props = {
  context: Context;
};

export function ActivityForm({ context }: Props) {
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        지금 작성하는 카드의 맥락은{" "}
        <span className="font-medium text-foreground">{context.label}</span>{" "}
        입니다.
      </div>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">사진</label>
        {previewUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* preview는 blob URL — next/image 는 의도적으로 안 씀 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="미리보기"
              className="h-auto max-h-80 w-full object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur hover:bg-background"
            >
              지우기
            </button>
          </div>
        ) : (
          <label className="flex h-40 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground hover:bg-muted/40">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="sr-only"
            />
            탭해서 사진 찍기 / 고르기
          </label>
        )}
        <p className="text-xs text-muted-foreground">
          20MB 이하의 JPEG·PNG·WebP. 업로드 전 자동으로 1024px 로 줄어듭니다.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="body" className="text-sm font-medium text-foreground">
          한 줄 메모
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="강화도에서 어떤 환대를 만났나요?"
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="text-right text-[11px] text-muted-foreground">
          {body.length}/2000
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-3">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={faceConsent}
            onChange={(e) => setFaceConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span className="flex-1">
            <span className="font-medium text-foreground">초상권 동의</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              사람이 찍힌 사진은 공개 전 반드시 체크해주세요.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span className="flex-1">
            <span className="font-medium text-foreground">
              공개 피드에 올리기
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              꺼두면 내 도감에만 남아요. 나중에 언제든 공개할 수 있어요.
            </span>
          </span>
        </label>
      </section>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} size="lg">
        {submitting ? "저장 중..." : "카드 발급하기"}
      </Button>
    </form>
  );
}
