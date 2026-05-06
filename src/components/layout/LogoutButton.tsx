"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CurrentActor } from "@/lib/auth/current-actor";

export function LogoutButton({
  actorRole,
}: {
  actorRole: CurrentActor["role"];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      if (actorRole === "owner") {
        await fetch("/api/auth/owner", { method: "DELETE" });
      } else if (actorRole === "crew") {
        await fetch("/api/auth/crew", { method: "DELETE" });
      } else {
        await fetch("/api/auth/logout", { method: "POST" });
      }
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="v2-legacy-button-muted disabled:opacity-60"
    >
      {loading ? "…" : "로그아웃"}
    </button>
  );
}
