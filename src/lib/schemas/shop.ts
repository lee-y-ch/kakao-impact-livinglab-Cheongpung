import { z } from "zod";

/**
 * 가게 / 사장님 스키마.
 *
 * shops.qr_token — 8~32자 영문·숫자·하이픈 (참여자 QR URL: /entry/<qr_token>).
 *   관리자가 수기 입력할 수도 있고, 비워두면 서버에서 랜덤 생성.
 *
 * shop_owners — 사장님 한 사람 단위.
 *   owner_code 는 서버가 발급(8자리). 등록/재발급 응답에만 포함되고 DB 에는 bcrypt 해시만 저장.
 */

const QrTokenSchema = z
  .string()
  .trim()
  .min(4, "qr_token 은 4자 이상입니다.")
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "소문자·숫자·하이픈만 허용됩니다.");

const BaseShopSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  address: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  is_public: z.boolean().default(true),
  qr_token: QrTokenSchema.optional(),
});

export const ShopCreateSchema = BaseShopSchema;

export const ShopUpdateSchema = BaseShopSchema.partial();

export type ShopCreateInput = z.infer<typeof ShopCreateSchema>;
export type ShopUpdateInput = z.infer<typeof ShopUpdateSchema>;

export const ShopOwnerCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
});
export type ShopOwnerCreateInput = z.infer<typeof ShopOwnerCreateSchema>;
