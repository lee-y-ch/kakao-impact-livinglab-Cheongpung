import type { ProgressResult } from "@/lib/progress/calculator";

/**
 * 프로젝트·카테고리 공용 진척 바.
 *
 * note='target_missing' 이면 바를 비운 상태로 "기준 미설정" 뉘앙스.
 * note='completed' 면 진한 색으로 100%.
 */
export function ProgressBar({
  result,
  title,
  subtitle,
  variant = "default",
}: {
  result: ProgressResult;
  title: string;
  subtitle?: string;
  variant?: "default" | "compact";
}) {
  const isTargetMissing = result.note === "target_missing";
  const isCompleted = result.note === "completed";
  const isCompact = variant === "compact";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <span
            className={
              isCompact
                ? "truncate text-sm font-medium text-foreground"
                : "truncate text-base font-semibold text-foreground"
            }
          >
            {title}
          </span>
          {subtitle ? (
            <span className="truncate text-xs text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </div>
        <span
          className={
            "shrink-0 text-xs tabular-nums " +
            (isTargetMissing
              ? "text-muted-foreground/70"
              : isCompleted
                ? "font-semibold text-emerald-700"
                : "font-medium text-foreground/80")
          }
        >
          {isTargetMissing ? "—" : `${result.percent}%`}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={
            "h-full rounded-full transition-[width] duration-500 ease-out " +
            (isTargetMissing
              ? "bg-transparent"
              : isCompleted
                ? "bg-emerald-500"
                : "bg-foreground")
          }
          style={{ width: `${isTargetMissing ? 0 : result.percent}%` }}
        />
      </div>

      <p
        className={
          "text-xs " +
          (isTargetMissing
            ? "text-muted-foreground/70"
            : "text-muted-foreground")
        }
      >
        {result.label}
      </p>
    </div>
  );
}
