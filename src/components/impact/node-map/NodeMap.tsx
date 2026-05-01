"use client";

import { useMemo, useState } from "react";
import ReactFlow, {
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";

import { buildGraph } from "./build-graph";
import type {
  CategoryNodeData,
  EpisodeNodeData,
  ProjectNodeData,
  ShopNodeData,
} from "./build-graph";
import { DetailRail, type SelectedNode } from "./DetailRail";
import { LineageEdge } from "./LineageEdge";
import { CategoryNode, EpisodeNode, ProjectNode, ShopNode } from "./nodes";
import type { NodeMapData, ProjectDatum } from "./types";
import "./node-map.css";

const nodeTypes = {
  category: CategoryNode,
  project: ProjectNode,
  episode: EpisodeNode,
  shop: ShopNode,
};

const edgeTypes = {
  lineage: LineageEdge,
};

/**
 * 공개 데이터 계보도 — Ink-on-Linen 아카이벌 차트.
 * 서버 컴포넌트에서 loadNodeMapData 로 받은 data 를 그대로 넣는다.
 */
export function NodeMap({ data }: { data: NodeMapData }) {
  return (
    <ReactFlowProvider>
      <NodeMapInner data={data} />
    </ReactFlowProvider>
  );
}

function NodeMapInner({ data }: { data: NodeMapData }) {
  const graph = useMemo(() => buildGraph(data), [data]);
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const projectSlugById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of data.projects) map.set(p.id, p.slug);
    return map;
  }, [data.projects]);

  const isEmpty =
    data.categories.length === 0 &&
    data.projects.length === 0 &&
    data.episodes.length === 0 &&
    data.shops.length === 0;

  const onNodeClick: NodeMouseHandler = (_event, node) => {
    const sel = toSelected(node, projectSlugById);
    setSelected(sel);
  };

  // 키보드: 노드 위에서 Enter/Space 면 onNodeClick 과 동일 동작.
  // React Flow 가 기본으로 노드를 focusable 로 만들어주지만, 활성화 키 핸들링은
  // 직접 붙여야 한다.
  function onCanvasKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const target = e.target as HTMLElement;
    const nodeEl = target.closest<HTMLElement>(".react-flow__node");
    if (!nodeEl) return;
    const id = nodeEl.getAttribute("data-id");
    if (!id) return;
    const node = graph.nodes.find((n) => n.id === id);
    if (!node) return;
    e.preventDefault();
    setSelected(toSelected(node as Node, projectSlugById));
  }

  return (
    <div className="nodemap">
      <dl className="nodemap-columns">
        <dt>
          <small>I</small> 카테고리 <em>환대의 네 갈래</em>
        </dt>
        <dt>
          <small>II</small> 프로젝트 <em>장기 서사</em>
        </dt>
        <dt>
          <small>III</small> 회차 <em>현장 세션</em>
        </dt>
        <dt>
          <small>IV</small> 가게 <em>환대가 머무는 자리</em>
        </dt>
      </dl>

      <div className="nodemap-layout">
        <div
          className="nodemap-canvas"
          style={{ height: 680 }}
          role="region"
          aria-label="강화도 환대 데이터 계보도 — 카테고리·프로젝트·회차·가게의 연결"
          onKeyDown={onCanvasKeyDown}
        >
          {isEmpty ? (
            <div className="nodemap-empty">
              아직 지도를 그릴 공개 데이터가 충분하지 않아요.
              <br />첫 공개 카드가 도착하면 카테고리·프로젝트·회차·가게가 이
              자리에 이어집니다.
            </div>
          ) : (
            <ReactFlow
              nodes={graph.nodes}
              edges={graph.edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={onNodeClick}
              onPaneClick={() => setSelected(null)}
              fitView
              fitViewOptions={{ padding: 0.15, maxZoom: 1.2, minZoom: 0.3 }}
              minZoom={0.3}
              maxZoom={2.2}
              defaultEdgeOptions={{ type: "lineage" }}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              panOnScroll={false}
              zoomOnScroll
              selectionOnDrag={false}
            />
          )}

          <div className="nodemap-controls">
            <button type="button" onClick={() => zoomIn()} aria-label="확대">
              +
            </button>
            <button type="button" onClick={() => zoomOut()} aria-label="축소">
              −
            </button>
            <button
              type="button"
              onClick={() => fitView({ padding: 0.15, duration: 300 })}
              aria-label="전체 보기"
              title="전체 보기"
            >
              ⊙
            </button>
          </div>
        </div>

        <DetailRail selected={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}

function toSelected(
  node: Node,
  projectSlugById: Map<string, string>
): SelectedNode | null {
  const kind = (node.data as { kind?: string } | undefined)?.kind;
  if (kind === "category") {
    return { kind: "category", data: node.data as CategoryNodeData };
  }
  if (kind === "project") {
    return { kind: "project", data: node.data as ProjectNodeData };
  }
  if (kind === "episode") {
    const d = node.data as EpisodeNodeData;
    return {
      kind: "episode",
      data: d,
      projectSlug: projectSlugById.get(d.projectId) ?? null,
    };
  }
  if (kind === "shop") {
    return { kind: "shop", data: node.data as ShopNodeData };
  }
  return null;
}

// 타입 참조를 유지 (트리셰이킹 방지 불필요 — 단지 import 된 심볼 유지용)
export type { ProjectDatum };
