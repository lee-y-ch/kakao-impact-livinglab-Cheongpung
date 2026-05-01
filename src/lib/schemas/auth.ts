import { z } from "zod";

/**
 * 사장님 가게 코드 로그인.
 *
 * 가게 코드는 관리자가 발급 (숫자·영문 8자리). bcrypt 로 해시 저장.
 * 코드만으로는 가게 식별 불가 → shopSlug 동반.
 */
export const OwnerLoginSchema = z.object({
  shopSlug: z.string().trim().min(1, "가게를 선택해 주세요.").max(64),
  code: z
    .string()
    .trim()
    .min(8, "가게 코드는 8자리입니다.")
    .max(32, "가게 코드 형식이 올바르지 않습니다.")
    .regex(/^[A-Za-z0-9-]+$/, "영문·숫자·하이픈만 허용됩니다."),
});

export type OwnerLoginInput = z.infer<typeof OwnerLoginSchema>;

/**
 * 관리자 로그인.
 * Phase 1: 청풍 운영자 1명 ~ 소수. 이메일 / 비밀번호.
 */
export const AdminLoginSchema = z.object({
  email: z.string().trim().email("이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 8자 이상입니다.").max(200),
});

export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

/**
 * 크루 공용 코드 로그인 (Phase 3 에 실제 사용).
 * Phase 1 에는 스키마만 선 정의.
 */
export const CrewLoginSchema = z.object({
  code: z.string().trim().min(6, "크루 코드는 6자 이상입니다.").max(64),
});

export type CrewLoginInput = z.infer<typeof CrewLoginSchema>;
