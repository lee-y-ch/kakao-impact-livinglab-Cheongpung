export type NodeKind = "category" | "project" | "episode" | "shop";

export type CategoryDatum = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accent: CategoryAccent;
  projectCount: number;
  publicCardCount: number;
};

export type ProjectDatum = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  categoryId: string;
  categoryAccent: CategoryAccent;
  percent: number;
  percentLabel: string;
  publicCardCount: number;
  inProgressEpisodes: number;
};

export type EpisodeDatum = {
  id: string;
  title: string;
  projectId: string;
  categoryAccent: CategoryAccent;
  status: "planned" | "in_progress" | "completed";
  seq: number | null;
  sessionDate: string | null;
  publicCardCount: number;
};

export type ShopDatum = {
  id: string;
  name: string;
  address: string | null;
  publicCardCount: number;
};

export type LineageEdgeDatum = {
  id: string;
  source: string;
  target: string;
  weight: number;
  accent: CategoryAccent;
};

/**
 * 4 카테고리에 고정 색 — 데스크탑 기준 저채도 흙빛 4종.
 * 값은 node-map.css 의 --accent-* 와 동기화.
 */
export type CategoryAccent = "sage" | "dust" | "ochre" | "clay";

export const CATEGORY_ACCENT_BY_SLUG: Record<string, CategoryAccent> = {
  commons: "sage",
  network: "dust",
  world: "ochre",
  policy: "clay",
};

export function accentForSlug(slug: string): CategoryAccent {
  return CATEGORY_ACCENT_BY_SLUG[slug] ?? "sage";
}

export type NodeMapData = {
  categories: CategoryDatum[];
  projects: ProjectDatum[];
  episodes: EpisodeDatum[];
  shops: ShopDatum[];
  edges: LineageEdgeDatum[];
};
