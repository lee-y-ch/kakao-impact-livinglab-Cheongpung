import { z } from "zod";

import { UuidSchema } from "./common";

/**
 * 에피소드 CRUD 스키마.
 * status 는 'planned' | 'in_progress' | 'completed' — 크루가 업데이트.
 * session_date 는 YYYY-MM-DD (date 컬럼).
 */

export const EpisodeStatusSchema = z.enum([
  "planned",
  "in_progress",
  "completed",
]);
export type EpisodeStatus = z.infer<typeof EpisodeStatusSchema>;

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.");

const BaseSchema = z.object({
  project_id: UuidSchema,
  seq: z.number().int().min(1).nullable().optional(),
  title: z.string().trim().min(1).max(120),
  summary: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  session_date: IsoDateSchema.nullable().optional(),
  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  is_public: z.boolean().default(true),
  status: EpisodeStatusSchema.default("planned"),
});

/** POST — project_id 는 경로에서 주입하므로 바디에선 생략. */
export const EpisodeCreateSchema = BaseSchema.omit({ project_id: true });

export const EpisodeUpdateSchema = BaseSchema.omit({
  project_id: true,
}).partial();

export type EpisodeCreateInput = z.infer<typeof EpisodeCreateSchema>;
export type EpisodeUpdateInput = z.infer<typeof EpisodeUpdateSchema>;
