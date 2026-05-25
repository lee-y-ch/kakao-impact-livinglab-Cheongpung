import { z } from "zod";

/**
 * 사이트 설정 (랜딩 hero) 스키마.
 *
 * /admin/site 폼에서 multipart 로 전송. 이미지는 별도 File 로 처리하고
 * 여기서는 텍스트 필드만 검증한다.
 *
 * 빈 문자열은 null 로 정규화 — DB 에서 미설정과 동일 취급.
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

export const HeroUpdateSchema = z.object({
  hero_eyebrow: optionalText(120),
  hero_title: optionalText(200),
  hero_accent: optionalText(80),
  hero_subtitle: optionalText(400),
});

export type HeroUpdateInput = z.infer<typeof HeroUpdateSchema>;
