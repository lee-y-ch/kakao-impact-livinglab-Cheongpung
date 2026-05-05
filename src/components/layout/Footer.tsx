import Link from "next/link";

/**
 * v2 redesign — dark multi-column footer.
 * 시안의 footer.dark 멀티컬럼. 모든 페이지 공통.
 */
export function Footer() {
  return (
    <footer className="bg-v2-footer px-6 pb-12 pt-16 lg:px-[60px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-10 border-b border-white/[0.08] pb-12 lg:flex-row lg:items-start lg:justify-between lg:gap-0">
          <div>
            <p className="text-[17px] font-bold tracking-[-0.5px] text-white/85">
              강화유니버스
            </p>
            <p className="mt-3 text-[12px] font-light leading-[1.8] text-white/30">
              환대로 만들어가는 세계,
              <br />
              우리가 살고 싶은 세계를 실험합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-9 gap-y-10 lg:gap-x-[60px]">
            <FooterCol
              title="강화유니버스"
              items={["소개", "잠시섬", "2026 프로젝트", "활동 프로그램"]}
            />
            <FooterCol
              title="프로젝트"
              items={[
                "액티브 라이프",
                "로컬 문화 공동 창작",
                "글로벌 네트워크",
                "테크 & 솔루션",
              ]}
            />
            <FooterCol title="참여" items={["참여하기", "FAQ", "문의하기"]} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 pt-8 text-center lg:flex-row lg:justify-between lg:text-left">
          <p className="text-[12px] text-white/20">
            © 2026 Ganghwa Universe. All rights reserved.
          </p>
          <div className="flex gap-2">
            <FooterTag>이용약관</FooterTag>
            <FooterTag>개인정보처리방침</FooterTag>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-[18px] text-[11px] font-semibold uppercase tracking-[2.5px] text-white/35">
        {title}
      </h4>
      <ul className="space-y-0">
        {items.map((it) => (
          <li
            key={it}
            className="cursor-pointer text-[13.5px] font-light leading-[2.2] text-white/55 transition-colors hover:text-white/90"
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="cursor-pointer rounded border border-white/10 px-3 py-1 text-[11px] text-white/25 transition-colors hover:border-white/25 hover:text-white/60">
      {children}
    </span>
  );
}
