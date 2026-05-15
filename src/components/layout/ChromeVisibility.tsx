"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NO_CHROME_PREFIXES = ["/admin", "/owner"];

function shouldShowChrome(pathname: string | null): boolean {
  if (!pathname) return true;
  return !NO_CHROME_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function ChromeVisibility({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (!shouldShowChrome(pathname)) return null;

  return <>{children}</>;
}
