import { z } from "zod";

/** UUID v4 검증. Supabase 기본 id 형식. */
export const UuidSchema = z.string().uuid();

/** slug — 영문 소문자·숫자·하이픈. */
export const SlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "소문자·숫자·하이픈만 허용됩니다.");

/** `user_id`, `shop_id` 등 id 파라미터 파싱용. */
export const IdParamSchema = z.object({
  id: UuidSchema,
});
