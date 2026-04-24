import type { Edge, Node } from "reactflow";

import type {
  CategoryDatum,
  EpisodeDatum,
  LineageEdgeDatum,
  NodeMapData,
  ProjectDatum,
  ShopDatum,
} from "./types";

/**
 * 데이터 → React Flow 노드/엣지 변환 + 레이아웃.
 *
 * 4 컬럼 좌→우 계보 차트:
 *   I 카테고리 · II 프로젝트 · III 회차 · IV 가게
 *
 * 전략: leaf 부터 쌓고 부모는 자식 평균 Y 로 중앙 정렬.
 *   episode Y 를 먼저 결정 → project Y = 자식 episode 평균 → category Y = 자식 project 평균
 *   shop 은 부모가 뒤섞이므로 연결된 부모들의 평균 Y 로 배치 후 충돌 해소.
 */

const COLUMN_X = {
  category: 40,
  project: 440,
  episode: 860,
  shop: 1240,
} as const;

const EPISODE_ROW = 72;
const PROJECT_GAP = 56;
const CATEGORY_GAP = 48;
const SHOP_MIN_GAP = 80;
const ORPHAN_PROJECT_ROW = 132;

const NODE_WIDTH_FALLBACK = 320;
const NODE_HEIGHT_FALLBACK = 96;

export type CategoryNodeData = CategoryDatum & { kind: "category" };
export type ProjectNodeData = ProjectDatum & { kind: "project" };
export type EpisodeNodeData = EpisodeDatum & { kind: "episode" };
export type ShopNodeData = ShopDatum & { kind: "shop" };

export type MapNode = Node<
  CategoryNodeData | ProjectNodeData | EpisodeNodeData | ShopNodeData
>;

export type MapEdge = Edge<{ weight: number; accent: string }>;

export type GraphLayout = {
  nodes: MapNode[];
  edges: MapEdge[];
  bounds: { width: number; height: number };
};

export function buildGraph(data: NodeMapData): GraphLayout {
  const { categories, projects, episodes, shops, edges: lineage } = data;

  const projectsByCategory = groupBy(projects, (p) => p.categoryId);
  const episodesByProject = groupBy(episodes, (e) => e.projectId);

  const episodeY = new Map<string, number>();
  const projectY = new Map<string, number>();
  const categoryY = new Map<string, number>();

  let cursor = 60;

  for (const c of categories) {
    const projectsInCat = projectsByCategory.get(c.id) ?? [];
    const projectYsInCat: number[] = [];

    for (const p of projectsInCat) {
      const eps = episodesByProject.get(p.id) ?? [];
      const startY = cursor;
      if (eps.length > 0) {
        for (const e of eps) {
          episodeY.set(e.id, cursor);
          cursor += EPISODE_ROW;
        }
      } else {
        cursor += ORPHAN_PROJECT_ROW;
      }
      const endY = cursor - EPISODE_ROW;
      const centerY =
        eps.length > 0 ? (startY + endY) / 2 : startY + ORPHAN_PROJECT_ROW / 2;
      projectY.set(p.id, centerY);
      projectYsInCat.push(centerY);
      cursor += PROJECT_GAP;
    }

    if (projectsInCat.length === 0) {
      // 빈 카테고리도 제자리를 유지 — 발표에서 이전 빈 칼럼이 있다는 신호
      categoryY.set(c.id, cursor + 40);
      cursor += 120;
    } else {
      const avg =
        projectYsInCat.reduce((s, y) => s + y, 0) / projectYsInCat.length;
      categoryY.set(c.id, avg);
      cursor += CATEGORY_GAP;
    }
  }

  // 가게 Y — 연결된 부모(에피소드/프로젝트)의 평균 Y 로 추정, 충돌 해소
  const shopParentYs = new Map<string, number[]>();
  for (const edge of lineage) {
    if (!edge.target.startsWith("shp-")) continue;
    const shopId = edge.target.slice(4);
    let parentY: number | undefined;
    if (edge.source.startsWith("epi-")) {
      parentY = episodeY.get(edge.source.slice(4));
    } else if (edge.source.startsWith("prj-")) {
      parentY = projectY.get(edge.source.slice(4));
    }
    if (parentY === undefined) continue;
    const arr = shopParentYs.get(shopId) ?? [];
    arr.push(parentY);
    shopParentYs.set(shopId, arr);
  }

  const shopWithY = shops
    .map((s) => {
      const ys = shopParentYs.get(s.id) ?? [];
      const avg =
        ys.length > 0 ? ys.reduce((sum, y) => sum + y, 0) / ys.length : cursor;
      return { shop: s, y: avg };
    })
    .sort((a, b) => a.y - b.y);

  // 충돌 해소: 위에서 아래로 훑으며 최소 간격 강제
  const shopY = new Map<string, number>();
  let lastY = -Infinity;
  for (const { shop, y } of shopWithY) {
    const placed = Math.max(y, lastY + SHOP_MIN_GAP);
    shopY.set(shop.id, placed);
    lastY = placed;
  }

  // ReactFlow 노드 생성
  const nodes: MapNode[] = [];

  for (const c of categories) {
    nodes.push({
      id: `cat-${c.id}`,
      type: "category",
      position: { x: COLUMN_X.category, y: categoryY.get(c.id) ?? 0 },
      data: { ...c, kind: "category" },
      width: NODE_WIDTH_FALLBACK,
      height: NODE_HEIGHT_FALLBACK,
      draggable: false,
      selectable: true,
    });
  }
  for (const p of projects) {
    nodes.push({
      id: `prj-${p.id}`,
      type: "project",
      position: { x: COLUMN_X.project, y: projectY.get(p.id) ?? 0 },
      data: { ...p, kind: "project" },
      width: NODE_WIDTH_FALLBACK,
      height: NODE_HEIGHT_FALLBACK,
      draggable: false,
      selectable: true,
    });
  }
  for (const e of episodes) {
    nodes.push({
      id: `epi-${e.id}`,
      type: "episode",
      position: { x: COLUMN_X.episode, y: episodeY.get(e.id) ?? 0 },
      data: { ...e, kind: "episode" },
      width: 320,
      height: 60,
      draggable: false,
      selectable: true,
    });
  }
  for (const s of shops) {
    nodes.push({
      id: `shp-${s.id}`,
      type: "shop",
      position: { x: COLUMN_X.shop, y: shopY.get(s.id) ?? 0 },
      data: { ...s, kind: "shop" },
      width: 280,
      height: 64,
      draggable: false,
      selectable: true,
    });
  }

  // ReactFlow 엣지 — 직각 오쏘고널, weight 로 stroke 굵기
  const edges: MapEdge[] = lineage.map((le) => ({
    id: le.id,
    source: le.source,
    target: le.target,
    type: "lineage",
    data: { weight: le.weight, accent: le.accent },
    // stroke 는 LineageEdge 컴포넌트에서 data.weight 로 계산
  }));

  const height = Math.max(cursor, lastY + 120, 600);
  const width = COLUMN_X.shop + 320;

  return { nodes, edges, bounds: { width, height } };
}

export function strokeForWeight(weight: number): number {
  // 1 → 1px, 2 → 1.4px, 5 → 2.2px, 10+ → 3.5px (로그 스케일)
  const clamped = Math.max(1, weight);
  return Math.min(3.5, 0.9 + Math.log(clamped) * 0.9);
}

function groupBy<T, K>(arr: T[], key: (t: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of arr) {
    const k = key(item);
    const bucket = map.get(k) ?? [];
    bucket.push(item);
    map.set(k, bucket);
  }
  return map;
}

export { COLUMN_X };
