"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ProgressType } from "@/lib/schemas/project";

/**
 * 프로젝트 생성/수정 폼 — 관리자 전용.
 * progress_type 에 따라 target 입력 필드가 바뀐다.
 */

type Category = { id: string; slug: string; name: string };

type InitialValues = {
  id?: string;
  category_id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  description?: string;
  is_public?: boolean;
  progress_type?: ProgressType;
  progress_target?: Record<string, unknown>;
};

type Props = {
  categories: Category[];
  initial?: InitialValues;
  /** 작성/수정 완료 후 돌아갈 경로. 기본 /admin/projects. */
  returnTo?: string;
};

export function ProjectForm({ categories, initial, returnTo }: Props) {
  const router = useRouter();
  const editing = Boolean(initial?.id);

  const [categoryId, setCategoryId] = useState(
    initial?.category_id ?? categories[0]?.id ?? ""
  );
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? true);
  const [progressType, setProgressType] = useState<ProgressType>(
    initial?.progress_type ?? "time"
  );

  const initialTarget = (initial?.progress_target ?? {}) as Record<
    string,
    unknown
  >;
  const [startDate, setStartDate] = useState(
    stringOrEmpty(initialTarget.start_date)
  );
  const [endDate, setEndDate] = useState(stringOrEmpty(initialTarget.end_date));
  const [totalEpisodes, setTotalEpisodes] = useState(
    numberOrEmpty(initialTarget.total_episodes)
  );
  const [targetCards, setTargetCards] = useState(
    numberOrEmpty(initialTarget.target_cards)
  );
  const [targetParticipants, setTargetParticipants] = useState(
    numberOrEmpty(initialTarget.target_participants)
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildTarget(): Record<string, unknown> {
    if (progressType === "time") {
      return { start_date: startDate, end_date: endDate };
    }
    if (progressType === "event") {
      return { total_episodes: Number(totalEpisodes) };
    }
    if (progressType === "goal") {
      const t: Record<string, unknown> = {};
      if (targetCards !== "") t.target_cards = Number(targetCards);
      if (targetParticipants !== "")
        t.target_participants = Number(targetParticipants);
      return t;
    }
    return {};
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      category_id: categoryId,
      slug: slug.trim(),
      title: title.trim(),
      summary: summary.trim() || undefined,
      description: description.trim() || undefined,
      is_public: isPublic,
      progress_type: progressType,
      progress_target: buildTarget(),
    };

    const endpoint = editing
      ? `/api/admin/projects/${initial?.id}`
      : "/api/admin/projects";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const payloadErr = await res.json().catch(() => null);
      setError(
        (payloadErr &&
          typeof payloadErr.message === "string" &&
          payloadErr.message) ||
          "저장에 실패했어요."
      );
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.replace(returnTo ?? "/admin/projects");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (
      !window.confirm(
        "이 프로젝트와 하위 에피소드가 모두 삭제됩니다. 계속할까요?"
      )
    )
      return;
    setSubmitting(true);
    const res = await fetch(`/api/admin/projects/${initial.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("삭제에 실패했어요.");
      setSubmitting(false);
      return;
    }
    router.replace("/admin/projects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LabeledField label="카테고리">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </LabeledField>

        <LabeledField label="slug (URL)">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="weekend-yoga-club"
            className={inputClass}
          />
        </LabeledField>
      </div>

      <LabeledField label="프로젝트 제목">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </LabeledField>

      <LabeledField label="요약 (목록 카드용, 1~2문장)">
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={inputClass}
        />
      </LabeledField>

      <LabeledField label="상세 설명 (선택)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputClass}
        />
      </LabeledField>

      <LabeledField label="공개 여부">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          공개 페이지에 노출
        </label>
      </LabeledField>

      <fieldset className="v2-legacy-panel-soft flex flex-col gap-3 p-4">
        <legend className="px-1 text-sm font-medium">진척도 계산 기준</legend>

        <LabeledField label="기준 유형">
          <select
            value={progressType}
            onChange={(e) => setProgressType(e.target.value as ProgressType)}
            className={inputClass}
          >
            <option value="time">기간 기반 (time)</option>
            <option value="event">회차 기반 (event)</option>
            <option value="goal">목표치 기반 (goal)</option>
            <option value="mixed">복합 (mixed)</option>
          </select>
        </LabeledField>

        {progressType === "time" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledField label="시작일 (YYYY-MM-DD)">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </LabeledField>
            <LabeledField label="종료일 (YYYY-MM-DD)">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </LabeledField>
          </div>
        ) : null}

        {progressType === "event" ? (
          <LabeledField label="총 회차 수">
            <input
              type="number"
              min={1}
              value={totalEpisodes}
              onChange={(e) => setTotalEpisodes(e.target.value)}
              className={inputClass}
            />
          </LabeledField>
        ) : null}

        {progressType === "goal" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledField label="목표 카드 수 (선택)">
              <input
                type="number"
                min={1}
                value={targetCards}
                onChange={(e) => setTargetCards(e.target.value)}
                className={inputClass}
              />
            </LabeledField>
            <LabeledField label="목표 참여자 수 (선택)">
              <input
                type="number"
                min={1}
                value={targetParticipants}
                onChange={(e) => setTargetParticipants(e.target.value)}
                className={inputClass}
              />
            </LabeledField>
          </div>
        ) : null}

        {progressType === "mixed" ? (
          <p className="text-xs text-muted-foreground">
            복합 기준은 Phase 5 에서 프로젝트별로 계산기를 확장합니다. 지금은
            유형만 저장해두세요.
          </p>
        ) : null}
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="v2-legacy-button"
        >
          {submitting
            ? "저장 중..."
            : editing
              ? "수정 저장"
              : "프로젝트 만들기"}
        </button>
        {editing ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="text-xs font-medium text-destructive underline underline-offset-4"
          >
            이 프로젝트 삭제
          </button>
        ) : null}
      </div>
    </form>
  );
}

const inputClass = "v2-legacy-input text-sm";

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs text-v2-ink3">{label}</span>
      {children}
    </label>
  );
}

function stringOrEmpty(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function numberOrEmpty(v: unknown): string {
  if (typeof v === "number") return String(v);
  if (typeof v === "string" && v.length > 0) return v;
  return "";
}
