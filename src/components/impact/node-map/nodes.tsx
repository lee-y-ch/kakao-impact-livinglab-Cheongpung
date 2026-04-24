import { Handle, Position, type NodeProps } from "reactflow";

import type {
  CategoryNodeData,
  EpisodeNodeData,
  ProjectNodeData,
  ShopNodeData,
} from "./build-graph";
import type { CategoryAccent } from "./types";

/**
 * 4 level 의 노드 렌더러.
 *
 * 공통: 흑백 + 카테고리 hairline 을 좌측 border 로.
 * react-flow handle 은 좌(target) / 우(source) 에 숨겨 둔다 — 엣지 부착용.
 */

const ACCENT_CLASS: Record<CategoryAccent, string> = {
  sage: "nodemap-accent-sage",
  dust: "nodemap-accent-dust",
  ochre: "nodemap-accent-ochre",
  clay: "nodemap-accent-clay",
};

function Shell({
  children,
  accent,
  selected,
  className = "",
}: {
  children: React.ReactNode;
  accent: CategoryAccent;
  selected?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "nodemap-node",
        ACCENT_CLASS[accent],
        selected ? "is-selected" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: "100%", height: "100%" }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
        isConnectable={false}
      />
      {children}
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
        isConnectable={false}
      />
    </div>
  );
}

export function CategoryNode({ data, selected }: NodeProps<CategoryNodeData>) {
  return (
    <Shell
      accent={data.accent}
      selected={selected}
      className="nodemap-category"
    >
      <div className="nodemap-node__body">
        <div className="nodemap-node__eyebrow">
          <span>I · 카테고리</span>
          <span>·</span>
          <span>{data.slug}</span>
        </div>
        <div className="nodemap-node__title">{data.name}</div>
        {data.description ? (
          <div className="nodemap-node__sub">{data.description}</div>
        ) : null}
      </div>
      <div className="nodemap-node__count">
        <strong>{data.publicCardCount}</strong>
        <span>cards</span>
      </div>
    </Shell>
  );
}

export function ProjectNode({ data, selected }: NodeProps<ProjectNodeData>) {
  return (
    <Shell
      accent={data.categoryAccent}
      selected={selected}
      className="nodemap-project"
    >
      <div className="nodemap-node__body">
        <div className="nodemap-node__eyebrow">
          <span>II · 프로젝트</span>
          <span>·</span>
          <span>{data.percentLabel}</span>
        </div>
        <div className="nodemap-node__title">{data.title}</div>
        {data.summary ? (
          <div className="nodemap-node__sub">{data.summary}</div>
        ) : null}
        <div className="nodemap-project__progress">
          <div
            className="nodemap-project__progress-fill"
            style={{ width: `${Math.max(2, data.percent)}%` }}
          />
        </div>
      </div>
      <div className="nodemap-node__count">
        <strong>{data.publicCardCount}</strong>
        <span>cards</span>
      </div>
    </Shell>
  );
}

export function EpisodeNode({ data, selected }: NodeProps<EpisodeNodeData>) {
  return (
    <Shell
      accent={data.categoryAccent}
      selected={selected}
      className="nodemap-episode"
    >
      <div className="nodemap-node__body">
        <div className="nodemap-node__eyebrow">
          <span>III · 회차{data.seq ? ` ${data.seq}` : ""}</span>
          {data.sessionDate ? <span>· {data.sessionDate}</span> : null}
          <span
            className="nodemap-episode-status"
            data-status={data.status}
            style={{ marginLeft: "auto" }}
          >
            {statusLabel(data.status)}
          </span>
        </div>
        <div className="nodemap-node__title">{data.title}</div>
      </div>
      <div className="nodemap-node__count">
        <strong>{data.publicCardCount}</strong>
        <span>cards</span>
      </div>
    </Shell>
  );
}

export function ShopNode({ data, selected }: NodeProps<ShopNodeData>) {
  return (
    <Shell accent={"sage"} selected={selected} className="nodemap-shop">
      <div className="nodemap-node__body">
        <div className="nodemap-node__eyebrow">
          <span>IV · 가게</span>
        </div>
        <div className="nodemap-node__title">{data.name}</div>
        {data.address ? (
          <div className="nodemap-node__sub">{data.address}</div>
        ) : null}
      </div>
      <div className="nodemap-node__count">
        <strong>{data.publicCardCount}</strong>
        <span>cards</span>
      </div>
    </Shell>
  );
}

function statusLabel(status: EpisodeNodeData["status"]): string {
  switch (status) {
    case "planned":
      return "PLANNED";
    case "in_progress":
      return "LIVE";
    case "completed":
      return "DONE";
  }
}
