import type { ProgressType } from "@/lib/schemas/project";

/**
 * 프로젝트 진척도 계산.
 *
 * progress_type 에 따라 서로 다른 입력을 쓰지만, 반환은 동일하게
 *   { percent, current, target, label, note? }
 * 으로 통일해서 UI 가 분기하지 않도록 한다.
 *
 *   time  : 시작일~종료일 기준 경과일 / 총일수
 *   event : completed 에피소드 수 / total_episodes
 *   goal  : 공개 카드 수 / target_cards  (또는 참여자 수 / target_participants)
 *   mixed : 현재는 event 와 동일하게 처리 — Phase 7 에서 확장
 *
 * target 데이터가 잘못되었거나 0/비어있으면 `percent=0, note='target_missing'`
 * 로 돌려준다 — UI 에서 "기준 미설정" 으로 표시하라는 신호.
 */

export type ProgressInputs = {
  progress_type: ProgressType;
  progress_target: Record<string, unknown>;
  /** event / mixed 용. 완료 에피소드 수. */
  completedEpisodes?: number;
  /** event / mixed 용. 총 에피소드 수(실제 DB 값 — target 미설정 시 fallback). */
  totalEpisodes?: number;
  /** goal 용. 공개 카드 수. */
  publicActivities?: number;
  /** goal 용. 고유 참여자 수. */
  distinctParticipants?: number;
  /** 참조 시각(now). 테스트/SSR 일관성 위해 주입 가능. 기본 Date.now. */
  nowMs?: number;
};

export type ProgressResult = {
  percent: number; // 0~100 (정수 반올림)
  current: number;
  target: number;
  label: string; // "45일 / 90일", "2 / 5 회차" 등
  note?: "target_missing" | "not_started" | "completed";
};

export function calculateProgress(input: ProgressInputs): ProgressResult {
  switch (input.progress_type) {
    case "time":
      return calcTime(input);
    case "event":
    case "mixed":
      return calcEvent(input);
    case "goal":
      return calcGoal(input);
  }
}

function calcTime(input: ProgressInputs): ProgressResult {
  const start = parseDate(input.progress_target.start_date);
  const end = parseDate(input.progress_target.end_date);
  if (!start || !end || end <= start) {
    return empty("기간 미설정", "target_missing");
  }
  const now = input.nowMs ?? Date.now();
  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
  if (now < start) {
    return {
      percent: 0,
      current: 0,
      target: totalDays,
      label: `아직 시작 전 · 총 ${totalDays}일`,
      note: "not_started",
    };
  }
  if (now >= end) {
    return {
      percent: 100,
      current: totalDays,
      target: totalDays,
      label: `완료 · ${totalDays}일`,
      note: "completed",
    };
  }
  const elapsedDays = Math.max(
    0,
    Math.min(totalDays, Math.round((now - start) / DAY_MS))
  );
  return {
    percent: clampPercent((elapsedDays / totalDays) * 100),
    current: elapsedDays,
    target: totalDays,
    label: `${elapsedDays}일 / ${totalDays}일`,
  };
}

function calcEvent(input: ProgressInputs): ProgressResult {
  const targetFromConfig = positiveInt(input.progress_target.total_episodes);
  const target = targetFromConfig ?? input.totalEpisodes ?? 0;
  const current = input.completedEpisodes ?? 0;

  if (target <= 0) {
    return empty(`완료 ${current}회차`, "target_missing");
  }
  const percent = clampPercent((current / target) * 100);
  return {
    percent,
    current,
    target,
    label: `${current} / ${target} 회차`,
    note: current >= target ? "completed" : undefined,
  };
}

function calcGoal(input: ProgressInputs): ProgressResult {
  const cardTarget = positiveInt(input.progress_target.target_cards);
  const participantTarget = positiveInt(
    input.progress_target.target_participants
  );

  if (cardTarget) {
    const current = input.publicActivities ?? 0;
    return finishGoal(current, cardTarget, "장");
  }
  if (participantTarget) {
    const current = input.distinctParticipants ?? 0;
    return finishGoal(current, participantTarget, "명");
  }
  return empty("목표 미설정", "target_missing");
}

function finishGoal(
  current: number,
  target: number,
  unit: string
): ProgressResult {
  const percent = clampPercent((current / target) * 100);
  return {
    percent,
    current,
    target,
    label: `${current} / ${target}${unit}`,
    note: current >= target ? "completed" : undefined,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function clampPercent(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function positiveInt(v: unknown): number | null {
  if (typeof v !== "number") return null;
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.floor(v);
}

function parseDate(v: unknown): number | null {
  if (typeof v !== "string") return null;
  // YYYY-MM-DD -> 해당 날짜 자정 (UTC 기준은 피함 — 로컬)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!match) return null;
  const [, y, m, d] = match;
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(dt.getTime()) ? null : dt.getTime();
}

function empty(
  label: string,
  note: ProgressResult["note"] = "target_missing"
): ProgressResult {
  return { percent: 0, current: 0, target: 0, label, note };
}
