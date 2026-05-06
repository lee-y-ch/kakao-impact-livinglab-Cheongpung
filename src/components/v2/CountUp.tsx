"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 시안의 .count[data-target] easeOutQuart 카운터.
 * 화면 50% 이상 진입 시 1.8s 동안 0 → target 까지 증가.
 * format=true (기본) 시 ko-KR 천단위 콤마. format=false 면 raw int.
 * reduced-motion 환경에선 처음부터 target 으로 표시.
 */
export function CountUp({
  target,
  duration = 1800,
  format = true,
  className,
}: {
  target: number;
  duration?: number;
  format?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      setDone(true);
      return;
    }

    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !done) {
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min((now - start) / duration, 1);
              const ease = 1 - Math.pow(1 - p, 4);
              setValue(Math.floor(ease * target));
              if (p < 1) requestAnimationFrame(tick);
              else setDone(true);
            };
            requestAnimationFrame(tick);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.5 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [target, duration, done]);

  const text = format
    ? new Intl.NumberFormat("ko-KR").format(value)
    : String(value);
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
