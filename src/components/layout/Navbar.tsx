import { getCurrentActor } from "@/lib/auth/current-actor";

import { NavbarClient, type NavActive } from "./NavbarClient";

export type { NavActive };

/**
 * v2 redesign — server wrapper.
 * actor 해석은 서버에서 처리하고, 스크롤/모바일 메뉴만 client component 에 맡긴다.
 */
export async function Navbar({ active = null }: { active?: NavActive }) {
  const actor = await getCurrentActor();
  return <NavbarClient active={active} actor={actor} />;
}
