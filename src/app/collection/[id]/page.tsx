import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AnimateOnScroll } from "@/components/v2/AnimateOnScroll";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

import { CardActionsClient } from "./CardActionsClient";

export const dynamic = "force-dynamic";

/**
 * v2 redesign — `/collection/[id]` 카드 상세.
 * 시안: design-v2-reference/강화유니버스_카드상세.html.
 *
 * 참여자 본인의 카드만 접근 가능 (RLS + actor 검증).
 * 시안 markup·디자인 토큰 그대로 유지하며 하드코딩 텍스트만 실데이터로 교체.
 *
 * 카드 플립은 시안의 click→rotateY 인터랙션이지만 SSR 단계에선 앞/뒷면을 위아래로
 * 같이 펼쳐 보여주는 정적 표현으로 대체. (실데이터 연동 시 client 분리 필요하면 후속.)
 */

type CategorySlug = "active_life" | "network" | "local_culture" | "tech";
type CategoryLabel = "라이프" | "네트워크" | "창작" | "테크";

const SLUG_TO_LABEL: Record<CategorySlug, CategoryLabel> = {
  active_life: "라이프",
  network: "네트워크",
  local_culture: "창작",
  tech: "테크",
};

type CategoryStyle = {
  accent: string;
  bgLight: string;
  bgDark: string;
  text: string;
  badgeBg: string;
};

const CATEGORY_STYLE: Record<CategoryLabel, CategoryStyle> = {
  라이프: {
    accent: "#C4956A",
    bgLight: "rgba(196,149,106,0.12)",
    bgDark: "rgba(196,149,106,0.20)",
    text: "#9B6020",
    badgeBg: "rgba(196,149,106,0.06)",
  },
  네트워크: {
    accent: "#6BAF8A",
    bgLight: "rgba(107,175,138,0.12)",
    bgDark: "rgba(107,175,138,0.20)",
    text: "#3A7A55",
    badgeBg: "rgba(107,175,138,0.06)",
  },
  창작: {
    accent: "#88AADD",
    bgLight: "rgba(136,170,221,0.14)",
    bgDark: "rgba(136,170,221,0.22)",
    text: "#2060C8",
    badgeBg: "rgba(136,170,221,0.08)",
  },
  테크: {
    accent: "#A080CC",
    bgLight: "rgba(160,128,204,0.14)",
    bgDark: "rgba(160,128,204,0.22)",
    text: "#5A3A88",
    badgeBg: "rgba(160,128,204,0.08)",
  },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ActivityRow = {
  id: string;
  user_id: string;
  body: string | null;
  photo_url: string | null;
  is_public: boolean;
  face_consent: boolean;
  created_at: string;
  type: string;
  episode: {
    id: string | null;
    title: string | null;
    seq: number | null;
    location: string | null;
    project: {
      id: string | null;
      title: string | null;
      slug: string | null;
      category: { slug: string | null; name: string | null } | null;
    } | null;
  } | null;
  project: {
    id: string | null;
    title: string | null;
    slug: string | null;
    category: { slug: string | null; name: string | null } | null;
  } | null;
  shop: {
    id: string | null;
    name: string | null;
    address: string | null;
  } | null;
};

type ReactionRow = {
  id: string;
  kind: string;
  body: string | null;
  author_role: string;
  author_label: string | null;
  author_user_id: string | null;
  author_shop_id: string | null;
  sent_at: string;
  visibility: string;
  shop: { id: string | null; name: string | null } | null;
  user: { id: string | null; nickname: string | null } | null;
};

export default async function CardDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const actor = await getCurrentActor();
  if (actor.role !== "participant") {
    redirect(`/login?next=/collection/${params.id}`);
  }

  if (!UUID_RE.test(params.id)) {
    notFound();
  }

  const supabase = createServerSupabase();

  const { data: activityRaw } = await supabase
    .from("activities")
    .select(
      `
      id, user_id, body, photo_url, is_public, face_consent, created_at, type,
      episode:episodes (
        id, title, seq, location,
        project:projects (
          id, title, slug,
          category:categories ( slug, name )
        )
      ),
      project:projects (
        id, title, slug,
        category:categories ( slug, name )
      ),
      shop:shops ( id, name, address )
    `
    )
    .eq("id", params.id)
    .is("removed_at", null)
    .maybeSingle();

  if (!activityRaw) {
    notFound();
  }
  const activity = activityRaw as unknown as ActivityRow;

  if (activity.user_id !== actor.userId) {
    // 본인이 아닌 카드 — 공개 카드라도 도감 상세는 본인만.
    notFound();
  }

  const { data: reactionsRaw } = await supabase
    .from("reactions")
    .select(
      `
      id, kind, body, author_role, author_label,
      author_user_id, author_shop_id, sent_at, visibility,
      shop:shops!reactions_author_shop_id_fkey ( id, name ),
      user:users!reactions_author_user_id_fkey ( id, nickname )
    `
    )
    .eq("activity_id", activity.id)
    .order("sent_at", { ascending: false });

  const reactions = (reactionsRaw ?? []) as unknown as ReactionRow[];
  const letters = reactions.filter((r) => r.kind === "letter");
  const hifives = reactions.filter(
    (r) => r.kind === "hi_five" || r.kind === "note"
  );

  const categorySlug =
    activity.episode?.project?.category?.slug ??
    activity.project?.category?.slug ??
    null;
  const categoryLabel: CategoryLabel | null =
    categorySlug && categorySlug in SLUG_TO_LABEL
      ? SLUG_TO_LABEL[categorySlug as CategorySlug]
      : null;
  const style = categoryLabel
    ? CATEGORY_STYLE[categoryLabel]
    : CATEGORY_STYLE["라이프"];

  const projectTitle =
    activity.episode?.project?.title ?? activity.project?.title ?? null;
  const projectSlug =
    activity.episode?.project?.slug ?? activity.project?.slug ?? null;
  const episodeBit =
    activity.episode?.seq != null
      ? `${activity.episode.seq}회차`
      : (activity.episode?.title ?? null);
  const place = activity.shop?.name ?? activity.episode?.location ?? null;
  const dateLabel = formatDate(activity.created_at);
  const noLabel = `No.${activity.id.slice(0, 4).toUpperCase()}`;

  return (
    <>
      <Breadcrumb categoryLabel={categoryLabel} noLabel={noLabel} />
      <CardLayout
        activity={activity}
        categoryLabel={categoryLabel}
        style={style}
        projectTitle={projectTitle}
        projectSlug={projectSlug}
        episodeBit={episodeBit}
        place={place}
        dateLabel={dateLabel}
        noLabel={noLabel}
        letters={letters}
        hifives={hifives}
      />
      <NoticeStrip />
    </>
  );
}

// ── helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function authorLabel(r: ReactionRow): string {
  if (r.author_role === "owner") {
    const name = r.shop?.name ?? r.author_label;
    return name ? `${name} 사장님` : "가게 사장님";
  }
  if (r.author_role === "crew") {
    return r.author_label ? `크루 · ${r.author_label}` : "크루";
  }
  if (r.author_role === "admin") {
    return r.author_label ?? "청풍 운영팀";
  }
  return r.user?.nickname ?? r.author_label ?? "익명";
}

function authorInitial(label: string): string {
  return (
    label
      .replace(/^[크크]루\s*·\s*/, "")
      .trim()
      .slice(0, 1) || "?"
  );
}

// ── presentation ────────────────────────────────────────────────

function Breadcrumb({
  categoryLabel,
  noLabel,
}: {
  categoryLabel: CategoryLabel | null;
  noLabel: string;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-[112px] lg:px-[60px]">
      <AnimateOnScroll>
        <div className="flex items-center gap-2 text-[12px] text-[#AEAEB2]">
          <Link
            href="/collection"
            className="transition-colors hover:text-v2-ink"
          >
            ← 내 도감
          </Link>
          <span className="text-[#D0D0D0]">/</span>
          <span>{categoryLabel ?? "—"}</span>
          <span className="text-[#D0D0D0]">/</span>
          <span className="font-medium text-v2-ink3">{noLabel}</span>
        </div>
      </AnimateOnScroll>
    </div>
  );
}

