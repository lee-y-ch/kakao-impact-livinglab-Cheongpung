import Link from "next/link";

import type {
  CategoryNodeData,
  EpisodeNodeData,
  ProjectNodeData,
  ShopNodeData,
} from "./build-graph";

type SelectedNode =
  | { kind: "category"; data: CategoryNodeData }
  | { kind: "project"; data: ProjectNodeData }
  | { kind: "episode"; data: EpisodeNodeData; projectSlug: string | null }
  | { kind: "shop"; data: ShopNodeData };

/**
 * 노드 선택 시 우측에 떠오르는 신문 클리핑 스타일 디테일 카드.
 * close(x) 는 부모에서 setSelected(null) 로 받아 처리.
 */
export function DetailRail({
  selected,
  onClose,
}: {
  selected: SelectedNode | null;
  onClose: () => void;
}) {
  if (!selected) return null;

  const content = renderContent(selected);

  return (
    <aside className="nodemap-detail" aria-live="polite">
      <div className="nodemap-detail__eyebrow">
        <span>{content.eyebrow}</span>
        <button type="button" onClick={onClose} aria-label="닫기">
          ×
        </button>
      </div>
      <h3 className="nodemap-detail__title">{content.title}</h3>
      {content.body ? (
        <p className="nodemap-detail__body">{content.body}</p>
      ) : null}
      {content.stats.length > 0 ? (
        <dl className="nodemap-detail__stats">
          {content.stats.map((s) => (
            <div key={s.label} className="nodemap-detail__stat">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {content.link ? (
        <Link className="nodemap-detail__link" href={content.link.href}>
          {content.link.label} →
        </Link>
      ) : null}
    </aside>
  );
}

function renderContent(selected: SelectedNode): {
  eyebrow: string;
  title: string;
  body: string | null;
  stats: { label: string; value: string }[];
  link: { href: string; label: string } | null;
} {
  if (selected.kind === "category") {
    const d = selected.data;
    return {
      eyebrow: `I · 카테고리 · ${d.slug}`,
      title: d.name,
      body: d.description,
      stats: [
        { label: "프로젝트", value: fmt(d.projectCount) },
        { label: "공개 카드", value: fmt(d.publicCardCount) },
      ],
      link: {
        href: `/projects?category=${d.slug}`,
        label: "이 카테고리 프로젝트 보기",
      },
    };
  }
  if (selected.kind === "project") {
    const d = selected.data;
    return {
      eyebrow: "II · 프로젝트",
      title: d.title,
      body: d.summary,
      stats: [
        { label: "진척", value: `${d.percent}%` },
        { label: "공개 카드", value: fmt(d.publicCardCount) },
        { label: "진행 회차", value: fmt(d.inProgressEpisodes) },
        { label: "기준 라벨", value: d.percentLabel },
      ],
      link: { href: `/projects/${d.slug}`, label: "프로젝트 페이지로" },
    };
  }
  if (selected.kind === "episode") {
    const d = selected.data;
    return {
      eyebrow: `III · 회차${d.seq ? ` ${d.seq}` : ""}`,
      title: d.title,
      body: d.sessionDate ? `세션일 ${d.sessionDate}` : null,
      stats: [
        { label: "상태", value: statusText(d.status) },
        { label: "공개 카드", value: fmt(d.publicCardCount) },
      ],
      link: selected.projectSlug
        ? {
            href: `/projects/${selected.projectSlug}`,
            label: "상위 프로젝트로",
          }
        : null,
    };
  }
  const d = selected.data;
  return {
    eyebrow: "IV · 가게",
    title: d.name,
    body: d.address,
    stats: [{ label: "공개 카드", value: fmt(d.publicCardCount) }],
    link: { href: `/shops/${d.id}`, label: "가게 페이지로" },
  };
}

function fmt(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}

function statusText(status: EpisodeNodeData["status"]): string {
  return status === "completed"
    ? "완료"
    : status === "in_progress"
      ? "진행 중"
      : "예정";
}

export type { SelectedNode };
