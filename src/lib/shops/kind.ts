export const SHOP_KIND_ORDER = [
  "책방",
  "카페",
  "시장",
  "숙소",
  "커뮤니티 공간",
  "강화 가게",
] as const;

export type ShopKind = (typeof SHOP_KIND_ORDER)[number];

export function inferShopKind(
  name: string,
  description: string | null
): ShopKind {
  const text = `${name} ${description ?? ""}`;
  if (/(책방|서점|책)/.test(text)) return "책방";
  if (/(시장|오일장|상인)/.test(text)) return "시장";
  if (/(게스트하우스|손님방|숙소|잠들)/.test(text)) return "숙소";
  if (/(사랑방|마루|모임)/.test(text)) return "커뮤니티 공간";
  if (/(카페|커피|차)/.test(text)) return "카페";
  return "강화 가게";
}
