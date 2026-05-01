import { z } from "zod";

import { UuidSchema } from "./common";

/**
 * 참여자 행위(activity) 생성 입력.
 *
 * 게임 규칙:
 *   - 사진 또는 메모 중 최소 하나. 둘 다 비면 저장 불가.
 *   - face_consent 체크해야 사람이 사진에 찍혀도 공개 가능.
 *   - is_public 기본 false (opt-in 공개).
 *   - shop/episode/project 중 최소 하나의 맥락.
 *   - idempotency_key: 클라이언트가 생성한 UUID. 네트워크 재전송 중복 방지.
 *
 * FormData 로 넘어오기 때문에 boolean/optional 은 문자열 파싱 후 코어시전.
 */

export const ActivityTypeSchema = z.enum([
  "memo",
  "photo",
  "check_in",
  "workshop",
  "hi_five",
  "artifact",
  "archive_link",
]);

export type ActivityType = z.infer<typeof ActivityTypeSchema>;

/** boolean 을 "true"/"false" 문자열로도 받을 수 있게. */
const BooleanLike = z
  .union([z.boolean(), z.literal("true"), z.literal("false")])
  .transform((v) => v === true || v === "true");

export const ActivityCreateSchema = z
  .object({
    type: ActivityTypeSchema.default("memo"),

    /** 한 줄 메모 또는 짧은 설명. 공백만이면 빈 것으로 간주. */
    body: z
      .string()
      .trim()
      .max(2000, "메모는 2000자까지입니다.")
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),

    /** 카드 제목 (생략 가능, 미래 확장용). */
    title: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),

    /** photo 가 있으면 (클라이언트) Storage 업로드 후 URL 이 설정됨. 여기선 입력 검증만. */
    hasPhoto: BooleanLike.default(false),

    is_public: BooleanLike.default(false),
    face_consent: BooleanLike.default(false),

    /** 맥락 — 최소 하나 필요. */
    shop_id: UuidSchema.optional(),
    episode_id: UuidSchema.optional(),
    project_id: UuidSchema.optional(),

    /** 클라이언트 생성 UUID. */
    idempotency_key: UuidSchema,
  })
  .superRefine((val, ctx) => {
    if (!val.body && !val.hasPhoto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "사진 또는 메모 중 하나는 꼭 필요해요.",
        path: ["body"],
      });
    }
    if (!val.shop_id && !val.episode_id && !val.project_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "가게·에피소드·프로젝트 중 하나의 맥락이 필요합니다.",
        path: ["shop_id"],
      });
    }
  });

export type ActivityCreateInput = z.infer<typeof ActivityCreateSchema>;
