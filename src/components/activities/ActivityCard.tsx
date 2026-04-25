import Image from "next/image";
import Link from "next/link";

/**
 * 카드 한 장. 참여자 도감과 공개 피드에서 공용으로 사용.
 *
 * Ink-on-Linen 도감 카드 톤:
 *   - 사진 위에 일련번호(No.) eyebrow + 도감 분류(맥락) 라벨
 *   - 사진 → 한 줄 메모 → 발급일 + 공개 상태 도장
 *   - hover: ink 색 sharp shadow 가 아래 우측으로 4px 깊어짐 (종이 같은 인상)
 *   - 사진이 없으면 큰 타이포로 메모를 표지처럼 보여줌
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

  // id 끝 4글자로 일련번호 단서를 만든다 — UUID/cuid 어느 쪽이어도 괜찮은 단순 표시.
  const serial = card.id.slice(-4).toUpperCase();

  const inner = (
    <article className="group relative flex aspect-[3/4] w-full flex-col overflow-hidden border border-foreground/15 bg-card text-foreground shadow-[2px_2px_0_0_hsl(var(--foreground)/0.85)] transition-shadow duration-150 ease-out hover:shadow-[4px_4px_0_0_hsl(var(--foreground)/0.85)]">
      {card.photo_url ? (
        <div className="relative h-[58%] w-full overflow-hidden border-b border-foreground/15 bg-muted">
          <Image
            src={card.photo_url}
            alt={card.body ?? contextLabel}
            fill
            sizes="(max-width: 768px) 50vw, 240px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-[58%] w-full items-center justify-center border-b border-foreground/15 bg-secondary/40 px-5 text-center font-serif text-2xl leading-snug text-foreground/85">
          {truncate(card.body ?? "—", 40)}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="eyebrow eyebrow--latin">No. {serial}</span>
          <VisibilityStamp isPublic={card.is_public} />
        </div>

        {card.photo_url && card.body ? (
          <p className="line-clamp-3 text-[13px] leading-snug text-foreground/90">
            {card.body}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-foreground/10 pt-2 text-[11px] text-muted-foreground">
          <span className="truncate font-medium text-foreground/85">
            {contextLabel}
          </span>
          <time
            dateTime={card.created_at}
            className="shrink-0 font-medium tabular-nums"
          >
            {dateText}
          </time>
        </div>
      </div>
    </article>
  );

  if (!interactive) return inner;
  return (
    <Link
      href={`/collection/${card.id}`}
      className="block focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      {inner}
    </Link>
  );
}

function VisibilityStamp({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide " +
        (isPublic
          ? "border-foreground/70 text-foreground/85"
          : "border-foreground/25 text-muted-foreground")
      }
      aria-label={isPublic ? "공개 카드" : "비공개 카드"}
    >
      <span
        aria-hidden
        className={
          "h-1 w-1 rounded-full " +
          (isPublic ? "bg-foreground/85" : "bg-muted-foreground/60")
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
