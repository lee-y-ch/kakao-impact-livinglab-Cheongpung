"use client";

import { useState } from "react";

import { AnimateOnScroll } from "./AnimateOnScroll";

export type FaqItem = {
  q: string;
  a: string;
};

/**
 * 시안의 .faq-item 클릭 = 단일 open/close 토글.
 * 다른 항목 열면 이전 것은 자동 닫힘.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div>
      {items.map((it, i) => {
        const open = openIdx === i;
        return (
          <AnimateOnScroll key={i} delay={i * 0.1}>
            <div
              className={`cursor-pointer border-t border-v2-rule ${
                i === items.length - 1 ? "border-b border-v2-rule" : ""
              }`}
              onClick={() => setOpenIdx(open ? null : i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenIdx(open ? null : i);
                }
              }}
            >
              <div className="flex select-none items-center justify-between px-1 py-[26px] text-[14.5px] font-medium">
                {it.q}
                <span
                  className={`relative ml-5 h-7 w-7 flex-shrink-0 rounded-full border-[1.5px] transition-colors ${
                    open
                      ? "border-v2-brand bg-v2-brand"
                      : "border-v2-rule bg-white"
                  }`}
                  aria-hidden
                >
                  <span
                    className={`absolute left-1/2 top-1/2 h-[1.5px] w-[11px] -translate-x-1/2 -translate-y-1/2 transition-colors ${
                      open ? "bg-white" : "bg-[#aaa]"
                    }`}
                  />
                  <span
                    className={`absolute left-1/2 top-1/2 h-[11px] w-[1.5px] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                      open ? "rotate-90 bg-white opacity-0" : "bg-[#aaa]"
                    }`}
                  />
                </span>
              </div>
              <div
                className="overflow-hidden text-[13.5px] font-light leading-[1.85] text-[#777] transition-[max-height] duration-[400ms]"
                style={{ maxHeight: open ? 240 : 0 }}
              >
                <div className="px-1 pb-7">{it.a}</div>
              </div>
            </div>
          </AnimateOnScroll>
        );
      })}
    </div>
  );
}
