"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { EpisodeStatus } from "@/lib/schemas/episode";

/**
 * 프로젝트 편집 화면의 "에피소드(회차) 섹션".
 *
 * - 상단: 새 에피소드 추가 폼
 * - 하단: 기존 에피소드 목록 + 인라인 편집(제목·날짜·상태·공개) + 삭제
 */

export type EpisodeRow = {
  id: string;
  seq: number | null;
  title: string;
  summary: string | null;
  session_date: string | null;
  location: string | null;
  is_public: boolean;
  status: EpisodeStatus;
};

type Props = {
  projectId: string;
  episodes: EpisodeRow[];
};

const STATUS_LABEL: Record<EpisodeStatus, string> = {
  planned: "예정",
  in_progress: "진행",
  completed: "완료",
};

export function EpisodeSection({ projectId, episodes }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <NewEpisodeForm projectId={projectId} />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">
          등록된 회차 ({episodes.length})
        </h3>

        {episodes.length === 0 ? (
          <p className="v2-legacy-empty">
            아직 회차가 없어요. 위에서 새 회차를 추가해주세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {episodes.map((ep) => (
              <EpisodeRowEditor key={ep.id} episode={ep} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NewEpisodeForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [seq, setSeq] = useState("");
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<EpisodeStatus>("planned");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (title.trim().length === 0) {
      setError("회차 제목을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      seq: seq === "" ? null : Number(seq),
      title: title.trim(),
      summary: summary.trim() || undefined,
      session_date: sessionDate === "" ? null : sessionDate,
      location: location.trim() || undefined,
      is_public: isPublic,
      status,
    };

    const res = await fetch(`/api/admin/projects/${projectId}/episodes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errPayload = await res.json().catch(() => null);
      setError(
        (errPayload &&
          typeof errPayload.message === "string" &&
          errPayload.message) ||
          "저장에 실패했어요."
      );
      setSubmitting(false);
      return;
    }

    setSeq("");
    setTitle("");
    setSummary("");
    setSessionDate("");
    setLocation("");
    setIsPublic(true);
    setStatus("planned");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="v2-legacy-panel flex flex-col gap-3 p-4"
    >
      <h3 className="text-sm font-semibold">새 회차 추가</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[100px_1fr]">
        <LabeledField label="회차 번호 (선택)">
          <input
            type="number"
            min={1}
            value={seq}
            onChange={(e) => setSeq(e.target.value)}
            placeholder="1"
            className={inputClass}
          />
        </LabeledField>
        <LabeledField label="회차 제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="1회차 — 오리엔테이션"
            className={inputClass}
          />
        </LabeledField>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LabeledField label="진행 날짜 (선택)">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className={inputClass}
          />
        </LabeledField>
        <LabeledField label="장소 (선택)">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="강화읍 OO카페"
            className={inputClass}
          />
        </LabeledField>
      </div>

      <LabeledField label="요약 (선택)">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </LabeledField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LabeledField label="상태">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EpisodeStatus)}
            className={inputClass}
          >
            <option value="planned">예정</option>
            <option value="in_progress">진행</option>
            <option value="completed">완료</option>
          </select>
        </LabeledField>

        <LabeledField label="공개 여부">
          <label className="flex h-[44px] items-center gap-2 text-sm text-v2-ink2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            공개 페이지에 노출
          </label>
        </LabeledField>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="v2-legacy-button self-start"
      >
        {submitting ? "추가 중..." : "회차 추가"}
      </button>
    </form>
  );
}

function EpisodeRowEditor({ episode }: { episode: EpisodeRow }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [seq, setSeq] = useState(
    episode.seq === null ? "" : String(episode.seq)
  );
  const [title, setTitle] = useState(episode.title);
  const [summary, setSummary] = useState(episode.summary ?? "");
  const [sessionDate, setSessionDate] = useState(episode.session_date ?? "");
  const [location, setLocation] = useState(episode.location ?? "");
  const [isPublic, setIsPublic] = useState(episode.is_public);
  const [status, setStatus] = useState<EpisodeStatus>(episode.status);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (submitting) return;
    if (title.trim().length === 0) {
      setError("회차 제목을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      seq: seq === "" ? null : Number(seq),
      title: title.trim(),
      summary: summary.trim() || undefined,
      session_date: sessionDate === "" ? null : sessionDate,
      location: location.trim() || undefined,
      is_public: isPublic,
      status,
    };

    const res = await fetch(`/api/admin/episodes/${episode.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errPayload = await res.json().catch(() => null);
      setError(
        (errPayload &&
          typeof errPayload.message === "string" &&
          errPayload.message) ||
          "저장에 실패했어요."
      );
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("이 회차를 삭제할까요? 하위 카드도 함께 사라집니다."))
      return;
    setSubmitting(true);
    const res = await fetch(`/api/admin/episodes/${episode.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("삭제에 실패했어요.");
      setSubmitting(false);
      return;
    }
    router.refresh();
  }

  if (!editing) {
    return (
      <li className="v2-legacy-panel flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2 text-sm font-medium">
            {episode.seq !== null ? (
              <span className="text-v2-ink3">{episode.seq}회차</span>
            ) : null}
            <span className="truncate">{episode.title}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-v2-ink3">
            <span>상태 · {STATUS_LABEL[episode.status]}</span>
            {episode.session_date ? (
              <span>· {episode.session_date}</span>
            ) : null}
            {episode.location ? <span>· {episode.location}</span> : null}
            <span>· {episode.is_public ? "공개" : "비공개"}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="v2-legacy-button-muted shrink-0 !px-3 !py-2 !text-xs"
        >
          편집
        </button>
      </li>
    );
  }

  return (
    <li className="v2-legacy-panel flex flex-col gap-3 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[100px_1fr]">
        <LabeledField label="회차 번호">
          <input
            type="number"
            min={1}
            value={seq}
            onChange={(e) => setSeq(e.target.value)}
            className={inputClass}
          />
        </LabeledField>
        <LabeledField label="제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </LabeledField>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LabeledField label="날짜">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className={inputClass}
          />
        </LabeledField>
        <LabeledField label="장소">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          />
        </LabeledField>
      </div>

      <LabeledField label="요약">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </LabeledField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LabeledField label="상태">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EpisodeStatus)}
            className={inputClass}
          >
            <option value="planned">예정</option>
            <option value="in_progress">진행</option>
            <option value="completed">완료</option>
          </select>
        </LabeledField>
        <LabeledField label="공개 여부">
          <label className="flex h-[44px] items-center gap-2 text-sm text-v2-ink2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            공개 페이지에 노출
          </label>
        </LabeledField>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="v2-legacy-button !px-4 !py-2"
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={submitting}
            className="v2-legacy-button-muted !px-3 !py-2 !text-xs"
          >
            취소
          </button>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="text-xs font-medium text-destructive underline underline-offset-4"
        >
          이 회차 삭제
        </button>
      </div>
    </li>
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
