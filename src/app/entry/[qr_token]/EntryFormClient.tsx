"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { ImageProcessError, prepareImage } from "@/lib/utils/image";

const MEMO_LIMIT = 120;
const MEMO_HARD_LIMIT = 2000;
const DEFAULT_THEME = "linear-gradient(145deg, #6BAF8A, #4E9070)";

type Props = {
  shopId: string;
  shopName: string;
  shopAddress: string | null;
  themeColor: string | null;
  qrTokenPreview: string;
  nicknameInitial: string;
  nickname: string;
};

/**
 * /entry/[qr_token] 카드 작성 폼 (client island).
 *
 * 입력:
 *   - 사진 1장 (camera capture, EXIF 회전 + 1024px 압축은 prepareImage 가 처리)
 *   - 메모 (한 줄 권장 120자, 하드 리밋 2000자)
 *   - face_consent 체크
 *   - 공개 토글 (기본 false)
 *
 * 제출:
 *   - idempotency_key 는 mount 시 1회 생성 → 새로고침/재전송 dedup
 *   - multipart/form-data POST /api/activities
 *   - shop_id 만 컨텍스트로 전송 (project/episode 는 추후 분리)
 */
export function EntryFormClient({
  shopId,
  shopName,
  shopAddress,
  themeColor,
  qrTokenPreview,
  nicknameInitial,
  nickname,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [memo, setMemo] = useState("");
  const [faceConsent, setFaceConsent] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // mount 시 1회 — 같은 폼 재제출 / 새로고침 시 dedup
  const idempotencyKey = useMemo(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  useEffect(() => {
    if (!photoPreview) return;
    return () => {
      URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 가능하게
    if (!file) return;

    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const prepared = await prepareImage(file);
      const url = URL.createObjectURL(prepared.blob);
      setPhotoBlob(prepared.blob);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      const message =
        err instanceof ImageProcessError
          ? err.message
          : "사진 처리에 실패했어요.";
      setPhotoError(message);
      setPhotoBlob(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setPhotoBusy(false);
    }
  }

  function clearPhoto() {
    setPhotoBlob(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoError(null);
  }

  const memoTrimmed = memo.trim();
  const hasPhoto = !!photoBlob;
  const canSubmit =
    !submitting && !photoBusy && (hasPhoto || memoTrimmed.length > 0);
  const memoOver = memo.length > MEMO_LIMIT;

  async function handleSubmit() {
    if (!canSubmit) return;

    if (isPublic && hasPhoto && !faceConsent) {
      setError("사람이 함께 나온 사진은 동의를 받은 뒤에만 공개할 수 있어요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.set("type", "memo");
    form.set("body", memoTrimmed);
    form.set("hasPhoto", hasPhoto ? "true" : "false");
    form.set("is_public", isPublic ? "true" : "false");
    form.set("face_consent", faceConsent ? "true" : "false");
    form.set("shop_id", shopId);
    form.set("idempotency_key", idempotencyKey);
    if (hasPhoto && photoBlob) {
      form.set("photo", photoBlob, "card.jpg");
    }

    const res = await fetch("/api/activities", {
      method: "POST",
      body: form,
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
  }

  const previewBackground = themeColor ?? DEFAULT_THEME;
  const todayLabel = formatToday();
  const memoCounterClass = memoOver
    ? "text-rose-500"
    : memo.length > MEMO_LIMIT - 20
      ? "text-[#C4956A]"
      : "text-[#AEAEB2]";

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_400px] lg:gap-12">
      <div>
        <AnimateOnScroll>
          <div className="mb-8">
            <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[3.5px] text-[#6BAF8A]">
              ENTRY · 카드 작성
            </p>
            <h1
              className="mb-2 font-bold leading-[1.2] tracking-[-1px] text-v2-ink"
              style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
            >
              오늘, 이곳에서
              <br />
              무엇을 봤나요?
            </h1>
            <p className="text-[14.5px] font-light leading-[1.75] text-v2-ink3">
              한 줄이면 충분해요. 잘 쓰지 않아도 괜찮아요.
              <br />
              짧은 메모가 다른 사람의 다음 발걸음이 될 수 있어요.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.08}>
          <div className="mb-7 inline-flex flex-wrap items-center gap-2 rounded-full border border-v2-rule bg-white px-4 py-2 text-[12px] font-medium text-v2-ink">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#6BAF8A" }}
            />
            QR · {qrTokenPreview} · {shopName}
            {shopAddress ? (
              <span className="text-[11px] font-light text-v2-ink3">
                · {shopAddress}
              </span>
            ) : null}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.16}>
          <FieldGroup label="사진 · 한 장 (선택)">
            <PhotoField
              previewUrl={photoPreview}
              busy={photoBusy}
              error={photoError}
              onPick={() => fileInputRef.current?.click()}
              onClear={clearPhoto}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handlePhotoChange}
            />
            <p className="mt-2 text-[11px] font-light leading-[1.6] text-[#AEAEB2]">
              사진은 자동으로 1024px 로 줄어들고 회전 정보가 보정돼서
              올라갑니다.
            </p>
          </FieldGroup>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.16}>
          <FieldGroup label="메모 · 한 줄">
            <div className="relative">
              <textarea
                maxLength={MEMO_HARD_LIMIT}
                placeholder="오늘 이곳에서 일어난 일을 짧게 적어주세요."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="h-[120px] w-full resize-none rounded-[10px] border-[1.5px] border-v2-rule bg-white px-4 py-3.5 text-[13.5px] leading-[1.75] text-v2-ink outline-none transition-colors focus:border-[#6BAF8A]"
              />
              <span
                className={`absolute bottom-3 right-3.5 text-[11px] ${memoCounterClass}`}
              >
                {memo.length} / {MEMO_LIMIT}
              </span>
            </div>
            {memoOver ? (
              <p className="mt-1.5 text-[11.5px] font-light text-rose-500">
                권장 길이를 넘었어요. 한 줄로 줄여보면 어떨까요?
              </p>
            ) : null}
          </FieldGroup>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.24}>
          <FieldGroup label="초상권 · 사진에 사람이 함께 나왔다면">
            <button
              type="button"
              onClick={() => setFaceConsent((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-v2-rule bg-white px-5 py-4 text-left transition-colors hover:border-[#C0C0B8]"
            >
              <div>
                <p className="mb-0.5 text-[13px] font-medium text-v2-ink">
                  함께 나온 사람들에게 공개 동의를 받았어요
                </p>
                <span className="text-[11.5px] font-light text-[#AEAEB2]">
                  공개 설정을 켜려면 동의가 필요해요. 사람이 없는 사진이면 그냥
                  넘어가셔도 됩니다.
                </span>
              </div>
              <Toggle on={faceConsent} />
            </button>
          </FieldGroup>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.24}>
          <FieldGroup label="공개 설정">
            <button
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-v2-rule bg-white px-5 py-4 text-left transition-colors hover:border-[#C0C0B8]"
            >
              <div>
                <p className="mb-0.5 text-[13px] font-medium text-v2-ink">
                  이 카드를 공개 피드에 보여도 좋습니다
                </p>
                <span className="text-[11.5px] font-light text-[#AEAEB2]">
                  언제든지 내 도감에서 변경할 수 있어요
                </span>
              </div>
              <Toggle on={isPublic} />
            </button>
          </FieldGroup>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.24}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-2 w-full rounded-xl bg-v2-ink px-4 py-4 text-[14px] font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#999] disabled:hover:scale-100"
          >
            {submitting ? "저장 중…" : "도감에 저장 →"}
          </button>
          {error ? (
            <p className="mt-2.5 text-center text-[11.5px] font-light text-rose-500">
              {error}
            </p>
          ) : (
            <p className="mt-2.5 text-center text-[11px] font-light text-[#AEAEB2]">
              카드는 도감에 자동 저장됩니다. 공개 여부는 작성 후 언제든 바꿀 수
              있어요.
            </p>
          )}
        </AnimateOnScroll>
      </div>

      <PreviewSection
        memo={memoTrimmed}
        place={shopName}
        background={previewBackground}
        photoUrl={photoPreview}
        isPublic={isPublic}
        nickname={nickname}
        nicknameInitial={nicknameInitial}
        todayLabel={todayLabel}
      />
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[2.5px] text-[#AEAEB2]">
        {label}
      </p>
      {children}
    </div>
  );
}

function PhotoField({
  previewUrl,
  busy,
  error,
  onPick,
  onClear,
}: {
  previewUrl: string | null;
  busy: boolean;
  error: string | null;
  onPick: () => void;
  onClear: () => void;
}) {
  if (previewUrl) {
    return (
      <div className="relative overflow-hidden rounded-[14px] border border-v2-rule bg-[#F5F4F1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="첨부한 사진 미리보기"
          className="block h-auto max-h-[360px] w-full object-cover"
        />
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button
            type="button"
            onClick={onPick}
            className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-v2-ink shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-colors hover:bg-white"
          >
            다른 사진
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-v2-ink3 shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-colors hover:text-rose-500"
          >
            삭제
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        className="flex w-full flex-col items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-v2-rule bg-white px-6 py-12 text-center transition-colors hover:border-[#6BAF8A] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="mb-1 text-[24px] leading-none">📷</span>
        <span className="text-[13px] font-medium text-v2-ink">
          {busy ? "사진을 불러오는 중…" : "사진 한 장 첨부 (선택)"}
        </span>
        <span className="mt-1 text-[11px] font-light text-[#AEAEB2]">
          카메라가 열리거나 갤러리에서 고를 수 있어요
        </span>
      </button>
      {error ? (
        <p className="mt-2 text-[11.5px] font-light text-rose-500">{error}</p>
      ) : null}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className="relative h-[26px] w-11 flex-shrink-0 rounded-full transition-colors duration-[250ms]"
      style={{ background: on ? "#6BAF8A" : "#D4D2CC" }}
    >
      <span
        className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-transform duration-[250ms]"
        style={{ transform: on ? "translateX(18px)" : "translateX(0)" }}
      />
    </span>
  );
}

function PreviewSection({
  memo,
  place,
  background,
  photoUrl,
  isPublic,
  nickname,
  nicknameInitial,
  todayLabel,
}: {
  memo: string;
  place: string;
  background: string;
  photoUrl: string | null;
  isPublic: boolean;
  nickname: string;
  nicknameInitial: string;
  todayLabel: string;
}) {
  const memoLine =
    memo.length > 0 ? memo : "(메모를 적으면 여기 미리보기가 채워져요)";

  return (
    <div className="lg:sticky lg:top-[88px]">
      <AnimateOnScroll delay={0.16}>
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[2.5px] text-[#AEAEB2]">
          LIVE PREVIEW · 적는 동안 카드가 그려집니다
        </p>

        <div
          className="mb-5 overflow-hidden rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
          style={{ background }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="block h-[180px] w-full object-cover"
            />
          ) : null}
          <div className="flex items-center justify-between px-5 pb-2.5 pt-4">
            <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[2px] text-white/70">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] text-white"
                aria-hidden
              >
                {nicknameInitial}
              </span>
              {nickname}
            </span>
            <span className="rounded bg-white/20 px-2 py-[3px] text-[9px] font-semibold tracking-[0.8px] text-white/90">
              {isPublic ? "공개" : "비공개"}
            </span>
          </div>
          <div className="px-5 pb-5 pt-1.5">
            <p
              className="min-h-[60px] whitespace-pre-line text-[14px] font-medium leading-[1.7] text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
            >
              {memoLine}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
              <span className="text-[11px] font-light text-white/60">
                @ {place}
              </span>
              <span className="text-[11px] font-light text-white/50">
                {todayLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-2xl px-5 pb-5 pt-4 shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
          style={{ background: "#1A1A1A" }}
        >
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[2px] text-white/30">
            뒷면 · BACK
          </p>
          <p className="min-h-[48px] text-[13.5px] font-light italic leading-[1.8] text-white/80">
            {memo.length > 0
              ? `“${memo}”`
              : "(메모를 적으면 여기 미리보기가 채워져요)"}
          </p>
          <div className="mt-4 flex justify-between border-t border-white/[0.08] pt-3 text-[10.5px] text-white/30">
            <span>{place}</span>
            <span>{todayLabel}</span>
          </div>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

function formatToday(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
