import Image from "next/image";
import Link from "next/link";

/**
 * 카드 한 장. 참여자 도감과 공개 피드에서 공용으로 사용.
 *
 * 시각 원칙:
 *   - 정사각 사진 + 밑에 한 줄 메모 + 맨 아래 맥락(가게/에피소드) 라벨
 *   - 공개/비공개 상태를 왼쪽 상단 작은 점으로
 *   - 사진 없으면 "메모 전용" 타이포그래픽 레이아웃
 *   - 클릭 시 /collection/[id] 로 이동 (앞면/뒷면 상세)
 */

export type ActivityCardData = {
  id: string;
  type: string;
  body: string | null;
  title: string | null;
  photo_url: string | null;
  is_public: boolean;
  created_at: string;
  context: {
    shop?: { id: string; name: string } | null;
    episode?: { id: string; title: string } | null;
    project?: { id: string; title: string; slug: string } | null;
  };
};

type Props = {
  card: ActivityCardData;
  /** 내 도감(본인)일 때 true — 클릭 시 /collection/[id] 로. */
  interactive?: boolean;
};

export function ActivityCard({ card, interactive = true }: Props) {
  const dateText = new Date(card.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const contextLabel =
    card.context.shop?.name ??
    card.context.episode?.title ??
    card.context.project?.title ??
    "강화 어딘가";

  const inner = (
    <article className="group relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <VisibilityDot isPublic={card.is_public} />

      {card.photo_url ? (
        <div className="relative h-[62%] w-full overflow-hidden bg-muted">
          <Image
            src={card.photo_url}
            alt={card.body ?? contextLabel}
            fill
            sizes="(max-width: 768px) 50vw, 240px"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="flex h-[62%] w-full items-center justify-center bg-muted/40 px-4 text-center text-xl font-semibold leading-snug text-foreground/80">
          {truncate(card.body ?? "—", 40)}
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between gap-2 p-3 text-sm">
        {card.photo_url && card.body ? (
          <p className="line-clamp-3 text-sm leading-snug text-foreground/90">
            {card.body}
          </p>
        ) : (
          <span />
        )}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate font-medium text-foreground/80">
            {contextLabel}
          </span>
          <time dateTime={card.created_at}>{dateText}</time>
        </div>
      </div>
    </article>
  );

  if (!interactive) return inner;
  return (
    <Link href={`/collection/${card.id}`} className="block">
      {inner}
    </Link>
  );
}

function VisibilityDot({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground/70 backdrop-blur"
      aria-label={isPublic ? "공개 카드" : "비공개 카드"}
    >
      <span
        className={
          isPublic
            ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
            : "h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
        }
      />
      {isPublic ? "공개" : "비공개"}
    </span>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}
