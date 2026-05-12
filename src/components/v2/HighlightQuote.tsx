"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 스크롤로 뷰포트에 들어오면 형광펜이 왼쪽에서 오른쪽으로 그어지는 인용구.
 */
export function HighlightQuote({
  children,
  fontSize,
}: {
  children: React.ReactNode;
  fontSize?: string;
}) {
  const ref = useRef<HTMLQuoteElement | null>(null);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) setActive(true);
    const update = () => {
      setReduced(mq.matches);
      if (mq.matches) setActive(true);
    };
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(true);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.6, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <blockquote
      ref={ref}
      className="relative inline-block whitespace-nowrap font-bold leading-[1.2] tracking-[-0.8px] text-v2-ink"
      style={{ fontSize: fontSize ?? "clamp(18px, 2.2vw, 28px)" }}
    >
      <span
        aria-hidden
        className="absolute -left-1 top-0 -z-[1] h-full"
        style={{
          width: active ? "calc(100% + 8px)" : "0%",
          background: "rgba(255, 245, 100, 0.6)",
          transition: reduced
            ? "none"
            : "width 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.25s",
          transformOrigin: "left",
        }}
      />
      {children}
    </blockquote>
  );
}
