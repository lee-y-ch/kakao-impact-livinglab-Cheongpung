"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function KakaoLoginButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo = new URL("/auth/callback", origin);
    if (next) redirectTo.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: redirectTo.toString(),
        // 카카오 비즈 앱이 아니므로 account_email 권한이 없음.
        // Supabase 기본 scope (account_email 포함) 를 덮어써서 KOE205 회피.
        scopes: "profile_nickname profile_image",
      },
    });

    if (error) {
      console.error("kakao oauth error", error);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-5 py-3 text-base font-medium text-[#3C1E1E] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <KakaoIcon />
      <span>{loading ? "카카오로 이동 중…" : "카카오로 로그인"}</span>
    </button>
  );
}

function KakaoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 1.5C4.857 1.5 1.5 4.14 1.5 7.4c0 2.124 1.44 3.987 3.6 5.022-.158.53-.573 1.926-.657 2.222-.102.367.136.361.286.264.117-.076 1.857-1.26 2.604-1.77.54.077 1.1.117 1.667.117 4.143 0 7.5-2.64 7.5-5.854C16.5 4.14 13.143 1.5 9 1.5z"
        fill="currentColor"
      />
    </svg>
  );
}
