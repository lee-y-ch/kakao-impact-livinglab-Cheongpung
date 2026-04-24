import { BaseEdge, type EdgeProps } from "reactflow";

import { strokeForWeight } from "./build-graph";

/**
 * 직각 ink 선 — 부모 오른쪽에서 90도 꺾어 자식 왼쪽으로.
 *
 * 기본 라이브러리의 bezier 스무스 곡선이 "인포그래픽" 느낌을 죽여서,
 * 수동으로 L-path 를 합성한다. 가중치에 따라 stroke 굵기와 투명도가 올라감.
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

  // 중간 분기점 — 수평으로 60% 지점까지 간 뒤 수직, 다시 수평
  const midX = sourceX + (targetX - sourceX) * 0.5;
  const path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;

  const opacity = selected ? 0.95 : Math.min(0.75, 0.35 + weight * 0.05);

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: "var(--ink)",
        strokeWidth: width,
        strokeOpacity: opacity,
        fill: "none",
        pointerEvents: "stroke",
      }}
    />
  );
}
