import Link from "next/link";

import { ProgressBar } from "@/components/projects/ProgressBar";
import type { ProgressResult } from "@/lib/progress/calculator";

export type CategoryProgressItem = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  summary: string | null;
  result: ProgressResult;
  projectCount: number;
  scoredProjectCount: number;
  activityCount: number;
};

/**
 * 강화도 진척 — 4개 카테고리 카드 그리드.
 *
 * 각 카드는 해당 카테고리 프로젝트 평균 진척 바 + 활동 수 / 프로젝트 수 를 표시.
 * 클릭하면 /projects?category=SLUG (Phase 6-b 에서 라우팅 적용) 로 이동.
 */
export function CategoryProgressGrid({
  items,
}: {
  items: CategoryProgressItem[];
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        아직 공개된 카테고리 진척이 없어요.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.categoryId}
          href={`/projects?category=${item.categorySlug}`}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 transition hover:bg-muted/40"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              카테고리
            </span>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {item.categoryName}
            </h3>
            {item.summary ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {item.summary}
              </p>
            ) : null}
          </div>

          <ProgressBar
            result={item.result}
            title="평균 진척"
            variant="compact"
          />

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>프로젝트 {item.projectCount}</span>
            {item.scoredProjectCount < item.projectCount ? (
              <>
                <span>·</span>
                <span>
                  기준 설정 {item.scoredProjectCount}/{item.projectCount}
                </span>
              </>
            ) : null}
            <span>·</span>
            <span>카드 {item.activityCount}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
