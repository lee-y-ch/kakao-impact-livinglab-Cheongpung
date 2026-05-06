import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 — 강화유니버스",
};

const SECTIONS = [
  {
    title: "1. 수집하는 정보",
    body: "서비스는 로그인 식별 정보, 닉네임, 프로필 이미지, 카드 작성 내용, 사진, 공개 여부, 반응 기록, 접속 로그를 처리할 수 있습니다.",
  },
  {
    title: "2. 이용 목적",
    body: "수집한 정보는 참여자 인증, 카드 발급, 본인 도감 제공, 공개 피드 운영, 신고 및 검수, 서비스 안정성 확보에 사용됩니다.",
  },
  {
    title: "3. 공개 범위",
    body: "카드는 기본 비공개이며 사용자가 공개로 설정한 카드만 공개 화면에 노출됩니다. 비공개 카드는 본인과 필요한 운영 권한자만 접근합니다.",
  },
  {
    title: "4. 보관 및 파기",
    body: "정보는 서비스 제공에 필요한 기간 동안 보관하며, 삭제 요청 또는 보관 목적 종료 시 운영 정책과 관계 법령에 따라 파기합니다.",
  },
  {
    title: "5. 제3자 제공",
    body: "법령상 의무가 있거나 사용자의 별도 동의가 있는 경우를 제외하고 개인정보를 외부에 제공하지 않습니다.",
  },
  {
    title: "6. 문의",
    body: "개인정보 관련 문의와 삭제 요청은 운영진 문의 채널을 통해 접수할 수 있습니다.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="개인정보처리방침"
      updatedAt="2026.05.06"
      sections={SECTIONS}
    />
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
