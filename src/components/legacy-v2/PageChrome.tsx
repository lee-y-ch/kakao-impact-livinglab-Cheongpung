import Link from "next/link";

export function LegacyPage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <main className={`v2-legacy-page ${className}`}>{children}</main>;
}

export function LegacyContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`v2-legacy-container ${className}`}>{children}</div>;
}

export function LegacyHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="v2-legacy-hero">
      {backHref && backLabel ? (
        <Link href={backHref} className="mb-5 inline-flex text-sm text-v2-ink3">
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[720px]">
          <p className="v2-legacy-kicker mb-3">{eyebrow}</p>
          <h1 className="v2-legacy-title">{title}</h1>
          {description ? (
            <p className="v2-legacy-copy mt-4 max-w-[640px]">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function LegacyPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`v2-legacy-panel p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function LegacyStatRow({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="v2-legacy-panel-soft p-4">
          <p className="v2-legacy-kicker mb-2 !text-[10px] !tracking-[0.12em]">
            {item.label}
          </p>
          <p className="text-[1.65rem] font-semibold tracking-[-0.04em] text-v2-ink">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
