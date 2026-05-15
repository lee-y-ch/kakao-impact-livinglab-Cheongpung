import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import { ChromeVisibility } from "@/components/layout/ChromeVisibility";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "강화유니버스 — 환대로 만들어가는 세계",
  description:
    "강화에서 함께 실험하는 환대의 세계. 참여자·크루·사장님의 행위가 쌓여 강화의 서사가 됩니다.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#F9FAFB",
  width: "device-width",
  initialScale: 1,
};

/**
 * 자체 chrome (sidebar 등) 으로 운영되는 경로 prefix — 글로벌 Navbar/Footer 미노출.
 * `x-pathname` 헤더는 supabase middleware 가 주입한다 (src/lib/supabase/middleware.ts).
 */
const NO_CHROME_PREFIXES = ["/admin", "/owner"];

function shouldShowChrome(pathname: string | null): boolean {
  if (!pathname) return true;
  return !NO_CHROME_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * Root shell — v2 redesign.
 * Navbar + Footer 를 기본 적용하되, /admin* 처럼 자체 sidebar 셸이 있는 라우트는
 * 미노출. login 등 chrome 미노출이 필요한 페이지는 자체 layout 으로 override.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get("x-pathname");
  const showChrome = shouldShowChrome(pathname);

  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-v2-paper font-sans text-v2-ink antialiased">
        {showChrome ? (
          <ChromeVisibility>
            <Navbar />
          </ChromeVisibility>
        ) : null}
        <main className="flex-1">{children}</main>
        {showChrome ? (
          <ChromeVisibility>
            <Footer />
          </ChromeVisibility>
        ) : null}
      </body>
    </html>
  );
}
