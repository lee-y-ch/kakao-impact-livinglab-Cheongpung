import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "강화유니버스 — 오늘도 강화도가 조금씩 더 강화됩니다",
  description:
    "환대로 만들어가는 세계. 참여자·크루·사장님의 행위가 쌓여 강화의 서사가 되는 관계 대시보드.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
