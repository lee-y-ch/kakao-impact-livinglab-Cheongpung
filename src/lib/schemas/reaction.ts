import { z } from "zod";

import { UuidSchema } from "./common";

/**
 * reaction 생성 입력.
 *
 * kind 별 규칙:
 *   - hi_five : body 생략 가능 (버튼 1회 클릭 = 응원 1건)
 *   - note    : body 필수 (크루·관리자 현장 메모)
 *   - letter  : body 필수 (사장님 편지 — Phase 4 에서 LLM 초안 포함)
 *
 * author_role 은 route handler 에서 주입 — 클라이언트가 설정하지 못하게.
 */
export const ReactionKindSchema = z.enum(["hi_five", "note", "letter"]);
export type ReactionKind = z.infer<typeof ReactionKindSchema>;

export const ReactionVisibilitySchema = z.enum(["public", "private"]);
export type ReactionVisibility = z.infer<typeof ReactionVisibilitySchema>;

export const ReactionCreateSchema = z
  .object({
    activityId: UuidSchema,
    kind: ReactionKindSchema,
    body: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    llmDraft: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    visibility: ReactionVisibilitySchema.default("private"),
  })
  .superRefine((val, ctx) => {
    if ((val.kind === "note" || val.kind === "letter") && !val.body) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body"],
        message: "메모/편지 본문이 필요합니다.",
      });
    }
  });

export type ReactionCreateInput = z.infer<typeof ReactionCreateSchema>;
