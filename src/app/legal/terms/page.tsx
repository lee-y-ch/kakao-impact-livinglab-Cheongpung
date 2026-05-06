import Link from "next/link";

export const metadata = {
  title: "이용약관 — 강화유니버스",
};

const SECTIONS = [
  {
    title: "1. 목적",
    body: "이 약관은 강화유니버스 웹앱이 제공하는 참여 기록, 도감, 공개 피드, 프로젝트 안내 기능의 이용 조건과 절차를 정합니다.",
  },
  {
    title: "2. 이용 범위",
    body: "사용자는 QR 진입, 카드 작성, 본인 도감 열람, 공개 카드 조회 등 서비스가 제공하는 범위 안에서 웹앱을 이용할 수 있습니다.",
  },
  {
    title: "3. 참여 기록",
    body: "사용자가 작성한 카드와 사진은 기본 비공개로 저장되며, 공개 설정한 항목만 공개 피드와 프로젝트 화면에 노출될 수 있습니다.",
  },
  {
    title: "4. 금지 행위",
    body: "타인의 권리를 침해하는 내용, 허위 정보, 부적절한 사진, 서비스 운영을 방해하는 행위는 제한될 수 있습니다.",
  },
  {
    title: "5. 운영 조치",
    body: "운영자는 신고, 공개 검수, 법령 준수 필요가 있을 때 카드의 공개 상태를 변경하거나 노출을 제한할 수 있습니다.",
  },
  {
    title: "6. 약관 변경",
    body: "약관이 변경될 경우 서비스 화면 또는 별도 안내 수단을 통해 변경 내용을 고지합니다.",
  },
];

export default function TermsPage() {
  return (
    <LegalPage title="이용약관" updatedAt="2026.05.06" sections={SECTIONS} />
  );
}

function LegalPage({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <main className="mx-auto max-w-[900px] px-6 pb-24 pt-[140px] lg:px-[60px]">
      <div className="mb-10 border-b border-v2-rule pb-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[3px] text-v2-brand">
          Ganghwa Universe Legal
        </p>
        <h1 className="text-[34px] font-bold tracking-[-1px] text-v2-ink">
          {title}
        </h1>
        <p className="mt-3 text-[13px] text-v2-ink4">시행일 {updatedAt}</p>
      </div>
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-[18px] font-semibold text-v2-ink">
              {section.title}
            </h2>
            <p className="text-[15px] font-light leading-[1.9] text-v2-ink2">
              {section.body}
            </p>
          </section>
        ))}
      </div>
      <div className="mt-12">
        <Link
          href="/"
          className="inline-flex border-b border-v2-brand pb-1 text-[14px] font-medium text-v2-brand"
        >
          메인으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
