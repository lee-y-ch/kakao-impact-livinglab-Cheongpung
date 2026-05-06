"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 시안의 [data-anim] / [data-delay] 패턴 React 포팅.
 *
 * - mount 시 IntersectionObserver 등록, 12% 보이면 .in 활성화
 * - reduced-motion 환경에선 즉시 visible (opacity:1, transform:none)
 * - children 은 single React node 권장 (하나의 wrapper div 만듦)
 */
export function AnimateOnScroll({
  children,
  delay = 0,
  variant = "up",
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** seconds */
  delay?: number;
  /** 'up' (default) = translateY(40)→0, 'fade' = scale(0.96)→1 */
  variant?: "up" | "fade";
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const update = () => setReduced(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [reduced]);

  const baseStyle: React.CSSProperties = reduced
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : variant === "fade"
            ? "translateY(0) scale(0.96)"
            : "translateY(40px)",
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: "opacity, transform",
      };

  const TagAny = Tag as React.ElementType;

  return (
    <TagAny ref={ref} className={className} style={baseStyle}>
      {children}
    </TagAny>
  );
}
