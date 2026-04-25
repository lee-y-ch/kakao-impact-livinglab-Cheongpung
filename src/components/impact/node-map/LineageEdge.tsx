import { BaseEdge, type EdgeProps } from "reactflow";

import { strokeForWeight } from "./build-graph";

const ACCENT_STROKE: Record<string, string> = {
  sage: "var(--accent-sage)",
  dust: "var(--accent-dust)",
  ochre: "var(--accent-ochre)",
  clay: "var(--accent-clay)",
};

/**
 * 직각 lineage 선 — 부모 오른쪽에서 90도 꺾어 자식 왼쪽으로.
 *
 * 카테고리 accent 로 stroke 색을 살짝 입혀, hairline 색 체계를 엣지에서도 학습 가능하게 함.
 * 선택 시 ink 로 진하게 전환해 강조.
 */
export function LineageEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps<{ weight: number; accent: string }>) {
  const weight = data?.weight ?? 1;
  const width = strokeForWeight(weight);

  const midX = sourceX + (targetX - sourceX) * 0.5;
  const path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;

  const accentStroke = ACCENT_STROKE[data?.accent ?? ""] ?? "var(--ink)";
  const stroke = selected ? "var(--ink)" : accentStroke;
  const opacity = selected ? 0.95 : Math.min(0.7, 0.4 + weight * 0.04);

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke,
        strokeWidth: selected ? width + 0.6 : width,
        strokeOpacity: opacity,
        fill: "none",
        pointerEvents: "stroke",
      }}
    />
  );
}
