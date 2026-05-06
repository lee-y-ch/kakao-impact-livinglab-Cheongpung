"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * 개발 환경 전용 로그인 버튼 (카카오 OAuth 비즈 앱 전환 전 임시).
 * dev 빌드에서만 렌더 — 프로덕션 번들에는 버튼 자체가 나오지 않는다.
 */
export function DevLoginButton({ next }: { next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/dev/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(
        (payload && typeof payload.message === "string" && payload.message) ||
          "개발용 로그인에 실패했습니다."
      );
      setLoading(false);
      return;
    }

    router.replace(next ?? "/collection");
    router.refresh();
  }

  return (
    <div className="v2-legacy-panel-soft flex w-full flex-col gap-3 border-dashed border-amber-300 bg-amber-50/80 px-4 py-4 text-center text-sm text-amber-900">
      <span className="font-semibold">[DEV 전용] 테스트 로그인</span>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="v2-legacy-button !bg-amber-500 !py-3 text-sm hover:!bg-amber-600"
      >
        {loading ? "로그인 중..." : "개발용 참여자 계정으로 로그인"}
      </button>
      <span className="text-xs text-amber-900/80">
        카카오 비즈 앱 전환되면 이 버튼은 사라집니다.
      </span>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
