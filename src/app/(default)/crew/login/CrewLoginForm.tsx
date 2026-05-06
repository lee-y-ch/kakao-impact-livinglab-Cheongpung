"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CrewLoginForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/crew", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (res.ok) {
        router.replace("/crew");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 503) {
        setError(
          "지금은 크루 로그인이 비활성화되어 있습니다. 청풍에 문의해 주세요."
        );
      } else if (data.error === "invalid_input") {
        setError("코드를 다시 확인해 주세요.");
      } else {
        setError("코드가 올바르지 않습니다.");
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
        <span className="font-medium">크루 공용 코드</span>
        <input
          type="password"
          inputMode="text"
          autoComplete="current-password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="v2-legacy-input text-base tracking-widest"
          placeholder="청풍이 전달한 코드"
          required
          minLength={6}
        />
      </label>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
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
