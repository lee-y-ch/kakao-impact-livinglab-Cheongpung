import type { Metadata, Viewport } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCurrentActor } from "@/lib/auth/current-actor";
import "./globals.css";

export const metadata: Metadata = {
  title: "강화유니버스 — 오늘도 강화도가 조금씩 더 강화됩니다",
  description:
    "환대로 만들어가는 세계. 참여자·크루·사장님의 행위가 쌓여 강화의 서사가 되는 관계 대시보드.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f6f1e7",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();

  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <Header actor={actor} />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
