"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OwnerLoginForm() {
  const router = useRouter();
  const [shopSlug, setShopSlug] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLockedUntil(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/owner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shopSlug: shopSlug.trim(), code: code.trim() }),
      });
      if (res.ok) {
        router.replace("/owner");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        until?: string;
      };
      if (res.status === 423 && data.until) {
        setLockedUntil(data.until);
      } else if (data.error === "invalid_input") {
        setError("입력값을 다시 확인해 주세요.");
      } else {
        setError("가게 주소 또는 코드가 올바르지 않습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">가게 주소 (영문/숫자)</span>
        <input
          type="text"
          inputMode="text"
          autoComplete="username"
          value={shopSlug}
          onChange={(e) => setShopSlug(e.target.value)}
          className="v2-legacy-input text-base"
          placeholder="예: sunset-cafe"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">가게 코드</span>
        <div className="relative">
          <input
            type={showCode ? "text" : "password"}
            inputMode="text"
            autoComplete="current-password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="v2-legacy-input pr-12 text-base tracking-widest"
            placeholder="8자리"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-v2-ink3 transition-colors hover:bg-black/[0.04] hover:text-v2-ink"
            aria-label={showCode ? "가게 코드 숨기기" : "가게 코드 보기"}
            title={showCode ? "가게 코드 숨기기" : "가게 코드 보기"}
          >
            {showCode ? (
              <EyeOff size={17} strokeWidth={1.8} aria-hidden />
            ) : (
              <Eye size={17} strokeWidth={1.8} aria-hidden />
            )}
          </button>
        </div>
      </label>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {lockedUntil ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          여러 번 실패해 잠시 로그인이 잠겼습니다.
          <br />
          {new Date(lockedUntil).toLocaleString("ko-KR")} 이후 다시 시도해
          주세요.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="v2-legacy-button mt-2 w-full text-base"
      >
        {loading ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
