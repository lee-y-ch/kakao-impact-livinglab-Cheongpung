import { z } from "zod";

import { SlugSchema, UuidSchema } from "./common";

/**
 * 프로젝트 CRUD 스키마.
 *
 * progress_type 별로 progress_target 의 필수 키가 다르다:
 *   time  → { start_date: ISODate, end_date: ISODate }
 *   event → { total_episodes: number }
 *   goal  → { target_cards?: number, target_participants?: number } (최소 하나)
 *   mixed → 자유 구조 (Phase 5 에서 계산기 확장)
 */

export const ProgressTypeSchema = z.enum(["time", "event", "goal", "mixed"]);
export type ProgressType = z.infer<typeof ProgressTypeSchema>;

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.");

const TimeTargetSchema = z.object({
  start_date: IsoDateSchema,
  end_date: IsoDateSchema,
});

const EventTargetSchema = z.object({
  total_episodes: z.number().int().min(1),
});

const GoalTargetSchema = z
  .object({
    target_cards: z.number().int().min(1).optional(),
    target_participants: z.number().int().min(1).optional(),
  })
  .refine((v) => v.target_cards || v.target_participants, {
    message: "목표 카드 수 또는 목표 참여자 수 중 하나는 입력해주세요.",
  });

export const ProgressTargetSchema = z.record(z.string(), z.unknown());

const ProjectBaseSchema = z.object({
  category_id: UuidSchema,
  slug: SlugSchema,
  title: z.string().trim().min(1).max(120),
  summary: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  description: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  is_public: z.boolean().default(true),
  progress_type: ProgressTypeSchema,
  progress_target: ProgressTargetSchema,
});

export const ProjectCreateSchema = ProjectBaseSchema.superRefine((val, ctx) => {
  validateProgressTarget(val.progress_type, val.progress_target, ctx);
});

export const ProjectUpdateSchema = ProjectBaseSchema.partial()
  .extend({
    progress_type: ProgressTypeSchema.optional(),
    progress_target: ProgressTargetSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.progress_type && val.progress_target !== undefined) {
      validateProgressTarget(val.progress_type, val.progress_target, ctx);
    }
  });

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;

function validateProgressTarget(
  type: ProgressType,
  target: Record<string, unknown>,
  ctx: z.RefinementCtx
) {
  const path = ["progress_target"];
  if (type === "time") {
    const r = TimeTargetSchema.safeParse(target);
    if (!r.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: "시작일·종료일을 YYYY-MM-DD 로 입력해주세요.",
      });
    }
  } else if (type === "event") {
    const r = EventTargetSchema.safeParse(target);
    if (!r.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: "총 회차 수(정수)를 입력해주세요.",
      });
    }
  } else if (type === "goal") {
    const r = GoalTargetSchema.safeParse(target);
    if (!r.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: "목표 카드 수 또는 목표 참여자 수 중 하나는 입력해주세요.",
      });
    }
  }
  // mixed 는 자유 구조 — 검증 생략
}
