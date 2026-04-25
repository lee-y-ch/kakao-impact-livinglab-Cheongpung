import Link from "next/link";

import { ProgressBar } from "@/components/projects/ProgressBar";
import type { ProgressResult } from "@/lib/progress/calculator";

export type TimelineProjectItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  categoryName: string | null;
  result: ProgressResult;
  inProgressEpisodes: number;
  recentPhotoUrl: string | null;
};

export function ProjectTimelineCard({ item }: { item: TimelineProjectItem }) {
  return (
    <Link
      href={`/projects/${item.slug}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 transition hover:bg-muted/40"
    >
      <div className="flex items-start gap-3">
        {item.recentPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.recentPhotoUrl}
            alt={`${item.title} 최근 사진`}
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-xl bg-muted" />
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          {item.categoryName ? (
            <span className="eyebrow">{item.categoryName}</span>
          ) : null}
          <h3 className="truncate text-base font-semibold text-foreground">
            {item.title}
          </h3>
          {item.summary ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {item.summary}
            </p>
          ) : null}
        </div>
      </div>

      <ProgressBar result={item.result} title="진척" variant="compact" />

      <div className="text-[11px] text-muted-foreground">
        {item.inProgressEpisodes > 0
          ? `지금 ${item.inProgressEpisodes}개 회차 진행 중`
          : "다음 회차를 기다리는 중"}
      </div>
    </Link>
  );
}
