export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
        오늘도 강화도가 조금씩 더 강화됩니다
      </h1>
      <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
        환대로 만들어가는 세계, 강화유니버스. 참여자·크루·사장님의 행위가 쌓여
        관계가 되는 대시보드입니다.
      </p>
      <p className="text-xs text-muted-foreground/60">
        Phase 0 · 셋업 완료. Phase 1부터 실제 화면이 들어옵니다.
      </p>
    </main>
  );
}
