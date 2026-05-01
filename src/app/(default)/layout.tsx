import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCurrentActor } from "@/lib/auth/current-actor";

/**
 * 기존 Ink-on-Linen UI 페이지 전체를 감싸는 default 레이아웃.
 * Header (역할별 nav) + Footer 가 여기서만 렌더된다.
 *
 * Claude editorial 랜딩(/) 은 root 레이아웃을 직접 사용하므로 이 wrapper 를 거치지 않음.
 */
export default async function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  return (
    <>
      <Header actor={actor} />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
