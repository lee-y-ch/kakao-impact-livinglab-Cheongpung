import type { Metadata, Viewport } from "next";

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
 * Root shell — v2 redesign.
 * Navbar + Footer 를 모든 페이지에 자동 적용. login 등 chrome 미노출이 필요한
 * 페이지는 자체 layout 으로 override 한다.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-v2-paper font-sans text-v2-ink antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
