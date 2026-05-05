/**
 * (default) route group — 시안 v2 통합 후 chrome(Navbar/Footer) 은 root layout
 * 으로 이동했다. 이 wrapper 는 호환을 위해 단순 passthrough 로 유지.
 */
export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
