"use client";

import { useState } from "react";

export type CategorySlug = "active_life" | "network" | "local_culture" | "tech";
export type CategoryLabel = "라이프" | "네트워크" | "창작" | "테크";

export type GraphNodeType = "category" | "project" | "shop" | "participant";

export type GraphNode = {
  id: string;
  rawId: string;
  type: GraphNodeType;
  label: string;
  count: number;
  previews: string[];
  categorySlug: CategorySlug | null;
  x: number;
  y: number;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  count: number;
};

export type ImpactGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    activities: number;
    categories: number;
    projects: number;
    shops: number;
    participants: number;
  };
};

const SLUG_TO_LABEL: Record<CategorySlug, CategoryLabel> = {
  active_life: "라이프",
  network: "네트워크",
  local_culture: "창작",
  tech: "테크",
};

const CATEGORY_FILL: Record<CategoryLabel, string> = {
  라이프: "#C4956A",
  네트워크: "#6BAF8A",
  창작: "#88AADD",
  테크: "#A080CC",
};

const TYPE_LABEL: Record<GraphNodeType, string> = {
  category: "카테고리",
  project: "프로젝트",
  shop: "가게",
  participant: "참여자",
};

function shortLabel(label: string, max = 12): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function NodeMapClient({ graph }: { graph: ImpactGraph }) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const activeNode = activeNodeId ? (byId.get(activeNodeId) ?? null) : null;

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center">
        <div>
          <p className="mb-2 text-[14px] font-semibold text-v2-ink">
            아직 그릴 공개 연결이 없어요.
          </p>
          <p className="text-[12px] font-light leading-[1.7] text-v2-ink3">
            공개 카드가 생기면 참여자·가게·프로젝트 연결이 자동으로 나타납니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <svg
        viewBox="0 0 900 440"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        onMouseLeave={() => setActiveNodeId(null)}
      >
        <defs>
          <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="8"
              floodColor="#000000"
              floodOpacity="0.08"
            />
          </filter>
        </defs>

        {graph.edges.map((edge) => {
          const source = byId.get(edge.source);
          const target = byId.get(edge.target);
          if (!source || !target) return null;
          const active =
            activeNodeId === edge.source || activeNodeId === edge.target;
          return (
            <line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={edge.source.startsWith("category:") ? "#6BAF8A" : "#000"}
              strokeWidth={active ? 4 : Math.min(5, 1 + edge.count * 0.45)}
              opacity={
                active ? 0.52 : edge.source.startsWith("category:") ? 0.32 : 0.1
              }
              fill="none"
            />
          );
        })}

        {graph.nodes.map((node) => (
          <GraphNodeView
            key={node.id}
            node={node}
            active={activeNodeId === node.id}
            dimmed={Boolean(activeNodeId && activeNodeId !== node.id)}
            onEnter={() => setActiveNodeId(node.id)}
            onFocus={() => setActiveNodeId(node.id)}
          />
        ))}

        {[
          ["카테고리", 105],
          ["프로젝트", 315],
          ["가게", 565],
          ["참여자", 790],
        ].map(([label, x]) => (
          <text
            key={label}
            x={x}
            y="30"
            textAnchor="middle"
            fontSize="10"
            fill="#AEAEB2"
            fontWeight={600}
            letterSpacing="1.5"
          >
            {label}
          </text>
        ))}
      </svg>
      <HoverPanel node={activeNode} />
    </>
  );
}

function GraphNodeView({
  node,
  active,
  dimmed,
  onEnter,
  onFocus,
}: {
  node: GraphNode;
  active: boolean;
  dimmed: boolean;
  onEnter: () => void;
  onFocus: () => void;
}) {
  const categoryLabel = node.categorySlug
    ? SLUG_TO_LABEL[node.categorySlug]
    : null;
  const fill =
    node.type === "participant"
      ? "#B8B8B8"
      : node.type === "shop"
        ? "#C4956A"
        : categoryLabel
          ? CATEGORY_FILL[categoryLabel]
          : "#6BAF8A";
  const radius =
    node.type === "category"
      ? 24
      : node.type === "project"
        ? Math.min(24, 15 + node.count * 1.2)
        : node.type === "shop"
          ? Math.min(18, 11 + node.count)
          : Math.min(12, 7 + node.count * 0.6);
  const labelFill = node.type === "participant" ? "#888" : "#1A1A1A";
  const labelY = node.y + radius + 14;

  return (
    <g
      role="button"
      tabIndex={0}
      className="cursor-pointer outline-none"
      opacity={dimmed ? 0.42 : 1}
      onMouseEnter={onEnter}
      onFocus={onFocus}
    >
      <circle
        cx={node.x}
        cy={node.y}
        r={active ? radius + 4 : radius}
        fill={fill}
        opacity={node.type === "participant" ? 0.95 : 0.9}
        filter={node.type !== "participant" ? "url(#node-shadow)" : undefined}
        stroke={active ? "#1A1A1A" : "transparent"}
        strokeWidth={active ? 2 : 0}
      />
      <text
        x={node.x}
        y={node.y + 3}
        textAnchor="middle"
        fontSize={node.type === "participant" ? "8" : "10"}
        fill={node.type === "participant" ? "#fff" : "#1A1A1A"}
        fontWeight={700}
        pointerEvents="none"
      >
        {node.count}
      </text>
      <text
        x={node.x}
        y={labelY}
        textAnchor="middle"
        fontSize={node.type === "category" ? "11" : "10"}
        fill={labelFill}
        fontWeight={node.type === "category" ? 600 : 400}
        pointerEvents="none"
      >
        {shortLabel(node.label, node.type === "project" ? 13 : 10)}
      </text>
    </g>
  );
}

function HoverPanel({ node }: { node: GraphNode | null }) {
  if (!node) {
    return (
      <div className="bg-white/92 pointer-events-none absolute right-4 top-4 hidden w-[260px] rounded-xl border border-black/[0.06] px-4 py-3 text-[12px] text-[#999] shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur md:block">
        노드에 마우스를 올리면 공개 카드 미리보기가 나타납니다.
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 w-[280px] rounded-xl border border-black/[0.08] bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[2px] text-[#6BAF8A]">
            {TYPE_LABEL[node.type]}
          </p>
          <p className="mt-1 text-[14px] font-semibold leading-[1.35] text-v2-ink">
            {node.label}
          </p>
        </div>
        <span className="rounded-full bg-[#EDECEA] px-2 py-1 text-[10px] font-semibold text-[#777]">
          {node.count}장
        </span>
      </div>
      {node.previews.length ? (
        <ul className="space-y-1.5 border-t border-black/[0.06] pt-2.5">
          {node.previews.slice(0, 5).map((preview, index) => (
            <li
              key={`${node.id}-${index}`}
              className="line-clamp-2 text-[11.5px] leading-[1.55] text-v2-ink3"
            >
              {preview}
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-black/[0.06] pt-2.5 text-[11.5px] text-[#999]">
          미리볼 수 있는 메모가 없습니다.
        </p>
      )}
    </div>
  );
}