function CardLayout({
  activity,
  categoryLabel,
  style,
  projectTitle,
  projectSlug,
  episodeBit,
  place,
  dateLabel,
  noLabel,
  letters,
  hifives,
}: {
  activity: ActivityRow;
  categoryLabel: CategoryLabel | null;
  style: CategoryStyle;
  projectTitle: string | null;
  projectSlug: string | null;
  episodeBit: string | null;
  place: string | null;
  dateLabel: string;
  noLabel: string;
  letters: ReactionRow[];
  hifives: ReactionRow[];
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-9 lg:px-[60px]">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_360px] lg:gap-[60px]">
        <CardSection
          activity={activity}
          categoryLabel={categoryLabel}
          style={style}
          projectTitle={projectTitle}
          projectSlug={projectSlug}
          episodeBit={episodeBit}
          place={place}
          dateLabel={dateLabel}
          noLabel={noLabel}
        />
        <LetterSection letters={letters} hifives={hifives} />
      </div>
    </div>
  );
}

function CardSection({
  activity,
  categoryLabel,
  style,
  projectTitle,
  projectSlug,
  episodeBit,
  place,
  dateLabel,
  noLabel,
}: {
  activity: ActivityRow;
  categoryLabel: CategoryLabel | null;
  style: CategoryStyle;
  projectTitle: string | null;
  projectSlug: string | null;
  episodeBit: string | null;
  place: string | null;
  dateLabel: string;
  noLabel: string;
}) {
  return (
    <div>
      <AnimateOnScroll>
        <CardFront
          activity={activity}
          categoryLabel={categoryLabel}
          style={style}
          place={place}
          dateLabel={dateLabel}
          noLabel={noLabel}
        />
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.08}>
        <CardBack
          activity={activity}
          categoryLabel={categoryLabel}
          style={style}
          place={place}
          dateLabel={dateLabel}
        />
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.16}>
        <CardActionsClient
          activityId={activity.id}
          isPublic={activity.is_public}
          faceConsent={activity.face_consent}
        />
      </AnimateOnScroll>

      <AnimateOnScroll delay={0.24}>
        <MetaTable
          dateLabel={dateLabel}
          place={place}
          projectTitle={projectTitle}
          projectSlug={projectSlug}
          episodeBit={episodeBit}
          categoryLabel={categoryLabel}
        />
      </AnimateOnScroll>
    </div>
  );
}

