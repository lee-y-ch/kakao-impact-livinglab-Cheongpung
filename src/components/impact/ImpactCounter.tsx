/**
 * 강화도가 얼마나 강화됐나 — 큰 숫자 하나.
 *
 * `/impact` 히어로에서 N개가 그리드로 붙는 용도.
 * 애니메이션은 Phase 8 에서 검토 — 지금은 정적 숫자로 안정성 우선.
 */
export function ImpactCounter({
  value,
  label,
  hint,
  accent = false,
}: {
  value: number;
  label: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-1 rounded-2xl border p-5 " +
        (accent
          ? "border-foreground/80 bg-foreground text-background"
          : "border-border bg-background")
      }
    >
      <span
        className={
          "text-xs font-medium uppercase tracking-wider " +
          (accent ? "text-background/80" : "text-muted-foreground")
        }
      >
        {label}
      </span>
      <span
        className={
          "text-3xl font-bold tabular-nums sm:text-4xl " +
          (accent ? "text-background" : "text-foreground")
        }
      >
        {formatNumber(value)}
      </span>
      {hint ? (
        <span
          className={
            "text-[11px] " +
            (accent ? "text-background/70" : "text-muted-foreground")
          }
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}
