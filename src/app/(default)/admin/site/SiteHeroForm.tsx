"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export type HeroInitial = {
  hero_eyebrow: string;
  hero_title: string;
  hero_accent: string;
  hero_subtitle: string;
  hero_image_url: string;
};

/**
 * /admin/site hero 편집 폼.
 *
 * 텍스트 4개 + 이미지 파일 업로드. 저장 시 multipart 로 POST /api/admin/site.
 * 이미지를 새로 고르면 미리보기를 즉시 갱신하고, 저장 전까지는 업로드하지 않는다.
 */
export function SiteHeroForm({ initial }: { initial: HeroInitial }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [eyebrow, setEyebrow] = useState(initial.hero_eyebrow);
  const [title, setTitle] = useState(initial.hero_title);
  const [accent, setAccent] = useState(initial.hero_accent);
  const [subtitle, setSubtitle] = useState(initial.hero_subtitle);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial.hero_image_url || null
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 올릴 수 있어요.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지는 10MB 이하만 올릴 수 있어요.");
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const form = new FormData();
    form.set("hero_eyebrow", eyebrow);
    form.set("hero_title", title);
    form.set("hero_accent", accent);
    form.set("hero_subtitle", subtitle);
    if (imageFile) form.set("image", imageFile);

    try {
      const res = await fetch("/api/admin/site", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setError(
          data.message ?? "저장하지 못했어요. 잠시 후 다시 시도해주세요."
        );
        return;
      }
      setMessage("메인 화면이 업데이트됐어요. 홈에서 바로 확인해보세요.");
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 lg:flex-row">
      {/* 입력 */}
      <div className="flex flex-1 flex-col gap-5">
        <Field label="작은 라벨 (eyebrow)" hint="제목 위 작은 영문/연도 라벨">
          <input
            type="text"
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            maxLength={120}
            placeholder="예: Ganghwa Universe · 2026"
            className={inputClass}
          />
        </Field>

        <Field
          label="제목 (title)"
          hint="줄바꿈은 Enter 로. 강조할 단어는 아래 칸에 입력하세요."
        >
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder={"예: 환대로\n만들어가는 세계"}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field
          label="강조 단어 (accent)"
          hint="제목 안에서 초록색으로 강조할 단어. 비워두면 강조 없음."
        >
          <input
            type="text"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            maxLength={80}
            placeholder="예: 세계"
            className={inputClass}
          />
        </Field>

        <Field label="부제 (subtitle)" hint="줄바꿈은 Enter 로.">
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={400}
            rows={3}
            placeholder={"예: 우리가 살고 싶은 세계를\n강화에서 함께 실험해요."}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field
          label="배경 이미지"
          hint="JPG/PNG/WebP, 10MB 이하. 가로로 긴 사진을 권장해요."
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPickImage}
            className="block w-full text-sm text-v2-ink3 file:mr-3 file:rounded-md file:border-0 file:bg-v2-ink file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#333]"
          />
        </Field>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#6BAF8A] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5A9B78] disabled:cursor-wait disabled:opacity-70"
          >
            {saving ? "저장 중…" : "저장하기"}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#6BAF8A] hover:underline"
          >
            홈에서 확인 →
          </a>
        </div>

        {message ? (
          <p className="rounded-md border border-[rgba(107,175,138,0.3)] bg-[rgba(107,175,138,0.08)] px-3 py-2 text-sm text-[#3A7A55]">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      {/* 미리보기 */}
      <div className="lg:w-[380px]">
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[2px] text-[#AEAEB2]">
          미리보기
        </p>
        <HeroPreview
          eyebrow={eyebrow}
          title={title}
          accent={accent}
          subtitle={subtitle}
          previewUrl={previewUrl}
        />
        <p className="mt-2 text-[11px] font-light leading-[1.6] text-[#AEAEB2]">
          실제 메인 화면은 더 크게 표시돼요. 색감·문구 위치를 확인하는 용도예요.
        </p>
      </div>
    </form>
  );
}

function HeroPreview({
  eyebrow,
  title,
  accent,
  subtitle,
  previewUrl,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  previewUrl: string | null;
}) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#1A1A1A]">
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt="hero 미리보기"
          fill
          sizes="380px"
          className="object-cover"
          unoptimized
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.35)" }}
      />
      <div className="absolute inset-0 flex flex-col justify-center px-6">
        {eyebrow ? (
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[3px] text-white/70">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mb-3 whitespace-pre-line text-[22px] font-bold leading-[1.15] tracking-[-0.5px] text-white">
          {renderTitleWithAccent(title, accent)}
        </h3>
        {subtitle ? (
          <p className="whitespace-pre-line text-[11px] font-light leading-[1.6] text-white/80">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function renderTitleWithAccent(title: string, accent: string) {
  if (!accent || !title.includes(accent)) return title;
  const parts = title.split(accent);
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 ? (
        <span style={{ color: "#2ECC8E" }}>{accent}</span>
      ) : null}
    </span>
  ));
}

const inputClass =
  "w-full rounded-lg border border-v2-rule bg-white px-3.5 py-2.5 text-sm text-v2-ink outline-none transition-colors focus:border-[#6BAF8A]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-v2-ink">{label}</span>
      {hint ? (
        <span className="text-[11.5px] text-[#AEAEB2]">{hint}</span>
      ) : null}
      {children}
    </label>
  );
}
