"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type OwnerRow = {
  id: string;
  name: string;
  created_at: string;
  last_login_at: string | null;
  locked_until: string | null;
};

type Props = {
  shopId: string;
  owners: OwnerRow[];
};

/**
 * 가게 편집 화면의 사장님 코드 관리.
 *
 * - 새 사장님 이름 입력 → 서버가 8자리 코드 발급 (응답에만 평문 포함)
 * - 기존 사장님: 코드 재발급 / 삭제
 * - 재발급/신규 발급된 코드는 UI 에서 한 번만 보여주고 클립보드 복사 제공
 */
export function OwnerCodeSection({ shopId, owners }: Props) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [issuedCode, setIssuedCode] = useState<{
    code: string;
    ownerName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleIssue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (issuing) return;
    const name = newName.trim();
    if (name.length === 0) {
      setError("사장님 이름을 입력해주세요.");
      return;
    }
    setIssuing(true);
    setError(null);

    const res = await fetch(`/api/admin/shops/${shopId}/owners`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const errPayload = await res.json().catch(() => null);
      setError(
        (errPayload &&
          typeof errPayload.message === "string" &&
          errPayload.message) ||
          "발급에 실패했어요."
      );
      setIssuing(false);
      return;
    }

    const payload = (await res.json()) as { code: string };
    setIssuedCode({ code: payload.code, ownerName: name });
    setNewName("");
    setIssuing(false);
    router.refresh();
  }

  async function handleReissue(ownerId: string, ownerName: string) {
    if (
      !window.confirm(
        `${ownerName} 의 로그인 코드를 재발급할까요? 기존 코드는 즉시 사용 불가 상태가 됩니다.`
      )
    )
      return;
    const res = await fetch(`/api/admin/shop-owners/${ownerId}`, {
      method: "POST",
    });
    if (!res.ok) {
      setError("재발급에 실패했어요.");
      return;
    }
    const payload = (await res.json()) as { code: string };
    setIssuedCode({ code: payload.code, ownerName });
    router.refresh();
  }

  async function handleDelete(ownerId: string, ownerName: string) {
    if (!window.confirm(`${ownerName} 계정을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/shop-owners/${ownerId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("삭제에 실패했어요.");
      return;
    }
    router.refresh();
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore — 시연 환경에서 실패해도 화면에 표시는 유지
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {issuedCode ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-400 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <p className="font-medium">
            {issuedCode.ownerName} 님의 로그인 코드가 발급됐어요.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <code className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 font-mono text-base tracking-[0.2em]">
              {issuedCode.code}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(issuedCode.code)}
              className="text-xs font-medium underline underline-offset-4"
            >
              복사
            </button>
            <button
              type="button"
              onClick={() => setIssuedCode(null)}
              className="ml-auto text-xs text-emerald-700/80 underline underline-offset-4"
            >
              닫기
            </button>
          </div>
          <p className="mt-2 text-xs text-emerald-700/80">
            이 코드는 이 화면을 벗어나면 다시 볼 수 없어요. 사장님께 직접 전달
            후 닫아주세요.
          </p>
        </div>
      ) : null}

      <form
        onSubmit={handleIssue}
        className="v2-legacy-panel flex flex-col gap-3 p-4"
      >
        <h3 className="text-sm font-semibold">새 사장님 추가 + 코드 발급</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">사장님 이름</span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예) 김사장"
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={issuing}
            className="v2-legacy-button h-[44px] shrink-0"
          >
            {issuing ? "발급 중..." : "코드 발급"}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">
          등록된 사장님 ({owners.length})
        </h3>
        {owners.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
            아직 등록된 사장님이 없어요.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
            {owners.map((o) => {
              const isLocked = o.locked_until
                ? new Date(o.locked_until).getTime() > Date.now()
                : false;
              return (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium">{o.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {o.last_login_at
                        ? `최근 로그인 ${new Date(o.last_login_at).toLocaleString("ko-KR")}`
                        : "아직 로그인 기록 없음"}
                      {isLocked ? " · 계정 잠금 중" : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleReissue(o.id, o.name)}
                      className="font-medium underline underline-offset-4"
                    >
                      코드 재발급
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(o.id, o.name)}
                      className="font-medium text-destructive underline underline-offset-4"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

const inputClass = "v2-legacy-input text-sm";
