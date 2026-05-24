"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";

export type FeedCardItem = {
  id: string;
  body: string | null;
  photoUrl: string | null;
  createdAt: string;
  categoryLabel: "라이프" | "네트워크" | "창작" | "테크" | null;
  projectLine: string;
  place: string;
  authorNickname: string;
  authorRoleLabel: string;
};

const CATEGORY_BADGE: Record<
  NonNullable<FeedCardItem["categoryLabel"]>,
  string
> = {
  라이프: "bg-[rgba(180,110,40,0.1)] text-[#9B6020]",
  네트워크: "bg-[rgba(107,175,138,0.12)] text-[#3A7A55]",
  창작: "bg-[rgba(49,130,246,0.1)] text-[#2060C8]",
  테크: "bg-[rgba(130,90,180,0.1)] text-[#6040A0]",
};

/**
 * /feed 카드 그리드 + 카드 클릭 시 모달 상세 보기.
 *
 * 청풍 피드백 반영:
 *   - 카드 클릭 시 큰 화면으로 본문·사진·작성자·맥락 확인 가능 (모달)
 *   - 작성자 닉네임 + 역할(참여자) 표시
 *
 * 모달은 ESC, 배경 클릭, X 버튼으로 닫힘. URL 은 변경 안 됨 (단순화).
 */
export function FeedCardGrid({ cards }: { cards: FeedCardItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openCard = cards.find((c) => c.id === openId) ?? null;

  const close = useCallback(() => setOpenId(null), []);

  useEffect(() => {
    if (!openId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openId, close]);

  return (
    <>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <AnimateOnScroll key={card.id} delay={((i % 3) + 1) * 0.07}>
            <FeedCardView card={card} onOpen={() => setOpenId(card.id)} />
          </AnimateOnScroll>
        ))}
      </div>

      {openCard ? <FeedCardModal card={openCard} onClose={close} /> : null}
    </>
  );
}

function FeedCardView({
  card,
  onOpen,
}: {
  card: FeedCardItem;
  onOpen: () => void;
}) {
  const badge = card.categoryLabel
    ? CATEGORY_BADGE[card.categoryLabel]
    : "bg-[#EDECEA] text-[#888]";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full overflow-hidden rounded-[14px] border border-black/[0.06] bg-white text-left transition-all duration-[220ms] hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(0,0,0,0.09)] focus:outline-none focus:ring-2 focus:ring-[#6BAF8A]/40"
    >
      <div className="flex items-center justify-between border-b border-[#F4F4F2] px-4 pb-2.5 pt-3">
        <span className="text-[10px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
          No.{card.id.slice(0, 4).toUpperCase()}
        </span>
        <span
          className={`rounded px-2 py-[3px] text-[9.5px] font-semibold tracking-[0.5px] ${badge}`}
        >
          {card.categoryLabel ?? "미분류"}
        </span>
      </div>
      {card.photoUrl ? (
        <div className="relative h-[150px] w-full overflow-hidden border-b border-[#F4F4F2] bg-[#F5F4F1]">
          <Image
            src={card.photoUrl}
            alt={card.body || card.projectLine}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px"
            className="object-cover transition-transform duration-[450ms] group-hover:scale-[1.03]"
          />
        </div>
      ) : null}
      <div className="px-4 pb-3 pt-3.5">
        <p className="mb-2 text-[10.5px] font-normal text-[#AEAEB2]">
          {card.projectLine}
        </p>
        <p className="mb-3.5 line-clamp-3 text-[14px] leading-[1.7] text-v2-ink">
          {card.body || "(메모 없음)"}
        </p>
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-v2-ink">
            {card.authorNickname}
          </span>
          <span className="text-[10.5px] font-light text-[#AEAEB2]">
            · {card.authorRoleLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-light text-[#AEAEB2]">
            {card.place}
          </span>
          <span className="text-[11px] font-light text-[#AEAEB2]">
            {formatDate(card.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

function FeedCardModal({
  card,
  onClose,
}: {
  card: FeedCardItem;
  onClose: () => void;
}) {
  const badge = card.categoryLabel
    ? CATEGORY_BADGE[card.categoryLabel]
    : "bg-[#EDECEA] text-[#888]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-12 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[640px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0F0EC] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[10.5px] font-semibold tracking-[1.5px] text-[#AEAEB2]">
              No.{card.id.slice(0, 4).toUpperCase()}
            </span>
            <span
              className={`rounded px-2 py-[3px] text-[10px] font-semibold tracking-[0.5px] ${badge}`}
            >
              {card.categoryLabel ?? "미분류"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] text-[#AEAEB2] transition-colors hover:bg-[#F0F0EC] hover:text-v2-ink"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {card.photoUrl ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F4F1]">
            <Image
              src={card.photoUrl}
              alt={card.body || card.projectLine}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        <div className="px-6 pb-7 pt-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[2px] text-[#AEAEB2]">
            {card.projectLine}
          </p>
          <p className="mb-6 whitespace-pre-line text-[15.5px] leading-[1.85] text-v2-ink">
            {card.body || "(메모 없음)"}
          </p>

          <div className="grid grid-cols-[80px_1fr] gap-y-3 border-t border-[#F0F0EC] pt-5 text-[13px]">
            <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#AEAEB2]">
              작성자
            </span>
            <span className="text-v2-ink">
              <strong className="font-medium">{card.authorNickname}</strong>
              <span className="ml-1.5 text-[12px] font-light text-[#AEAEB2]">
                · {card.authorRoleLabel}
              </span>
            </span>

            {card.place ? (
              <>
                <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#AEAEB2]">
                  장소
                </span>
                <span className="text-v2-ink">{card.place}</span>
              </>
            ) : null}

            <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#AEAEB2]">
              날짜
            </span>
            <span className="text-v2-ink">{formatDate(card.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