function CardFront({
  activity,
  categoryLabel,
  style,
  place,
  dateLabel,
  noLabel,
}: {
  activity: ActivityRow;
  categoryLabel: CategoryLabel | null;
  style: CategoryStyle;
  place: string | null;
  dateLabel: string;
  noLabel: string;
}) {
  return (
    <div className="mb-4 max-w-[480px]">
      <div className="relative flex aspect-[3/2] flex-col overflow-hidden rounded-[20px] border border-black/[0.07] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
        <div className="flex items-center justify-between border-b border-[#F0F0EC] px-[22px] pb-3.5 pt-[18px]">
          <span className="text-[11px] font-semibold tracking-[2px] text-[#AEAEB2]">
            {noLabel}
          </span>
          {categoryLabel && (
            <span
              className="rounded px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.5px]"
              style={{ background: style.bgLight, color: style.text }}
            >
              {categoryLabel}
            </span>
          )}
        </div>
        {activity.photo_url ? (
          <div className="relative h-[52%] w-full overflow-hidden border-b border-[#F0F0EC] bg-[#F5F4F1]">
            <Image
              src={activity.photo_url}
              alt={activity.body || place || "도감 카드 사진"}
              fill
              sizes="(max-width: 640px) 90vw, 480px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
        <div className="flex flex-1 flex-col justify-between px-[22px] pb-[18px] pt-[22px]">
          <p className="text-[15px] leading-[1.8] text-v2-ink">
            {activity.body || "(메모 없음)"}
          </p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[11.5px] font-light text-[#AEAEB2]">
              {place ? `@ ${place}` : " "}
            </span>
            <span className="text-[11.5px] font-light text-[#AEAEB2]">
              {dateLabel}
            </span>
          </div>
        </div>
        <span
          className="absolute bottom-[18px] right-5 rotate-[10deg] rounded border-[1.5px] px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-[1.5px] opacity-70"
          style={{
            color: style.accent,
            borderColor: style.accent,
            background: style.badgeBg,
          }}
        >
          {activity.is_public ? "공개" : "비공개"}
        </span>
      </div>
    </div>
  );
}

function CardBack({
  activity,
  categoryLabel,
  style,
  place,
  dateLabel,
}: {
  activity: ActivityRow;
  categoryLabel: CategoryLabel | null;
  style: CategoryStyle;
  place: string | null;
  dateLabel: string;
}) {
  return (
    <div className="mb-7 max-w-[480px]">
      <p className="mb-2 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
        BACK · 뒷면
      </p>
      <div
        className="flex aspect-[3/2] flex-col overflow-hidden rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
        style={{ background: "#1A1A1A" }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-[22px] pb-3.5 pt-[18px]">
          <span className="text-[9.5px] font-semibold uppercase tracking-[2.5px] text-white/35">
            {categoryLabel ? `${categoryLabel} · BACK` : "BACK"}
          </span>
          {categoryLabel && (
            <span
              className="rounded px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.5px]"
              style={{ background: style.bgDark, color: style.accent }}
            >
              {categoryLabel}
            </span>
          )}
        </div>
        {activity.photo_url ? (
          <div className="relative h-[52%] w-full overflow-hidden border-b border-white/[0.08] bg-white/[0.04]">
            <Image
              src={activity.photo_url}
              alt=""
              fill
              sizes="(max-width: 640px) 90vw, 480px"
              className="object-cover opacity-80 grayscale-[20%]"
            />
          </div>
        ) : null}
        <div className="flex flex-1 flex-col justify-between px-[22px] pb-[18px] pt-[22px]">
          <p className="text-[15px] font-light italic leading-[1.8] text-white/85">
            {activity.body ? `“${activity.body}”` : "(메모가 없는 카드)"}
          </p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[11.5px] font-light text-white/30">
              {place ?? " "}
            </span>
            <span className="text-[11.5px] font-light text-white/30">
              {dateLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaTable({
  dateLabel,
  place,
  projectTitle,
  projectSlug,
  episodeBit,
  categoryLabel,
}: {
  dateLabel: string;
  place: string | null;
  projectTitle: string | null;
  projectSlug: string | null;
  episodeBit: string | null;
  categoryLabel: CategoryLabel | null;
}) {
  const projectVal = projectTitle
    ? episodeBit
      ? `${projectTitle} ${episodeBit}`
      : projectTitle
    : "—";

  const rows: { key: string; val: string; link?: string }[] = [
    { key: "DATE", val: dateLabel || "—" },
    { key: "PLACE", val: place ?? "—" },
    {
      key: "PROJECT",
      val: projectVal,
      link: projectSlug ? `/projects/${projectSlug}` : undefined,
    },
    { key: "CATEGORY", val: categoryLabel ?? "—" },
  ];

  return (
    <div className="mb-8 overflow-hidden rounded-[14px] border border-v2-rule bg-white">
      {rows.map((row, i) => (
        <div
          key={row.key}
          className={`grid grid-cols-[100px_1fr] items-center px-5 py-3.5 ${i < rows.length - 1 ? "border-b border-[#F0F0EC]" : ""}`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[2px] text-[#AEAEB2]">
            {row.key}
          </span>
          <span className="text-[13px] font-normal text-v2-ink">
            {row.link ? (
              <Link
                href={row.link}
                className="border-b border-[rgba(107,175,138,0.3)] text-[#6BAF8A] transition-colors hover:border-[#6BAF8A]"
              >
                {row.val}
              </Link>
            ) : (
              row.val
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function LetterSection({
  letters,
  hifives,
}: {
  letters: ReactionRow[];
  hifives: ReactionRow[];
}) {
  return (
    <div>
      <AnimateOnScroll>
        <p className="mb-4 text-[9.5px] font-semibold uppercase tracking-[3px] text-[#AEAEB2]">
          LETTER · 이 카드와 함께 받은 편지
        </p>
      </AnimateOnScroll>

      {letters.length === 0 ? (
        <AnimateOnScroll delay={0.08}>
          <EmptyLetters />
        </AnimateOnScroll>
      ) : (
        letters.map((letter, i) => (
          <AnimateOnScroll key={letter.id} delay={0.08 + i * 0.06}>
            <LetterCard letter={letter} />
          </AnimateOnScroll>
        ))
      )}

      <AnimateOnScroll delay={0.16 + letters.length * 0.06}>
        <HiFiveCard hifives={hifives} />
      </AnimateOnScroll>
    </div>
  );
}

function EmptyLetters() {
  return (
    <div className="rounded-2xl border border-dashed border-v2-rule bg-white/50 px-6 py-10 text-center">
      <p className="mb-1 text-[12.5px] font-semibold text-v2-ink">
        아직 받은 편지가 없어요.
      </p>
      <p className="text-[11.5px] font-light leading-[1.7] text-v2-ink3">
        가게 사장님과 크루의 응원이 도착하면 여기에 모입니다.
      </p>
    </div>
  );
}

function LetterCard({ letter }: { letter: ReactionRow }) {
  const label = authorLabel(letter);
  const initial = authorInitial(label);
  const dateLabel = formatDate(letter.sent_at);
  const isOwner = letter.author_role === "owner";
  const isCrew = letter.author_role === "crew";

  const bannerLabel = isOwner
    ? "💌 받은 편지 · 카카오 알림으로 도착"
    : isCrew
      ? "💌 크루의 편지"
      : "💌 받은 편지";

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-v2-rule bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3.5 border-b border-[#F0F0EC] px-6 pb-4 pt-5">
        <div
          className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #C4956A, #E8C49A)",
          }}
        >
          {initial}
        </div>
        <div>
          <p className="mb-0.5 text-[13px] font-semibold text-v2-ink">
            {label}
          </p>
          <p className="text-[11px] font-light text-[#AEAEB2]">{dateLabel}</p>
        </div>
      </div>
      <div className="px-6 pb-5 pt-[22px]">
        <p className="whitespace-pre-line text-[14px] font-light leading-[2] text-[#3A3A3A]">
          {letter.body || "(편지 내용이 비어있습니다)"}
        </p>
      </div>
      <div className="px-6 pb-5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10.5px] font-medium"
          style={{
            color: "#6BAF8A",
            borderColor: "rgba(107,175,138,0.2)",
            background: "rgba(107,175,138,0.08)",
          }}
        >
          {bannerLabel}
        </span>
      </div>
    </div>
  );
}

function HiFiveCard({ hifives }: { hifives: ReactionRow[] }) {
  return (
    <div className="mt-5 rounded-[14px] border border-v2-rule bg-white px-5 py-5">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-v2-ink">
          ★ 하이파이브
        </span>
        <span className="text-[11px] font-semibold text-[#C4956A]">
          {hifives.length}개
        </span>
      </div>

      {hifives.length === 0 ? (
        <p className="text-[12px] font-light leading-[1.7] text-v2-ink3">
          아직 하이파이브가 없어요.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {hifives.map((h) => {
            const label = authorLabel(h);
            return (
              <div key={h.id} className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#EDECEA] text-[11px] font-semibold text-[#888]">
                  {authorInitial(label)}
                </div>
                <div>
                  <p className="text-[11.5px] font-medium text-v2-ink">
                    {label}
                  </p>
                  {h.body && (
                    <p className="text-[12px] font-light leading-[1.65] text-v2-ink3">
                      {h.body}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10.5px] text-[#AEAEB2]">
                    {formatDate(h.sent_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NoticeStrip() {
  return (
    <div
      className="flex items-center justify-center px-6 py-5 lg:px-[60px]"
      style={{ background: "#1A1A1A" }}
    >
      <p className="text-center text-[12px] leading-[1.7] tracking-[0.5px] text-white/50">
        <strong className="font-medium text-white/80">
          카드는 기본 비공개입니다.
        </strong>
        &nbsp;공개로 설정한 카드만 피드에 노출되며, 언제든 변경할 수 있습니다.
      </p>
    </div>
  );
}
