"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OwnerLoginForm() {
  const router = useRouter();
  const [shopSlug, setShopSlug] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          className="rounded-md border border-input px-3 py-2 text-base"
          placeholder="예: sunset-cafe"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">가게 코드</span>
        <input
          type="password"
          inputMode="text"
          autoComplete="current-password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-md border border-input px-3 py-2 text-base tracking-widest"
          placeholder="8자리"
          required
          minLength={8}
        />
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
        className="mt-2 rounded-md bg-[#1e3a8a] px-4 py-3 text-base font-medium text-white transition hover:brightness-105 disabled:opacity-60"
      >
        {loading ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
